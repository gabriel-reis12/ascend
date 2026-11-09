import type { TrainingGoal } from './trainingGenerator.ts';

export type HunterRank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'National' | 'Monarch';
export type HunterClass = 'Warrior' | 'Scholar' | 'Creator' | 'Monk' | 'Leader';

export interface HunterStats {
  strength: number;
  intelligence: number;
  endurance: number;
  vitality: number;
  discipline: number;
  wisdom: number;
  balance: number;
}

export interface HunterOnboardingSetup {
  userId: string;
  fullName: string;
  birthday?: string;
  gender?: 'male' | 'female';
  height?: number;
  weightCurrent?: number;
  weightTarget?: number;
  mainGoal: string; // 'weight_loss' | 'hypertrophy' | 'conditioning' | 'discipline' | 'nutrition' | 'focus_studies' | 'general_health'
  nutritionGoal: 'lose' | 'maintain' | 'gain';
  trainingFocus?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  hunterClass: HunterClass;
  workoutFrequency: 2 | 3 | 4 | 5 | 6;
  workoutEnvironment: 'gym' | 'home' | 'hybrid';
  physicalRestrictions: Array<'lombar' | 'joelho' | 'ombro' | 'punho' | 'cervical'>;
  primaryDifficulty?: string;
  dailyAvailability: '30' | '60' | '90';
  confirmTrainingProgram?: boolean;
}

export interface HunterSetupSummary {
  className: HunterClass;
  calibratedStats: HunterStats;
  targetCalories: number | null;
  nutritionGoalLabelPt: string;
  nutritionGoalLabelEn: string;
  workoutSplitName: string;
  weeklyFrequency: number;
  initialHabitsCount: number;
  pinnedActionIds: string[];
}

/**
 * Calibra atributos iniciais de acordo com a vocação/classe escolhida no despertar.
 * Base 10 + bônus de classe (Primário +3, Secundário +2, Terciário +1).
 */
export function getCalibratedInitialStats(hunterClass: HunterClass): HunterStats {
  const base: HunterStats = {
    strength: 10,
    intelligence: 10,
    endurance: 10,
    vitality: 10,
    discipline: 10,
    wisdom: 10,
    balance: 10,
  };

  switch (hunterClass) {
    case 'Warrior':
      return { ...base, strength: 13, endurance: 12, vitality: 11 };
    case 'Scholar':
      return { ...base, intelligence: 13, wisdom: 12, discipline: 11 };
    case 'Creator':
      return { ...base, intelligence: 12, discipline: 12, wisdom: 11 };
    case 'Monk':
      return { ...base, vitality: 13, balance: 12, endurance: 11 };
    case 'Leader':
      return { ...base, discipline: 13, wisdom: 12, balance: 11 };
    default:
      return base;
  }
}

/**
 * Determina os atalhos prioritários para a Home com base no objetivo principal.
 */
export function getRecommendedPinnedActions(mainGoal: string): string[] {
  switch (mainGoal) {
    case 'weight_loss':
    case 'nutrition':
      return ['nutrition_log', 'workouts_log', 'quests_complete', 'mind_temple'];
    case 'hypertrophy':
      return ['workouts_log', 'nutrition_log', 'quests_complete', 'status_radar'];
    case 'discipline':
      return ['quests_complete', 'mind_temple', 'workouts_log', 'nutrition_log'];
    case 'focus_studies':
      return ['quests_complete', 'mind_temple', 'status_radar', 'workouts_log'];
    case 'conditioning':
    case 'general_health':
    default:
      return ['quests_complete', 'workouts_log', 'nutrition_log', 'mind_temple'];
  }
}

/**
 * Retorna os hábitos iniciais essenciais com base no objetivo e dificuldade.
 */
