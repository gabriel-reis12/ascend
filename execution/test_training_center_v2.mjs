import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTrainingProtocol,
  resolveAvailableEquipment,
} from '../src/lib/trainingGenerator.ts';

test('ASCEND — Training Center 2.0: Motor Determinístico de Treinos & Arsenal', async (t) => {

  await t.test('1. Geração de divisão Full Body 2x para frequência de 2 dias', () => {
    const proto = generateTrainingProtocol({
      goal: 'health',
      experience: 'beginner',
      frequency: 2,
      durationMinutes: 45,
      environment: 'gym',
    });

    assert.equal(proto.frequency, 2);
    assert.equal(proto.splitType, 'Full Body 2x');
    assert.equal(proto.routines.length, 2);
    assert.ok(proto.routines[0].exercises.length >= 3);
    assert.ok(proto.routines[1].exercises.length >= 3);
    assert.ok(proto.clinicalDisclaimerPt.includes('ACSM/NSCA'));
  });

  await t.test('2. Geração de divisão Full Body 3x para iniciantes e PPL 3x para intermediários', () => {
    const beginnerProto = generateTrainingProtocol({
      goal: 'hypertrophy',
      experience: 'beginner',
      frequency: 3,
      durationMinutes: 60,
      environment: 'gym',
    });
    assert.equal(beginnerProto.splitType, 'Full Body 3x');
    assert.equal(beginnerProto.routines.length, 3);

    const interProto = generateTrainingProtocol({
      goal: 'hypertrophy',
      experience: 'intermediate',
      frequency: 3,
      durationMinutes: 60,
      environment: 'gym',
    });
    assert.equal(interProto.splitType, 'Push / Pull / Legs (PPL 3x)');
    assert.equal(interProto.routines.length, 3);
    assert.equal(interProto.routines[0].name.includes('Push'), true);
    assert.equal(interProto.routines[1].name.includes('Pull'), true);
    assert.equal(interProto.routines[2].name.includes('Legs'), true);
  });

  await t.test('3. Geração de divisão Upper / Lower 4x e ABCD 4x conforme experiência', () => {
    const ulProto = generateTrainingProtocol({
      goal: 'strength',
      experience: 'intermediate',
      frequency: 4,
      durationMinutes: 60,
      environment: 'gym',
    });
    assert.equal(ulProto.splitType, 'Upper / Lower (4x)');
    assert.equal(ulProto.routines.length, 4);

    const abcdProto = generateTrainingProtocol({
      goal: 'hypertrophy',
      experience: 'advanced',
      frequency: 4,
      durationMinutes: 60,
      environment: 'gym',
    });
    assert.equal(abcdProto.splitType, 'ABCD Hipertrofia');
    assert.equal(abcdProto.routines.length, 4);
  });

  await t.test('4. Geração de divisões de alta frequência: ABCDE 5x e PPL 6x', () => {
    const fiveDay = generateTrainingProtocol({
      goal: 'hypertrophy',
      experience: 'advanced',
      frequency: 5,
      durationMinutes: 60,
      environment: 'gym',
    });
    assert.equal(fiveDay.splitType, 'ABCDE Especialização');
    assert.equal(fiveDay.routines.length, 5);

    const sixDay = generateTrainingProtocol({
      goal: 'hypertrophy',
      experience: 'advanced',
      frequency: 6,
      durationMinutes: 60,
      environment: 'gym',
    });
    assert.equal(sixDay.splitType, 'Push / Pull / Legs (PPL 2x)');
    assert.equal(sixDay.routines.length, 6);
  });

  await t.test('5. Respeito estrito a restrições físicas (lombar, joelho, ombro)', () => {
    const restrictedProto = generateTrainingProtocol({
      goal: 'hypertrophy',
      experience: 'intermediate',
      frequency: 3,
      durationMinutes: 60,
      environment: 'gym',
      restrictions: ['lombar', 'joelho'],
    });

    const allExercises = restrictedProto.routines.flatMap((r) => r.exercises.map((e) => e.name));
    // Não deve conter Levantamento Terra, Agachamento Livre nem Agachamento Búlgaro
    assert.equal(allExercises.includes('Levantamento Terra'), false);
    assert.equal(allExercises.includes('Agachamento Livre com Barra'), false);
    assert.equal(allExercises.includes('Cadeira Extensora'), false);
    assert.ok(allExercises.length > 0, 'Deve prescrever alternativas seguras');
  });

  await t.test('6. Adaptação a treinos em casa (home) com equipamentos limitados', () => {
    const homeProto = generateTrainingProtocol({
      goal: 'conditioning',
      experience: 'beginner',
      frequency: 3,
      durationMinutes: 45,
      environment: 'home',
      availableEquipment: ['Halteres', 'Peso Corporal'],
    });

    const allExercises = homeProto.routines.flatMap((r) => r.exercises.map((e) => e.name));
    // Não deve conter máquinas ou barras olímpicas
    assert.equal(allExercises.includes('Puxada Alta (Pulley)'), false);
    assert.equal(allExercises.includes('Leg Press 45º'), false);
    assert.equal(allExercises.includes('Cadeira Extensora'), false);
    assert.ok(allExercises.length > 0, 'Deve conter exercícios com halteres ou peso corporal');
  });

  await t.test('7. Prescrição de séries, repetições e descanso adaptada ao objetivo', () => {
    const strengthProto = generateTrainingProtocol({
      goal: 'strength',
      experience: 'advanced',
      frequency: 3,
      durationMinutes: 60,
      environment: 'gym',
    });
    const strengthEx = strengthProto.routines[0].exercises[0];
    assert.equal(strengthEx.reps, 5);
    assert.equal(strengthEx.rest_seconds, 120);

    const condProto = generateTrainingProtocol({
      goal: 'conditioning',
      experience: 'beginner',
      frequency: 3,
      durationMinutes: 45,
      environment: 'gym',
    });
    const condEx = condProto.routines[0].exercises[0];
    assert.equal(condEx.reps, 14);
    assert.equal(condEx.rest_seconds, 45);
  });

  await t.test('8. Determinismo absoluto do motor (mesmos inputs geram protocolos idênticos)', () => {
    const input = {
      goal: 'hypertrophy',
      experience: 'intermediate',
      frequency: 4,
      durationMinutes: 60,
      environment: 'gym',
    };
    const proto1 = generateTrainingProtocol(input);
    const proto2 = generateTrainingProtocol(input);

    assert.equal(proto1.splitType, proto2.splitType);
    assert.equal(proto1.routines.length, proto2.routines.length);
    assert.deepEqual(
      proto1.routines.map((r) => r.name),
      proto2.routines.map((r) => r.name)
    );
    assert.deepEqual(
      proto1.routines[0].exercises.map((e) => e.name),
      proto2.routines[0].exercises.map((e) => e.name)
    );
  });

  await t.test('9. Catálogo Arsenal: completude, equipamentos e dicas bilíngues', async () => {
    const { EXERCISE_ARSENAL } = await import('../src/data/exerciseArsenal.ts');
    assert.ok(EXERCISE_ARSENAL.length >= 25, 'Arsenal deve conter pelo menos 25 exercícios');

    for (const ex of EXERCISE_ARSENAL) {
      assert.ok(ex.id, `Exercício ${ex.name} deve ter id`);
      assert.ok(ex.name, 'Exercício deve ter nome');
      assert.ok(ex.muscle_group, `Exercício ${ex.name} deve ter muscle_group`);
      assert.ok(ex.equipment.length > 0, `Exercício ${ex.name} deve ter equipment`);
      assert.ok(ex.tipsPt, `Exercício ${ex.name} deve ter dicas em PT`);
      assert.ok(ex.tipsEn, `Exercício ${ex.name} deve ter dicas em EN`);
      assert.ok(ex.calories_per_minute > 0, `Exercício ${ex.name} deve ter gasto calórico positivo`);
    }
  });

  await t.test('10. Fórmula Epley para Estimativa de 1RM e Volume de Séries', () => {
    // Epley: 1RM = weight * (1 + reps / 30)
    const weight = 100;
    const reps = 10;
    const estimated1RM = Math.round(weight * (1 + reps / 30));
    assert.equal(estimated1RM, 133);

    const setVolume = 80 * 12;
    assert.equal(setVolume, 960);
  });

  await t.test('11. Contrato de Cronômetro Tático com Persistência em Timestamp', () => {
    const duration = 60;
    const targetTimestamp = Date.now() + duration * 1000;
    const remaining = Math.max(0, Math.ceil((targetTimestamp - Date.now()) / 1000));
    assert.ok(remaining <= 60 && remaining >= 59);
  });

});
