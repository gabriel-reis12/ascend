import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  Clock,
  Dumbbell,
  Flame,
  Zap,
  BookOpen,
  Shield,
  Heart,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import {
  detectGuidedActivity,
  formatTimeMMSS,
} from '@/lib/guidedQuests';
import { usePreferences } from '@/contexts/preferences';

export interface IllustratedQuestCardProps {
  id: string;
  type: 'habit' | 'task' | 'workout' | 'meal' | 'finance';
  title: string;
  category: string;
  categoryColor: string;
  xpReward: number;
  statLabel?: string;
  done: boolean;
  onExecute: () => void;
  onQuickToggle: () => void;
}

export function IllustratedQuestCard({
  id,
  type,
  title,
  category,
  categoryColor,
  xpReward,
  statLabel,
  done,
  onExecute,
  onQuickToggle,
}: IllustratedQuestCardProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const prefersReducedMotion = useReducedMotion();

  const config = detectGuidedActivity(title, category);

  const IconComponent =
    config.iconName === 'flame'
      ? Flame
      : config.iconName === 'book'
      ? BookOpen
      : config.iconName === 'zap'
      ? Zap
      : config.iconName === 'shield'
      ? Shield
      : config.iconName === 'heart'
      ? Heart
      : config.iconName === 'sparkles'
      ? Sparkles
      : config.iconName === 'clock'
      ? Clock
      : Dumbbell;

  const targetDescription =
    config.mode === 'reps'
      ? `${config.defaultTarget} ${l('repetições', 'reps')}`
      : config.mode === 'timer'
      ? `${Math.round(config.defaultTarget / 60)} ${l('minutos', 'minutes')}`
      : l('Rotina de Treino', 'Workout Routine');

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        done
          ? 'border-emerald-500/25 bg-[#0A0D12]/90'
          : 'border-white/10 bg-[#0B0F19] hover:border-[#00F0FF]/40 hover:shadow-[0_0_24px_rgba(0,240,255,0.12)]'
      }`}
    >
      {/* Imagem de Fundo Oficial com Overlay HUD */}
      <div className="relative h-32 w-full overflow-hidden sm:h-36">
        <img
          src={config.cardImage}
          alt={title}
          className={`h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
            done ? 'grayscale opacity-30 contrast-125' : 'opacity-65'
          }`}
          loading="lazy"
          decoding="async"
        />
        {/* Gradiente Tático */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/60 to-transparent" />

        {/* Badges Superiores */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase backdrop-blur-md"
            style={{ color: categoryColor }}
          >
            <IconComponent size={12} />
            <span className="truncate max-w-[120px]">{category}</span>
          </span>

          <div className="flex items-center gap-1.5">
            {statLabel && (
              <span className="rounded-lg border border-[#00F0FF]/30 bg-black/60 px-2 py-0.5 font-orbitron text-[9px] font-bold text-[#00F0FF] backdrop-blur-md">
                {statLabel}
              </span>
            )}
            <span className="rounded-lg border border-amber-500/30 bg-black/60 px-2 py-0.5 font-orbitron text-[10px] font-black text-amber-400 backdrop-blur-md">
              +{xpReward} XP
            </span>
          </div>
        </div>

        {/* Status Flutuante Inferior da Imagem */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-2 py-0.5 font-orbitron text-[10px] font-bold text-slate-300 backdrop-blur-md">
            {config.mode === 'reps' ? <Zap size={11} className="text-[#00F0FF]" /> : <Clock size={11} className="text-purple-400" />}
            {targetDescription}
          </span>

          {done ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase text-emerald-300">
              <CheckCircle2 size={11} />
              {l('CONCLUÍDA', 'DONE')}
            </span>
          ) : (
            <span className="rounded-md border border-white/10 bg-black/70 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase text-slate-400">
              {l('PENDENTE', 'PENDING')}
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo do Card */}
      <div className="p-4 space-y-3">
        <h4
          className={`font-orbitron text-sm font-bold line-clamp-2 leading-snug transition-colors ${
            done ? 'text-slate-500 line-through' : 'text-white'
          }`}
        >
          {title}
        </h4>

        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {isEnglish ? config.instructions.en : config.instructions.pt}
        </p>

        {/* Rodapé de Ações: Executar Guiado vs Checkbox Rápido */}
        <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/8">
          {/* Checkbox Rápido para usuários avançados */}
          <div
            className="flex h-11 items-center gap-2 rounded-xl bg-white/[0.02] px-2.5 hover:bg-white/[0.05] transition-colors"
            title={l('Marcar diretamente sem modo guiado', 'Direct mark without guided mode')}
          >
            <NeonCheckbox
              checked={done}
              aria-label={title}
              onChange={onQuickToggle}
            />
            <span className="text-[10px] font-medium text-slate-400">
              {done ? l('Concluída', 'Done') : l('Registro rápido', 'Quick log')}
            </span>
          </div>

          {/* Botão de Ação Primária: Iniciar Modo Guiado */}
          <TacticalButton
            variant={done ? 'secondary' : 'primary'}
            accent={config.mode === 'routine' ? 'purple' : 'cyan'}
            displayFont
            onClick={onExecute}
            leftIcon={done ? <CheckCircle2 size={14} /> : <Play size={14} fill="currentColor" />}
            className="min-h-[44px] px-3.5 text-xs font-bold"
          >
            {done
              ? l('Repetir', 'Repeat')
              : config.mode === 'routine'
              ? l('Abrir Treino', 'Open Routine')
              : l('Modo Guiado', 'Guided Mode')}
          </TacticalButton>
        </div>
      </div>
    </motion.div>
  );
}

