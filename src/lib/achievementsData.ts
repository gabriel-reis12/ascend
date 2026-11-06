export type AchievementCategory = 'streak' | 'stats' | 'boss';

export interface AchievementDefinition {
  key: string;
  category: AchievementCategory;
  title: string;
  desc: string;
  icon: string;
  titleReward: string;
  xp: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface TitleDefinition {
  name: string;
  category: 'base' | 'streak' | 'stats' | 'boss';
  sourceAchievementKey?: string;
  sourceDescription: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ALL_POSSIBLE_ACHIEVEMENTS: AchievementDefinition[] = [
  // Streaks / Consistência
  {
    key: '3d',
    category: 'streak',
    title: 'Iniciante da Consistência',
    desc: 'Mantenha uma streak de 3 dias seguidos',
    icon: 'Flame',
    titleReward: 'Constante',
    xp: 30,
    rarity: 'common',
  },
  {
    key: '7d',
    category: 'streak',
    title: 'Guerreiro Diário',
    desc: 'Mantenha uma streak de 7 dias seguidos',
    icon: 'Calendar',
    titleReward: 'Persistente',
    xp: 70,
    rarity: 'common',
  },
  {
    key: '15d',
    category: 'streak',
    title: 'Mestre da Rotina',
    desc: 'Mantenha uma streak de 15 dias seguidos',
    icon: 'Shield',
    titleReward: 'Inabalável',
    xp: 140,
    rarity: 'rare',
  },
  {
    key: '30d',
    category: 'streak',
    title: 'Lenda Ativa',
    desc: 'Mantenha uma streak de 30 dias seguidos',
    icon: 'Crown',
    titleReward: 'Monarca da Rotina',
    xp: 250,
    rarity: 'epic',
  },
  // Atributos de Batalha (Meta: 20 pts)
  {
    key: 'strength',
    category: 'stats',
    title: 'Força Absoluta',
    desc: 'Alcance 20 pontos de Força',
    icon: 'Sword',
    titleReward: 'Colosso',
    xp: 50,
    rarity: 'rare',
  },
  {
    key: 'endurance',
    category: 'stats',
    title: 'Inquebrável',
    desc: 'Alcance 20 pontos de Resistência',
    icon: 'Shield',
    titleReward: 'Bastião',
    xp: 50,
    rarity: 'rare',
  },
  {
    key: 'intelligence',
    category: 'stats',
    title: 'Mente Brilhante',
    desc: 'Alcance 20 pontos de Inteligência',
    icon: 'Book',
    titleReward: 'Arquimago',
    xp: 50,
    rarity: 'rare',
  },
  {
    key: 'discipline',
    category: 'stats',
    title: 'Mente de Ferro',
    desc: 'Alcance 20 pontos de Disciplina',
    icon: 'Brain',
    titleReward: 'Focado',
    xp: 50,
    rarity: 'rare',
  },
  {
    key: 'vitality',
    category: 'stats',
    title: 'Vigor Eterno',
    desc: 'Alcance 20 pontos de Vitalidade',
    icon: 'Heart',
    titleReward: 'Imortal',
    xp: 50,
    rarity: 'rare',
  },
  {
    key: 'wisdom',
    category: 'stats',
    title: 'Olhar Aguçado',
    desc: 'Alcance 20 pontos de Sabedoria',
    icon: 'Compass',
    titleReward: 'Eremita',
    xp: 50,
    rarity: 'rare',
  },
  {
    key: 'balance',
    category: 'stats',
    title: 'Zenith',
    desc: 'Alcance 20 pontos de Equilíbrio',
    icon: 'Scale',
    titleReward: 'Harmônico',
    xp: 50,
    rarity: 'rare',
  },
  // Chefes da Fenda (Boss Raids)
  {
    key: 'boss_01',
    category: 'boss',
    title: 'O Senhor da Procrastinação Derrotado',
    desc: 'Purificou o Senhor da Procrastinação',
    icon: 'Sword',
    titleReward: 'Executor Implacável',
    xp: 100,
    rarity: 'epic',
  },
  {
    key: 'boss_02',
    category: 'boss',
    title: 'O Rei da Preguiça Derrotado',
    desc: 'Purificou o Rei da Preguiça',
    icon: 'Flame',
    titleReward: 'O Incansável',
    xp: 130,
    rarity: 'epic',
  },
  {
    key: 'boss_03',
    category: 'boss',
    title: 'A Sereia da Distração Derrotada',
    desc: 'Purificou a Sereia da Distração',
    icon: 'Brain',
    titleReward: 'Mestre do Foco',
    xp: 160,
    rarity: 'epic',
  },
  {
    key: 'boss_04',
    category: 'boss',
    title: 'O Devorador do Progresso Derrotado',
    desc: 'Purificou o Devorador do Progresso',
    icon: 'Heart',
    titleReward: 'Mestre da Disciplina',
    xp: 200,
    rarity: 'epic',
  },
  {
    key: 'boss_05',
    category: 'boss',
    title: 'O Mercador das Dívidas Derrotado',
    desc: 'Purificou o Mercador das Dívidas',
    icon: 'Scale',
    titleReward: 'Guardião da Liberdade',
    xp: 240,
    rarity: 'epic',
  },
  {
    key: 'boss_06',
    category: 'boss',
    title: 'O Arauto do Caos Derrotado',
    desc: 'Purificou o Arauto do Caos',
    icon: 'Compass',
    titleReward: 'Mestre da Clareza',
    xp: 300,
    rarity: 'epic',
  },
  {
    key: 'boss_07',
    category: 'boss',
    title: 'O Reflexo da Autossabotagem Purificado',
    desc: 'Superou a si mesmo e purificou o Reflexo da Autossabotagem',
    icon: 'Crown',
    titleReward: 'O Purificado',
    xp: 400,
    rarity: 'legendary',
  },
];

export const ALL_PRESTIGE_TITLES: TitleDefinition[] = [
  {
    name: 'Iniciante',
    category: 'base',
    sourceDescription: 'Título concedido a todos os caçadores ao despertar no Sistema',
    rarity: 'common',
  },
  // Streak
  {
    name: 'Constante',
    category: 'streak',
    sourceAchievementKey: '3d',
    sourceDescription: 'Desbloqueado ao manter uma sequência de 3 dias',
    rarity: 'common',
  },
  {
    name: 'Persistente',
    category: 'streak',
    sourceAchievementKey: '7d',
    sourceDescription: 'Desbloqueado ao manter uma sequência de 7 dias',
    rarity: 'common',
  },
  {
    name: 'Inabalável',
    category: 'streak',
    sourceAchievementKey: '15d',
    sourceDescription: 'Desbloqueado ao manter uma sequência de 15 dias',
    rarity: 'rare',
  },
  {
    name: 'Monarca da Rotina',
    category: 'streak',
    sourceAchievementKey: '30d',
    sourceDescription: 'Desbloqueado ao manter uma sequência de 30 dias',
    rarity: 'epic',
  },
  // Atributos
  {
    name: 'Colosso',
    category: 'stats',
    sourceAchievementKey: 'strength',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Força (STR)',
    rarity: 'rare',
  },
  {
    name: 'Bastião',
    category: 'stats',
    sourceAchievementKey: 'endurance',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Resistência (END)',
    rarity: 'rare',
  },
  {
    name: 'Arquimago',
    category: 'stats',
    sourceAchievementKey: 'intelligence',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Inteligência (INT)',
    rarity: 'rare',
  },
  {
    name: 'Focado',
    category: 'stats',
    sourceAchievementKey: 'discipline',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Disciplina (DIS)',
    rarity: 'rare',
  },
  {
    name: 'Imortal',
    category: 'stats',
    sourceAchievementKey: 'vitality',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Vitalidade (VIT)',
    rarity: 'rare',
  },
  {
    name: 'Eremita',
    category: 'stats',
    sourceAchievementKey: 'wisdom',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Sabedoria (WIS)',
    rarity: 'rare',
  },
  {
    name: 'Harmônico',
    category: 'stats',
    sourceAchievementKey: 'balance',
    sourceDescription: 'Desbloqueado ao atingir 20 pontos de Equilíbrio (BAL)',
    rarity: 'rare',
  },
  // Chefes
  {
    name: 'Executor Implacável',
    category: 'boss',
    sourceAchievementKey: 'boss_01',
    sourceDescription: 'Desbloqueado ao purificar o Senhor da Procrastinação',
    rarity: 'epic',
  },
  {
    name: 'O Incansável',
    category: 'boss',
    sourceAchievementKey: 'boss_02',
    sourceDescription: 'Desbloqueado ao purificar o Rei da Preguiça',
    rarity: 'epic',
  },
  {
    name: 'Mestre do Foco',
    category: 'boss',
    sourceAchievementKey: 'boss_03',
    sourceDescription: 'Desbloqueado ao purificar a Sereia da Distração',
    rarity: 'epic',
  },
  {
    name: 'Mestre da Disciplina',
    category: 'boss',
    sourceAchievementKey: 'boss_04',
    sourceDescription: 'Desbloqueado ao purificar o Devorador do Progresso',
    rarity: 'epic',
  },
  {
    name: 'Guardião da Liberdade',
    category: 'boss',
    sourceAchievementKey: 'boss_05',
    sourceDescription: 'Desbloqueado ao purificar o Mercador das Dívidas',
    rarity: 'epic',
  },
  {
    name: 'Mestre da Clareza',
    category: 'boss',
    sourceAchievementKey: 'boss_06',
    sourceDescription: 'Desbloqueado ao purificar o Arauto do Caos',
    rarity: 'epic',
  },
  {
    name: 'O Purificado',
    category: 'boss',
    sourceAchievementKey: 'boss_07',
    sourceDescription: 'Desbloqueado ao purificar o Reflexo da Autossabotagem',
    rarity: 'legendary',
  },
];

export const EN_ACHIEVEMENT_COPY: Record<string, { title: string; desc: string }> = {
  '3d': { title: 'Consistency Initiate', desc: 'Maintain a 3-day streak' },
  '7d': { title: 'Daily Warrior', desc: 'Maintain a 7-day streak' },
  '15d': { title: 'Routine Master', desc: 'Maintain a 15-day streak' },
  '30d': { title: 'Active Legend', desc: 'Maintain a 30-day streak' },
  strength: { title: 'Absolute Strength', desc: 'Reach 20 Strength points' },
  endurance: { title: 'Unbreakable', desc: 'Reach 20 Endurance points' },
  intelligence: { title: 'Brilliant Mind', desc: 'Reach 20 Intelligence points' },
  discipline: { title: 'Iron Mind', desc: 'Reach 20 Discipline points' },
  vitality: { title: 'Eternal Vigor', desc: 'Reach 20 Vitality points' },
  wisdom: { title: 'Keen Insight', desc: 'Reach 20 Wisdom points' },
  balance: { title: 'Zenith', desc: 'Reach 20 Balance points' },
  boss_01: {
    title: 'Lord of Procrastination Defeated',
    desc: 'Purified the Lord of Procrastination',
  },
  boss_02: { title: 'King of Sloth Defeated', desc: 'Purified the King of Sloth' },
  boss_03: {
    title: 'Siren of Distraction Defeated',
    desc: 'Purified the Siren of Distraction',
  },
  boss_04: {
    title: 'Devourer of Progress Defeated',
    desc: 'Purified the Devourer of Progress',
  },
  boss_05: { title: 'Merchant of Debt Defeated', desc: 'Purified the Merchant of Debt' },
  boss_06: { title: 'Herald of Chaos Defeated', desc: 'Purified the Herald of Chaos' },
  boss_07: {
    title: 'Reflection of Self-Sabotage Purified',
    desc: 'Overcame yourself and purified the final reflection',
  },
};

export const EN_TITLE_COPY: Record<string, { name: string; source: string }> = {
  Iniciante: { name: 'Novice', source: 'Initial title granted to all hunters upon awakening' },
  Constante: { name: 'Consistent', source: 'Unlocked by maintaining a 3-day streak' },
  Persistente: { name: 'Persistent', source: 'Unlocked by maintaining a 7-day streak' },
  Inabalável: { name: 'Unshakable', source: 'Unlocked by maintaining a 15-day streak' },
  'Monarca da Rotina': { name: 'Monarch of Routine', source: 'Unlocked by maintaining a 30-day streak' },
  Colosso: { name: 'Colossus', source: 'Unlocked by reaching 20 Strength points (STR)' },
  Bastião: { name: 'Bastion', source: 'Unlocked by reaching 20 Endurance points (END)' },
  Arquimago: { name: 'Archmage', source: 'Unlocked by reaching 20 Intelligence points (INT)' },
  Focado: { name: 'Focused', source: 'Unlocked by reaching 20 Discipline points (DIS)' },
  Imortal: { name: 'Immortal', source: 'Unlocked by reaching 20 Vitality points (VIT)' },
  Eremita: { name: 'Hermit', source: 'Unlocked by reaching 20 Wisdom points (WIS)' },
  Harmônico: { name: 'Harmonic', source: 'Unlocked by reaching 20 Balance points (BAL)' },
  'Executor Implacável': { name: 'Relentless Executor', source: 'Unlocked by purifying the Lord of Procrastination' },
  'O Incansável': { name: 'The Tireless One', source: 'Unlocked by purifying the King of Sloth' },
  'Mestre do Foco': { name: 'Master of Focus', source: 'Unlocked by purifying the Siren of Distraction' },
  'Mestre da Disciplina': { name: 'Master of Discipline', source: 'Unlocked by purifying the Devourer of Progress' },
  'Guardião da Liberdade': { name: 'Guardian of Freedom', source: 'Unlocked by purifying the Debt Merchant' },
  'Mestre da Clareza': { name: 'Master of Clarity', source: 'Unlocked by purifying the Herald of Chaos' },
  'O Purificado': { name: 'The Purified', source: 'Unlocked by purifying the Reflection of Self-Sabotage' },
};

