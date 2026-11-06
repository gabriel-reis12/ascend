import { supabase } from './supabase';
import { useHunterStore } from '../stores/useHunterStore';
import { calculateNutritionTargets } from './nutritionTargets';
import { generateTrainingProtocol } from './trainingGenerator';
import { normalizeActivityXp } from './progression';
import {
  type HunterClass,
  type HunterStats,
  type HunterOnboardingSetup,
  type HunterSetupSummary,
  getCalibratedInitialStats,
  getRecommendedPinnedActions,
  getInitialHabitPresets,
  mapMainGoalToTrainingGoal,
} from './onboardingRules';

export * from './onboardingRules';

/**
 * Executa a configuração inicial inteligente do Caçador em todos os módulos:
 * - Calibra e grava atributos da classe no perfil
 * - Calcula metas nutricionais
 * - Inicializa cardápios estruturados em meal_plans se ausentes
 * - Gera e grava o primeiro protocolo de treino compatível em workout_routines
 * - Semeia 3 hábitos diários essenciais em daily_habits
 * - Ajusta os atalhos fixados da Home
 */
export async function applyHunterInitialSetup(
  setup: HunterOnboardingSetup
): Promise<HunterSetupSummary> {
  const calibratedStats = getCalibratedInitialStats(setup.hunterClass);
  const pinnedActionIds = getRecommendedPinnedActions(setup.mainGoal);

  // 1. Atualiza Perfil com Dados Biológicos, Vocação e Atributos Calibrados
  try {
    await supabase.from('profiles').update({
      class: setup.hunterClass,
      full_name: setup.fullName.trim(),
      birthday: setup.birthday || null,
      gender: setup.gender || null,
      height: setup.height || null,
      weight_current: setup.weightCurrent || null,
      weight_target: setup.weightTarget || null,
      training_focus: setup.trainingFocus || null,
      main_goal: setup.mainGoal,
      nutrition_goal: setup.nutritionGoal,
      experience_level: setup.experienceLevel,
      strength: calibratedStats.strength,
      intelligence: calibratedStats.intelligence,
      endurance: calibratedStats.endurance,
      vitality: calibratedStats.vitality,
      discipline: calibratedStats.discipline,
      wisdom: calibratedStats.wisdom,
      balance: calibratedStats.balance,
      updated_at: new Date().toISOString(),
    }).eq('id', setup.userId);

    // Atualiza estado local da hunterStore
    useHunterStore.setState({
      fullName: setup.fullName.trim(),
      birthday: setup.birthday || '',
      gender: setup.gender || null,
      height: setup.height || null,
      weightCurrent: setup.weightCurrent || null,
      weightTarget: setup.weightTarget || null,
      trainingFocus: setup.trainingFocus || null,
      mainGoal: setup.mainGoal,
      nutritionGoal: setup.nutritionGoal,
      experienceLevel: setup.experienceLevel,
      hunterClass: setup.hunterClass,
      stats: calibratedStats,
    });
  } catch (err) {
    console.warn('[onboardingSetup] Falha ao atualizar perfil no banco:', err);
  }

  // 2. Metas Nutricionais Iniciais
  const targets = calculateNutritionTargets({
    birthday: setup.birthday,
    gender: setup.gender,
    height: setup.height,
    weightCurrent: setup.weightCurrent,
    nutritionGoal: setup.nutritionGoal,
  });

  // 3. Inicialização de Planos Alimentares Estruturados (se inexistentes)
  try {
    const { data: existingPlans } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', setup.userId)
      .limit(1);

    if (!existingPlans || existingPlans.length === 0) {
      const defaultMealNames = [
        { name: 'Café da Manhã Tático', order: 0, xp: 15 },
        { name: 'Almoço de Alta Performance', order: 1, xp: 20 },
        { name: 'Lanche / Pré-Treino', order: 2, xp: 15 },
        { name: 'Jantar Regenerativo', order: 3, xp: 20 },
      ];

      for (const meal of defaultMealNames) {
        await supabase.from('meal_plans').insert({
          user_id: setup.userId,
          name: meal.name,
          order_index: meal.order,
          is_active: true,
          xp_reward: meal.xp,
        });
      }
    }
  } catch (err) {
    console.warn('[onboardingSetup] Falha ao criar planos alimentares:', err);
  }

  // 4. Inicialização de Protocolo de Treino Personalizado (se inexistente)
  let generatedSplitTitle = 'Protocolo Tático';
  try {
    const { data: existingRoutines } = await supabase
      .from('workout_routines')
      .select('id')
      .eq('user_id', setup.userId)
      .limit(1);

    if (!existingRoutines || existingRoutines.length === 0) {
      const trainingGoal = mapMainGoalToTrainingGoal(setup.mainGoal);
      const protocol = generateTrainingProtocol({
        goal: trainingGoal,
        experience: setup.experienceLevel,
        frequency: setup.workoutFrequency,
        durationMinutes: (Number(setup.dailyAvailability) || 60) as 30 | 45 | 60 | 90,
        environment: setup.workoutEnvironment,
        restrictions: setup.physicalRestrictions,
      });

      generatedSplitTitle = protocol.splitType;

      // Cria rotinas e exercícios
      for (const r of protocol.routines) {
        const { data: newRoutine, error: routineErr } = await supabase
          .from('workout_routines')
          .insert({
            user_id: setup.userId,
            name: r.name,
            scheduled_days: r.scheduled_days,
          })
          .select('id')
          .single();

        if (!routineErr && newRoutine) {
          for (let i = 0; i < r.exercises.length; i++) {
            const ex = r.exercises[i];

            // Tenta encontrar exercício existente ou cria sob medida
            let exId: string | null = null;
            const { data: matchedEx } = await supabase
              .from('exercises')
              .select('id')
              .ilike('name', ex.name.trim())
              .limit(1)
              .maybeSingle();

            if (matchedEx?.id) {
              exId = matchedEx.id;
            } else {
              const { data: createdEx } = await supabase
                .from('exercises')
                .insert({
                  name: ex.name,
                  muscle_group: ex.muscle_group,
                  category: ex.category,
                  is_custom: true,
                  created_by: setup.userId,
                })
                .select('id')
                .single();
              if (createdEx) exId = createdEx.id;
            }

            if (exId) {
              await supabase.from('routine_exercises').insert({
                routine_id: newRoutine.id,
                exercise_id: exId,
                sets: ex.sets,
                reps: ex.reps,
                weight_kg: ex.weight_kg,
                order_index: i,
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('[onboardingSetup] Falha ao criar rotinas de treino:', err);
  }

  // 5. Inicialização de Hábitos Essenciais (se inexistentes)
  const initialHabits = getInitialHabitPresets(setup.mainGoal, setup.primaryDifficulty);
  try {
    const { data: existingHabits } = await supabase
      .from('daily_habits')
      .select('id')
      .eq('user_id', setup.userId)
      .limit(1);

    if (!existingHabits || existingHabits.length === 0) {
      for (const habit of initialHabits) {
        await supabase.from('daily_habits').insert({
          user_id: setup.userId,
          title: habit.title,
          category: habit.category,
          category_color: habit.category_color,
          xp_reward: normalizeActivityXp(habit.xp_reward),
          stat_target: habit.stat_target,
          stat_reward: habit.stat_reward,
          active: true,
          is_optional: false,
          scheduled_days: [0, 1, 2, 3, 4, 5, 6],
        });
      }
    }
  } catch (err) {
    console.warn('[onboardingSetup] Falha ao criar hábitos essenciais:', err);
  }

  // 6. Atualização de Atalhos Fixados da Home no localStorage
  try {
    const quickActionsKey = `ascend_quick_actions_${setup.userId}`;
    localStorage.setItem(
      quickActionsKey,
      JSON.stringify({
        pinnedActionIds,
        showRecentSuggestions: true,
        showHunterGuidance: true,
      })
    );
  } catch (err) {
    console.warn('[onboardingSetup] Falha ao atualizar quick actions:', err);
  }

  const summary: HunterSetupSummary = {
    className: setup.hunterClass,
    calibratedStats,
    targetCalories: targets.targetCalories,
    nutritionGoalLabelPt: targets.goalLabel,
    nutritionGoalLabelEn: setup.nutritionGoal === 'lose' ? 'Weight Loss' : setup.nutritionGoal === 'gain' ? 'Weight Gain' : 'Maintenance',
    workoutSplitName: generatedSplitTitle,
    weeklyFrequency: setup.workoutFrequency,
    initialHabitsCount: initialHabits.length,
    pinnedActionIds,
  };

  try {
    localStorage.setItem(
      `ascend_hunter_setup_summary_${setup.userId}`,
      JSON.stringify(summary)
    );
  } catch {}

  return summary;
}
