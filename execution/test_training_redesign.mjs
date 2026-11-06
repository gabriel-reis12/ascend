import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workoutsPath = path.resolve('src/pages/Workouts.tsx');
const progressPath = path.resolve('src/components/workouts/WorkoutProgress.tsx');

const workoutsSource = fs.readFileSync(workoutsPath, 'utf8');
const progressSource = fs.readFileSync(progressPath, 'utf8');

test('Etapa 03.6 — Workouts.tsx & WorkoutProgress.tsx integrate ASCEND HUD v2 components', () => {
  assert.match(workoutsSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
  assert.match(workoutsSource, /import\s+\{\s*TacticalButton\s*\}\s+from\s+['"]@\/components\/ui\/tactical-button['"]/);
  assert.match(workoutsSource, /import\s+\{\s*NeonProgressBar\s*\}\s+from\s+['"]@\/components\/ui\/neon-progress['"]/);
  assert.match(workoutsSource, /import\s+\{\s*RankBadge\s*\}\s+from\s+['"]@\/components\/ui\/rank-badge['"]/);

  assert.match(progressSource, /import\s+\{\s*HudCard\s*\}\s+from\s+['"]@\/components\/ui\/hud-card['"]/);
  assert.match(progressSource, /import\s+\{\s*NeonProgressBar\s*\}\s+from\s+['"]@\/components\/ui\/neon-progress['"]/);
  assert.match(progressSource, /import\s+\{\s*RankBadge\s*\}\s+from\s+['"]@\/components\/ui\/rank-badge['"]/);
});

test('Etapa 03.6 — Today Workout Hero Summary Card displays real metrics, sets, progress & XP reward', () => {
  assert.match(workoutsSource, /TREINO DE HOJE/);
  assert.match(workoutsSource, /TODAY'S WORKOUT/);
  assert.match(workoutsSource, /featuredTotalExercises/);
  assert.match(workoutsSource, /featuredCompletedSets\}\/\{featuredTotalSets/);
  assert.match(workoutsSource, /featuredCompletedCount\}\/\{featuredTotalExercises/);
  assert.match(workoutsSource, /\+\{featuredXpReward\} XP/);
  assert.match(workoutsSource, /INICIAR TREINO/);
  assert.match(workoutsSource, /START WORKOUT/);
});

test('Etapa 03.6 — Exercise Cards provide ergonomic numeric inputs (inputMode) and 44px steppers', () => {
  assert.match(workoutsSource, /inputMode="numeric"/);
  assert.match(workoutsSource, /inputMode="decimal"/);
  assert.match(workoutsSource, /size-11/);
  assert.match(workoutsSource, /previousLog/);
  assert.match(workoutsSource, /handleInlineCompleteExercise/);
  assert.match(workoutsSource, /handleUpdateRoutineExercise/);
});

test('Etapa 03.6 — Active Workout Session preserves localStorage state, Rest Timer, and Gameplay XP/Stats/Boss Raid', () => {
  assert.match(workoutsSource, /ascend_active_workout_open/);
  assert.match(workoutsSource, /ascend_active_workout_exercises/);
  assert.match(workoutsSource, /ascend_active_workout_completed/);
  assert.match(workoutsSource, /ascend_active_workout_routine_id/);
  assert.match(workoutsSource, /ascend_active_workout_\$\{user\.id\}/);

  // Rest timer presets and state
  assert.match(workoutsSource, /setRestTimer\(60\)/);
  assert.match(workoutsSource, /setRestTimer\(90\)/);
  assert.match(workoutsSource, /isResting/);

  // Gameplay progression rules preserved intact
  assert.match(workoutsSource, /const xpReward = isCardio \? 25 : 30/);
  assert.match(workoutsSource, /updateStat\(statTarget,\s*2,\s*user\.id\)/);
  assert.match(workoutsSource, /updateStat\('vitality',\s*1,\s*user\.id\)/);
  assert.match(workoutsSource, /updateStat\('discipline',\s*1,\s*user\.id\)/);
  assert.match(workoutsSource, /attackActiveBoss\(user\.id,\s*xpResult\.awardedXp,\s*'workout'\)/);
});

test('Etapa 03.6 — WorkoutProgress preserves 1RM & Volume formulas and uses responsive mobile cards instead of horizontal scroll table', () => {
  // Volume & 1RM formulas preserved
  assert.match(progressSource, /volume\s*\+=\s*weight\s*\*\s*reps\s*\*\s*sets/);
  assert.match(progressSource, /weight\s*\*\s*\(1\s*\+\s*0\.0333\s*\*\s*reps\)/);

  // Mobile responsive cards + desktop table
  assert.match(progressSource, /className="space-y-2\.5 md:hidden"/);
  assert.match(progressSource, /className="hidden overflow-hidden p-0 md:block"/);
  assert.doesNotMatch(progressSource, /overflow-x-auto/);
});

test('Etapa 03.6 — Presets preserve original artwork (program.image) and import flow', () => {
  assert.match(workoutsSource, /src=\{program\.image\}/);
  assert.match(workoutsSource, /src=\{selectedPreset\.image\}/);
  assert.match(workoutsSource, /handleImportProgram/);
});
