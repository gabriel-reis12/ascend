export type NutritionGoal = 'lose' | 'maintain' | 'gain';

export interface NutritionProfile {
  birthday?: string | null;
  gender?: string | null;
  height?: number | null;
  weightCurrent?: number | null;
  nutritionGoal?: string | null;
}

export interface NutritionTargets {
  goal: NutritionGoal;
  goalLabel: string;
  bmr: number | null;
  maintenanceCalories: number | null;
  targetCalories: number | null;
  toleranceCalories: number | null;
  minCalories: number | null;
  maxCalories: number | null;
  activityFactor: number;
  adjustmentPercent: number;
  missingFields: string[];
}

const ACTIVITY_FACTOR = 1.2;

export function normalizeNutritionGoal(goal: string | null | undefined): NutritionGoal {
  if (goal === 'lose' || goal === 'gain' || goal === 'maintain') return goal;
  return 'maintain';
}

export function nutritionGoalLabel(goal: string | null | undefined) {
  const normalized = normalizeNutritionGoal(goal);
  if (normalized === 'lose') return 'Perder peso';
  if (normalized === 'gain') return 'Ganhar peso';
  return 'Manter peso';
}

export function calculateAge(birthday: string) {
  const birthDate = new Date(`${birthday}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

export function calculateBmr(profile: NutritionProfile) {
  if (!profile.birthday || !profile.gender || !profile.height || !profile.weightCurrent) {
    return null;
  }

  const age = calculateAge(profile.birthday);
  const base = 10 * profile.weightCurrent + 6.25 * profile.height - 5 * age;
  return Math.round(profile.gender === 'female' ? base - 161 : base + 5);
}

export function calculateNutritionTargets(profile: NutritionProfile): NutritionTargets {
  const goal = normalizeNutritionGoal(profile.nutritionGoal);
  const bmr = calculateBmr(profile);
  const missingFields = [
    !profile.birthday ? 'data de nascimento' : null,
    !profile.gender ? 'genero' : null,
    !profile.height ? 'altura' : null,
    !profile.weightCurrent ? 'peso atual' : null,
  ].filter(Boolean) as string[];

  if (!bmr) {
    return {
      goal,
      goalLabel: nutritionGoalLabel(goal),
      bmr: null,
      maintenanceCalories: null,
      targetCalories: null,
      toleranceCalories: null,
      minCalories: null,
      maxCalories: null,
      activityFactor: ACTIVITY_FACTOR,
      adjustmentPercent: 0,
      missingFields,
    };
  }

  const maintenanceCalories = Math.round(bmr * ACTIVITY_FACTOR);
  const adjustmentPercent = goal === 'lose' ? -0.15 : goal === 'gain' ? 0.1 : 0;
  const targetCalories = Math.round(maintenanceCalories * (1 + adjustmentPercent));
  const toleranceCalories = Math.max(150, Math.round(targetCalories * 0.1));

  return {
    goal,
    goalLabel: nutritionGoalLabel(goal),
    bmr,
    maintenanceCalories,
    targetCalories,
    toleranceCalories,
    minCalories: Math.max(0, targetCalories - toleranceCalories),
    maxCalories: targetCalories + toleranceCalories,
    activityFactor: ACTIVITY_FACTOR,
    adjustmentPercent,
    missingFields,
  };
}
