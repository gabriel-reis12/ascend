import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { normalizeActivityXp } from '@/lib/progression';
import { localDateString, localDayBounds } from '@/lib/date';

const MEAL_BOSS_DAMAGE = 15;


export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: string;
  category_color: string;
  xp_reward: number;
  stat_target: 'strength' | 'intelligence' | 'endurance' | 'vitality' | 'discipline' | 'wisdom' | 'balance' | null;

  stat_reward: number;
  active: boolean;
  is_optional: boolean;
  scheduled_time: string | null;
  scheduled_end_time: string | null;
  scheduled_days: number[] | null;
  created_at: string;
}

export interface CreateHabitInput {
  title: string;
  category: string;
  category_color: string;
  xp_reward: number;
  stat_target: Habit['stat_target'];
  stat_reward: number;
  is_optional?: boolean;
  scheduled_time?: string | null;
  scheduled_end_time?: string | null;
  scheduled_days?: number[];
}

// Missão de treino injetada dinamicamente a partir das rotinas agendadas
export interface WorkoutMission {
  id: string; // routine_id com prefixo para evitar colisão
  routine_id: string;
  title: string;
  type: 'workout';
  isCompleted: boolean;
  scheduled_time: string | null;
  scheduled_end_time: string | null;
  xp_reward: number;
  stat_target: 'strength' | 'endurance';
  stat_reward: number;
}

// Missão de refeição injetada dinamicamente a partir dos cardápios ativos
export interface MealMission {
  id: string; // meal_plan_id com prefixo para evitar colisão
  meal_plan_id: string;
  source?: 'plan' | 'food_log';
  completionId?: string | null;
  title: string;
  totalKcal: number;
  xp_reward: number;
  type: 'meal';
  isCompleted: boolean;
  scheduled_time: string | null;
  scheduled_end_time: string | null;
  planItems?: Array<{
    id: string;
    food_id: string;
    quantity_grams: number;
  }>;
}

function todayStr() {
  return localDateString();
}

// Retorna o índice do dia da semana (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)
function todayDayOfWeek() {
  return new Date().getDay();
}

