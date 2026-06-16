import { supabase } from './supabase';
import { localDateString, localDayBounds } from './date';
import { calculateNutritionTargets } from './nutritionTargets';

interface ProfileForNutrition {
  birthday: string | null;
  gender: string | null;
  height: number | null;
  weight_current: number | null;
  nutrition_goal: string | null;
}

interface AwardHandlers {
  addXp: (amount: number, userId?: string) => Promise<void>;
  updateStat: (stat: 'vitality', amount: number, userId?: string) => Promise<void>;
  attackBoss: (userId: string, amount: number, actionType: string) => Promise<void>;
}

const SUCCESS_XP = 60;
const SUCCESS_VITALITY = 2;
const FAILURE_XP = -20;

function previousLocalDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

export async function evaluateYesterdayNutrition(userId: string, handlers: AwardHandlers) {
  const date = previousLocalDate();
  const dateKey = localDateString(date);

  const { data: existing, error: existingError } = await supabase
    .from('nutrition_daily_scores')
    .select('id')
    .eq('user_id', userId)
    .eq('date', dateKey)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('birthday, gender, height, weight_current, nutrition_goal')
    .eq('id', userId)
    .single();

  if (profileError) throw profileError;

  const profileData = profile as ProfileForNutrition;
  const targets = calculateNutritionTargets({
    birthday: profileData.birthday,
    gender: profileData.gender,
    height: profileData.height,
    weightCurrent: profileData.weight_current,
    nutritionGoal: profileData.nutrition_goal,
  });

  if (!targets.bmr || !targets.targetCalories || !targets.toleranceCalories) return;

  const { startIso, endIso } = localDayBounds(date);

  const { data: logs, error: logsError } = await supabase
    .from('food_logs')
    .select('quantity_grams, food:foods(calories_per_100g)')
    .eq('user_id', userId)
    .gte('logged_at', startIso)
    .lte('logged_at', endIso);

  if (logsError) throw logsError;

  const totalCalories = Math.round(
    (logs ?? []).reduce((sum: number, log: any) => {
      const food = Array.isArray(log.food) ? log.food[0] : log.food;
      return sum + ((food?.calories_per_100g ?? 0) * (log.quantity_grams ?? 0)) / 100;
    }, 0)
  );

  const success = Math.abs(totalCalories - targets.targetCalories) <= targets.toleranceCalories;
  const xpAwarded = success ? SUCCESS_XP : FAILURE_XP;
  const statAwarded = success ? SUCCESS_VITALITY : 0;

  const { error: insertError } = await supabase
    .from('nutrition_daily_scores')
    .insert({
      user_id: userId,
      date: dateKey,
      goal: targets.goal,
      bmr: targets.bmr,
      target_calories: targets.targetCalories,
      tolerance_calories: targets.toleranceCalories,
      total_calories: totalCalories,
      success,
      xp_awarded: xpAwarded,
      stat_awarded: statAwarded,
    });

  if (insertError) throw insertError;

  await handlers.addXp(xpAwarded, userId);
  if (statAwarded) await handlers.updateStat('vitality', statAwarded, userId);
  await handlers.attackBoss(userId, xpAwarded, 'nutrition');
}
