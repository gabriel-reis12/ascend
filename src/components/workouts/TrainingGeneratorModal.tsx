import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  Dumbbell,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Play,
  Save,
  Layers,
  Activity,
  Flame,
  Target,
} from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import {
  generateTrainingProtocol,
  type TrainingGoal,
  type ExperienceLevel,
  type TrainingEnvironment,
  type PhysicalRestriction,
  type GeneratedProtocol,
} from '@/lib/trainingGenerator';
import type { Equipment, MuscleGroup } from '@/data/exerciseArsenal';
import { useHunterStore } from '@/stores/useHunterStore';
import { usePreferences } from '@/contexts/preferences';
import { cn } from '@/lib/utils';

interface TrainingGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProtocol: (protocol: GeneratedProtocol, startNow?: boolean) => Promise<void>;
}

export function TrainingGeneratorModal({
  isOpen,
  onClose,
  onSaveProtocol,
}: TrainingGeneratorModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  const hunterFocus = useHunterStore((s) => s.trainingFocus);
  const hunterLevel = useHunterStore((s) => s.experienceLevel);

  // Form State — Pré-preenchido com dados existentes do Onboarding
  const [step, setStep] = useState<'questions' | 'preview'>('questions');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const totalQuestions = 5;

  const [goal, setGoal] = useState<TrainingGoal>(() => {
    if (hunterFocus === 'hypertrophy') return 'hypertrophy';
    if (hunterFocus === 'strength') return 'strength';
    if (hunterFocus === 'conditioning') return 'conditioning';
    if (hunterFocus === 'weight_loss') return 'weight_loss';
    return 'health';
  });

  const [experience, setExperience] = useState<ExperienceLevel>(() => {
    if (hunterLevel === 'advanced') return 'advanced';
    if (hunterLevel === 'intermediate') return 'intermediate';
    return 'beginner';
  });

  const [frequency, setFrequency] = useState<2 | 3 | 4 | 5 | 6>(3);
  const [durationMinutes, setDurationMinutes] = useState<30 | 45 | 60 | 90>(60);
  const [environment, setEnvironment] = useState<TrainingEnvironment>('gym');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment[]>([
    'Barra',
    'Halteres',
    'Máquina',
    'Polia / Cabo',
    'Banco',
    'Peso Corporal',
  ]);
  const [restrictions, setRestrictions] = useState<PhysicalRestriction[]>([]);
  const [additionalModalities, setAdditionalModalities] = useState<string[]>([]);

  // Generated Protocol State
  const [protocol, setProtocol] = useState<GeneratedProtocol | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sincroniza com onboarding se mudar
  useEffect(() => {
    if (hunterFocus && ['hypertrophy', 'strength', 'conditioning', 'weight_loss', 'health'].includes(hunterFocus)) {
      setGoal(hunterFocus as TrainingGoal);
    }
    if (hunterLevel && ['beginner', 'intermediate', 'advanced'].includes(hunterLevel)) {
      setExperience(hunterLevel as ExperienceLevel);
    }
  }, [hunterFocus, hunterLevel]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    const proto = generateTrainingProtocol({
      goal,
      experience,
      frequency,
      durationMinutes,
      environment,
      availableEquipment: selectedEquipment,
      restrictions,
      additionalModalities,
    });
    setProtocol(proto);
    setStep('preview');
  };

  const toggleEquipment = (eq: Equipment) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const toggleRestriction = (rest: PhysicalRestriction) => {
    setRestrictions((prev) =>
      prev.includes(rest) ? prev.filter((item) => item !== rest) : [...prev, rest]
    );
  };

  const toggleModality = (mod: string) => {
    setAdditionalModalities((prev) =>
      prev.includes(mod) ? prev.filter((m) => m !== mod) : [...prev, mod]
    );
  };

  const handleSave = async (startNow = false) => {
    if (!protocol) return;
    setIsSaving(true);
    try {
      await onSaveProtocol(protocol, startNow);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar protocolo:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 30 }}
        className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl border border-white/10 bg-[#0E0F17] shadow-2xl overflow-hidden"
      >
        {/* Header Tático */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5 bg-[#141522]">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-400">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                {l('GERADOR INTELIGENTE · DETERMINÍSTICO', 'SMART GENERATOR · DETERMINISTIC')}
              </p>
              <h3 className="font-orbitron text-base sm:text-lg font-black uppercase tracking-wider text-white">
                {step === 'questions'
                  ? l('Configurar Protocolo Personalizado', 'Configure Custom Protocol')
                  : l('YOUR TRAINING PROTOCOL', 'YOUR TRAINING PROTOCOL')}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {step === 'questions' ? (
            <div>
              {/* Barra de Progresso do Questionário */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-cyan-300">
                    {l(`Etapa ${currentQuestion} de ${totalQuestions}`, `Step ${currentQuestion} of ${totalQuestions}`)}
                  </span>
                  <span className="text-slate-400">
                    {currentQuestion === 1 && l('Objetivo Físico', 'Physical Goal')}
                    {currentQuestion === 2 && l('Nível de Treino', 'Training Level')}
                    {currentQuestion === 3 && l('Frequência & Tempo', 'Frequency & Time')}
                    {currentQuestion === 4 && l('Ambiente & Equipamento', 'Environment & Equipment')}
                    {currentQuestion === 5 && l('Restrições & Modalidades', 'Restrictions & Modalities')}
                  </span>
                </div>
                <NeonProgressBar
                  value={(currentQuestion / totalQuestions) * 100}
                  variant="cyan"
                  className="h-1.5"
                />
              </div>

              {/* PERGUNTA 1: OBJETIVO */}
              {currentQuestion === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {l(
                      'Qual é o objetivo primordial da sua rotina de treino atual?',
                      'What is the primary objective of your current training routine?'
                    )}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { id: 'hypertrophy' as const, labelPt: 'Hipertrofia Muscular', labelEn: 'Hypertrophy & Muscle', descPt: 'Volume e densidade estética', descEn: 'Aesthetic volume and muscle density', icon: Dumbbell },
                      { id: 'strength' as const, labelPt: 'Ganho de Força', labelEn: 'Strength & Power', descPt: 'Carga máxima e potência neuromuscular', descEn: 'Max load and neuromuscular power', icon: Target },
                      { id: 'conditioning' as const, labelPt: 'Condicionamento Físico', labelEn: 'Conditioning & Stamina', descPt: 'Resistência aeróbica e muscular', descEn: 'Cardio and muscular endurance', icon: Activity },
                      { id: 'weight_loss' as const, labelPt: 'Emagrecimento / Queima', labelEn: 'Fat Loss & Burn', descPt: 'Gasto calórico e preservação magra', descEn: 'Calorie burn and lean retention', icon: Flame },
                      { id: 'health' as const, labelPt: 'Saúde Geral & Postura', labelEn: 'General Health & Posture', descPt: 'Mobilidade, longevidade e bem-estar', descEn: 'Mobility, longevity and well-being', icon: CheckCircle2 },
                    ].map((item) => {
                      const Icon = item.icon;
                      const active = goal === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setGoal(item.id)}
                          className={cn(
                            'flex flex-col text-left p-4 rounded-xl border transition-all',
                            active
                              ? 'border-cyan-400 bg-cyan-500/15 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className={cn('size-4', active ? 'text-cyan-400' : 'text-slate-400')} />
                            <span className={cn('font-orbitron text-xs font-black uppercase tracking-wider', active ? 'text-white' : 'text-slate-300')}>
                              {l(item.labelPt, item.labelEn)}
                            </span>
                          </div>
                          <span className="mt-1 text-[11px] text-slate-400">
                            {l(item.descPt, item.descEn)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PERGUNTA 2: EXPERIÊNCIA */}
              {currentQuestion === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {l(
                      'Qual é a sua experiência com treinamento resistido (musculação/calistenia)?',
                      'What is your experience with resistance training (weightlifting/calisthenics)?'
                    )}
                  </p>
                  <div className="space-y-3">
                    {[
                      { id: 'beginner' as const, labelPt: 'Iniciante (0 a 6 meses)', labelEn: 'Beginner (0 to 6 months)', descPt: 'Foco no aprendizado biomecânico e criação de hábito consistente.', descEn: 'Focus on biomechanical learning and consistent habit building.' },
                      { id: 'intermediate' as const, labelPt: 'Intermediário (6 meses a 2 anos)', labelEn: 'Intermediate (6 months to 2 years)', descPt: 'Domínio dos movimentos fundamentais, pronto para divisões Upper/Lower e PPL.', descEn: 'Mastery of fundamental movements, ready for Upper/Lower and PPL splits.' },
                      { id: 'advanced' as const, labelPt: 'Avançado (Mais de 2 anos)', labelEn: 'Advanced (Over 2 years)', descPt: 'Alta capacidade de recuperação, periodização e especialização muscular.', descEn: 'High recovery capacity, periodization and muscle specialization.' },
                    ].map((item) => {
                      const active = experience === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setExperience(item.id)}
                          className={cn(
                            'w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all',
                            active
                              ? 'border-purple-400 bg-purple-500/15 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                              : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                          )}
                        >
                          <div>
                            <span className={cn('font-orbitron text-xs font-black uppercase tracking-wider', active ? 'text-white' : 'text-slate-300')}>
                              {l(item.labelPt, item.labelEn)}
                            </span>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {l(item.descPt, item.descEn)}
                            </p>
                          </div>
                          <div className={cn('size-5 rounded-full border flex items-center justify-center shrink-0', active ? 'border-purple-400 bg-purple-500 text-black' : 'border-white/20')}>
                            {active && <CheckCircle2 className="size-3.5 fill-current" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PERGUNTA 3: FREQUÊNCIA E DURAÇÃO */}
              {currentQuestion === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-3">
                      {l('Quantos dias por semana você pode treinar?', 'How many days per week can you train?')}
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {([2, 3, 4, 5, 6] as const).map((days) => {
                        const active = frequency === days;
                        return (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setFrequency(days)}
                            className={cn(
                              'py-3 rounded-xl border flex flex-col items-center justify-center transition-all',
                              active
                                ? 'border-cyan-400 bg-cyan-500/20 text-white font-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                            )}
                          >
                            <span className="font-orbitron text-base font-black">{days}x</span>
                            <span className="text-[10px] uppercase font-mono">{l('dias', 'days')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-3">
                      {l('Quanto tempo você tem disponível por sessão?', 'How much time do you have per session?')}
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {([30, 45, 60, 90] as const).map((mins) => {
                        const active = durationMinutes === mins;
                        return (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setDurationMinutes(mins)}
                            className={cn(
                              'py-3 rounded-xl border flex flex-col items-center justify-center transition-all',
                              active
                                ? 'border-purple-400 bg-purple-500/20 text-white font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                            )}
                          >
                            <span className="font-orbitron text-base font-black">{mins}</span>
                            <span className="text-[10px] uppercase font-mono">MIN</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PERGUNTA 4: AMBIENTE E EQUIPAMENTOS */}
              {currentQuestion === 4 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-3">
                      {l('Onde você realizará seus treinamentos?', 'Where will you perform your workouts?')}
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'gym' as const, labelPt: 'Academia', labelEn: 'Gym' },
                        { id: 'home' as const, labelPt: 'Em Casa', labelEn: 'Home' },
                        { id: 'hybrid' as const, labelPt: 'Híbrido', labelEn: 'Hybrid' },
                      ].map((item) => {
                        const active = environment === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setEnvironment(item.id)}
                            className={cn(
                              'py-3 rounded-xl border text-center transition-all font-orbitron text-xs font-black uppercase tracking-wider',
                              active
                                ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-white'
                            )}
                          >
                            {l(item.labelPt, item.labelEn)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-3">
                      {l('Equipamentos disponíveis para seleção:', 'Available equipment for selection:')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(['Barra', 'Halteres', 'Máquina', 'Polia / Cabo', 'Banco', 'Peso Corporal', 'Elásticos', 'Kettlebell'] as Equipment[]).map((eq) => {
                        const active = selectedEquipment.includes(eq);
                        return (
                          <button
                            key={eq}
                            type="button"
                            onClick={() => toggleEquipment(eq)}
                            className={cn(
                              'p-2.5 rounded-lg border text-xs font-bold transition-all text-left flex items-center justify-between',
                              active
                                ? 'border-cyan-400/50 bg-cyan-500/10 text-cyan-300'
                                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200'
                            )}
                          >
                            <span className="truncate">{eq}</span>
                            <div className={cn('size-3.5 rounded border flex items-center justify-center shrink-0', active ? 'border-cyan-400 bg-cyan-400 text-black' : 'border-white/20')}>
                              {active && <CheckCircle2 className="size-2.5 fill-current" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* PERGUNTA 5: RESTRIÇÕES & MODALIDADES */}
              {currentQuestion === 5 && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className="size-4 text-amber-400" />
                      <label className="text-sm font-bold text-slate-200">
                        {l('Restrições Físicas / Movimentos a evitar:', 'Physical Restrictions / Movements to avoid:')}
                      </label>
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      {l(
                        'O motor adaptará os exercícios para não sobrecarregar articulações sensíveis.',
                        'The engine will adapt exercises to protect sensitive joints.'
                      )}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'lombar' as const, labelPt: 'Lombar (Evitar Terra/Agachamento Pesado)', labelEn: 'Lower Back (Avoid heavy deadlift/squat)' },
                        { id: 'joelho' as const, labelPt: 'Joelho (Evitar Impacto/Extensora)', labelEn: 'Knee (Avoid high impact/extensions)' },
                        { id: 'ombro' as const, labelPt: 'Ombro (Evitar Press Atrás/Mergulho)', labelEn: 'Shoulder (Avoid overhead/dips)' },
                        { id: 'punho' as const, labelPt: 'Punho (Evitar Barra Reta Rígida)', labelEn: 'Wrist (Avoid rigid straight bars)' },
                      ].map((rest) => {
                        const active = restrictions.includes(rest.id);
                        return (
                          <button
                            key={rest.id}
                            type="button"
                            onClick={() => toggleRestriction(rest.id)}
                            className={cn(
                              'p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between',
                              active
                                ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                                : 'border-white/10 bg-white/[0.02] text-slate-400 hover:text-slate-200'
                            )}
                          >
                            <span className="leading-tight">{l(rest.labelPt, rest.labelEn)}</span>
                            <div className={cn('size-4 rounded border flex items-center justify-center shrink-0 ml-2', active ? 'border-amber-400 bg-amber-400 text-black' : 'border-white/20')}>
                              {active && <CheckCircle2 className="size-3 fill-current" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold text-slate-300 block mb-2">
                      {l('Modalidades adicionais integradas:', 'Additional integrated activities:')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'corrida', label: 'Corrida' },
                        { id: 'caminhada', label: 'Caminhada' },
                        { id: 'muay_thai', label: 'Muay Thai / Luta' },
                        { id: 'ciclismo', label: 'Ciclismo' },
                        { id: 'natacao', label: 'Natação' },
                      ].map((mod) => {
                        const active = additionalModalities.includes(mod.id);
                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => toggleModality(mod.id)}
                            className={cn(
                              'p-2.5 rounded-lg border text-xs font-bold transition-all text-center',
                              active
                                ? 'border-purple-400/50 bg-purple-500/15 text-purple-300'
                                : 'border-white/10 bg-white/[0.02] text-slate-400'
                            )}
                          >
                            {mod.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Navegação do Questionário */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                {currentQuestion > 1 ? (
                  <TacticalButton
                    variant="ghost"
                    onClick={() => setCurrentQuestion((prev) => prev - 1)}
                  >
                    <ChevronLeft className="size-4 mr-1" />
                    {l('Voltar', 'Back')}
                  </TacticalButton>
                ) : (
                  <div />
                )}

                {currentQuestion < totalQuestions ? (
                  <TacticalButton
                    variant="primary"
                    onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  >
                    {l('Avançar', 'Next')}
                    <ChevronRight className="size-4 ml-1" />
                  </TacticalButton>
                ) : (
                  <TacticalButton
                    variant="primary"
                    displayFont
                    onClick={handleGenerate}
                  >
                    <Sparkles className="size-4 mr-1 text-cyan-300" />
                    {l('Gerar Protocolo Tático', 'Generate Tactical Protocol')}
                  </TacticalButton>
                )}
              </div>
            </div>
          ) : (
            /* PREVIEW DO PROTOCOLO GERADO */
            protocol && (
              <div className="space-y-6">
                {/* Protocol Hero Card */}
                <HudCard variant="purple" corners radialGlow className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-purple-300">
                        {protocol.splitType}
                      </span>
                      <h4 className="font-orbitron text-lg sm:text-xl font-black uppercase text-white mt-0.5">
                        {isEnglish ? protocol.nameEn : protocol.name}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        {isEnglish ? protocol.splitDescriptionEn : protocol.splitDescriptionPt}
                      </p>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0">
                      <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-1 font-mono text-xs font-bold text-cyan-300 text-center">
                        {isEnglish ? protocol.frequencyLabelEn : protocol.frequencyLabelPt}
                      </span>
                      <span className="rounded-lg border border-purple-400/30 bg-purple-500/10 px-2.5 py-1 font-mono text-xs font-bold text-purple-300 text-center">
                        {protocol.estimatedDuration}
                      </span>
                    </div>
                  </div>

                  {/* Attributes Target */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400">{l('Atributos Físicos Evoluídos:', 'Physical Attributes Evolved:')}</span>
                    <span className="font-orbitron font-black text-amber-300">
                      {protocol.targetAttributes.join(' · ')}
                    </span>
                  </div>
                </HudCard>

                {/* Routines Preview List */}
                <div className="space-y-4">
                  <h5 className="font-orbitron text-xs font-black uppercase tracking-wider text-slate-300">
                    {l('Divisão das Sessões de Treino:', 'Workout Sessions Breakdown:')}
                  </h5>

                  <div className="space-y-3">
                    {protocol.routines.map((routine, rIdx) => (
                      <div
                        key={rIdx}
                        className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-orbitron text-sm font-black text-cyan-300">
                            {routine.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-400">
                            {routine.exercises.length} {l('exercícios', 'exercises')}
                          </span>
                        </div>

                        {/* Exercises List */}
                        <div className="space-y-1.5 pt-1">
                          {routine.exercises.map((ex, eIdx) => (
                            <div
                              key={eIdx}
                              className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-black/40 border border-white/5"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[10px] text-slate-400 shrink-0">
                                  {eIdx + 1}.
                                </span>
                                <span className="text-slate-200 font-bold truncate">
                                  {ex.name}
                                </span>
                                <span className="text-[10px] font-mono text-purple-300/80 px-1.5 py-0.5 rounded bg-purple-500/10 hidden sm:inline">
                                  {ex.muscle_group}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold text-cyan-300 shrink-0 ml-2">
                                {ex.sets} × {ex.reps} ({ex.rest_seconds}s)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Disclaimer Clínico */}
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-center">
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {isEnglish ? protocol.clinicalDisclaimerEn : protocol.clinicalDisclaimerPt}
                  </p>
                </div>

                {/* Ações Finais */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <TacticalButton
                    variant="ghost"
                    fullWidth
                    onClick={() => setStep('questions')}
                  >
                    <RotateCcw className="size-4 mr-1" />
                    {l('Ajustar Respostas', 'Adjust Answers')}
                  </TacticalButton>

                  <TacticalButton
                    variant="secondary"
                    fullWidth
                    disabled={isSaving}
                    onClick={() => void handleSave(false)}
                  >
                    <Save className="size-4 mr-1" />
                    {l('Salvar Protocolo', 'Save Protocol')}
                  </TacticalButton>

                  <TacticalButton
                    variant="primary"
                    displayFont
                    fullWidth
                    disabled={isSaving}
                    onClick={() => void handleSave(true)}
                  >
                    <Play className="size-4 mr-1 text-cyan-300 fill-current" />
                    {l('Iniciar Treino Hoje', 'Start Training Today')}
                  </TacticalButton>
                </div>
              </div>
            )
          )}
        </div>
      </motion.div>
    </div>
  );
}
