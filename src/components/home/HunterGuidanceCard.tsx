import React from 'react';
import { motion } from 'framer-motion';
import { Compass, X, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { usePreferences } from '@/contexts/preferences';
import { useHunterStore } from '@/stores/useHunterStore';
import { useQuickActionsStore } from '@/stores/useQuickActionsStore';
import { useNavigate } from 'react-router-dom';

export function HunterGuidanceCard() {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const navigate = useNavigate();

  const { showHunterGuidance, toggleHunterGuidance } = useQuickActionsStore();
  const {
    trainingFocus,
    nutritionGoal,
    mainGoal,
    hunterClass,
    experienceLevel,
  } = useHunterStore();

  if (!showHunterGuidance) return null;

  // Se o usuário não possui dados cadastrados no perfil ainda, não exibe
  const hasProfileData = Boolean(trainingFocus || nutritionGoal || mainGoal || hunterClass);
  if (!hasProfileData) return null;

  // Resolução determinística da orientação personalizada sem IA
  const resolveGuidance = () => {
    if (trainingFocus === 'hypertrophy' || nutritionGoal === 'hypertrophy') {
      return {
        title: l('Diretriz do Arquiteto — Hipertrofia', 'Architect Guideline — Hypertrophy'),
        tip: l(
          'Seu foco atual é desenvolvimento muscular. Priorize bater sua meta diária de proteínas em Nutrição e registrar a progressão de cargas no Treinamento.',
          'Your active focus is muscle building. Prioritize hitting your daily protein target in Nutrition and recording progressive overload in Training.'
        ),
        targetPath: '/nutrition',
        targetLabel: l('Ver Nutrição', 'Check Nutrition'),
      };
    }

    if (mainGoal === 'mental' || hunterClass === 'Scholar' || hunterClass === 'Monk') {
      return {
        title: l('Diretriz do Arquiteto — Foco & Equilíbrio', 'Architect Guideline — Focus & Balance'),
        tip: l(
          'Sua jornada valoriza a disciplina mental e a sabedoria. Reserve minutos para respiração guiada no Santuário do Descanso e conclua suas missões diárias.',
          'Your journey values mental discipline and wisdom. Dedicate minutes to guided breathing in Recovery and complete your daily quests.'
        ),
        targetPath: '/rest',
        targetLabel: l('Abrir Descanso', 'Open Recovery'),
      };
    }

    if (trainingFocus === 'endurance' || mainGoal === 'health') {
      return {
        title: l('Diretriz do Arquiteto — Vitalidade & Saúde', 'Architect Guideline — Vitality & Health'),
        tip: l(
          'Seu protocolo é sustentabilidade e condicionamento. Mantenha hidratação, sono consistente e registre suas rotinas de mobilidade ou cárdio.',
          'Your protocol focuses on longevity and endurance. Keep hydrated, secure consistent sleep, and log your mobility or cardio routines.'
        ),
        targetPath: '/workouts',
        targetLabel: l('Ver Treinos', 'View Training'),
      };
    }

    // Default guidance
    return {
      title: l('Diretriz do Arquiteto — Disciplina Diária', 'Architect Guideline — Daily Discipline'),
      tip: l(
        'A evolução contínua vem da consistência. Complete suas missões prioritárias de hoje para manter seu streak ativo e acumular XP.',
        'Continuous evolution comes from consistency. Complete today’s priority quests to sustain your streak and accumulate XP.'
      ),
      targetPath: '/quests',
      targetLabel: l('Ver Missões', 'View Quests'),
    };
  };

  const guidance = resolveGuidance();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="relative"
    >
      <HudCard
        variant="purple"
        corners
        radialGlow
        className="p-4 sm:px-5 sm:py-4 border-[#A855F7]/30 bg-[#120F1D]/80"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/40 bg-[#A855F7]/15 text-[#C084FC]">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-orbitron text-[11px] font-bold uppercase tracking-wider text-[#C084FC]">
                  {guidance.title}
                </span>
                <span className="inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{l('Orientação Opcional', 'Optional Guide')}</span>
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                {guidance.tip}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(guidance.targetPath)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#00F0FF] hover:underline"
                >
                  <span>{guidance.targetLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] text-slate-400">
                  {l(
                    'Todos os módulos permanecem 100% disponíveis.',
                    'All modules remain 100% available.'
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleHunterGuidance(false)}
            aria-label={l('Ocultar Orientação', 'Dismiss Guidance')}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </HudCard>
    </motion.div>
  );
}

