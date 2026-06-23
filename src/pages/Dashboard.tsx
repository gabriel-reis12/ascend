import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Coins,
  Crown,
  Dumbbell,
  Flame,
  HeartPulse,
  History,
  LoaderCircle,
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

type StatKey = keyof HunterStats;

interface EvolutionEvent {
  id: string;
  title: string;
  reward: string;
  domain: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  timestamp: string | null;
}

const STAT_META: Array<{
  key: StatKey;
  label: string;
  name: string;
  color: string;
  border: string;
}> = [
  { key: 'strength', label: 'FOR', name: 'Força', color: 'text-red-400', border: 'hover:border-red-500/35' },
  { key: 'intelligence', label: 'INT', name: 'Inteligência', color: 'text-blue-400', border: 'hover:border-blue-500/35' },
  { key: 'endurance', label: 'RES', name: 'Resistência', color: 'text-emerald-400', border: 'hover:border-emerald-500/35' },
  { key: 'vitality', label: 'VIT', name: 'Vitalidade', color: 'text-amber-400', border: 'hover:border-amber-500/35' },
  { key: 'discipline', label: 'DIS', name: 'Disciplina', color: 'text-purple-400', border: 'hover:border-purple-500/35' },
  { key: 'wisdom', label: 'SAB', name: 'Sabedoria', color: 'text-cyan-400', border: 'hover:border-cyan-500/35' },
  { key: 'balance', label: 'EQU', name: 'Equilíbrio', color: 'text-pink-400', border: 'hover:border-pink-500/35' },
];

const NEXT_RANK: Record<string, string> = {
  E: 'D',
  D: 'C',
  C: 'B',
  B: 'A',
  A: 'S',
  S: 'National',
  National: 'Monarch',
  Monarch: 'Máximo',
};

const DOMAIN_META: Array<{
  key: StatKey;
  name: string;
  attributes: string;
  color: string;
  nextReward: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: 'strength', name: 'Força', attributes: 'FOR', color: 'from-red-500 to-orange-500', nextReward: '+1 Potência', icon: Sword },
  { key: 'intelligence', name: 'Inteligência', attributes: 'INT', color: 'from-blue-500 to-indigo-500', nextReward: 'Leitura Consistente', icon: Brain },
  { key: 'endurance', name: 'Resistência', attributes: 'RES', color: 'from-emerald-500 to-teal-500', nextReward: '+1 Fôlego', icon: Shield },
  { key: 'vitality', name: 'Vitalidade', attributes: 'VIT', color: 'from-amber-500 to-orange-500', nextReward: '+1 Recuperação', icon: HeartPulse },
  { key: 'discipline', name: 'Disciplina', attributes: 'DIS', color: 'from-purple-500 to-fuchsia-500', nextReward: 'Foco Profundo', icon: Target },
  { key: 'wisdom', name: 'Sabedoria', attributes: 'SAB', color: 'from-cyan-500 to-blue-500', nextReward: '+1 Percepção', icon: Coins },
  { key: 'balance', name: 'Equilíbrio', attributes: 'EQU', color: 'from-pink-500 to-rose-500', nextReward: '+1 Harmonia', icon: Scale },
];

