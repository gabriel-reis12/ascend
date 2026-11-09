import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Apple,
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  Droplets,
  Dumbbell,
  Moon,
  Play,
  Repeat,
  Sparkles,
  Trophy,
  Zap,
} from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { usePreferences } from '@/contexts/preferences';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { supabase } from '@/lib/supabase';
import { localDateString, localDayBounds } from '@/lib/date';
import { translateUiText } from '@/lib/uiEnglish';
import { triggerGameFeel } from '@/lib/gameFeel';
import {
  detectGuidedActivity,
  isGuidedEligible,
  loadGuidedSession,
  saveGuidedSession,
  clearGuidedSession,
  type GuidedQuestSession,
} from '@/lib/guidedQuests';
import { GuidedQuestModal } from '@/components/quests/GuidedQuestModal';
import type { Habit, WorkoutMission, MealMission } from '@/hooks/useHabits';
import type { Task } from '@/hooks/useTasks';
import type { RecentMealItem } from '@/components/home/SafeActionConfirmModal';

interface DailyActionCenterProps {
  userId?: string;
  activeHabits: Habit[];
  completedToday: Set<string>;
  workoutMissions: WorkoutMission[];
  mealMissions: MealMission[];
  pendingTasks: Task[];
  recentMeal: RecentMealItem | null;
  todayXp: number;
  dailyTotal: number;
  dailyCompleted: number;
  onToggleHabit: (habitId: string) => Promise<void>;
  onToggleMealMission: (mealPlanId: string) => Promise<void>;
  onCompleteTask: (taskId: string) => Promise<void>;
  onOpenRepeatMeal: () => void;
  onToastSuccess: (message: string) => void;
}

interface ActiveWorkoutSnapshot {
  routineId: string;
  routineName: string;
  startedAt?: number;
}

