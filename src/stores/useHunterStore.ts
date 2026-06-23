import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import {
  DAILY_COMMON_XP_EFFECTIVE_MAX,
  DAILY_COMMON_XP_FULL_CAP,
  DAILY_COMMON_XP_SOFT_RATE,
  getIsoWeekKey,
  getRankForLevel,
  getTotalXpForLevel,
  getXpRequiredForLevel,
  INITIAL_XP_REQUIREMENT,
  MAX_LEVEL,
  WEEKLY_BONUS_XP_CAP,
} from '../lib/progression';

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';
export type HunterClass = 'Warrior' | 'Scholar' | 'Creator' | 'Monk' | 'Leader';
export type HunterGender = 'male' | 'female';
export type XpSource = 'common' | 'bonus';

export interface XpAwardOptions {
  source?: XpSource;
  eventId?: string;
  applyStreakBonus?: boolean;
  checkAchievements?: boolean;
}

export interface XpAwardResult {
  requestedXp: number;
  awardedXp: number;
  source: XpSource;
  capped: boolean;
}

interface XpAwardLedgerEntry {
  amount: number;
  awardedAt: string;
}

export interface HunterStats {
  strength: number;
  intelligence: number;
  endurance: number;
  vitality: number;
  discipline: number;
  wisdom: number;
  balance: number;
}

export interface HunterState {
  level: number;
  xp: number;
  xpRequired: number;
  rank: HunterRank;
  hunterClass: HunterClass | null;
  username: string;
  fullName: string;
  birthday: string;
  gender: HunterGender | null;
  height: number | null;
  weightCurrent: number | null;
  weightTarget: number | null;
  trainingFocus: string | null;
  mainGoal: string | null;
  nutritionGoal: string | null;
  experienceLevel: string | null;
  stats: HunterStats;
  streak: {
    current: number;
    best: number;
  };
  pendingLevelUp: number | null;
  xpGainedToday: number;
  bonusXpGainedWeek: number;
  bonusXpWeekKey: string;
  xpAwardLedger: Record<string, XpAwardLedgerEntry>;
  streakMilestonesClaimed: string[];
  activeTitle: string;

  // Actions
  addXp: (amount: number, userId?: string, options?: XpAwardOptions) => Promise<XpAwardResult>;
  updateStat: (stat: keyof HunterStats, amount: number, userId?: string) => Promise<void>;
  setHunterClass: (hClass: HunterClass, userId?: string) => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  saveProfile: (userId: string) => Promise<void>;
  clearLevelUp: () => void;
  reset: () => void;
  checkStreakMilestones: (userId: string) => Promise<void>;
  checkAchievements: (userId: string) => Promise<void>;
  equipTitle: (title: string, userId: string) => Promise<void>;
}

const INITIAL_STATS: HunterStats = {
  strength: 10,
  intelligence: 10,
  endurance: 10,
  vitality: 10,
  discipline: 10,
  wisdom: 10,
  balance: 10,
};

const INITIAL_STATE = {
  level: 1,
  xp: 0,
  xpRequired: INITIAL_XP_REQUIREMENT,
  rank: 'E' as HunterRank,
  hunterClass: null as HunterClass | null,
  username: '',
  fullName: '',
  birthday: '',
  gender: null as HunterGender | null,
  height: null as number | null,
  weightCurrent: null as number | null,
  weightTarget: null as number | null,
  trainingFocus: null as string | null,
  mainGoal: null as string | null,
  nutritionGoal: 'maintain' as string | null,
  experienceLevel: null as string | null,
  stats: INITIAL_STATS,
  streak: { current: 0, best: 0 },
  pendingLevelUp: null as number | null,
  xpGainedToday: 0,
  bonusXpGainedWeek: 0,
  bonusXpWeekKey: getIsoWeekKey(),
  xpAwardLedger: {} as Record<string, XpAwardLedgerEntry>,
  streakMilestonesClaimed: [] as string[],
  activeTitle: 'Iniciante',
};

const calculateCommonXp = (currentGainedToday: number, amount: number) => {
  let remaining = Math.max(0, amount);
  let addedXp = 0;

  const fullRateCapacity = Math.max(0, DAILY_COMMON_XP_FULL_CAP - currentGainedToday);
  const fullRateAward = Math.min(remaining, fullRateCapacity);
  addedXp += fullRateAward;
  remaining -= fullRateAward;

  const currentAfterFullRate = currentGainedToday + addedXp;
  const softEffectiveCapacity = Math.max(0, DAILY_COMMON_XP_EFFECTIVE_MAX - currentAfterFullRate);
  const softRateAward = Math.min(remaining * DAILY_COMMON_XP_SOFT_RATE, softEffectiveCapacity);
  addedXp += softRateAward;

  return {
    addedXp: Math.round(addedXp),
    newGainedToday: Math.min(
      DAILY_COMMON_XP_EFFECTIVE_MAX,
      Math.round(currentGainedToday + addedXp),
    ),
  };
};