export function getInitialHabitPresets(mainGoal: string, difficulty?: string) {
  switch (mainGoal) {
    case 'weight_loss':
      return [
        {
          title: 'Hidratação: Beber 2.5L a 3L de Água',
          category: 'Saúde',
          category_color: 'cyan',
          xp_reward: 10,
          stat_target: 'vitality' as const,
          stat_reward: 2,
        },
        {
          title: 'Déficit Consciente: Sem Açúcar Refinado',
          category: 'Nutrição',
          category_color: 'emerald',
          xp_reward: 15,
          stat_target: 'discipline' as const,
          stat_reward: 2,
        },
        {
          title: 'Caminhada ou Cardio Leve (20-30 min)',
          category: 'Movimento',
          category_color: 'purple',
          xp_reward: 20,
          stat_target: 'endurance' as const,
          stat_reward: 2,
        },
      ];

    case 'hypertrophy':
      return [
        {
          title: 'Bater Meta de Proteína Diária',
          category: 'Nutrição',
          category_color: 'emerald',
          xp_reward: 20,
          stat_target: 'strength' as const,
          stat_reward: 3,
        },
        {
          title: 'Sono Reparador de 7h a 8h',
          category: 'Recuperação',
          category_color: 'cyan',
          xp_reward: 15,
          stat_target: 'vitality' as const,
          stat_reward: 2,
        },
        {
          title: 'Executar Treino de Força Programado',
          category: 'Treino',
          category_color: 'amber',
          xp_reward: 25,
          stat_target: 'discipline' as const,
          stat_reward: 2,
        },
      ];

    case 'discipline':
      return [
        {
          title: 'Despertar no Primeiro Toque sem Adiar',
          category: 'Disciplina',
          category_color: 'rose',
          xp_reward: 15,
          stat_target: 'discipline' as const,
          stat_reward: 2,
        },
        {
          title: 'Bloco de Foco Profundo sem Distrações (50 min)',
          category: 'Foco',
          category_color: 'purple',
          xp_reward: 20,
          stat_target: 'intelligence' as const,
          stat_reward: 2,
        },
        {
          title: 'Planejar o Dia Seguinte à Noite',
          category: 'Organização',
          category_color: 'cyan',
          xp_reward: 15,
          stat_target: 'discipline' as const,
          stat_reward: 2,
        },
      ];

    case 'focus_studies':
      return [
        {
          title: 'Leitura Técnica ou Estudo Dirigido (30 min)',
          category: 'Conhecimento',
          category_color: 'purple',
          xp_reward: 20,
          stat_target: 'intelligence' as const,
          stat_reward: 3,
        },
        {
          title: 'Sessão de Deep Work / Concentração Máxima',
          category: 'Foco',
          category_color: 'cyan',
          xp_reward: 20,
          stat_target: 'discipline' as const,
          stat_reward: 2,
        },
        {
          title: 'Revisão Ativa e Prática de Habilidade',
          category: 'Evolução',
          category_color: 'amber',
          xp_reward: 15,
          stat_target: 'wisdom' as const,
          stat_reward: 2,
        },
      ];

    case 'conditioning':
      return [
        {
          title: 'Sessão de Movimento / Cardio Diário',
          category: 'Condicionamento',
          category_color: 'purple',
          xp_reward: 25,
          stat_target: 'endurance' as const,
          stat_reward: 2,
        },
        {
          title: 'Alongamento e Mobilidade Articular (15 min)',
          category: 'Mobilidade',
          category_color: 'cyan',
          xp_reward: 10,
          stat_target: 'balance' as const,
          stat_reward: 2,
        },
        {
          title: 'Hidratação Pré e Pós Treinamento',
          category: 'Saúde',
          category_color: 'emerald',
          xp_reward: 10,
          stat_target: 'vitality' as const,
          stat_reward: 2,
        },
      ];

    case 'nutrition':
      return [
        {
          title: 'Alimentação Limpa sem Ultraprocessados',
          category: 'Nutrição',
          category_color: 'emerald',
          xp_reward: 20,
          stat_target: 'vitality' as const,
          stat_reward: 2,
        },
        {
          title: 'Registrar Todas as Refeições do Dia',
          category: 'Diário',
          category_color: 'cyan',
          xp_reward: 20,
          stat_target: 'discipline' as const,
          stat_reward: 2,
        },
        {
          title: 'Consumir Porção de Vegetais ou Frutas Frescas',
          category: 'Saúde',
          category_color: 'amber',
          xp_reward: 10,
          stat_target: 'vitality' as const,
          stat_reward: 2,
        },
      ];

    case 'general_health':
    default:
      return [
        {
          title: 'Hidratação Consciente (2L+ de Água)',
          category: 'Saúde',
          category_color: 'cyan',
          xp_reward: 10,
          stat_target: 'vitality' as const,
          stat_reward: 2,
        },
        {
          title: 'Movimentação Corporal e Caminhada Ativa',
          category: 'Corpo',
          category_color: 'purple',
          xp_reward: 15,
          stat_target: 'endurance' as const,
          stat_reward: 2,
        },
        {
          title: 'Pausa para Respiração e Descompressão',
          category: 'Mente',
          category_color: 'emerald',
          xp_reward: 10,
          stat_target: 'balance' as const,
          stat_reward: 2,
        },
      ];
  }
}

/**
 * Converte o objetivo do onboarding para o TrainingGoal do motor determinístico.
 */
export function mapMainGoalToTrainingGoal(mainGoal: string): TrainingGoal {
  switch (mainGoal) {
    case 'weight_loss':
      return 'weight_loss';
    case 'hypertrophy':
      return 'hypertrophy';
    case 'conditioning':
      return 'conditioning';
    case 'discipline':
      return 'strength';
    case 'nutrition':
    case 'focus_studies':
    case 'general_health':
    default:
      return 'health';
  }
}

