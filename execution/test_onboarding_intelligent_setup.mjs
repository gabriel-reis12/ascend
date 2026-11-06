import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  getCalibratedInitialStats,
  getRecommendedPinnedActions,
  getInitialHabitPresets,
  mapMainGoalToTrainingGoal,
} from '../src/lib/onboardingRules.ts';

test('ASCEND — Etapa 03.9: Refinamento do Onboarding e Setup Inicial Inteligente', async (t) => {
  const onboarding = fs.readFileSync('src/pages/Onboarding.tsx', 'utf8');
  const setupModule = fs.readFileSync('src/lib/onboardingSetup.ts', 'utf8');

  await t.test('1. Calibração determinística de atributos por classe (Primário +3, Secundário +2, Terciário +1)', () => {
    const warrior = getCalibratedInitialStats('Warrior');
    assert.equal(warrior.strength, 13);
    assert.equal(warrior.endurance, 12);
    assert.equal(warrior.vitality, 11);
    assert.equal(warrior.intelligence, 10);

    const scholar = getCalibratedInitialStats('Scholar');
    assert.equal(scholar.intelligence, 13);
    assert.equal(scholar.wisdom, 12);
    assert.equal(scholar.discipline, 11);

    const creator = getCalibratedInitialStats('Creator');
    assert.equal(creator.intelligence, 12);
    assert.equal(creator.discipline, 12);
    assert.equal(creator.wisdom, 11);

    const monk = getCalibratedInitialStats('Monk');
    assert.equal(monk.vitality, 13);
    assert.equal(monk.balance, 12);
    assert.equal(monk.endurance, 11);

    const leader = getCalibratedInitialStats('Leader');
    assert.equal(leader.discipline, 13);
    assert.equal(leader.wisdom, 12);
    assert.equal(leader.balance, 11);
  });

  await t.test('2. Recomendação determinística de atalhos rápidos da Home conforme o objetivo principal', () => {
    const weightLoss = getRecommendedPinnedActions('weight_loss');
    assert.deepEqual(weightLoss, ['nutrition_log', 'workouts_log', 'quests_complete', 'mind_temple']);

    const hypertrophy = getRecommendedPinnedActions('hypertrophy');
    assert.deepEqual(hypertrophy, ['workouts_log', 'nutrition_log', 'quests_complete', 'status_radar']);

    const discipline = getRecommendedPinnedActions('discipline');
    assert.deepEqual(discipline, ['quests_complete', 'mind_temple', 'workouts_log', 'nutrition_log']);

    const studies = getRecommendedPinnedActions('focus_studies');
    assert.deepEqual(studies, ['quests_complete', 'mind_temple', 'status_radar', 'workouts_log']);

    const health = getRecommendedPinnedActions('general_health');
    assert.deepEqual(health, ['quests_complete', 'workouts_log', 'nutrition_log', 'mind_temple']);
  });

  await t.test('3. Geração determinística de hábitos diários essenciais para o caçador', () => {
    const wlHabits = getInitialHabitPresets('weight_loss');
    assert.equal(wlHabits.length, 3);
    assert.ok(wlHabits.some((h) => h.stat_target === 'vitality'));
    assert.ok(wlHabits.some((h) => h.stat_target === 'discipline'));
    assert.ok(wlHabits.some((h) => h.stat_target === 'endurance'));

    const hypHabits = getInitialHabitPresets('hypertrophy');
    assert.equal(hypHabits.length, 3);
    assert.ok(hypHabits.some((h) => h.title.includes('Proteína')));
    assert.ok(hypHabits.some((h) => h.title.includes('Treino')));

    const discHabits = getInitialHabitPresets('discipline');
    assert.equal(discHabits.length, 3);
    assert.ok(discHabits.some((h) => h.stat_target === 'discipline'));
  });

  await t.test('4. Mapeamento de objetivos para o motor de treino determinístico', () => {
    assert.equal(mapMainGoalToTrainingGoal('weight_loss'), 'weight_loss');
    assert.equal(mapMainGoalToTrainingGoal('hypertrophy'), 'hypertrophy');
    assert.equal(mapMainGoalToTrainingGoal('conditioning'), 'conditioning');
    assert.equal(mapMainGoalToTrainingGoal('discipline'), 'strength');
    assert.equal(mapMainGoalToTrainingGoal('general_health'), 'health');
  });

  await t.test('5. Onboarding.tsx integra o Setup Inicial e exibe o resumo visual tático', () => {
    // Importa o módulo de setup
    assert.ok(
      onboarding.includes('applyHunterInitialSetup'),
      'Onboarding deve importar e executar applyHunterInitialSetup'
    );

    // Exibe o card de resumo do setup configurado
    assert.ok(
      onboarding.includes('SETUP INICIAL CONFIGURADO PELO SISTEMA'),
      'Onboarding deve apresentar o resumo tático dos 4 pilares configurados'
    );

    // Contém campos essenciais da Etapa 03.9
    assert.ok(
      onboarding.includes('workoutEnvironment') &&
      onboarding.includes('workoutFrequency') &&
      onboarding.includes('physicalRestrictions') &&
      onboarding.includes('dailyAvailability'),
      'Onboarding deve capturar frequência, ambiente, restrições e disponibilidade'
    );
  });

  await t.test('6. Restrições articulares interativas com chips e persistência', () => {
    assert.ok(
      onboarding.includes('toggleRestriction'),
      'Onboarding deve permitir alternar restrições articulares'
    );
    assert.ok(
      onboarding.includes('lombar') &&
      onboarding.includes('joelho') &&
      onboarding.includes('ombro'),
      'Onboarding deve suportar restrições de lombar, joelho e ombro'
    );
  });

  await t.test('7. Garantia contra regressão: sem IA, sem Stripe, dados 100% locais', () => {
    assert.ok(
      !setupModule.includes('openai') &&
      !setupModule.includes('anthropic') &&
      !setupModule.includes('stripe'),
      'setupModule não deve usar serviços externos de IA ou pagamento'
    );
  });
});