const subtractXp = (state: HunterState, amount: number) => {
  const totalBefore = getTotalXpForLevel(state.level) + state.xp;
  let newLevel = state.level;
  let newXp = state.xp - amount;

  while (newXp < 0 && newLevel > 1) {
    newLevel--;
    newXp += getXpRequiredForLevel(newLevel);
  }

  if (newLevel === 1 && newXp < 0) {
    newXp = 0;
  }

  const totalAfter = getTotalXpForLevel(newLevel) + newXp;

  return {
    xp: newXp,
    level: newLevel,
    xpRequired: getXpRequiredForLevel(newLevel),
    rank: getRankForLevel(newLevel),
    removedXp: Math.max(0, totalBefore - totalAfter),
  };
};

const pruneXpLedger = (ledger: Record<string, XpAwardLedgerEntry>) => {
  const entries = Object.entries(ledger);
  if (entries.length <= 500) return ledger;

  return Object.fromEntries(
    entries
      .sort(([, left], [, right]) => right.awardedAt.localeCompare(left.awardedAt))
      .slice(0, 500),
  );
};

const normalizeStoredProgress = (levelValue: number, xpValue: number) => {
  let level = Math.min(MAX_LEVEL, Math.max(1, Math.floor(levelValue || 1)));
  let xp = Math.max(0, Math.round(xpValue || 0));

  while (level < MAX_LEVEL && xp >= getXpRequiredForLevel(level)) {
    xp -= getXpRequiredForLevel(level);
    level += 1;
  }

  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = Math.min(xp, getXpRequiredForLevel(MAX_LEVEL));
  }

  return {
    level,
    xp,
    xpRequired: getXpRequiredForLevel(level),
    rank: getRankForLevel(level),
  };
};

