import type { TacticalButtonAccent } from '@/components/ui/tactical-button';

export type QuickActionCategory =
  | 'quests'
  | 'workouts'
  | 'nutrition'
  | 'rest'
  | 'fortuna'
  | 'bosses'
  | 'trophies'
  | 'status';

export interface QuickActionDefinition {
  id: string;
  titlePt: string;
  titleEn: string;
  sublabelPt: string;
  sublabelEn: string;
  path: string;
  category: QuickActionCategory;
  accent: TacticalButtonAccent;
  iconName:
    | 'CheckSquare'
    | 'Dumbbell'
    | 'Apple'
    | 'Moon'
    | 'Repeat'
    | 'Sparkles'
    | 'Coins'
    | 'Skull'
    | 'Trophy'
    | 'LayoutDashboard';
  canRepeatDirectly?: boolean;
  repeatType?: 'meal' | 'task';
  tourId?: string;
}

export const QUICK_ACTIONS_CATALOG: QuickActionDefinition[] = [
  {
    id: 'quests_complete',
    titlePt: 'Concluir Missão',
    titleEn: 'Complete Quest',
    sublabelPt: 'Hábitos e rotinas diárias',
    sublabelEn: 'Daily habits & routines',
    path: '/quests',
    category: 'quests',
    accent: 'cyan',
    iconName: 'CheckSquare',
  },
  {
    id: 'workouts_log',
    titlePt: 'Registrar Treino',
    titleEn: 'Log Workout',
    sublabelPt: 'Cargas, séries e cardio',
    sublabelEn: 'Weights, sets & cardio',
    path: '/workouts',
    category: 'workouts',
    accent: 'purple',
    iconName: 'Dumbbell',
    tourId: 'tour-shortcut-workouts',
  },
  {
    id: 'nutrition_log',
    titlePt: 'Registrar Refeição',
    titleEn: 'Log Meal',
    sublabelPt: 'Diário alimentar e macros TACO',
    sublabelEn: 'Food log & TACO macros',
    path: '/nutrition',
    category: 'nutrition',
    accent: 'cyan',
    iconName: 'Apple',
    tourId: 'tour-shortcut-nutrition',
  },
  {
    id: 'mind_temple',
    titlePt: 'Templo da Mente',
    titleEn: 'Mind Temple',
    sublabelPt: 'Respiração e meditação',
    sublabelEn: 'Breathing & meditation',
    path: '/rest',
    category: 'rest',
    accent: 'cyan',
    iconName: 'Moon',
  },
  {
    id: 'repeat_recent_meal',
    titlePt: 'Repetir Refeição Recente',
    titleEn: 'Repeat Recent Meal',
    sublabelPt: 'Lançamento seguro com confirmação',
    sublabelEn: 'Safe copy with confirmation',
    path: '/nutrition',
    category: 'nutrition',
    accent: 'cyan',
    iconName: 'Repeat',
    canRepeatDirectly: true,
    repeatType: 'meal',
  },
  {
    id: 'repeat_recent_task',
    titlePt: 'Repetir Tarefa Recente',
    titleEn: 'Reactivate Task',
    sublabelPt: 'Criar cópia pendente para hoje',
    sublabelEn: 'Create pending copy for today',
    path: '/quests',
    category: 'quests',
    accent: 'purple',
    iconName: 'Sparkles',
    canRepeatDirectly: true,
    repeatType: 'task',
  },
  {
    id: 'fortuna_tx',
    titlePt: 'Módulo Fortuna',
    titleEn: 'Fortune Module',
    sublabelPt: 'Finanças, gastos e aportes WIS',
    sublabelEn: 'Finances, expenses & WIS saves',
    path: '/fortuna',
    category: 'fortuna',
    accent: 'gold',
    iconName: 'Coins',
  },
  {
    id: 'boss_raid',
    titlePt: 'Portal dos Chefes',
    titleEn: 'Boss Portal',
    sublabelPt: 'Batalha de raid semanal',
    sublabelEn: 'Weekly raid battle',
    path: '/bosses',
    category: 'bosses',
    accent: 'crimson',
    iconName: 'Skull',
  },
  {
    id: 'trophy_room',
    titlePt: 'Salão de Troféus',
    titleEn: 'Trophy Room',
    sublabelPt: 'Conquistas e títulos equipáveis',
    sublabelEn: 'Achievements & equippable titles',
    path: '/trophies',
    category: 'trophies',
    accent: 'gold',
    iconName: 'Trophy',
  },
  {
    id: 'status_radar',
    titlePt: 'Ficha de Atributos',
    titleEn: 'Attribute Sheet',
    sublabelPt: 'Radar holográfico e domínios',
    sublabelEn: 'Holographic radar & domains',
    path: '/status',
    category: 'status',
    accent: 'purple',
    iconName: 'LayoutDashboard',
  },
];

export const DEFAULT_PINNED_ACTION_IDS: string[] = [
  'quests_complete',
  'workouts_log',
  'nutrition_log',
  'mind_temple',
];

export const MAX_PINNED_ACTIONS = 6;
export const MIN_PINNED_ACTIONS = 1;

export function getQuickActionById(id: string): QuickActionDefinition | undefined {
  return QUICK_ACTIONS_CATALOG.find((action) => action.id === id);
}
