import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Apple,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Coins,
  Crown,
  Dumbbell,
  Flame,
  LayoutDashboard,
  Moon,
  Shield,
  Skull,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/preferences';
import { ProductTour } from '@/components/rpg/ProductTour';
import { HudCard, type HudCardVariant } from '@/components/ui/hud-card';
import { TacticalButton, type TacticalButtonAccent } from '@/components/ui/tactical-button';
import { NeonProgressBar, NeonProgressRing } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';
import { DAILY_COMMON_XP_EFFECTIVE_MAX, MAX_LEVEL } from '@/lib/progression';
import { localDayBounds } from '@/lib/date';
import { translateUiText } from '@/lib/uiEnglish';

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
): string {
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
    return isEnglish ? 'Class not selected' : 'Classe não definida';
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

interface QuickActionItem {
  id?: string;
  path: string;
  label: string;
  sublabel: string;
  badgeText: string;
  accent: TacticalButtonAccent;
  icon: React.ReactNode;
}

interface SecondaryModuleItem {
  path: string;
  title: string;
  subtitle: string;
  meta: string;
  variant: HudCardVariant;
  icon: React.ReactNode;
  image: string;
}

export function QuickMenu() {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const { user } = useAuth();
  const state = useHunterStore();
  const activeBattle = useBossStore((s) => s.activeBattle);
  const loadActiveBattle = useBossStore((s) => s.loadActiveBattle);

  const {
    activeHabits,
    completedToday,
    completedCount,
    totalActive,
    workoutMissions,
    mealMissions,
    xpEarnedToday,
  } = useHabits();

  const { tasks } = useTasks();

  useEffect(() => {
    if (user?.id && !activeBattle) {
      void loadActiveBattle(user.id);
    }
  }, [user?.id, activeBattle, loadActiveBattle]);

  const characterAvatar = useMemo(
    () => resolveHunterAvatar(state.hunterClass, state.rank),
    [state.hunterClass, state.rank]
  );

  const hunterName = state.username || state.fullName || l('Caçador', 'Hunter');
  const hunterClassLabel = localizeHunterClass(state.hunterClass, isEnglish);
  const hunterTitle = state.activeTitle
    ? isEnglish
      ? translateUiText(state.activeTitle)
      : state.activeTitle
    : l('Caçador Desperto', 'Awakened Hunter');

  const safeXpRequired = Math.max(1, state.xpRequired || 100);
  const xpPct =
    state.level >= MAX_LEVEL
      ? 100
      : Math.min(100, Math.max(0, (state.xp / safeXpRequired) * 100));

  const dailyStats = useMemo(() => {
    const { startIso, endIso } = localDayBounds();
    const startMs = new Date(startIso).getTime();
    const endMs = new Date(endIso).getTime();

    const tasksCompletedToday = tasks.filter((task) => {
      if (!task.completed || !task.completed_at) return false;
      const completedMs = new Date(task.completed_at).getTime();
      return completedMs >= startMs && completedMs <= endMs;
    }).length;

    const pendingTasks = tasks.filter((task) => !task.completed).length;

    const workoutsCompleted = workoutMissions.filter((m) => m.isCompleted).length;
    const workoutsTotal = workoutMissions.length;

    const mealsCompleted = mealMissions.filter((m) => m.isCompleted).length;
    const mealsTotal = mealMissions.length;

    const habitsCompleted = completedCount;
    const habitsTotal = totalActive;

    const total = habitsTotal + workoutsTotal + mealsTotal + tasksCompletedToday;
    const completed =
      habitsCompleted + workoutsCompleted + mealsCompleted + tasksCompletedToday;
    const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

    const pendingHabits = Math.max(0, habitsTotal - habitsCompleted);
    const pendingQuestsTotal = pendingHabits + pendingTasks;

    return {
      total,
      completed,
      progress,
      habitsCompleted,
      habitsTotal,
      workoutsCompleted,
      workoutsTotal,
      mealsCompleted,
      mealsTotal,
      pendingQuestsTotal,
    };
  }, [
    tasks,
    workoutMissions,
    mealMissions,
    completedCount,
    totalActive,
  ]);

  const todayXp = state.xpGainedToday || xpEarnedToday || 0;

  const nextMission = useMemo(() => {
    const pendingWorkout = workoutMissions.find((mission) => !mission.isCompleted);
    if (pendingWorkout) {
      return {
        eyebrow: l('Missão Física Prioritária', 'Priority Physical Mission'),
        title: isEnglish ? translateUiText(pendingWorkout.title) : pendingWorkout.title,
        reward: `+${pendingWorkout.xp_reward} XP · ${
          pendingWorkout.stat_target === 'strength' ? 'STR' : 'END'
        } +${pendingWorkout.stat_reward}`,
        path: '/workouts',
        cta: l('Treinar', 'Train'),
        icon: Dumbbell,
      };
    }

    const pendingHabit = activeHabits.find((habit) => !completedToday.has(habit.id));
    if (pendingHabit) {
      return {
        eyebrow: l('Próxima Missão Diária', 'Next Daily Mission'),
        title: isEnglish ? translateUiText(pendingHabit.title) : pendingHabit.title,
        reward: `+${pendingHabit.xp_reward} XP`,
        path: '/quests',
        cta: l('Missões', 'Quests'),
        icon: CheckSquare,
      };
    }

    const pendingMeal = mealMissions.find((meal) => !meal.isCompleted);
    if (pendingMeal) {
      return {
        eyebrow: l('Protocolo Nutricional', 'Nutrition Protocol'),
        title: isEnglish ? translateUiText(pendingMeal.title) : pendingMeal.title,
        reward:
          pendingMeal.xp_reward > 0
            ? `+${pendingMeal.xp_reward} XP · VIT`
            : `${pendingMeal.totalKcal} kcal`,
        path: '/nutrition',
        cta: l('Nutrição', 'Nutrition'),
        icon: Apple,
      };
    }

    const pendingTask = tasks.find((task) => !task.completed);
    if (pendingTask) {
      return {
        eyebrow: l('Objetivo Tático Pendente', 'Pending Tactical Objective'),
        title: isEnglish ? translateUiText(pendingTask.title) : pendingTask.title,
        reward: `+${pendingTask.xp_reward} XP`,
        path: '/quests',
        cta: l('Abrir', 'Open'),
        icon: Sparkles,
      };
    }

    if (dailyStats.total > 0 && dailyStats.completed >= dailyStats.total) {
      return {
        eyebrow: l('Sincronização Diária Completa', 'Daily Sync Complete'),
        title: l(
          'Todas as missões programadas para hoje foram concluídas.',
          'All scheduled missions for today have been completed.'
        ),
        reward: `+${todayXp} XP ${l('acumulados hoje', 'earned today')}`,
        path: '/quests',
        cta: l('Ver Quadro', 'View Board'),
        icon: Trophy,
      };
    }

    return {
      eyebrow: l('Calibração de Rotina', 'Routine Calibration'),
      title: l(
        'Configure ou conclua suas missões diárias para iniciar a coleta de XP.',
        'Configure or complete your daily missions to start earning XP.'
      ),
      reward: l('Recompensa imediata de XP e Atributos', 'Immediate XP & Attribute rewards'),
      path: '/quests',
      cta: l('Abrir Missões', 'Open Quests'),
      icon: CheckCircle2,
    };
  }, [
    workoutMissions,
    activeHabits,
    completedToday,
    mealMissions,
    tasks,
    dailyStats.total,
    dailyStats.completed,
    todayXp,
    isEnglish,
  ]);

  const quickActions: QuickActionItem[] = [
    {
      path: '/quests',
      label: l('Concluir missão', 'Complete mission'),
      sublabel: l('Hábitos e objetivos diários', 'Daily habits & objectives'),
      badgeText:
        dailyStats.pendingQuestsTotal > 0
          ? `${dailyStats.pendingQuestsTotal} ${l('pendentes', 'pending')}`
          : `${dailyStats.habitsCompleted}/${dailyStats.habitsTotal} ${l('hoje', 'today')}`,
      accent: 'cyan',
      icon: <CheckSquare className="h-4 w-4 text-[#00F0FF]" />,
    },
    {
      id: 'tour-shortcut-workouts',
      path: '/workouts',
      label: l('Registrar treino', 'Log workout'),
      sublabel: l('Cargas, séries e cardio', 'Weights, sets & cardio'),
      badgeText:
        dailyStats.workoutsTotal > 0
          ? `${dailyStats.workoutsCompleted}/${dailyStats.workoutsTotal} ${l('hoje', 'today')}`
          : l('Abrir fichas', 'Open routines'),
      accent: 'purple',
      icon: <Dumbbell className="h-4 w-4 text-[#A855F7]" />,
    },
    {
      id: 'tour-shortcut-nutrition',
      path: '/nutrition',
      label: l('Registrar refeição', 'Register meal'),
      sublabel: l('Dieta, macros e hidratação', 'Diet, macros & hydration'),
      badgeText:
        dailyStats.mealsTotal > 0
          ? `${dailyStats.mealsCompleted}/${dailyStats.mealsTotal} ${l('hoje', 'today')}`
          : l('Registrar kcal', 'Log kcal'),
      accent: 'cyan',
      icon: <Apple className="h-4 w-4 text-[#00F0FF]" />,
    },
  ];

  const activeBossName = activeBattle
    ? isEnglish
      ? translateUiText(activeBattle.name)
      : activeBattle.name
    : l('Raid Semanal', 'Weekly Raid');

  const activeBossMeta =
    activeBattle && activeBattle.max_hp > 0
      ? activeBattle.defeated
        ? l('Boss Purificado', 'Boss Purified')
        : `HP ${activeBattle.current_hp} / ${activeBattle.max_hp}`
      : l('Enfrente chefes semanais', 'Face weekly bosses');

  const secondaryModules: SecondaryModuleItem[] = [
    {
      path: '/bosses',
      title: l('Portal dos Chefes', 'Boss Portal'),
      subtitle: activeBossName,
      meta: activeBossMeta,
      variant: 'crimson',
      icon: <Skull className="h-4 w-4 text-[#EF4444]" />,
      image: '/optimized/Cards/Chefes Finais.jpg',
    },
    {
      path: '/fortuna',
      title: l('Módulo Fortuna', 'Fortune Module'),
      subtitle: l('Finanças & Economia', 'Finances & Savings'),
      meta: `${l('Sabedoria (SAB)', 'Wisdom (WIS)')} · ${state.stats.wisdom}`,
      variant: 'gold',
      icon: <Coins className="h-4 w-4 text-[#F59E0B]" />,
      image: '/optimized/Cards/Fortuna.jpg',
    },
    {
      path: '/rest',
      title: l('Santuário do Descanso', 'Recovery Sanctuary'),
      subtitle: l('Sono & Recuperação Mental', 'Sleep & Mental Recovery'),
      meta: `${l('Equilíbrio (EQU)', 'Balance (BAL)')} · ${state.stats.balance}`,
      variant: 'cyan',
      icon: <Moon className="h-4 w-4 text-[#00F0FF]" />,
      image: '/optimized/Cards/Descanso-Lazer.jpg',
    },
    {
      path: '/status',
      title: l('Ficha de Atributos', 'Attribute Sheet'),
      subtitle: l('Radar e Domínios do Caçador', 'Hunter Radar & Domains'),
      meta: `${l('Nível', 'Level')} ${state.level} · Rank ${state.rank || 'E'}`,
      variant: 'default',
      icon: <LayoutDashboard className="h-4 w-4 text-slate-300" />,
      image: '/optimized/Cards/Status.jpg',
    },
  ];

  const NextMissionIcon = nextMission.icon;
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.32, ease: 'easeOut' as const },
      };

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-6 text-[var(--text-primary)]">
      {/* ── SEÇÃO 3, 4 & 5: HERO DO JOGADOR + HUNTER STATUS + PROGRESSO DIÁRIO ── */}
      <motion.section
        id="tour-portal-header"
        aria-label={l('Status Principal do Caçador', 'Primary Hunter Status')}
        {...motionProps}
        className="relative"
      >
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-12 lg:gap-5 lg:items-stretch">
          {/* 3. HERO DO JOGADOR (Compacto no mobile, conectado ao painel Hunter Status) */}
          <div className="relative h-52 sm:h-60 lg:col-span-5 lg:h-auto lg:min-h-[340px] overflow-hidden rounded-t-2xl lg:rounded-2xl border border-b-0 lg:border-b border-[var(--hud-border-cyan)] bg-[#0A0C12] shadow-[0_0_28px_rgba(0,240,255,0.08)]">
            <img
              src={characterAvatar}
              alt={`${hunterName} — ${hunterClassLabel} Rank ${state.rank || 'E'}`}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              onError={handleHunterAvatarError}
              className="h-full w-full object-cover object-[center_18%] transition-transform duration-700"
            />

            {/* Vinheta e iluminação holográfica discreta */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07080C] via-[#07080C]/35 to-black/30"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(0,240,255,0.14)_0%,transparent_70%)]"
            />

            {/* Topo do Hero: Link Neural + Classe Despertada */}
            <div className="absolute inset-x-3.5 top-3 z-10 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[#07080C]/75 px-2.5 py-1 backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                <span className="font-orbitron text-[9px] font-bold uppercase tracking-[0.18em] text-slate-200">
                  {l('Sistema Ativo', 'System Online')}
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F0FF]/35 bg-[#07080C]/80 px-2.5 py-1 backdrop-blur-md">
                <Shield className="h-3 w-3 text-[#00F0FF]" aria-hidden="true" />
                <span className="font-orbitron text-[9px] font-black uppercase tracking-[0.14em] text-[#00F0FF]">
                  {hunterClassLabel}
                </span>
              </div>
            </div>

            {/* Base do Hero: Identidade do Caçador e Título */}
            <div className="absolute inset-x-4 bottom-6 lg:bottom-4 z-10 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#F59E0B]">
                  <Crown className="h-3 w-3 shrink-0 text-[#F59E0B]" aria-hidden="true" />
                  <span className="truncate">{hunterTitle}</span>
                </div>
                <h1 className="mt-0.5 truncate font-orbitron text-xl sm:text-2xl font-black uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                  {hunterName}
                </h1>
              </div>

              {state.streak.current > 0 && (
                <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/35 bg-[#07080C]/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-300 backdrop-blur-md font-orbitron">
                  <Flame className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
                  <span>{state.streak.current}d</span>
                </div>
              )}
            </div>
          </div>

          {/* 4 & 5. PAINEL HUNTER STATUS + PROGRESSO DIÁRIO */}
          <div className="relative z-10 -mt-4 lg:mt-0 lg:col-span-7">
            <HudCard
              variant="elevated"
              corners
              className="h-full border-[var(--hud-border-strong)] bg-[#10131D]/95 backdrop-blur-xl"
            >
              {/* Cabeçalho HUNTER STATUS */}
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
                <div className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-0.5 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]"
                  />
                  <h2 className="font-orbitron text-xs sm:text-sm font-black uppercase tracking-[0.22em] text-slate-100">
                    {l('Hunter Status', 'Hunter Status')}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/status')}
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 font-orbitron text-[9px] font-bold uppercase tracking-[0.14em] text-[#00F0FF] transition-colors hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                >
                  <span>{l('Ver Status', 'Full Status')}</span>
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>

              {/* Nível Real & Rank Real */}
              <div className="mt-3.5 flex items-center justify-between gap-4 px-1">
                <div>
                  <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                    {l('Nível', 'Level')}
                  </span>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="font-orbitron text-3xl sm:text-4xl font-black leading-none tracking-tight text-[#00F0FF] drop-shadow-[0_0_12px_rgba(0,240,255,0.45)] tabular-nums">
                      {state.level}
                    </span>
                    {state.level >= MAX_LEVEL && (
                      <span className="rounded border border-[#F59E0B]/40 bg-[#F59E0B]/10 px-1.5 py-0.5 font-orbitron text-[9px] font-black uppercase text-[#F59E0B]">
                        MAX
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.18em] text-[#F59E0B]">
                      Rank
                    </span>
                    <span className="mt-0.5 block font-orbitron text-2xl sm:text-3xl font-black leading-none text-[#F59E0B] drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                      {state.rank || 'E'}
                    </span>
                  </div>
                  <RankBadge rank={state.rank || 'E'} size="md" showLabel />
                </div>
              </div>

              {/* Barra de XP com valores reais */}
              <div className="mt-3.5 space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    XP
                  </span>
                  <NeonProgressBar
                    value={state.level >= MAX_LEVEL ? 100 : state.xp}
                    max={state.level >= MAX_LEVEL ? 100 : safeXpRequired}
                    variant="xp"
                    size="md"
                    ariaLabel={l(
                      'Progresso de XP até o próximo nível',
                      'XP progress to next level'
                    )}
                    className="flex-1"
                  />
                  <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    XP
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 tabular-nums">
                  <span className="inline-flex items-center gap-1 text-[#00F0FF]">
                    <Zap className="h-3 w-3" aria-hidden="true" />
                    <strong className="font-orbitron text-[11px] font-bold">
                      {state.xp} / {state.xpRequired} XP
                    </strong>
                  </span>
                  <span>
                    {state.level >= MAX_LEVEL
                      ? l('Nível máximo alcançado', 'Maximum level reached')
                      : `${Math.max(0, state.xpRequired - state.xp)} XP ${l(
                          'para o Nível',
                          'to Level'
                        )} ${state.level + 1}`}
                  </span>
                </div>
              </div>

              {/* 5. PROGRESSO DIÁRIO (Anel Neon + Indicadores Reais) */}
              <div className="mt-4 border-t border-white/[0.06] pt-4">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="font-orbitron text-[11px] font-bold uppercase tracking-[0.14em] text-slate-200">
                    {l('Progresso Diário', 'Daily Progress')} —{' '}
                    <span className="text-[#00F0FF]">{dailyStats.progress}%</span>
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
                    +{todayXp} / {DAILY_COMMON_XP_EFFECTIVE_MAX} XP {l('hoje', 'today')}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                  <div className="flex items-center justify-center">
                    <NeonProgressRing
                      value={dailyStats.progress}
                      secondaryValue={xpPct}
                      size={112}
                      strokeWidth={8}
                      variant="cyan-purple"
                      ariaLabel={l('Progresso diário de missões', 'Daily mission progress')}
                    >
                      <span className="font-orbitron text-xl font-black text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] tabular-nums">
                        {dailyStats.progress}%
                      </span>
                      <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400 tabular-nums">
                        {dailyStats.completed}/{dailyStats.total} {l('feitos', 'done')}
                      </span>
                    </NeonProgressRing>
                  </div>

                  {/* Resumo das 3 frentes diárias reais */}
                  <div className="grid w-full flex-1 grid-cols-3 gap-2 sm:grid-cols-1 sm:gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.06] bg-black/35 px-2.5 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                        {l('Missões', 'Quests')}
                      </span>
                      <span className="mt-0.5 sm:mt-0 font-orbitron text-xs font-bold text-[#00F0FF] tabular-nums">
                        {dailyStats.habitsCompleted}/{dailyStats.habitsTotal}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.06] bg-black/35 px-2.5 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                        {l('Treinos', 'Workouts')}
                      </span>
                      <span className="mt-0.5 sm:mt-0 font-orbitron text-xs font-bold text-[#A855F7] tabular-nums">
                        {dailyStats.workoutsCompleted}/{dailyStats.workoutsTotal}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/[0.06] bg-black/35 px-2.5 py-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 truncate">
                        {l('Refeições', 'Meals')}
                      </span>
                      <span className="mt-0.5 sm:mt-0 font-orbitron text-xs font-bold text-emerald-400 tabular-nums">
                        {dailyStats.mealsCompleted}/{dailyStats.mealsTotal}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </HudCard>
          </div>
        </div>
      </motion.section>

      {/* ── SEÇÃO 6: AÇÕES RÁPIDAS (Tactical Controls inspirados em ascend-home.jpg) ── */}
      <motion.section
        id="tour-portal-primary"
        aria-labelledby="quick-actions-heading"
        {...motionProps}
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between px-1">
          <h2
            id="quick-actions-heading"
            className="font-orbitron text-[10px] font-black uppercase tracking-[0.22em] text-slate-400"
          >
            {l('Ações Rápidas', 'Quick Actions')}
          </h2>
          <span className="text-[10px] font-semibold text-slate-500">
            {l('Acesso direto', 'Direct access')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
          {quickActions.map((action) => (
            <TacticalButton
              key={action.path}
              id={action.id}
              variant="secondary"
              accent={action.accent}
              fullWidth
              onClick={() => navigate(action.path)}
              leftIcon={action.icon}
              rightIcon={<ChevronRight className="h-4 w-4 text-slate-300" />}
              className="min-h-[54px] px-4 py-2.5"
            >
              <span className="flex w-full items-center justify-between gap-2 text-left">
                <span className="min-w-0">
                  <span className="block truncate font-orbitron text-xs sm:text-[13px] font-bold uppercase tracking-[0.08em] text-slate-100">
                    {action.label}
                  </span>
                  <span className="block truncate text-[11px] font-normal text-slate-400">
                    {action.sublabel}
                  </span>
                </span>
                <span className="shrink-0 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase tracking-wider text-slate-300 tabular-nums">
                  {action.badgeText}
                </span>
              </span>
            </TacticalButton>
          ))}
        </div>
      </motion.section>

      {/* ── PRÓXIMA MISSÃO RECOMENDADA (Dados Reais + Âncora do ProductTour) ── */}
      <motion.section
        id="tour-portal-recommended"
        aria-label={l('Missão Recomendada', 'Recommended Mission')}
        {...motionProps}
      >
        <HudCard variant="purple" corners className="py-3.5 px-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/35 bg-[#A855F7]/15 text-[#A855F7]">
                <NextMissionIcon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-orbitron text-[9px] font-black uppercase tracking-[0.2em] text-[#A855F7]">
                  {nextMission.eyebrow}
                </p>
                <p className="mt-0.5 truncate text-sm font-bold text-slate-100">
                  {nextMission.title}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                  {nextMission.reward}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate(nextMission.path)}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#A855F7]/40 bg-[#A855F7]/15 px-4 py-2 font-orbitron text-[10px] font-black uppercase tracking-[0.14em] text-purple-200 transition-all hover:border-[#A855F7]/70 hover:bg-[#A855F7]/25 hover:text-white active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]"
            >
              <span>{nextMission.cta}</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </HudCard>
      </motion.section>

      {/* ── SEÇÃO 7: MÓDULOS SECUNDÁRIOS (Bosses, Fortuna, Descanso e Status) ── */}
      <motion.section
        id="tour-portal-secondary"
        aria-labelledby="secondary-modules-heading"
        {...motionProps}
        className="space-y-2.5"
      >
        <div className="flex items-center justify-between px-1">
          <h2
            id="secondary-modules-heading"
            className="font-orbitron text-[10px] font-black uppercase tracking-[0.22em] text-slate-400"
          >
            {l('Módulos do Sistema', 'System Modules')}
          </h2>
          <span className="text-[10px] font-semibold text-slate-500">
            {l('Domínios complementares', 'Complementary domains')}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {secondaryModules.map((mod) => (
            <button
              key={mod.path}
              type="button"
              onClick={() => navigate(mod.path)}
              aria-label={`${l('Abrir', 'Open')} ${mod.title}`}
              className="group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] rounded-2xl active:scale-[0.99] transition-transform"
            >
              <HudCard
                variant={mod.variant}
                noPadding
                className="relative flex min-h-[88px] items-center justify-between gap-3 overflow-hidden p-3.5 sm:p-4 hover:border-white/25"
              >
                {/* Arte de fundo sutil otimizada */}
                <img
                  src={mod.image}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07080C]/95 via-[#10121A]/85 to-[#10121A]/65"
                />

                <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/55 backdrop-blur-md">
                    {mod.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-orbitron text-xs font-black uppercase tracking-[0.1em] text-white">
                      {mod.title}
                    </h3>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-300">
                      {mod.subtitle}
                    </p>
                    <p className="mt-1 truncate font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-400 tabular-nums">
                      {mod.meta}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/50 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:border-white/25 group-hover:text-white">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </div>
              </HudCard>
            </button>
          ))}
        </div>
      </motion.section>

      <ProductTour />
    </div>
  );
}
