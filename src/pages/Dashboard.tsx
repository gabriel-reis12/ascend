import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Coins,
  Compass,
  Crown,
  Dumbbell,
  Flame,
  Heart,
  HeartPulse,
  History,
  LoaderCircle,
  Lock,
  Maximize2,
  Scale,
  Shield,
  Sparkles,
  Sword,
  Target,
  TrendingUp,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { useHunterStore, type HunterStats } from '@/stores/useHunterStore';
import { RadarChart } from '@/components/ui/RadarChart';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDayBounds } from '@/lib/date';
import {
  DAILY_COMMON_XP_EFFECTIVE_MAX,
  MAX_LEVEL,
  RANK_PROMOTION_LEVELS,
  RANK_START_LEVELS,
  WEEKLY_BONUS_XP_CAP,
} from '@/lib/progression';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';

type StatKey = keyof HunterStats;

const HUNTER_AVATAR_FALLBACK = '/optimized/Classes/Warrior/Rank E.jpg';
const HUNTER_CLASS_IMAGE_IDS = new Set([
  'Warrior',
  'Scholar',
  'Creator',
  'Monk',
  'Leader',
  'Titan',
]);

function resolveHunterAvatar(
  hunterClass: string | null | undefined,
  rank: string | null | undefined
) {
  const safeClass =
    hunterClass && HUNTER_CLASS_IMAGE_IDS.has(hunterClass) ? hunterClass : 'Warrior';
  const upperRank = String(rank || 'E').toUpperCase();
  const imageRank = ['E', 'D', 'C', 'B', 'A', 'S'].includes(upperRank) ? upperRank : 'S';
  return `/optimized/Classes/${safeClass}/Rank ${imageRank}.jpg`;
}

function handleHunterAvatarError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.src = HUNTER_AVATAR_FALLBACK;
}

function localizeHunterClass(
  hunterClass: string | null | undefined,
  isEnglish: boolean
): string {
  if (!hunterClass) {
    return isEnglish ? 'No Class' : 'Sem Classe';
  }
  const map: Record<string, { pt: string; en: string }> = {
    Warrior: { pt: 'Guerreiro', en: 'Warrior' },
    Scholar: { pt: 'Erudito', en: 'Scholar' },
    Creator: { pt: 'Criador', en: 'Creator' },
    Monk: { pt: 'Monge', en: 'Monk' },
    Leader: { pt: 'Líder', en: 'Leader' },
    Titan: { pt: 'Titã', en: 'Titan' },
  };
  const entry = map[hunterClass];
  if (!entry) return hunterClass;
  return isEnglish ? entry.en : entry.pt;
}

interface EvolutionEvent {
  id: string;
  title: string;
  reward: string;
  domain: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp: string | null;
}

