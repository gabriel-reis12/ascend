export const INITIAL_XP_REQUIREMENT = 300;
export type ProgressionRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';

export function getRankForLevel(level: number): ProgressionRank {
  if (level < 20) return 'E';
  if (level < 40) return 'D';
  if (level < 70) return 'C';
  if (level < 110) return 'B';
  if (level < 160) return 'A';
  if (level < 230) return 'S';
  if (level < 320) return 'National';
  return 'Monarch';
}

export function getXpRequiredForLevel(level: number) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const levelOffset = normalizedLevel - 1;
  return Math.round(
    INITIAL_XP_REQUIREMENT
    + levelOffset * 45
    + Math.pow(levelOffset, 1.38) * 7
  );
}
