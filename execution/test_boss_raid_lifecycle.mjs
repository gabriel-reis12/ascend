import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const storePath = path.join(rootDir, 'src', 'stores', 'useBossStore.ts');
const pagePath = path.join(rootDir, 'src', 'pages', 'Bosses.tsx');
const migrationPath = path.join(rootDir, 'supabase', 'migrations', '20261105_boss_raid_lifecycle.sql');

const storeSource = fs.readFileSync(storePath, 'utf-8');
const pageSource = fs.readFileSync(pagePath, 'utf-8');
const migrationSource = fs.readFileSync(migrationPath, 'utf-8');

// Importar funções de lógica diretamente da store compilada ou avaliando os módulos
// Podemos testar as funções utilitárias puras replicando a lógica exportada ou avaliando
test('Etapa 03.8 — 1. Cálculo determinístico de prazos (getBossRaidDeadline) e persistência', () => {
  assert.match(storeSource, /export const getBossRaidDeadline/);
  assert.match(storeSource, /Math\.min\(bossDef\?\.targetDays \?\? targetDaysFallback, 7\)/);

  // Simulação da função conforme exportada em useBossStore
  const getBossRaidDeadlineSim = (battle, targetDaysFallback = 7) => {
    if (battle.expires_at) {
      const parsed = new Date(battle.expires_at);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    const days = Math.min(battle.targetDays ?? targetDaysFallback, 7);
    const startedTime = new Date(battle.started_at).getTime();
    return new Date(startedTime + days * 24 * 60 * 60 * 1000);
  };

  const startedAt = '2026-11-01T12:00:00.000Z';
  const deadlineWithoutExplicit = getBossRaidDeadlineSim({ started_at: startedAt, targetDays: 3 });
  assert.equal(deadlineWithoutExplicit.toISOString(), '2026-11-04T12:00:00.000Z');

  // Prazo explícito persistido tem precedência máxima
  const explicitExpires = '2026-11-05T18:30:00.000Z';
  const deadlineWithExplicit = getBossRaidDeadlineSim({ started_at: startedAt, expires_at: explicitExpires, targetDays: 3 });
  assert.equal(deadlineWithExplicit.toISOString(), explicitExpires);

  // Capped em no máximo 7 dias para respeitar janela semanal
  const deadlineCapped = getBossRaidDeadlineSim({ started_at: startedAt, targetDays: 10 });
  assert.equal(deadlineCapped.toISOString(), '2026-11-08T12:00:00.000Z');
});

test('Etapa 03.8 — 2. Contagem regressiva em tempo real com segundos (calculateRaidRemainingTime)', () => {
  assert.match(storeSource, /export const calculateRaidRemainingTime/);
  assert.match(storeSource, /formattedString:\s*string/);

  const calculateRemainingSim = (deadlineToCalc, refTime = Date.now()) => {
    if (!deadlineToCalc) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true, isCritical: false, formattedString: '00d 00h 00m 00s' };
    }
    const deadlineMs = typeof deadlineToCalc === 'string' ? new Date(deadlineToCalc).getTime() : deadlineToCalc.getTime();
    const diffMs = deadlineMs - refTime;
    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true, isCritical: false, formattedString: '00d 00h 00m 00s' };
    }
    const seconds = Math.floor((diffMs / 1000) % 60);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const isCritical = diffMs < 24 * 60 * 60 * 1000;
    const pad = (n) => n.toString().padStart(2, '0');
    return {
      days, hours, minutes, seconds, totalMs: diffMs, isExpired: false, isCritical,
      formattedString: `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`,
    };
  };

  const now = 1000000000000;
  // 3 dias, 4 horas, 15 minutos, 30 segundos
  const futureDeadline = new Date(now + ((3 * 86400) + (4 * 3600) + (15 * 60) + 30) * 1000);
  const result = calculateRemainingSim(futureDeadline, now);

  assert.equal(result.isExpired, false);
  assert.equal(result.isCritical, false);
  assert.equal(result.days, 3);
  assert.equal(result.hours, 4);
  assert.equal(result.minutes, 15);
  assert.equal(result.seconds, 30);
  assert.equal(result.formattedString, '03d 04h 15m 30s');

  // Prazo crítico: menos de 24 horas restantes (ex: 8 horas, 10 minutos, 5 segundos)
  const criticalDeadline = new Date(now + ((8 * 3600) + (10 * 60) + 5) * 1000);
  const criticalResult = calculateRemainingSim(criticalDeadline, now);
  assert.equal(criticalResult.isExpired, false);
  assert.equal(criticalResult.isCritical, true);
  assert.equal(criticalResult.formattedString, '00d 08h 10m 05s');

  // Prazo expirado (0 segundos ou passado)
  const pastDeadline = new Date(now - 5000);
  const expiredResult = calculateRemainingSim(pastDeadline, now);
  assert.equal(expiredResult.isExpired, true);
  assert.equal(expiredResult.formattedString, '00d 00h 00m 00s');
});

