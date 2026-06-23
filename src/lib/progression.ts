export const MAX_LEVEL = 100;
export const INITIAL_XP_REQUIREMENT = 100;
export const DAILY_COMMON_XP_FULL_CAP = 180;
export const DAILY_COMMON_XP_SOFT_CAP = 250;
export const DAILY_COMMON_XP_SOFT_RATE = 0.3;
export const DAILY_COMMON_XP_EFFECTIVE_MAX =
  DAILY_COMMON_XP_FULL_CAP
  + Math.round((DAILY_COMMON_XP_SOFT_CAP - DAILY_COMMON_XP_FULL_CAP) * DAILY_COMMON_XP_SOFT_RATE);
export const WEEKLY_BONUS_XP_CAP = 750;
export const MIN_ACTIVITY_XP = 5;
export const MAX_ACTIVITY_XP = 50;

export type ProgressionRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';

export const RANK_PROMOTION_LEVELS: Record<ProgressionRank, number> = {
  E: 20,
  D: 40,
  C: 60,
  B: 75,
  A: 85,
  S: 95,
  National: MAX_LEVEL,
  Monarch: MAX_LEVEL,
};

export const RANK_START_LEVELS: Record<ProgressionRank, number> = {
  E: 1,
  D: 20,
  C: 40,
  B: 60,
  A: 75,
  S: 85,
  National: 95,
  Monarch: MAX_LEVEL,
};

export function getRankForLevel(level: number): ProgressionRank {
  if (level < 20) return 'E';
  if (level < 40) return 'D';
  if (level < 60) return 'C';
  if (level < 75) return 'B';
  if (level < 85) return 'A';
  if (level < 95) return 'S';
  if (level < MAX_LEVEL) return 'National';
  return 'Monarch';
}

export function getXpRequiredForLevel(level: number) {
  const normalizedLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));

  if (normalizedLevel <= 5) {
    return INITIAL_XP_REQUIREMENT + (normalizedLevel - 1) * 25;
  }

  if (normalizedLevel < 20) {
    return 200 + (normalizedLevel - 5) * 30;
  }

  if (normalizedLevel < 40) {
    return 650 + (normalizedLevel - 20) * 45;
  }

  if (normalizedLevel < 60) {
    return 1550 + (normalizedLevel - 40) * 55;
  }

  if (normalizedLevel < 75) {
    return 2650 + (normalizedLevel - 60) * 70;
  }

  if (normalizedLevel < 85) {
    return 3700 + (normalizedLevel - 75) * 85;
  }

  if (normalizedLevel < 95) {
    return 4550 + (normalizedLevel - 85) * 100;
  }

  return 5550 + (normalizedLevel - 95) * 125;
}

export function getTotalXpForLevel(level: number) {
  const normalizedLevel = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level)));
  let total = 0;
  for (let currentLevel = 1; currentLevel < normalizedLevel; currentLevel += 1) {
    total += getXpRequiredForLevel(currentLevel);
  }
  return total;
}

export function normalizeActivityXp(value: number) {
  const numericValue = Number.isFinite(Number(value)) ? Math.round(Number(value)) : MIN_ACTIVITY_XP;
  return Math.min(MAX_ACTIVITY_XP, Math.max(MIN_ACTIVITY_XP, numericValue));
}

export function getIsoWeekKey(date = new Date()) {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${utcDate.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
