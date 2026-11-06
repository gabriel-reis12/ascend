import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Palette, CalendarDays, Clock3, StickyNote, Sparkles } from 'lucide-react';
import type { CreateTaskInput, Task } from '@/hooks/useTasks';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { TacticalButton } from '@/components/ui/tactical-button';

const PRESET_COLORS = [
  '#00F0FF', '#A855F7', '#3B82F6', '#10B981',
  '#F59E0B', '#EF4444', '#F97316', '#EC4899',
];

const STAT_OPTIONS: { value: Task['stat_target']; label: string }[] = [
  { value: null,           label: 'Nenhum' },
  { value: 'strength',     label: '⚔️ Força' },
  { value: 'intelligence', label: '🧠 Inteligência' },
  { value: 'endurance',    label: '🛡️ Resistência' },
  { value: 'vitality',     label: '💚 Vitalidade' },
  { value: 'discipline',   label: '🔥 Disciplina' },
  { value: 'wisdom',       label: '📖 Sabedoria' },
  { value: 'balance',      label: '☯️ Equilíbrio' },
];

interface NewQuestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
}

const DEFAULTS: CreateTaskInput = {
  title: '',
  category: 'Compromisso',
  category_color: '#00F0FF',
  xp_reward: 15,
  stat_target: null,
  stat_reward: 0,
};

export function NewQuestModal({ open, onClose, onSubmit }: NewQuestModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const tx = (value: string) => (isEnglish ? translateUiText(value) : value);
  const [form, setForm] = useState<CreateTaskInput>(DEFAULTS);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setLoading(true);
    await onSubmit({
      ...form,
      title: form.title.trim(),
      category: form.category.trim() || 'Missao Unica',
      stat_reward: form.stat_target ? Math.max(1, form.stat_reward || 1) : 0,
      single_meta: {
        kind: 'single',
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        note: note.trim() || undefined,
      },
    });
    setLoading(false);
    setForm(DEFAULTS);
    setDueDate('');
    setDueTime('');
    setNote('');
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
            className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-quest-modal-title"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="fixed inset-x-0 bottom-0 z-[101] mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border-t border-[#00F0FF]/30 bg-[#0E1017] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.75)] sm:inset-x-4 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-[#00F0FF]/25 sm:p-6"
          >
            {/* Mobile Bottom Sheet Handle */}
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />

            <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_14px_rgba(0,240,255,0.18)]">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="block font-orbitron text-[10px] font-bold uppercase tracking-[0.2em] text-[#00F0FF]">
                    {l('DIRETRIZ TÁTICA', 'TACTICAL DIRECTIVE')}
                  </span>
                  <h2
                    id="new-quest-modal-title"
                    className="font-orbitron text-base font-black uppercase tracking-wide text-white sm:text-lg"
                  >
                    {l('Missão Única', 'One-Time Quest')}
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
              {/* Title */}
              <div>
                <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {l('Título da quest *', 'Quest title *')}
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder={l('Ex: Estudar 45 minutos, Entregar relatório...', 'Ex: Study 45 minutes, Submit report...')}
                  required
                  className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/30"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {l('Categoria *', 'Category *')}
                </label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                  placeholder={l('Ex: Estudo, Trabalho, Saúde, Compromisso...', 'Ex: Study, Work, Health, Appointment...')}
                  required
                  className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    <CalendarDays size={12} className="text-[#00F0FF]" />
                    {l('Data', 'Date')}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#00F0FF]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    <Clock3 size={12} className="text-[#00F0FF]" />
                    {l('Hora', 'Time')}
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#00F0FF]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  <StickyNote size={12} className="text-[#A855F7]" />
                  {l('Nota opcional', 'Optional note')}
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder={l('Ex: pauta, link, endereço ou lembrete rápido', 'Ex: agenda, link, address, or quick reminder')}
                  className="w-full resize-none rounded-xl border border-white/12 bg-[#07080C] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-colors focus:border-[#00F0FF]"
                />
              </div>

              {/* Category color */}
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  <Palette size={12} className="text-[#00F0FF]" />
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

              {/* XP + Stat row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    XP
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={form.xp_reward}
                    onChange={(e) => set('xp_reward', Number(e.target.value))}
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 font-orbitron text-sm font-bold text-[#F59E0B] outline-none transition-colors focus:border-[#F59E0B]"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block font-orbitron text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                    {l('Stat alvo', 'Target stat')}
                  </label>
                  <select
                    value={form.stat_target ?? ''}
                    onChange={(e) =>
                      set('stat_target', (e.target.value || null) as Task['stat_target'])
                    }
                    className="min-h-[46px] w-full rounded-xl border border-white/12 bg-[#07080C] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#00F0FF]"
                  >
                    {STAT_OPTIONS.map((o) => (
                      <option key={String(o.value)} value={o.value ?? ''}>
                        {tx(o.label)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit */}
              <TacticalButton
                type="submit"
                variant="primary"
                fullWidth
                displayFont
                loading={loading}
                disabled={loading || !form.title.trim()}
                leftIcon={<Plus size={16} strokeWidth={2.5} />}
                className="mt-2"
              >
                {loading ? l('Criando...', 'Creating...') : l('Criar Missão Única', 'Create One-Time Quest')}
              </TacticalButton>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
