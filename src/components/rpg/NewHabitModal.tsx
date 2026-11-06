import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Palette, RefreshCw } from 'lucide-react';
import type { CreateHabitInput, Habit } from '@/hooks/useHabits';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { TacticalButton } from '@/components/ui/tactical-button';

const PRESET_COLORS = [
  '#A855F7', '#00F0FF', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#F97316', '#EC4899',
];

const STAT_OPTIONS: { value: Habit['stat_target']; label: string }[] = [
  { value: null,           label: 'Nenhum' },
  { value: 'strength',     label: '⚔️ Força' },
  { value: 'intelligence', label: '🧠 Inteligência' },
  { value: 'endurance',    label: '🛡️ Resistência' },
  { value: 'vitality',     label: '💚 Vitalidade' },
  { value: 'discipline',   label: '🔥 Disciplina' },
  { value: 'wisdom',       label: '📖 Sabedoria' },
  { value: 'balance',      label: '☯️ Equilíbrio' },
];

interface NewHabitModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateHabitInput & { is_one_time?: boolean }) => Promise<{ error: string | null } | void>;
  initialData?: Partial<CreateHabitInput> | null;
  isEditing?: boolean;
}

const DEFAULTS: CreateHabitInput = {
  title: '',
  category: '',
  category_color: '#A855F7',
  xp_reward: 25,
  stat_target: null,
  stat_reward: 1,
  is_optional: false,
  scheduled_days: [0, 1, 2, 3, 4, 5, 6],
};

