import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';
export type HunterClass = 'Warrior' | 'Scholar' | 'Monk' | 'Titan';

export interface HunterStats {
  strength: number;
  intelligence: number;
  endurance: number;
  vitality: number;
  discipline: number;
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
  stats: HunterStats;
  streak: {
    current: number;
    best: number;
  };
  pendingLevelUp: number | null;
  
  // Actions
  addXp: (amount: number, userId?: string) => Promise<void>;
  updateStat: (stat: keyof HunterStats, amount: number) => void;
  setHunterClass: (hClass: HunterClass, userId?: string) => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  saveProfile: (userId: string) => Promise<void>;
  clearLevelUp: () => void;
  reset: () => void;
}

const INITIAL_STATS: HunterStats = {
  strength: 10,
  intelligence: 10,
  endurance: 10,
  vitality: 10,
  discipline: 10,
};

const INITIAL_STATE = {
  level: 1,
  xp: 0,
  xpRequired: 100,
  rank: 'E' as HunterRank,
  hunterClass: null as HunterClass | null,
  username: '',
  fullName: '',
  birthday: '',
  stats: INITIAL_STATS,
  streak: { current: 0, best: 0 },
  pendingLevelUp: null as number | null,
};

const getRankForLevel = (level: number): HunterRank => {
  if (level < 10) return 'E';
  if (level < 20) return 'D';
  if (level < 35) return 'C';
  if (level < 50) return 'B';
  if (level < 70) return 'A';
  if (level < 100) return 'S';
  if (level < 150) return 'National';
  return 'Monarch';
};

/**
 * Calcula o XP necessário para o próximo nível.
 * Curva linear: 100 + (level-1) * 10
 * Total de XP para Level 100: ~60,000 XP
 * Com 150 XP/dia (média de quests + bônus de streak), leva ~400 dias.
 */
const getXpRequiredForLevel = (level: number): number => {
  return 100 + (level - 1) * 10;
};

export const useHunterStore = create<HunterState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addXp: async (amount, userId) => {
        const state = get();
        
        // Bônus de Streak: +2% por dia de streak, limitado a +100%
        const streakBonus = Math.min(state.streak.current * 0.02, 1.0);
        const finalAmount = Math.floor(amount * (1 + streakBonus));
        
        let newXp = state.xp + finalAmount;
        let newLevel = state.level;
        let newXpReq = state.xpRequired;
        let leveledUp = false;

        while (newXp >= newXpReq) {
          newXp -= newXpReq;
          newLevel++;
          newXpReq = getXpRequiredForLevel(newLevel);
          leveledUp = true;
        }

        set({
          xp: newXp,
          level: newLevel,
          xpRequired: newXpReq,
          rank: getRankForLevel(newLevel),
          pendingLevelUp: leveledUp ? newLevel : state.pendingLevelUp,
        });

        if (userId) await get().saveProfile(userId);
      },

      clearLevelUp: () => set({ pendingLevelUp: null }),

      updateStat: (stat, amount) =>
        set((state) => ({
          stats: { ...state.stats, [stat]: state.stats[stat] + amount },
        })),

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
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data && !error) {
          const level = data.level || 1;
          set({
            level: level,
            xp: data.xp || 0,
            xpRequired: data.xp_to_next_level || getXpRequiredForLevel(level),
            rank: (data.rank as HunterRank) || getRankForLevel(level),
            hunterClass: data.class as HunterClass,
            username: data.username || '',
            fullName: data.full_name || '',
            birthday: data.birthday || '',
            stats: {
              strength: data.strength || 10,
              intelligence: data.intelligence || 10,
              endurance: data.endurance || 10,
              vitality: data.vitality || 10,
              discipline: data.discipline || 10,
            },
            streak: {
              current: data.streak_current || 0,
              best: data.streak_best || 0,
            },
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
            strength: state.stats.strength,
            intelligence: state.stats.intelligence,
            endurance: state.stats.endurance,
            vitality: state.stats.vitality,
            discipline: state.stats.discipline,
            streak_current: state.streak.current,
            streak_best: state.streak.best,
          })
          .eq('id', userId);
      },

      reset: () => set(INITIAL_STATE),
    }),
    { name: 'hunter-storage' }
  )
);
