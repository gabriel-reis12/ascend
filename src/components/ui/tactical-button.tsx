import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TacticalButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type TacticalButtonAccent = 'cyan' | 'purple' | 'gold' | 'crimson';

export interface TacticalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TacticalButtonVariant;
  /** Cor dos filetes laterais na variante secondary (ex: Complete mission = cyan, Log workout = purple) */
  accent?: TacticalButtonAccent;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  /** Ativa tipografia Orbitron uppercase (ideal para CTAs principais como START WORKOUT, ATTACK!) */
  displayFont?: boolean;
}

const variantClasses: Record<TacticalButtonVariant, string> = {
  primary:
    'border-[#00F0FF]/60 bg-gradient-to-r from-[#00C8FF] via-[#00F0FF] to-[#38BDF8] text-[#07080C] font-extrabold shadow-[0_0_22px_rgba(0,240,255,0.28)] hover:brightness-110',
  secondary:
    'border-white/12 bg-gradient-to-b from-[#1A1E2B] to-[#11131C] text-[#F8FAFC] font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_20px_rgba(0,0,0,0.4)] hover:border-white/25 hover:from-[#202534] hover:to-[#151823]',
  danger:
    'border-[#EF4444]/60 bg-gradient-to-r from-[#7F1D1D] via-[#B91C1C] to-[#6B21A8] text-white font-extrabold shadow-[0_0_22px_rgba(239,68,68,0.28)] hover:brightness-110',
  ghost:
    'border-white/10 bg-white/[0.03] text-[#94A3B8] hover:border-white/20 hover:bg-white/[0.06] hover:text-white',
};

const sideBarColorClasses: Record<TacticalButtonAccent, string> = {
  cyan: 'bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]',
  purple: 'bg-[#A855F7] shadow-[0_0_8px_#A855F7]',
  gold: 'bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]',
  crimson: 'bg-[#EF4444] shadow-[0_0_8px_#EF4444]',
};

export const TacticalButton = React.forwardRef<HTMLButtonElement, TacticalButtonProps>(
  (
    {
      className,
      variant = 'primary',
      accent = 'cyan',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      fullWidth = false,
      displayFont = false,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || loading);
    const showSideBars = variant === 'secondary';

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          'group relative inline-flex min-h-[52px] select-none items-center justify-center gap-3 overflow-hidden rounded-xl border px-5 py-3 text-sm transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080C]',
          'active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50',
          displayFont && 'font-orbitron uppercase tracking-[0.12em] text-xs sm:text-sm',
          fullWidth && 'w-full',
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {showSideBars && (
          <>
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute left-1.5 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-transform duration-200 group-hover:scale-y-110',
                sideBarColorClasses[accent]
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute right-1.5 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-transform duration-200 group-hover:scale-y-110',
                sideBarColorClasses[accent]
              )}
            />
          </>
        )}

        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}

        <span className={cn('min-w-0', showSideBars ? 'flex-1 text-center' : 'truncate')}>
          {children}
        </span>

        {!loading && rightIcon && (
          <span className="shrink-0 opacity-80 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:opacity-100">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

TacticalButton.displayName = 'TacticalButton';

