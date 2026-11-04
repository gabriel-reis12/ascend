import * as React from 'react';
import { cn } from '@/lib/utils';

export type HudCardVariant =
  | 'default'
  | 'elevated'
  | 'cyan'
  | 'purple'
  | 'gold'
  | 'crimson'
  | 'success';

export interface HudCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: HudCardVariant;
  /** Exibe cantoneiras táticas inspiradas nos cards de Hunter Status e Raid */
  corners?: boolean;
  /** Adiciona iluminação interna suave no topo */
  radialGlow?: boolean;
  /** Remove o padding interno padrão (útil para cards com header ou imagem full-bleed) */
  noPadding?: boolean;
  /** Classes adicionais para o container interno de conteúdo */
  contentClassName?: string;
}

const variantClasses: Record<HudCardVariant, string> = {
  default: 'bg-[var(--hud-surface)] border-[var(--hud-border)]',
  elevated: 'bg-[var(--hud-surface-elevated)] border-[var(--hud-border-strong)] shadow-[0_12px_32px_rgba(0,0,0,0.45)]',
  cyan: 'bg-[var(--hud-surface)] border-[var(--hud-border-cyan)] shadow-[0_0_20px_rgba(0,240,255,0.08)]',
  purple: 'bg-[var(--hud-surface)] border-[var(--hud-border-purple)] shadow-[0_0_20px_rgba(168,85,247,0.1)]',
  gold: 'bg-[var(--hud-surface)] border-[var(--hud-border-gold)] shadow-[0_0_20px_rgba(245,158,11,0.1)]',
  crimson: 'bg-[var(--hud-surface)] border-[var(--hud-border-crimson)] shadow-[0_0_20px_rgba(239,68,68,0.1)]',
  success: 'bg-[var(--hud-surface)] border-emerald-500/35 shadow-[0_0_18px_rgba(16,185,129,0.08)]',
};

const cornerColorClasses: Record<HudCardVariant, string> = {
  default: 'border-slate-400/35',
  elevated: 'border-slate-300/45',
  cyan: 'border-[#00F0FF]/80',
  purple: 'border-[#A855F7]/80',
  gold: 'border-[#F59E0B]/80',
  crimson: 'border-[#EF4444]/80',
  success: 'border-emerald-400/80',
};

const radialOverlayStyles: Record<HudCardVariant, string> = {
  default: 'radial-gradient(120% 80% at 50% 0%, rgba(255, 255, 255, 0.035) 0%, transparent 70%)',
  elevated: 'radial-gradient(120% 80% at 50% 0%, rgba(0, 240, 255, 0.05) 0%, transparent 70%)',
  cyan: 'radial-gradient(120% 80% at 50% 0%, rgba(0, 240, 255, 0.09) 0%, transparent 70%)',
  purple: 'radial-gradient(120% 80% at 50% 0%, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
  gold: 'radial-gradient(120% 80% at 50% 0%, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
  crimson: 'radial-gradient(120% 80% at 50% 0%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)',
  success: 'radial-gradient(120% 80% at 50% 0%, rgba(16, 185, 129, 0.09) 0%, transparent 70%)',
};

export const HudCard = React.forwardRef<HTMLDivElement, HudCardProps>(
  (
    {
      className,
      contentClassName,
      variant = 'default',
      corners = false,
      radialGlow = true,
      noPadding = false,
      children,
      ...props
    },
    ref
  ) => {
    const cornerAccent = cornerColorClasses[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'relative overflow-hidden rounded-2xl border text-[var(--text-primary)] transition-colors duration-200',
          variantClasses[variant],
          !noPadding && 'p-4 sm:p-5',
          className
        )}
        {...props}
      >
        {radialGlow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: radialOverlayStyles[variant] }}
          />
        )}

        {corners && (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-tl-[4px] border-l-2 border-t-2',
                cornerAccent
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-tr-[4px] border-r-2 border-t-2',
                cornerAccent
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute bottom-1.5 left-1.5 h-2.5 w-2.5 rounded-bl-[4px] border-b-2 border-l-2',
                cornerAccent
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute bottom-1.5 right-1.5 h-2.5 w-2.5 rounded-br-[4px] border-b-2 border-r-2',
                cornerAccent
              )}
            />
          </>
        )}

        <div className={cn('relative z-10', contentClassName)}>{children}</div>
      </div>
    );
  }
);

HudCard.displayName = 'HudCard';

