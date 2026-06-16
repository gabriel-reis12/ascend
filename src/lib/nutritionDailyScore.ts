import { supabase } from './supabase';
import { localDateString, localDayBounds } from './date';

type NutritionGoal = 'lose' | 'maintain' | 'gain';

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

function calculateAge(birthday: string) {
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

function normalizeGoal(goal: string | null | undefined): NutritionGoal {
  if (goal === 'lose' || goal === 'gain' || goal === 'maintain') return goal;
  return 'maintain';
}

function calculateBmr(profile: ProfileForNutrition) {
  if (!profile.birthday || !profile.gender || !profile.height || !profile.weight_current) {
    return null;
  }

  const age = calculateAge(profile.birthday);
  const base = 10 * profile.weight_current + 6.25 * profile.height - 5 * age;
  return Math.round(profile.gender === 'female' ? base - 161 : base + 5);
}

function calculateTargetCalories(bmr: number, goal: NutritionGoal) {
  if (goal === 'lose') return Math.max(1200, bmr - 300);
  if (goal === 'gain') return bmr + 300;
  return bmr;
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

  const bmr = calculateBmr(profile as ProfileForNutrition);
  if (!bmr) return;

  const goal = normalizeGoal((profile as ProfileForNutrition).nutrition_goal);
  const targetCalories = calculateTargetCalories(bmr, goal);
  const toleranceCalories = Math.max(150, Math.round(targetCalories * 0.1));
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

  const success = Math.abs(totalCalories - targetCalories) <= toleranceCalories;
  const xpAwarded = success ? SUCCESS_XP : FAILURE_XP;
  const statAwarded = success ? SUCCESS_VITALITY : 0;

  const { error: insertError } = await supabase
    .from('nutrition_daily_scores')
    .insert({
      user_id: userId,
      date: dateKey,
      goal,
      bmr,
      target_calories: targetCalories,
      tolerance_calories: toleranceCalories,
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
