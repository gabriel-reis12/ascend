import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Palette } from 'lucide-react';
import type { CreateTaskInput, Task } from '@/hooks/useTasks';

const PRESET_COLORS = [
  '#7C3AED', '#D946EF', '#3B82F6', '#10B981',
  '#FBBF24', '#EF4444', '#F97316', '#06B6D4',
];

const STAT_OPTIONS: { value: Task['stat_target']; label: string }[] = [
  { value: null,          label: 'Nenhum' },
  { value: 'strength',    label: '⚔️ Força' },
  { value: 'intelligence', label: '🧠 Inteligência' },
  { value: 'endurance',  label: '🛡️ Resistência' },
  { value: 'vitality',   label: '💚 Vitalidade' },
  { value: 'discipline', label: '🔥 Disciplina' },
  { value: 'wisdom',     label: '📖 Sabedoria' },
  { value: 'balance',    label: '☯️ Equilíbrio' },
];


interface NewQuestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

const DEFAULTS: CreateTaskInput = {
  title: '',
  category: '',
  category_color: '#7C3AED',
  xp_reward: 25,
  stat_target: null,
  stat_reward: 1,
};

export function NewQuestModal({ open, onClose, onSubmit }: NewQuestModalProps) {
  const [form, setForm] = useState<CreateTaskInput>(DEFAULTS);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.category.trim()) return;
    setLoading(true);
    await onSubmit({ ...form, title: form.title.trim(), category: form.category.trim() });
    setLoading(false);
    setForm(DEFAULTS);
    onClose();
  };

  const set = <K extends keyof CreateTaskInput>(key: K, value: CreateTaskInput[K]) =>
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
              <h2
                className="text-lg font-bold text-[#E2E8F0]"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                Nova Quest
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-white/5 hover:text-[#E2E8F0]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  Título da quest *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="Ex: Ler 30 minutos"
                  required
                  className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] placeholder-[#94A3B8]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  Categoria *
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder="Ex: Estudo, Treino, Hábito..."
                  required
                  className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] placeholder-[#94A3B8]/50 outline-none transition-colors focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/30"
                />
              </div>

              {/* Category color */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                  <Palette size={12} />
                  Cor da categoria
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
                    title="Cor personalizada"
                  />
                </div>
              </div>

              {/* XP + Stat row */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-[#94A3B8]">
                    XP
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
                    Stat alvo
                  </label>
                  <select
                    value={form.stat_target ?? ''}
                    onChange={(e) =>
                      set('stat_target', (e.target.value || null) as Task['stat_target'])
                    }
                    className="w-full rounded-xl border border-[#38384A] bg-[#0F0F13] px-3 py-2.5 text-sm text-[#E2E8F0] outline-none transition-colors focus:border-[#7C3AED]"
                  >
                    {STAT_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={o.value ?? ''}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
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
                {loading ? 'Criando...' : 'Criar Quest'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
