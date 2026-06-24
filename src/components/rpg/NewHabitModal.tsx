import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Palette, RefreshCw } from 'lucide-react';
import type { CreateHabitInput, Habit } from '@/hooks/useHabits';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';

const PRESET_COLORS = [
  '#7C3AED', '#D946EF', '#3B82F6', '#10B981',
  '#FBBF24', '#EF4444', '#F97316', '#06B6D4',
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
  onSubmit: (input: CreateHabitInput) => Promise<{ error: string | null } | void>;
  initialData?: Partial<CreateHabitInput> | null;
}

const DEFAULTS: CreateHabitInput = {
  title: '',
  category: '',
  category_color: '#7C3AED',
  xp_reward: 25,
  stat_target: null,
  stat_reward: 1,
  is_optional: false,
  scheduled_days: [0, 1, 2, 3, 4, 5, 6],
};

export function NewHabitModal({ open, onClose, onSubmit, initialData }: NewHabitModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value: string) => (isEnglish ? translateUiText(value) : value);
  const [form, setForm] = useState<CreateHabitInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
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
      category: form.category.trim() 
    });
    
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
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="fixed inset-x-4 top-1/2 z-[101] mx-auto max-w-md -translate-y-1/2 rounded-2xl border border-[#38384A] bg-[#1C1C24] p-6 shadow-2xl shadow-black/50"
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#7C3AED]/20">
                  <RefreshCw size={15} className="text-[#7C3AED]" />
                </div>
                <h2
                  className="text-lg font-bold text-[#E2E8F0]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {l('Novo Hábito Diário', 'New Daily Habit')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-[#E2E8F0]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  {l('Nome do hábito *', 'Habit name *')}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex: Ler 30 minutos, Treinar, Meditar..."
                  required
                  className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] placeholder-[#94A3B8]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  {l('Categoria *', 'Category *')}
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Ex: Estudo, Treino, Saúde, Mindset..."
                  required
                  className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] placeholder-[#94A3B8]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  <Palette size={12} />
                  {l('Cor da categoria', 'Category color')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => set('category_color', color)}
                      className="size-7 rounded-lg transition-transform hover:scale-110"
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
                    className="size-7 cursor-pointer rounded-lg border-0 bg-transparent p-0"
                    title={l('Cor personalizada', 'Custom color')}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    {l('XP por dia', 'XP per day')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.xp_reward}
                    onChange={(e) => set('xp_reward', Number(e.target.value))}
                    className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#FBBF24] outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
                  />
                </div>

                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    {l('Horário (Opcional)', 'Time (Optional)')}
                  </label>
                  <input
                    type="time"
                    value={form.scheduled_time ?? ''}
                    onChange={(e) => set('scheduled_time', e.target.value || null)}
                    className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
                  />
                </div>

                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    {l('Stat alvo', 'Target stat')}
                  </label>
                  <select
                    value={form.stat_target ?? ''}
                    onChange={(e) =>
                      set('stat_target', (e.target.value || null) as Habit['stat_target'])
                    }
                    className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] outline-none transition-colors focus:border-[#7C3AED]"
                  >
                    {STAT_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={o.value ?? ''}>
                        {tx(o.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  {l('Dias de Recorrência *', 'Recurrence days *')}
                </label>
                <div className="flex justify-between gap-1">
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
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-black transition-all duration-300 ${
                          isSelected
                            ? 'border-transparent text-white shadow-lg'
                            : 'border-[#38384A] bg-[#0F0F13] text-[#555566] hover:border-gray-700 hover:text-[#E2E8F0]'
                        }`}
                        style={{
                          backgroundColor: isSelected ? form.category_color : undefined,
                          boxShadow: isSelected ? `0 0 12px ${form.category_color}40` : undefined,
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[#38384A]/50 bg-black/20 p-4">
                <input
                  type="checkbox"
                  id="is_optional"
                  checked={form.is_optional}
                  onChange={(e) => set('is_optional', e.target.checked)}
                  className="size-5 rounded border-[#38384A] bg-[#0F0F13] text-[#7C3AED] focus:ring-[#7C3AED]/30"
                />
                <div>
                  <label htmlFor="is_optional" className="block text-sm font-medium text-[#E2E8F0]">
                    {l('Missão Flexível / Opcional', 'Flexible / Optional quest')}
                  </label>
                  <p className="text-xs text-[#94A3B8]">
                    {l('Se não fizer, não prejudica seu progresso de 100% no dia.', 'If you skip it, it will not hurt your 100% daily progress.')}
                  </p>
                </div>
              </div>

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

              <motion.button
                type="submit"
                disabled={loading || !form.title.trim() || !form.category.trim()}
                whileTap={{ scale: 0.97 }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7C3AED]/30 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <Plus size={16} />
                )}
                {loading ? l('Criando...', 'Creating...') : l('Criar Hábito', 'Create Habit')}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
