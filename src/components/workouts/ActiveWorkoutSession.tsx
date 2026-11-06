import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Dumbbell,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Replace,
  StickyNote,
  Timer,
  Volume2,
  Check,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { EXERCISE_ARSENAL } from '@/data/exerciseArsenal';
import { usePreferences } from '@/contexts/preferences';
import { cn } from '@/lib/utils';

export interface ActiveExerciseSet {
  setNumber: number;
  weight_kg: number;
  reps: number;
  completed: boolean;
}

export interface ActiveExerciseState {
  routineExerciseId: string;
  exerciseId: string;
  name: string;
  muscle_group: string;
  category: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
  setsData: ActiveExerciseSet[];
  notes?: string;
  completed: boolean;
}

interface ActiveWorkoutSessionProps {
  routineName: string;
  routineId: string;
  initialExercises: any[];
  onFinishWorkout: (sessionVolume: number, completedExIds: string[]) => Promise<void>;
  onCloseSession: () => void;
}

const TIMER_STORAGE_KEY = 'ascend_workout_rest_target';
const TIMER_CONFIG_KEY = 'ascend_workout_rest_duration';
const SESSION_START_KEY = 'ascend_workout_session_start';

export function ActiveWorkoutSession({
  routineName,
  routineId,
  initialExercises,
  onFinishWorkout,
  onCloseSession,
}: ActiveWorkoutSessionProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  // Session Start Timestamp
  const [startTime] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`${SESSION_START_KEY}_${routineId}`);
      if (stored) return Number(stored);
      const now = Date.now();
      localStorage.setItem(`${SESSION_START_KEY}_${routineId}`, String(now));
      return now;
    } catch {
      return Date.now();
    }
  });

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Exercises State with per-set logging
  const [exercises, setExercises] = useState<ActiveExerciseState[]>(() => {
    try {
      const stored = localStorage.getItem(`ascend_session_sets_${routineId}`);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }

    return initialExercises.map((re) => {
      const count = re.sets || 3;
      const setsData: ActiveExerciseSet[] = Array.from({ length: count }, (_, idx) => ({
        setNumber: idx + 1,
        weight_kg: re.weight_kg || 0,
        reps: re.reps || 10,
        completed: false,
      }));

      return {
        routineExerciseId: re.id,
        exerciseId: re.exercise_id || re.exercise?.id || '',
        name: re.exercise?.name || re.name || 'Exercício',
        muscle_group: re.exercise?.muscle_group || re.muscle_group || 'Geral',
        category: re.exercise?.category || re.category || 'Força',
        sets: count,
        targetReps: re.reps || 10,
        targetWeight: re.weight_kg || 0,
        setsData,
        notes: '',
        completed: false,
      };
    });
  });

  // Substitution Modal State
  const [substituteIndex, setSubstituteIndex] = useState<number | null>(null);

  // Rest Timer State com persistência de Timestamp
  const [restDuration, setRestDuration] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(TIMER_CONFIG_KEY);
      return stored ? Number(stored) : 60;
    } catch {
      return 60;
    }
  });

  const [timerRemaining, setTimerRemaining] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerFinishedNotice, setTimerFinishedNotice] = useState<boolean>(false);
  const [autoStartTimer, setAutoStartTimer] = useState<boolean>(true);

  // Elapsed Session Time Ticker
  useEffect(() => {
    const updateElapsed = () => {
      const elapsed = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
      setElapsedSeconds(elapsed);
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  // Rest Timer Ticker com cálculo exato a partir do targetTimestamp
  useEffect(() => {
    const checkTimer = () => {
      try {
        const storedTarget = localStorage.getItem(TIMER_STORAGE_KEY);
        if (!storedTarget) {
          setIsTimerRunning(false);
          setTimerRemaining(0);
          return;
        }

        const target = Number(storedTarget);
        const diffMs = target - Date.now();
        const remaining = Math.max(0, Math.ceil(diffMs / 1000));

        if (remaining > 0) {
          setTimerRemaining(remaining);
          setIsTimerRunning(true);
        } else {
          setTimerRemaining(0);
          setIsTimerRunning(false);
          localStorage.removeItem(TIMER_STORAGE_KEY);
          setTimerFinishedNotice(true);
          // Auto-dispensa notice de conclusão após 5s
          setTimeout(() => setTimerFinishedNotice(false), 5000);
        }
      } catch {
        // storage fallback
      }
    };

    checkTimer();
    const timerInterval = setInterval(checkTimer, 500);
    return () => clearInterval(timerInterval);
  }, []);

  // Persiste estado dos sets para recuperação
  useEffect(() => {
    try {
      localStorage.setItem(`ascend_session_sets_${routineId}`, JSON.stringify(exercises));
    } catch (err) {
      console.error('Erro ao persistir sessão:', err);
    }
  }, [exercises, routineId]);

  // Funções do Rest Timer
  const startRestTimer = (customSeconds?: number) => {
    const duration = customSeconds ?? restDuration;
    const target = Date.now() + duration * 1000;
    localStorage.setItem(TIMER_STORAGE_KEY, String(target));
    setTimerRemaining(duration);
    setIsTimerRunning(true);
    setTimerFinishedNotice(false);
  };

  const pauseRestTimer = () => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
    setIsTimerRunning(false);
  };

  const resetRestTimer = () => {
    localStorage.removeItem(TIMER_STORAGE_KEY);
    setIsTimerRunning(false);
    setTimerRemaining(0);
    setTimerFinishedNotice(false);
  };

  const handleSetTimerDuration = (seconds: number) => {
    setRestDuration(seconds);
    localStorage.setItem(TIMER_CONFIG_KEY, String(seconds));
    if (isTimerRunning) {
      startRestTimer(seconds);
    }
  };

  // Funções de Registro por Série
  const handleToggleSet = (exIdx: number, setIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.setsData];
      const currentSet = { ...updatedSets[setIdx] };

      const nextCompleted = !currentSet.completed;
      currentSet.completed = nextCompleted;
      updatedSets[setIdx] = currentSet;
      targetEx.setsData = updatedSets;

      // Verifica se todas as séries do exercício foram completadas
      targetEx.completed = updatedSets.every((s) => s.completed);
      updated[exIdx] = targetEx;

      // Se concluiu e autoStartTimer está ativo, dispara o descanso
      if (nextCompleted && autoStartTimer) {
        startRestTimer();
      }

      return updated;
    });
  };

  const handleUpdateSetWeight = (exIdx: number, setIdx: number, delta: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.setsData];
      const currentSet = { ...updatedSets[setIdx] };

      currentSet.weight_kg = Math.max(0, currentSet.weight_kg + delta);
      updatedSets[setIdx] = currentSet;
      targetEx.setsData = updatedSets;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  const handleUpdateSetReps = (exIdx: number, setIdx: number, delta: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const updatedSets = [...targetEx.setsData];
      const currentSet = { ...updatedSets[setIdx] };

      currentSet.reps = Math.max(1, currentSet.reps + delta);
      updatedSets[setIdx] = currentSet;
      targetEx.setsData = updatedSets;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  const handleAddSet = (exIdx: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const targetEx = { ...updated[exIdx] };
      const lastSet = targetEx.setsData[targetEx.setsData.length - 1];
      const newSet: ActiveExerciseSet = {
        setNumber: targetEx.setsData.length + 1,
        weight_kg: lastSet ? lastSet.weight_kg : targetEx.targetWeight,
        reps: lastSet ? lastSet.reps : targetEx.targetReps,
        completed: false,
      };
      targetEx.setsData = [...targetEx.setsData, newSet];
      targetEx.sets = targetEx.setsData.length;
      targetEx.completed = false;
      updated[exIdx] = targetEx;
      return updated;
    });
  };

  // Substituição de Exercício
  const handleSubstituteExercise = (newExName: string, newMuscle: string) => {
    if (substituteIndex === null) return;
    setExercises((prev) => {
      const updated = [...prev];
      updated[substituteIndex] = {
        ...updated[substituteIndex],
        name: newExName,
        muscle_group: newMuscle,
      };
      return updated;
    });
    setSubstituteIndex(null);
  };

  // Cálculos de Volume e Progresso da Sessão
  const sessionVolume = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      const exVol = ex.setsData.reduce((sub, s) => {
        return s.completed ? sub + s.weight_kg * s.reps : sub;
      }, 0);
      return acc + exVol;
    }, 0);
  }, [exercises]);

  const totalSetsCount = exercises.reduce((sum, ex) => sum + ex.setsData.length, 0);
  const completedSetsCount = exercises.reduce(
    (sum, ex) => sum + ex.setsData.filter((s) => s.completed).length,
    0
  );
  const completedExercisesCount = exercises.filter((ex) => ex.completed).length;
  const progressPercent =
    totalSetsCount > 0 ? Math.round((completedSetsCount / totalSetsCount) * 100) : 0;

  const formatElapsed = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-4">
      {/* 1. HUD DA SESSÃO ATIVA (Resumo em tempo real) */}
      <HudCard variant="cyan" corners radialGlow className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-[10px] font-black uppercase tracking-widest text-cyan-300">
                {l('SESSÃO DE TREINO EM ANDAMENTO', 'WORKOUT SESSION IN PROGRESS')}
              </span>
            </div>
            <h3 className="font-orbitron text-lg sm:text-xl font-black uppercase text-white mt-0.5">
              {routineName}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-2 shrink-0">
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">{l('Tempo', 'Time')}</span>
              <span className="font-orbitron text-sm font-black text-cyan-300">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">{l('Volume', 'Volume')}</span>
              <span className="font-orbitron text-sm font-black text-purple-300">
                {sessionVolume} <span className="text-[9px] font-bold">KG</span>
              </span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">{l('Séries', 'Sets')}</span>
              <span className="font-orbitron text-sm font-black text-amber-300">
                {completedSetsCount}/{totalSetsCount}
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Progresso da Sessão */}
        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              {completedExercisesCount} {l('de', 'of')} {exercises.length} {l('exercícios finalizados', 'exercises completed')}
            </span>
            <span className="text-cyan-300 font-bold">{progressPercent}%</span>
          </div>
          <NeonProgressBar value={progressPercent} variant="cyan" className="h-2" />
        </div>
      </HudCard>

      {/* 2. REST TIMER FLUTUANTE / TÁTICO */}
      <div
        className={cn(
          'rounded-2xl border p-4 transition-all duration-300',
          isTimerRunning
            ? 'border-cyan-400/60 bg-[#0E1B26] shadow-[0_0_20px_rgba(6,182,212,0.25)]'
            : timerFinishedNotice
              ? 'border-amber-400/80 bg-[#261E0E] shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
              : 'border-white/10 bg-[#12131D]'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-11 shrink-0 items-center justify-center rounded-xl border',
                isTimerRunning
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-400'
                  : timerFinishedNotice
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-white/10 bg-white/5 text-slate-400'
              )}
            >
              <Timer className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                {l('CRONÔMETRO DE DESCANSO TÁTICO', 'TACTICAL REST TIMER')}
              </p>
              <div className="flex items-baseline gap-2">
                <h4 className="font-orbitron text-2xl font-black text-white">
                  {formatElapsed(timerRemaining)}
                </h4>
                {timerFinishedNotice && (
                  <span className="font-orbitron text-xs font-black text-amber-400 uppercase tracking-wider">
                    {l('DESCANSO CONCLUÍDO!', 'REST COMPLETED!')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Presets Rápidos */}
            {[30, 60, 90, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => handleSetTimerDuration(sec)}
                className={cn(
                  'px-2.5 py-1 rounded-lg border text-xs font-mono font-bold transition-all',
                  restDuration === sec
                    ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                    : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'
                )}
              >
                {sec}s
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
              {isTimerRunning ? (
                <TacticalButton variant="secondary" onClick={pauseRestTimer}>
                  <Pause className="size-3.5 mr-1" />
                  {l('Pausar', 'Pause')}
                </TacticalButton>
              ) : (
                <TacticalButton variant="primary" onClick={() => startRestTimer()}>
                  <Play className="size-3.5 mr-1 fill-current" />
                  {l('Iniciar', 'Start')}
                </TacticalButton>
              )}
              <TacticalButton variant="ghost" onClick={resetRestTimer}>
                <RotateCcw className="size-3.5" />
              </TacticalButton>
            </div>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE EXERCÍCIOS COM REGISTRO DE SÉRIES */}
      <div className="space-y-4">
        {exercises.map((ex, exIdx) => (
          <HudCard
            key={ex.routineExerciseId || exIdx}
            variant={ex.completed ? 'default' : 'elevated'}
            className={cn(
              'p-4 transition-all duration-200',
              ex.completed && 'border-emerald-500/30 bg-[#0E1713]/80'
            )}
          >
            {/* Exercise Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-cyan-400">
                    {exIdx + 1}.
                  </span>
                  <h4 className="font-orbitron text-base font-black text-white truncate">
                    {ex.name}
                  </h4>
                  {ex.completed && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                      <Check className="size-3" />
                      {l('CONCLUÍDO', 'DONE')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-400/20 text-purple-300">
                    {ex.muscle_group}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {l('Meta:', 'Target:')} {ex.targetWeight}kg × {ex.targetReps} reps
                  </span>
                </div>
              </div>

              {/* Ação de Substituição */}
              <button
                type="button"
                onClick={() => setSubstituteIndex(exIdx)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-cyan-300 transition-colors p-1"
                title={l('Substituir exercício', 'Substitute exercise')}
              >
                <Replace className="size-3.5" />
                <span className="hidden sm:inline">{l('Substituir', 'Swap')}</span>
              </button>
            </div>

            {/* Sets Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[10px] font-mono font-bold uppercase text-slate-400 px-2">
                <span className="col-span-2 text-center">{l('Série', 'Set')}</span>
                <span className="col-span-4 text-center">{l('Carga (KG)', 'Weight (KG)')}</span>
                <span className="col-span-4 text-center">{l('Repetições', 'Reps')}</span>
                <span className="col-span-2 text-center">{l('Status', 'Done')}</span>
              </div>

              {ex.setsData.map((s, sIdx) => (
                <div
                  key={sIdx}
                  className={cn(
                    'grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all',
                    s.completed
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-white/10 bg-black/40'
                  )}
                >
                  {/* Set Number */}
                  <span className="col-span-2 text-center font-orbitron text-xs font-black text-slate-300">
                    #{s.setNumber}
                  </span>

                  {/* Weight Controls */}
                  <div className="col-span-4 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={s.completed}
                      onClick={() => handleUpdateSetWeight(exIdx, sIdx, -2.5)}
                      className="size-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="font-mono text-xs font-black text-white w-12 text-center">
                      {s.weight_kg}
                    </span>
                    <button
                      type="button"
                      disabled={s.completed}
                      onClick={() => handleUpdateSetWeight(exIdx, sIdx, 2.5)}
                      className="size-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Reps Controls */}
                  <div className="col-span-4 flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={s.completed}
                      onClick={() => handleUpdateSetReps(exIdx, sIdx, -1)}
                      className="size-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="font-mono text-xs font-black text-white w-8 text-center">
                      {s.reps}
                    </span>
                    <button
                      type="button"
                      disabled={s.completed}
                      onClick={() => handleUpdateSetReps(exIdx, sIdx, 1)}
                      className="size-7 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-40"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>

                  {/* Complete Checkbox Button */}
                  <div className="col-span-2 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleToggleSet(exIdx, sIdx)}
                      className={cn(
                        'size-8 rounded-xl border flex items-center justify-center transition-all',
                        s.completed
                          ? 'border-emerald-400 bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                          : 'border-white/20 bg-white/5 text-slate-400 hover:border-cyan-400/50 hover:text-white'
                      )}
                    >
                      <Check className="size-4 stroke-[3]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Botão Adicionar Série */}
            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleAddSet(exIdx)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300 hover:underline"
              >
                <Plus className="size-3.5" />
                {l('Adicionar Série', 'Add Set')}
              </button>

              <span className="text-[11px] font-mono text-slate-400">
                {l('Volume do Exercício:', 'Exercise Volume:')}{' '}
                <strong className="text-white">
                  {ex.setsData.reduce((sum, s) => (s.completed ? sum + s.weight_kg * s.reps : sum), 0)} kg
                </strong>
              </span>
            </div>
          </HudCard>
        ))}
      </div>

      {/* 4. AÇÕES DA SESSÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        <TacticalButton
          variant="secondary"
          fullWidth
          onClick={onCloseSession}
        >
          {l('Minimizar Sessão / Pausar', 'Minimize Session / Pause')}
        </TacticalButton>

        <TacticalButton
          variant="primary"
          displayFont
          fullWidth
          disabled={completedExercisesCount === 0}
          onClick={() => {
            const completedIds = exercises
              .filter((e) => e.completed)
              .map((e) => e.routineExerciseId);
            void onFinishWorkout(sessionVolume, completedIds);
          }}
        >
          <CheckCircle2 className="size-4 mr-1.5 text-cyan-300 fill-current" />
          {l('Finalizar Treino & Coletar XP', 'Finish Workout & Claim XP')}
        </TacticalButton>
      </div>

      {/* MODAL DE SUBSTITUIÇÃO DE EXERCÍCIO */}
      {substituteIndex !== null && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12131D] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h4 className="font-orbitron text-sm font-black text-white uppercase">
                {l('Substituir Exercício', 'Substitute Exercise')}
              </h4>
              <button onClick={() => setSubstituteIndex(null)} className="text-slate-400 hover:text-white">
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {l(
                'Selecione uma alternativa compatível para o mesmo grupo muscular:',
                'Select a compatible alternative for the same muscle group:'
              )}
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {EXERCISE_ARSENAL.filter(
                (a) =>
                  a.muscle_group === exercises[substituteIndex]?.muscle_group &&
                  a.name !== exercises[substituteIndex]?.name
              ).map((alt) => (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => handleSubstituteExercise(alt.name, alt.muscle_group)}
                  className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-cyan-500/10 hover:border-cyan-400/40 transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-xs text-slate-200 block">{alt.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{alt.equipment.join(', ')}</span>
                  </div>
                  <ChevronRight className="size-4 text-cyan-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
