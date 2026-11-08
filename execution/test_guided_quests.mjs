import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Import local TypeScript-compiled or raw functions from guidedQuests
// Note: In Node ESM, we can read src/lib/guidedQuests.ts and evaluate or test the deterministic logic
import {
  detectGuidedActivity,
  isGuidedEligible,
  calculateRemainingSeconds,
  formatTimeMMSS,
  GUIDED_ACTIVITY_PRESETS,
} from '../src/lib/guidedQuests.ts';

test('1. Detecção determinística de atividades baseadas em repetições (Reps Mode)', () => {
  const pushUps = detectGuidedActivity('20 Flexões de Braço', 'Treino');
  assert.equal(pushUps.mode, 'reps', 'Flexões devem ser detectadas como reps');
  assert.equal(pushUps.targetUnit, 'reps');
  assert.equal(pushUps.defaultTarget, 20);
  assert.equal(pushUps.suggestedStat, 'strength');
  assert.ok(pushUps.postureTips.pt.length >= 2, 'Deve ter dicas de postura em PT');
  assert.ok(pushUps.postureTips.en.length >= 2, 'Deve ter dicas de postura em EN');

  const squats = detectGuidedActivity('Agachamentos Livres', 'Saúde');
  assert.equal(squats.mode, 'reps', 'Agachamentos devem ser detectados como reps');
  assert.equal(squats.defaultTarget, 25);
  assert.equal(squats.suggestedStat, 'strength');

  const sitUps = detectGuidedActivity('Abdominais diários', 'Rotina');
  assert.equal(sitUps.mode, 'reps');
  assert.equal(sitUps.defaultTarget, 30);
  assert.equal(sitUps.suggestedStat, 'endurance');

  const pullUps = detectGuidedActivity('Barra Fixa', 'Treino');
  assert.equal(pullUps.mode, 'reps');
  assert.equal(pullUps.defaultTarget, 8);
  assert.equal(pullUps.suggestedStat, 'strength');

  const customReps = detectGuidedActivity('Polichinelos 50 reps', 'Geral');
  assert.equal(customReps.mode, 'reps');
  assert.equal(customReps.defaultTarget, 50, 'Deve extrair 50 repetições do título');
});

test('2. Detecção determinística de atividades baseadas em tempo (Timer Mode)', () => {
  const meditation = detectGuidedActivity('Meditação Matinal', 'Mindfulness');
  assert.equal(meditation.mode, 'timer', 'Meditação deve ser detectada como timer');
  assert.equal(meditation.targetUnit, 'seconds');
  assert.equal(meditation.defaultTarget, 600, 'Meditação padrão deve ser 10 minutos (600s)');
  assert.equal(meditation.suggestedStat, 'vitality');

  const deepWork = detectGuidedActivity('Foco Máximo no Projeto', 'Trabalho');
  assert.equal(deepWork.mode, 'timer');
  assert.equal(deepWork.defaultTarget, 1500, 'Deep work deve ser 25 minutos (1500s)');
  assert.equal(deepWork.suggestedStat, 'discipline');

  const reading = detectGuidedActivity('Leitura de Livro Técnico', 'Estudo');
  assert.equal(reading.mode, 'timer');
  assert.equal(reading.defaultTarget, 1200, 'Leitura padrão deve ser 20 minutos (1200s)');
  assert.equal(reading.suggestedStat, 'intelligence');

  const mobility = detectGuidedActivity('Alongamento e Mobilidade', 'Saúde');
  assert.equal(mobility.mode, 'timer');
  assert.equal(mobility.defaultTarget, 600);
  assert.equal(mobility.suggestedStat, 'vitality');

  const breathwork = detectGuidedActivity('Respiração Box Breathing', 'Saúde');
  assert.equal(breathwork.mode, 'timer');
  assert.equal(breathwork.defaultTarget, 300, 'Box breathing deve ser 5 minutos (300s)');

  const customMinutes = detectGuidedActivity('Estudo focado 45 minutos', 'Estudo');
  assert.equal(customMinutes.mode, 'timer');
  assert.equal(customMinutes.defaultTarget, 2700, 'Deve converter 45 minutos em 2700s');
});

test('3. Detecção determinística de rotinas completas de treino (Routine Mode)', () => {
  const routine = detectGuidedActivity('Ficha A - Peito e Tríceps', 'Treino');
  assert.equal(routine.mode, 'routine', 'Ficha completa de treino deve ter modo routine');

  const musculacao = detectGuidedActivity('Musculação e Hipertrofia', 'Treino');
  assert.equal(musculacao.mode, 'routine');
});

test('4. Formatação de tempo digital MM:SS', () => {
  assert.equal(formatTimeMMSS(0), '00:00');
  assert.equal(formatTimeMMSS(9), '00:09');
  assert.equal(formatTimeMMSS(60), '01:00');
  assert.equal(formatTimeMMSS(65), '01:05');
  assert.equal(formatTimeMMSS(600), '10:00');
  assert.equal(formatTimeMMSS(1500), '25:00');
  assert.equal(formatTimeMMSS(-10), '00:00', 'Segundos negativos devem ser tratados como 00:00');
});

