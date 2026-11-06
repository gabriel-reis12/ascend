import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Plus,
  RefreshCw,
  Trash2,
  Power,
  Clock,
  Sword,
  Zap,
  ScrollText,
  ShieldCheck,
  UtensilsCrossed,
  Dumbbell,
  BookOpen,
  Code,
  Music,
  Heart,
  Award,
  Briefcase,
  Languages,
  Coins,
  ChevronDown,
  Play,
  Edit3,
  CalendarDays,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDayBounds } from '@/lib/date';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import type { SingleTaskMeta, Task, CreateTaskInput } from '@/hooks/useTasks';

import { NewHabitModal } from '@/components/rpg/NewHabitModal';
import { NewQuestModal } from '@/components/rpg/NewQuestModal';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar, NeonProgressRing } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';
import { useHunterStore } from '@/stores/useHunterStore';
import { DAILY_COMMON_XP_EFFECTIVE_MAX } from '@/lib/progression';
import { useNavigate } from 'react-router-dom';
import type { Habit, CreateHabitInput, WorkoutMission, MealMission } from '@/hooks/useHabits';
import { calculateNutritionTargets } from '@/lib/nutritionTargets';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';

type CodexEntry = {
  activity: string;
  icon: LucideIcon;
  iconColor: string;
  stat: string;
  statColor: string;
  xp: string;
  lore: string;
  statBonus: string;
  route?: string;
  preset?: Partial<CreateHabitInput>;
};

const CODEX_CATEGORIES: Array<{ category: string; icon: LucideIcon; color: string; entries: CodexEntry[] }> = [
  {
    category: 'Nutrição',
    icon: UtensilsCrossed,
    color: '#F97316',
    entries: [
      { activity: 'Refeições Saudáveis', icon: UtensilsCrossed, iconColor: '#F97316', stat: 'Vitalidade (VIT)', statColor: 'text-orange-400', xp: '+15 XP', lore: 'Apoia energia, recuperação e consistência nutricional.', statBonus: '+1 VIT', route: '/nutrition' },
    ],
  },
  {
    category: 'Treino',
    icon: Dumbbell,
    color: '#A855F7',
    entries: [
      { activity: 'Treino de Força', icon: Dumbbell, iconColor: '#A855F7', stat: 'Força (FOR)', statColor: 'text-red-400', xp: '+30 XP', lore: 'Eleva a capacidade física e consolida progressão de cargas.', statBonus: '+2 FOR', route: '/workouts' },
    ],
  },
  {
    category: 'Cardio',
    icon: Heart,
    color: '#EF4444',
    entries: [
      { activity: 'Cardio', icon: Heart, iconColor: '#EF4444', stat: 'Resistência (RES)', statColor: 'text-green-400', xp: '+25 XP', lore: 'Aprimora condicionamento e capacidade de sustentar esforço.', statBonus: '+2 RES', route: '/workouts' },
    ],
  },
  {
    category: 'Trabalho',
    icon: Briefcase,
    color: '#06B6D4',
    entries: [
      { activity: 'Trabalhar (Foco Diário)', icon: Briefcase, iconColor: '#06B6D4', stat: 'Disciplina (DIS)', statColor: 'text-purple-400', xp: '+25 XP', lore: 'Fortalece constância profissional e execução sob pressão.', statBonus: '+1 DIS', preset: { title: 'Trabalhar (Foco Máximo)', category: 'Trabalho', category_color: '#06B6D4', xp_reward: 25, stat_target: 'discipline', stat_reward: 1 } },
      { activity: 'Trabalho Extra / Freelance', icon: Briefcase, iconColor: '#FBBF24', stat: 'Disciplina (DIS)', statColor: 'text-purple-400', xp: '+40 XP', lore: 'Amplia autonomia, entrega e resiliência profissional.', statBonus: '+2 DIS', preset: { title: 'Trabalho Extra / Freelance', category: 'Trabalho', category_color: '#FBBF24', xp_reward: 40, stat_target: 'discipline', stat_reward: 2 } },
    ],
  },
  {
    category: 'Estudo',
    icon: BookOpen,
    color: '#3B82F6',
    entries: [
      { activity: 'Aprender Idiomas', icon: Languages, iconColor: '#3B82F6', stat: 'Inteligência (INT)', statColor: 'text-cyan-400', xp: '+25 XP', lore: 'Expande repertório, memória e adaptação cognitiva.', statBonus: '+2 INT', preset: { title: 'Estudar Novo Idioma', category: 'Estudo', category_color: '#3B82F6', xp_reward: 25, stat_target: 'intelligence', stat_reward: 2 } },
      { activity: 'Leitura', icon: BookOpen, iconColor: '#3B82F6', stat: 'Inteligência (INT)', statColor: 'text-cyan-400', xp: '+25 XP', lore: 'Amplia capacidade cognitiva e profundidade de foco.', statBonus: '+2 INT', preset: { title: 'Ler 30 minutos', category: 'Estudo', category_color: '#3B82F6', xp_reward: 25, stat_target: 'intelligence', stat_reward: 2 } },
      { activity: 'Programação & Tech', icon: Code, iconColor: '#10B981', stat: 'Inteligência (INT)', statColor: 'text-cyan-400', xp: '+30 XP', lore: 'Fortalece raciocínio sistêmico e solução de problemas.', statBonus: '+2 INT', preset: { title: 'Programação & Tech', category: 'Estudo', category_color: '#10B981', xp_reward: 30, stat_target: 'intelligence', stat_reward: 2 } },
    ],
  },
  {
    category: 'Hobbies',
    icon: Music,
    color: '#EC4899',
    entries: [
      { activity: 'Tocar Instrumentos', icon: Music, iconColor: '#EC4899', stat: 'Vitalidade (VIT)', statColor: 'text-orange-400', xp: '+20 XP', lore: 'Promove expressão criativa e equilíbrio mental.', statBonus: '+2 VIT', preset: { title: 'Tocar Instrumento / Música', category: 'Hobbies', category_color: '#EC4899', xp_reward: 20, stat_target: 'vitality', stat_reward: 2 } },
    ],
  },
  {
    category: 'Saúde',
    icon: ShieldCheck,
    color: '#10B981',
    entries: [
      { activity: 'Cuidado Preventivo', icon: ShieldCheck, iconColor: '#10B981', stat: 'Vitalidade (VIT)', statColor: 'text-emerald-400', xp: '+15 XP', lore: 'Reforça manutenção, autocuidado e progresso sustentável.', statBonus: '+1 VIT', preset: { title: 'Cuidado Preventivo', category: 'Saúde', category_color: '#10B981', xp_reward: 15, stat_target: 'vitality', stat_reward: 1 } },
      { activity: 'Deveres Gerais', icon: Award, iconColor: '#F59E0B', stat: 'Disciplina (DIS)', statColor: 'text-purple-400', xp: '+15 a +30 XP', lore: 'Reforça constância diária e fortitude mental.', statBonus: '+1 DIS', preset: { title: 'Deveres Gerais', category: 'Rotina', category_color: '#F59E0B', xp_reward: 15, stat_target: 'discipline', stat_reward: 1 } },
    ],
  },
];

function readSingleQuestMeta(taskId: string): SingleTaskMeta | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`single_quest_meta_${taskId}`);
    return raw ? (JSON.parse(raw) as SingleTaskMeta) : null;
  } catch {
    return null;
  }
}

