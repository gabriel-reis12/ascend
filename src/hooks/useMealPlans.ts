import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';

export interface MealPlanItem {
  id: string;
  meal_plan_id: string;
  food_id: string;
  quantity_grams: number;
  food?: {
    id: string;
    name: string;
    calories_per_100g: number;
    protein_per_100g: number;
    carbs_per_100g: number;
    fat_per_100g: number;
    category: string;
    serving_size?: number;
    serving_unit?: string;
  };
}

export interface MealPlan {
  id: string;
  user_id: string;
  name: string;
  order_index: number;
  is_active: boolean;
  xp_reward: number;
  created_at: string;
  items?: MealPlanItem[];
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function calcMealMacros(items: MealPlanItem[]) {
  return items.reduce(
    (acc, item) => {
      if (!item.food) return acc;
      const ratio = item.quantity_grams / 100;
      return {
        kcal: acc.kcal + item.food.calories_per_100g * ratio,
        protein: acc.protein + item.food.protein_per_100g * ratio,
        carbs: acc.carbs + item.food.carbs_per_100g * ratio,
        fat: acc.fat + item.food.fat_per_100g * ratio,
      };
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function useMealPlans() {
  const { user } = useAuth();
  const { addXp, updateStat } = useHunterStore();

  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [completedToday, setCompletedToday] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const today = todayStr();

    const [{ data: plansData }, { data: completionsData }] =
      await Promise.all([
        supabase
          .from('meal_plans')
          .select(`
            *,
            items:meal_plan_items(
              *,
              food:foods(id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, serving_size, serving_unit)
            )
          `)
          .eq('user_id', user.id)
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('meal_completions')
          .select('meal_plan_id')
          .eq('user_id', user.id)
          .eq('completed_at', today),
      ]);

    setMealPlans((plansData as MealPlan[]) ?? []);
    setCompletedToday(new Set((completionsData ?? []).map((c) => c.meal_plan_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const toggleCompletion = async (mealPlanId: string) => {
    if (!user) return;
    const plan = mealPlans.find((p) => p.id === mealPlanId);
    if (!plan) return;

    const done = completedToday.has(mealPlanId);

    if (done) {
      const { error } = await supabase
        .from('meal_completions')
        .delete()
        .eq('meal_plan_id', mealPlanId)
        .eq('user_id', user.id)
        .eq('completed_at', todayStr());

      if (!error) {
        setCompletedToday((prev) => {
          const next = new Set(prev);
          next.delete(mealPlanId);
          return next;
        });
        addXp(-plan.xp_reward, user.id);
        updateStat('vitality', -1);
      }
    } else {
      const { error } = await supabase.from('meal_completions').insert({
        meal_plan_id: mealPlanId,
        user_id: user.id,
        completed_at: todayStr(),
      });

      if (!error) {
        setCompletedToday((prev) => new Set([...prev, mealPlanId]));
        addXp(plan.xp_reward, user.id);
        updateStat('vitality', 1);
      }
    }
  };

  const createMealPlan = async (name: string, xpReward = 15) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('meal_plans')
      .insert({ user_id: user.id, name, xp_reward: xpReward, order_index: mealPlans.length })
      .select()
      .single();
    if (!error && data) {
      setMealPlans((prev) => [...prev, { ...data, items: [] }]);
      return data as MealPlan;
    }
    return null;
  };

  const deleteMealPlan = async (mealPlanId: string) => {
    if (!user) return;
    const { error } = await supabase.from('meal_plans').delete().eq('id', mealPlanId);
    if (!error) setMealPlans((prev) => prev.filter((p) => p.id !== mealPlanId));
  };

  const updateMealPlan = async (mealPlanId: string, updates: Partial<Pick<MealPlan, 'name' | 'xp_reward' | 'is_active'>>) => {
    if (!user) return;
    const { error } = await supabase.from('meal_plans').update(updates).eq('id', mealPlanId);
    if (!error) {
      setMealPlans((prev) => prev.map((p) => (p.id === mealPlanId ? { ...p, ...updates } : p)));
    }
  };

  const addItemToMeal = async (mealPlanId: string, foodId: string, quantityGrams: number) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('meal_plan_items')
      .insert({ meal_plan_id: mealPlanId, food_id: foodId, quantity_grams: quantityGrams })
      .select('*, food:foods(id, name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, category, serving_size, serving_unit)')
      .single();
    if (!error && data) {
      setMealPlans((prev) =>
        prev.map((p) =>
          p.id === mealPlanId ? { ...p, items: [...(p.items ?? []), data] } : p
        )
      );
    }
  };

  const removeItemFromMeal = async (itemId: string, mealPlanId: string) => {
    if (!user) return;
    const { error } = await supabase.from('meal_plan_items').delete().eq('id', itemId);
    if (!error) {
      setMealPlans((prev) =>
        prev.map((p) =>
          p.id === mealPlanId ? { ...p, items: (p.items ?? []).filter((i) => i.id !== itemId) } : p
        )
      );
    }
  };

  const activeMealPlans = mealPlans.filter((p) => p.is_active);
  const totalKcalToday = activeMealPlans
    .filter((p) => completedToday.has(p.id))
    .reduce((acc, p) => acc + calcMealMacros(p.items ?? []).kcal, 0);

  return {
    mealPlans,
    activeMealPlans,
    completedToday,
    loading,
    totalKcalToday,
    toggleCompletion,
    createMealPlan,
    deleteMealPlan,
    updateMealPlan,
    addItemToMeal,
    removeItemFromMeal,
    refetch: fetchAll,
  };
}
