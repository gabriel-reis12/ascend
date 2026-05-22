import { motion } from 'framer-motion';
import { Sword, Brain, Heart, Shield } from 'lucide-react';
import { clsx } from 'clsx';

const STAT_CONFIG = {
  strength:     { label: 'Força',        icon: Sword,  color: '#EF4444', glow: 'shadow-red-500/30' },
  intelligence: { label: 'Inteligência', icon: Brain,  color: '#3B82F6', glow: 'shadow-blue-500/30' },
  endurance:    { label: 'Resistência',  icon: Heart,  color: '#10B981', glow: 'shadow-emerald-500/30' },
  vitality:     { label: 'Vitalidade',   icon: Shield, color: '#FBBF24', glow: 'shadow-amber-500/30' },
};

interface StatCardProps {
  stat: keyof typeof STAT_CONFIG;
  value: number;
  index?: number;
}

export function StatCard({ stat, value, index = 0 }: StatCardProps) {
  const { label, icon: Icon, color, glow } = STAT_CONFIG[stat];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05, ease: 'easeOut' }}
      className={clsx(
        'relative overflow-hidden rounded-xl border border-[#38384A] bg-[#1C1C24] p-4',
        'shadow-lg', glow,
        'hover:border-opacity-60 transition-colors duration-200'
      )}
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at top left, ${color}, transparent 70%)` }}
      />

      <div className="relative flex items-center gap-3">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-lg"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
        >
          <Icon size={18} style={{ color }} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-[#94A3B8]">{label}</p>
          <motion.p
            key={value}
            initial={{ scale: 1.3, color }}
            animate={{ scale: 1, color: '#E2E8F0' }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="text-2xl font-bold tabular-nums"
          >
            {value}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}
