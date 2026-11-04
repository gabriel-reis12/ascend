import * as React from 'react';
import { cn } from '@/lib/utils';
import type { ProgressionRank } from '@/lib/progression';

export type RankBadgeSize = 'sm' | 'md' | 'lg';

export interface RankBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  rank: ProgressionRank | string;
  size?: RankBadgeSize;
  /** Exibe o rótulo "RANK" acima da letra dentro do brasão (estilo Player Status) */
  showLabel?: boolean;
}

interface RankTheme {
  stroke: string;
  secondaryStroke: string;
  bgGradient: string;
  textColor: string;
  glow: string;
}

const RANK_THEMES: Record<string, RankTheme> = {
  E: {
    stroke: '#64748B',
    secondaryStroke: '#94A3B8',
    bgGradient: 'linear-gradient(180deg, #1E293B 0%, #0F172A 100%)',
    textColor: '#E2E8F0',
    glow: '0 0 12px rgba(100, 116, 139, 0.35)',
  },
  D: {
    stroke: '#10B981',
    secondaryStroke: '#34D399',
    bgGradient: 'linear-gradient(180deg, #064E3B 0%, #022C22 100%)',
    textColor: '#6EE7B7',
    glow: '0 0 14px rgba(16, 185, 129, 0.4)',
  },
  C: {
    stroke: '#00F0FF',
    secondaryStroke: '#38BDF8',
    bgGradient: 'linear-gradient(180deg, #083344 0%, #0F172A 100%)',
    textColor: '#00F0FF',
    glow: '0 0 14px rgba(0, 240, 255, 0.45)',
  },
  B: {
    stroke: '#00F0FF',
    secondaryStroke: '#F59E0B',
    bgGradient: 'linear-gradient(180deg, #162436 0%, #0B111E 100%)',
    textColor: '#00F0FF',
    glow: '0 0 16px rgba(0, 240, 255, 0.45)',
  },
  A: {
    stroke: '#EF4444',
    secondaryStroke: '#A855F7',
    bgGradient: 'linear-gradient(180deg, #3B0714 0%, #16071C 100%)',
    textColor: '#F87171',
    glow: '0 0 18px rgba(239, 68, 68, 0.5)',
  },
  S: {
    stroke: '#F59E0B',
    secondaryStroke: '#00F0FF',
    bgGradient: 'linear-gradient(180deg, #451A03 0%, #170F04 100%)',
    textColor: '#FBBF24',
    glow: '0 0 22px rgba(245, 158, 11, 0.6)',
  },
  National: {
    stroke: '#A855F7',
    secondaryStroke: '#F59E0B',
    bgGradient: 'linear-gradient(180deg, #3B0764 0%, #130524 100%)',
    textColor: '#E9D5FF',
    glow: '0 0 22px rgba(168, 85, 247, 0.65)',
  },
  Monarch: {
    stroke: '#F59E0B',
    secondaryStroke: '#A855F7',
    bgGradient: 'linear-gradient(180deg, #4C1D95 0%, #090514 100%)',
    textColor: '#FDE68A',
    glow: '0 0 24px rgba(245, 158, 11, 0.7)',
  },
};

const SIZE_CONFIG: Record<
  RankBadgeSize,
  { box: string; letter: string; label: string }
> = {
  sm: {
    box: 'h-9 w-9',
    letter: 'text-sm',
    label: 'text-[6px]',
  },
  md: {
    box: 'h-12 w-12',
    letter: 'text-lg',
    label: 'text-[7px]',
  },
  lg: {
    box: 'h-16 w-16',
    letter: 'text-2xl',
    label: 'text-[8px]',
  },
};

export const RankBadge = React.forwardRef<HTMLDivElement, RankBadgeProps>(
  ({ className, rank, size = 'md', showLabel = false, ...props }, ref) => {
    const normalized = String(rank || 'E').trim();
    const theme = RANK_THEMES[normalized] || RANK_THEMES.E;
    const sizeStyle = SIZE_CONFIG[size];

    const displayRank =
      normalized === 'National' ? 'NAT' : normalized === 'Monarch' ? 'MON' : normalized.toUpperCase();

    return (
      <div
        ref={ref}
        title={`Rank ${normalized}`}
        aria-label={`Rank ${normalized}`}
        className={cn(
          'relative inline-flex shrink-0 select-none items-center justify-center',
          sizeStyle.box,
          className
        )}
        style={{ filter: `drop-shadow(${theme.glow})` }}
        {...props}
      >
        {/* Escudo Octogonal / Poligonal SVG */}
        <svg
          viewBox="0 0 64 64"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {/* Moldura Externa */}
          <polygon
            points="32,3 54,12 61,32 52,53 32,61 12,53 3,32 10,12"
            fill="#0A0C12"
            stroke={theme.secondaryStroke}
            strokeWidth="2"
          />
          {/* Escudo Interno */}
          <polygon
            points="32,8 50,15 56,32 48,49 32,56 16,49 8,32 14,15"
            fill="#10131D"
            stroke={theme.stroke}
            strokeWidth="1.75"
          />
        </svg>

        {/* Conteúdo Tipográfico */}
        <div className="relative z-10 flex flex-col items-center justify-center leading-none">
          {showLabel && size !== 'sm' && (
            <span
              className={cn(
                'font-orbitron font-bold uppercase tracking-[0.16em] text-slate-300/90 mb-0.5',
                sizeStyle.label
              )}
            >
              RANK
            </span>
          )}
          <span
            className={cn(
              'font-orbitron font-black tracking-tight',
              sizeStyle.letter
            )}
            style={{ color: theme.textColor }}
          >
            {displayRank}
          </span>
        </div>
      </div>
    );
  }
);

RankBadge.displayName = 'RankBadge';