interface UnlockedAchievementRow {
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

const ALL_POSSIBLE_ACHIEVEMENTS = [
  // Streak
  {
    key: '3d',
    title: 'Iniciante da Consistência',
    desc: 'Mantenha uma streak de 3 dias seguidos',
    icon: 'Flame',
    titleReward: 'Constante',
    xp: 30,
  },
  {
    key: '7d',
    title: 'Guerreiro Diário',
    desc: 'Mantenha uma streak de 7 dias seguidos',
    icon: 'Calendar',
    titleReward: 'Persistente',
    xp: 70,
  },
  {
    key: '15d',
    title: 'Mestre da Rotina',
    desc: 'Mantenha uma streak de 15 dias seguidos',
    icon: 'Shield',
    titleReward: 'Inabalável',
    xp: 140,
  },
  {
    key: '30d',
    title: 'Lenda Ativa',
    desc: 'Mantenha uma streak de 30 dias seguidos',
    icon: 'Crown',
    titleReward: 'Monarca da Rotina',
    xp: 250,
  },
  // Atributos
  {
    key: 'strength',
    title: 'Força Absoluta',
    desc: 'Alcance 20 pontos de Força',
    icon: 'Sword',
    titleReward: 'Colosso',
    xp: 50,
  },
  {
    key: 'endurance',
    title: 'Inquebrável',
    desc: 'Alcance 20 pontos de Resistência',
    icon: 'Shield',
    titleReward: 'Bastião',
    xp: 50,
  },
  {
    key: 'intelligence',
    title: 'Mente Brilhante',
    desc: 'Alcance 20 pontos de Inteligência',
    icon: 'Book',
    titleReward: 'Arquimago',
    xp: 50,
  },
  {
    key: 'discipline',
    title: 'Mente de Ferro',
    desc: 'Alcance 20 pontos de Disciplina',
    icon: 'Brain',
    titleReward: 'Focado',
    xp: 50,
  },
  {
    key: 'vitality',
    title: 'Vigor Eterno',
    desc: 'Alcance 20 pontos de Vitalidade',
    icon: 'Heart',
    titleReward: 'Imortal',
    xp: 50,
  },
  {
    key: 'wisdom',
    title: 'Olhar Aguçado',
    desc: 'Alcance 20 pontos de Sabedoria',
    icon: 'Compass',
    titleReward: 'Eremita',
    xp: 50,
  },
  {
    key: 'balance',
    title: 'Zenith',
    desc: 'Alcance 20 pontos de Equilíbrio',
    icon: 'Scale',
    titleReward: 'Harmônico',
    xp: 50,
  },
  // Chefes
  {
    key: 'boss_01',
    title: 'O Senhor da Procrastinação Derrotado',
    desc: 'Purificou o Senhor da Procrastinação',
    icon: 'Sword',
    titleReward: 'Executor Implacável',
    xp: 100,
  },
  {
    key: 'boss_02',
    title: 'O Rei da Preguiça Derrotado',
    desc: 'Purificou o Rei da Preguiça',
    icon: 'Flame',
    titleReward: 'O Incansável',
    xp: 130,
  },
  {
    key: 'boss_03',
    title: 'A Sereia da Distração Derrotada',
    desc: 'Purificou a Sereia da Distração',
    icon: 'Brain',
    titleReward: 'Mestre do Foco',
    xp: 160,
  },
  {
    key: 'boss_04',
    title: 'O Devorador do Progresso Derrotado',
    desc: 'Purificou o Devorador do Progresso',
    icon: 'Heart',
    titleReward: 'Mestre da Disciplina',
    xp: 200,
  },
  {
    key: 'boss_05',
    title: 'O Mercador das Dívidas Derrotado',
    desc: 'Purificou o Mercador das Dívidas',
    icon: 'Scale',
    titleReward: 'Guardião da Liberdade',
    xp: 240,
  },
  {
    key: 'boss_06',
    title: 'O Arauto do Caos Derrotado',
    desc: 'Purificou o Arauto do Caos',
    icon: 'Compass',
    titleReward: 'Mestre da Clareza',
    xp: 300,
  },
  {
    key: 'boss_07',
    title: 'O Reflexo da Autossabotagem Purificado',
    desc: 'Superou a si mesmo e purificou o Reflexo da Autossabotagem',
    icon: 'Crown',
    titleReward: 'O Purificado',
    xp: 400,
  },
];

const EN_ACHIEVEMENT_COPY: Record<string, { title: string; desc: string }> = {
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

function renderAchievementIcon(iconName: string, className = 'h-4 w-4') {
  switch (iconName) {
    case 'Flame':
      return <Flame className={className} aria-hidden="true" />;
    case 'Calendar':
      return <Calendar className={className} aria-hidden="true" />;
    case 'Shield':
      return <Shield className={className} aria-hidden="true" />;
    case 'Crown':
      return <Crown className={className} aria-hidden="true" />;
    case 'Sword':
      return <Sword className={className} aria-hidden="true" />;
    case 'Book':
      return <BookOpen className={className} aria-hidden="true" />;
    case 'Heart':
      return <Heart className={className} aria-hidden="true" />;
    case 'Brain':
      return <Brain className={className} aria-hidden="true" />;
    case 'Compass':
      return <Compass className={className} aria-hidden="true" />;
    case 'Scale':
      return <Scale className={className} aria-hidden="true" />;
    default:
      return <Award className={className} aria-hidden="true" />;
  }
}

const NEXT_RANK: Record<string, string> = {
  E: 'D',
  D: 'C',
  C: 'B',
  B: 'A',
  A: 'S',
  S: 'National',
  National: 'Monarch',
  Monarch: 'Max',
};

function getStatMeta(l: (pt: string, en: string) => string) {
  return [
    {
      key: 'strength' as StatKey,
      label: 'STR',
      name: l('Força', 'Strength'),
      color: 'text-[#00F0FF]',
      iconBg: 'border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]',
      icon: Sword,
    },
    {
      key: 'endurance' as StatKey,
      label: 'END',
      name: l('Resistência', 'Endurance'),
      color: 'text-emerald-400',
      iconBg: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
      icon: Shield,
    },
    {
      key: 'intelligence' as StatKey,
      label: 'INT',
      name: l('Inteligência', 'Intelligence'),
      color: 'text-sky-400',
      iconBg: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
      icon: Brain,
    },
    {
      key: 'discipline' as StatKey,
      label: 'DIS',
      name: l('Disciplina', 'Discipline'),
      color: 'text-[#A855F7]',
      iconBg: 'border-[#A855F7]/30 bg-[#A855F7]/10 text-[#A855F7]',
      icon: Target,
    },
    {
      key: 'vitality' as StatKey,
      label: 'VIT',
      name: l('Vitalidade', 'Vitality'),
      color: 'text-rose-400',
      iconBg: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
      icon: HeartPulse,
    },
    {
      key: 'wisdom' as StatKey,
      label: 'WIS',
      name: l('Sabedoria', 'Wisdom'),
      color: 'text-[#F59E0B]',
      iconBg: 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]',
      icon: Coins,
    },
    {
      key: 'balance' as StatKey,
      label: 'BAL',
      name: l('Equilíbrio', 'Balance'),
      color: 'text-purple-300',
      iconBg: 'border-purple-400/30 bg-purple-400/10 text-purple-300',
      icon: Scale,
    },
  ];
}

function getDomainMeta(l: (pt: string, en: string) => string) {
  return [
    {
      key: 'strength' as StatKey,
      name: l('Força', 'Strength'),
      attributes: 'STR',
      nextReward: l('+1 Potência', '+1 Power'),
      icon: Sword,
      accentText: 'text-[#00F0FF]',
    },
    {
      key: 'endurance' as StatKey,
      name: l('Resistência', 'Endurance'),
      attributes: 'END',
      nextReward: l('+1 Fôlego', '+1 Stamina'),
      icon: Shield,
      accentText: 'text-emerald-400',
    },
    {
      key: 'intelligence' as StatKey,
      name: l('Inteligência', 'Intelligence'),
      attributes: 'INT',
      nextReward: l('Leitura Consistente', 'Consistent Reading'),
      icon: Brain,
      accentText: 'text-sky-400',
    },
    {
      key: 'discipline' as StatKey,
      name: l('Disciplina', 'Discipline'),
      attributes: 'DIS',
      nextReward: l('Foco Profundo', 'Deep Focus'),
      icon: Target,
      accentText: 'text-[#A855F7]',
    },
    {
      key: 'vitality' as StatKey,
      name: l('Vitalidade', 'Vitality'),
      attributes: 'VIT',
      nextReward: l('+1 Recuperação', '+1 Recovery'),
      icon: HeartPulse,
      accentText: 'text-rose-400',
    },
    {
      key: 'wisdom' as StatKey,
      name: l('Sabedoria', 'Wisdom'),
      attributes: 'WIS',
      nextReward: l('+1 Percepção', '+1 Perception'),
      icon: Coins,
      accentText: 'text-[#F59E0B]',
    },
    {
      key: 'balance' as StatKey,
      name: l('Equilíbrio', 'Balance'),
      attributes: 'BAL',
      nextReward: l('+1 Harmonia', '+1 Harmony'),
      icon: Scale,
      accentText: 'text-purple-300',
    },
  ];
}

function formatEvolutionTime(timestamp: string | null, locale: string) {
  if (!timestamp) return locale === 'en-US' ? 'Today' : 'Hoje';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return locale === 'en-US' ? 'Today' : 'Hoje';
  return `${locale === 'en-US' ? 'Today' : 'Hoje'}, ${date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function Dashboard() {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const prefersReducedMotion = useReducedMotion();

  const STAT_META = React.useMemo(() => getStatMeta(l), [language]);
  const DOMAIN_META = React.useMemo(() => getDomainMeta(l), [language]);
  const state = useHunterStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    activeHabits,
    completedToday,
    workoutMissions,
    mealMissions,
    xpEarnedToday,
    loading: habitsLoading,
  } = useHabits();

  const [todayVolume, setTodayVolume] = React.useState(0);
  const [tasksCompletedToday, setTasksCompletedToday] = React.useState(0);
  const [loadingDailySignals, setLoadingDailySignals] = React.useState(true);
  const [evolutionHistory, setEvolutionHistory] = React.useState<EvolutionEvent[]>([]);
  const [isAvatarOpen, setIsAvatarOpen] = React.useState(false);

  // Estado de Conquistas & Títulos Reais
  const [unlockedAchievements, setUnlockedAchievements] = React.useState<
    UnlockedAchievementRow[]
  >([]);
  const [loadingAchievements, setLoadingAchievements] = React.useState(false);
  const [showAllAchievements, setShowAllAchievements] = React.useState(false);

  const workoutStatusKey = React.useMemo(
    () => JSON.stringify(workoutMissions.map((mission) => mission.isCompleted)),
    [workoutMissions]
  );

  React.useEffect(() => {
    async function fetchAchievements() {
      if (!user?.id) return;
      setLoadingAchievements(true);
      try {
        const { data, error } = await supabase
          .from('achievements')
          .select('title, description, icon, unlocked_at')
          .eq('user_id', user.id)
          .order('unlocked_at', { ascending: false });

        if (!error && data) {
          setUnlockedAchievements(data);
        }
      } catch (err) {
        console.warn('[Dashboard] Falha ao carregar conquistas:', err);
      } finally {
        setLoadingAchievements(false);
      }
    }

    void fetchAchievements();
  }, [user?.id, state.level, state.streak.current]);

  React.useEffect(() => {
    async function fetchDailySignals() {
      if (!user?.id) {
        setLoadingDailySignals(false);
        return;
      }
      setLoadingDailySignals(true);
      const { startIso, endIso } = localDayBounds();

      const [
        workouts,
        tasks,
        finances,
        habitCompletions,
        routineCompletions,
        mealCompletions,
      ] = await Promise.all([
        supabase
          .from('workout_logs')
          .select('id, sets, reps, weight_kg, logged_at')
          .eq('user_id', user.id)
          .gte('logged_at', startIso)
          .lte('logged_at', endIso),
        supabase
          .from('tasks')
          .select('id, title, xp_reward, stat_target, stat_reward, completed_at')
          .eq('user_id', user.id)
          .eq('completed', true)
          .gte('completed_at', startIso)
          .lte('completed_at', endIso),
        supabase
          .from('financial_logs')
          .select('id, description, type, created_at')
          .eq('user_id', user.id)
          .eq('date', startIso.split('T')[0]),
        supabase
          .from('habit_completions')
          .select('id, created_at, habit:habits(title, xp_reward, stat_target, stat_reward)')
          .eq('user_id', user.id)
          .eq('completed_date', startIso.split('T')[0]),
        supabase
          .from('routine_completions')
          .select('id, xp_awarded, created_at, routine:workout_routines(name)')
          .eq('user_id', user.id)
          .eq('completed_date', startIso.split('T')[0]),
        supabase
          .from('meal_completions')
          .select('id, created_at, meal_plan:meal_plans(name)')
          .eq('user_id', user.id)
          .eq('completed_at', startIso.split('T')[0]),
      ]);

      if (!workouts.error) {
        setTodayVolume(
          (workouts.data || []).reduce(
            (sum, log) =>
              sum +
              (Number(log.sets) || 0) *
                (Number(log.reps) || 0) *
                (Number(log.weight_kg) || 0),
            0
          )
        );
      }
      if (!tasks.error) setTasksCompletedToday((tasks.data || []).length);

      const events: EvolutionEvent[] = [];
      const statDomain = (statTarget: string | null) => {
        const stat = STAT_META.find((item) => item.key === statTarget);
        return stat ? stat.name : l('Evolução', 'Evolution');
      };
      const statLabel = (statTarget: string | null) => {
        const stat = STAT_META.find((item) => item.key === statTarget);
        return stat?.label || null;
      };

      (tasks.data || []).forEach((task) => {
        const attribute = statLabel(task.stat_target);
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          reward: `+${task.xp_reward || 0} XP${
            attribute ? ` · ${attribute} +${task.stat_reward || 0}` : ''
          }`,
          domain: statDomain(task.stat_target),
          color: 'text-[#00F0FF]',
          icon: CheckCircle2,
          timestamp: task.completed_at,
        });
      });

      (habitCompletions.data || []).forEach((completion: any) => {
        const habit = Array.isArray(completion.habit)
          ? completion.habit[0]
          : completion.habit;
        if (!habit) return;
        const attribute = statLabel(habit.stat_target);
        events.push({
          id: `habit-${completion.id}`,
          title: habit.title,
          reward: `+${habit.xp_reward || 0} XP${
            attribute ? ` · ${attribute} +${habit.stat_reward || 0}` : ''
          }`,
          domain: statDomain(habit.stat_target),
          color: 'text-[#00F0FF]',
          icon: CheckCircle2,
          timestamp: completion.created_at,
        });
      });

      (routineCompletions.data || []).forEach((completion: any) => {
        const routine = Array.isArray(completion.routine)
          ? completion.routine[0]
          : completion.routine;
        const statTarget = routine?.name?.toLowerCase().includes('cardio')
          ? 'endurance'
          : 'strength';
        const attribute = statLabel(statTarget);
        events.push({
          id: `routine-${completion.id}`,
          title: routine?.name || l('Treino concluído', 'Workout completed'),
          reward: `+${completion.xp_awarded || 0} XP · ${attribute} +2 · VIT +1 · DIS +1`,
          domain: statDomain(statTarget),
          color: 'text-[#A855F7]',
          icon: Dumbbell,
          timestamp: completion.created_at,
        });
      });

      (mealCompletions.data || []).forEach((completion: any) => {
        const meal = Array.isArray(completion.meal_plan)
          ? completion.meal_plan[0]
          : completion.meal_plan;
        events.push({
          id: `meal-${completion.id}`,
          title: meal?.name || l('Refeição registrada', 'Meal logged'),
          reward: l('Recuperação registrada · VIT', 'Recovery logged · VIT'),
          domain: l('Vitalidade', 'Vitality'),
          color: 'text-rose-400',
          icon: Flame,
          timestamp: completion.created_at,
        });
      });

      (finances.data || []).forEach((log) => {
        const wisdomGain = log.type === 'investment' ? ' · SAB +1' : '';
        events.push({
          id: `finance-${log.id}`,
          title: log.description || l('Finanças atualizadas', 'Finances updated'),
          reward: `+10 XP${wisdomGain}`,
          domain: l('Sabedoria', 'Wisdom'),
          color: 'text-[#F59E0B]',
          icon: Coins,
          timestamp: log.created_at,
        });
      });

      events.sort((a, b) => {
        if (!a.timestamp && !b.timestamp) return 0;
        if (!a.timestamp) return 1;
        if (!b.timestamp) return -1;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      setEvolutionHistory(events);
      setLoadingDailySignals(false);
    }

    void fetchDailySignals();
  }, [user?.id, workoutStatusKey, completedToday, STAT_META]);

  const characterAvatar = React.useMemo(() => {
    return resolveHunterAvatar(state.hunterClass, state.rank);
  }, [state.hunterClass, state.rank]);

  const hunterName = state.username || state.fullName || 'Hunter';
  const hunterClassLabel = localizeHunterClass(state.hunterClass, isEnglish);
  const hunterTitle = state.activeTitle
    ? isEnglish
      ? translateUiText(state.activeTitle)
      : state.activeTitle
    : l('Iniciante', 'Beginner');

  const statVariation = React.useMemo(() => {
    const variations = Object.fromEntries(
      STAT_META.map((stat) => [stat.key, 0])
    ) as Record<StatKey, number>;

    activeHabits.forEach((habit) => {
      if (completedToday.has(habit.id) && habit.stat_target) {
        variations[habit.stat_target] += habit.stat_reward || 0;
      }
    });
    workoutMissions.forEach((mission) => {
      if (mission.isCompleted) variations[mission.stat_target] += mission.stat_reward || 0;
    });

    return variations;
  }, [STAT_META, activeHabits, completedToday, workoutMissions]);

  const statsData = React.useMemo(
    () =>
      STAT_META.map((stat) => ({
        label: stat.label,
        value: state.stats[stat.key],
        max: 100,
      })),
    [STAT_META, state.stats]
  );

  const dailySummary = React.useMemo(() => {
    const total =
      activeHabits.length +
      workoutMissions.length +
      mealMissions.length +
      tasksCompletedToday;
    const completed =
      completedToday.size +
      workoutMissions.filter((mission) => mission.isCompleted).length +
      mealMissions.filter((mission) => mission.isCompleted).length +
      tasksCompletedToday;
    const calories = mealMissions
      .filter((mission) => mission.isCompleted)
      .reduce((sum, mission) => sum + (mission.totalKcal || 0), 0);

    return {
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      calories,
    };
  }, [
    activeHabits.length,
    completedToday,
    mealMissions,
    tasksCompletedToday,
    workoutMissions,
  ]);

  const nextMission = React.useMemo(() => {
    const workout = workoutMissions.find((mission) => !mission.isCompleted);
    if (workout) {
      return {
        title: workout.title,
        eyebrow: l('Missão física prioritária', 'Priority physical mission'),
        reward: `+${workout.xp_reward} XP`,
        impact: `${workout.stat_target === 'strength' ? 'STR' : 'END'} +${workout.stat_reward}`,
        path: '/workouts',
        action: l('Iniciar missão', 'Start mission'),
        time: workout.scheduled_time,
        icon: Dumbbell,
      };
    }

    const habit = activeHabits.find((item) => !completedToday.has(item.id));
    if (habit) {
      const stat = STAT_META.find((item) => item.key === habit.stat_target);
      return {
        title: habit.title,
        eyebrow: l('Quest diária recomendada', 'Recommended daily quest'),
        reward: `+${habit.xp_reward} XP`,
        impact: habit.stat_target
          ? `${stat?.label || 'ATR'} +${habit.stat_reward}`
          : l('XP de evolução', 'Evolution XP'),
        path: '/quests',
        action: l('Ver missão', 'View mission'),
        time: habit.scheduled_time?.slice(0, 5) || null,
        icon: CheckCircle2,
      };
    }

    const meal = mealMissions.find((mission) => !mission.isCompleted);
    if (meal) {
      return {
        title: meal.title,
        eyebrow: l('Protocolo de recuperação', 'Recovery protocol'),
        reward: meal.xp_reward > 0 ? `+${meal.xp_reward} XP` : `${meal.totalKcal} kcal`,
        impact: l('VIT · Recuperação', 'VIT · Recovery'),
        path: '/nutrition',
        action: l('Ver missão', 'View mission'),
        time: meal.scheduled_time,
        icon: Flame,
      };
    }

    return {
      title: l(
        'Todas as missões de hoje foram concluídas.',
        "All of today's missions are complete."
      ),
      eyebrow: l('Sistema sincronizado', 'System synchronized'),
      reward: `+${state.xpGainedToday || xpEarnedToday} XP ${l('hoje', 'today')}`,
      impact: l('Próxima quest em preparação', 'Next quest loading'),
      path: '/quests',
      action: l('Abrir missões', 'Open missions'),
      time: null,
      icon: Trophy,
    };
  }, [
    STAT_META,
    activeHabits,
    completedToday,
    language,
    mealMissions,
    state.xpGainedToday,
    workoutMissions,
    xpEarnedToday,
  ]);

  const domains = React.useMemo(() => {
    return DOMAIN_META.map((domain) => {
      const value = state.stats[domain.key];
      const latestEvent = evolutionHistory.find((event) => event.domain === domain.name);
      return {
        ...domain,
        value,
        level: Math.max(1, Math.floor(value / 10)),
        progress: (value % 10) * 10,
        xpRemaining: 100 - (value % 10) * 10,
        lastGain:
          latestEvent?.title ||
          (statVariation[domain.key] > 0
            ? `+${statVariation[domain.key]} ${l('registrado hoje', 'logged today')}`
            : l('Sem ganho recente', 'No recent gain')),
      };
    });
  }, [DOMAIN_META, evolutionHistory, language, state.stats, statVariation]);

  const profileReading = React.useMemo(() => {
    const rankedStats = STAT_META.map((stat) => ({
      ...stat,
      value: state.stats[stat.key],
    })).sort((a, b) => b.value - a.value);
    const weakestDomains = [...domains].sort((a, b) => a.value - b.value).slice(0, 2);
    const and = l(' e ', ' & ');
    return {
      dominant: `${rankedStats[0].name}${and}${rankedStats[1].name}`,
      focus: weakestDomains.map((domain) => domain.name).join(and),
    };
  }, [STAT_META, domains, language, state.stats]);

  const evolutionEvents = React.useMemo(() => {
    const events = [...evolutionHistory];
    if (state.streak.current > 0) {
      events.push({
        id: 'streak-current',
        title: l('Sequência mantida', 'Streak maintained'),
        reward: `Streak ${state.streak.current} ${l('dias', 'days')}`,
        domain: l('Disciplina', 'Discipline'),
        color: 'text-[#F59E0B]',
        icon: Flame,
        timestamp: null,
      });
    }
    return events;
  }, [evolutionHistory, language, state.streak.current]);

  // Processamento de Conquistas e Títulos Desbloqueados
  const unlockedTitlesList = React.useMemo(() => {
    const titles = ['Iniciante'];
    unlockedAchievements.forEach((a) => {
      const match = ALL_POSSIBLE_ACHIEVEMENTS.find((p) => p.title === a.title);
      if (match && match.titleReward && !titles.includes(match.titleReward)) {
        titles.push(match.titleReward);
      }
    });
    return titles;
  }, [unlockedAchievements]);

  const sortedAchievements = React.useMemo(() => {
    return [...ALL_POSSIBLE_ACHIEVEMENTS].sort((a, b) => {
      const aUnlocked = unlockedAchievements.some((u) => u.title === a.title);
      const bUnlocked = unlockedAchievements.some((u) => u.title === b.title);
      if (aUnlocked === bUnlocked) return 0;
      return aUnlocked ? -1 : 1;
    });
  }, [unlockedAchievements]);

  const displayedAchievements = showAllAchievements
    ? sortedAchievements
    : sortedAchievements.slice(0, 6);

  const handleEquipTitle = async (titleName: string) => {
    if (!user?.id) return;
    await state.equipTitle(titleName, user.id);
  };

  const safeXpRequired = Math.max(1, state.xpRequired || 100);
  const nextRankLevel = RANK_PROMOTION_LEVELS[state.rank] || 100;
  const currentRankStart = RANK_START_LEVELS[state.rank] || 1;
  const rankProgress =
    state.rank === 'Monarch'
      ? 100
      : Math.min(
          100,
          ((state.level - currentRankStart) /
            Math.max(1, nextRankLevel - currentRankStart)) *
            100
        );
  const todayXp = state.xpGainedToday || xpEarnedToday || 0;
  const NextMissionIcon = nextMission.icon;

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: 'easeOut' as const },
      };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 text-[var(--text-primary)]">
      {/* ── SEÇÃO 1: HERO DO PERSONAGEM + STATUS DE NÍVEL, RANK E XP ── */}
      <motion.section
        id="tour-hud"
        aria-label={l('Ficha Principal do Caçador', 'Hunter Primary Status')}
        {...motionProps}
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-12 lg:gap-5 lg:items-stretch">
          {/* 1A. HERO HOLOGRÁFICO DO PERSONAGEM */}
          <div className="relative h-64 sm:h-72 lg:col-span-5 lg:h-auto overflow-hidden rounded-t-2xl lg:rounded-2xl border border-b-0 lg:border-b border-[var(--hud-border-cyan)] bg-[#0A0C12] shadow-[0_0_28px_rgba(0,240,255,0.08)]">
            <img
              src={characterAvatar}
              alt={`Avatar de ${hunterName}`}
              decoding="async"
              loading="eager"
              fetchPriority="high"
              onError={handleHunterAvatarError}
              className="h-full w-full object-cover object-[center_18%] transition-transform duration-700"
            />

            {/* Iluminação e atmosfera RPG ciano/púrpura */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/35 to-black/25"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_65%_at_50%_0%,rgba(0,240,255,0.15)_0%,rgba(168,85,247,0.08)_45%,transparent_75%)]"
            />

            {/* Topo do Hero: Identificador da Ficha + Botão Ampliar Avatar */}
            <div className="absolute inset-x-4 top-3.5 z-10 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00F0FF]/35 bg-[#07080C]/85 px-3 py-1 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] text-[#00F0FF]">
                  {l('Ficha de Status', 'Player Status')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsAvatarOpen(true)}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#07080C]/85 px-3 py-1 text-[11px] font-semibold text-slate-200 backdrop-blur-md transition-colors hover:border-[#00F0FF]/50 hover:text-[#00F0FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
              >
                <Maximize2 className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                <span>{l('Ver avatar', 'View avatar')}</span>
              </button>
            </div>

            {/* Base do Hero: Título, Nome, Classe e Streak */}
            <div className="absolute inset-x-4 bottom-7 lg:bottom-4 z-10 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#F59E0B]">
                    <Crown className="h-3.5 w-3.5 shrink-0 text-[#F59E0B]" aria-hidden="true" />
                    <span className="truncate">{hunterTitle}</span>
                  </div>
                  <h1 className="mt-0.5 truncate font-orbitron text-2xl sm:text-3xl font-black uppercase tracking-[0.04em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                    {hunterName}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F0FF]/35 bg-[#07080C]/85 px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.1em] text-[#00F0FF] backdrop-blur-md">
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  {hunterClassLabel}
                </span>

                <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/35 bg-[#07080C]/85 px-2.5 py-1 font-orbitron text-[10px] font-bold uppercase tracking-[0.1em] text-amber-300 backdrop-blur-md">
                  <Flame className="h-3 w-3 text-amber-400" aria-hidden="true" />
                  Streak {state.streak.current} {l('dias', 'days')}
                </span>
              </div>
            </div>
          </div>

          {/* 1B. PAINEL DE NÍVEL, RANK E XP (HUD CARD ELEVATED - DISTRIBUIÇÃO EQUILIBRADA) */}
          <div className="relative z-10 -mt-3 lg:mt-0 lg:col-span-7">
            <HudCard
              variant="elevated"
              corners
              className="h-full border-[var(--hud-border-strong)] bg-[#10131D]/95 backdrop-blur-xl"
              contentClassName="flex h-full flex-col justify-center gap-3 sm:gap-4"
            >
              {/* Cabeçalho do Card */}
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-1 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]"
                  />
                  <div>
                    <h2 className="font-orbitron text-xs sm:text-[13px] font-bold uppercase tracking-[0.14em] text-slate-100">
                      {l('Perfil do Caçador', 'Hunter Profile')}
                    </h2>
                  </div>
                </div>

                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {l('Sincronização Neural', 'Neural Sync')}
                </span>
              </div>

              {/* Bloco Principal: Level + RankBadge (sem duplicar letra) + NeonProgressBar */}
              <div className="rounded-xl border border-white/[0.07] bg-[#0B0D14]/85 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="font-orbitron text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-slate-400">
                      {l('Experiência do Hunter', 'Hunter Experience')}
                    </span>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-orbitron text-3xl sm:text-4xl font-black leading-none tracking-tight text-[#00F0FF] drop-shadow-[0_0_12px_rgba(0,240,255,0.4)] tabular-nums">
                        LEVEL {state.level}
                      </span>
                      {state.level >= MAX_LEVEL && (
                        <span className="rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-1.5 py-0.5 font-orbitron text-[10px] font-bold uppercase text-[#F59E0B]">
                          MAX
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RankBadge sem duplicação de texto externo */}
                  <div className="flex items-center gap-2.5">
                    <span className="font-orbitron text-[11px] font-bold uppercase leading-none tracking-[0.14em] text-[#F59E0B]">
                      RANK
                    </span>
                    <RankBadge rank={state.rank || 'E'} size="md" showLabel={false} />
                  </div>
                </div>

                {/* Barra de XP Oficial */}
                <div className="mt-3.5 border-t border-white/[0.06] pt-3.5 space-y-2">
                  <NeonProgressBar
                    value={state.level >= MAX_LEVEL ? 100 : state.xp}
                    max={state.level >= MAX_LEVEL ? 100 : safeXpRequired}
                    variant="xp"
                    size="md"
                    ariaLabel={l(
                      'Progresso de XP até o próximo nível',
                      'XP progress to next level'
                    )}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs leading-none tabular-nums">
                    <span className="inline-flex items-center gap-1 font-orbitron text-xs font-bold text-[#00F0FF]">
                      <Zap className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {state.xp} / {state.xpRequired} XP
                      </span>
                    </span>
                    <span className="font-medium text-slate-300">
                      {state.level >= MAX_LEVEL
                        ? l('Nível máximo alcançado', 'Maximum level reached')
                        : `${Math.max(0, state.xpRequired - state.xp)} XP ${l(
                            'para o Level',
                            'to Level'
                          )} ${state.level + 1}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-cards de Ascensão de Rank e Resumo de XP Diário/Semanal */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.07] bg-[#0B0D14]/65 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {l('Próximo Rank', 'Next Rank')}
                    </span>
                    <span className="font-orbitron text-xs font-bold text-[#00F0FF] tabular-nums">
                      {state.rank === 'Monarch'
                        ? 'MAX'
                        : `${NEXT_RANK[state.rank] || 'D'} · LV. ${nextRankLevel}`}
                    </span>
                  </div>
                  <NeonProgressBar
                    value={rankProgress}
                    max={100}
                    variant="cyan"
                    size="sm"
                    ariaLabel={l('Progresso para o próximo Rank', 'Progress to next Rank')}
                    className="mt-2.5"
                  />
                  <p className="mt-2 text-[11px] font-medium text-slate-400">
                    {state.rank === 'Monarch'
                      ? l('Ápice da hierarquia atingido', 'Peak hierarchy reached')
                      : `${Math.max(0, nextRankLevel - state.level)} ${l(
                          'níveis até a promoção de Rank',
                          'levels until Rank promotion'
                        )}`}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#0B0D14]/65 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {l('Resumo de Hoje', "Today's Summary")}
                    </span>
                    <span className="font-orbitron text-xs font-bold text-[#A855F7] tabular-nums">
                      {dailySummary.completed}/{dailySummary.total || 0}{' '}
                      {l('missões', 'quests')}
                    </span>
                  </div>
                  <NeonProgressBar
                    value={todayXp}
                    max={DAILY_COMMON_XP_EFFECTIVE_MAX}
                    variant="xp"
                    size="sm"
                    ariaLabel={l('XP diário acumulado', 'Daily XP earned')}
                    className="mt-2.5"
                  />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[11px] font-medium text-slate-400 tabular-nums">
                    <span>
                      {todayXp} / {DAILY_COMMON_XP_EFFECTIVE_MAX} {l('XP diário', 'daily XP')}
                    </span>
                    <span className="text-slate-500">
                      {l('Bônus', 'Bonus')} {state.bonusXpGainedWeek}/{WEEKLY_BONUS_XP_CAP}
                    </span>
                  </div>
                </div>
              </div>
            </HudCard>
          </div>
        </div>
      </motion.section>

      {/* ── SEÇÃO 2: PAINEL DE ATRIBUTOS + GRÁFICO DE RADAR HOLOGRÁFICO ── */}
      <motion.section
        id="tour-status"
        aria-labelledby="attributes-title"
        {...motionProps}
      >
        <HudCard variant="default" corners className="border-[var(--hud-border-strong)]">
          {/* Cabeçalho da Seção de Atributos */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-4 w-1 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]"
              />
              <div>
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#00F0FF]">
                  {l('Parâmetros do Sistema', 'System Parameters')}
                </p>
                <h2
                  id="attributes-title"
                  className="font-orbitron text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white"
                >
                  {l('Atributos Principais', 'Attributes')}
                </h2>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-lg border border-[#A855F7]/30 bg-[#A855F7]/10 px-3 py-1.5">
              <Activity className="h-3.5 w-3.5 text-[#A855F7]" aria-hidden="true" />
              <span className="text-xs font-semibold text-purple-200">
                {l('Dominante:', 'Dominant:')} <strong>{profileReading.dominant}</strong>
              </span>
            </div>
          </div>

          {/* Grid Responsivo: Lista de Atributos (Esquerda) + Radar Holográfico (Direita) */}
          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-center">
            {/* Lista Tática de Atributos Reais */}
            <div className="space-y-2.5 lg:col-span-6">
              {STAT_META.map((stat) => {
                const Icon = stat.icon;
                const value = state.stats[stat.key];
                const tierLevel = Math.max(1, Math.floor(value / 10));
                const tierProgress = (value % 10) * 10;
                const todayGain = statVariation[stat.key];

                return (
                  <div
                    key={stat.key}
                    className="group rounded-xl border border-white/[0.07] bg-[#0B0D14]/80 px-3.5 py-2.5 transition-colors hover:border-[#00F0FF]/35 hover:bg-[#0E111A]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${stat.iconBg}`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-white truncate">
                              {stat.name}
                            </span>
                            <span
                              className={`font-orbitron text-[10px] font-bold uppercase tracking-wider ${stat.color}`}
                            >
                              {stat.label}
                            </span>
                            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-orbitron text-[9px] font-bold text-slate-400">
                              Nv. {tierLevel}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <NeonProgressBar
                              value={tierProgress}
                              max={100}
                              variant="xp"
                              size="sm"
                              ariaLabel={`${stat.name} tier progress`}
                              className="w-28 sm:w-36"
                            />
                            {todayGain > 0 && (
                              <span className="font-orbitron text-[10px] font-bold text-emerald-400">
                                +{todayGain} {l('hoje', 'today')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-orbitron text-xl sm:text-2xl font-black text-white tabular-nums">
                          {value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gráfico de Radar Holográfico + Diagnóstico */}
            <div className="flex flex-col items-center justify-between rounded-2xl border border-white/[0.07] bg-[#0B0D14]/70 p-4 sm:p-5 lg:col-span-6">
              <div className="w-full flex items-center justify-between border-b border-white/[0.05] pb-2.5 mb-2">
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] text-[#00F0FF]">
                  {l('Leitura Holográfica', 'Holographic Reading')}
                </span>
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  {l('Janela de Status', 'Status Window')}
                </span>
              </div>

              <div className="my-2 flex w-full items-center justify-center overflow-hidden py-2">
                <RadarChart stats={statsData} size={310} />
              </div>

              <div className="mt-2 grid w-full grid-cols-1 gap-2.5 border-t border-white/[0.06] pt-3.5 sm:grid-cols-3">
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <p className="font-orbitron text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {l('Perfil dominante', 'Dominant profile')}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#00F0FF] truncate">
                    {profileReading.dominant}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <p className="font-orbitron text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {l('Classe atual', 'Current class')}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#A855F7] truncate">
                    {hunterClassLabel}
                  </p>
                </div>
                <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <p className="font-orbitron text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {l('Foco recomendado', 'Recommended focus')}
                  </p>
                  <p className="mt-0.5 text-xs font-bold text-[#F59E0B] truncate">
                    {profileReading.focus}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </HudCard>
      </motion.section>

      {/* ── SEÇÃO 3: CONQUISTAS E TÍTULOS DE PRESTÍGIO (RECENT ACHIEVEMENTS) ── */}
      <motion.section
        aria-labelledby="achievements-heading"
        {...motionProps}
      >
        <HudCard variant="gold" corners>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-3.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className="h-4 w-1 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]"
              />
              <div>
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#F59E0B]">
                  {l('Insígnias & Honrarias da Fenda', 'Rift Medals & Honors')}
                </p>
                <h2
                  id="achievements-heading"
                  className="font-orbitron text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white"
                >
                  {l('Conquistas Recentes', 'Recent Achievements')}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-[#F59E0B]/35 bg-[#F59E0B]/10 px-3 py-1 font-orbitron text-xs font-bold text-[#F59E0B] tabular-nums">
                {unlockedAchievements.length} / {ALL_POSSIBLE_ACHIEVEMENTS.length}
              </span>

              <Link
                to="/trophies"
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-[#F59E0B] transition-colors hover:bg-[#F59E0B]/20 hover:border-[#F59E0B]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
                title={l('Acessar Salão de Troféus completo', 'Open complete Trophy Room')}
              >
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">{l('Salão de Troféus', 'Trophy Room')}</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowAllAchievements((prev) => !prev)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-200 transition-colors hover:border-[#F59E0B]/50 hover:text-[#F59E0B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F59E0B]"
              >
                <span>
                  {showAllAchievements
                    ? l('Mostrar Recentes', 'Show Recent')
                    : l('Ver Todas', 'View All')}
                </span>
                {showAllAchievements ? (
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Barra de Títulos Desbloqueados Equipáveis */}
          <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#0B0D14]/75 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-orbitron text-[11px] font-bold uppercase tracking-wider text-[#F59E0B]">
                <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                {l('Títulos Desbloqueados', 'Unlocked Titles')}
              </span>
              <span className="text-xs text-slate-400">
                {l('Toque para equipar no perfil', 'Tap to equip on profile')}
              </span>
            </div>

            <div className="mt-2.5 flex flex-wrap gap-2">
              {unlockedTitlesList.map((titleName) => {
                const isEquipped = state.activeTitle === titleName;
                const displayTitle = isEnglish
                  ? translateUiText(titleName)
                  : titleName;
                return (
                  <button
                    key={titleName}
                    type="button"
                    onClick={() => void handleEquipTitle(titleName)}
                    className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isEquipped
                        ? 'border-[#F59E0B]/60 bg-[#F59E0B]/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                        : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white'
                    }`}
                  >
                    <span>{displayTitle}</span>
                    {isEquipped && <CheckCircle2 className="h-3 w-3 text-[#F59E0B]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid de Medalhas Reais */}
          {loadingAchievements ? (
            <div className="mt-4 flex min-h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0B0D14]/40">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#F59E0B]" />
              <span className="ml-2 font-orbitron text-xs font-bold uppercase tracking-wider text-slate-400">
                {l('Sincronizando conquistas...', 'Syncing achievements...')}
              </span>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {displayedAchievements.map((item) => {
                const matchingUnlock = unlockedAchievements.find(
                  (a) => a.title === item.title
                );
                const isUnlocked = Boolean(matchingUnlock);
                const localized = isEnglish ? EN_ACHIEVEMENT_COPY[item.key] : null;

                return (
                  <div
                    key={item.key}
                    className={`relative flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                      isUnlocked
                        ? 'border-[#F59E0B]/40 bg-gradient-to-br from-[#F59E0B]/10 via-[#12141F] to-[#A855F7]/10 shadow-[0_0_18px_rgba(245,158,11,0.08)]'
                        : 'border-white/[0.06] bg-[#0B0D14]/60 opacity-70'
                    }`}
                  >
                    {/* Emblema / Escudo da Conquista */}
                    <div
                      className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                        isUnlocked
                          ? 'border-[#F59E0B]/50 bg-gradient-to-b from-[#F59E0B]/25 to-[#A855F7]/20 text-[#F59E0B] shadow-[0_0_14px_rgba(245,158,11,0.25)]'
                          : 'border-white/10 bg-white/[0.03] text-slate-500'
                      }`}
                    >
                      {renderAchievementIcon(item.icon, 'h-5 w-5')}
                      {!isUnlocked && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/15 bg-[#07080C] text-slate-400">
                          <Lock className="h-2.5 w-2.5" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-orbitron text-xs font-bold uppercase leading-snug ${
                            isUnlocked ? 'text-amber-200' : 'text-slate-300'
                          }`}
                        >
                          {localized?.title || item.title}
                        </h3>
                        <span
                          className={`shrink-0 font-orbitron text-[10px] font-bold ${
                            isUnlocked ? 'text-[#F59E0B]' : 'text-slate-500'
                          }`}
                        >
                          +{item.xp} XP
                        </span>
                      </div>

                      <p className="mt-1 text-xs leading-snug text-slate-400">
                        {localized?.desc || item.desc}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] font-semibold">
                        <span
                          className={
                            isUnlocked ? 'text-purple-300' : 'text-slate-500'
                          }
                        >
                          {l('Título:', 'Title:')}{' '}
                          {isEnglish
                            ? translateUiText(item.titleReward)
                            : item.titleReward}
                        </span>

                        {isUnlocked && matchingUnlock?.unlocked_at && (
                          <span className="text-emerald-400 tabular-nums">
                            {new Date(matchingUnlock.unlocked_at).toLocaleDateString(
                              language
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </HudCard>
      </motion.section>

      {/* ── SEÇÃO 4: MISSÃO PRIORITÁRIA RECOMENDADA ── */}
      <motion.section
        aria-label={l('Missão Principal', 'Main Mission')}
        {...motionProps}
      >
        <HudCard variant="purple" corners>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/35 bg-[#A855F7]/15 text-[#A855F7]">
                {habitsLoading ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <NextMissionIcon className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#C084FC]">
                    {l('Missão Principal', 'Main Mission')} · {nextMission.eyebrow}
                  </span>
                  {nextMission.time && (
                    <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 font-orbitron text-[9px] font-bold text-slate-300">
                      {nextMission.time}
                    </span>
                  )}
                </div>
                <h2 className="mt-1 font-orbitron text-sm sm:text-base font-bold uppercase text-white">
                  {nextMission.title}
                </h2>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="text-[#F59E0B]">{nextMission.reward}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-[#00F0FF]">{nextMission.impact}</span>
                </div>
              </div>
            </div>

            <TacticalButton
              variant="secondary"
              accent="purple"
              displayFont
              disabled={habitsLoading}
              onClick={() => navigate(nextMission.path)}
              rightIcon={!habitsLoading ? <ArrowRight className="h-4 w-4" /> : undefined}
              className="shrink-0 md:w-auto"
            >
              {habitsLoading ? l('Sincronizando', 'Syncing') : nextMission.action}
            </TacticalButton>
          </div>
        </HudCard>
      </motion.section>

      {/* ── SEÇÃO 5: PROGRESSÃO DO PERSONAGEM (DOMÍNIOS, RECURSOS DO DIA E HISTÓRICO) ── */}
      <div className="space-y-6">
        {/* 5A. RECURSOS BIOMÉTRICOS DO DIA */}
        <motion.section
          id="tour-biometrics"
          aria-labelledby="biometrics-heading"
          {...motionProps}
        >
          <HudCard variant="cyan" corners>
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-3">
              <div>
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#00F0FF]">
                  {l('Leitura Diária', 'Daily Reading')}
                </p>
                <h2
                  id="biometrics-heading"
                  className="font-orbitron text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white"
                >
                  {l('Recursos do Dia', "Day's Resources")}
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {dailySummary.progress >= 70
                  ? l(
                      'Ritmo elevado. Sua progressão diária está consistente.',
                      'High pace. Your daily progression is consistent.'
                    )
                  : l(
                      'Potencial disponível. Complete novas ações para fortalecer sua ficha.',
                      'Potential available. Complete new actions to strengthen your profile.'
                    )}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  label: l('Mana', 'Mana'),
                  detail: l('Energia registrada', 'Energy logged'),
                  value: `${dailySummary.calories}`,
                  unit: 'kcal',
                  icon: Flame,
                  color: 'text-rose-400',
                },
                {
                  label: l('Força Vital', 'Vital Force'),
                  detail: l('Volume mobilizado', 'Volume moved'),
                  value: `${Math.round(todayVolume)}`,
                  unit: 'kg',
                  icon: Dumbbell,
                  color: 'text-[#00F0FF]',
                },
                {
                  label: l('Ritmo de Evolução', 'Evolution Pace'),
                  detail: l('Progresso diário', 'Daily progress'),
                  value: `${dailySummary.progress}`,
                  unit: '%',
                  icon: TrendingUp,
                  color: 'text-[#A855F7]',
                },
                {
                  label: l('Sequência', 'Streak'),
                  detail: l('Dias consecutivos', 'Consecutive days'),
                  value: `${state.streak.current}`,
                  unit: l('dias', 'days'),
                  icon: Flame,
                  color: 'text-[#F59E0B]',
                },
              ].map((resource) => {
                const Icon = resource.icon;
                return (
                  <div
                    key={resource.label}
                    className="rounded-xl border border-white/[0.07] bg-[#0B0D14]/80 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <Icon className={`h-4 w-4 ${resource.color}`} aria-hidden="true" />
                      <span className="font-orbitron text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {resource.label}
                      </span>
                    </div>
                    <p className="mt-3 font-orbitron text-xl font-black text-white tabular-nums">
                      {loadingDailySignals ? (
                        <LoaderCircle className="h-5 w-5 animate-spin text-slate-500" />
                      ) : (
                        <>
                          {resource.value}{' '}
                          <span className="text-[10px] font-semibold text-slate-400">
                            {resource.unit}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                      {resource.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </HudCard>
        </motion.section>

        {/* 5B. DOMÍNIOS DE EVOLUÇÃO + HISTÓRICO DE EVOLUÇÃO */}
        <div className="grid items-start gap-6 lg:grid-cols-12">
          <motion.section
            id="tour-domains"
            aria-labelledby="domains-heading"
            {...motionProps}
            className="lg:col-span-7"
          >
            <HudCard variant="default" corners>
              <div className="border-b border-white/[0.07] pb-3">
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#A855F7]">
                  {l('Progressão do Personagem', 'Character Progression')}
                </p>
                <h2
                  id="domains-heading"
                  className="font-orbitron text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white"
                >
                  {l('Domínios de Evolução', 'Evolution Domains')}
                </h2>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {domains.map((domain) => {
                  const Icon = domain.icon;
                  return (
                    <div
                      key={domain.name}
                      className="rounded-xl border border-white/[0.07] bg-[#0B0D14]/75 p-3.5 transition-colors hover:border-white/20"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-200">
                            <Icon className={`h-4 w-4 ${domain.accentText}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-orbitron text-xs font-bold uppercase text-white">
                                {domain.name}
                              </h3>
                              <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-orbitron text-[9px] font-bold text-slate-400">
                                {domain.attributes}
                              </span>
                            </div>
                            <p className="mt-0.5 text-[10px] font-semibold text-purple-300">
                              {l('Meta:', 'Target:')} {domain.nextReward}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-orbitron text-[10px] font-bold text-[#00F0FF] tabular-nums">
                            {domain.value} pts
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-white/[0.05] pt-2 text-[10px]">
                        <span className="truncate text-slate-400">
                          <span className="text-slate-500 font-bold uppercase">{l('Último ganho: ', 'Last gain: ')}</span>
                          {domain.lastGain}
                        </span>
                        <span className="shrink-0 font-orbitron font-semibold text-slate-400 tabular-nums">
                          {domain.progress}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </HudCard>
          </motion.section>

          <motion.section
            id="tour-history"
            aria-labelledby="history-heading"
            {...motionProps}
            className="lg:col-span-5"
          >
            <HudCard variant="default" corners>
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <div>
                  <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#00F0FF]">
                    {l('Registro do Sistema', 'System Log')}
                  </p>
                  <h2
                    id="history-heading"
                    className="font-orbitron text-base sm:text-lg font-black uppercase tracking-[0.08em] text-white"
                  >
                    {l('Histórico de Evolução', 'Evolution History')}
                  </h2>
                </div>
                <History className="h-5 w-5 text-[#00F0FF]" aria-hidden="true" />
              </div>

              <div
                className={`mt-4 ${
                  evolutionEvents.length > 5 ? 'max-h-[420px] overflow-y-auto pr-1' : ''
                } space-y-2.5`}
              >
                {loadingDailySignals ? (
                  <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#0B0D14]/40">
                    <LoaderCircle className="h-5 w-5 animate-spin text-[#00F0FF]" />
                    <span className="ml-2 font-orbitron text-xs font-bold uppercase tracking-wider text-slate-400">
                      {l('Sincronizando registros', 'Syncing records')}
                    </span>
                  </div>
                ) : evolutionEvents.length > 0 ? (
                  evolutionEvents.map((event) => {
                    const Icon = event.icon;
                    return (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-[#0B0D14]/75 p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/40">
                          <Icon className={`h-4 w-4 ${event.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-orbitron text-xs font-bold uppercase text-white">
                              {event.title}
                            </p>
                            <span className="shrink-0 text-[10px] font-medium text-slate-400">
                              {formatEvolutionTime(event.timestamp, language)}
                            </span>
                          </div>
                          <p
                            className={`mt-0.5 font-orbitron text-[11px] font-bold ${event.color}`}
                          >
                            {event.reward}
                          </p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-400">
                            {l('Domínio:', 'Domain:')} {event.domain}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#0B0D14]/50 p-6 text-center">
                    <Sparkles className="mx-auto h-6 w-6 text-slate-500" />
                    <p className="mt-3 font-orbitron text-xs font-bold uppercase tracking-wider text-slate-300">
                      {l(
                        'O Sistema ainda não registrou evolução hoje.',
                        'The System has no evolution records for today.'
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {l(
                        'Complete uma missão para gerar seu primeiro registro.',
                        'Complete a mission to generate your first record.'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/quests')}
                      className="mt-4 inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#00F0FF]/35 bg-[#00F0FF]/10 px-4 font-orbitron text-[10px] font-bold uppercase tracking-wider text-[#00F0FF] transition-colors hover:bg-[#00F0FF]/20"
                    >
                      <span>
                        {l('Ver missões disponíveis', 'View available missions')}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </HudCard>
          </motion.section>
        </div>
      </div>

      {/* Lightbox de Inspeção do Avatar */}
      <AnimatePresence>
        {isAvatarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Fechar avatar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative z-10 aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-[#00F0FF]/35 bg-[#07080C] shadow-[0_0_40px_rgba(0,240,255,0.2)]"
            >
              <img
                src={characterAvatar}
                alt="Avatar ampliado do Caçador"
                loading="lazy"
                decoding="async"
                onError={handleHunterAvatarError}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/80 to-transparent p-6">
                <p className="font-orbitron text-xl font-black uppercase text-white">
                  {hunterName}
                </p>
                <p className="mt-1 font-orbitron text-xs font-bold uppercase tracking-widest text-[#00F0FF]">
                  {hunterClassLabel} · Rank {state.rank} · Level {state.level}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarOpen(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-[#07080C]/80 text-slate-200 backdrop-blur-md transition-colors hover:border-[#00F0FF]/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
