import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';
export type HunterClass = 'Warrior' | 'Scholar' | 'Creator' | 'Monk' | 'Leader';
export type HunterGender = 'male' | 'female';

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
  experienceLevel: string | null;
  stats: HunterStats;
  streak: {
    current: number;
    best: number;
  };
  pendingLevelUp: number | null;
  xpGainedToday: number;
  streakMilestonesClaimed: string[];
  activeTitle: string;

  // Actions
  addXp: (amount: number, userId?: string) => Promise<void>;
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
  xpRequired: 100,
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
  experienceLevel: null as string | null,
  stats: INITIAL_STATS,
  streak: { current: 0, best: 0 },
  pendingLevelUp: null as number | null,
  xpGainedToday: 0,
  streakMilestonesClaimed: [] as string[],
  activeTitle: 'Iniciante',
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

const calculateAntiFarmXp = (currentGainedToday: number, amount: number): { addedXp: number; newGainedToday: number } => {
  let remaining = amount;
  let current = currentGainedToday;
  let added = 0;

  while (remaining > 0) {
    if (current < 200) {
      // 100% ganho
      const chunk = Math.min(remaining, 200 - current);
      added += chunk;
      current += chunk;
      remaining -= chunk;
    } else if (current < 400) {
      // 50% ganho (Soft Cap)
      const chunk = Math.min(remaining, 400 - current);
      const realChunk = chunk * 0.5;
      added += realChunk;
      current += realChunk;
      remaining -= chunk;
    } else {
      // 10% ganho (Hard Cap)
      const realChunk = remaining * 0.1;
      added += realChunk;
      current += realChunk;
      remaining = 0;
    }
  }

  return {
    addedXp: Math.round(added),
    newGainedToday: Math.round(current)
  };
};

const subtractXp = (state: HunterState, amount: number) => {
  let newLevel = state.level;
  let newXp = state.xp - amount;

  while (newXp < 0 && newLevel > 1) {
    newLevel--;
    newXp += getXpRequiredForLevel(newLevel);
  }

  if (newLevel === 1 && newXp < 0) {
    newXp = 0;
  }

  return {
    xp: newXp,
    level: newLevel,
    xpRequired: getXpRequiredForLevel(newLevel),
    rank: getRankForLevel(newLevel),
  };
};

export const useHunterStore = create<HunterState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addXp: async (amount, userId) => {
        const state = get();

        if (amount < 0) {
          const removedXp = Math.abs(amount);
          set({
            ...subtractXp(state, removedXp),
            xpGainedToday: Math.max(0, state.xpGainedToday - removedXp),
          });

          if (userId) {
            await get().saveProfile(userId);
          }
          return;
        }

        // Bônus de Streak: +2% por dia de streak, limitado a +100%
        const streakBonus = Math.min(state.streak.current * 0.02, 1.0);
        const finalAmount = Math.floor(amount * (1 + streakBonus));

        // Aplicar Anti-Farm
        const { addedXp, newGainedToday } = calculateAntiFarmXp(state.xpGainedToday, finalAmount);

        let newXp = state.xp + addedXp;
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
          xpGainedToday: newGainedToday,
        });

        if (userId) {
          await get().saveProfile(userId);
          await get().checkAchievements(userId);
        }
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
              xp_to_next_level: 100,
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
          const level = data.level || 1;

          // Lógica robusta e resiliente de cálculo e atualização de Streak diária
          let newStreakCurrent = data.streak_current || 0;
          let newStreakBest = data.streak_best || 0;
          let shouldUpdateProfileInDb = false;

          const now = new Date();
          const todayStr = now.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD local

          let xpGainedToday = data.xp_gained_today || 0;

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

          set({
            level,
            xp: data.xp || 0,
            xpRequired: data.xp_to_next_level || getXpRequiredForLevel(level),
            rank: (data.rank as HunterRank) || getRankForLevel(level),
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
            experienceLevel: data.experience_level || null,
            stats: {
              strength: Number(data.strength) || 10,
              intelligence: Number(data.intelligence) || 10,
              endurance: Number(data.endurance) || 10,
              vitality: Number(data.vitality) || 10,
              discipline: Number(data.discipline) || 10,
              wisdom: Number(data.wisdom) || 10,
              balance: Number(data.balance) || 10,
            },
            streak: {
              current: newStreakCurrent,
              best: newStreakBest,
            },
            xpGainedToday,
            streakMilestonesClaimed: data.streak_milestones_claimed || [],
            activeTitle: data.title || 'Iniciante',
          });

          if (shouldUpdateProfileInDb) {
            await supabase
              .from('profiles')
              .update({
                streak_current: newStreakCurrent,
                streak_best: newStreakBest,
                last_check_in: now.toISOString(),
                xp_gained_today: xpGainedToday,
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
          { key: '3d', days: 3, title: 'Iniciante da Consistência', desc: 'Mantenha uma streak de 3 dias seguidos', icon: 'Flame', xp: 50 },
          { key: '7d', days: 7, title: 'Guerreiro Diário', desc: 'Mantenha uma streak de 7 dias seguidos', icon: 'Calendar', xp: 150 },
          { key: '15d', days: 15, title: 'Mestre da Rotina', desc: 'Mantenha uma streak de 15 dias seguidos', icon: 'Shield', xp: 300 },
          { key: '30d', days: 30, title: 'Lenda Ativa', desc: 'Mantenha uma streak de 30 dias seguidos', icon: 'Crown', xp: 600 }
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
            await get().addXp(m.xp, userId);
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
          { attr: 'strength', val: state.stats.strength, title: 'Força Absoluta', desc: 'Alcance 20 pontos de Força', icon: 'Sword', xp: 100 },
          { attr: 'intelligence', val: state.stats.intelligence, title: 'Mente Brilhante', desc: 'Alcance 20 pontos de Inteligência', icon: 'Book', xp: 100 },
          { attr: 'endurance', val: state.stats.endurance, title: 'Inquebrável', desc: 'Alcance 20 pontos de Resistência', icon: 'Shield', xp: 100 },
          { attr: 'vitality', val: state.stats.vitality, title: 'Vigor Eterno', desc: 'Alcance 20 pontos de Vitalidade', icon: 'Heart', xp: 100 },
          { attr: 'discipline', val: state.stats.discipline, title: 'Mente de Ferro', desc: 'Alcance 20 pontos de Disciplina', icon: 'Brain', xp: 100 },
          { attr: 'wisdom', val: state.stats.wisdom, title: 'Olhar Aguçado', desc: 'Alcance 20 pontos de Sabedoria', icon: 'Compass', xp: 100 },
          { attr: 'balance', val: state.stats.balance, title: 'Zenith', desc: 'Alcance 20 pontos de Equilíbrio', icon: 'Scale', xp: 100 },
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
              
            await get().addXp(am.xp, userId);
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
    { name: 'hunter-storage' }
  )
);