function formatEvolutionTime(timestamp: string | null, locale: string) {
  if (!timestamp) return locale === 'en-US' ? 'Today' : 'Hoje';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return locale === 'en-US' ? 'Today' : 'Hoje';
  return `${locale === 'en-US' ? 'Today' : 'Hoje'}, ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
}

export function Dashboard() {
  const { language } = usePreferences();
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

  const workoutStatusKey = React.useMemo(
    () => JSON.stringify(workoutMissions.map(mission => mission.isCompleted)),
    [workoutMissions],
  );

  React.useEffect(() => {
    async function fetchDailySignals() {
      if (!user?.id) {
        setLoadingDailySignals(false);
        return;
      }
      setLoadingDailySignals(true);
      const { startIso, endIso } = localDayBounds();

      const [workouts, tasks, finances, habitCompletions, routineCompletions, mealCompletions] = await Promise.all([
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
            (sum, log) => sum + (Number(log.sets) || 0) * (Number(log.reps) || 0) * (Number(log.weight_kg) || 0),
            0,
          ),
        );
      }
      if (!tasks.error) setTasksCompletedToday((tasks.data || []).length);
      const events: EvolutionEvent[] = [];
      const statDomain = (statTarget: string | null) => {
        const stat = STAT_META.find(item => item.key === statTarget);
        return stat ? stat.name : 'Evolução';
      };
      const statLabel = (statTarget: string | null) => {
        const stat = STAT_META.find(item => item.key === statTarget);
        return stat?.label || null;
      };

      (tasks.data || []).forEach(task => {
        const attribute = statLabel(task.stat_target);
        events.push({
          id: `task-${task.id}`,
          title: task.title,
          reward: `+${task.xp_reward || 0} XP${attribute ? ` · ${attribute} +${task.stat_reward || 0}` : ''}`,
          domain: statDomain(task.stat_target),
          color: 'text-blue-400',
          icon: CheckCircle2,
          timestamp: task.completed_at,
        });
      });

      (habitCompletions.data || []).forEach((completion: any) => {
        const habit = Array.isArray(completion.habit) ? completion.habit[0] : completion.habit;
        if (!habit) return;
        const attribute = statLabel(habit.stat_target);
        events.push({
          id: `habit-${completion.id}`,
          title: habit.title,
          reward: `+${habit.xp_reward || 0} XP${attribute ? ` · ${attribute} +${habit.stat_reward || 0}` : ''}`,
          domain: statDomain(habit.stat_target),
          color: 'text-cyan-400',
          icon: CheckCircle2,
          timestamp: completion.created_at,
        });
      });

      (routineCompletions.data || []).forEach((completion: any) => {
        const routine = Array.isArray(completion.routine) ? completion.routine[0] : completion.routine;
        const statTarget = routine?.name?.toLowerCase().includes('cardio') ? 'endurance' : 'strength';
        const attribute = statLabel(statTarget);
        events.push({
          id: `routine-${completion.id}`,
          title: routine?.name || 'Treino concluído',
          reward: `+${completion.xp_awarded || 0} XP · ${attribute} +2 · VIT +1 · DIS +1`,
          domain: statDomain(statTarget),
          color: 'text-purple-400',
          icon: Dumbbell,
          timestamp: completion.created_at,
        });
      });

      (mealCompletions.data || []).forEach((completion: any) => {
        const meal = Array.isArray(completion.meal_plan) ? completion.meal_plan[0] : completion.meal_plan;
        events.push({
          id: `meal-${completion.id}`,
          title: meal?.name || 'Refeição registrada',
          reward: 'Recuperação registrada · VIT',
          domain: 'Vitalidade',
          color: 'text-orange-400',
          icon: Flame,
          timestamp: completion.created_at,
        });
      });

      (finances.data || []).forEach(log => {
        const wisdomGain = log.type === 'investment' ? ' · SAB +1' : '';
        events.push({
          id: `finance-${log.id}`,
          title: log.description || 'Finanças atualizadas',
          reward: `+10 XP${wisdomGain}`,
          domain: 'Sabedoria',
          color: 'text-emerald-400',
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
  }, [user?.id, workoutStatusKey, completedToday]);

  const characterAvatar = React.useMemo(() => {
    const hunterClass = state.hunterClass || 'Warrior';
    const upperRank = String(state.rank || 'E').toUpperCase();
    const imageRank = ['E', 'D', 'C', 'B', 'A', 'S'].includes(upperRank) ? upperRank : 'S';
    return `/Classes/${hunterClass}/Rank ${imageRank}.jpeg`;
  }, [state.hunterClass, state.rank]);

  const statVariation = React.useMemo(() => {
    const variations = Object.fromEntries(STAT_META.map(stat => [stat.key, 0])) as Record<StatKey, number>;

    activeHabits.forEach(habit => {
      if (completedToday.has(habit.id) && habit.stat_target) {
        variations[habit.stat_target] += habit.stat_reward || 0;
      }
    });
    workoutMissions.forEach(mission => {
      if (mission.isCompleted) variations[mission.stat_target] += mission.stat_reward || 0;
    });

    return variations;
  }, [activeHabits, completedToday, workoutMissions]);

  const statRecentXp = React.useMemo(() => {
    const xpByStat = Object.fromEntries(STAT_META.map(stat => [stat.key, 0])) as Record<StatKey, number>;

    activeHabits.forEach(habit => {
      if (completedToday.has(habit.id) && habit.stat_target) {
        xpByStat[habit.stat_target] += habit.xp_reward || 0;
      }
    });
    workoutMissions.forEach(mission => {
      if (mission.isCompleted) xpByStat[mission.stat_target] += mission.xp_reward || 0;
    });

    return xpByStat;
  }, [activeHabits, completedToday, workoutMissions]);

  const statsData = React.useMemo(
    () => STAT_META.map(stat => ({ label: stat.label, value: state.stats[stat.key], max: 100 })),
    [state.stats],
  );

  const dailySummary = React.useMemo(() => {
    const total = activeHabits.length + workoutMissions.length + mealMissions.length + tasksCompletedToday;
    const completed =
      completedToday.size +
      workoutMissions.filter(mission => mission.isCompleted).length +
      mealMissions.filter(mission => mission.isCompleted).length +
      tasksCompletedToday;
    const calories = mealMissions
      .filter(mission => mission.isCompleted)
      .reduce((sum, mission) => sum + (mission.totalKcal || 0), 0);

    return {
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      calories,
    };
  }, [activeHabits.length, completedToday, mealMissions, tasksCompletedToday, workoutMissions]);

  const nextMission = React.useMemo(() => {
    const workout = workoutMissions.find(mission => !mission.isCompleted);
    if (workout) {
      return {
        title: workout.title,
        eyebrow: 'Missão física prioritária',
        reward: `+${workout.xp_reward} XP`,
        impact: `${workout.stat_target === 'strength' ? 'FOR' : 'RES'} +${workout.stat_reward}`,
        path: '/workouts',
        action: 'Iniciar missão',
        time: workout.scheduled_time,
        icon: Dumbbell,
      };
    }

    const habit = activeHabits.find(item => !completedToday.has(item.id));
    if (habit) {
      const stat = STAT_META.find(item => item.key === habit.stat_target);
      return {
        title: habit.title,
        eyebrow: 'Quest diária recomendada',
        reward: `+${habit.xp_reward} XP`,
        impact: habit.stat_target ? `${stat?.label || 'ATR'} +${habit.stat_reward}` : 'XP de evolução',
        path: '/quests',
        action: 'Ver missão',
        time: habit.scheduled_time?.slice(0, 5) || null,
        icon: CheckCircle2,
      };
    }

    const meal = mealMissions.find(mission => !mission.isCompleted);
    if (meal) {
      return {
        title: meal.title,
        eyebrow: 'Protocolo de recuperação',
        reward: meal.xp_reward > 0 ? `+${meal.xp_reward} XP` : `${meal.totalKcal} kcal`,
        impact: 'VIT · Recuperação',
        path: '/nutrition',
        action: 'Ver missão',
        time: meal.scheduled_time,
        icon: Flame,
      };
    }

    return {
      title: 'Todas as missões de hoje foram concluídas.',
      eyebrow: 'Sistema sincronizado',
      reward: `+${state.xpGainedToday || xpEarnedToday} XP hoje`,
      impact: 'Próxima quest em preparação',
      path: '/quests',
      action: 'Abrir missões',
      time: null,
      icon: Trophy,
    };
  }, [
    activeHabits,
    completedToday,
    mealMissions,
    state.xpGainedToday,
    workoutMissions,
    xpEarnedToday,
  ]);

  const domains = React.useMemo(() => {
    return DOMAIN_META.map(domain => {
      const value = state.stats[domain.key];
      const latestEvent = evolutionHistory.find(event => event.domain === domain.name);
      return {
        ...domain,
        value,
        level: Math.max(1, Math.floor(value / 10)),
        progress: (value % 10) * 10,
        xpRemaining: 100 - (value % 10) * 10,
        lastGain: latestEvent?.title || (statVariation[domain.key] > 0 ? `+${statVariation[domain.key]} registrado hoje` : 'Sem ganho recente'),
      };
    });
  }, [evolutionHistory, state.stats, statVariation]);

  const profileReading = React.useMemo(() => {
    const rankedStats = STAT_META
      .map(stat => ({ ...stat, value: state.stats[stat.key] }))
      .sort((a, b) => b.value - a.value);
    const weakestDomains = [...domains].sort((a, b) => a.value - b.value).slice(0, 2);

    return {
      dominant: `${rankedStats[0].name} e ${rankedStats[1].name}`,
      focus: weakestDomains.map(domain => domain.name).join(' e '),
    };
  }, [domains, state.stats]);

  const evolutionEvents = React.useMemo(() => {
    const events = [...evolutionHistory];
    if (state.streak.current > 0) {
      events.push({
        id: 'streak-current',
        title: 'Sequência mantida',
        reward: `Streak ${state.streak.current} dias`,
        domain: 'Disciplina',
        color: 'text-orange-400',
        icon: Flame,
        timestamp: null,
      });
    }
    return events;
  }, [evolutionHistory, state.streak.current]);

  const xpPercent = state.level >= MAX_LEVEL
    ? 100
    : state.xpRequired > 0
      ? Math.min(100, (state.xp / state.xpRequired) * 100)
      : 0;
  const nextRankLevel = RANK_PROMOTION_LEVELS[state.rank] || 100;
  const currentRankStart = RANK_START_LEVELS[state.rank] || 1;
  const rankProgress = state.rank === 'Monarch'
    ? 100
    : Math.min(100, ((state.level - currentRankStart) / Math.max(1, nextRankLevel - currentRankStart)) * 100);
  const NextMissionIcon = nextMission.icon;

  return (
    <div className="space-y-6 pb-12">
      <motion.section
        id="tour-hud"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-2xl sm:p-7"
      >
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-blue-500/10 blur-[110px]" />
        <div className="absolute -bottom-28 left-1/4 size-72 rounded-full bg-purple-500/8 blur-[110px]" />

        <div className="relative grid gap-6 lg:grid-cols-[180px_1fr_220px] lg:items-center">
          <button
            type="button"
            onClick={() => setIsAvatarOpen(true)}
            className="group relative mx-auto aspect-[4/5] w-40 overflow-hidden rounded-2xl border border-blue-500/25 bg-black/40 shadow-[0_0_34px_rgba(59,130,246,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 lg:mx-0"
          >
            <img
              src={characterAvatar}
              alt={`Avatar de ${state.username || 'Hunter'}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 rounded-md border border-blue-400/25 bg-black/60 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-blue-300 backdrop-blur-md">
              Ver avatar
            </span>
          </button>

          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-[0.28em] text-blue-500 font-orbitron">Perfil do Caçador</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="truncate text-3xl font-black uppercase italic tracking-tight text-white font-orbitron sm:text-4xl">
                {state.username || state.fullName || 'Hunter'}
              </h1>
              <span className="rounded-lg border border-purple-500/25 bg-purple-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-purple-300">
                {state.hunterClass || 'Sem classe'}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <span className="flex items-center gap-1.5"><Crown className="h-4 w-4 text-amber-400" /> Título: <strong className="text-amber-300">{state.activeTitle || 'Iniciante'}</strong></span>
              <span className="flex items-center gap-1.5"><Trophy className="h-4 w-4 text-blue-400" /> Rank {state.rank}</span>
              <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-orange-400" /> Streak {state.streak.current} dias</span>
            </div>

            <div className="mt-6 max-w-2xl">
              <div className="mb-2 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-gray-600">Experiência do Hunter</p>
                  <p className="mt-1 text-sm font-black uppercase text-white font-orbitron">
                    Level {state.level}{state.level >= MAX_LEVEL ? ' · MAX' : ''}
                  </p>
                </div>
                <span className="text-[11px] font-black text-blue-300 font-orbitron">{state.xp} / {state.xpRequired} XP</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full border border-blue-500/15 bg-black/50 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-purple-400 shadow-[0_0_16px_rgba(59,130,246,0.5)]"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Próximo Rank</p>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-black italic text-blue-400 font-orbitron">{NEXT_RANK[state.rank] || 'D'}</span>
                <span className="text-[10px] font-bold text-gray-500">Level {nextRankLevel}</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/50">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${rankProgress}%` }} />
              </div>
            </div>
            <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Resumo de Hoje</p>
              <p className="mt-2 text-lg font-black text-white font-orbitron">{dailySummary.completed}/{dailySummary.total || 0}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                {state.xpGainedToday || xpEarnedToday} / {DAILY_COMMON_XP_EFFECTIVE_MAX} XP diário
              </p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">
                Bônus semanal {state.bonusXpGainedWeek} / {WEEKLY_BONUS_XP_CAP}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="relative overflow-hidden rounded-2xl border border-purple-500/25 bg-[#0F0F13] p-5 shadow-[0_0_28px_rgba(124,58,237,0.08)]"
      >
        <div className="absolute right-0 top-0 h-full w-72 bg-gradient-to-l from-purple-500/10 via-blue-500/5 to-transparent" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300 shadow-[0_0_18px_rgba(124,58,237,0.14)]">
              {habitsLoading ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <NextMissionIcon className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-purple-400 font-orbitron">Missão Principal</p>
                {nextMission.time && (
                  <span className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-gray-500">
                    {nextMission.time}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">{nextMission.eyebrow}</p>
              <h2 className="mt-2 text-lg font-black uppercase tracking-tight text-white font-orbitron">{nextMission.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider">
                <span className="text-amber-400">{nextMission.reward}</span>
                <span className="text-gray-700">•</span>
                <span className="text-blue-300">{nextMission.impact}</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate(nextMission.path)}
            disabled={habitsLoading}
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 text-[10px] font-black uppercase tracking-[0.15em] text-purple-200 transition-all hover:border-purple-400/60 hover:bg-purple-500/20 hover:text-white hover:shadow-[0_0_18px_rgba(124,58,237,0.2)] disabled:cursor-wait disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70"
          >
            {habitsLoading ? 'Sincronizando' : nextMission.action}
            {!habitsLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </motion.section>

      <section aria-labelledby="attributes-title">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-purple-400 font-orbitron">Parâmetros do Sistema</p>
            <h2 id="attributes-title" className="mt-1 text-lg font-black uppercase italic text-white font-orbitron">Atributos Principais</h2>
          </div>
          <span className="hidden text-[9px] font-bold uppercase tracking-widest text-gray-600 sm:block">Atualização em tempo real</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
          {STAT_META.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              title={stat.name}
              className={`group relative overflow-hidden rounded-2xl border bg-[#0F0F13] p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                statVariation[stat.key] > 0
                  ? `border-white/10 shadow-[0_0_22px_rgba(59,130,246,0.08)] ${stat.border}`
                  : `border-[#1E1E26] ${stat.border}`
              }`}
            >
              {statVariation[stat.key] > 0 && (
                <motion.div
                  className="absolute right-3 top-3 h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.9)]"
                  animate={{ opacity: [0.45, 1, 0.45], scale: [0.9, 1.2, 0.9] }}
                  transition={{ duration: 1.8, repeat: Infinity }}
                />
              )}
              <div className="flex items-start justify-between">
                <span className={`text-sm font-black tracking-widest font-orbitron ${stat.color}`}>{stat.label}</span>
                <Activity className={`h-3.5 w-3.5 transition-colors ${statVariation[stat.key] > 0 ? stat.color : 'text-gray-700 group-hover:text-gray-500'}`} />
              </div>
              <p className="mt-3 text-3xl font-black italic text-white font-orbitron">{state.stats[stat.key]}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">{stat.name}</p>
              <div className="mt-3 min-h-8">
                <p className={`text-[9px] font-black uppercase tracking-wider ${statVariation[stat.key] > 0 ? stat.color : 'text-gray-600'}`}>
                  {statVariation[stat.key] > 0 ? `+${statVariation[stat.key]} hoje` : 'Sem variação hoje'}
                </p>
                <p className={`mt-1 text-[8px] font-bold uppercase tracking-wider ${statRecentXp[stat.key] > 0 ? 'text-amber-400/80' : 'text-gray-800'}`}>
                  {statRecentXp[stat.key] > 0 ? `+${statRecentXp[stat.key]} XP recente` : 'Aguardando evolução'}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        <motion.section
          id="tour-status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-xl sm:p-6 lg:col-span-5"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-blue-500 font-orbitron">Leitura Holográfica</p>
              <h2 className="mt-1 text-xl font-black uppercase italic text-white font-orbitron">Janela de Status</h2>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
              <Target className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-4 flex min-h-[340px] items-center justify-center overflow-hidden">
            <RadarChart stats={statsData} size={340} />
          </div>

          <div className="grid gap-3 border-t border-dashed border-[#252530] pt-5 sm:grid-cols-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Perfil dominante</p>
              <p className="mt-1 text-xs font-bold text-purple-300">{profileReading.dominant}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Classe atual</p>
              <p className="mt-1 text-xs font-bold text-blue-300">{state.hunterClass || 'Não definida'}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Foco recomendado</p>
              <p className="mt-1 text-xs font-bold text-orange-300">{profileReading.focus}</p>
            </div>
          </div>
        </motion.section>

        <motion.section
          id="tour-domains"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-xl sm:p-6 lg:col-span-7"
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-purple-400 font-orbitron">Dimensões da Vida</p>
            <h2 className="mt-1 text-xl font-black uppercase italic text-white font-orbitron">Domínios de Evolução</h2>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {domains.map(domain => {
              const Icon = domain.icon;
              return (
                <div key={domain.name} className="group rounded-2xl border border-[#1E1E26] bg-black/25 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10 hover:bg-black/35">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5 text-gray-300">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black uppercase tracking-wider text-white font-orbitron">{domain.name}</h3>
                            <span className="text-[9px] font-black uppercase text-blue-400">Lvl {domain.level}</span>
                          </div>
                          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-gray-600">{domain.attributes}</p>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 font-orbitron">{domain.progress}%</span>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full border border-[#1E1E26] bg-black/50 p-0.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${domain.progress}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full bg-gradient-to-r shadow-[0_0_10px_rgba(96,165,250,0.15)] ${domain.color}`}
                        />
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">Último registro</p>
                          <p className="mt-1 text-[10px] font-semibold text-gray-500">{domain.lastGain}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="text-[8px] font-black uppercase tracking-widest text-gray-700">Próximo marco</p>
                          <p className="mt-1 text-[10px] font-bold text-purple-300">{domain.nextReward}</p>
                          <p className="mt-0.5 text-[9px] font-semibold text-gray-600">{domain.xpRemaining} XP restantes</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <motion.section
          id="tour-history"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-xl sm:p-6 lg:col-span-8"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-cyan-400 font-orbitron">Registro do Sistema</p>
              <h2 className="mt-1 text-xl font-black uppercase italic text-white font-orbitron">Histórico de Evolução</h2>
            </div>
            <History className="h-5 w-5 text-cyan-400" />
          </div>

          <div className={`mt-5 ${evolutionEvents.length > 4 ? 'max-h-[420px] overflow-y-auto pr-2' : ''} scrollbar-none`}>
            {loadingDailySignals ? (
              <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-[#252530] bg-black/20">
                <LoaderCircle className="h-5 w-5 animate-spin text-cyan-500" />
                <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-gray-600">Sincronizando registros</span>
              </div>
            ) : evolutionEvents.length > 0 ? evolutionEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="group relative flex gap-4 rounded-xl px-1 py-3 transition-colors hover:bg-white/[0.02]">
                  {index < evolutionEvents.length - 1 && <div className="absolute left-[17px] top-10 h-[calc(100%-20px)] w-px bg-[#252530]" />}
                  <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-black/50 shadow-[0_0_14px_rgba(34,211,238,0.05)]">
                    <Icon className={`h-4 w-4 ${event.color}`} />
                  </div>
                  <div className="min-w-0 flex-1 border-b border-[#1E1E26] pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-black uppercase tracking-wider text-white font-orbitron">{event.title}</p>
                      <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600">{formatEvolutionTime(event.timestamp, language)}</span>
                    </div>
                    <p className={`mt-1 text-[10px] font-black uppercase tracking-wider ${event.color}`}>{event.reward}</p>
                    <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-gray-600">Domínio: {event.domain}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-[#252530] bg-black/20 p-6 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-gray-700" />
                <p className="mt-3 text-xs font-black uppercase tracking-wider text-gray-500 font-orbitron">O Sistema ainda não registrou evolução hoje.</p>
                <p className="mt-1 text-xs text-gray-600">Complete uma missão para gerar seu primeiro registro.</p>
                <button
                  type="button"
                  onClick={() => navigate('/quests')}
                  className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-300 transition-all hover:border-cyan-400/50 hover:bg-cyan-500/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/70"
                >
                  Ver missões disponíveis
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </motion.section>

        <motion.section
          id="tour-biometrics"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 shadow-xl sm:p-6 lg:col-span-4"
        >
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-400 font-orbitron">Leitura Diária</p>
            <h2 className="mt-1 text-xl font-black uppercase italic text-white font-orbitron">Recursos do Dia</h2>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            {[
              { label: 'Mana', detail: 'Energia registrada', value: `${dailySummary.calories}`, unit: 'kcal', icon: Flame, color: 'text-orange-400' },
              { label: 'Força Vital', detail: 'Volume mobilizado', value: `${Math.round(todayVolume)}`, unit: 'kg', icon: Dumbbell, color: 'text-blue-400' },
              { label: 'Ritmo de Evolução', detail: 'Progresso diário', value: `${dailySummary.progress}`, unit: '%', icon: TrendingUp, color: 'text-purple-400' },
              { label: 'Sequência', detail: 'Dias consecutivos', value: `${state.streak.current}`, unit: 'dias', icon: Flame, color: 'text-amber-400' },
            ].map(resource => {
              const Icon = resource.icon;
              return (
                <div key={resource.label} className="group rounded-2xl border border-[#1E1E26] bg-black/25 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/10 hover:bg-black/35">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-4 w-4 ${resource.color}`} />
                    <span className="text-[8px] font-black uppercase tracking-wider text-gray-600">{resource.label}</span>
                  </div>
                  <p className="mt-4 text-xl font-black italic text-white font-orbitron">
                    {loadingDailySignals ? (
                      <LoaderCircle className="h-5 w-5 animate-spin text-gray-600" />
                    ) : (
                      <>{resource.value} <span className="text-[9px] font-bold not-italic text-gray-600">{resource.unit}</span></>
                    )}
                  </p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-gray-700">{resource.detail}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-blue-500/15 bg-blue-500/5 p-4">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-blue-400" />
              <p className="text-[9px] font-black uppercase tracking-wider text-blue-300">Estado do sistema</p>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              {dailySummary.progress >= 70
                ? 'Ritmo elevado. Sua progressão diária está consistente.'
                : 'Potencial disponível. Complete novas ações para fortalecer sua ficha.'}
            </p>
          </div>
        </motion.section>
      </div>

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
              className="relative z-10 aspect-[4/5] w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl"
            >
              <img src={characterAvatar} alt="Avatar ampliado do Caçador" className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent p-6">
                <p className="text-xl font-black uppercase text-white font-orbitron">{state.username || 'Hunter'}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-300">
                  {state.hunterClass || 'Sem classe'} · Rank {state.rank} · Level {state.level}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAvatarOpen(false)}
                className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-xl border border-white/10 bg-black/60 text-gray-300 backdrop-blur-md transition-colors hover:text-white"
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