export function DailyActionCenter({
  userId,
  activeHabits,
  completedToday,
  workoutMissions,
  mealMissions,
  pendingTasks,
  recentMeal,
  todayXp,
  dailyTotal,
  dailyCompleted,
  onToggleHabit,
  onToggleMealMission,
  onCompleteTask,
  onOpenRepeatMeal,
  onToastSuccess,
}: DailyActionCenterProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const navigate = useNavigate();

  const hunterWeight = useHunterStore((s) => s.weightCurrent);
  const addXp = useHunterStore((s) => s.addXp);
  const updateStat = useHunterStore((s) => s.updateStat);

  const todayKey = localDateString();
  const waterStorageKey = userId ? `ascend_water_ml_${userId}_${todayKey}` : null;
  const sleepStorageKey = userId ? `ascend_sleep_logged_${userId}_${todayKey}` : null;

  // Target de hidratação diária baseado no peso real (default 70kg -> 2450ml)
  const targetWaterMl = useMemo(() => {
    const safeWeight = hunterWeight && hunterWeight >= 35 ? hunterWeight : 70;
    return Math.round((safeWeight * 35) / 50) * 50;
  }, [hunterWeight]);

  const [waterMl, setWaterMl] = useState<number>(0);
  const [sleepLoggedHours, setSleepLoggedHours] = useState<number | null>(null);
  const [isLoggingSleep, setIsLoggingSleep] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  // Sessões em andamento (Treino ativo ou Missão Guiada)
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutSnapshot | null>(null);
  const [guidedSession, setGuidedSession] = useState<GuidedQuestSession | null>(null);
  const [guidedModalOpen, setGuidedModalOpen] = useState(false);

  // Sincroniza hidratação, sono e sessões em andamento do dia atual
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    // 1. Água
    if (waterStorageKey) {
      const savedWater = Number(window.localStorage.getItem(waterStorageKey) || '0');
      if (!Number.isNaN(savedWater) && savedWater >= 0) {
        setWaterMl(savedWater);
      }
    }

    // 2. Sono de hoje (localStorage + verificação em rest_logs)
    if (sleepStorageKey) {
      const savedSleep = window.localStorage.getItem(sleepStorageKey);
      if (savedSleep) {
        setSleepLoggedHours(Number(savedSleep) || 8);
      } else {
        const { startIso, endIso } = localDayBounds();
        void supabase
          .from('rest_logs')
          .select('duration_min')
          .eq('user_id', userId)
          .eq('type', 'sleep')
          .gte('logged_at', startIso)
          .lte('logged_at', endIso)
          .limit(1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              const hrs = Math.max(1, Math.round((data[0].duration_min || 480) / 60));
              setSleepLoggedHours(hrs);
              window.localStorage.setItem(sleepStorageKey, String(hrs));
            }
          });
      }
    }

    // 3. Sessão de Treino em andamento
    try {
      const rawWorkout = window.localStorage.getItem(`ascend_active_workout_${userId}`);
      if (rawWorkout) {
        const parsed = JSON.parse(rawWorkout);
        if (parsed && parsed.routineId && parsed.routineName) {
          setActiveWorkout({
            routineId: parsed.routineId,
            routineName: parsed.routineName,
            startedAt: parsed.startedAt,
          });
        } else {
          setActiveWorkout(null);
        }
      } else {
        setActiveWorkout(null);
      }
    } catch {
      setActiveWorkout(null);
    }

    // 4. Sessão Guiada em andamento
    const existingGuided = loadGuidedSession(userId);
    setGuidedSession(existingGuided);
  }, [userId, waterStorageKey, sleepStorageKey]);

  // Identifica atividades pendentes reais
  const pendingHabits = useMemo(
    () => activeHabits.filter((habit) => !completedToday.has(habit.id)),
    [activeHabits, completedToday]
  );

  const pendingWorkout = useMemo(
    () => workoutMissions.find((mission) => !mission.isCompleted) || null,
    [workoutMissions]
  );

  const pendingMeal = useMemo(
    () => mealMissions.find((meal) => !meal.isCompleted) || null,
    [mealMissions]
  );

  const nextPendingHabit = pendingHabits[0] || null;
  const nextPendingTask = pendingTasks[0] || null;

  // Hábito de hidratação (se existir na rotina do jogador)
  const hydrationHabit = useMemo(
    () =>
      activeHabits.find((h) =>
        /água|agua|hidrat|water|2l|3l/i.test(h.title)
      ) || null,
    [activeHabits]
  );

  // Conclusão em 1 toque de hábito diretamente na Home
  const handleQuickCompleteHabit = async (habit: Habit) => {
    if (completingId) return;
    setCompletingId(habit.id);
    try {
      await onToggleHabit(habit.id);
      const title = isEnglish ? translateUiText(habit.title) : habit.title;
      onToastSuccess(
        l(
          `Missão concluída: ${title} (+${habit.xp_reward} XP)`,
          `Mission completed: ${title} (+${habit.xp_reward} XP)`
        )
      );
    } finally {
      setCompletingId(null);
    }
  };

  // Conclusão em 1 toque de tarefa única diretamente na Home
  const handleQuickCompleteTask = async (task: Task) => {
    if (completingId) return;
    setCompletingId(task.id);
    try {
      await onCompleteTask(task.id);
      const title = isEnglish ? translateUiText(task.title) : task.title;
      onToastSuccess(
        l(
          `Objetivo concluído: ${title} (+${task.xp_reward} XP)`,
          `Objective completed: ${title} (+${task.xp_reward} XP)`
        )
      );
    } finally {
      setCompletingId(null);
    }
  };

  // Conclusão em 1 toque de refeição do plano alimentar
  const handleQuickCompleteMealPlan = async (meal: MealMission) => {
    if (completingId) return;
    setCompletingId(meal.id);
    try {
      await onToggleMealMission(meal.meal_plan_id);
      const title = isEnglish ? translateUiText(meal.title) : meal.title;
      onToastSuccess(
        l(
          `Refeição registrada: ${title} (+${meal.xp_reward} XP)`,
          `Meal logged: ${title} (+${meal.xp_reward} XP)`
        )
      );
    } finally {
      setCompletingId(null);
    }
  };

  // Iniciar missão no Modo Guiado diretamente pela Home
  const handleStartGuidedHabitOrTask = (
    item: {
      id: string;
      title: string;
      category?: string;
      category_color?: string;
      xp_reward: number;
      stat_target?: string | null;
      stat_reward?: number;
    },
    questType: 'habit' | 'task'
  ) => {
    if (!userId) return;
    const preset = detectGuidedActivity(item.title, item.category || '');
    const newSession: GuidedQuestSession = {
      questId: item.id,
      questType,
      mode: preset.mode === 'routine' ? 'timer' : preset.mode,
      title: item.title,
      category: item.category || 'Missão',
      categoryColor: item.category_color || '#00F0FF',
      targetValue: preset.defaultTarget,
      currentValue: 0,
      isPaused: false,
      startedAt: Date.now(),
      xpReward: item.xp_reward,
      statTarget: item.stat_target,
      statReward: item.stat_reward,
    };
    saveGuidedSession(newSession, userId);
    setGuidedSession(newSession);
    setGuidedModalOpen(true);
  };

  // Iniciar Sessão Rápida de Foco (15m) em 1 toque
  const handleQuickFocusSession = () => {
    if (!userId) return;
    const focusHabit =
      pendingHabits.find((h) =>
        /foco|estud|leitura|ler|medita|deep|work|study|read|focus/i.test(h.title)
      ) || nextPendingHabit;

    const newSession: GuidedQuestSession = {
      questId: focusHabit ? focusHabit.id : 'quick_focus_15m',
      questType: 'habit',
      mode: 'timer',
      title: focusHabit
        ? focusHabit.title
        : l('Sessão de Foco Tático (15 min)', 'Tactical Focus Session (15 min)'),
      category: focusHabit?.category || l('Foco', 'Focus'),
      categoryColor: '#00F0FF',
      targetValue: 900, // 15 min
      currentValue: 0,
      isPaused: false,
      startedAt: Date.now(),
      xpReward: focusHabit ? focusHabit.xp_reward : 20,
      statTarget: focusHabit?.stat_target || 'discipline',
      statReward: focusHabit?.stat_reward || 1,
    };
    saveGuidedSession(newSession, userId);
    setGuidedSession(newSession);
    setGuidedModalOpen(true);
  };

  // Conclusão da sessão guiada aberta pela Home
  const handleGuidedComplete = async (
    questId: string,
    questType: 'habit' | 'task' | 'workout',
    _results: { repsDone?: number; timeSeconds?: number }
  ) => {
    void _results;
    if (!userId) return;
    if (questType === 'habit') {
      const targetHabit = activeHabits.find((h) => h.id === questId);
      if (targetHabit && !completedToday.has(targetHabit.id)) {
        await onToggleHabit(targetHabit.id);
      }
    } else if (questType === 'task') {
      const targetTask = pendingTasks.find((t) => t.id === questId);
      if (targetTask && !targetTask.completed) {
        await onCompleteTask(targetTask.id);
      }
    }
    clearGuidedSession(userId);
    setGuidedSession(null);
    setGuidedModalOpen(false);
    onToastSuccess(
      l('Sessão guiada concluída com sucesso!', 'Guided session completed!')
    );
  };

  // Registro Rápido de Água (+250ml / +500ml) em 1 toque
  const handleAddWater = async (amountMl: number) => {
    if (!userId || !waterStorageKey) return;
    const nextWater = Math.min(6000, waterMl + amountMl);
    setWaterMl(nextWater);
    window.localStorage.setItem(waterStorageKey, String(nextWater));
    triggerGameFeel('questComplete');

    // Se atingiu a meta diária e possui hábito de hidratação pendente, conclui automaticamente
    if (
      hydrationHabit &&
      !completedToday.has(hydrationHabit.id) &&
      nextWater >= targetWaterMl
    ) {
      await onToggleHabit(hydrationHabit.id);
      onToastSuccess(
        l(
          `Meta de água atingida (${nextWater}ml)! Hábito concluído (+${hydrationHabit.xp_reward} XP)`,
          `Water goal reached (${nextWater}ml)! Habit completed (+${hydrationHabit.xp_reward} XP)`
        )
      );
      return;
    }

    onToastSuccess(
      l(
        `+${amountMl}ml registrados (${nextWater} / ${targetWaterMl}ml hoje)`,
        `+${amountMl}ml logged (${nextWater} / ${targetWaterMl}ml today)`
      )
    );
  };

  // Registro Rápido de Sono (7h ou 8h) em 1 toque, respeitando regras de XP de Rest.tsx
  const handleQuickLogSleep = async (hours: number) => {
    if (!userId || isLoggingSleep || sleepLoggedHours !== null) return;
    setIsLoggingSleep(true);
    try {
      const durationMin = Math.round(hours * 60);
      const { data: restLog, error } = await supabase
        .from('rest_logs')
        .insert({
          user_id: userId,
          type: 'sleep',
          duration_min: durationMin,
          quality: 4,
          notes: `${l('Registro Rápido Home', 'Home Quick Log')}: ${hours}h`,
        })
        .select('id')
        .single();

      if (error) throw error;

      setSleepLoggedHours(hours);
      if (sleepStorageKey) {
        window.localStorage.setItem(sleepStorageKey, String(hours));
      }

      triggerGameFeel('questComplete');
      const xpResult = await addXp(20, userId, {
        eventId: `rest:${restLog?.id || todayKey}`,
      });
      await updateStat('balance', 2, userId);

      if (xpResult.awardedXp > 0) {
        await useBossStore
          .getState()
          .attackActiveBoss(userId, xpResult.awardedXp, 'Estudo');
      }

      onToastSuccess(
        l(
          `Sono de ${hours}h registrado! +20 XP · +2 EQU`,
          `${hours}h sleep logged! +20 XP · +2 BAL`
        )
      );
    } catch (err) {
      console.warn('[DailyActionCenter] Erro ao registrar sono rápido:', err);
      onToastSuccess(
        l(
          'Não foi possível sincronizar o sono agora. Tente no Santuário.',
          'Could not sync sleep right now. Try in Sanctuary.'
        )
      );
    } finally {
      setIsLoggingSleep(false);
    }
  };

  const allCompletedToday = dailyTotal > 0 && dailyCompleted >= dailyTotal;

  return (
    <div className="space-y-3">
      {/* 1. BANNER DE RETOMADA IMEDIATA (Se houver Treino ou Missão Guiada em andamento) */}
      {(activeWorkout || guidedSession) && (
        <HudCard
          variant="cyan"
          corners
          className="border-[#00F0FF]/50 bg-[#0A1420]/95 p-3.5 sm:px-4 sm:py-3.5 shadow-[0_0_24px_rgba(0,240,255,0.16)]"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/40 bg-[#00F0FF]/15 text-[#00F0FF]">
                <Play className="h-5 w-5 fill-current" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] text-[#00F0FF]">
                  {l('Sessão em Andamento', 'Session in Progress')}
                </p>
                <p className="truncate text-sm font-bold text-white">
                  {activeWorkout
                    ? `${l('Treino Ativo:', 'Active Workout:')} ${
                        isEnglish
                          ? translateUiText(activeWorkout.routineName)
                          : activeWorkout.routineName
                      }`
                    : `${l('Missão Guiada:', 'Guided Quest:')} ${
                        isEnglish
                          ? translateUiText(guidedSession?.title || '')
                          : guidedSession?.title
                      }`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {activeWorkout ? (
                <button
                  type="button"
                  onClick={() => navigate('/workouts?resume=1')}
                  className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#00F0FF]/60 bg-[#00F0FF]/20 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-[#00F0FF]/30 active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{l('Retomar Treino', 'Resume Workout')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setGuidedModalOpen(true)}
                  className="inline-flex min-h-[44px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#00F0FF]/60 bg-[#00F0FF]/20 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.1em] text-white transition-all hover:bg-[#00F0FF]/30 active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{l('Retomar Missão', 'Resume Quest')}</span>
                </button>
              )}
            </div>
          </div>
        </HudCard>
      )}

      {/* 2. CENTRO DE COMANDO CONTEXTUAL (Próxima Ação + Treino + Refeição com Dados Reais) */}
      <HudCard
        variant="purple"
        corners
        className="border-[var(--hud-border-strong)] bg-[#10131D]/95 p-4 sm:p-5"
      >
        <div className="space-y-3.5">
          {/* Cabeçalho do Centro de Ação */}
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] pb-2.5">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-3.5 w-1 rounded-full bg-[#A855F7] shadow-[0_0_8px_#A855F7]"
              />
              <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.14em] text-slate-100">
                {l('Próxima Ação Recomendada', 'Recommended Next Action')}
              </h2>
            </div>
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-purple-300 tabular-nums">
              {dailyCompleted}/{dailyTotal} {l('concluídos', 'completed')}
            </span>
          </div>

          {/* Lista Contextual Inteligente (sem inventar dados, focado no que está pendente) */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* A. Missão / Hábito Pendente (Conclusão em 1 toque ou Iniciar Guiado) */}
            {(nextPendingHabit || nextPendingTask) && (
              <div className="flex flex-col gap-3 rounded-xl border border-cyan-500/25 bg-[#0B0E17]/90 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/35 bg-[#00F0FF]/12 text-[#00F0FF]">
                    <CheckSquare className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-[#00F0FF]">
                      {l('Próxima missão', 'Next mission')}
                    </p>
                    <p className="mt-0.5 text-sm sm:text-[15px] font-bold leading-snug text-white">
                      {nextPendingHabit
                        ? isEnglish
                          ? translateUiText(nextPendingHabit.title)
                          : nextPendingHabit.title
                        : isEnglish
                        ? translateUiText(nextPendingTask!.title)
                        : nextPendingTask!.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-300">
                      +{nextPendingHabit ? nextPendingHabit.xp_reward : nextPendingTask!.xp_reward}{' '}
                      XP
                      {nextPendingHabit?.stat_target
                        ? ` · ${nextPendingHabit.stat_target.slice(0, 3).toUpperCase()} +${
                            nextPendingHabit.stat_reward
                          }`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isGuidedEligible(
                    nextPendingHabit ? nextPendingHabit.title : nextPendingTask!.title,
                    nextPendingHabit ? nextPendingHabit.category : nextPendingTask!.category,
                    nextPendingHabit ? 'habit' : 'task'
                  ) && (
                    <button
                      type="button"
                      onClick={() =>
                        nextPendingHabit
                          ? handleStartGuidedHabitOrTask(nextPendingHabit, 'habit')
                          : handleStartGuidedHabitOrTask(nextPendingTask!, 'task')
                      }
                      className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3.5 py-2 font-orbitron text-[11px] font-bold uppercase tracking-[0.08em] text-slate-200 transition-all hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/15 hover:text-white active:scale-[0.98]"
                    >
                      <Play className="h-3.5 w-3.5 text-[#00F0FF]" />
                      <span>{l('Iniciar', 'Start')}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={
                      completingId ===
                      (nextPendingHabit ? nextPendingHabit.id : nextPendingTask!.id)
                    }
                    onClick={() =>
                      nextPendingHabit
                        ? void handleQuickCompleteHabit(nextPendingHabit)
                        : void handleQuickCompleteTask(nextPendingTask!)
                    }
                    className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.08em] text-emerald-100 transition-all hover:border-emerald-400/80 hover:bg-emerald-500/30 hover:text-white active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 text-emerald-300" />
                    <span>{l('Concluir', 'Complete')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* B. Treino Programado de Hoje (Início em 1 toque a partir da Home) */}
            {pendingWorkout && (
              <div className="flex flex-col gap-3 rounded-xl border border-[#A855F7]/30 bg-[#0B0E17]/90 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/35 bg-[#A855F7]/15 text-[#A855F7]">
                    <Dumbbell className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-[#C084FC]">
                      {l(
                        'Seu treino de hoje está pronto.',
                        'Your workout for today is ready.'
                      )}
                    </p>
                    <p className="mt-0.5 text-sm sm:text-[15px] font-bold leading-snug text-white">
                      {isEnglish
                        ? translateUiText(pendingWorkout.title)
                        : pendingWorkout.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-300">
                      +{pendingWorkout.xp_reward} XP ·{' '}
                      {pendingWorkout.stat_target === 'strength' ? 'STR' : 'END'} +
                      {pendingWorkout.stat_reward}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/workouts?start=today&routine=${encodeURIComponent(
                        pendingWorkout.routine_id
                      )}`
                    )
                  }
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#A855F7]/50 bg-[#A855F7]/20 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.08em] text-purple-100 transition-all hover:border-[#A855F7]/80 hover:bg-[#A855F7]/30 hover:text-white active:scale-[0.98]"
                >
                  <Play className="h-3.5 w-3.5 fill-current text-purple-200" />
                  <span>{l('Iniciar treino', 'Start workout')}</span>
                </button>
              </div>
            )}

            {/* C. Refeição Habitual ou Protocolo Nutricional Pendente */}
            {(recentMeal || pendingMeal) && (
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/25 bg-[#0B0E17]/90 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/35 bg-emerald-500/12 text-emerald-400">
                    <Apple className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                      {recentMeal
                        ? l(
                            `Registrar ${recentMeal.meal_type.toLowerCase()}`,
                            `Log ${translateUiText(recentMeal.meal_type).toLowerCase()}`
                          )
                        : l('Protocolo Nutricional Pendente', 'Pending Meal Protocol')}
                    </p>
                    <p className="mt-0.5 text-sm sm:text-[15px] font-bold leading-snug text-white">
                      {recentMeal
                        ? `${
                            isEnglish
                              ? translateUiText(recentMeal.food_name)
                              : recentMeal.food_name
                          } (${recentMeal.quantity_grams}g)`
                        : isEnglish
                        ? translateUiText(pendingMeal!.title)
                        : pendingMeal!.title}
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-slate-300">
                      {recentMeal
                        ? `${recentMeal.calories} kcal · ${l(
                            'Repetição rápida em 1 confirmação',
                            'Quick repeat in 1 confirmation'
                          )}`
                        : `+${pendingMeal!.xp_reward} XP · ${pendingMeal!.totalKcal} kcal`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {recentMeal && (
                    <button
                      type="button"
                      onClick={onOpenRepeatMeal}
                      className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3.5 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.08em] text-emerald-100 transition-all hover:border-emerald-400/75 hover:bg-emerald-500/25 hover:text-white active:scale-[0.98]"
                    >
                      <Repeat className="h-3.5 w-3.5 text-emerald-300" />
                      <span>{l('Repetir refeição', 'Repeat meal')}</span>
                    </button>
                  )}

                  {pendingMeal && !recentMeal && (
                    <button
                      type="button"
                      disabled={completingId === pendingMeal.id}
                      onClick={() => void handleQuickCompleteMealPlan(pendingMeal)}
                      className="inline-flex min-h-[44px] flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-xl border border-emerald-400/45 bg-emerald-500/15 px-3.5 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.08em] text-emerald-100 transition-all hover:border-emerald-400/75 hover:bg-emerald-500/25 hover:text-white active:scale-[0.98] disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>{l('Concluir refeição', 'Complete meal')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* D. Estado Completo ou Sem Pendências */}
            {!nextPendingHabit && !nextPendingTask && !pendingWorkout && !pendingMeal && (
              <div className="flex flex-col gap-3 rounded-xl border border-amber-500/25 bg-[#0B0E17]/90 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/35 bg-amber-500/15 text-amber-400">
                    {allCompletedToday ? (
                      <Trophy className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-orbitron text-[10px] font-bold uppercase tracking-[0.12em] text-amber-400">
                      {allCompletedToday
                        ? l('Sincronização Diária Completa', 'Daily Sync Complete')
                        : l('Quadro de Missões', 'Quest Board')}
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-white">
                      {allCompletedToday
                        ? l(
                            `Todas as atividades de hoje foram concluídas (+${todayXp} XP).`,
                            `All activities for today completed (+${todayXp} XP).`
                          )
                        : l(
                            'Adicione ou personalize hábitos no Quadro de Missões.',
                            'Add or customize habits on the Quest Board.'
                          )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/quests')}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-4 py-2 font-orbitron text-xs font-bold uppercase tracking-[0.08em] text-amber-100 transition-all hover:bg-amber-500/25"
                >
                  <span>{l('Ver Missões', 'View Quests')}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* 3. MODO RÁPIDO DIÁRIO (Hábitos em 1 toque + Água + Sono + Foco) */}
          <div className="border-t border-white/[0.07] pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.14em] text-slate-300">
                <Zap className="h-3 w-3 text-[#00F0FF]" />
                {l('Modo Rápido (1 Toque)', 'Quick Mode (1-Tap)')}
              </span>
              <span className="text-[11px] font-medium text-slate-400">
                {l('Sem formulários', 'Zero forms')}
              </span>
            </div>

            {/* Pílulas de Hábitos Pendentes Adicionais para Conclusão Instantânea */}
            {pendingHabits.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {pendingHabits.slice(1, 4).map((habit) => (
                  <button
                    key={habit.id}
                    type="button"
                    disabled={completingId === habit.id}
                    onClick={() => void handleQuickCompleteHabit(habit)}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-slate-200 transition-all hover:border-emerald-400/50 hover:bg-emerald-500/15 hover:text-white active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate max-w-[180px]">
                      {isEnglish ? translateUiText(habit.title) : habit.title}
                    </span>
                    <span className="font-orbitron text-[10px] font-bold text-[#00F0FF]">
                      +{habit.xp_reward} XP
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Barra de Controles de Alta Frequência: Água + Sono + Foco */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {/* Controle Rápido 1: Água */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-cyan-500/20 bg-[#0B0D14]/90 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Droplets className="h-4 w-4 text-[#00F0FF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">
                      {l('Água', 'Water')}
                    </p>
                    <p className="text-[10px] font-medium text-cyan-300 tabular-nums">
                      {waterMl}/{targetWaterMl}ml
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleAddWater(250)}
                    aria-label={l('Adicionar 250ml de água', 'Add 250ml water')}
                    className="min-h-[38px] min-w-[48px] rounded-lg border border-[#00F0FF]/35 bg-[#00F0FF]/12 px-2 py-1 font-orbitron text-[10px] font-bold text-[#00F0FF] transition-all hover:bg-[#00F0FF]/25 active:scale-95"
                  >
                    +250ml
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAddWater(500)}
                    aria-label={l('Adicionar 500ml de água', 'Add 500ml water')}
                    className="min-h-[38px] min-w-[48px] rounded-lg border border-white/15 bg-white/[0.05] px-2 py-1 font-orbitron text-[10px] font-bold text-slate-200 transition-all hover:border-[#00F0FF]/40 hover:text-white active:scale-95"
                  >
                    +500ml
                  </button>
                </div>
              </div>

              {/* Controle Rápido 2: Sono Reparador */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-500/20 bg-[#0B0D14]/90 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Moon className="h-4 w-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">
                      {l('Sono', 'Sleep')}
                    </p>
                    <p className="text-[10px] font-medium text-indigo-300">
                      {sleepLoggedHours !== null
                        ? l(`${sleepLoggedHours}h registrado ✓`, `${sleepLoggedHours}h logged ✓`)
                        : '+20 XP · +2 EQU'}
                    </p>
                  </div>
                </div>
                {sleepLoggedHours === null ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={isLoggingSleep}
                      onClick={() => void handleQuickLogSleep(7)}
                      aria-label={l('Registrar 7 horas de sono', 'Log 7 hours of sleep')}
                      className="min-h-[38px] min-w-[42px] rounded-lg border border-indigo-400/35 bg-indigo-500/15 px-2.5 py-1 font-orbitron text-[10px] font-bold text-indigo-200 transition-all hover:bg-indigo-500/25 active:scale-95 disabled:opacity-50"
                    >
                      7h
                    </button>
                    <button
                      type="button"
                      disabled={isLoggingSleep}
                      onClick={() => void handleQuickLogSleep(8)}
                      aria-label={l('Registrar 8 horas de sono', 'Log 8 hours of sleep')}
                      className="min-h-[38px] min-w-[42px] rounded-lg border border-indigo-400/50 bg-indigo-500/25 px-2.5 py-1 font-orbitron text-[10px] font-bold text-white transition-all hover:bg-indigo-500/35 active:scale-95 disabled:opacity-50"
                    >
                      8h
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('/rest')}
                    className="min-h-[38px] rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"
                  >
                    {l('Ver', 'View')}
                  </button>
                )}
              </div>

              {/* Controle Rápido 3: Sessão de Foco 15m */}
              <div className="flex items-center justify-between gap-2 rounded-xl border border-purple-500/20 bg-[#0B0D14]/90 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 text-[#A855F7] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-white leading-tight">
                      {l('Foco Tático', 'Tactical Focus')}
                    </p>
                    <p className="text-[10px] font-medium text-purple-300">
                      {l('Timer 15 min', '15 min timer')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleQuickFocusSession}
                  className="inline-flex min-h-[38px] items-center gap-1 rounded-lg border border-[#A855F7]/40 bg-[#A855F7]/15 px-3 py-1 font-orbitron text-[10px] font-bold uppercase text-purple-200 transition-all hover:bg-[#A855F7]/25 hover:text-white active:scale-95"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{l('Iniciar', 'Start')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </HudCard>

      {/* Modal de Execução Guiada Acionado Diretamente na Home */}
      {userId && (
        <GuidedQuestModal
          open={guidedModalOpen}
          onClose={() => setGuidedModalOpen(false)}
          session={guidedSession}
          userId={userId}
          onComplete={handleGuidedComplete}
        />
      )}
    </div>
  );
}