function formatSingleQuestDate(dateStr?: string) {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

function buildSingleQuestDetails(meta: SingleTaskMeta | null) {
  if (!meta) return null;
  const schedule = [formatSingleQuestDate(meta.due_date), meta.due_time].filter(Boolean).join(' às ');
  const parts = [schedule, meta.note].filter(Boolean);
  return parts.length ? parts.join(' • ') : null;
}

function TimeBadgeInput({
  time,
  onChange,
  ariaLabel,
}: {
  time: string | null;
  onChange: (t: string | null) => void;
  ariaLabel?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current && document.activeElement !== inputRef.current) {
      inputRef.current.value = time || '';
    }
  }, [time]);

  return (
    <input
      ref={inputRef}
      type="time"
      aria-label={ariaLabel}
      defaultValue={time || ''}
      onBlur={(e) => {
        const val = e.target.value || null;
        if (val !== time) {
          onChange(val);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={`min-h-[30px] rounded-lg border px-2 py-0.5 font-orbitron text-[10px] font-bold uppercase tracking-wider outline-none transition-colors cursor-pointer shrink-0 ${time
          ? 'border-white/12 bg-black/50 text-slate-200 hover:border-[#00F0FF]/40'
          : 'border-white/5 bg-white/[0.03] text-slate-500 hover:border-white/15 hover:text-slate-300 w-[68px]'
        }`}
      style={{ colorScheme: 'inherit' }}
    />
  );
}

function MissionCard({
  id,
  type,
  title,
  category,
  categoryColor,
  xpReward,
  statLabel,
  isOptional,
  done,
  startTime,
  endTime,
  partialProgressPct,
  onToggle,
  onUpdateTime,
  onDelete,
  onOpenModule,
  isEnglish,
}: {
  id: string;
  type: 'habit' | 'workout' | 'meal' | 'task' | 'finance';
  title: string;
  category: string;
  categoryColor: string;
  xpReward: number;
  statLabel?: string | React.ReactNode;
  isOptional?: boolean;
  done: boolean;
  startTime: string | null;
  endTime: string | null;
  partialProgressPct?: number | null;
  onToggle: (id: string, type: 'habit' | 'workout' | 'meal' | 'task' | 'finance') => void;
  onUpdateTime: (id: string, type: 'habit' | 'workout' | 'meal' | 'task' | 'finance', field: 'start' | 'end', t: string | null) => void;
  onDelete?: (id: string) => void;
  onOpenModule?: () => void;
  isEnglish: boolean;
}) {
  const prefersReducedMotion = useReducedMotion();
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  const isBonus = type === 'task' && (title.startsWith('[BÔNUS] ') || title.startsWith('[BÔNUS IA] '));
  const displayTitle = isBonus ? title.replace(/^\[BÔNUS( IA)?\]\s*/, '') : title;
  const bonusLore = isBonus ? localStorage.getItem(`bonus_quest_lore_${id}`) : null;
  const singleQuestMeta = type === 'task' && !isBonus ? readSingleQuestMeta(id) : null;
  const singleQuestDetails = buildSingleQuestDetails(singleQuestMeta);

  const nowTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const hasPartialProgress = typeof partialProgressPct === 'number' && partialProgressPct > 0 && partialProgressPct < 100 && !done;
  const isWithinTimeWindow =
    !done &&
    Boolean(startTime && nowTime >= startTime.slice(0, 5) && (!endTime || nowTime <= endTime.slice(0, 5)));
  const isLate = !done && Boolean(endTime && nowTime > endTime.slice(0, 5));

  const missionStatus: 'completed' | 'active' | 'late' | 'pending' = done
    ? 'completed'
    : hasPartialProgress || isWithinTimeWindow
      ? 'active'
      : isLate
        ? 'late'
        : 'pending';

  const statusConfig = {
    completed: {
      label: l('CONCLUÍDA', 'COMPLETED'),
      headerText: 'text-emerald-400',
      cardSurface: 'border-emerald-500/25 bg-[#0B0E14]/90',
      leftBar: 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]',
    },
    active: {
      label: l('EM ANDAMENTO', 'IN PROGRESS'),
      headerText: 'text-[#00F0FF]',
      cardSurface: 'border-[#00F0FF]/35 bg-[var(--hud-surface)] shadow-[0_0_20px_rgba(0,240,255,0.08)]',
      leftBar: 'bg-gradient-to-b from-[#00F0FF] to-[#A855F7] shadow-[0_0_12px_rgba(0,240,255,0.5)]',
    },
    late: {
      label: l('ATRASADA', 'OVERDUE'),
      headerText: 'text-amber-400',
      cardSurface: 'border-amber-500/30 bg-[var(--hud-surface)]',
      leftBar: 'bg-amber-400',
    },
    pending: {
      label: l('PENDENTE', 'PENDING'),
      headerText: 'text-slate-400',
      cardSurface: 'border-[var(--hud-border)] bg-[var(--hud-surface)] hover:border-[#00F0FF]/30',
      leftBar: 'bg-slate-700 group-hover:bg-[#00F0FF]/60',
    },
  }[missionStatus];

  const Icon: LucideIcon = {
    habit: Clock,
    workout: Dumbbell,
    meal: UtensilsCrossed,
    task: isBonus ? Zap : ScrollText,
    finance: Coins,
  }[type];

  const typeBadgeLabel = {
    habit: l('Recorrente', 'Recurring'),
    workout: l('Treino', 'Workout'),
    meal: l('Nutrição', 'Nutrition'),
    task: l('Missão Única', 'One-Time'),
    finance: l('Finanças', 'Finance'),
  }[type];

  return (
    <motion.div
      id={`mission-${type}-${id}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className={`group relative overflow-hidden rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${statusConfig.cardSurface}`}
    >
      {/* Filete Luminoso Lateral */}
      <div className={`pointer-events-none absolute left-0 top-0 h-full w-1 transition-colors ${statusConfig.leftBar}`} />

      {/* Micro-Cabeçalho Tático (Status à esquerda | Recompensa Dourada à direita) */}
      <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-white/[0.06] pb-2 pl-1.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className={`font-orbitron text-[10px] font-extrabold uppercase tracking-[0.18em] ${statusConfig.headerText}`}>
            {statusConfig.label}
          </span>
          <span className="text-white/15">•</span>
          <span
            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-semibold"
            style={{ color: categoryColor }}
          >
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-none">{category}</span>
          </span>
          <span className="hidden sm:inline-block rounded-md border border-white/8 bg-white/[0.02] px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {typeBadgeLabel}
          </span>
          {isOptional && (
            <span className="rounded-md border border-dashed border-slate-500/40 bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {l('Flexível', 'Flexible')}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {statLabel && (
            <span className="hidden xs:inline-flex items-center gap-1 rounded-md border border-[#00F0FF]/20 bg-[#00F0FF]/8 px-2 py-0.5 font-orbitron text-[10px] font-bold text-[#00F0FF]">
              <Sword className="h-2.5 w-2.5" />
              {statLabel}
            </span>
          )}
          {xpReward > 0 && (
            <span
              className={`inline-flex items-center gap-1 font-orbitron text-[11px] font-extrabold tabular-nums ${done ? 'text-amber-400/70' : 'text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.28)]'
                }`}
            >
              <span className="hidden sm:inline text-[10px] font-semibold text-slate-400 mr-0.5">
                {l('Recompensa:', 'Reward:')}
              </span>
              +{xpReward} XP
            </span>
          )}
        </div>
      </div>

      {/* Corpo Principal do Card */}
      <div className="flex items-center gap-3 pl-1">
        {/* Área de Toque >= 44x44px para o Checkbox */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.02] transition-colors hover:bg-white/[0.05]"
          onClick={(e) => e.stopPropagation()}
        >
          <NeonCheckbox
            checked={done}
            aria-label={displayTitle}
            onChange={() => onToggle(id, type)}
          />
        </div>

        <div className="min-w-0 flex-1">
          <p
            className={`text-sm sm:text-base font-bold leading-snug transition-colors ${done ? 'text-slate-400 line-through decoration-slate-600' : 'text-white'
              }`}
          >
            {displayTitle}
          </p>

          {bonusLore && (
            <p className={`mt-1 text-xs italic leading-relaxed ${done ? 'text-slate-600 line-through' : 'text-cyan-300/80'}`}>
              "{bonusLore}"
            </p>
          )}
          {singleQuestDetails && (
            <p className={`mt-1 text-xs leading-relaxed ${done ? 'text-slate-500' : 'text-cyan-200/85'}`}>
              {singleQuestDetails}
            </p>
          )}

          {/* Barra de Progresso Parcial Real (quando aplicável) */}
          {hasPartialProgress && partialProgressPct !== undefined && partialProgressPct !== null && (
            <div className="mt-2 flex items-center gap-2.5">
              <NeonProgressBar
                value={partialProgressPct}
                max={100}
                variant="xp"
                size="sm"
                className="flex-1"
                ariaLabel={`${displayTitle} progress`}
              />
              <span className="font-orbitron text-[10px] font-bold text-[#00F0FF] tabular-nums">
                {Math.round(partialProgressPct)}%
              </span>
            </div>
          )}

          {/* Linha Compacta de Horário e Atributo Mobile */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {type !== 'task' && type !== 'finance' ? (
              <div className="inline-flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-slate-500" />
                <TimeBadgeInput
                  time={startTime ? startTime.slice(0, 5) : null}
                  ariaLabel={l('Horário inicial', 'Start time')}
                  onChange={(t) => onUpdateTime(id, type, 'start', t)}
                />
                <span className="text-[10px] text-slate-600">–</span>
                <TimeBadgeInput
                  time={endTime ? endTime.slice(0, 5) : null}
                  ariaLabel={l('Horário final', 'End time')}
                  onChange={(t) => onUpdateTime(id, type, 'end', t)}
                />
              </div>
            ) : startTime ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-black/40 px-2 py-0.5 font-orbitron text-[10px] font-bold text-slate-300">
                <Clock className="h-3 w-3 text-[#00F0FF]" />
                {startTime.slice(0, 5)}
              </span>
            ) : null}

            {statLabel && (
              <span className="inline-flex xs:hidden items-center gap-1 rounded-md border border-[#00F0FF]/20 bg-[#00F0FF]/8 px-2 py-0.5 font-orbitron text-[10px] font-bold text-[#00F0FF]">
                <Sword className="h-2.5 w-2.5" />
                {statLabel}
              </span>
            )}
          </div>
        </div>

        {/* Controles Secundários à Direita (44x44px touch target) */}
        <div className="flex shrink-0 items-center gap-1.5">
          {type === 'task' && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(id)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-slate-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
              title={l('Deletar missão permanente', 'Delete quest permanently')}
              aria-label={l('Deletar missão permanente', 'Delete quest permanently')}
            >
              <Trash2 size={16} />
            </button>
          )}
          {onOpenModule && (
            <button
              type="button"
              onClick={onOpenModule}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:border-[#00F0FF]/40 hover:bg-[#00F0FF]/10 hover:text-[#00F0FF]"
              title={l('Abrir módulo', 'Open module')}
              aria-label={l('Abrir módulo', 'Open module')}
            >
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ManageQuestRow({
  habit,
  onDelete,
  onToggleActive,
  onUpdateScheduledDays,
  onEdit,
  isEnglish,
}: {
  habit: Habit;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onUpdateScheduledDays: (id: string, days: number[]) => void;
  onEdit: (habit: Habit) => void;
  isEnglish: boolean;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  return (
    <HudCard
      variant={habit.active ? 'default' : 'default'}
      className={`transition-all duration-150 ${habit.active ? 'opacity-100' : 'opacity-55'}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-orbitron text-sm sm:text-base font-bold text-white">
                {habit.title}
              </p>
              {habit.is_optional && (
                <span className="rounded border border-dashed border-slate-500/50 bg-slate-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {l('FLEXÍVEL', 'FLEXIBLE')}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span
                className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5"
                style={{ color: habit.category_color }}
              >
                {habit.category}
              </span>
              <span className="font-orbitron text-xs font-bold text-[#F59E0B]">
                +{habit.xp_reward} XP
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-orbitron font-bold uppercase ${habit.active
                    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-500/25 bg-slate-500/10 text-slate-400'
                  }`}
              >
                {habit.active ? l('Ativa', 'Active') : l('Inativa', 'Inactive')}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(habit)}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:border-[#00F0FF]/40 hover:text-[#00F0FF]"
              title={l('Editar quest', 'Edit quest')}
              aria-label={l('Editar quest', 'Edit quest')}
            >
              <Edit3 size={16} />
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(habit.id)}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-colors ${habit.active
                  ? 'border-[#00F0FF]/35 bg-[#00F0FF]/12 text-[#00F0FF] hover:bg-[#00F0FF]/20'
                  : 'border-white/10 bg-white/[0.03] text-slate-500 hover:text-white'
                }`}
              title={habit.active ? l('Pausar hábito', 'Pause habit') : l('Ativar hábito', 'Activate habit')}
              aria-label={habit.active ? l('Pausar hábito', 'Pause habit') : l('Ativar hábito', 'Activate habit')}
            >
              <Power size={16} />
            </button>

            {confirmDelete ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onDelete(habit.id)}
                  className="min-h-[44px] rounded-xl border border-red-500/40 bg-red-500/20 px-3 font-orbitron text-[10px] font-black uppercase text-red-300 hover:bg-red-500/30"
                >
                  {l('DELETAR', 'DELETE')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-[44px] rounded-xl border border-white/10 bg-white/5 px-3 font-orbitron text-[10px] font-black uppercase text-slate-400 hover:bg-white/10"
                >
                  {l('NÃO', 'NO')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-transparent text-slate-500 transition-colors hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                title={l('Remover hábito', 'Remove habit')}
                aria-label={l('Remover hábito', 'Remove habit')}
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Seletor Compacto de Recorrência de Dias (44px touch targets) */}
        <div className="border-t border-white/8 pt-3 flex flex-col gap-2">
          <span className="flex items-center gap-2 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            <CalendarDays className="size-3.5 text-[#00F0FF]" />
            {l('Recorrência semanal', 'Weekly recurrence')}
          </span>
          <div className="grid grid-cols-7 gap-1.5">
            {(isEnglish
              ? [
                { label: 'S', value: 0 },
                { label: 'M', value: 1 },
                { label: 'T', value: 2 },
                { label: 'W', value: 3 },
                { label: 'T', value: 4 },
                { label: 'F', value: 5 },
                { label: 'S', value: 6 },
              ]
              : [
                { label: 'D', value: 0 },
                { label: 'S', value: 1 },
                { label: 'T', value: 2 },
                { label: 'Q', value: 3 },
                { label: 'Q', value: 4 },
                { label: 'S', value: 5 },
                { label: 'S', value: 6 },
              ]
            ).map((day) => {
              const isSelected = habit.scheduled_days?.includes(day.value) ?? true;
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => {
                    const currentDays = habit.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6];
                    const newDays = currentDays.includes(day.value)
                      ? currentDays.filter((d) => d !== day.value)
                      : [...currentDays, day.value].sort();
                    onUpdateScheduledDays(habit.id, newDays);
                  }}
                  className={`flex min-h-[44px] w-full items-center justify-center rounded-xl border font-orbitron text-xs font-black transition-all duration-200 active:scale-95 ${isSelected
                      ? 'border-transparent text-white'
                      : 'border-white/10 bg-black/40 text-slate-500 hover:border-white/25 hover:text-white'
                    }`}
                  style={{
                    backgroundColor: isSelected ? habit.category_color : undefined,
                    boxShadow: isSelected ? `0 0 12px ${habit.category_color}35` : undefined,
                  }}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </HudCard>
  );
}

export function Quests() {
  const { language, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value?: string | null) => (isEnglish && value ? translateUiText(value) : value);
  const {
    activeHabits,
    habits,
    completedToday,
    completedCount,
    totalActive,
    loading,
    error: habitsError,
    toggleCompletion,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleActive,
    workoutMissions,
    mealMissions,
    updateScheduledTime,
    updateScheduledDays,
    toggleMealMission,
  } = useHabits();

  const {
    tasks,
    createTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    error: tasksError,
  } = useTasks();

  const handleUpdateTime = async (
    id: string,
    type: 'habit' | 'workout' | 'meal' | 'task' | 'finance',
    field: 'start' | 'end',
    time: string | null
  ) => {
    if (type !== 'task' && type !== 'finance') {
      await updateScheduledTime(id, type, field, time);
    }
  };

  const navigate = useNavigate();
  const hunterProfile = useHunterStore();

  const [tab, setTab] = useState<'daily' | 'manage' | 'codex'>('daily');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'habit' | 'task' | 'workout' | 'meal' | 'finance'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [questModalOpen, setQuestModalOpen] = useState(false);
  const [presetHabitData, setPresetHabitData] = useState<Partial<CreateHabitInput> | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  const [openCodexCategory, setOpenCodexCategory] = useState('Nutrição');
  const legacyCodexVisible = Boolean(import.meta.env.VITE_SHOW_LEGACY_QUEST_CODEX);
  const legacyMealBannerVisible = Boolean(import.meta.env.VITE_SHOW_LEGACY_MEAL_BANNER);

  const { user } = useAuth();
  const [hasLoggedFinanceToday, setHasLoggedFinanceToday] = useState(false);

  useEffect(() => {
    async function checkFinanceToday() {
      if (!user?.id) return;
      try {
        const { startIso } = localDayBounds();
        const todayYYYYMMDD = startIso.split('T')[0];

        const noTxKey = `ascend_finance_no_tx_${user.id}_${todayYYYYMMDD}`;
        if (localStorage.getItem(noTxKey) === 'true') {
          setHasLoggedFinanceToday(true);
          return;
        }

        const { data, error } = await supabase
          .from('financial_logs')
          .select('id')
          .eq('user_id', user.id)
          .eq('date', todayYYYYMMDD);
        if (!error) {
          setHasLoggedFinanceToday((data || []).length > 0);
        }
      } catch (err) {
        console.error('Erro ao verificar logs financeiros em Quests:', err);
      }
    }
    void checkFinanceToday();
  }, [user?.id]);

  const todayStr = new Date().toLocaleDateString('en-CA');

  const isToday = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    try {
      return new Date(dateStr).toLocaleDateString('en-CA') === todayStr;
    } catch {
      return false;
    }
  };

  const activeTasks = tasks.filter((t) => !t.completed || isToday(t.completed_at));

  const totalMissions = totalActive + workoutMissions.length + mealMissions.length + activeTasks.length + 1;
  const totalCompleted =
    completedCount +
    workoutMissions.filter((m) => m.isCompleted).length +
    mealMissions.filter((m) => m.isCompleted).length +
    activeTasks.filter((t) => t.completed).length +
    (hasLoggedFinanceToday ? 1 : 0);
  const progressPct = totalMissions > 0 ? (totalCompleted / totalMissions) * 100 : 0;

  const nutritionTargets = calculateNutritionTargets({
    birthday: hunterProfile.birthday,
    gender: hunterProfile.gender,
    height: hunterProfile.height,
    weightCurrent: hunterProfile.weightCurrent,
    nutritionGoal: hunterProfile.nutritionGoal,
  });
  const caloriesLoggedToday = mealMissions.reduce((sum, meal) => {
    const countsTowardDailyTotal = meal.source === 'food_log' || meal.isCompleted;
    return countsTowardDailyTotal ? sum + (meal.totalKcal || 0) : sum;
  }, 0);
  const caloriesExceeded = nutritionTargets.maxCalories
    ? caloriesLoggedToday > nutritionTargets.maxCalories
    : false;
  const calorieExcess = nutritionTargets.maxCalories
    ? Math.max(0, caloriesLoggedToday - nutritionTargets.maxCalories)
    : 0;
  const calorieProgressPct = nutritionTargets.targetCalories
    ? Math.min(100, Math.round((caloriesLoggedToday / nutritionTargets.targetCalories) * 100))
    : null;

  type FinanceMissionData = {
    id: string;
    title: string;
    category: string;
    category_color: string;
    xp_reward: number;
    completed: boolean;
  };
  type UnifiedMission =
    | { type: 'workout'; data: WorkoutMission; time: string | null; endTime: string | null }
    | { type: 'meal'; data: MealMission; time: string | null; endTime: string | null }
    | { type: 'habit'; data: Habit; time: string | null; endTime: string | null }
    | { type: 'task'; data: Task; time: string | null; endTime: string | null }
    | { type: 'finance'; data: FinanceMissionData; time: string | null; endTime: string | null };

  const allMissions: UnifiedMission[] = [
    ...workoutMissions.map((m) => ({
      type: 'workout' as const,
      data: m,
      time: m.scheduled_time,
      endTime: m.scheduled_end_time,
    })),
    ...mealMissions.map((m) => ({
      type: 'meal' as const,
      data: m,
      time: m.scheduled_time,
      endTime: m.scheduled_end_time,
    })),
    ...activeHabits.map((h) => ({
      type: 'habit' as const,
      data: h,
      time: h.scheduled_time ? h.scheduled_time.slice(0, 5) : null,
      endTime: h.scheduled_end_time ? h.scheduled_end_time.slice(0, 5) : null,
    })),
    ...activeTasks.map((t) => {
      const meta = readSingleQuestMeta(t.id);
      return { type: 'task' as const, data: t, time: meta?.due_time ?? null, endTime: null };
    }),
    {
      type: 'finance' as const,
      data: {
        id: 'daily-finance-quest',
        title: 'Registrar Operações Financeiras do Dia',
        category: 'FINANÇAS',
        category_color: '#f59e0b',
        xp_reward: 10,
        completed: hasLoggedFinanceToday,
      },
      time: null,
      endTime: null,
    },
  ];

  allMissions.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  const missionIsDone = (mission: UnifiedMission) => {
    if (mission.type === 'habit') return completedToday.has(mission.data.id);
    if (mission.type === 'workout' || mission.type === 'meal') return mission.data.isCompleted;
    return mission.data.completed;
  };

  const filteredMissions = allMissions.filter((mission) => {
    const isDone = missionIsDone(mission);
    if (statusFilter === 'pending' && isDone) return false;
    if (statusFilter === 'completed' && !isDone) return false;
    if (typeFilter !== 'all' && mission.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = Math.max(0, totalMissions - totalCompleted);

  const nextMission = allMissions.find((mission) => !missionIsDone(mission)) || null;
  const nextMissionTitle = nextMission
    ? nextMission.type === 'task'
      ? nextMission.data.title.replace(/^\[BÔNUS( IA)?\]\s*/, '')
      : nextMission.data.title
    : null;
  const nextMissionCategory = nextMission
    ? nextMission.type === 'workout'
      ? 'Treino'
      : nextMission.type === 'meal'
        ? 'Nutrição'
        : nextMission.data.category
    : null;
  const nextMissionXp = nextMission?.data.xp_reward || 0;
  const statAbbreviations: Record<string, string> = {
    strength: 'FOR',
    intelligence: 'INT',
    endurance: 'RES',
    vitality: 'VIT',
    discipline: 'DIS',
    wisdom: 'SAB',
    balance: 'EQU',
  };
  const nextMissionStatTarget =
    nextMission && 'stat_target' in nextMission.data ? nextMission.data.stat_target : null;
  const nextMissionStat = nextMissionStatTarget ? statAbbreviations[nextMissionStatTarget] : null;

  function handleStartNextMission() {
    if (!nextMission) return;
    if (nextMission.type === 'workout') {
      navigate('/workouts');
      return;
    }
    if (nextMission.type === 'meal') {
      navigate('/nutrition');
      return;
    }
    if (nextMission.type === 'finance') {
      navigate('/fortuna');
      return;
    }
    document
      .getElementById(`mission-${nextMission.type}-${nextMission.data.id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Detecta se há sessão ativa de treino salva localmente para exibir progresso parcial real
  const hasActiveWorkoutSession =
    typeof window !== 'undefined' && user?.id
      ? Boolean(localStorage.getItem(`ascend_active_workout_${user.id}`))
      : false;

  return (
    <>
      <NewQuestModal
        open={questModalOpen}
        onClose={() => setQuestModalOpen(false)}
        onSubmit={async (input) => {
          await createTask(input);
          setTab('daily');
        }}
      />
      <NewHabitModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPresetHabitData(null);
          setEditingHabitId(null);
        }}
        onSubmit={async (input) => {
          if (editingHabitId) {
            return updateHabit(editingHabitId, input);
          }
          if ((input as any).is_one_time) {
            const taskInput: CreateTaskInput = {
              title: input.title,
              category: input.category,
              category_color: input.category_color,
              xp_reward: input.xp_reward,
              stat_target: input.stat_target,
              stat_reward: input.stat_reward,
              single_meta: {
                kind: 'single',
                due_time: input.scheduled_time || undefined,
              },
            };
            const res = await createTask(taskInput);
            if (res && res.error) {
              return { error: res.error };
            }
            return { error: null };
          }
          return createHabit(input);
        }}
        initialData={presetHabitData}
        isEditing={!!editingHabitId}
      />

      <div className="mx-auto max-w-5xl space-y-5 pb-24">
        {(habitsError || tasksError) && (
          <HudCard variant="crimson" className="p-3.5">
            <p className="text-xs font-semibold text-rose-200">
              <span className="font-orbitron font-black uppercase tracking-widest text-rose-400">
                {l('Falha na sincronização: ', 'Synchronization failure: ')}
              </span>
              {habitsError || tasksError}
            </p>
          </HudCard>
        )}

        {/* ── CABEÇALHO HUD v2 (DAILY QUESTS + RANK & XP BAR) ── */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
                <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.26em] text-[#00F0FF]">
                  {l('Protocolo de Missões', 'Quest Management System')}
                </span>
              </div>
              <h1 className="mt-1 font-orbitron text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                {t('pages.quests')}
              </h1>
            </div>

            {/* Mini-HUD de Rank & XP (Mobile visível no topo direito como na referência) */}
            <div className="flex sm:hidden items-center gap-2.5 rounded-2xl border border-white/10 bg-[var(--hud-surface)] px-3 py-2">
              <RankBadge rank={hunterProfile.rank} size="sm" showLabel={false} />
              <div className="min-w-[88px]">
                <div className="flex items-center justify-between text-[9px] font-orbitron font-bold uppercase tracking-wider text-slate-400">
                  <span>RANK</span>
                  <span className="text-[#00F0FF]">LV.{hunterProfile.level}</span>
                </div>
                <NeonProgressBar
                  value={hunterProfile.xp}
                  max={hunterProfile.xpRequired}
                  variant="xp"
                  size="sm"
                  className="my-1"
                  ariaLabel="Hunter XP"
                />
                <p className="font-orbitron text-[9px] font-bold text-slate-300 tabular-nums">
                  {hunterProfile.xp.toLocaleString()} / {hunterProfile.xpRequired.toLocaleString()} XP
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Mini-HUD + Botões de Criação */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-[var(--hud-surface)] px-3.5 py-2">
              <RankBadge rank={hunterProfile.rank} size="sm" showLabel={false} />
              <div className="w-36">
                <div className="flex items-center justify-between text-[10px] font-orbitron font-bold uppercase tracking-wider text-slate-400">
                  <span>RANK</span>
                  <span className="text-[#00F0FF]">LV. {hunterProfile.level}</span>
                </div>
                <NeonProgressBar
                  value={hunterProfile.xp}
                  max={hunterProfile.xpRequired}
                  variant="xp"
                  size="sm"
                  className="my-1"
                  ariaLabel="Hunter XP"
                />
                <p className="font-orbitron text-[10px] font-bold text-slate-300 tabular-nums">
                  {hunterProfile.xp.toLocaleString()} / {hunterProfile.xpRequired.toLocaleString()} XP
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <TacticalButton
                variant="primary"
                displayFont
                onClick={() => setQuestModalOpen(true)}
                leftIcon={<CalendarDays className="h-4 w-4" />}
                className="px-3.5 text-xs"
              >
                {l('Missão Única', 'One-Time Quest')}
              </TacticalButton>
              <TacticalButton
                variant="secondary"
                accent="purple"
                displayFont
                onClick={() => {
                  setEditingHabitId(null);
                  setPresetHabitData(null);
                  setModalOpen(true);
                }}
                leftIcon={<RefreshCw className="h-4 w-4 text-[#A855F7]" />}
                className="px-3.5 text-xs"
              >
                {l('Quest Recorrente', 'Recurring Quest')}
              </TacticalButton>
            </div>
          </div>
        </header>

        {/* ── PAINEL DE PROGRESSO DIÁRIO (HUDCard + NeonProgressRing) ── */}
        <HudCard variant="cyan" corners className="p-4 sm:p-6">
          <div className="mb-3 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00F0FF]" />
            <h2 className="font-orbitron text-xs sm:text-sm font-extrabold uppercase tracking-[0.22em] text-[#00F0FF]">
              {l('Progresso de Hoje', "Today's Progress")}
            </h2>
          </div>

          <div className="grid grid-cols-3 items-center gap-2 sm:gap-6">
            {/* Coluna Esquerda: Daily Streak */}
            <div className="flex flex-col items-start text-left">
              <span className="font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {l('Sequência Diária:', 'Daily Streak:')}
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <Flame className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="font-orbitron text-base sm:text-2xl font-black text-white tabular-nums">
                  {hunterProfile.streak.current} {l('DIAS', 'DAYS')}
                </span>
              </div>
              <span className="mt-1 text-[10px] font-medium text-slate-400">
                {l('Recorde', 'Best')}: {hunterProfile.streak.best}d
              </span>
            </div>

            {/* Coluna Central: NeonProgressRing perfeitamente centralizado */}
            <div className="flex items-center justify-center">
              <NeonProgressRing
                value={progressPct}
                max={100}
                size={122}
                strokeWidth={8}
                variant="cyan-purple"
                ariaLabel={l('Progresso diário de missões', 'Daily quests progress')}
              >
                <span className="font-orbitron text-lg sm:text-xl font-black leading-none tracking-tight text-white whitespace-nowrap tabular-nums">
                  {totalCompleted} / {totalMissions}
                </span>
                <span className="mt-1.5 font-orbitron text-[11px] font-bold leading-none text-[#00F0FF] whitespace-nowrap tabular-nums">
                  ({Math.round(progressPct)}%)
                </span>
              </NeonProgressRing>
            </div>

            {/* Coluna Direita: XP Acumulado Hoje */}
            <div className="flex flex-col items-end text-right">
              <span className="font-orbitron text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                {l('XP Hoje:', 'Status:')}
              </span>
              <span className="mt-1 font-orbitron text-base sm:text-2xl font-black text-[#F59E0B] drop-shadow-[0_0_8px_rgba(245,158,11,0.25)] tabular-nums">
                +{hunterProfile.xpGainedToday} XP
              </span>
              <span className="mt-1 text-[10px] font-medium text-slate-400 tabular-nums">
                {l('Limite', 'Cap')}: {DAILY_COMMON_XP_EFFECTIVE_MAX} XP
              </span>
            </div>
          </div>

          {/* Faixa Tática Integrada: Próxima Missão em Foco */}
          <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#A855F7]/35 bg-[#A855F7]/12 text-[#A855F7]">
                {nextMission ? <Play className="h-4 w-4" fill="currentColor" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-[#A855F7]">
                    {l('Próxima missão', 'Next quest')}
                  </span>
                  {nextMission && (
                    <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-orbitron text-[9px] font-bold text-slate-300">
                      {nextMission.time || l('Sem horário', 'Anytime')}
                    </span>
                  )}
                  {nextMissionXp > 0 && (
                    <span className="font-orbitron text-[10px] font-bold text-[#F59E0B]">
                      +{nextMissionXp} XP
                    </span>
                  )}
                  {nextMissionStat && (
                    <span className="font-orbitron text-[10px] font-bold text-[#00F0FF]">
                      +{nextMissionStat}
                    </span>
                  )}
                </div>
                <p className="truncate font-orbitron text-xs sm:text-sm font-bold text-white mt-0.5">
                  {nextMissionTitle || l('Ciclo diário concluído', 'Daily cycle complete')}
                </p>
              </div>
            </div>

            {nextMission && (
              <button
                type="button"
                onClick={handleStartNextMission}
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[#A855F7]/40 bg-[#A855F7]/15 px-4 font-orbitron text-xs font-bold uppercase tracking-wider text-purple-200 transition-all hover:bg-[#A855F7]/25 active:scale-[0.985]"
              >
                <Play className="h-3.5 w-3.5" fill="currentColor" />
                {l('Iniciar missão', 'Start quest')}
              </button>
            )}
          </div>
        </HudCard>

        {/* ── NAVEGAÇÃO DE ABAS DO QUADRO DE QUESTS ── */}
        <div
          role="tablist"
          aria-label={l('Seções de Missões', 'Quest Sections')}
          className="grid grid-cols-3 gap-2 rounded-2xl border border-[var(--hud-border)] bg-[#0A0C12] p-1.5"
        >
          {[
            { id: 'daily', label: l('Missões Diárias', 'Daily Quests'), count: totalMissions, icon: Sword },
            { id: 'manage', label: l('Quests Recorrentes', 'Recurring Quests'), count: habits.length, icon: RefreshCw },
            { id: 'codex', label: l('Códex do Caçador', 'Hunter Codex'), count: null, icon: ScrollText },
          ].map((item) => {
            const TabIcon = item.icon;
            const isActive = tab === item.id;
            return (
              <button
                key={item.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setTab(item.id as typeof tab)}
                className={`group relative flex min-h-[48px] items-center justify-center gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-center transition-all duration-200 active:scale-[0.99] ${isActive
                    ? 'border-[#00F0FF]/45 bg-[#00F0FF]/12 text-white shadow-[0_0_18px_rgba(0,240,255,0.12)]'
                    : 'border-transparent bg-white/[0.02] text-slate-400 hover:border-white/10 hover:text-slate-200'
                  }`}
              >
                <TabIcon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#00F0FF]' : 'text-slate-500'}`} />
                <span className="truncate font-orbitron text-[10px] sm:text-xs font-extrabold uppercase tracking-wider">
                  {item.label}
                </span>
                {item.count !== null && (
                  <span
                    className={`hidden md:inline-flex items-center justify-center rounded-full px-1.5 py-0.5 font-orbitron text-[9px] font-bold ${isActive ? 'bg-[#00F0FF]/20 text-[#00F0FF]' : 'bg-white/5 text-slate-400'
                      }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── ÁREA DE CONTEÚDO ── */}
        <div className="min-h-[360px]">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-white/10 bg-[var(--hud-surface)]"
                />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'daily' ? (
                <motion.div
                  key="daily-list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  {/* Barra Compacta de Filtros Rápidos (Status & Categorias) */}
                  <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                    {/* Filtro de Status */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                      <Filter className="mr-1 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      {[
                        { id: 'all', label: l('Todas', 'All'), count: totalMissions },
                        { id: 'pending', label: l('Pendentes', 'Pending'), count: pendingCount },
                        { id: 'completed', label: l('Concluídas', 'Completed'), count: totalCompleted },
                      ].map((f) => {
                        const active = statusFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setStatusFilter(f.id as typeof statusFilter)}
                            className={`inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 font-orbitron text-[10px] font-bold uppercase tracking-wider transition-all ${active
                                ? 'border-[#00F0FF]/45 bg-[#00F0FF]/12 text-[#00F0FF]'
                                : 'border-white/8 bg-[var(--hud-surface)] text-slate-400 hover:border-white/20 hover:text-white'
                              }`}
                          >
                            <span>{f.label}</span>
                            <span className="rounded-md bg-black/40 px-1.5 py-0.5 text-[9px] tabular-nums">
                              {f.count}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Filtro por Tipo de Atividade */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                      {[
                        { id: 'all', label: l('Todos Tipos', 'All Types') },
                        { id: 'habit', label: l('Hábitos', 'Habits') },
                        { id: 'task', label: l('Únicas', 'One-Time') },
                        { id: 'workout', label: l('Treino', 'Workouts') },
                        { id: 'meal', label: l('Nutrição', 'Meals') },
                        { id: 'finance', label: l('Finanças', 'Finance') },
                      ].map((tf) => {
                        const active = typeFilter === tf.id;
                        return (
                          <button
                            key={tf.id}
                            type="button"
                            onClick={() => setTypeFilter(tf.id as typeof typeFilter)}
                            className={`min-h-[36px] shrink-0 rounded-xl border px-2.5 py-1 text-xs font-semibold transition-all ${active
                                ? 'border-[#A855F7]/50 bg-[#A855F7]/15 text-purple-200'
                                : 'border-white/8 bg-white/[0.02] text-slate-400 hover:border-white/15 hover:text-slate-200'
                              }`}
                          >
                            {tf.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Banner Compacto de Meta Calórica do Dia */}
                  {(mealMissions.length > 0 || nutritionTargets.targetCalories) && (
                    <HudCard
                      variant={caloriesExceeded ? 'crimson' : 'gold'}
                      className="p-3.5 sm:p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                            {caloriesExceeded ? (
                              <AlertTriangle size={18} className="text-red-400" />
                            ) : (
                              <UtensilsCrossed size={18} />
                            )}
                          </div>
                          <div>
                            <h4 className="font-orbitron text-xs font-black uppercase tracking-[0.14em] text-white">
                              {l('Meta Calórica do Dia', 'Daily Calorie Target')}
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-400">
                              {caloriesExceeded
                                ? `ATENÇÃO: limite excedido em ${Math.round(calorieExcess)} kcal. Consumido: ${Math.round(caloriesLoggedToday)} kcal.`
                                : nutritionTargets.targetCalories
                                  ? `Objetivo: ${nutritionTargets.goalLabel}. Alvo de ${nutritionTargets.targetCalories} kcal com tolerancia diaria.`
                                  : `Faltam no perfil: ${nutritionTargets.missingFields.join(', ') || 'dados fisicos'}.`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 sm:justify-end">
                          <span className="font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {l('Calorias:', 'Calories:')}
                          </span>
                          <span className="font-orbitron text-xs font-black text-amber-400 tabular-nums">
                            {nutritionTargets.targetCalories
                              ? `${Math.round(caloriesLoggedToday)} / ${nutritionTargets.targetCalories}`
                              : `${Math.round(caloriesLoggedToday)} / --`}
                          </span>
                          {caloriesExceeded ? (
                            <span className="rounded-md border border-red-500/50 bg-red-500/20 px-2 py-0.5 font-orbitron text-[9px] font-black uppercase text-red-300">
                              EXCEDIDO
                            </span>
                          ) : nutritionTargets.targetCalories &&
                            Math.abs(caloriesLoggedToday - nutritionTargets.targetCalories) <=
                            (nutritionTargets.toleranceCalories ?? 0) ? (
                            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-orbitron text-[9px] font-black uppercase text-emerald-400">
                              NO ALVO
                            </span>
                          ) : (
                            <span className="rounded-md bg-white/5 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase text-slate-400">
                              PENDENTE
                            </span>
                          )}
                        </div>
                      </div>
                    </HudCard>
                  )}

                  {legacyMealBannerVisible && mealMissions.length > 0 && (
                    <HudCard variant="gold" className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-orbitron text-xs font-bold uppercase text-white">
                          Protocolo de Nutrição Consolidada
                        </span>
                        <span className="font-orbitron text-xs font-black text-amber-400">
                          {mealMissions.filter((m) => m.isCompleted).length} / {mealMissions.length}
                        </span>
                      </div>
                    </HudCard>
                  )}

                  {/* LISTAGEM DE MISSÕES DIÁRIAS */}
                  {filteredMissions.length === 0 ? (
                    <HudCard variant="default" className="py-12 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-500">
                        <ScrollText size={28} />
                      </div>
                      <h3 className="font-orbitron text-base font-black uppercase text-white">
                        {allMissions.length === 0
                          ? l('Nenhuma Quest Ativa', 'No Active Quests')
                          : l('Nenhuma missão neste filtro', 'No quests match this filter')}
                      </h3>
                      <p className="mx-auto mt-1.5 max-w-xs text-xs text-slate-400">
                        {allMissions.length === 0
                          ? l(
                            'O sistema não detectou missões. Defina seus objetivos para começar.',
                            'The System detected no quests. Define your objectives to begin.'
                          )
                          : l(
                            'Altere o filtro acima ou registre uma nova missão para hoje.',
                            'Change the filter above or create a new quest for today.'
                          )}
                      </p>
                      <div className="mt-5 flex justify-center gap-2.5">
                        {allMissions.length > 0 && (statusFilter !== 'all' || typeFilter !== 'all') ? (
                          <TacticalButton
                            variant="secondary"
                            accent="cyan"
                            displayFont
                            onClick={() => {
                              setStatusFilter('all');
                              setTypeFilter('all');
                            }}
                          >
                            {l('Limpar Filtros', 'Clear Filters')}
                          </TacticalButton>
                        ) : (
                          <TacticalButton
                            variant="primary"
                            displayFont
                            onClick={() => setModalOpen(true)}
                            leftIcon={<Plus size={16} />}
                          >
                            {l('Iniciar Sequência de Missões', 'Start Quest Sequence')}
                          </TacticalButton>
                        )}
                      </div>
                    </HudCard>
                  ) : (
                    <div className="space-y-3">
                      {filteredMissions.map((mission) => {
                        if (mission.type === 'workout') {
                          const m = mission.data;
                          return (
                            <MissionCard
                              key={`workout-${m.id}`}
                              id={m.routine_id}
                              type="workout"
                              title={m.title}
                              category={l('TREINO', 'WORKOUT')}
                              categoryColor="#A855F7"
                              xpReward={m.xp_reward || 50}
                              statLabel={
                                m.stat_target
                                  ? `+${m.stat_reward} ${m.stat_target === 'strength' ? 'FORÇA' : 'RESISTÊNCIA'}`
                                  : undefined
                              }
                              done={m.isCompleted}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              partialProgressPct={!m.isCompleted && hasActiveWorkoutSession ? 50 : null}
                              onToggle={() => navigate('/workouts')}
                              onOpenModule={() => navigate('/workouts')}
                              onUpdateTime={handleUpdateTime}
                              isEnglish={isEnglish}
                            />
                          );
                        } else if (mission.type === 'finance') {
                          const f = mission.data;
                          return (
                            <MissionCard
                              key="daily-finance-quest"
                              id={f.id}
                              type="finance"
                              title={f.title}
                              category={f.category}
                              categoryColor={f.category_color}
                              xpReward={f.xp_reward}
                              statLabel={undefined}
                              done={f.completed}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={async () => {
                                if (!user) return;
                                const { startIso } = localDayBounds();
                                const todayYYYYMMDD = startIso.split('T')[0];
                                const noTxKey = `ascend_finance_no_tx_${user.id}_${todayYYYYMMDD}`;
                                const isCurrentlyNoTx = localStorage.getItem(noTxKey) === 'true';

                                if (isCurrentlyNoTx) {
                                  localStorage.removeItem(noTxKey);
                                  setHasLoggedFinanceToday(false);
                                  const xpKey = `ascend_finance_no_tx_xp_${user.id}_${todayYYYYMMDD}`;
                                  if (localStorage.getItem(xpKey) === 'true') {
                                    await hunterProfile.addXp(-10, user.id, {
                                      eventId: `finance-no-tx:${todayYYYYMMDD}`,
                                    });
                                    localStorage.removeItem(xpKey);
                                  }
                                } else {
                                  const { data } = await supabase
                                    .from('financial_logs')
                                    .select('id')
                                    .eq('user_id', user.id)
                                    .eq('date', todayYYYYMMDD);
                                  if (data && data.length > 0) {
                                    alert(
                                      isEnglish
                                        ? 'You already have transactions registered today!'
                                        : 'Você já possui transações registradas hoje!'
                                    );
                                    return;
                                  }

                                  localStorage.setItem(noTxKey, 'true');
                                  setHasLoggedFinanceToday(true);
                                  const xpKey = `ascend_finance_no_tx_xp_${user.id}_${todayYYYYMMDD}`;
                                  if (localStorage.getItem(xpKey) !== 'true') {
                                    await hunterProfile.addXp(10, user.id, {
                                      eventId: `finance-no-tx:${todayYYYYMMDD}`,
                                    });
                                    localStorage.setItem(xpKey, 'true');
                                  }
                                }
                              }}
                              onOpenModule={() => navigate('/fortuna')}
                              onUpdateTime={handleUpdateTime}
                              isEnglish={isEnglish}
                            />
                          );
                        } else if (mission.type === 'meal') {
                          const m = mission.data;
                          return (
                            <MissionCard
                              key={`meal-${m.id}`}
                              id={m.meal_plan_id}
                              type="meal"
                              title={m.title}
                              category={m.totalKcal > 0 ? `${m.totalKcal} KCAL` : 'ALIMENTAÇÃO'}
                              categoryColor="#F97316"
                              xpReward={m.xp_reward || 0}
                              statLabel={undefined}
                              done={m.isCompleted}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              partialProgressPct={!m.isCompleted ? calorieProgressPct : null}
                              onToggle={(id) => toggleMealMission(id)}
                              onOpenModule={() => navigate('/nutrition')}
                              onUpdateTime={handleUpdateTime}
                              isEnglish={isEnglish}
                            />
                          );
                        } else if (mission.type === 'task') {
                          const t = mission.data;
                          const statLabels: Record<string, string> = {
                            strength: 'FORÇA',
                            endurance: 'RESISTÊNCIA',
                            intelligence: 'INTELIGÊNCIA',
                            discipline: 'DISCIPLINA',
                            vitality: 'VITALIDADE',
                            wisdom: 'SABEDORIA',
                            balance: 'EQUILÍBRIO',
                          };
                          const label = t.stat_target
                            ? `+${t.stat_reward} ${statLabels[t.stat_target] || t.stat_target.toUpperCase()}`
                            : undefined;

                          return (
                            <MissionCard
                              key={`task-${t.id}`}
                              id={t.id}
                              type="task"
                              title={t.title}
                              category={t.category}
                              categoryColor={t.category_color}
                              xpReward={t.xp_reward}
                              statLabel={label}
                              done={t.completed}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={async (id) => {
                                if (t.completed) {
                                  await uncompleteTask(id);
                                } else {
                                  await completeTask(id);
                                }
                              }}
                              onUpdateTime={handleUpdateTime}
                              onDelete={deleteTask}
                              isEnglish={isEnglish}
                            />
                          );
                        } else {
                          const h = mission.data;
                          return (
                            <MissionCard
                              key={`habit-${h.id}`}
                              id={h.id}
                              type="habit"
                              title={h.title}
                              category={h.category}
                              categoryColor={h.category_color}
                              xpReward={h.xp_reward}
                              statLabel={h.stat_target ? `+${h.stat_reward} ${statAbbreviations[h.stat_target] || h.stat_target}` : undefined}
                              isOptional={h.is_optional}
                              done={completedToday.has(h.id)}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={(id) => toggleCompletion(id)}
                              onUpdateTime={handleUpdateTime}
                              isEnglish={isEnglish}
                            />
                          );
                        }
                      })}
                    </div>
                  )}
                </motion.div>
              ) : tab === 'manage' ? (
                <motion.div
                  key="manage-list"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-3"
                >
                  {habits.length === 0 ? (
                    <HudCard variant="default" className="py-14 text-center">
                      <p className="font-orbitron text-xs font-bold uppercase tracking-widest text-slate-400">
                        {l('Banco de dados vazio.', 'No recurring habits configured.')}
                      </p>
                      <div className="mt-4 flex justify-center">
                        <TacticalButton
                          variant="secondary"
                          accent="purple"
                          displayFont
                          onClick={() => setModalOpen(true)}
                          leftIcon={<Plus size={16} />}
                        >
                          {l('Criar Primeiro Hábito', 'Create First Habit')}
                        </TacticalButton>
                      </div>
                    </HudCard>
                  ) : (
                    habits.map((h) => (
                      <ManageQuestRow
                        key={h.id}
                        habit={h}
                        onDelete={deleteHabit}
                        onToggleActive={toggleActive}
                        onUpdateScheduledDays={updateScheduledDays}
                        isEnglish={isEnglish}
                        onEdit={(habit) => {
                          setEditingHabitId(habit.id);
                          setPresetHabitData({
                            title: habit.title,
                            category: habit.category,
                            category_color: habit.category_color,
                            xp_reward: habit.xp_reward,
                            stat_target: habit.stat_target,
                            stat_reward: habit.stat_reward,
                            is_optional: habit.is_optional,
                            scheduled_time: habit.scheduled_time,
                            scheduled_end_time: habit.scheduled_end_time,
                            scheduled_days: habit.scheduled_days ?? [],
                          });
                          setModalOpen(true);
                        }}
                      />
                    ))
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="codex-tab"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-5"
                >
                  <HudCard variant="cyan" corners className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.16)]">
                        <ScrollText className="size-7" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-orbitron text-lg font-black uppercase text-white sm:text-xl">
                          {l('Diretrizes do Códex', 'Codex Guidelines')}
                        </h2>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#00F0FF]">
                          {l('Protocolo de calibração dos atributos do Caçador', 'Hunter attribute calibration protocol')}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-300">
                          {l(
                            'O Códex define como cada hábito, missão e atividade diária impacta sua evolução. Cada ação concluída recalibra seus atributos, fortalece seus domínios e registra progresso no Sistema. Mantenha a disciplina ativa para desbloquear novos títulos, recompensas e níveis de Caçador.',
                            'The Codex defines how each habit, quest, and daily activity impacts your evolution. Every completed action recalibrates your attributes, strengthens your domains, and records progress in the System. Keep discipline active to unlock new Hunter titles, rewards, and levels.'
                          )}
                        </p>
                      </div>
                    </div>
                  </HudCard>

                  <div className="space-y-3">
                    {CODEX_CATEGORIES.map((group) => {
                      const GroupIcon = group.icon;
                      const isOpen = openCodexCategory === group.category;
                      return (
                        <HudCard key={group.category} variant="default" noPadding className="overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenCodexCategory(isOpen ? '' : group.category)}
                            className="flex w-full items-center gap-4 p-4 sm:p-5 text-left transition-colors hover:bg-white/[0.02]"
                            aria-expanded={isOpen}
                          >
                            <span
                              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5"
                              style={{ color: group.color }}
                            >
                              <GroupIcon className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-orbitron text-sm sm:text-base font-black text-white">
                                {tx(group.category)}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-400">
                                {group.entries.length}{' '}
                                {group.entries.length === 1
                                  ? l('diretriz disponível', 'directive available')
                                  : l('diretrizes disponíveis', 'directives available')}
                              </span>
                            </span>
                            <ChevronDown
                              className={`size-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-[#00F0FF]' : ''
                                }`}
                            />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid gap-3 border-t border-white/10 p-4 lg:grid-cols-2">
                                  {group.entries.map((entry) => {
                                    const EntryIcon = entry.icon;
                                    return (
                                      <div
                                        key={entry.activity}
                                        className="rounded-xl border border-white/8 bg-black/30 p-4 transition-colors hover:border-white/15"
                                      >
                                        <div className="flex items-start gap-3">
                                          <span
                                            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5"
                                            style={{ color: entry.iconColor }}
                                          >
                                            <EntryIcon className="size-4" />
                                          </span>
                                          <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-white">{tx(entry.activity)}</h3>
                                            <p className="mt-1 text-xs leading-relaxed text-slate-400">
                                              {tx(entry.lore)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="mt-3.5 flex flex-wrap gap-2 text-xs font-semibold">
                                          <span
                                            className={`rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 ${entry.statColor}`}
                                          >
                                            {tx(entry.stat)}
                                          </span>
                                          <span className="rounded-lg border border-[#00F0FF]/20 bg-[#00F0FF]/8 px-2.5 py-1 font-orbitron text-[11px] text-[#00F0FF]">
                                            {entry.statBonus}
                                          </span>
                                          <span className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 font-orbitron text-[11px] text-[#F59E0B]">
                                            {entry.xp}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (entry.route) {
                                              navigate(entry.route);
                                            } else if (entry.preset) {
                                              setPresetHabitData(entry.preset);
                                              setEditingHabitId(null);
                                              setModalOpen(true);
                                            }
                                          }}
                                          className="mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 px-4 font-orbitron text-xs font-bold uppercase tracking-wider text-[#00F0FF] transition-all hover:bg-[#00F0FF]/20 active:scale-[0.985]"
                                        >
                                          {entry.route ? <Sword className="size-4" /> : <Plus className="size-4" />}
                                          {entry.route
                                            ? l('Abrir módulo', 'Open module')
                                            : l('Criar quest', 'Create quest')}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </HudCard>
                      );
                    })}
                  </div>

                  {legacyCodexVisible && <div className="hidden" />}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* Botão Tático Flutuante na Zona do Polegar Mobile (+ NEW QUEST, inspirado na referência) */}
        <div className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-30 md:hidden">
          <button
            type="button"
            onClick={() => setQuestModalOpen(true)}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl border border-[#00F0FF]/60 bg-[#0A0F18]/95 px-4 py-2.5 font-orbitron text-xs font-extrabold uppercase tracking-wider text-[#00F0FF] shadow-[0_0_24px_rgba(0,240,255,0.32)] backdrop-blur-md transition-transform active:scale-95"
          >
            <Plus className="h-4 w-4 stroke-[2.75]" />
            <span>{l('Nova Quest', 'New Quest')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
