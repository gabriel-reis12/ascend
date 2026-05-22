import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Star } from 'lucide-react';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import type { Task } from '@/hooks/useTasks';

interface QuestItemProps {
  task: Task;
  onComplete: (id: string) => void;
  onUncomplete: (id: string) => void;
  onDelete: (id: string) => void;
  index?: number;
}

export function QuestItem({ task, onComplete, onUncomplete, onDelete, index = 0 }: QuestItemProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group flex items-center gap-3 rounded-xl border border-[#38384A] bg-[#1C1C24] px-4 py-3 transition-colors hover:border-[#7C3AED]/40"
    >
      <NeonCheckbox
        checked={task.completed}
        onChange={(e) => {
          if (e.target.checked) onComplete(task.id);
          else onUncomplete(task.id);
        }}
      />

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium transition-colors duration-200 ${
            task.completed ? 'text-[#94A3B8] line-through' : 'text-[#E2E8F0]'
          }`}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{
              background: `${task.category_color}20`,
              color: task.category_color,
              border: `1px solid ${task.category_color}40`,
            }}
          >
            {task.category}
          </span>
          <span className="flex items-center gap-0.5 text-[11px] text-[#FBBF24]">
            <Star size={9} fill="currentColor" />
            {task.xp_reward} XP
          </span>
        </div>
      </div>

      <AnimatePresence>
        {hovered && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            onClick={() => onDelete(task.id)}
            className="shrink-0 rounded-lg p-1.5 text-[#94A3B8] transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 size={14} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
