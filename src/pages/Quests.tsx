import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Power, 
  CheckCircle2, 
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
  AlertTriangle
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { localDayBounds } from '@/lib/date';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import type { Task } from '@/hooks/useTasks';
import { generateBonusQuest } from '@/lib/groq';
import { NewHabitModal } from '@/components/rpg/NewHabitModal';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { useHunterStore } from '@/stores/useHunterStore';
import { useNavigate } from 'react-router-dom';
import type { Habit, CreateHabitInput, WorkoutMission, MealMission } from '@/hooks/useHabits';
import { calculateNutritionTargets } from '@/lib/nutritionTargets';
import { usePreferences } from '@/contexts/preferences';

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

function TimeBadgeInput({ time, onChange }: { time: string | null; onChange: (t: string | null) => void }) {
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
      defaultValue={time || ''}
      onBlur={(e) => {
        const val = e.target.value || null;
        if (val !== time) {
          onChange(val);
        }
      }}
      onClick={(e) => e.stopPropagation()}
      className={`rounded px-2 py-1 text-xs font-black uppercase tracking-widest outline-none transition-colors cursor-pointer shrink-0 ${
        time 
          ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700/80' 
          : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300 w-[70px]'
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
  onToggle,
  onUpdateTime,
  onDelete,
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
  onToggle: (id: string, type: 'habit'|'workout'|'meal'|'task'|'finance') => void;
  onUpdateTime: (id: string, type: 'habit'|'workout'|'meal'|'task'|'finance', field: 'start'|'end', t: string | null) => void;
  onDelete?: (id: string) => void;
}) {
  const isBonus = type === 'task' && title.startsWith('[BÔNUS IA] ');
  const displayTitle = isBonus ? title.replace('[BÔNUS IA] ', '') : title;
  const bonusLore = isBonus ? localStorage.getItem(`bonus_quest_lore_${id}`) : null;
  const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const missionStatus = done
    ? 'completed'
    : endTime && nowTime > endTime.slice(0, 5)
      ? 'late'
      : startTime && nowTime >= startTime.slice(0, 5) && (!endTime || nowTime <= endTime.slice(0, 5))
        ? 'active'
        : 'pending';
  const statusStyle = {
    pending: 'border-gray-500/20 bg-gray-500/10 text-gray-400',
    active: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]',
    completed: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    late: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  }[missionStatus];
  const statusLabel = { pending: 'Pendente', active: 'Ativa', completed: 'Concluída', late: 'Atrasada' }[missionStatus];

  const theme = {
    habit: { border: 'border-blue-500/30', bgDone: 'bg-blue-500/5', bgHover: 'hover:border-blue-500/50', lineDone: 'bg-blue-500', lineHover: 'group-hover:bg-blue-500/50', icon: Clock, textDone: 'text-blue-500', tag: 'bg-blue-500/20 text-blue-400', tagText: 'COMPLETO' },
    workout: { border: 'border-purple-500/30', bgDone: 'bg-purple-500/5', bgHover: 'hover:border-purple-500/50', lineDone: 'bg-purple-500', lineHover: 'group-hover:bg-purple-500/50', icon: Dumbbell, textDone: 'text-purple-500', tag: 'bg-purple-500/20 text-purple-400', tagText: 'TREINO CONCLUÍDO' },
    meal: { border: 'border-orange-500/30', bgDone: 'bg-orange-500/5', bgHover: 'hover:border-orange-500/50', lineDone: 'bg-orange-500', lineHover: 'group-hover:bg-orange-500/50', icon: UtensilsCrossed, textDone: 'text-orange-500', tag: 'bg-orange-500/20 text-orange-400', tagText: 'REFEIÇÃO FEITA' },
    task: isBonus
      ? { border: 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]', bgDone: 'bg-cyan-500/5', bgHover: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]', lineDone: 'bg-gradient-to-b from-cyan-500 to-purple-500', lineHover: 'group-hover:bg-cyan-400/50', icon: Zap, textDone: 'text-cyan-400', tag: 'bg-cyan-500/20 text-cyan-400', tagText: 'ANOMALIA CONCLUÍDA' }
      : { border: 'border-emerald-500/30', bgDone: 'bg-emerald-500/5', bgHover: 'hover:border-emerald-500/50', lineDone: 'bg-emerald-500', lineHover: 'group-hover:bg-emerald-500/50', icon: ScrollText, textDone: 'text-emerald-500', tag: 'bg-emerald-500/20 text-emerald-400', tagText: 'MISSÃO CONCLUÍDA' },
    finance: { border: 'border-amber-500/30', bgDone: 'bg-amber-500/5', bgHover: 'hover:border-amber-500/50', lineDone: 'bg-amber-500', lineHover: 'group-hover:bg-amber-500/50', icon: Coins, textDone: 'text-amber-500', tag: 'bg-amber-500/20 text-amber-400', tagText: 'FLUXO REGISTRADO' },
  }[type];

  const Icon = theme.icon;

  return (
    <motion.div
      id={`mission-${type}-${id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      whileHover={done ? undefined : { y: -2 }}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 transition-all duration-150 sm:p-4 ${
        done
          ? 'border-[#1E1E26] bg-white/[0.025] opacity-75'
          : `border-[#1E1E26] bg-[#0F0F13] ${theme.bgHover} hover:bg-[#16161D]`
      }`}
    >
      {/* Decorative Line */}
      <div className={`absolute left-0 top-0 h-full w-1 transition-colors ${
        done ? theme.lineDone : `bg-gray-800 ${theme.lineHover}`
      }`} />

      <div className="flex shrink-0 items-center justify-center">
        <NeonCheckbox
          checked={done}
          onChange={() => onToggle(id, type)}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <TimeBadgeInput 
            time={startTime ? startTime.slice(0, 5) : null} 
            onChange={(t) => onUpdateTime(id, type, 'start', t)}
          />
          <span className="text-gray-600 text-xs">-</span>
          <TimeBadgeInput 
            time={endTime ? endTime.slice(0, 5) : null} 
            onChange={(t) => onUpdateTime(id, type, 'end', t)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {isBonus && (
              <span className="rounded bg-gradient-to-r from-cyan-500 to-purple-500 px-2 py-1 text-xs font-bold text-white shadow-[0_0_8px_rgba(6,182,212,0.35)]">
                Bônus IA
              </span>
            )}
            <p
              className={`truncate text-sm font-bold transition-colors sm:text-base ${
                done ? 'text-gray-500' : 'text-white'
              }`}
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {displayTitle}
            </p>
            {isOptional && (
              <span className="rounded border border-dashed border-gray-500/50 bg-gray-500/10 px-2 py-1 text-xs font-semibold text-gray-400">
                Flexível
              </span>
            )}
            <motion.span
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusStyle}`}
            >
              {statusLabel}
            </motion.span>
            {(type === 'workout' || type === 'meal' || type === 'finance') && (
              <span className="rounded-md border border-blue-500/15 bg-blue-500/5 px-2 py-1 text-xs font-semibold text-blue-300">
                Automática
              </span>
            )}
            {type === 'habit' && (
              <span className="rounded-md border border-purple-500/15 bg-purple-500/5 px-2 py-1 text-xs font-semibold text-purple-300">
                Recorrente
              </span>
            )}
          </div>
          {bonusLore && (
            <p className={`text-xs italic leading-relaxed font-semibold transition-colors max-w-xl ${done ? 'text-gray-600 line-through' : 'text-cyan-400/80'}`}>
              "{bonusLore}"
            </p>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-3">
          <span
            className="flex items-center gap-1 text-xs font-semibold"
            style={{ color: categoryColor }}
          >
            <ScrollText size={12} />
            {category}
          </span>
          
          {xpReward > 0 && (
          <span className={`flex items-center gap-1 text-xs font-bold text-yellow-500 ${done ? '' : 'drop-shadow-[0_0_6px_rgba(234,179,8,0.25)]'}`}>
            <Zap size={12} fill="currentColor" />
            +{xpReward} XP
          </span>
          )}

          {statLabel && (
            <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
              <Sword size={12} />
              {statLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {type === 'task' && onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="opacity-0 group-hover:opacity-100 flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-400 transition-all mr-1"
            title="Deletar missão permanente"
          >
            <Trash2 size={14} />
          </button>
        )}
        {done ? (
          <CheckCircle2 size={20} className={theme.textDone} />
        ) : (
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-600 transition-colors group-hover:bg-white/10 group-hover:text-white`}>
            <Icon size={16} />
          </div>
        )}
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
}: {
  habit: Habit;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onUpdateScheduledDays: (id: string, days: number[]) => void;
  onEdit: (habit: Habit) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={`flex flex-col gap-4 rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-5 transition-all duration-150 hover:border-blue-500/25 ${
        habit.active ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-bold text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {habit.title}
            </p>
            {habit.is_optional && (
              <span className="rounded border border-dashed border-gray-500/50 bg-gray-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter text-gray-400">
                FLEXÍVEL
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span style={{ color: habit.category_color }}>{habit.category}</span>
            <span className="text-yellow-500">+{habit.xp_reward} XP</span>
            <span className={`rounded-md border px-2 py-1 ${habit.active ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-gray-500/20 bg-gray-500/10 text-gray-400'}`}>
              {habit.active ? 'Ativa' : 'Inativa'}
            </span>
            <span className="rounded-md border border-blue-500/15 bg-blue-500/5 px-2 py-1 text-blue-300">Recorrente</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(habit)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-gray-400 transition-colors hover:border-blue-500/30 hover:text-blue-300"
            title="Editar quest"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => onToggleActive(habit.id)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              habit.active 
                ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                : 'bg-white/5 text-gray-500 hover:bg-white/10'
            }`}
          >
            <Power size={14} />
          </button>

          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDelete(habit.id)}
                className="rounded-lg bg-red-500/20 px-3 py-1 text-[10px] font-black text-red-400 hover:bg-red-500/30"
              >
                DELETAR
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg bg-white/5 px-3 py-1 text-[10px] font-black text-gray-400 hover:bg-white/10"
              >
                NÃO
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-red-500/10 hover:text-red-400"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Seletor Compacto de Recorrência de Dias */}
      <div className="border-t border-[#1E1E26]/60 pt-3 flex flex-col gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-400">
          <CalendarDays className="size-4 text-blue-400" />
          Recorrência semanal
        </span>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          {[
            { label: 'D', value: 0 },
            { label: 'S', value: 1 },
            { label: 'T', value: 2 },
            { label: 'Q', value: 3 },
            { label: 'Q', value: 4 },
            { label: 'S', value: 5 },
            { label: 'S', value: 6 },
          ].map((day) => {
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
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition-all duration-200 ${
                  isSelected
                    ? 'border-transparent text-white'
                    : 'border-[#38384A]/40 bg-black/40 text-gray-600 hover:border-gray-700'
                }`}
                style={{
                  backgroundColor: isSelected ? habit.category_color : undefined,
                  boxShadow: isSelected ? `0 0 12px ${habit.category_color}35, inset 0 0 8px ${habit.category_color}20` : undefined,
                }}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export function Quests() {
  const { t } = usePreferences();
  const { 
    activeHabits, 
    habits, 
    completedToday, 
    completedCount, 
    totalActive, 
    xpEarnedToday, 
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
  const hunterClass = useHunterStore(s => s.hunterClass);
  const hunterProfile = useHunterStore();
  
  const [tab, setTab] = useState<'daily' | 'manage' | 'codex'>('daily');
  const [modalOpen, setModalOpen] = useState(false);
  const [presetHabitData, setPresetHabitData] = useState<Partial<CreateHabitInput> | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [fissureExpanded, setFissureExpanded] = useState(false);
  const [openCodexCategory, setOpenCodexCategory] = useState('Nutrição');
  const legacyCodexVisible = Boolean(import.meta.env.VITE_SHOW_LEGACY_QUEST_CODEX);
  const legacyMealBannerVisible = Boolean(import.meta.env.VITE_SHOW_LEGACY_MEAL_BANNER);

  const { user } = useAuth();
  const [hasLoggedFinanceToday, setHasLoggedFinanceToday] = useState(false);

  // Estados locais para a Fenda de Anomalia IA
  const [selectedCategory, setSelectedCategory] = useState<string>('Estudo');
  const [generatingBonus, setGeneratingBonus] = useState<boolean>(false);
  const [bonusError, setBonusError] = useState<string | null>(null);

  useEffect(() => {
    async function checkFinanceToday() {
      if (!user?.id) return;
      try {
        const { startIso } = localDayBounds();
        const todayYYYYMMDD = startIso.split('T')[0];
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
  
  // Utilitário resiliente a fuso horário para verificar se uma data UTC pertence ao dia local de hoje
  const isToday = (dateStr: string | null | undefined) => {
    if (!dateStr) return false;
    try {
      return new Date(dateStr).toLocaleDateString('en-CA') === todayStr;
    } catch {
      return false;
    }
  };

  const activeTasks = tasks.filter(t => !t.completed || isToday(t.completed_at));

  const totalMissions = totalActive + workoutMissions.length + mealMissions.length + activeTasks.length + 1;
  const totalCompleted = completedCount + workoutMissions.filter(m => m.isCompleted).length + mealMissions.filter(m => m.isCompleted).length + activeTasks.filter(t => t.completed).length + (hasLoggedFinanceToday ? 1 : 0);
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
  // Busca se já gerou a quest extra diária da IA hoje
  const bonusQuestToday = tasks.find(t => t.title.startsWith('[BÔNUS IA] ') && isToday(t.created_at));

  const handleAwakenBonusQuest = async () => {
    if (generatingBonus || bonusQuestToday) return;
    setGeneratingBonus(true);
    setBonusError(null);
    try {
      // Coleta títulos de hábitos e missões para contexto da IA evitar duplicidade
      const existingTitles = [
        ...workoutMissions.map(m => m.title),
        ...mealMissions.map(m => m.title),
        ...activeHabits.map(h => h.title)
      ];

      const result = await generateBonusQuest(selectedCategory, existingTitles, hunterClass || 'Warrior');

      const categoryColors: Record<string, string> = {
        Treino: '#A855F7',
        Cardio: '#EF4444',
        Estudo: '#3B82F6',
        Trabalho: '#06B6D4',
        Saúde: '#10B981',
        Hobbies: '#EC4899'
      };

      const categoryStats: Record<string, 'strength' | 'endurance' | 'intelligence' | 'discipline' | 'vitality'> = {
        Treino: 'strength',
        Cardio: 'endurance',
        Estudo: 'intelligence',
        Trabalho: 'discipline',
        Saúde: 'vitality',
        Hobbies: 'vitality'
      };

      const res = await createTask({
        title: `[BÔNUS IA] ${result.title}`,
        category: `Bônus ${selectedCategory}`,
        category_color: categoryColors[selectedCategory] || '#F97316',
        xp_reward: 30,
        stat_target: categoryStats[selectedCategory] || null,
        stat_reward: 2
      });

      if (res && res.data) {
        // Armazena a lore gerada no localStorage indexada pelo ID
        localStorage.setItem(`bonus_quest_lore_${res.data.id}`, result.lore);
        setFissureExpanded(true);
      } else if (res && res.error) {
        setBonusError(res.error);
      }
    } catch (err: unknown) {
      console.error("Falha ao despertar fenda de anomalia:", err);
      setBonusError(err instanceof Error ? err.message : 'Falha na conexão neural com o Groq.');
    } finally {
      setGeneratingBonus(false);
    }
  };

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
    ...workoutMissions.map(m => ({ type: 'workout' as const, data: m, time: m.scheduled_time, endTime: m.scheduled_end_time })),
    ...mealMissions.map(m => ({ type: 'meal' as const, data: m, time: m.scheduled_time, endTime: m.scheduled_end_time })),
    ...activeHabits.map(h => ({ type: 'habit' as const, data: h, time: h.scheduled_time ? h.scheduled_time.slice(0, 5) : null, endTime: h.scheduled_end_time ? h.scheduled_end_time.slice(0, 5) : null })),
    ...activeTasks.map(t => ({ type: 'task' as const, data: t, time: null, endTime: null })),
    {
      type: 'finance' as const,
      data: {
        id: 'daily-finance-quest',
        title: 'Registrar Operações Financeiras do Dia',
        category: 'FINANÇAS',
        category_color: '#f59e0b',
        xp_reward: 10,
        completed: hasLoggedFinanceToday
      },
      time: null,
      endTime: null
    }
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
  const nextMission = allMissions.find(mission => !missionIsDone(mission)) || null;
  const nextMissionTitle = nextMission
    ? (nextMission.type === 'task' ? nextMission.data.title.replace('[BÔNUS IA] ', '') : nextMission.data.title)
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
  const nextMissionStatTarget = nextMission && 'stat_target' in nextMission.data
    ? nextMission.data.stat_target
    : null;
  const nextMissionStat = nextMissionStatTarget
    ? statAbbreviations[nextMissionStatTarget]
    : null;
  const accumulatedXp = xpEarnedToday + activeTasks.filter(t => t.completed).reduce((acc, t) => acc + t.xp_reward, 0);

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
    document.getElementById(`mission-${nextMission.type}-${nextMission.data.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <>
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
          return createHabit(input);
        }}
        initialData={presetHabitData}
      />

      <div className="mx-auto max-w-6xl space-y-7">
        {(habitsError || tasksError) && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs font-semibold text-rose-200">
            <span className="font-black uppercase tracking-widest text-rose-400">Falha na sincronizacao: </span>
            {habitsError || tasksError}
          </div>
        )}
        {/* System Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">
                Quest Management System
              </span>
            </div>
            <h1
              className="text-4xl font-black italic uppercase tracking-tighter text-white"
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {t('pages.quests')}
            </h1>
          </div>
          
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black uppercase italic tracking-widest text-white transition-all duration-150 ease-out hover:bg-blue-500 hover:scale-102 active:scale-98 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] cursor-pointer"
          >
            <Plus size={18} strokeWidth={3} />
            Nova Quest
          </button>
        </div>

        {/* Global Progress */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0F0F13] p-5 shadow-[0_0_26px_rgba(59,130,246,0.07)] sm:p-6">
          {/* Background Decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
          
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-sm font-bold text-gray-300">
                <ShieldCheck size={14} className="text-blue-500" />
                Status de Hoje
              </h3>
              <p className="text-2xl font-black tracking-tight text-white sm:text-3xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {totalCompleted} de {totalMissions} missões concluídas
              </p>
              <p className="text-sm text-gray-400">
                {progressPct === 100
                  ? 'Sistema sincronizado. Todas as quests do ciclo foram concluídas.'
                  : `${Math.round(progressPct)}% da missão diária. O Sistema aguarda sua próxima ação.`}
              </p>
            </div>
            
            <div className="rounded-2xl border border-yellow-500/15 bg-yellow-500/5 px-5 py-4 sm:text-right">
              <p className="text-sm font-semibold text-gray-400">XP acumulado hoje</p>
              <p className="mt-1 text-2xl font-black text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.22)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                +{accumulatedXp} XP
              </p>
            </div>
          </div>

          <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-black/50 p-0.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'circOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-purple-500/25 bg-[#0F0F13] p-5 shadow-[0_0_24px_rgba(168,85,247,0.07)] sm:p-6">
          <div className="absolute right-0 top-0 h-full w-72 bg-gradient-to-l from-purple-500/10 to-transparent" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-purple-500/25 bg-purple-500/10 text-purple-300">
                <Play className="size-5" fill="currentColor" />
              </div>
              <div>
                <p className="text-sm font-bold text-purple-300">Próxima missão</p>
                <h2 className="mt-1 text-xl font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {nextMissionTitle || 'Ciclo diário concluído'}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                  {nextMission ? (
                    <>
                      <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-gray-300">
                        {nextMission.time || 'Sem horário'}
                      </span>
                      <span className="rounded-lg border border-white/5 bg-white/5 px-3 py-1.5 text-gray-300">{nextMissionCategory}</span>
                      {nextMissionXp > 0 && <span className="rounded-lg border border-yellow-500/15 bg-yellow-500/5 px-3 py-1.5 font-bold text-yellow-400">+{nextMissionXp} XP</span>}
                      {nextMissionStat && <span className="rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-1.5 font-bold text-blue-300">{nextMissionStat}</span>}
                    </>
                  ) : (
                    <span className="text-gray-400">O Sistema preparará novas quests no próximo ciclo.</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleStartNextMission}
              disabled={!nextMission}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 text-sm font-black text-white transition-all hover:bg-purple-500 hover:shadow-[0_0_22px_rgba(168,85,247,0.28)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Play className="size-4" fill="currentColor" />
              Iniciar missão
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid grid-cols-1 gap-2 rounded-2xl border border-[#1E1E26] bg-[#0B0B0F] p-2 sm:grid-cols-3">
          {[
            { id: 'daily', label: 'Missões Diárias', icon: Sword },
            { id: 'manage', label: 'Quests Recorrentes', icon: RefreshCw },
            { id: 'codex', label: 'Códex do Caçador', icon: ScrollText },
          ].map((t) => {
            const TabIcon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as typeof tab)}
                className={`group relative flex min-h-16 items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                  isActive
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-200 shadow-[0_0_22px_rgba(59,130,246,0.12)]'
                    : 'border-transparent bg-white/[0.025] text-gray-500 hover:border-white/10 hover:bg-white/[0.045] hover:text-gray-200'
                }`}
              >
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
                  isActive
                    ? 'border-blue-400/25 bg-blue-500/15 text-blue-300 shadow-[0_0_14px_rgba(59,130,246,0.16)]'
                    : 'border-white/5 bg-black/20 text-gray-600 group-hover:border-white/10 group-hover:text-gray-400'
                }`}>
                  <TabIcon className="size-5" strokeWidth={2.2} />
                </span>
                <span className="text-sm font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>{t.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="quest-tab-active"
                    className="absolute inset-x-4 bottom-0 h-px rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.75)]"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-[#0F0F13] border border-[#1E1E26]/50" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {tab === 'daily' ? (
                <motion.div
                  key="daily-list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {(mealMissions.length > 0 || nutritionTargets.targetCalories) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                        caloriesExceeded
                          ? 'border-2 border-red-500 bg-red-500/15 shadow-[0_0_24px_rgba(239,68,68,0.2)]'
                          : 'border-orange-500/30 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.08)]'
                      }`}
                    >
                      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl" />
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                          {caloriesExceeded ? <AlertTriangle size={20} className="text-red-400" /> : <UtensilsCrossed size={20} className="animate-pulse" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-white tracking-[0.15em] font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Meta Calorica do Dia
                          </h4>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {caloriesExceeded
                              ? `ATENÇÃO: limite excedido em ${Math.round(calorieExcess)} kcal. Consumido: ${Math.round(caloriesLoggedToday)} kcal.`
                              : nutritionTargets.targetCalories
                              ? `Objetivo: ${nutritionTargets.goalLabel}. Alvo de ${nutritionTargets.targetCalories} kcal com tolerancia diaria.`
                              : `Faltam no perfil: ${nutritionTargets.missingFields.join(', ') || 'dados fisicos'}.`}
                          </p>
                        </div>
                      </div>
                      <div className="relative flex items-center gap-3 bg-black/40 border border-[#1E1E26] rounded-xl px-4 py-2 shrink-0 justify-between sm:w-auto w-full">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Calorias:</span>
                        <span className="text-xs font-black text-orange-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {nutritionTargets.targetCalories
                            ? `${Math.round(caloriesLoggedToday)} / ${nutritionTargets.targetCalories}`
                            : `${Math.round(caloriesLoggedToday)} / --`}
                        </span>
                        {caloriesExceeded ? (
                          <span className="rounded-lg border border-red-500/50 bg-red-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-300">
                            EXCEDIDO
                          </span>
                        ) : nutritionTargets.targetCalories && Math.abs(caloriesLoggedToday - nutritionTargets.targetCalories) <= (nutritionTargets.toleranceCalories ?? 0) ? (
                          <span className="text-[9px] font-black uppercase tracking-widest text-green-400 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.15)]">NO ALVO</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">PENDENTE</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {/* BANNER DO PROTOCOLO DE NUTRIÇÃO CONSOLIDADA */}
                  {legacyMealBannerVisible && mealMissions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden rounded-2xl border border-orange-500/30 bg-orange-500/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-[0_0_20px_rgba(249,115,22,0.08)]"
                    >
                      {/* Efeito Glow Laranja Cyberpunk */}
                      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-orange-500/10 blur-2xl" />
                      
                      <div className="relative flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                          <UtensilsCrossed size={20} className="animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase text-white tracking-[0.15em] font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Protocolo de Nutrição Consolidada
                          </h4>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            Conclua todas as refeições do dia para receber <span className="text-yellow-500 font-black">+50 XP</span> e <span className="text-orange-400 font-black">+2 Vitalidade</span>.
                          </p>
                        </div>
                      </div>
                      
                      <div className="relative flex items-center gap-3 bg-black/40 border border-[#1E1E26] rounded-xl px-4 py-2 shrink-0 justify-between sm:w-auto w-full">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Refeições:</span>
                        <span className="text-xs font-black text-orange-500 font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          {mealMissions.filter(m => m.isCompleted).length} <span className="text-gray-600">/</span> {mealMissions.length}
                        </span>
                        {mealMissions.filter(m => m.isCompleted).length === mealMissions.length ? (
                          <span className="text-[9px] font-black uppercase tracking-widest text-green-400 border border-green-500/30 bg-green-500/10 px-2 py-0.5 rounded-lg shadow-[0_0_10px_rgba(34,197,94,0.15)]">ATIVADO</span>
                        ) : (
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">PENDENTE</span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* FENDA DE ANOMALIA DA IA (WIDGET PREMIUM) */}
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0F0F13] p-4 shadow-[0_0_20px_rgba(6,182,212,0.05)]">
                    {/* Glowing effect inside the card */}
                    <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 blur-3xl animate-pulse" />
                    <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/5 blur-3xl" />

                    <div className="relative flex flex-col gap-4">
                      {/* Header da Fenda */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0">
                            <Zap size={20} className="animate-pulse" />
                          </div>
                          <div>
                            <h2 className="flex items-center gap-2 text-base font-black uppercase text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              Fenda de Anomalia <span className="text-cyan-400">IA</span>
                            </h2>
                            <p className="text-xs font-medium text-gray-500">
                              Gere uma quest bônus diária focada em um domínio.
                            </p>
                          </div>
                        </div>

                        {/* Status do Portal */}
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                            bonusQuestToday 
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${bonusQuestToday ? 'bg-purple-400' : 'bg-cyan-400 animate-ping'}`} />
                            {bonusQuestToday ? 'Portal Fechado' : 'Fenda Aberta'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFissureExpanded(current => !current)}
                            className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:text-white"
                            aria-label={fissureExpanded ? 'Recolher Fenda IA' : 'Expandir Fenda IA'}
                          >
                            <ChevronDown className={`size-4 transition-transform ${fissureExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {/* Conteúdo dinâmico da Fenda */}
                      <AnimatePresence initial={false}>
                      {fissureExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                      {bonusQuestToday ? (
                        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 block mb-1">
                                Anomalia Detectada Hoje:
                              </span>
                              <h4 className="text-base font-black text-white uppercase tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                {bonusQuestToday.title.replace('[BÔNUS IA] ', '')}
                              </h4>
                            </div>
                            <span className={`rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
                              bonusQuestToday.completed 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                                : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 animate-pulse'
                            }`}>
                              {bonusQuestToday.completed ? 'COMPLETADA' : 'EM EXECUÇÃO'}
                            </span>
                          </div>

                          {/* Exibição da lore */}
                          {localStorage.getItem(`bonus_quest_lore_${bonusQuestToday.id}`) && (
                            <p className="text-xs italic text-gray-400 leading-relaxed bg-black/35 p-3 rounded-lg border border-white/5 font-medium">
                              "{localStorage.getItem(`bonus_quest_lore_${bonusQuestToday.id}`)}"
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1 text-yellow-500">
                              <Zap size={12} fill="currentColor" />
                              +{bonusQuestToday.xp_reward} XP
                            </span>
                            {bonusQuestToday.stat_target && (
                              <span className="flex items-center gap-1 text-blue-400">
                                <Sword size={12} />
                                +{bonusQuestToday.stat_reward} {
                                  bonusQuestToday.stat_target === 'strength' ? 'FORÇA' :
                                  bonusQuestToday.stat_target === 'intelligence' ? 'INTELIGÊNCIA' :
                                  bonusQuestToday.stat_target === 'endurance' ? 'RESISTÊNCIA' :
                                  bonusQuestToday.stat_target === 'discipline' ? 'DISCIPLINA' : 'VITALIDADE'
                                }
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[9px] font-bold uppercase tracking-widest text-purple-400/70 pt-1">
                            ⚠️ Apenas uma anomalia pode ser invocada por ciclo solar. Retorne amanhã.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-gray-400 leading-relaxed max-w-xl">
                            Escolha um dos seus focos de evolução abaixo para recalibrar o Sistema. O Llama IA gerará uma missão bônus temporária única de altíssimo rendimento para a sua rotina de hoje.
                          </p>

                          {/* Chips de Categoria Premium */}
                          <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
                            {[
                              { label: 'Treino', color: '#A855F7', icon: Dumbbell, shadow: 'rgba(168,85,247,0.4)' },
                              { label: 'Cardio', color: '#EF4444', icon: Heart, shadow: 'rgba(239,68,68,0.4)' },
                              { label: 'Estudo', color: '#3B82F6', icon: BookOpen, shadow: 'rgba(59,130,246,0.4)' },
                              { label: 'Trabalho', color: '#06B6D4', icon: Briefcase, shadow: 'rgba(6,182,212,0.4)' },
                              { label: 'Saúde', color: '#10B981', icon: ShieldCheck, shadow: 'rgba(16,185,129,0.4)' },
                              { label: 'Hobbies', color: '#EC4899', icon: Music, shadow: 'rgba(236,72,153,0.4)' }
                            ].map((cat) => {
                              const CatIcon = cat.icon;
                              const isSelected = selectedCategory === cat.label;
                              return (
                                <button
                                  key={cat.label}
                                  onClick={() => setSelectedCategory(cat.label)}
                                  className="flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-300 relative overflow-hidden w-full"
                                  style={{
                                    borderColor: isSelected ? cat.color : '#1E1E26',
                                    backgroundColor: isSelected ? `${cat.color}0D` : '#0F0F13',
                                    color: isSelected ? '#FFFFFF' : '#888899',
                                    boxShadow: isSelected ? `0 0 12px ${cat.shadow}` : 'none'
                                  }}
                                >
                                  {isSelected && (
                                    <span 
                                      className="absolute left-0 top-0 h-full w-1" 
                                      style={{ backgroundColor: cat.color }} 
                                    />
                                  )}
                                  <CatIcon size={13} style={{ color: isSelected ? cat.color : '#555566' }} className="shrink-0" />
                                  <span>{cat.label}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Botão de Despertar com Loading */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                            <button
                              onClick={handleAwakenBonusQuest}
                              disabled={generatingBonus}
                              className={`flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 px-6 py-3.5 text-xs font-black uppercase italic tracking-widest text-white transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                                !generatingBonus ? 'hover:scale-102 active:scale-98 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]' : ''
                              }`}
                            >
                              {generatingBonus ? (
                                <>
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  <span>CALIBRANDO MATRIX...</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={14} fill="currentColor" />
                                  <span>Despertar Quest Extra</span>
                                </>
                              )}
                            </button>
                            
                            {bonusError && (
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                ⚠️ Erro: {bonusError}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* LISTAGEM DE MISSÕES DIÁRIAS */}
                  {allMissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="mb-4 rounded-full bg-blue-500/5 p-8">
                        <ScrollText size={64} className="text-gray-800" />
                      </div>
                      <h3 className="text-lg font-bold text-white uppercase italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                        Nenhuma Quest Ativa
                      </h3>
                      <p className="mt-2 max-w-xs text-sm text-gray-500 uppercase tracking-widest">
                        O sistema não detectou missões. Defina seus objetivos para começar.
                      </p>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="mt-6 text-[11px] font-black uppercase tracking-widest text-blue-500 hover:underline"
                      >
                        + INICIAR SEQUÊNCIA DE MISSÕES
                      </button>
                    </div>
                  ) : (
                    <>
                      {allMissions.map((mission) => {
                        if (mission.type === 'workout') {
                          const m = mission.data;
                          return (
                            <MissionCard
                              key={`workout-${m.id}`}
                              id={m.routine_id}
                              type="workout"
                              title={m.title}
                              category="TREINO"
                              categoryColor="#A855F7" // purple-500
                              xpReward={m.xp_reward || 50}
                              statLabel={m.stat_target ? `+${m.stat_reward} ${m.stat_target === 'strength' ? 'FORÇA' : 'RESISTÊNCIA'}` : undefined}
                              done={m.isCompleted}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={() => navigate('/workouts')}
                              onUpdateTime={handleUpdateTime}
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
                              onToggle={() => navigate('/fortuna')}
                              onUpdateTime={handleUpdateTime}
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
                              categoryColor="#F97316" // orange-500
                              xpReward={0}
                              statLabel={undefined}
                              done={m.isCompleted}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={(id) => toggleMealMission(id)}
                              onUpdateTime={handleUpdateTime}
                            />
                          );
                        } else if (mission.type === 'task') {
                          const t = mission.data;
                          const statLabels: Record<string, string> = {
                            strength: 'FORÇA',
                            endurance: 'RESISTÊNCIA',
                            intelligence: 'INTELIGÊNCIA',
                            discipline: 'DISCIPLINA',
                            vitality: 'VITALIDADE'
                          };
                          const label = t.stat_target ? `+${t.stat_reward} ${statLabels[t.stat_target] || t.stat_target.toUpperCase()}` : undefined;

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
                              statLabel={h.stat_target ? `+${h.stat_reward} ${h.stat_target}` : undefined}
                              isOptional={h.is_optional}
                              done={completedToday.has(h.id)}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={(id) => toggleCompletion(id)}
                              onUpdateTime={handleUpdateTime}
                            />
                          );
                        }
                      })}
                    </>
                  )}
                </motion.div>
              ) : tab === 'manage' ? (
                <motion.div
                  key="manage-list"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {habits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <p className="text-sm text-gray-500 uppercase tracking-widest italic">
                        Banco de dados vazio.
                      </p>
                    </div>
                  ) : (
                    habits.map((h) => (
                      <ManageQuestRow
                        key={h.id}
                        habit={h}
                        onDelete={deleteHabit}
                        onToggleActive={toggleActive}
                        onUpdateScheduledDays={updateScheduledDays}
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
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="relative w-full overflow-hidden rounded-3xl border border-blue-500/25 bg-[#101016] p-6 shadow-[0_0_26px_rgba(59,130,246,0.07)] sm:p-8">
                    <div className="absolute right-0 top-0 h-full w-80 bg-gradient-to-l from-blue-500/10 to-transparent" />
                    <div className="absolute inset-x-12 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-400/35 to-transparent" />
                    
                    <div className="relative flex flex-col gap-5 md:flex-row md:items-start">
                      <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-blue-500/25 bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.16)]">
                        <ScrollText className="size-8" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl font-black uppercase text-white sm:text-2xl" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                          Diretrizes do Códex
                        </h2>
                        <p className="mt-1 text-sm font-semibold text-blue-300">
                          Protocolo de calibração dos atributos do Caçador
                        </p>
                        <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-[15px]">
                          O Códex define como cada hábito, missão e atividade diária impacta sua evolução.
                          Cada ação concluída recalibra seus atributos, fortalece seus domínios e registra progresso no Sistema.
                          Mantenha a disciplina ativa para desbloquear novos títulos, recompensas e níveis de Caçador.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {CODEX_CATEGORIES.map(group => {
                      const GroupIcon = group.icon;
                      const isOpen = openCodexCategory === group.category;
                      return (
                        <div key={group.category} className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] transition-colors hover:border-blue-500/20">
                          <button
                            type="button"
                            onClick={() => setOpenCodexCategory(isOpen ? '' : group.category)}
                            className="flex w-full items-center gap-4 p-5 text-left"
                            aria-expanded={isOpen}
                          >
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-white/5" style={{ color: group.color }}>
                              <GroupIcon className="size-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-base font-black text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>{group.category}</span>
                              <span className="mt-1 block text-sm text-gray-500">{group.entries.length} {group.entries.length === 1 ? 'diretriz disponível' : 'diretrizes disponíveis'}</span>
                            </span>
                            <ChevronDown className={`size-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="grid gap-3 border-t border-[#1E1E26] p-4 lg:grid-cols-2">
                                  {group.entries.map(entry => {
                                    const EntryIcon = entry.icon;
                                    return (
                                      <div key={entry.activity} className="rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-white/10 hover:bg-white/[0.035]">
                                        <div className="flex items-start gap-3">
                                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/5" style={{ color: entry.iconColor }}>
                                            <EntryIcon className="size-4" />
                                          </span>
                                          <div className="min-w-0">
                                            <h3 className="text-sm font-bold text-white">{entry.activity}</h3>
                                            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{entry.lore}</p>
                                          </div>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                                          <span className={`rounded-lg border border-white/5 bg-white/5 px-2.5 py-1.5 ${entry.statColor}`}>{entry.stat}</span>
                                          <span className="rounded-lg border border-blue-500/15 bg-blue-500/5 px-2.5 py-1.5 text-blue-300">{entry.statBonus}</span>
                                          <span className="rounded-lg border border-yellow-500/15 bg-yellow-500/5 px-2.5 py-1.5 text-yellow-400">{entry.xp}</span>
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
                                          className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 text-sm font-bold text-blue-300 transition-all hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
                                        >
                                          {entry.route ? <Sword className="size-4" /> : <Plus className="size-4" />}
                                          {entry.route ? 'Abrir módulo' : 'Criar quest'}
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {legacyCodexVisible && (
                  <div className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13]">
                    {/* ── Visualização em Tabela para Desktop (Oculta no mobile) ── */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1E1E26] bg-white/5">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Atividade / Hábito</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Atributo RPG</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Recompensa</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden lg:table-cell">Efeito Lore</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400 w-[160px]">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1E1E26]">
                          {[
                            {
                              activity: 'Refeições Saudáveis',
                              icon: UtensilsCrossed,
                              iconColor: '#F97316',
                              stat: 'Vitalidade (VIT)',
                              statColor: 'text-orange-400',
                              xp: '+15 XP',
                              lore: 'Acelera a regeneração celular e a imunidade biológica.',
                              statBonus: '+1 VIT',
                              isModule: true,
                              route: '/nutrition'
                            },
                            {
                              activity: 'Treino de Força',
                              icon: Dumbbell,
                              iconColor: '#A855F7',
                              stat: 'Força (FOR)',
                              statColor: 'text-red-400',
                              xp: '+30 XP',
                              lore: 'Eleva o dano físico bruto e a densidade miofibrilar.',
                              statBonus: '+2 FOR',
                              isModule: true,
                              route: '/workouts'
                            },
                            {
                              activity: 'Cardio',
                              icon: Heart,
                              iconColor: '#EF4444',
                              stat: 'Resistência (RES)',
                              statColor: 'text-green-400',
                              xp: '+25 XP',
                              lore: 'Otimiza o fluxo de oxigênio e a capacidade cardiovascular.',
                              statBonus: '+2 RES',
                              isModule: true,
                              route: '/workouts'
                            },
                            {
                              activity: 'Trabalhar (Foco Diário)',
                              icon: Briefcase,
                              iconColor: '#06B6D4',
                              stat: 'Disciplina (DIS)',
                              statColor: 'text-purple-400',
                              xp: '+25 XP',
                              lore: 'Fortalece a constância profissional e a entrega sob pressão.',
                              statBonus: '+1 DIS',
                              isModule: false,
                              preset: {
                                title: 'Trabalhar (Foco Máximo)',
                                category: 'Trabalho',
                                category_color: '#06B6D4',
                                xp_reward: 25,
                                stat_target: 'discipline' as const,
                                stat_reward: 1
                              }
                            },
                            {
                              activity: 'Trabalho Extra / Freelance',
                              icon: Briefcase,
                              iconColor: '#FBBF24',
                              stat: 'Disciplina (DIS)',
                              statColor: 'text-purple-400',
                              xp: '+40 XP',
                              lore: 'Esforço adicional que eleva sua autonomia financeira e resiliência.',
                              statBonus: '+2 DIS',
                              isModule: false,
                              preset: {
                                title: 'Trabalho Extra / Freelance',
                                category: 'Trabalho',
                                category_color: '#FBBF24',
                                xp_reward: 40,
                                stat_target: 'discipline' as const,
                                stat_reward: 2
                              }
                            },
                            {
                              activity: 'Aprender Idiomas',
                              icon: Languages,
                              iconColor: '#3B82F6',
                              stat: 'Inteligência (INT)',
                              statColor: 'text-cyan-400',
                              xp: '+25 XP',
                              lore: 'Quebra barreiras linguísticas e expande a plasticidade cerebral.',
                              statBonus: '+2 INT',
                              isModule: false,
                              preset: {
                                title: 'Estudar Novo Idioma',
                                category: 'Estudo',
                                category_color: '#3B82F6',
                                xp_reward: 25,
                                stat_target: 'intelligence' as const,
                                stat_reward: 2
                              }
                            },
                            {
                              activity: 'Leitura',
                              icon: BookOpen,
                              iconColor: '#3B82F6',
                              stat: 'Inteligência (INT)',
                              statColor: 'text-cyan-400',
                              xp: '+25 XP',
                              lore: 'Amplia a capacidade cognitiva e a velocidade de foco.',
                              statBonus: '+2 INT',
                              isModule: false,
                              preset: {
                                title: 'Ler 30 minutos',
                                category: 'Estudo',
                                category_color: '#3B82F6',
                                xp_reward: 25,
                                stat_target: 'intelligence' as const,
                                stat_reward: 2
                              }
                            },
                            {
                              activity: 'Programação & Tech',
                              icon: Code,
                              iconColor: '#10B981',
                              stat: 'Inteligência (INT)',
                              statColor: 'text-cyan-400',
                              xp: '+30 XP',
                              lore: 'Fortalece o raciocínio sistêmico e solução de problemas.',
                              statBonus: '+2 INT',
                              isModule: false,
                              preset: {
                                title: 'Programação & Tech',
                                category: 'Estudo',
                                category_color: '#10B981',
                                xp_reward: 30,
                                stat_target: 'intelligence' as const,
                                stat_reward: 2
                              }
                            },
                            {
                              activity: 'Tocar Instrumentos',
                              icon: Music,
                              iconColor: '#EC4899',
                              stat: 'Vitalidade (VIT)',
                              statColor: 'text-orange-400',
                              xp: '+20 XP',
                              lore: 'Expressão artística e reequilíbrio da harmonia mental do caçador.',
                              statBonus: '+2 VIT',
                              isModule: false,
                              preset: {
                                title: 'Tocar Instrumento / Música',
                                category: 'Hobbies',
                                category_color: '#EC4899',
                                xp_reward: 20,
                                stat_target: 'vitality' as const,
                                stat_reward: 2
                              }
                            },
                            {
                              activity: 'Deveres Gerais (Tasks)',
                              icon: Award,
                              iconColor: '#F59E0B',
                              stat: 'Disciplina (DIS)',
                              statColor: 'text-purple-400',
                              xp: '+15 a +30 XP',
                              lore: 'Reforça a constância diária e a fortitude mental.',
                              statBonus: '+1 DIS',
                              isModule: false,
                              preset: {
                                title: 'Deveres Gerais',
                                category: 'Rotina',
                                category_color: '#F59E0B',
                                xp_reward: 15,
                                stat_target: 'discipline' as const,
                                stat_reward: 1
                              }
                            }
                          ].map((row, idx) => {
                            const RowIcon = row.icon;
                            return (
                              <tr key={idx} className="group hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 transition-colors group-hover:bg-white/10" style={{ color: row.iconColor }}>
                                      <RowIcon size={16} />
                                    </div>
                                    <span className="font-bold text-white uppercase text-xs tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                      {row.activity}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className={`text-xs font-bold uppercase tracking-wider ${row.statColor}`}>
                                      {row.stat}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                                      {row.statBonus}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-1 text-xs font-bold text-yellow-500 uppercase tracking-widest border border-yellow-500/20">
                                    <Zap size={10} fill="currentColor" />
                                    {row.xp}
                                  </span>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                  <span className="text-xs text-gray-400 font-medium">
                                    {row.lore}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {row.isModule ? (
                                    <button
                                      onClick={() => navigate(row.route!)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-400 transition-all duration-150 ease-out hover:border-blue-500/60 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                                    >
                                      <span>Ir para Módulo</span>
                                      <Sword size={12} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        setPresetHabitData(row.preset!);
                                        setModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 transition-all duration-150 ease-out hover:border-emerald-500/60 hover:text-white hover:scale-105 active:scale-95 cursor-pointer"
                                    >
                                      <span>Despertar Quest</span>
                                      <Plus size={12} strokeWidth={3} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* ── Visualização em Cards para Mobile (Exclusiva no celular) ── */}
                    <div className="block md:hidden p-4 space-y-4">
                      {[
                        {
                          activity: 'Refeições Saudáveis',
                          icon: UtensilsCrossed,
                          iconColor: '#F97316',
                          stat: 'Vitalidade (VIT)',
                          statColor: 'text-orange-400',
                          xp: '+15 XP',
                          lore: 'Acelera a regeneração celular e a imunidade biológica.',
                          statBonus: '+1 VIT',
                          isModule: true,
                          route: '/nutrition'
                        },
                        {
                          activity: 'Treino de Força',
                          icon: Dumbbell,
                          iconColor: '#A855F7',
                          stat: 'Força (FOR)',
                          statColor: 'text-red-400',
                          xp: '+30 XP',
                          lore: 'Eleva o dano físico bruto e a densidade miofibrilar.',
                          statBonus: '+2 FOR',
                          isModule: true,
                          route: '/workouts'
                        },
                        {
                          activity: 'Cardio',
                          icon: Heart,
                          iconColor: '#EF4444',
                          stat: 'Resistência (RES)',
                          statColor: 'text-green-400',
                          xp: '+25 XP',
                          lore: 'Otimiza o fluxo de oxigênio e a capacidade cardiovascular.',
                          statBonus: '+2 RES',
                          isModule: true,
                          route: '/workouts'
                        },
                        {
                          activity: 'Trabalhar (Foco Diário)',
                          icon: Briefcase,
                          iconColor: '#06B6D4',
                          stat: 'Disciplina (DIS)',
                          statColor: 'text-purple-400',
                          xp: '+25 XP',
                          lore: 'Fortalece a constância profissional e a entrega sob pressão.',
                          statBonus: '+1 DIS',
                          isModule: false,
                          preset: {
                            title: 'Trabalhar (Foco Máximo)',
                            category: 'Trabalho',
                            category_color: '#06B6D4',
                            xp_reward: 25,
                            stat_target: 'discipline' as const,
                            stat_reward: 1
                          }
                        },
                        {
                          activity: 'Trabalho Extra / Freelance',
                          icon: Briefcase,
                          iconColor: '#FBBF24',
                          stat: 'Disciplina (DIS)',
                          statColor: 'text-purple-400',
                          xp: '+40 XP',
                          lore: 'Esforço adicional que eleva sua autonomia financeira e resiliência.',
                          statBonus: '+2 DIS',
                          isModule: false,
                          preset: {
                            title: 'Trabalho Extra / Freelance',
                            category: 'Trabalho',
                            category_color: '#FBBF24',
                            xp_reward: 40,
                            stat_target: 'discipline' as const,
                            stat_reward: 2
                          }
                        },
                        {
                          activity: 'Aprender Idiomas',
                          icon: Languages,
                          iconColor: '#3B82F6',
                          stat: 'Inteligência (INT)',
                          statColor: 'text-cyan-400',
                          xp: '+25 XP',
                          lore: 'Quebra barreiras linguísticas e expande a plasticidade cerebral.',
                          statBonus: '+2 INT',
                          isModule: false,
                          preset: {
                            title: 'Estudar Novo Idioma',
                            category: 'Estudo',
                            category_color: '#3B82F6',
                            xp_reward: 25,
                            stat_target: 'intelligence' as const,
                            stat_reward: 2
                          }
                        },
                        {
                          activity: 'Leitura',
                          icon: BookOpen,
                          iconColor: '#3B82F6',
                          stat: 'Inteligência (INT)',
                          statColor: 'text-cyan-400',
                          xp: '+25 XP',
                          lore: 'Amplia a capacidade cognitiva e a velocidade de foco.',
                          statBonus: '+2 INT',
                          isModule: false,
                          preset: {
                            title: 'Ler 30 minutos',
                            category: 'Estudo',
                            category_color: '#3B82F6',
                            xp_reward: 25,
                            stat_target: 'intelligence' as const,
                            stat_reward: 2
                          }
                        },
                        {
                          activity: 'Programação & Tech',
                          icon: Code,
                          iconColor: '#10B981',
                          stat: 'Inteligência (INT)',
                          statColor: 'text-cyan-400',
                          xp: '+30 XP',
                          lore: 'Fortalece o raciocínio sistêmico e solução de problemas.',
                          statBonus: '+2 INT',
                          isModule: false,
                          preset: {
                            title: 'Programação & Tech',
                            category: 'Estudo',
                            category_color: '#10B981',
                            xp_reward: 30,
                            stat_target: 'intelligence' as const,
                            stat_reward: 2
                          }
                        },
                        {
                          activity: 'Tocar Instrumentos',
                          icon: Music,
                          iconColor: '#EC4899',
                          stat: 'Vitalidade (VIT)',
                          statColor: 'text-orange-400',
                          xp: '+20 XP',
                          lore: 'Expressão artística e reequilíbrio da harmonia mental do caçador.',
                          statBonus: '+2 VIT',
                          isModule: false,
                          preset: {
                            title: 'Tocar Instrumento / Música',
                            category: 'Hobbies',
                            category_color: '#EC4899',
                            xp_reward: 20,
                            stat_target: 'vitality' as const,
                            stat_reward: 2
                          }
                        },
                        {
                          activity: 'Deveres Gerais (Tasks)',
                          icon: Award,
                          iconColor: '#F59E0B',
                          stat: 'Disciplina (DIS)',
                          statColor: 'text-purple-400',
                          xp: '+15 a +30 XP',
                          lore: 'Reforça a constância diária e a fortitude mental.',
                          statBonus: '+1 DIS',
                          isModule: false,
                          preset: {
                            title: 'Deveres Gerais',
                            category: 'Rotina',
                            category_color: '#F59E0B',
                            xp_reward: 15,
                            stat_target: 'discipline' as const,
                            stat_reward: 1
                          }
                        }
                      ].map((row, idx) => {
                        const RowIcon = row.icon;
                        return (
                          <div 
                            key={idx} 
                            className="group relative flex flex-col gap-3 rounded-xl border border-[#1E1E26]/60 bg-[#0B0B0F]/45 p-4 transition-all hover:border-blue-500/20"
                          >
                            {/* Cabeçalho do Card */}
                            <div className="flex items-center gap-3">
                              <div 
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 transition-colors" 
                                style={{ color: row.iconColor }}
                              >
                                <RowIcon size={16} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-white uppercase text-xs tracking-wider font-orbitron block truncate" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                                  {row.activity}
                                </span>
                                <span className="text-[10px] text-gray-500 font-semibold block mt-0.5 leading-normal">
                                  {row.lore}
                                </span>
                              </div>
                            </div>

                            {/* Informações Centrais (Atributo e Recompensa) */}
                            <div className="grid grid-cols-2 gap-3 border-t border-b border-[#1E1E26]/40 py-2.5 my-1">
                              <div>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Atributo RPG</span>
                                <span className={`text-[11px] font-black uppercase tracking-wider block mt-0.5 ${row.statColor}`}>
                                  {row.stat}
                                </span>
                                <span className="text-[9px] text-gray-600 font-bold uppercase tracking-wider block">
                                  {row.statBonus}
                                </span>
                              </div>
                              <div>
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest block">Recompensa</span>
                                <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-500 uppercase tracking-widest border border-yellow-500/20 mt-1">
                                  <Zap size={10} fill="currentColor" />
                                  {row.xp}
                                </span>
                              </div>
                            </div>

                            {/* Botão de Ação */}
                            <div className="w-full mt-1">
                              {row.isModule ? (
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => navigate(row.route!)}
                                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                                >
                                  <span>Ir para Módulo</span>
                                  <Sword size={12} />
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => {
                                    setPresetHabitData(row.preset!);
                                    setModalOpen(true);
                                  }}
                                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 py-2.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                >
                                  <span>Despertar Quest</span>
                                  <Plus size={12} strokeWidth={3} />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