export const useHunterStore = create<HunterState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addXp: async (amount, userId, options = {}) => {
        const state = get();
        const source = options.source ?? 'common';
        const eventId = options.eventId;
        const requestedXp = Math.round(amount);

        if (!requestedXp) {
          return { requestedXp, awardedXp: 0, source, capped: false };
        }

        if (requestedXp < 0) {
          const ledgerAward = eventId ? state.xpAwardLedger[eventId]?.amount : undefined;
          const requestedRemoval = Math.abs(ledgerAward ?? requestedXp);
          const subtraction = subtractXp(state, requestedRemoval);
          const { removedXp, ...progressAfterRemoval } = subtraction;
          const nextLedger = { ...state.xpAwardLedger };
          if (eventId) delete nextLedger[eventId];

          set({
            ...progressAfterRemoval,
            xpGainedToday: source === 'common'
              ? Math.max(0, state.xpGainedToday - removedXp)
              : state.xpGainedToday,
            bonusXpGainedWeek: source === 'bonus'
              ? Math.max(0, state.bonusXpGainedWeek - removedXp)
              : state.bonusXpGainedWeek,
            xpAwardLedger: nextLedger,
          });

          if (userId) {
            await get().saveProfile(userId);
          }
          return {
            requestedXp,
            awardedXp: -removedXp,
            source,
            capped: removedXp < requestedRemoval,
          };
        }

        if (state.level >= MAX_LEVEL && state.xp >= state.xpRequired) {
          return { requestedXp, awardedXp: 0, source, capped: true };
        }

        if (eventId && state.xpAwardLedger[eventId]) {
          return { requestedXp, awardedXp: 0, source, capped: true };
        }

        const shouldApplyStreakBonus = options.applyStreakBonus ?? source === 'common';
        const streakBonus = shouldApplyStreakBonus ? Math.min(state.streak.current * 0.01, 0.3) : 0;
        const finalAmount = Math.floor(requestedXp * (1 + streakBonus));

        const currentWeekKey = getIsoWeekKey();
        const bonusXpGainedWeek = state.bonusXpWeekKey === currentWeekKey
          ? state.bonusXpGainedWeek
          : 0;

        const xpCalculation = source === 'bonus'
          ? {
              addedXp: Math.min(finalAmount, Math.max(0, WEEKLY_BONUS_XP_CAP - bonusXpGainedWeek)),
              newGainedToday: state.xpGainedToday,
            }
          : calculateCommonXp(state.xpGainedToday, finalAmount);

        const addedXp = Math.max(0, Math.round(xpCalculation.addedXp));
        const newGainedToday = xpCalculation.newGainedToday;

        let newXp = state.xp + addedXp;
        let newLevel = state.level;
        let newXpReq = state.xpRequired;
        let leveledUp = false;

        while (newXp >= newXpReq && newLevel < MAX_LEVEL) {
          newXp -= newXpReq;
          newLevel++;
          newXpReq = getXpRequiredForLevel(newLevel);
          leveledUp = true;
        }

        if (newLevel >= MAX_LEVEL) {
          newLevel = MAX_LEVEL;
          newXpReq = getXpRequiredForLevel(MAX_LEVEL);
          newXp = Math.min(newXp, newXpReq);
        }

        const nextLedger = eventId && addedXp > 0
          ? pruneXpLedger({
              ...state.xpAwardLedger,
              [eventId]: { amount: addedXp, awardedAt: new Date().toISOString() },
            })
          : state.xpAwardLedger;

        set({
          xp: newXp,
          level: newLevel,
          xpRequired: newXpReq,
          rank: getRankForLevel(newLevel),
          pendingLevelUp: leveledUp ? newLevel : state.pendingLevelUp,
          xpGainedToday: newGainedToday,
          bonusXpGainedWeek: source === 'bonus' ? bonusXpGainedWeek + addedXp : bonusXpGainedWeek,
          bonusXpWeekKey: currentWeekKey,
          xpAwardLedger: nextLedger,
        });

        if (userId) {
          await get().saveProfile(userId);
          if (options.checkAchievements ?? source === 'common') {
            await get().checkAchievements(userId);
          }
        }
        return {
          requestedXp,
          awardedXp: addedXp,
          source,
          capped: addedXp < finalAmount,
        };
      },

      clearLevelUp: () => set({ pendingLevelUp: null }),

      updateStat: async (stat, amount, userId) => {
        set((state) => {
          const currentValue = Number(state.stats[stat]) || 0;
          const increment = Number(amount) || 0;
          return {
            stats: {
              ...state.stats,
              [stat]: currentValue + increment,
            },
          };
        });
        if (userId) {
          await get().saveProfile(userId);
        }
      },

      setHunterClass: async (hClass, userId) => {
        set({ hunterClass: hClass });
        if (userId) {
          await supabase
            .from('profiles')
            .update({ class: hClass })
            .eq('id', userId);
        }
      },

      loadProfile: async (userId) => {
        let { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('[useHunterStore] Erro ao carregar profile:', error);
          return;
        }

        if (!data) {
          const { data: createdProfile, error: createProfileError } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              level: 1,
              xp: 0,
              xp_to_next_level: INITIAL_XP_REQUIREMENT,
              rank: 'E',
              strength: 10,
              intelligence: 10,
              endurance: 10,
              vitality: 10,
              discipline: 10,
              wisdom: 10,
              balance: 10,
              streak_current: 0,
              streak_best: 0,
              xp_gained_today: 0,
              streak_milestones_claimed: [],
              title: 'Iniciante',
            }, { onConflict: 'id' })
            .select('*')
            .single();

          if (createProfileError) {
            console.error('[useHunterStore] Erro ao criar profile ausente:', createProfileError);
            return;
          }

          data = createdProfile;
        }

        if (data && !error) {
          const normalizedProgress = normalizeStoredProgress(data.level || 1, data.xp || 0);
          const level = normalizedProgress.level;

          // Lógica robusta e resiliente de cálculo e atualização de Streak diária
          let newStreakCurrent = data.streak_current || 0;
          let newStreakBest = data.streak_best || 0;
          let shouldUpdateProfileInDb = false;

          const now = new Date();
          const todayStr = now.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD local

          let xpGainedToday = data.xp_gained_today || 0;

          let bonusDiscipline = 0;

          if (data.last_check_in) {
            const lastCheckInDate = new Date(data.last_check_in);
            const lastCheckInStr = lastCheckInDate.toLocaleDateString('en-CA');

            if (lastCheckInStr !== todayStr) {
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toLocaleDateString('en-CA');

              // Zerar o XP diário no início de um novo dia
              xpGainedToday = 0;

              if (lastCheckInStr === yesterdayStr) {
                // Caçador consistente: streak mantido e incrementado
                newStreakCurrent += 1;
                if (newStreakCurrent > newStreakBest) {
                  newStreakBest = newStreakCurrent;
                }
                bonusDiscipline = 1;
              } else {
                // Caçador falhou no ciclo anterior: streak resetada
                newStreakCurrent = 1;
              }
              shouldUpdateProfileInDb = true;
            }
          } else {
            // Primeiro check-in da história do caçador
            newStreakCurrent = 1;
            if (newStreakCurrent > newStreakBest) {
              newStreakBest = newStreakCurrent;
            }
            xpGainedToday = 0;
            shouldUpdateProfileInDb = true;
          }

          const currentDiscipline = Number(data.discipline) || 10;
          const updatedDiscipline = currentDiscipline + bonusDiscipline;

          const recalibratedXpRequired = normalizedProgress.xpRequired;
          const recalibratedRank = normalizedProgress.rank;

          set({
            level,
            xp: normalizedProgress.xp,
            xpRequired: recalibratedXpRequired,
            rank: recalibratedRank,
            hunterClass: data.class as HunterClass,
            username: data.username || '',
            fullName: data.full_name || '',
            birthday: data.birthday || '',
            gender: (data.gender as HunterGender) || null,
            height: data.height || null,
            weightCurrent: data.weight_current || null,
            weightTarget: data.weight_target || null,
            trainingFocus: data.training_focus || null,
            mainGoal: data.main_goal || null,
            nutritionGoal: data.nutrition_goal || 'maintain',
            experienceLevel: data.experience_level || null,
            stats: {
              strength: Number(data.strength) || 10,
              intelligence: Number(data.intelligence) || 10,
              endurance: Number(data.endurance) || 10,
              vitality: Number(data.vitality) || 10,
              discipline: updatedDiscipline,
              wisdom: Number(data.wisdom) || 10,
              balance: Number(data.balance) || 10,
            },
            streak: {
              current: newStreakCurrent,
              best: newStreakBest,
            },
            xpGainedToday: Math.min(DAILY_COMMON_XP_EFFECTIVE_MAX, xpGainedToday),
            streakMilestonesClaimed: data.streak_milestones_claimed || [],
            activeTitle: data.title || 'Iniciante',
          });

          if (
            shouldUpdateProfileInDb
            || data.xp_to_next_level !== recalibratedXpRequired
            || data.rank !== recalibratedRank
          ) {
            await supabase
              .from('profiles')
              .update({
                streak_current: newStreakCurrent,
                streak_best: newStreakBest,
                last_check_in: now.toISOString(),
                xp_gained_today: Math.min(DAILY_COMMON_XP_EFFECTIVE_MAX, xpGainedToday),
                level,
                xp: normalizedProgress.xp,
                discipline: updatedDiscipline,
                xp_to_next_level: recalibratedXpRequired,
                rank: recalibratedRank,
              })
              .eq('id', userId);
          }

          // Verificar streaks e conquistas após carregar
          await get().checkStreakMilestones(userId);
          await get().checkAchievements(userId);

          // Carregar batalha de boss ativa em segundo plano para o caçador
          void import('./useBossStore').then(({ useBossStore }) => {
            void useBossStore.getState().loadActiveBattle(userId);
          });
        }
      },

      saveProfile: async (userId) => {
        const state = get();
        await supabase
          .from('profiles')
          .update({
            level: state.level,
            xp: state.xp,
            xp_to_next_level: state.xpRequired,
            rank: state.rank,
            class: state.hunterClass,
            full_name: state.fullName,
            birthday: state.birthday || null,
            gender: state.gender || null,
            height: state.height || null,
            weight_current: state.weightCurrent || null,
            weight_target: state.weightTarget || null,
            training_focus: state.trainingFocus || null,
            main_goal: state.mainGoal || null,
            nutrition_goal: state.nutritionGoal || 'maintain',
            experience_level: state.experienceLevel || null,
            strength: state.stats.strength,
            intelligence: state.stats.intelligence,
            endurance: state.stats.endurance,
            vitality: state.stats.vitality,
            discipline: state.stats.discipline,
            wisdom: state.stats.wisdom,
            balance: state.stats.balance,
            streak_current: state.streak.current,
            streak_best: state.streak.best,
            xp_gained_today: state.xpGainedToday,
            streak_milestones_claimed: state.streakMilestonesClaimed,
            title: state.activeTitle,
          })
          .eq('id', userId);
      },

      checkStreakMilestones: async (userId) => {
        const state = get();
        const streakDays = state.streak.current;
        const claimed = [...state.streakMilestonesClaimed];
        let changed = false;

        const milestones = [
          { key: '3d', days: 3, title: 'Iniciante da Consistência', desc: 'Mantenha uma streak de 3 dias seguidos', icon: 'Flame', xp: 30 },
          { key: '7d', days: 7, title: 'Guerreiro Diário', desc: 'Mantenha uma streak de 7 dias seguidos', icon: 'Calendar', xp: 70 },
          { key: '15d', days: 15, title: 'Mestre da Rotina', desc: 'Mantenha uma streak de 15 dias seguidos', icon: 'Shield', xp: 140 },
          { key: '30d', days: 30, title: 'Lenda Ativa', desc: 'Mantenha uma streak de 30 dias seguidos', icon: 'Crown', xp: 250 }
        ];

        for (const m of milestones) {
          if (streakDays >= m.days && !claimed.includes(m.key)) {
            claimed.push(m.key);
            changed = true;

            // Inserir conquista no banco
            await supabase
              .from('achievements')
              .insert({
                user_id: userId,
                title: m.title,
                description: m.desc,
                icon: m.icon,
                unlocked_at: new Date().toISOString()
              });

            // Conceder XP
            await get().addXp(m.xp, userId, {
              source: 'bonus',
              eventId: `streak:${userId}:${m.key}`,
              applyStreakBonus: false,
              checkAchievements: false,
            });
          }
        }

        if (changed) {
          set({ streakMilestonesClaimed: claimed });
          await supabase
            .from('profiles')
            .update({ streak_milestones_claimed: claimed })
            .eq('id', userId);
        }
      },

      checkAchievements: async (userId) => {
        const state = get();
        
        // Carregar conquistas atuais para evitar duplicados
        const { data: existingAch } = await supabase
          .from('achievements')
          .select('title')
          .eq('user_id', userId);
          
        const existingTitles = existingAch ? existingAch.map(a => a.title) : [];

        const attrMilestones = [
          { attr: 'strength', val: state.stats.strength, title: 'Força Absoluta', desc: 'Alcance 20 pontos de Força', icon: 'Sword', xp: 50 },
          { attr: 'intelligence', val: state.stats.intelligence, title: 'Mente Brilhante', desc: 'Alcance 20 pontos de Inteligência', icon: 'Book', xp: 50 },
          { attr: 'endurance', val: state.stats.endurance, title: 'Inquebrável', desc: 'Alcance 20 pontos de Resistência', icon: 'Shield', xp: 50 },
          { attr: 'vitality', val: state.stats.vitality, title: 'Vigor Eterno', desc: 'Alcance 20 pontos de Vitalidade', icon: 'Heart', xp: 50 },
          { attr: 'discipline', val: state.stats.discipline, title: 'Mente de Ferro', desc: 'Alcance 20 pontos de Disciplina', icon: 'Brain', xp: 50 },
          { attr: 'wisdom', val: state.stats.wisdom, title: 'Olhar Aguçado', desc: 'Alcance 20 pontos de Sabedoria', icon: 'Compass', xp: 50 },
          { attr: 'balance', val: state.stats.balance, title: 'Zenith', desc: 'Alcance 20 pontos de Equilíbrio', icon: 'Scale', xp: 50 },
        ];

        for (const am of attrMilestones) {
          if (am.val >= 20 && !existingTitles.includes(am.title)) {
            await supabase
              .from('achievements')
              .insert({
                user_id: userId,
                title: am.title,
                description: am.desc,
                icon: am.icon,
                unlocked_at: new Date().toISOString()
              });
              
            await get().addXp(am.xp, userId, {
              source: 'bonus',
              eventId: `achievement:${userId}:${am.attr}:20`,
              applyStreakBonus: false,
              checkAchievements: false,
            });
          }
        }
      },

      equipTitle: async (titleName, userId) => {
        set({ activeTitle: titleName });
        if (userId) {
          await supabase
            .from('profiles')
            .update({ title: titleName })
            .eq('id', userId);
        }
      },

      reset: () => set(INITIAL_STATE),
    }),
    {
      name: 'hunter-storage',
      version: 4,
      migrate: (persistedState) => {
        const persisted = persistedState as Partial<HunterState>;
        const normalizedProgress = normalizeStoredProgress(
          Number(persisted.level) || 1,
          Number(persisted.xp) || 0,
        );
        return {
          ...persisted,
          ...normalizedProgress,
          xpGainedToday: Math.min(
            DAILY_COMMON_XP_EFFECTIVE_MAX,
            Number(persisted.xpGainedToday) || 0,
          ),
          bonusXpGainedWeek: persisted.bonusXpWeekKey === getIsoWeekKey()
            ? Number(persisted.bonusXpGainedWeek) || 0
            : 0,
          bonusXpWeekKey: getIsoWeekKey(),
          xpAwardLedger: persisted.xpAwardLedger || {},
        };
      },
    }
  )
);
