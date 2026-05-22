import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  category: string;
  category_color: string;
  xp_reward: number;
  stat_target: 'strength' | 'intelligence' | 'endurance' | 'vitality' | 'discipline' | null;
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
  title: string;
  totalKcal: number;
  xp_reward: number;
  type: 'meal';
  isCompleted: boolean;
  scheduled_time: string | null;
  scheduled_end_time: string | null;
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
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

  // Missões de treino dinâmicas (rotinas agendadas para hoje)
  const [workoutMissions, setWorkoutMissions] = useState<WorkoutMission[]>([]);
  // Missões de refeição (cardápios ativos — todos os dias)
  const [mealMissions, setMealMissions] = useState<MealMission[]>([]);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = todayStr();
    const dayOfWeek = todayDayOfWeek();

    const [
      { data: habitsData },
      { data: completionsData },
      { data: routinesData },
      { data: routineCompletionsData },
      { data: mealPlansData },
      { data: mealCompletionsData },
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
        .select('id, name, xp_reward, is_active, scheduled_time, scheduled_end_time')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true }),
      supabase
        .from('meal_completions')
        .select('meal_plan_id')
        .eq('user_id', user.id)
        .eq('completed_at', today),
    ]);

    // Busca os itens dos cardápios (depende dos IDs acima)
    const mealPlanIds = (mealPlansData ?? []).map((p: { id: string }) => p.id);
    const { data: mealItemsData } = mealPlanIds.length > 0
      ? await supabase
          .from('meal_plan_items')
          .select('meal_plan_id, quantity_grams, food:foods(calories_per_100g)')
          .in('meal_plan_id', mealPlanIds)
      : { data: [] };

    setHabits(habitsData ?? []);
    setCompletedToday(new Set((completionsData ?? []).map((c) => c.habit_id)));

    // Injeta as rotinas de treino agendadas para hoje como missões
    const completedRoutineIds = new Set((routineCompletionsData ?? []).map((rc) => rc.routine_id));
    const todayRoutines = (routinesData ?? []).filter(
      (r) => Array.isArray(r.scheduled_days) && r.scheduled_days.includes(dayOfWeek)
    );

    setWorkoutMissions(
      todayRoutines.map((r: any) => {
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
          xp_reward: isCardio ? 40 : 50,
          stat_target: isCardio ? 'endurance' as const : 'strength' as const,
          stat_reward: 2,
        };
      })
    );

    // Injeta cardápios ativos como missões de refeição (todos os dias)
    const completedMealIds = new Set((mealCompletionsData ?? []).map((mc: { meal_plan_id: string }) => mc.meal_plan_id));
    const mealKcalMap: Record<string, number> = {};
    ((mealItemsData as any) ?? []).forEach((item: any) => {
      const foodObj = Array.isArray(item.food) ? item.food[0] : item.food;
      const kcal = ((foodObj?.calories_per_100g ?? 0) * (item.quantity_grams ?? 0)) / 100;
      mealKcalMap[item.meal_plan_id] = (mealKcalMap[item.meal_plan_id] ?? 0) + kcal;
    });

    setMealMissions(
      (mealPlansData ?? []).map((plan: { id: string; name: string; xp_reward: number; scheduled_time: string | null; scheduled_end_time: string | null }) => ({
        id: `meal_mission_${plan.id}`,
        meal_plan_id: plan.id,
        title: plan.name,
        totalKcal: Math.round(mealKcalMap[plan.id] ?? 0),
        xp_reward: plan.xp_reward,
        type: 'meal' as const,
        isCompleted: completedMealIds.has(plan.id),
        scheduled_time: plan.scheduled_time ? plan.scheduled_time.slice(0, 5) : null,
        scheduled_end_time: plan.scheduled_end_time ? plan.scheduled_end_time.slice(0, 5) : null,
      }))
    );

    setLoading(false);
  }, [user]);

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
        setCompletedToday((prev) => {
          const next = new Set(prev);
          next.delete(habitId);
          return next;
        });
        addXp(-habit.xp_reward, user.id);
        if (habit.stat_target) updateStat(habit.stat_target, -habit.stat_reward);
      }
    } else {
      const { error } = await supabase.from('habit_completions').insert({
        habit_id: habitId,
        user_id: user.id,
        completed_date: todayStr(),
      });

      if (!error) {
        setCompletedToday((prev) => new Set([...prev, habitId]));
        addXp(habit.xp_reward, user.id);
        if (habit.stat_target) updateStat(habit.stat_target, habit.stat_reward);
      }
    }
  };

  const toggleMealMission = async (mealPlanId: string) => {
    if (!user) return;
    const mission = mealMissions.find((m) => m.meal_plan_id === mealPlanId);
    if (!mission) return;

    const done = mission.isCompleted;

    if (done) {
      const { error } = await supabase
        .from('meal_completions')
        .delete()
        .eq('meal_plan_id', mealPlanId)
        .eq('user_id', user.id)
        .eq('completed_at', todayStr());

      if (!error) {
        setMealMissions((prev) => prev.map(m => m.meal_plan_id === mealPlanId ? { ...m, isCompleted: false } : m));
        updateStat('vitality', -1);
        addXp(-mission.xp_reward, user.id);
      }
    } else {
      const { error } = await supabase.from('meal_completions').insert({
        meal_plan_id: mealPlanId,
        user_id: user.id,
        completed_at: todayStr(),
      });

      if (!error) {
        setMealMissions((prev) => prev.map(m => m.meal_plan_id === mealPlanId ? { ...m, isCompleted: true } : m));
        updateStat('vitality', 1);
        addXp(mission.xp_reward, user.id);
      }
    }
  };

  const createHabit = async (input: CreateHabitInput) => {
    if (!user) return { error: 'Not authenticated' };
    const payload = {
      ...input,
      user_id: user.id,
      scheduled_days: input.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6],
    };
    const { data, error } = await supabase
      .from('habits')
      .insert(payload)
      .select()
      .single();
    if (!error && data) setHabits((prev) => [...prev, data]);
    return { error: error?.message ?? null };
  };

  const deleteHabit = async (habitId: string) => {
    if (!user) return;
    const { error } = await supabase.from('habits').delete().eq('id', habitId);
    if (!error) setHabits((prev) => prev.filter((h) => h.id !== habitId));
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
      setHabits((prev) =>
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
      setHabits((prev) =>
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
        setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updatePayload } : h)));
      } else if (type === 'workout') {
        setWorkoutMissions((prev) => prev.map((m) => (m.routine_id === id ? { ...m, ...(field === 'start' ? { scheduled_time: formattedTime ? formattedTime.slice(0, 5) : null } : { scheduled_end_time: formattedTime ? formattedTime.slice(0, 5) : null }) } : m)));
      } else if (type === 'meal') {
        setMealMissions((prev) => prev.map((m) => (m.meal_plan_id === id ? { ...m, ...(field === 'start' ? { scheduled_time: formattedTime ? formattedTime.slice(0, 5) : null } : { scheduled_end_time: formattedTime ? formattedTime.slice(0, 5) : null }) } : m)));
      }
    }
  };

  const activeHabits = habits.filter((h) => {
    if (!h.active) return false;
    const dayOfWeek = todayDayOfWeek();
    // Se scheduled_days for nulo ou vazio, é ativo em todos os dias
    if (!h.scheduled_days || h.scheduled_days.length === 0) return true;
    return h.scheduled_days.includes(dayOfWeek);
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
    workoutMissions,
    mealMissions,
    toggleCompletion,
    toggleMealMission,
    createHabit,
    deleteHabit,
    toggleActive,
    updateScheduledTime,
    updateScheduledDays,
    refetch: fetchAll,
  };
}