test('5. Resiliência do Timer Epoch (imune a bloqueio de tela / suspensão de abas)', () => {
  // Cenário 1: Sessão pausada
  const pausedSession = {
    questId: 'test-1',
    questType: 'habit',
    mode: 'timer',
    title: 'Meditação',
    category: 'Saúde',
    categoryColor: '#00F0FF',
    targetValue: 600,
    currentValue: 0,
    isPaused: true,
    remainingWhenPaused: 420,
    startedAt: Date.now() - 180000,
    xpReward: 15,
  };
  assert.equal(calculateRemainingSeconds(pausedSession), 420, 'Sessão pausada deve retornar remainingWhenPaused');

  // Cenário 2: Sessão rodando com targetTimestamp no futuro
  const runningSession = {
    questId: 'test-2',
    questType: 'habit',
    mode: 'timer',
    title: 'Foco',
    category: 'Trabalho',
    categoryColor: '#00F0FF',
    targetValue: 600,
    currentValue: 0,
    targetTimestamp: Date.now() + 150000, // 150 segundos no futuro
    isPaused: false,
    startedAt: Date.now() - 450000,
    xpReward: 25,
  };
  const remaining = calculateRemainingSeconds(runningSession);
  assert.ok(remaining >= 148 && remaining <= 151, `Deveria restar ~150s, obteve ${remaining}`);

  // Cenário 3: Sessão rodando cujo tempo já expirou enquanto a tela estava bloqueada
  const expiredSession = {
    questId: 'test-3',
    questType: 'habit',
    mode: 'timer',
    title: 'Leitura',
    category: 'Estudo',
    categoryColor: '#00F0FF',
    targetValue: 600,
    currentValue: 0,
    targetTimestamp: Date.now() - 30000, // Expirou há 30 segundos
    isPaused: false,
    startedAt: Date.now() - 630000,
    xpReward: 20,
  };
  assert.equal(calculateRemainingSeconds(expiredSession), 0, 'Sessão expirada deve retornar 0s');
});

test('6. Verificação de elegibilidade de atividades para Modo Guiado', () => {
  assert.equal(isGuidedEligible('Flexões', 'Treino', 'habit'), true);
  assert.equal(isGuidedEligible('Estudar 1h', 'Estudo', 'task'), true);
  assert.equal(isGuidedEligible('Treino de Pernas', 'Treino', 'workout'), true);
  assert.equal(isGuidedEligible('Almoço Saudável', 'Nutrição', 'meal'), false, 'Refeições têm módulo dedicado');
  assert.equal(isGuidedEligible('Registrar Gastos', 'Finanças', 'finance'), false, 'Finanças têm módulo dedicado');
  assert.equal(isGuidedEligible('', 'Geral', 'habit'), false, 'Título vazio não é elegível');
});

test('7. Integridade de Gamificação e Atributos Oficiais', () => {
  const validStats = new Set(['strength', 'endurance', 'intelligence', 'discipline', 'vitality']);
  for (const [key, preset] of Object.entries(GUIDED_ACTIVITY_PRESETS)) {
    assert.ok(
      validStats.has(preset.suggestedStat),
      `Preset ${key} deve ter um dos 5 atributos oficiais válidos: ${preset.suggestedStat}`
    );
    assert.ok(preset.statBonus >= 1 && preset.statBonus <= 3, `Stat bonus deve ser razoável (1-3)`);
  }
});

test('8. Conformidade Bilingue (PT-BR / EN-US)', () => {
  for (const [key, preset] of Object.entries(GUIDED_ACTIVITY_PRESETS)) {
    assert.ok(preset.label.pt.length > 0, `Preset ${key} deve ter label em PT`);
    assert.ok(preset.label.en.length > 0, `Preset ${key} deve ter label em EN`);
    assert.ok(preset.instructions.pt.length > 0, `Preset ${key} deve ter instruções em PT`);
    assert.ok(preset.instructions.en.length > 0, `Preset ${key} deve ter instruções em EN`);
    assert.ok(preset.postureTips.pt.length > 0, `Preset ${key} deve ter dicas em PT`);
    assert.ok(preset.postureTips.en.length > 0, `Preset ${key} deve ter dicas em EN`);
  }
});

test('9. Regra Anti-Exploit e Ausência de Dependências Indesejadas', () => {
  const guidedLibSource = fs.readFileSync('src/lib/guidedQuests.ts', 'utf8');
  assert.ok(!guidedLibSource.includes('openai'), 'Não deve importar OpenAI');
  assert.ok(!guidedLibSource.includes('google-generative-ai'), 'Não deve importar IA generativa externa');
  assert.ok(!guidedLibSource.includes('stripe'), 'Não deve conter Stripe');
  assert.ok(!guidedLibSource.includes('tensorflow') && !guidedLibSource.includes('posenet'), 'Zero tracking por câmera');

  const modalSource = fs.readFileSync('src/components/quests/GuidedQuestModal.tsx', 'utf8');
  assert.ok(!modalSource.includes('stripe'), 'Modal não deve ter paywall');
  assert.ok(!modalSource.includes('openai'), 'Modal não deve ter IA');

  const cardSource = fs.readFileSync('src/components/quests/IllustratedQuestCard.tsx', 'utf8');
  assert.ok(cardSource.includes('NeonCheckbox'), 'Deve preservar checkbox direto para registro rápido');
});

