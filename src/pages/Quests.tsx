import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  RefreshCw, 
  Star, 
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
  Languages
} from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { useMealPlans } from '@/hooks/useMealPlans';
import { useTasks } from '@/hooks/useTasks';
import { generateBonusQuest } from '@/lib/groq';
import { NewHabitModal } from '@/components/rpg/NewHabitModal';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { useHunterStore } from '@/stores/useHunterStore';
import { useNavigate } from 'react-router-dom';
import type { Habit, CreateHabitInput } from '@/hooks/useHabits';

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
      style={{ colorScheme: 'dark' }}
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
  index,
}: {
  id: string;
  type: 'habit' | 'workout' | 'meal' | 'task';
  title: string;
  category: string;
  categoryColor: string;
  xpReward: number;
  statLabel?: string | React.ReactNode;
  isOptional?: boolean;
  done: boolean;
  startTime: string | null;
  endTime: string | null;
  onToggle: (id: string, type: 'habit'|'workout'|'meal'|'task') => void;
  onUpdateTime: (id: string, type: 'habit'|'workout'|'meal'|'task', field: 'start'|'end', t: string | null) => void;
  onDelete?: (id: string) => void;
  index: number;
}) {
  const isBonus = type === 'task' && title.startsWith('[BÔNUS IA] ');
  const displayTitle = isBonus ? title.replace('[BÔNUS IA] ', '') : title;
  const bonusLore = isBonus ? localStorage.getItem(`bonus_quest_lore_${id}`) : null;

  const theme = {
    habit: { border: 'border-blue-500/30', bgDone: 'bg-blue-500/5', bgHover: 'hover:border-blue-500/50', lineDone: 'bg-blue-500', lineHover: 'group-hover:bg-blue-500/50', icon: Clock, textDone: 'text-blue-500', tag: 'bg-blue-500/20 text-blue-400', tagText: 'COMPLETO' },
    workout: { border: 'border-purple-500/30', bgDone: 'bg-purple-500/5', bgHover: 'hover:border-purple-500/50', lineDone: 'bg-purple-500', lineHover: 'group-hover:bg-purple-500/50', icon: Dumbbell, textDone: 'text-purple-500', tag: 'bg-purple-500/20 text-purple-400', tagText: 'TREINO CONCLUÍDO' },
    meal: { border: 'border-orange-500/30', bgDone: 'bg-orange-500/5', bgHover: 'hover:border-orange-500/50', lineDone: 'bg-orange-500', lineHover: 'group-hover:bg-orange-500/50', icon: UtensilsCrossed, textDone: 'text-orange-500', tag: 'bg-orange-500/20 text-orange-400', tagText: 'REFEIÇÃO FEITA' },
    task: isBonus
      ? { border: 'border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.1)]', bgDone: 'bg-cyan-500/5', bgHover: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]', lineDone: 'bg-gradient-to-b from-cyan-500 to-purple-500', lineHover: 'group-hover:bg-cyan-400/50', icon: Zap, textDone: 'text-cyan-400', tag: 'bg-cyan-500/20 text-cyan-400', tagText: 'ANOMALIA CONCLUÍDA' }
      : { border: 'border-emerald-500/30', bgDone: 'bg-emerald-500/5', bgHover: 'hover:border-emerald-500/50', lineDone: 'bg-emerald-500', lineHover: 'group-hover:bg-emerald-500/50', icon: ScrollText, textDone: 'text-emerald-500', tag: 'bg-emerald-500/20 text-emerald-400', tagText: 'MISSÃO CONCLUÍDA' },
  }[type];

  const Icon = theme.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`group relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 transition-all ${
        done
          ? `${theme.border} ${theme.bgDone}`
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
        <div className="flex items-center gap-2 mb-1.5 shrink-0">
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
              <span className="rounded bg-gradient-to-r from-cyan-500 to-purple-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter text-white animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                ANOMALIA IA
              </span>
            )}
            <p
              className={`truncate text-base font-bold tracking-wide transition-colors ${
                done ? 'text-gray-500 line-through' : 'text-white'
              }`}
              style={{ fontFamily: 'Orbitron, sans-serif' }}
            >
              {displayTitle}
            </p>
            {isOptional && (
              <span className="rounded border border-dashed border-gray-500/50 bg-gray-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter text-gray-400">
                FLEXÍVEL
              </span>
            )}
            {done && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter ${theme.tag}`}
              >
                {theme.tagText}
              </motion.span>
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
            className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest"
            style={{ color: categoryColor }}
          >
            <ScrollText size={12} />
            {category}
          </span>
          
          <span className="flex items-center gap-1 text-[11px] font-bold text-yellow-500">
            <Zap size={12} fill="currentColor" />
            +{xpReward} XP
          </span>

          {statLabel && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-400 uppercase italic">
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
  index,
}: {
  habit: Habit;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
  onUpdateScheduledDays: (id: string, days: number[]) => void;
  index: number;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col gap-3 rounded-xl border border-[#1E1E26] bg-[#0F0F13] p-4 transition-opacity ${
        habit.active ? 'opacity-100' : 'opacity-40'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {habit.title}
            </p>
            {habit.is_optional && (
              <span className="rounded border border-dashed border-gray-500/50 bg-gray-500/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-tighter text-gray-400">
                FLEXÍVEL
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
            <span style={{ color: habit.category_color }}>{habit.category}</span>
            <span>{habit.xp_reward} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          Recorrência Semanal:
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
                className={`flex h-6 w-6 items-center justify-center rounded-lg border text-[9px] font-black transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'border-transparent text-white'
                    : 'border-[#38384A]/30 bg-black/40 text-[#444455] hover:border-gray-800'
                }`}
                style={{
                  backgroundColor: isSelected ? habit.category_color : undefined,
                  boxShadow: isSelected ? `0 0 6px ${habit.category_color}30` : undefined,
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
  const { 
    activeHabits, 
    habits, 
    completedToday, 
    completedCount, 
    totalActive, 
    xpEarnedToday, 
    loading, 
    toggleCompletion, 
    createHabit, 
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
    loading: loadingTasks,
  } = useTasks();

  const handleUpdateTime = async (
    id: string,
    type: 'habit' | 'workout' | 'meal' | 'task',
    field: 'start' | 'end',
    time: string | null
  ) => {
    if (type !== 'task') {
      await updateScheduledTime(id, type, field, time);
    }
  };

  const navigate = useNavigate();
  const hunterClass = useHunterStore(s => s.hunterClass);
  
  const [tab, setTab] = useState<'daily' | 'manage' | 'codex'>('daily');
  const [modalOpen, setModalOpen] = useState(false);
  const [presetHabitData, setPresetHabitData] = useState<Partial<CreateHabitInput> | null>(null);

  // Estados locais para a Fenda de Anomalia IA
  const [selectedCategory, setSelectedCategory] = useState<string>('Estudo');
  const [generatingBonus, setGeneratingBonus] = useState<boolean>(false);
  const [bonusError, setBonusError] = useState<string | null>(null);

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

  const totalMissions = totalActive + workoutMissions.length + mealMissions.length + activeTasks.length;
  const totalCompleted = completedCount + workoutMissions.filter(m => m.isCompleted).length + mealMissions.filter(m => m.isCompleted).length + activeTasks.filter(t => t.completed).length;
  const progressPct = totalMissions > 0 ? (totalCompleted / totalMissions) * 100 : 0;

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
      } else if (res && res.error) {
        setBonusError(res.error);
      }
    } catch (err: any) {
      console.error("Falha ao despertar fenda de anomalia:", err);
      setBonusError(err.message || 'Falha na conexão neural com o Groq.');
    } finally {
      setGeneratingBonus(false);
    }
  };

  type UnifiedMission = 
    | { type: 'workout'; data: any; time: string | null; endTime: string | null }
    | { type: 'meal'; data: any; time: string | null; endTime: string | null }
    | { type: 'habit'; data: any; time: string | null; endTime: string | null }
    | { type: 'task'; data: any; time: string | null; endTime: string | null };

  const allMissions: UnifiedMission[] = [
    ...workoutMissions.map(m => ({ type: 'workout' as const, data: m, time: m.scheduled_time, endTime: m.scheduled_end_time })),
    ...mealMissions.map(m => ({ type: 'meal' as const, data: m, time: m.scheduled_time, endTime: m.scheduled_end_time })),
    ...activeHabits.map(h => ({ type: 'habit' as const, data: h, time: h.scheduled_time ? h.scheduled_time.slice(0, 5) : null, endTime: h.scheduled_end_time ? h.scheduled_end_time.slice(0, 5) : null })),
    ...activeTasks.map(t => ({ type: 'task' as const, data: t, time: null, endTime: null }))
  ];

  allMissions.sort((a, b) => {
    if (!a.time && !b.time) return 0;
    if (!a.time) return 1;
    if (!b.time) return -1;
    return a.time.localeCompare(b.time);
  });

  return (
    <>
      <NewHabitModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setPresetHabitData(null);
        }}
        onSubmit={createHabit}
        initialData={presetHabitData}
      />

      <div className="mx-auto max-w-4xl space-y-8">
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
              Quadro de <span className="text-blue-500">Missões</span>
            </h1>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black uppercase italic tracking-widest text-white transition-all hover:bg-blue-500"
          >
            <Plus size={18} strokeWidth={3} />
            Nova Quest
          </motion.button>
        </div>

        {/* Global Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13] p-6">
          {/* Background Decoration */}
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
          
          <div className="relative flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <ShieldCheck size={14} className="text-blue-500" />
                Status de Hoje
              </h3>
              <p className="text-2xl font-black italic tracking-tight text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {progressPct === 100 ? 'OBJETIVOS CONCLUÍDOS' : `${Math.round(progressPct)}% DA MISSÃO`}
              </p>
            </div>
            
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-2xl font-black text-blue-500" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span>{totalCompleted}</span>
                <span className="text-xs text-gray-600">/</span>
                <span className="text-gray-400">{totalMissions}</span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
                +{xpEarnedToday + activeTasks.filter(t => t.completed).reduce((acc, t) => acc + t.xp_reward, 0)} XP ACUMULADO
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

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-[#1E1E26] pb-px overflow-x-auto scrollbar-none flex-nowrap shrink-0">
          {[
            { id: 'daily', label: 'MISSÕES DIÁRIAS', icon: Sword },
            { id: 'manage', label: 'LISTA DE SISTEMA', icon: RefreshCw },
            { id: 'codex', label: 'CODEX DO CAÇADOR', icon: ScrollText },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`relative flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                tab === t.id ? 'text-blue-500' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {tab === t.id && (
                <motion.div
                  layoutId="tab-active"
                  className="absolute bottom-0 left-0 h-1 w-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                />
              )}
            </button>
          ))}
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
                  {/* FENDA DE ANOMALIA DA IA (WIDGET PREMIUM) */}
                  <div className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0F0F13] p-6 shadow-[0_0_25px_rgba(6,182,212,0.05)]">
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
                            <h2 className="text-lg font-black uppercase italic text-white tracking-wider flex items-center gap-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              Fenda de Anomalia <span className="text-cyan-400">IA</span>
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                              Quest Bônus Diária do Sistema
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
                        </div>
                      </div>

                      {/* Conteúdo dinâmico da Fenda */}
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
                            <motion.button
                              whileHover={!generatingBonus ? { scale: 1.02, boxShadow: '0 0 20px rgba(6,182,212,0.3)' } : {}}
                              whileTap={!generatingBonus ? { scale: 0.98 } : {}}
                              onClick={handleAwakenBonusQuest}
                              disabled={generatingBonus}
                              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 px-6 py-3.5 text-xs font-black uppercase italic tracking-widest text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                            </motion.button>
                            
                            {bonusError && (
                              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                                ⚠️ Erro: {bonusError}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
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
                      {allMissions.map((mission, i) => {
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
                              index={i}
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
                              xpReward={m.xp_reward}
                              statLabel="+1 VITALIDADE"
                              done={m.isCompleted}
                              startTime={mission.time}
                              endTime={mission.endTime}
                              onToggle={(id) => toggleMealMission(id)}
                              onUpdateTime={handleUpdateTime}
                              index={i}
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
                              index={i}
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
                              index={i}
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
                    habits.map((h, i) => (
                      <ManageQuestRow
                        key={h.id}
                        habit={h}
                        onDelete={deleteHabit}
                        onToggleActive={toggleActive}
                        onUpdateScheduledDays={updateScheduledDays}
                        index={i}
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
                  <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-[#0F0F13] p-6 shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blue-500/5 blur-3xl" />
                    
                    <div className="relative space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                          <ScrollText size={20} />
                        </div>
                        <div>
                          <h2 className="text-lg font-black uppercase italic text-white tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            Diretrizes do Codex
                          </h2>
                          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                            Protocolo de Calibração e Atributos de RPG
                          </p>
                        </div>
                      </div>

                      <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">
                        Este Codex define o impacto das suas atividades diárias nos seus atributos e progresso de Caçador. Cada tarefa executada no plano físico recalibra e fortalece sua versão RPG em tempo real. Mantenha a disciplina de caça ativa.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#1E1E26] bg-[#0F0F13]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1E1E26] bg-white/5">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Atividade / Hábito</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Atributo RPG</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Recompensa</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden md:table-cell">Efeito Lore</th>
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
                              xp: '+50 XP',
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
                              xp: '+40 XP',
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
                                <td className="px-6 py-4 hidden md:table-cell">
                                  <span className="text-xs text-gray-400 font-medium">
                                    {row.lore}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {row.isModule ? (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => navigate(row.route!)}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-400 transition-colors hover:border-blue-500/60 hover:text-white"
                                    >
                                      <span>Ir para Módulo</span>
                                      <Sword size={12} />
                                    </motion.button>
                                  ) : (
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => {
                                        setPresetHabitData(row.preset!);
                                        setModalOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400 transition-colors hover:border-emerald-500/60 hover:text-white"
                                    >
                                      <span>Despertar Quest</span>
                                      <Plus size={12} strokeWidth={3} />
                                    </motion.button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
