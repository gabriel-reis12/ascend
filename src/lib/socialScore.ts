import type { HunterClass, HunterRank } from '@/stores/useHunterStore';

export interface PublicHunterProfile {
  userId: string;
  username: string;
  hunterTag: string;
  hunterClass: HunterClass | null;
  rank: HunterRank;
  level: number;
  activeTitle: string;
  streakCurrent: number;
  featuredAchievements: string[];
  isPublic: boolean;
  allowFriendRequests: boolean;
  includeInGlobalLeaderboard: boolean;
  bio?: string;
  avatarUrl?: string;
}

export interface CompetitiveScoreDetails {
  score: number;
  workoutsScore: number;
  workoutsCount: number;
  habitsScore: number;
  habitsCount: number;
  bossScore: number;
  streakScore: number;
  periodKey: string;
  periodType: 'weekly' | 'monthly';
}

export interface SeasonPeriodInfo {
  type: 'weekly' | 'monthly';
  key: string;
  labelPt: string;
  labelEn: string;
  daysRemaining: number;
  endsAt: string;
}

/**
 * Retorna a chave do período competitivo atual (Semanal ou Mensal) com base no padrão ISO.
 */
export function getCurrentSeasonPeriod(
  type: 'weekly' | 'monthly' = 'weekly',
  refDate: Date = new Date()
): SeasonPeriodInfo {
  if (type === 'monthly') {
    const year = refDate.getFullYear();
    const month = String(refDate.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`;
    
    // Fim do mês corrente
    const endOfMonth = new Date(year, refDate.getMonth() + 1, 0, 23, 59, 59, 999);
    const msRemaining = Math.max(0, endOfMonth.getTime() - refDate.getTime());
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    const monthNamesPt = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      type: 'monthly',
      key,
      labelPt: `Temporada de ${monthNamesPt[refDate.getMonth()]} ${year}`,
      labelEn: `${monthNamesEn[refDate.getMonth()]} ${year} Season`,
      daysRemaining,
      endsAt: endOfMonth.toISOString(),
    };
  }

  // Semanal (ISO 8601)
  const tempDate = new Date(Date.UTC(refDate.getFullYear(), refDate.getMonth(), refDate.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  const key = `${tempDate.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;

  // Fim do domingo da semana corrente
  const currentDayOfWeek = refDate.getDay(); // 0 = Domingo
  const daysUntilSunday = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;
  const endOfWeek = new Date(refDate);
  endOfWeek.setDate(refDate.getDate() + daysUntilSunday);
  endOfWeek.setHours(23, 59, 59, 999);

  const msRemaining = Math.max(0, endOfWeek.getTime() - refDate.getTime());
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return {
    type: 'weekly',
    key,
    labelPt: `Ciclo Semanal #${weekNo} • ${tempDate.getUTCFullYear()}`,
    labelEn: `Weekly Cycle #${weekNo} • ${tempDate.getUTCFullYear()}`,
    daysRemaining,
    endsAt: endOfWeek.toISOString(),
  };
}

/**
 * Calcula a pontuação competitiva da temporada com tetos determinísticos (Caps)
 * para evitar que spam de tarefas crie vantagem desleal nos Leaderboards.
 * 
 * Regras:
 * 1. Treinos: 100 pontos por dia com treino legítimo registrado (Cap: 1 por dia).
 * 2. Hábitos: 20 pontos por hábito único cumprido no dia (Cap: máx 5 hábitos/dia = 100 pts/dia).
 * 3. Raid Semanal: 50 pontos por participação + 150 pontos por vitória de Boss no ciclo.
 * 4. Streak: 10 pontos por dia consecutivo ativo no período (máx 70 pts na semana).
 */
export function calculateCompetitiveScore(params: {
  workoutDates: string[]; // Lista de datas únicas (YYYY-MM-DD) com treino concluído
  habitsPerDay: Record<string, number>; // Mapa de YYYY-MM-DD -> total de hábitos cumpridos
  bossRaidActive: boolean;
  bossDefeatedInPeriod: boolean;
  streakDaysInPeriod: number;
  periodKey?: string;
  periodType?: 'weekly' | 'monthly';
}): CompetitiveScoreDetails {
  const periodType = params.periodType || 'weekly';
  const periodKey = params.periodKey || getCurrentSeasonPeriod(periodType).key;

  // 1. Treinos Concluídos (Cap: 1 por dia -> 100 pts cada)
  const uniqueWorkoutDays = new Set(params.workoutDates).size;
  const maxWorkoutDays = periodType === 'weekly' ? 7 : 31;
  const cappedWorkoutDays = Math.min(uniqueWorkoutDays, maxWorkoutDays);
  const workoutsScore = cappedWorkoutDays * 100;

  // 2. Hábitos Diários (Cap: máx 5 hábitos por dia -> 20 pts cada, máx 100 pts/dia)
  let totalHabitsCount = 0;
  let habitsScore = 0;
  Object.values(params.habitsPerDay).forEach((count) => {
    const validCount = Math.min(Math.max(0, count), 5);
    totalHabitsCount += validCount;
    habitsScore += validCount * 20;
  });

  // 3. Raid de Chefe Semanal
  let bossScore = 0;
  if (params.bossRaidActive) {
    bossScore += 50;
  }
  if (params.bossDefeatedInPeriod) {
    bossScore += 150;
  }

  // 4. Bônus de Streak e Consistência (10 pts por dia)
  const maxStreakBonusDays = periodType === 'weekly' ? 7 : 30;
  const cappedStreakDays = Math.min(Math.max(0, params.streakDaysInPeriod), maxStreakBonusDays);
  const streakScore = cappedStreakDays * 10;

  const totalScore = workoutsScore + habitsScore + bossScore + streakScore;

  return {
    score: totalScore,
    workoutsScore,
    workoutsCount: cappedWorkoutDays,
    habitsScore,
    habitsCount: totalHabitsCount,
    bossScore,
    streakScore,
    periodKey,
    periodType,
  };
}

/**
 * Gera uma Hunter Tag única e amigável determinística (ex: HNT-8924 ou @username).
 */
export function generateHunterTag(username: string, userId: string): string {
  if (!username) {
    username = 'hunter';
  }
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'hunter';
  
  // Deriva um código numérico de 4 dígitos a partir do userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  const code = Math.abs(hash % 9000) + 1000;
  return `${cleanUsername}#${code}`;
}

/**
 * Sanitiza rigorosamente o perfil do caçador para exibição pública,
 * garantindo que dados privados (e-mail, peso, medidas, finanças) NUNCA vazem.
 */
export function sanitizePublicProfile(rawProfile: Record<string, unknown>): PublicHunterProfile {
  const userId = String(rawProfile.id || rawProfile.userId || '');
  const username = String(rawProfile.username || rawProfile.full_name || 'Caçador Anônimo');
  const hunterTag = String(
    rawProfile.hunter_tag || rawProfile.hunterTag || generateHunterTag(username, userId)
  );

  return {
    userId,
    username,
    hunterTag,
    hunterClass: (rawProfile.class || rawProfile.hunterClass || null) as HunterClass | null,
    rank: (rawProfile.rank || 'E') as HunterRank,
    level: Math.max(1, Number(rawProfile.level) || 1),
    activeTitle: String(rawProfile.title || rawProfile.activeTitle || 'Iniciante'),
    streakCurrent: Math.max(0, Number(rawProfile.streak_current || rawProfile.streakCurrent) || 0),
    featuredAchievements: Array.isArray(rawProfile.featured_achievements)
      ? (rawProfile.featured_achievements as string[])
      : Array.isArray(rawProfile.featuredAchievements)
        ? (rawProfile.featuredAchievements as string[])
        : [],
    isPublic: rawProfile.is_public !== undefined ? Boolean(rawProfile.is_public) : true,
    allowFriendRequests:
      rawProfile.allow_friend_requests !== undefined
        ? Boolean(rawProfile.allow_friend_requests)
        : true,
    includeInGlobalLeaderboard:
      rawProfile.include_in_global_leaderboard !== undefined
        ? Boolean(rawProfile.include_in_global_leaderboard)
        : true,
    bio: rawProfile.bio ? String(rawProfile.bio).slice(0, 120) : undefined,
    avatarUrl: rawProfile.avatar_url ? String(rawProfile.avatar_url) : undefined,
  };
}

