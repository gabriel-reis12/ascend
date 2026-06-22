import { createContext, useContext } from 'react';

export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'pt-BR' | 'en-US';

export const THEME_KEY = 'ascend_theme';
export const LANGUAGE_KEY = 'ascend_language';

export const translations = {
  'nav.portal': { 'pt-BR': 'Portal', 'en-US': 'Portal' },
  'nav.status': { 'pt-BR': 'Status', 'en-US': 'Status' },
  'nav.quests': { 'pt-BR': 'Missões', 'en-US': 'Quests' },
  'nav.bosses': { 'pt-BR': 'Chefes', 'en-US': 'Bosses' },
  'nav.workouts': { 'pt-BR': 'Treinamento', 'en-US': 'Training' },
  'nav.nutrition': { 'pt-BR': 'Nutrição', 'en-US': 'Nutrition' },
  'nav.fortuna': { 'pt-BR': 'Fortuna', 'en-US': 'Fortune' },
  'nav.rest': { 'pt-BR': 'Descanso', 'en-US': 'Recovery' },
  'nav.settings': { 'pt-BR': 'Ajustes', 'en-US': 'Settings' },
  'common.active': { 'pt-BR': 'Ativo', 'en-US': 'Active' },
  'common.status': { 'pt-BR': 'Status', 'en-US': 'Status' },
  'common.warning': { 'pt-BR': 'Aviso', 'en-US': 'Warning' },
  'common.diagnose': { 'pt-BR': 'Diagnosticar', 'en-US': 'Diagnose' },
  'common.disconnect': { 'pt-BR': 'Desconectar', 'en-US': 'Sign out' },
  'common.level': { 'pt-BR': 'Nível', 'en-US': 'Level' },
  'common.rank': { 'pt-BR': 'Rank', 'en-US': 'Rank' },
  'common.systemXp': { 'pt-BR': 'XP do Sistema', 'en-US': 'System XP' },
  'common.classUndefined': { 'pt-BR': 'Classe não definida', 'en-US': 'Class not selected' },
  'errors.supabaseKeysMissing': {
    'pt-BR': 'Chaves de API do Supabase ausentes no ambiente (.env).',
    'en-US': 'Supabase API keys are missing from the environment (.env).',
  },
  'errors.supabaseConnection': {
    'pt-BR': 'Falha de conexão com a fenda Supabase. Seus dados dinâmicos podem não ser exibidos.',
    'en-US': 'The Supabase Rift connection failed. Dynamic data may not be displayed.',
  },
  'settings.title': { 'pt-BR': 'Ajustes de Sistema', 'en-US': 'System Settings' },
  'settings.subtitle': {
    'pt-BR': 'Modificação e controle central da fenda do caçador',
    'en-US': 'Central control and customization of the Hunter System',
  },
  'settings.preferences': { 'pt-BR': 'Interface & Idioma', 'en-US': 'Interface & Language' },
  'settings.preferencesHint': {
    'pt-BR': 'Preferências salvas neste dispositivo',
    'en-US': 'Preferences saved on this device',
  },
  'settings.theme': { 'pt-BR': 'Tema', 'en-US': 'Theme' },
  'settings.dark': { 'pt-BR': 'Escuro', 'en-US': 'Dark' },
  'settings.light': { 'pt-BR': 'Claro', 'en-US': 'Light' },
  'settings.language': { 'pt-BR': 'Idioma', 'en-US': 'Language' },
  'settings.portuguese': { 'pt-BR': 'Português', 'en-US': 'Portuguese' },
  'settings.english': { 'pt-BR': 'Inglês', 'en-US': 'English' },
  'bosses.title': { 'pt-BR': 'Chefes Finais & Provações', 'en-US': 'Final Bosses & Trials' },
  'bosses.weeklyRaid': { 'pt-BR': 'Raid semanal ativa', 'en-US': 'Weekly raid active' },
  'bosses.synced': { 'pt-BR': 'Fenda sincronizada', 'en-US': 'Rift synchronized' },
  'bosses.weekBoss': { 'pt-BR': 'Boss da semana', 'en-US': 'Weekly boss' },
  'bosses.hpRemaining': { 'pt-BR': 'HP restante', 'en-US': 'HP remaining' },
  'bosses.damageDealt': { 'pt-BR': 'Dano acumulado', 'en-US': 'Damage dealt' },
  'bosses.deadline': { 'pt-BR': 'Prazo restante', 'en-US': 'Time remaining' },
  'bosses.reward': { 'pt-BR': 'Recompensa', 'en-US': 'Reward' },
  'bosses.titleReward': { 'pt-BR': 'Título', 'en-US': 'Title' },
  'bosses.high': { 'pt-BR': 'Alto', 'en-US': 'High' },
  'bosses.moderate': { 'pt-BR': 'Moderado', 'en-US': 'Moderate' },
  'bosses.controlled': { 'pt-BR': 'Controlado', 'en-US': 'Controlled' },
  'nutrition.exceeded': { 'pt-BR': 'META CALÓRICA EXCEDIDA', 'en-US': 'CALORIE TARGET EXCEEDED' },
  'nutrition.exceededBody': {
    'pt-BR': 'Você ultrapassou sua faixa diária recomendada.',
    'en-US': 'You went beyond your recommended daily range.',
  },
  'nutrition.eyebrow': { 'pt-BR': 'Recuperação de recurso', 'en-US': 'Resource recovery' },
  'nutrition.title': { 'pt-BR': 'Recuperação de Mana', 'en-US': 'Mana Recovery' },
  'nutrition.diary': { 'pt-BR': 'Diário e Códex', 'en-US': 'Diary & Codex' },
  'nutrition.mealPlans': { 'pt-BR': 'Cardápios do Caçador', 'en-US': 'Hunter Meal Plans' },
  'nutrition.codex': { 'pt-BR': 'Códex da Alimentação', 'en-US': 'Food Codex' },
  'nutrition.library': { 'pt-BR': 'Biblioteca de Itens', 'en-US': 'Food Library' },
  'pages.portal': { 'pt-BR': 'Portal de Comando', 'en-US': 'Command Portal' },
  'pages.quests': { 'pt-BR': 'Quadro de Missões', 'en-US': 'Quest Board' },
  'pages.workouts': { 'pt-BR': 'Centro de Treinamento', 'en-US': 'Training Center' },
  'pages.rest': { 'pt-BR': 'Descanso & Lazer', 'en-US': 'Recovery & Leisure' },
} as const;

export type TranslationKey = keyof typeof translations;

export interface PreferencesContextValue {
  theme: AppTheme;
  language: AppLanguage;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside PreferencesProvider.');
  return context;
}
