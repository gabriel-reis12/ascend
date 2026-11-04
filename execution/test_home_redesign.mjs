import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('ASCEND Etapa 03.3 — Redesign & Refinamento Mobile/Desktop: Home do Caçador (QuickMenu.tsx)', () => {
  const quickMenu = fs.readFileSync('src/pages/QuickMenu.tsx', 'utf-8');
  const rpgLayout = fs.readFileSync('src/components/layout/RPGLayout.tsx', 'utf-8');
  const neonProgress = fs.readFileSync('src/components/ui/neon-progress.tsx', 'utf-8');

  it('Deve utilizar todos os componentes oficiais do ASCEND HUD v2', () => {
    const requiredComponents = [
      'HudCard',
      'TacticalButton',
      'NeonProgressBar',
      'NeonProgressRing',
      'RankBadge',
    ];
    for (const comp of requiredComponents) {
      assert.ok(
        quickMenu.includes(`<${comp}`),
        `Componente HUD v2 <${comp}> não encontrado em src/pages/QuickMenu.tsx`
      );
    }
  });

  it('Deve consumir dados reais do jogador (useHunterStore, useBossStore, useHabits, useTasks) sem valores fictícios fixos do mockup', () => {
    assert.ok(quickMenu.includes('useHunterStore'), 'useHunterStore ausente');
    assert.ok(quickMenu.includes('useBossStore'), 'useBossStore ausente');
    assert.ok(quickMenu.includes('useHabits'), 'useHabits ausente');
    assert.ok(quickMenu.includes('useTasks'), 'useTasks ausente');

    assert.ok(quickMenu.includes('state.level'), 'Nível real state.level ausente');
    assert.ok(quickMenu.includes('state.rank'), 'Rank real state.rank ausente');
    assert.ok(quickMenu.includes('state.xp'), 'XP real state.xp ausente');
    assert.ok(quickMenu.includes('state.xpRequired'), 'Meta de XP state.xpRequired ausente');
    assert.ok(quickMenu.includes('dailyStats.progress'), 'Progresso diário dinâmico ausente');
  });

  it('Deve exibir o Rank apenas uma vez (dentro do hexágono RankBadge com showLabel={false}) e manter somente o rótulo externo RANK', () => {
    assert.ok(
      quickMenu.includes('<RankBadge rank={state.rank || \'E\'} size="md" showLabel={false} />'),
      'RankBadge deve usar showLabel={false} para exibir apenas a letra do rank dentro do hexágono'
    );
    assert.ok(
      !quickMenu.includes('>{state.rank || \'E\'}</span>'),
      'Letra do rank não deve ser duplicada como texto solto fora do RankBadge'
    );
  });

  it('Deve centralizar perfeitamente o conteúdo do NeonProgressRing (leading-none + whitespace-nowrap + raio interno otimizado)', () => {
    assert.ok(
      quickMenu.includes('whitespace-nowrap text-slate-300 tabular-nums'),
      'Texto secundário do anel de progresso deve usar whitespace-nowrap e leading-none para não quebrar dentro do círculo'
    );
    assert.ok(
      neonProgress.includes('outerRadius = center - strokeWidth / 2 - 2.5'),
      'NeonProgressRing deve utilizar geometria de raio otimizada para ampliar a área livre central'
    );
  });

  it('Deve resolver dinamicamente a arte otimizada real da classe e rank do caçador no Hero com fallback seguro', () => {
    assert.ok(
      quickMenu.includes('/optimized/Classes/${safeClass}/Rank ${imageRank}.jpg'),
      'Resolução dinâmica de arte de classe/rank ausente'
    );
    assert.ok(
      quickMenu.includes("'/optimized/Classes/Warrior/Rank E.jpg'"),
      'Fallback de avatar seguro ausente'
    );
    for (const cls of ['Warrior', 'Scholar', 'Creator', 'Monk', 'Leader', 'Titan']) {
      assert.ok(
        fs.existsSync(`public/optimized/Classes/${cls}/Rank E.jpg`),
        `Asset otimizado ausente para a classe ${cls}`
      );
    }
  });

  it('Deve remover completamente as imagens de fundo dos 4 cards inferiores (System Modules) e usar layout tecnológico minimalista', () => {
    assert.ok(
      !quickMenu.includes('/optimized/Cards/'),
      'Imagens de fundo antigas (/optimized/Cards/) ainda presentes nos módulos inferiores de QuickMenu.tsx'
    );
    assert.ok(
      quickMenu.includes('contentClassName="flex h-full flex-col justify-between gap-3.5"'),
      'Distribuição vertical equilibrada (justify-between) ausente no painel Hunter Status'
    );
  });

  it('Deve oferecer Ações Rápidas para Missões (/quests), Treinos (/workouts) e Alimentação (/nutrition) e preservar Módulos Secundários (/bosses, /fortuna, /rest, /status)', () => {
    const requiredRoutes = [
      "'/quests'",
      "'/workouts'",
      "'/nutrition'",
      "'/bosses'",
      "'/fortuna'",
      "'/rest'",
      "'/status'",
    ];
    for (const route of requiredRoutes) {
      assert.ok(
        quickMenu.includes(route),
        `Rota ${route} não encontrada em src/pages/QuickMenu.tsx`
      );
    }
  });

  it('Deve preservar todas as âncoras do ProductTour e respeitar prefers-reduced-motion', () => {
    const tourIds = [
      'tour-portal-header',
      'tour-portal-recommended',
      'tour-portal-primary',
      'tour-portal-secondary',
      'tour-shortcut-workouts',
      'tour-shortcut-nutrition',
    ];
    for (const id of tourIds) {
      assert.ok(
        quickMenu.includes(id),
        `Âncora obrigatória do ProductTour ausente: ${id}`
      );
    }
    assert.ok(quickMenu.includes('<ProductTour />'), '<ProductTour /> não renderizado');
    assert.ok(quickMenu.includes('useReducedMotion'), 'useReducedMotion() não utilizado');
  });

  it('Deve evitar duplicação desnecessária de Nível/XP no cabeçalho global mobile quando na Home (/)', () => {
    assert.ok(
      rpgLayout.includes("location.pathname !== '/'"),
      'RPGLayout deve ocultar o mini indicador de Nível/XP duplicado na rota Home (/)'
    );
  });
});