export function NewHabitModal({ open, onClose, onSubmit, initialData, isEditing = false }: NewHabitModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value: string) => (isEnglish ? translateUiText(value) : value);
  const [form, setForm] = useState<CreateHabitInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOneTime, setIsOneTime] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setIsOneTime(false);
      setForm({
        title: initialData?.title ?? DEFAULTS.title,
        category: initialData?.category ?? DEFAULTS.category,
        category_color: initialData?.category_color ?? DEFAULTS.category_color,
        xp_reward: initialData?.xp_reward ?? DEFAULTS.xp_reward,
        stat_target: initialData?.stat_target !== undefined ? initialData.stat_target : DEFAULTS.stat_target,
        stat_reward: initialData?.stat_reward ?? DEFAULTS.stat_reward,
        is_optional: initialData?.is_optional ?? DEFAULTS.is_optional,
        scheduled_time: initialData?.scheduled_time ?? DEFAULTS.scheduled_time,
        scheduled_end_time: initialData?.scheduled_end_time ?? DEFAULTS.scheduled_end_time,
        scheduled_days: initialData?.scheduled_days ?? DEFAULTS.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6],
      });
    } else {
      setForm(DEFAULTS);
      setError(null);
      setIsOneTime(false);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim()) return;
    setLoading(true);
    setError(null);
    
    const res = await onSubmit({ 
      ...form, 
      title: form.title.trim(), 
      category: form.category.trim(),
      is_one_time: isOneTime
    } as any);
    
    setLoading(false);
    
    if (res && res.error) {
      setError(res.error);
    } else {
      setForm(DEFAULTS);
      onClose();
    }
  };

  const set = <K extends keyof CreateHabitInput>(key: K, value: CreateHabitInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-habit-modal-title"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[101] mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-[#A855F7]/35 bg-[#0E1017] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.75)] sm:inset-x-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-[#A855F7]/30 sm:p-6"
          >
            {/* Mobile Bottom Sheet Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />

            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-[#A855F7]/35 bg-[#A855F7]/12 text-[#A855F7] shadow-[0_0_14px_rgba(168,85,247,0.2)]">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-[#A855F7]">
                    {isEditing ? l('CALIBRAÇÃO DE ROTINA', 'ROUTINE CALIBRATION') : l('PROTOCOLO RECORRENTE', 'RECURRING PROTOCOL')}
                  </span>
                  <h2
                    id="new-habit-modal-title"
                    className="font-orbitron text-base font-black uppercase tracking-wide text-white sm:text-lg"
                  >
                    {isEditing
                      ? l('Editar Hábito Diário', 'Edit Daily Habit')
                      : l('Novo Hábito Diário', 'New Daily Habit')}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={l('Fechar modal', 'Close modal')}
                className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {l('Nome do hábito *', 'Habit name *')}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder={l('Ex: Ler 30 minutos, Treinar, Meditar...', 'Ex: Read 30 minutes, Train, Meditate...')}
                  required
                  className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {l('Categoria *', 'Category *')}
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder={l('Ex: Estudo, Treino, Saúde, Mindset...', 'Ex: Study, Workout, Health, Mindset...')}
                  required
                  className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#A855F7] focus:ring-1 focus:ring-[#A855F7]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  <Palette size={12} className="text-[#A855F7]" />
                  {l('Cor da categoria', 'Category color')}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => set('category_color', color)}
                      className="size-8 rounded-lg transition-transform active:scale-95"
                      style={{
                        background: color,
                        outline: form.category_color === color ? `2px solid ${color}` : 'none',
                        outlineOffset: 2,
                      }}
                    />
                  ))}
                  <input
                    type="color"
                    value={form.category_color}
                    onChange={(e) => set('category_color', e.target.value)}
                    className="size-8 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    title={l('Cor personalizada', 'Custom color')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    {l('XP por dia', 'XP per day')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.xp_reward}
                    onChange={(e) => set('xp_reward', Number(e.target.value))}
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 font-orbitron text-sm font-bold text-[#F59E0B] outline-none transition-colors focus:border-[#F59E0B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    {l('Horário (Opcional)', 'Time (Optional)')}
                  </label>
                  <input
                    type="time"
                    value={form.scheduled_time ?? ''}
                    onChange={(e) => set('scheduled_time', e.target.value || null)}
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#A855F7]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    {l('Stat alvo', 'Target stat')}
                  </label>
                  <select
                    value={form.stat_target ?? ''}
                    onChange={(e) =>
                      set('stat_target', (e.target.value || null) as Habit['stat_target'])
                    }
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#A855F7]"
                  >
                    {STAT_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={o.value ?? ''}>
                        {tx(o.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isOneTime && (
                <div>
                  <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    {l('Dias de Recorrência *', 'Recurrence days *')}
                  </label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {(language === 'en-US' ? [
                      { label: 'S', value: 0 },
                      { label: 'M', value: 1 },
                      { label: 'T', value: 2 },
                      { label: 'W', value: 3 },
                      { label: 'T', value: 4 },
                      { label: 'F', value: 5 },
                      { label: 'S', value: 6 },
                    ] : [
                      { label: 'D', value: 0 },
                      { label: 'S', value: 1 },
                      { label: 'T', value: 2 },
                      { label: 'Q', value: 3 },
                      { label: 'Q', value: 4 },
                      { label: 'S', value: 5 },
                      { label: 'S', value: 6 },
                    ]).map((day) => {
                      const isSelected = form.scheduled_days?.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => {
                            const currentDays = form.scheduled_days ?? [0, 1, 2, 3, 4, 5, 6];
                            const newDays = currentDays.includes(day.value)
                              ? currentDays.filter((d) => d !== day.value)
                              : [...currentDays, day.value].sort();
                            set('scheduled_days', newDays);
                          }}
                          className={`flex min-h-[44px] w-full items-center justify-center rounded-xl border font-orbitron text-xs font-black transition-all duration-200 active:scale-95 ${
                            isSelected
                              ? 'border-transparent text-white shadow-lg'
                              : 'border-white/10 bg-[#07080C] text-slate-500 hover:border-white/25 hover:text-white'
                          }`}
                          style={{
                            backgroundColor: isSelected ? form.category_color : undefined,
                            boxShadow: isSelected ? `0 0 12px ${form.category_color}45` : undefined,
                          }}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!isEditing && (
                <label
                  htmlFor="is_one_time"
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5 transition-colors hover:border-white/20"
                >
                  <input
                    type="checkbox"
                    id="is_one_time"
                    checked={isOneTime}
                    onChange={(e) => setIsOneTime(e.target.checked)}
                    className="size-5 shrink-0 rounded border-white/20 bg-[#07080C] text-[#A855F7] focus:ring-[#A855F7]/30"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-white">
                      {l('Somente uma vez (Missão Única)', 'Only once (One-Time Quest)')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {l('Se ativado, esta quest será criada como uma missão única para hoje.', 'If active, this quest will be created as a one-time mission for today.')}
                    </span>
                  </div>
                </label>
              )}

              <label
                htmlFor="is_optional"
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3.5 transition-colors hover:border-white/20"
              >
                <input
                  type="checkbox"
                  id="is_optional"
                  checked={form.is_optional}
                  onChange={(e) => set('is_optional', e.target.checked)}
                  className="size-5 shrink-0 rounded border-white/20 bg-[#07080C] text-[#A855F7] focus:ring-[#A855F7]/30"
                />
                <div>
                  <span className="block text-sm font-semibold text-white">
                    {l('Missão Flexível / Opcional', 'Flexible / Optional quest')}
                  </span>
                  <span className="text-xs text-slate-400">
                    {l('Se não fizer, não prejudica seu progresso de 100% no dia.', 'If you skip it, it will not hurt your 100% daily progress.')}
                  </span>
                </div>
              </label>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-red-500/30 bg-red-500/5 p-3 text-center shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                >
                  <p className="text-xs font-black uppercase tracking-wider text-red-400">
                    {l('⚠️ Erro de Calibração:', '⚠️ Calibration Error:')} {isEnglish ? translateUiText(error) : error}
                  </p>
                </motion.div>
              )}

              <TacticalButton
                type="submit"
                variant="primary"
                fullWidth
                displayFont
                loading={loading}
                disabled={loading || !form.title.trim() || !form.category.trim()}
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
                className="mt-2"
              >
                {loading 
                  ? l('Salvando...', 'Saving...') 
                  : isEditing
                    ? l('Salvar Alterações', 'Save Changes')
                    : isOneTime 
                      ? l('Criar Missão Única', 'Create One-Time Quest') 
                      : l('Criar Hábito', 'Create Habit')}
              </TacticalButton>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