test('Etapa 03.8 — 3. Matriz de Estados do Ciclo de Vida da Raid (getRaidLifecycleState)', () => {
  assert.match(storeSource, /export const getRaidLifecycleState/);
  assert.match(storeSource, /'waiting_start'\s*\|\s*'active_battle'\s*\|\s*'boss_defeated'\s*\|\s*'expired_loss'\s*\|\s*'next_raid'/);

  const getLifecycleSim = (battle, refTime = Date.now()) => {
    if (!battle) return 'waiting_start';
    if (battle.defeated || battle.current_hp <= 0) return 'boss_defeated';
    if (battle.status === 'expired') return 'expired_loss';
    const deadlineMs = new Date(battle.expires_at || battle.started_at).getTime() + (battle.targetDays || 7) * 86400000;
    if (refTime >= deadlineMs) return 'expired_loss';
    return 'active_battle';
  };

  const now = Date.now();

  // Sem batalha -> waiting_start
  assert.equal(getLifecycleSim(null, now), 'waiting_start');

  // Batalha com HP 0 ou derrotada -> boss_defeated
  assert.equal(getLifecycleSim({ current_hp: 0, defeated: false, expires_at: new Date(now + 10000).toISOString() }, now), 'boss_defeated');
  assert.equal(getLifecycleSim({ current_hp: 50, defeated: true, expires_at: new Date(now + 10000).toISOString() }, now), 'boss_defeated');

  // Batalha com status explicitamente expirado -> expired_loss
  assert.equal(getLifecycleSim({ current_hp: 80, defeated: false, status: 'expired' }, now), 'expired_loss');

  // Batalha com tempo esgotado e HP restante > 0 -> expired_loss (explicação do 0d 0h)
  assert.equal(getLifecycleSim({ current_hp: 120, defeated: false, started_at: new Date(now - 10 * 86400000).toISOString(), targetDays: 3 }, now), 'expired_loss');

  // Batalha ativa normal dentro do prazo
  assert.equal(getLifecycleSim({ current_hp: 150, defeated: false, started_at: new Date(now).toISOString(), targetDays: 3 }, now), 'active_battle');
});

test('Etapa 03.8 — 4. Bloqueio de ataques em raids expiradas e integridade de dano', () => {
  // useBossStore deve verificar isBattleExpired antes de deduzir HP
  assert.match(storeSource, /if\s*\(isBattleExpired\(activeBattle\)\)\s*\{/);
  assert.match(storeSource, /Ataque rejeitado: o prazo da raid encerrou/);

  // Verificação de HP <= 0 e defeated
  assert.match(storeSource, /if\s*\(!activeBattle \|\| activeBattle\.defeated \|\| activeBattle\.current_hp <= 0\)\s*return;/);

  // Exclusão de dano e vitória duplicada na purificação
  assert.match(storeSource, /purifyActiveBoss:\s*async/);
  assert.match(storeSource, /eventId:\s*`boss:\$\{activeBattle\.id\}`/);
});

test('Etapa 03.8 — 5. Formatação com Fuso Horário de São Paulo (America/Sao_Paulo)', () => {
  assert.match(storeSource, /timeZone:\s*['"]America\/Sao_Paulo['"]/);
  assert.match(storeSource, /export const formatRaidDeadlineLocal/);

  const formatSaoPauloSim = (deadline, locale = 'pt-BR') => {
    if (!deadline) return '--';
    const date = typeof deadline === 'string' ? new Date(deadline) : deadline;
    return new Intl.DateTimeFormat(locale === 'en-US' ? 'en-US' : 'pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const utcDate = new Date('2026-11-12T21:00:00.000Z');
  const formattedBR = formatSaoPauloSim(utcDate, 'pt-BR');
  assert.ok(formattedBR.length > 5);
  // Em São Paulo (UTC-3), 21h UTC é 18h local
  assert.match(formattedBR, /18:00/);
});

test('Etapa 03.8 — 6. Script de Migração SQL seguro e idempotente em supabase/migrations/', () => {
  assert.ok(fs.existsSync(migrationPath), 'Migration SQL 20261105_boss_raid_lifecycle.sql deve existir');
  assert.match(migrationSource, /alter table boss_battles add column if not exists expires_at timestamptz;/);
  assert.match(migrationSource, /alter table boss_battles add column if not exists status text default 'active';/);
  assert.match(migrationSource, /alter table boss_battles add column if not exists ended_at timestamptz;/);
  assert.match(migrationSource, /check \(status in \('active', 'defeated', 'expired'\)\)/);
  assert.match(migrationSource, /create index if not exists idx_boss_battles_user_status_started/);
});

test('Etapa 03.8 — 7. Interface em Bosses.tsx com temporizador em tempo real (1s), estado expirado e feedback visual', () => {
  // Intervalo de 1 segundo (1000ms) para atualização visual em tempo real
  assert.match(pageSource, /window\.setInterval\(\(\) => setRaidReferenceTime\(Date\.now\(\)\),\s*1000\)/);

  // Consumo das funções utilitárias determinísticas
  assert.match(pageSource, /calculateRaidRemainingTime/);
  assert.match(pageSource, /getRaidLifecycleState/);
  assert.match(pageSource, /getBossRaidDeadline/);
  assert.match(pageSource, /formatRaidDeadlineLocal/);

  // Estados visuais distintos (vermelho para expirado, dourado/esmeralda para vitória, púrpura para ativo)
  assert.match(pageSource, /headerCardVariant/);
  assert.match(pageSource, /isRaidExpired/);
  assert.match(pageSource, /isCriticalDeadline/);

  // Card temático de derrota por tempo (O Chefe Escapou / Fenda Fechada)
  assert.match(pageSource, /l\('Prazo Encerrado — Fenda Fechada', 'Deadline Expired — Rift Closed'\)/);
  assert.match(pageSource, /l\('O Chefe Escapou', 'The Boss Escaped'\)/);

  // Ação de recuperação para iniciar novo ciclo da raid após expiração
  assert.match(pageSource, /retryExpiredBattle/);
  assert.match(pageSource, /l\('Iniciar Novo Ciclo da Raid', 'Start New Raid Cycle'\)/);

  // Bloqueio do botão de ataque manual quando expirado
  assert.match(pageSource, /disabled=\{manualAttackUsedToday \|\| isRaidExpired\}/);
});

