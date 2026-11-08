import { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Flame,
  Clock,
  BookOpen,
  Zap,
  Shield,
  Heart,
  Sparkles,
  Plus,
  Minus,
  ArrowUpRight,
  Info,
  Trophy,
} from 'lucide-react';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar, NeonProgressRing } from '@/components/ui/neon-progress';
import type { GuidedQuestSession } from '@/lib/guidedQuests';
import {
  detectGuidedActivity,
  saveGuidedSession,
  clearGuidedSession,
  calculateRemainingSeconds,
  formatTimeMMSS,
} from '@/lib/guidedQuests';
import { usePreferences } from '@/contexts/preferences';
import { useNavigate } from 'react-router-dom';

interface GuidedQuestModalProps {
  open: boolean;
  onClose: () => void;
  session: GuidedQuestSession | null;
  userId: string;
  onComplete: (
    questId: string,
    questType: 'habit' | 'task' | 'workout',
    results: { repsDone?: number; timeSeconds?: number }
  ) => Promise<void>;
}

export function GuidedQuestModal({
  open,
  onClose,
  session,
  userId,
  onComplete,
}: GuidedQuestModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const prefersReducedMotion = useReducedMotion();
  const navigate = useNavigate();

  // Preset detection for lore, posture tips and cadence
  const config = session ? detectGuidedActivity(session.title, session.category) : null;

  // Reps State
  const [currentReps, setCurrentReps] = useState<number>(0);
  const [targetReps, setTargetReps] = useState<number>(20);

  // Timer State
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(600);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [targetTimestamp, setTargetTimestamp] = useState<number | null>(null);

  // Accordion State
  const [tipsOpen, setTipsOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedCelebration, setCompletedCelebration] = useState<boolean>(false);

  // Sync state when session opens
  useEffect(() => {
    if (!open || !session) return;

    if (session.mode === 'reps') {
      setCurrentReps(session.currentValue || 0);
      setTargetReps(session.targetValue || config?.defaultTarget || 20);
    } else if (session.mode === 'timer') {
      const initialTotal = session.targetValue || config?.defaultTarget || 600;
      setTotalSeconds(initialTotal);

      if (session.targetTimestamp && !session.isPaused) {
        const remaining = calculateRemainingSeconds(session);
        setRemainingSeconds(remaining);
        setTargetTimestamp(session.targetTimestamp);
        setIsPaused(false);
      } else if (session.isPaused && typeof session.remainingWhenPaused === 'number') {
        setRemainingSeconds(session.remainingWhenPaused);
        setTargetTimestamp(null);
        setIsPaused(true);
      } else {
        // Nova sessão de timer iniciando
        const now = Date.now();
        const target = now + initialTotal * 1000;
        setRemainingSeconds(initialTotal);
        setTargetTimestamp(target);
        setIsPaused(false);

        // Salva estado inicial com timestamp epoch
        saveGuidedSession(
          {
            ...session,
            targetTimestamp: target,
            isPaused: false,
            remainingWhenPaused: null,
          },
          userId
        );
      }
    }
  }, [open, session?.questId, session?.mode]);

  // Persistent Timer Tick (baseado em Date.now() para resistir a aba em segundo plano / tela bloqueada)
  useEffect(() => {
    if (!open || !session || session.mode !== 'timer' || isPaused || !targetTimestamp) {
      return;
    }

    const interval = setInterval(() => {
      const remainingMs = targetTimestamp - Date.now();
      const nextRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
      setRemainingSeconds(nextRemaining);

      if (nextRemaining <= 0) {
        clearInterval(interval);
        setTargetTimestamp(null);
        // Haptic feedback se suportado
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate([100, 50, 150]);
          } catch {
            // Ignorar erro se não permitido
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [open, session?.mode, isPaused, targetTimestamp]);

  // Steppers para Repetições
  const handleAdjustReps = (delta: number) => {
    setCurrentReps((prev) => {
      const next = Math.max(0, prev + delta);
      if (session && userId) {
        saveGuidedSession({ ...session, currentValue: next, targetValue: targetReps }, userId);
      }
      return next;
    });
  };

  // Timer Controls
  const handleToggleTimer = () => {
    if (!session || !userId) return;

    if (isPaused) {
      // Retomar timer
      const now = Date.now();
      const newTarget = now + remainingSeconds * 1000;
      setTargetTimestamp(newTarget);
      setIsPaused(false);
      saveGuidedSession(
        {
          ...session,
          targetTimestamp: newTarget,
          isPaused: false,
          remainingWhenPaused: null,
        },
        userId
      );
    } else {
      // Pausar timer
      setIsPaused(true);
      setTargetTimestamp(null);
      saveGuidedSession(
        {
          ...session,
          targetTimestamp: null,
          isPaused: true,
          remainingWhenPaused: remainingSeconds,
        },
        userId
      );
    }
  };

  const handleAdjustTime = (deltaSeconds: number) => {
    if (!session || !userId) return;
    const nextRemaining = Math.max(10, remainingSeconds + deltaSeconds);
    setRemainingSeconds(nextRemaining);

    if (!isPaused) {
      const newTarget = Date.now() + nextRemaining * 1000;
      setTargetTimestamp(newTarget);
      saveGuidedSession(
        {
          ...session,
          targetTimestamp: newTarget,
          targetValue: Math.max(totalSeconds, nextRemaining),
        },
        userId
      );
    } else {
      saveGuidedSession(
        {
          ...session,
          remainingWhenPaused: nextRemaining,
          targetValue: Math.max(totalSeconds, nextRemaining),
        },
        userId
      );
    }
  };

  const handleResetTimer = () => {
    if (!session || !userId) return;
    const initial = config?.defaultTarget || 600;
    setRemainingSeconds(initial);
    setTotalSeconds(initial);
    setIsPaused(true);
    setTargetTimestamp(null);
    saveGuidedSession(
      {
        ...session,
        remainingWhenPaused: initial,
        targetTimestamp: null,
        isPaused: true,
      },
      userId
    );
  };

  // Concluir Missão
  const handleConfirmCompletion = async () => {
    if (!session || isSubmitting) return;
    setIsSubmitting(true);
    setCompletedCelebration(true);

    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([60, 40, 120]);
        } catch {
          // Ignorar se não suportado
        }
      }

      await onComplete(session.questId, session.questType, {
        repsDone: session.mode === 'reps' ? currentReps : undefined,
        timeSeconds: session.mode === 'timer' ? totalSeconds - remainingSeconds : undefined,
      });

      clearGuidedSession(userId);
      setTimeout(() => {
        setIsSubmitting(false);
        setCompletedCelebration(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('[GuidedQuestModal] Erro ao concluir:', err);
      setIsSubmitting(false);
      setCompletedCelebration(false);
    }
  };

  const handleAbandon = () => {
    if (confirm(l('Deseja cancelar esta sessão guiada?', 'Cancel this guided session?'))) {
      clearGuidedSession(userId);
      onClose();
    }
  };

  if (!open || !session) return null;

  const repsProgressPct = Math.min(100, Math.round((currentReps / (targetReps || 1)) * 100));
  const timerElapsed = Math.max(0, totalSeconds - remainingSeconds);
  const timerProgressPct = Math.min(100, Math.round((timerElapsed / (totalSeconds || 1)) * 100));
  const isTimerDone = remainingSeconds <= 0;

  const IconComponent =
    config?.iconName === 'flame'
      ? Flame
      : config?.iconName === 'book'
      ? BookOpen
      : config?.iconName === 'zap'
      ? Zap
      : config?.iconName === 'shield'
      ? Shield
      : config?.iconName === 'heart'
      ? Heart
      : config?.iconName === 'sparkles'
      ? Sparkles
      : config?.iconName === 'clock'
      ? Clock
      : Dumbbell;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop escurecido com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Surface HUD v2 */}
        <motion.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#00F0FF]/35 bg-[#0B0E14] shadow-[0_0_40px_rgba(0,240,255,0.18)] flex flex-col max-h-[92vh]"
        >
          {/* Filete superior luminoso */}
          <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_12px_#00F0FF]" />

          {/* Cabeçalho Tático */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
                <IconComponent className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-orbitron text-[9px] font-black uppercase tracking-[0.2em] text-[#00F0FF]">
                    {session.mode === 'reps'
                      ? l('MODO REPETIÇÕES', 'REPETITIONS MODE')
                      : session.mode === 'timer'
                      ? l('MODO CRONOMETRADO', 'TIMED SESSION')
                      : l('MODO ROTINA', 'WORKOUT ROUTINE')}
                  </span>
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-orbitron text-[9px] font-bold text-amber-400">
                    +{session.xpReward} XP
                  </span>
                </div>
                <h3 className="truncate font-orbitron text-sm sm:text-base font-black text-white">
                  {session.title}
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
              title={l('Minimizar sessão', 'Minimize session')}
              aria-label={l('Minimizar sessão', 'Minimize session')}
            >
              <X size={18} />
            </button>
          </div>

          {/* Corpo Rolável */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scrollbar-thin scrollbar-thumb-white/10">
            {/* Banner se for rotina de treino */}
            {session.mode === 'routine' ? (
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 text-center space-y-3">
                <Dumbbell className="mx-auto h-12 w-12 text-purple-400" />
                <h4 className="font-orbitron text-base font-bold text-white">
                  {l('Rotina Integrada ao Training Center', 'Integrated Training Routine')}
                </h4>
                <p className="text-xs text-slate-300">
                  {l(
                    'Esta missão executa a rotina completa no módulo de treinos com cargas, séries e cronômetro de descanso.',
                    'This quest runs the complete routine in the Training Center with sets, loads, and rest timers.'
                  )}
                </p>
                <div className="pt-2 flex justify-center">
                  <TacticalButton
                    variant="primary"
                    accent="purple"
                    displayFont
                    onClick={() => {
                      clearGuidedSession(userId);
                      navigate('/workouts');
                      onClose();
                    }}
                    rightIcon={<ArrowUpRight size={16} />}
                  >
                    {l('Abrir Training Center', 'Open Training Center')}
                  </TacticalButton>
                </div>
              </div>
            ) : session.mode === 'reps' ? (
              /* A. INTERFACE DE REPETIÇÕES */
              <div className="space-y-5">
                {/* Contador Gigante HUD */}
                <div className="rounded-2xl border border-white/10 bg-black/50 p-6 text-center relative overflow-hidden">
                  <div className="absolute top-2 right-3 font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {l('ALVO:', 'TARGET:')} {targetReps}
                  </div>

                  <span className="font-orbitron text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                    {l('Repetições Realizadas', 'Completed Repetitions')}
                  </span>

                  <div className="my-2 flex items-baseline justify-center gap-2">
                    <span className="font-orbitron text-6xl sm:text-7xl font-black text-white tabular-nums drop-shadow-[0_0_16px_rgba(0,240,255,0.25)]">
                      {currentReps}
                    </span>
                    <span className="font-orbitron text-lg font-bold text-slate-500">
                      / {targetReps}
                    </span>
                  </div>

                  {/* Barra de Progresso */}
                  <div className="mt-3 flex items-center gap-3">
                    <NeonProgressBar
                      value={currentReps}
                      max={targetReps}
                      variant="xp"
                      size="md"
                      className="flex-1"
                      ariaLabel="Reps progress"
                    />
                    <span className="font-orbitron text-xs font-bold text-[#00F0FF] tabular-nums">
                      {repsProgressPct}%
                    </span>
                  </div>

                  {repsProgressPct >= 100 && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 font-orbitron text-[11px] font-bold text-emerald-300"
                    >
                      <CheckCircle2 size={14} />
                      {l('OBJETIVO ALCANÇADO', 'TARGET REACHED')}
                    </motion.div>
                  )}
                </div>

                {/* Botões Táteis Rápidos (Steppers) */}
                <div className="space-y-2">
                  <span className="block font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {l('Registro Rápido de Séries', 'Quick Step Logging')}
                  </span>
                  <div className="grid grid-cols-5 gap-2">
                    {[-5, -1, +1, +5, +10].map((step) => {
                      const isPositive = step > 0;
                      return (
                        <button
                          key={step}
                          type="button"
                          onClick={() => handleAdjustReps(step)}
                          className={`flex min-h-[52px] items-center justify-center rounded-xl border font-orbitron text-xs sm:text-sm font-black transition-all active:scale-95 ${
                            isPositive
                              ? 'border-[#00F0FF]/35 bg-[#00F0FF]/10 text-[#00F0FF] hover:bg-[#00F0FF]/20 shadow-[0_0_12px_rgba(0,240,255,0.1)]'
                              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {step > 0 ? `+${step}` : step}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ajuste manual direto */}
                <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
                  <span className="text-xs font-medium text-slate-400">
                    {l('Definir valor manual:', 'Direct manual input:')}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={currentReps}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        setCurrentReps(val);
                        if (session && userId) {
                          saveGuidedSession({ ...session, currentValue: val }, userId);
                        }
                      }}
                      className="w-20 rounded-lg border border-white/15 bg-black/60 px-2 py-1 text-center font-orbitron text-sm font-bold text-white focus:border-[#00F0FF] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleAdjustReps(targetReps - currentReps)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-orbitron text-[10px] font-bold text-slate-300 hover:border-white/25"
                    >
                      {l('Meta', 'Max')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* B. INTERFACE CRONOMETRADA (TIMER) */
              <div className="space-y-5">
                {/* Mostrador Digital Central com NeonProgressRing */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/50 p-6 text-center">
                  <NeonProgressRing
                    value={timerProgressPct}
                    max={100}
                    size={170}
                    strokeWidth={10}
                    variant="cyan-purple"
                    ariaLabel="Timer progress"
                  >
                    <div className="flex flex-col items-center">
                      <span className="font-orbitron text-3xl sm:text-4xl font-black text-white tabular-nums tracking-wider drop-shadow-[0_0_12px_rgba(0,240,255,0.3)]">
                        {formatTimeMMSS(remainingSeconds)}
                      </span>
                      <span
                        className={`mt-1 font-orbitron text-[9px] font-extrabold uppercase tracking-widest ${
                          isTimerDone
                            ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : isPaused
                            ? 'text-amber-400'
                            : 'text-[#00F0FF]'
                        }`}
                      >
                        {isTimerDone
                          ? l('CONCLUÍDO', 'FINISHED')
                          : isPaused
                          ? l('PAUSADO', 'PAUSED')
                          : l('EM EXECUÇÃO', 'IN PROGRESS')}
                      </span>
                    </div>
                  </NeonProgressRing>

                  {/* Controles Principais do Timer */}
                  <div className="mt-5 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetTimer}
                      className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
                      title={l('Reiniciar timer', 'Reset timer')}
                      aria-label={l('Reiniciar timer', 'Reset timer')}
                    >
                      <RotateCcw size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleTimer}
                      className={`flex min-h-[52px] min-w-[130px] items-center justify-center gap-2 rounded-xl border px-6 font-orbitron text-xs font-black uppercase tracking-wider transition-all active:scale-95 ${
                        isPaused
                          ? 'border-[#00F0FF]/60 bg-[#00F0FF]/20 text-[#00F0FF] shadow-[0_0_18px_rgba(0,240,255,0.25)]'
                          : 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      }`}
                    >
                      {isPaused ? (
                        <>
                          <Play size={16} fill="currentColor" />
                          <span>{l('RETOMAR', 'RESUME')}</span>
                        </>
                      ) : (
                        <>
                          <Pause size={16} fill="currentColor" />
                          <span>{l('PAUSAR', 'PAUSE')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdjustTime(60)}
                      className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 font-orbitron text-[11px] font-bold text-slate-300 hover:border-white/20"
                    >
                      +1 MIN
                    </button>
                  </div>
                </div>

                {/* Ajustes rápidos de tempo */}
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(-60)}
                    disabled={remainingSeconds <= 60}
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 font-orbitron text-[10px] font-bold text-slate-400 hover:text-white disabled:opacity-40"
                  >
                    -1 MIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(300)}
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 font-orbitron text-[10px] font-bold text-slate-400 hover:text-white"
                  >
                    +5 MIN
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAdjustTime(600)}
                    className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-1.5 font-orbitron text-[10px] font-bold text-slate-400 hover:text-white"
                  >
                    +10 MIN
                  </button>
                </div>
              </div>
            )}

            {/* Accordion: Guia de Postura e Dicas Táticas */}
            {config && (
              <div className="overflow-hidden rounded-xl border border-white/8 bg-black/30">
                <button
                  type="button"
                  onClick={() => setTipsOpen(!tipsOpen)}
                  className="flex w-full items-center justify-between p-3.5 text-left text-xs font-bold text-slate-300 hover:bg-white/[0.02]"
                >
                  <span className="flex items-center gap-2">
                    <Info size={14} className="text-[#00F0FF]" />
                    <span>{l('Instruções Técnicas & Postura', 'Technical Instructions & Posture')}</span>
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${tipsOpen ? 'rotate-180 text-[#00F0FF]' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {tipsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 p-3.5 space-y-2.5 text-xs text-slate-400"
                    >
                      <p className="leading-relaxed">
                        {isEnglish ? config.instructions.en : config.instructions.pt}
                      </p>

                      {config.cadenceDescription && (
                        <div className="rounded-lg border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-2 font-orbitron text-[10px] font-bold text-[#00F0FF]">
                          {isEnglish
                            ? config.cadenceDescription.en
                            : config.cadenceDescription.pt}
                        </div>
                      )}

                      <ul className="list-disc pl-4 space-y-1">
                        {(isEnglish ? config.postureTips.en : config.postureTips.pt).map(
                          (tip, idx) => (
                            <li key={idx}>{tip}</li>
                          )
                        )}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Rodapé de Ações Táticas */}
          <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-[#07090E] p-3.5 sm:p-5">
            <button
              type="button"
              onClick={handleAbandon}
              className="flex min-h-[52px] items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-4 font-orbitron text-xs font-bold uppercase tracking-wider text-slate-400 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 transition-colors"
            >
              {l('Cancelar', 'Cancel')}
            </button>

            {session.mode !== 'routine' && (
              <TacticalButton
                variant="primary"
                accent={repsProgressPct >= 100 || isTimerDone ? 'cyan' : 'gold'}
                displayFont
                disabled={isSubmitting || (session.mode === 'reps' && currentReps === 0)}
                onClick={handleConfirmCompletion}
                leftIcon={<Trophy size={16} />}
                className="flex-1 min-h-[52px] text-xs sm:text-sm font-black"
              >
                {isSubmitting
                  ? l('CONCLUINDO...', 'COMPLETING...')
                  : l('CONFIRMAR CONCLUSÃO', 'CONFIRM COMPLETION')}
              </TacticalButton>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
