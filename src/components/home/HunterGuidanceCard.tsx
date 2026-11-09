import { motion } from 'framer-motion';
import {
  Apple,
  ArrowRight,
  CheckSquare,
  Compass,
  Dumbbell,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react';
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
    level,
    xp,
  } = useHunterStore();

  if (!showHunterGuidance) return null;

  const hasProfileData = Boolean(trainingFocus || nutritionGoal || mainGoal || hunterClass);
  if (!hasProfileData) return null;

  const isDayOneHunter = level === 1 && xp < 100;

  const formatGoalLabel = () => {
    switch (mainGoal) {
      case 'hypertrophy':
        return l('Hipertrofia & Força', 'Hypertrophy & Strength');
      case 'weight_loss':
        return l('Definição & Queima Calórica', 'Fat Loss & Conditioning');
      case 'conditioning':
        return l('Condicionamento & Resistência', 'Endurance & Conditioning');
      case 'discipline':
        return l('Disciplina & Consistência', 'Discipline & Consistency');
      case 'focus_studies':
        return l('Foco & Sabedoria', 'Focus & Wisdom');
      default:
        return l('Evolução & Saúde Integral', 'Complete Health & Evolution');
    }
  };

  // Resolução determinística da orientação personalizada sem IA
  const resolveGuidance = () => {
    if (trainingFocus === 'hypertrophy' || nutritionGoal === 'hypertrophy' || mainGoal === 'hypertrophy') {
      return {
        title: l('Diretriz do Arquiteto — Hipertrofia', 'Architect Guideline — Hypertrophy'),
        tip: l(
          'Seu foco atual é desenvolvimento muscular. Priorize bater sua meta diária de proteínas em Nutrição e iniciar seu Treino A no Centro de Treinamento.',
          'Your active focus is muscle building. Prioritize hitting your daily protein target in Nutrition and starting Workout A in the Training Center.'
        ),
        targetPath: '/workouts',
        targetLabel: l('Iniciar Programa de Treino', 'Start Training Program'),
      };
    }

    if (mainGoal === 'mental' || mainGoal === 'focus_studies' || hunterClass === 'Scholar' || hunterClass === 'Monk') {
      return {
        title: l('Diretriz do Arquiteto — Foco & Equilíbrio', 'Architect Guideline — Focus & Balance'),
        tip: l(
          'Sua jornada valoriza a disciplina mental e a sabedoria. Conclua sua primeira missão prioritária de hoje e reserve minutos para respiração guiada.',
          'Your journey values mental discipline and wisdom. Complete your first priority quest today and dedicate minutes to guided breathing.'
        ),
        targetPath: '/quests',
        targetLabel: l('Concluir Primeira Missão', 'Complete First Quest'),
      };
    }

    if (trainingFocus === 'endurance' || mainGoal === 'health' || mainGoal === 'weight_loss') {
      return {
        title: l('Diretriz do Arquiteto — Vitalidade & Saúde', 'Architect Guideline — Vitality & Health'),
        tip: l(
          'Seu protocolo une condicionamento e nutrição estratégica. Confira seu plano alimentar calculado e execute sua primeira rotina no Training Center.',
          'Your protocol combines conditioning and strategic nutrition. Check your calculated meal plan and run your first routine in the Training Center.'
        ),
        targetPath: '/workouts',
        targetLabel: l('Ver Programa Inicial', 'View Starter Program'),
      };
    }

    return {
      title: l('Diretriz do Arquiteto — Disciplina Diária', 'Architect Guideline — Daily Discipline'),
      tip: l(
        'A evolução contínua vem da consistência. Complete suas missões prioritárias de hoje para manter seu streak ativo e acumular XP.',
        'Continuous evolution comes from consistency. Complete today’s priority quests to sustain your streak and accumulate XP.'
      ),
      targetPath: '/quests',
      targetLabel: l('Ver Missões de Hoje', 'View Today’s Quests'),
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
        className="p-4 sm:px-5 sm:py-4 border-[#A855F7]/30 bg-[#120F1D]/85 space-y-3"
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
                  <span>
                    {isDayOneHunter
                      ? l('Caminho do 1º Dia', 'Day 1 Path')
                      : l('Orientação Opcional', 'Optional Guide')}
                  </span>
                </span>
                <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-orbitron text-[9px] font-bold uppercase text-slate-300">
                  {l('Objetivo:', 'Goal:')} {formatGoalLabel()}
                </span>
              </div>
              <p className="mt-1 text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                {guidance.tip}
              </p>

              {/* Caminho de Entrada Rápido: Primeira Missão, Programa de Treino e Plano Alimentar */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/quests')}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[#00F0FF]/35 bg-[#00F0FF]/10 px-2.5 py-1 text-[11px] font-bold text-[#00F0FF] hover:bg-[#00F0FF]/20 transition-colors"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                  <span>{l('1ª Missão do Dia', '1st Daily Quest')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/workouts')}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-purple-400/35 bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-200 hover:bg-purple-500/20 transition-colors"
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span>{l('Programa Inicial (Treino A/B/C)', 'Starter Program (Workout A/B/C)')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/nutrition?tab=cardapios')}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/20 transition-colors"
                >
                  <Apple className="h-3.5 w-3.5" />
                  <span>{l('Plano Alimentar', 'Meal Plan')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(guidance.targetPath)}
                  className="inline-flex min-h-[36px] items-center gap-1 text-[11px] font-bold text-white/90 hover:text-[#00F0FF] px-1.5"
                >
                  <span>{guidance.targetLabel}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Orientação breve sobre XP */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
                <Zap className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>
                  {l(
                    'Como funciona o XP: concluir missões, treinos e refeições concede XP imediato, evolui seus 7 atributos e causa dano direto ao Boss Semanal. Todos os módulos permanecem 100% disponíveis.',
                    'How XP works: completing quests, workouts, and meals grants instant XP, upgrades your 7 attributes, and deals direct damage to the Weekly Boss. All modules remain 100% available.'
                  )}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleHunterGuidance(false)}
            aria-label={l('Ocultar Orientação', 'Dismiss Guidance')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </HudCard>
    </motion.div>
  );
}
