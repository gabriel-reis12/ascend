import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface RPGStats {
  strength: number;
  intelligence: number;
  endurance: number;
  vitality: number;
}

export interface RPGState {
  level: number;
  xp: number;
  xpToNextLevel: number;
  title: string;
  username: string;
  stats: RPGStats;
  pendingLevelUp: number | null;
  addXp: (amount: number, userId?: string) => void;
  updateStat: (stat: keyof RPGStats, amount: number) => void;
  clearLevelUp: () => void;
  loadProfile: (userId: string) => Promise<void>;
  saveProfile: (userId: string) => Promise<void>;
  reset: () => void;
}

const INITIAL_STATE = {
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  title: 'Iniciante',
  username: '',
  stats: { strength: 1, intelligence: 1, endurance: 1, vitality: 1 },
  pendingLevelUp: null,
};

const getTitleForLevel = (level: number): string => {
  if (level < 5) return 'Iniciante';
  if (level < 10) return 'Recruta';
  if (level < 20) return 'Soldado';
  if (level < 30) return 'Guerreiro';
  if (level < 50) return 'Cavaleiro';
  if (level < 75) return 'Campeão';
  return 'Lenda';
};

export const useRPGStore = create<RPGState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addXp: (amount, userId) => {
        set((state) => {
          let newXp = state.xp + amount;
          let newLevel = state.level;
          let newXpToNext = state.xpToNextLevel;
          let leveled = false;

          while (newXp >= newXpToNext) {
            newXp -= newXpToNext;
            newLevel++;
            newXpToNext = Math.floor(newXpToNext * 1.5);
            leveled = true;
          }

          return {
            xp: newXp,
            level: newLevel,
            xpToNextLevel: newXpToNext,
            title: getTitleForLevel(newLevel),
            pendingLevelUp: leveled ? newLevel : state.pendingLevelUp,
          };
        });

        if (userId) get().saveProfile(userId);
      },

      updateStat: (stat, amount) =>
        set((state) => ({
          stats: { ...state.stats, [stat]: state.stats[stat] + amount },
        })),

      clearLevelUp: () => set({ pendingLevelUp: null }),

      loadProfile: async (userId) => {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (data) {
          set({
            level: data.level,
            xp: data.xp,
            xpToNextLevel: data.xp_to_next_level,
            title: data.title,
            username: data.username,
            stats: {
              strength: data.strength,
              intelligence: data.intelligence,
              endurance: data.endurance,
              vitality: data.vitality,
            },
          });
        }
      },

      saveProfile: async (userId) => {
        const { level, xp, xpToNextLevel, title, stats } = get();
        await supabase
          .from('profiles')
          .update({
            level,
            xp,
            xp_to_next_level: xpToNextLevel,
            title,
            strength: stats.strength,
            intelligence: stats.intelligence,
            endurance: stats.endurance,
            vitality: stats.vitality,
          })
          .eq('id', userId);
      },

      reset: () => set(INITIAL_STATE),
    }),
    { name: 'rpg-storage' }
  )
);