export function useHabits() {
  const { user } = useAuth();
  const addXp = useHunterStore((s) => s.addXp);
  const updateStat = useHunterStore((s) => s.updateStat);

  const [habits, setHabits] = useState<Habit[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Missões de treino dinâmicas (rotinas agendadas para hoje)
  const [workoutMissions, setWorkoutMissions] = useState<WorkoutMission[]>([]);
  // Missões de refeição (cardápios ativos — todos os dias)
  const [mealMissions, setMealMissions] = useState<MealMission[]>([]);

  const updateHabitsState = useCallback((updater: Habit[] | ((prev: Habit[]) => Habit[])) => {
    setHabits((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (user?.id) {
        localStorage.setItem(`ascend_habits_${user.id}`, JSON.stringify(next));
      }
      return next;
    });
  }, [user?.id]);

  const updateCompletedState = useCallback((updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setCompletedToday((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (user?.id) {
        localStorage.setItem(`ascend_completed_${user.id}`, JSON.stringify([...next]));
      }
      return next;
    });
  }, [user?.id]);

  const updateMealMissionsState = useCallback((updater: MealMission[] | ((prev: MealMission[]) => MealMission[])) => {
    setMealMissions((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (user?.id) {
        localStorage.setItem(`ascend_meals_${user.id}`, JSON.stringify(next));
      }
      return next;
    });
  }, [user?.id]);

  // Carrega do cache local associado ao id do usuário para carregamento instantâneo
  useEffect(() => {
    if (!user?.id) return;
    try {
      const habitsCache = localStorage.getItem(`ascend_habits_${user.id}`);
      const completedCache = localStorage.getItem(`ascend_completed_${user.id}`);
      const workoutsCache = localStorage.getItem(`ascend_workouts_${user.id}`);
      const mealsCache = localStorage.getItem(`ascend_meals_${user.id}`);

      if (habitsCache || completedCache || workoutsCache || mealsCache) {
        if (habitsCache) setHabits(JSON.parse(habitsCache));
        if (completedCache) setCompletedToday(new Set(JSON.parse(completedCache)));
        if (workoutsCache) setWorkoutMissions(JSON.parse(workoutsCache));
        if (mealsCache) setMealMissions(JSON.parse(mealsCache));
        setLoading(false); // Remove skeleton visual imediatamente caso tenhamos dados locais
      }
    } catch (err) {
      console.warn('[useHabits] Erro ao carregar cache local:', err);
    }
  }, [user?.id]);

  const fetchAll = useCallback(async () => {
    // Se não há usuário, reseta o loading imediatamente (evita skeleton eterno)
    if (!user?.id) {
      setLoading(false);
      setHabits([]);
      setCompletedToday(new Set());
      setWorkoutMissions([]);
      setMealMissions([]);
      return;
    }
    
    // Se não temos cache carregado, mostramos o loading (skeleton)
    const hasCache = localStorage.getItem(`ascend_habits_${user.id}`) !== null;
    if (!hasCache) {
      setLoading(true);
    }
    setError(null);

    let active = true;

    // Safety timeout de 10 segundos para dar tempo ao Supabase de acordar do cold start
    const safetyTimeout = setTimeout(() => {
      if (active) {
        setLoading(false);
        console.warn('Safety timeout de useHabits disparado. Forçando loading = false.');
      }
    }, 10000);

    try {
      const today = todayStr();
      const dayOfWeek = todayDayOfWeek();

      const [
        habitsRes,
        completionsRes,
        routinesRes,
        routineCompletionsRes,
        mealPlansRes,
        mealCompletionsRes,
        foodLogsRes,
      ] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
        supabase
          .from('habit_completions')
          .select('habit_id')
          .eq('user_id', user.id)
          .eq('completed_date', today),
        supabase
          .from('workout_routines')
          .select(`
            id, 
            name, 
            scheduled_days, 
            scheduled_time, 
            scheduled_end_time,
            exercises:routine_exercises(
              exercise:exercises(category)
            )
          `)
          .eq('user_id', user.id),
        supabase
          .from('routine_completions')
          .select('routine_id')
          .eq('user_id', user.id)
          .eq('completed_date', today),
        supabase
          .from('meal_plans')
          .select(`
            id, 
            name, 
            xp_reward, 
            is_active, 
            scheduled_time, 
            scheduled_end_time,
            items:meal_plan_items(
              id,
              food_id,
              quantity_grams,
              food:foods(calories_per_100g)
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('order_index', { ascending: true }),
        supabase
          .from('meal_completions')
          .select('id, meal_plan_id')
          .eq('user_id', user.id)
          .eq('completed_at', today),
        supabase
          .from('food_logs')
          .select(`
            id,
            quantity_grams,
            logged_at,
            meal_type,
            source,
            meal_plan_id,
            meal_plan_item_id,
            meal_completion_id,
            food:foods(name, calories_per_100g)
          `)
          .eq('user_id', user.id)
          .gte('logged_at', localDayBounds().startIso)
          .lte('logged_at', localDayBounds().endIso)
          .order('logged_at', { ascending: true }),
      ]);

      if (habitsRes.error) throw habitsRes.error;
      if (completionsRes.error) throw completionsRes.error;
      if (routinesRes.error) throw routinesRes.error;
      if (routineCompletionsRes.error) throw routineCompletionsRes.error;
      if (mealPlansRes.error) throw mealPlansRes.error;
      if (mealCompletionsRes.error) throw mealCompletionsRes.error;
      if (foodLogsRes.error) throw foodLogsRes.error;

      if (!active) return;

      const completedRoutineIds = new Set((routineCompletionsRes.data ?? []).map((rc: any) => rc.routine_id));
      const todayRoutines = (routinesRes.data ?? []).filter(
        (r: any) => Array.isArray(r.scheduled_days) && r.scheduled_days.includes(dayOfWeek)
      );

      const computedWorkouts = todayRoutines.map((r: any) => {
        const isCardio = r.name.toLowerCase().includes('cardio') || 
          (r.exercises && r.exercises.some((re: any) => re.exercise?.category?.toLowerCase() === 'cardio'));
        
        return {
          id: `workout_mission_${r.id}`,
          routine_id: r.id,
          title: r.name,
          type: 'workout' as const,
          isCompleted: completedRoutineIds.has(r.id),
          scheduled_time: r.scheduled_time ? r.scheduled_time.slice(0, 5) : null,
          scheduled_end_time: r.scheduled_end_time ? r.scheduled_end_time.slice(0, 5) : null,
          xp_reward: isCardio ? 25 : 30,
          stat_target: isCardio ? 'endurance' as const : 'strength' as const,
          stat_reward: 2,
        };
      });

      const completionByPlan = new Map<string, string>(
        (mealCompletionsRes.data ?? []).map((completion: any) => [completion.meal_plan_id, completion.id])
      );
      const completedMealIds = new Set(completionByPlan.keys());
      const syncedCompletionItems = new Set(
        (foodLogsRes.data ?? [])
          .filter((log: any) => log.meal_completion_id && log.meal_plan_item_id)
          .map((log: any) => `${log.meal_completion_id}:${log.meal_plan_item_id}`)
      );
      const missingPlanLogs = (mealPlansRes.data ?? []).flatMap((plan: any) => {
        const completionId = completionByPlan.get(plan.id);
        if (!completionId) return [];

        return (plan.items ?? [])
          .filter((item: any) => !syncedCompletionItems.has(`${completionId}:${item.id}`))
          .map((item: any) => ({
            user_id: user.id,
            food_id: item.food_id,
            quantity_grams: item.quantity_grams,
            meal_type: plan.name,
            source: 'meal_plan',
            meal_plan_id: plan.id,
            meal_plan_item_id: item.id,
            meal_completion_id: completionId,
          }));
      });

      if (missingPlanLogs.length > 0) {
        const { error: syncError } = await supabase.from('food_logs').insert(missingPlanLogs);
        if (syncError && syncError.code !== '23505') throw syncError;
      }

      const computedMeals = (mealPlansRes.data ?? []).map((plan: any) => {
        const totalKcal = (plan.items ?? []).reduce((sum: number, item: any) => {
          const foodObj = Array.isArray(item.food) ? item.food[0] : item.food;
          const kcal = ((foodObj?.calories_per_100g ?? 0) * (item.quantity_grams ?? 0)) / 100;
          return sum + kcal;
        }, 0);

        return {
          id: `meal_mission_${plan.id}`,
          meal_plan_id: plan.id,
          source: 'plan' as const,
          completionId: completionByPlan.get(plan.id) ?? null,
          title: plan.name,
          totalKcal: Math.round(totalKcal),
          xp_reward: plan.xp_reward,
          type: 'meal' as const,
          isCompleted: completedMealIds.has(plan.id),
          scheduled_time: plan.scheduled_time ? plan.scheduled_time.slice(0, 5) : null,
          scheduled_end_time: plan.scheduled_end_time ? plan.scheduled_end_time.slice(0, 5) : null,
          planItems: (plan.items ?? []).map((item: any) => ({
            id: item.id,
            food_id: item.food_id,
            quantity_grams: item.quantity_grams,
          })),
        };
      });

      const loggedMeals = (foodLogsRes.data ?? [])
        .filter((log: any) => log.source !== 'meal_plan' && !log.meal_plan_id)
        .map((log: any) => {
        const foodObj = Array.isArray(log.food) ? log.food[0] : log.food;
        const totalKcal = Math.round(((foodObj?.calories_per_100g ?? 0) * (log.quantity_grams ?? 0)) / 100);
        const loggedAt = new Date(log.logged_at);

        return {
          id: `food_log_mission_${log.id}`,
          meal_plan_id: `food_log_${log.id}`,
          source: 'food_log' as const,
          title: foodObj?.name ? `${log.meal_type || 'Refeicao'}: ${foodObj.name}` : (log.meal_type || 'Refeicao registrada'),
          totalKcal,
          xp_reward: 0,
          type: 'meal' as const,
          isCompleted: true,
          scheduled_time: loggedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          scheduled_end_time: null,
        };
        });

      const completedHabitIds = (completionsRes.data ?? []).map((c) => c.habit_id);

      updateHabitsState(habitsRes.data ?? []);
      updateCompletedState(new Set(completedHabitIds));
      setWorkoutMissions(computedWorkouts);
      updateMealMissionsState([...computedMeals, ...loggedMeals]);

      // Persiste no localStorage do usuário
      localStorage.setItem(`ascend_habits_${user.id}`, JSON.stringify(habitsRes.data ?? []));
      localStorage.setItem(`ascend_completed_${user.id}`, JSON.stringify(completedHabitIds));
      localStorage.setItem(`ascend_workouts_${user.id}`, JSON.stringify(computedWorkouts));
      localStorage.setItem(`ascend_meals_${user.id}`, JSON.stringify([...computedMeals, ...loggedMeals]));
    } catch (err: any) {
      console.error('Erro ao buscar dados de hábitos e missões:', err);
      if (active) {
        setError(err.message || String(err));
      }
    } finally {
      if (active) {
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const toggleCompletion = async (habitId: string) => {
    if (!user) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const done = completedToday.has(habitId);

    if (done) {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('completed_date', todayStr());

      if (!error) {
        updateCompletedState((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
        const xpResult = await addXp(-normalizeActivityXp(habit.xp_reward), user.id, {
          eventId: `habit:${habit.id}:${todayStr()}`,
        });
        if (habit.stat_target) await updateStat(habit.stat_target, -habit.stat_reward, user.id);
        
        // Reverter dano no boss com base na categoria
        const bossStore = useBossStore.getState();
        if (xpResult.awardedXp < 0) {
          await bossStore.attackActiveBoss(user.id, xpResult.awardedXp, habit.category);
        }
      }
    } else {
      const { error } = await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: todayStr(),
      });

      if (!error) {
        updateCompletedState((prev) => new Set([...prev, habitId]));
        const xpResult = await addXp(normalizeActivityXp(habit.xp_reward), user.id, {
          eventId: `habit:${habit.id}:${todayStr()}`,
        });
        if (habit.stat_target) await updateStat(habit.stat_target, habit.stat_reward, user.id);
        
        // Causar dano no boss com base na categoria
        const bossStore = useBossStore.getState();
        if (xpResult.awardedXp > 0) {
          await bossStore.attackActiveBoss(user.id, xpResult.awardedXp, habit.category);
        }
      }
    }
  };

  const toggleMealMission = async (mealPlanId: string) => {
    if (!user) return;
    const mission = mealMissions.find((m) => m.meal_plan_id === mealPlanId);
    if (!mission) return;
    if (mission.source === 'food_log') return;

    const done = mission.isCompleted;

    if (done) {
      const { data: deletedCompletions, error } = await supabase
        .from('meal_completions')
        .delete()
        .eq('meal_plan_id', mealPlanId)
        .eq('user_id', user.id)
        .eq('completed_at', todayStr())
        .select('id');

      if (!error) {
        updateMealMissionsState((prev) => prev.map(m => m.meal_plan_id === mealPlanId
          ? { ...m, isCompleted: false, completionId: null }
          : m));
        if ((deletedCompletions ?? []).length > 0) {
          const bossStore = useBossStore.getState();
          await bossStore.attackActiveBoss(user.id, -MEAL_BOSS_DAMAGE, 'nutrition');
        }
      } else {
        setError(error.message);
      }
    } else {
      const { data: completion, error } = await supabase
        .from('meal_completions')
        .insert({
          meal_plan_id: mealPlanId,
          user_id: user.id,
          completed_at: todayStr(),
        })
        .select('id')
        .single();

      if (!error && completion) {
        const logs = (mission.planItems ?? []).map(item => ({
          user_id: user.id,
          food_id: item.food_id,
          quantity_grams: item.quantity_grams,
          meal_type: mission.title,
          source: 'meal_plan',
          meal_plan_id: mealPlanId,
          meal_plan_item_id: item.id,
          meal_completion_id: completion.id,
        }));

        if (logs.length > 0) {
          const { error: logError } = await supabase.from('food_logs').insert(logs);
          if (logError) {
            await supabase.from('meal_completions').delete().eq('id', completion.id);
            setError(`Não foi possível sincronizar a refeição com o diário: ${logError.message}`);
            return;
          }
        }

        updateMealMissionsState((prev) => prev.map(m => m.meal_plan_id === mealPlanId
          ? { ...m, isCompleted: true, completionId: completion.id }
          : m));
        const bossStore = useBossStore.getState();
        await bossStore.attackActiveBoss(user.id, MEAL_BOSS_DAMAGE, 'nutrition');
      } else if (error) {
        setError(error.message);
      }
    }
  };

  const createHabit = async (input: CreateHabitInput) => {
    if (!user) return { error: 'Not authenticated' };
    
    // Sanitização completa do payload para evitar propriedades 'undefined' indesejadas no Supabase
    const payload: any = {
      title: input.title,
      category: input.category,
      category_color: input.category_color,
      xp_reward: normalizeActivityXp(input.xp_reward),
      stat_target: input.stat_target,
      stat_reward: input.stat_reward,
      user_id: user.id,
      active: true,
      is_optional: input.is_optional ?? false,
      scheduled_time: input.scheduled_time && input.scheduled_time.trim() !== "" ? input.scheduled_time : null,
      scheduled_end_time: input.scheduled_end_time && input.scheduled_end_time.trim() !== "" ? input.scheduled_end_time : null,
      scheduled_days: input.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6],
    };

    const { data, error } = await supabase
      .from('habits')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar hábito no Supabase:', error);
      return { error: error.message };
    }

    if (data) {
      updateHabitsState((prev) => [...prev, data]);
    }
    return { error: null };
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (!error) updateHabitsState((prev) => prev.filter((h) => h.id !== habitId));
  };

  const updateHabit = async (habitId: string, input: CreateHabitInput) => {
    if (!user) return { error: 'Usuário não autenticado.' };

    const payload = {
      title: input.title,
      category: input.category,
      category_color: input.category_color,
      xp_reward: normalizeActivityXp(input.xp_reward),
      stat_target: input.stat_target,
      stat_reward: input.stat_reward,
      is_optional: input.is_optional ?? false,
      scheduled_time: input.scheduled_time?.trim() || null,
      scheduled_end_time: input.scheduled_end_time?.trim() || null,
      scheduled_days: input.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6],
    };

    const { data, error } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', habitId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      updateHabitsState((prev) => prev.map((habit) => (habit.id === habitId ? data : habit)));
    }

    return { error: error?.message ?? null };
  };

  const toggleActive = async (habitId: string) => {
    if (!user) return;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;
    const { error } = await supabase
      .from('habits')
      .update({ active: !habit.active })
      .eq('id', habitId);
    if (!error)
      updateHabitsState((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, active: !h.active } : h))
      );
  };

  const updateScheduledDays = async (id: string, days: number[]) => {
    if (!user) return;
    const { error } = await supabase
      .from('habits')
      .update({ scheduled_days: days })
      .eq('id', id);
    if (!error) {
      updateHabitsState((prev) =>
        prev.map((h) => (h.id === id ? { ...h, scheduled_days: days } : h))
      );
    }
  };

  const updateScheduledTime = async (id: string, type: 'habit' | 'workout' | 'meal', field: 'start' | 'end', time: string | null) => {
    if (!user) return;
    
    let table = '';
    if (type === 'habit') table = 'habits';
    else if (type === 'workout') table = 'workout_routines';
    else if (type === 'meal') table = 'meal_plans';
    
    // Ensure time has seconds for Postgres TIME type if not null
    const formattedTime = time && time.length === 5 ? `${time}:00` : time;
    const updatePayload = field === 'start' ? { scheduled_time: formattedTime } : { scheduled_end_time: formattedTime };
    
    const { error } = await supabase
      .from(table)
      .update(updatePayload)
      .eq('id', id);
      
    if (!error) {
      if (type === 'habit') {
        updateHabitsState((prev) => prev.map((h) => (h.id === id ? { ...h, ...updatePayload } : h)));
      } else if (type === 'workout') {
        setWorkoutMissions((prev) => prev.map((m) => (m.routine_id === id ? { ...m, ...(field === 'start' ? { scheduled_time: formattedTime ? formattedTime.slice(0, 5) : null } : { scheduled_end_time: formattedTime ? formattedTime.slice(0, 5) : null }) } : m)));
      } else if (type === 'meal') {
        updateMealMissionsState((prev) => prev.map((m) => (m.meal_plan_id === id ? { ...m, ...(field === 'start' ? { scheduled_time: formattedTime ? formattedTime.slice(0, 5) : null } : { scheduled_end_time: formattedTime ? formattedTime.slice(0, 5) : null }) } : m)));
      }
    }
  };

  const activeHabits = habits.filter((h) => {
    if (!h.active) return false;
    const dayOfWeek = todayDayOfWeek();
    // Se scheduled_days for nulo ou vazio, é ativo em todos os dias
    if (!h.scheduled_days || h.scheduled_days.length === 0) return true;
    
    // Comparação resiliente convertendo os tipos para evitar conflito string vs number
    return h.scheduled_days.map(Number).includes(Number(dayOfWeek));
  });
  const completedCount = activeHabits.filter((h) => completedToday.has(h.id)).length;
  const totalActive = activeHabits.filter((h) => !h.is_optional || completedToday.has(h.id)).length;
  const xpEarnedToday = activeHabits
    .filter((h) => completedToday.has(h.id))
    .reduce((acc, h) => acc + h.xp_reward, 0);

  return {
    habits,
    activeHabits,
    completedToday,
    completedCount,
    totalActive,
    xpEarnedToday,
    loading,
    error,
    workoutMissions,
    mealMissions,
    toggleCompletion,
    toggleMealMission,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleActive,
    updateScheduledTime,
    updateScheduledDays,
    refetch: fetchAll,
  };
}
