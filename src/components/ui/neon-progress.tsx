import * as React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type NeonProgressBarVariant = 'xp' | 'boss-hp' | 'cyan' | 'neutral';

export interface NeonProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: NeonProgressBarVariant;
  /** Exibe texto centralizado dentro da barra (padrão na variante boss-hp: "HP 6,500 / 10,000") */
  centerLabel?: React.ReactNode;
  /** Rótulo acessível para leitores de tela */
  ariaLabel?: string;
  /** Altura customizada para variantes finas */
  size?: 'sm' | 'md' | 'lg';
}

export const NeonProgressBar = React.forwardRef<HTMLDivElement, NeonProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = 'xp',
      centerLabel,
      ariaLabel = 'Progress',
      size = 'md',
      ...props
    },
    ref
  ) => {
    const prefersReducedMotion = useReducedMotion();

    const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
    const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
    const pct = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));

    if (variant === 'boss-hp') {
      return (
        <div
          ref={ref}
          role="progressbar"
          aria-label={ariaLabel}
          aria-valuemin={0}
          aria-valuemax={safeMax}
          aria-valuenow={Math.round(safeValue)}
          className={cn(
            'relative h-10 w-full overflow-hidden rounded-xl border border-[#EF4444]/45 bg-[#190B10] p-1 shadow-[0_0_20px_rgba(239,68,68,0.16)]',
            className
          )}
          {...props}
        >
          <motion.div
            initial={prefersReducedMotion ? false : { width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: 'easeOut' }}
            className="h-full rounded-lg bg-gradient-to-r from-[#7F1D1D] via-[#DC2626] to-[#EF4444] shadow-[0_0_14px_rgba(239,68,68,0.5)]"
          />
          {centerLabel !== undefined && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-3">
              <span className="font-orbitron text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] tabular-nums">
                {centerLabel}
              </span>
            </div>
          )}
        </div>
      );
    }

    const sizeClasses = {
      sm: 'h-1.5',
      md: 'h-2.5',
      lg: 'h-3.5',
    }[size];

    const fillClasses: Record<Exclude<NeonProgressBarVariant, 'boss-hp'>, string> = {
      xp: 'bg-gradient-to-r from-[#00F0FF] via-[#38BDF8] to-[#A855F7] shadow-[0_0_12px_rgba(0,240,255,0.4)]',
      cyan: 'bg-gradient-to-r from-[#00C8FF] to-[#00F0FF] shadow-[0_0_12px_rgba(0,240,255,0.45)]',
      neutral: 'bg-gradient-to-r from-slate-400 to-slate-200',
    };

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(safeValue)}
        className={cn(
          'relative w-full overflow-hidden rounded-full border border-white/10 bg-black/50',
          sizeClasses,
          className
        )}
        {...props}
      >
        <motion.div
          initial={prefersReducedMotion ? false : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full', fillClasses[variant])}
        />
      </div>
    );
  }
);

NeonProgressBar.displayName = 'NeonProgressBar';

export type NeonProgressRingVariant = 'cyan' | 'cyan-purple';

export interface NeonProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Valor percentual de 0 a 100 (ou proporcional a max) */
  value: number;
  max?: number;
  /** Valor opcional para o segundo anel interno (quando variant="cyan-purple") */
  secondaryValue?: number;
  size?: number;
  strokeWidth?: number;
  variant?: NeonProgressRingVariant;
  ariaLabel?: string;
}

export const NeonProgressRing = React.forwardRef<HTMLDivElement, NeonProgressRingProps>(
  (
    {
      className,
      value,
      max = 100,
      secondaryValue,
      size = 132,
      strokeWidth = 8,
      variant = 'cyan-purple',
      ariaLabel = 'Circular progress',
      children,
      ...props
    },
    ref
  ) => {
    const reactId = React.useId();
    const prefersReducedMotion = useReducedMotion();

    const safeMax = Number.isFinite(max) && max > 0 ? max : 100;
    const safeValue = Number.isFinite(value) ? Math.min(safeMax, Math.max(0, value)) : 0;
    const pct = Math.min(100, Math.max(0, (safeValue / safeMax) * 100));

    const innerPct =
      secondaryValue !== undefined && Number.isFinite(secondaryValue)
        ? Math.min(100, Math.max(0, (secondaryValue / safeMax) * 100))
        : pct;

    const center = size / 2;
    const outerRadius = center - strokeWidth - 4;
    const outerCircumference = 2 * Math.PI * outerRadius;
    const outerOffset = outerCircumference - (pct / 100) * outerCircumference;

    const innerStroke = Math.max(4, strokeWidth - 2);
    const innerRadius = outerRadius - strokeWidth - 4;
    const innerCircumference = 2 * Math.PI * innerRadius;
    const innerOffset = innerCircumference - (innerPct / 100) * innerCircumference;

    const gradId = `hud-ring-grad-${reactId}`;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={Math.round(safeValue)}
        className={cn('relative inline-flex items-center justify-center select-none', className)}
        style={{ width: size, height: size }}
        {...props}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90 transform overflow-visible"
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F0FF" />
              <stop offset="100%" stopColor="#A855F7" />
            </linearGradient>
          </defs>

          {/* Trilha Externa */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Anel Externo Principal */}
          <motion.circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="transparent"
            stroke={variant === 'cyan' ? '#00F0FF' : `url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={outerCircumference}
            initial={prefersReducedMotion ? false : { strokeDashoffset: outerCircumference }}
            animate={{ strokeDashoffset: outerOffset }}
            transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.75, ease: 'easeOut' }}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(0, 240, 255, 0.45))',
            }}
          />

          {/* Segundo Anel Interno (variante cyan-purple vista na Home e Nutrition) */}
          {variant === 'cyan-purple' && innerRadius > 12 && (
            <>
              <circle
                cx={center}
                cy={center}
                r={innerRadius}
                fill="transparent"
                stroke="rgba(168, 85, 247, 0.12)"
                strokeWidth={innerStroke}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={innerRadius}
                fill="transparent"
                stroke="#A855F7"
                strokeWidth={innerStroke}
                strokeLinecap="round"
                strokeDasharray={innerCircumference}
                initial={prefersReducedMotion ? false : { strokeDashoffset: innerCircumference }}
                animate={{ strokeDashoffset: innerOffset }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.85, ease: 'easeOut' }}
                style={{
                  filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.4))',
                }}
              />
            </>
          )}
        </svg>

        {/* Conteúdo Central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
          {children}
        </div>
      </div>
    );
  }
);

NeonProgressRing.displayName = 'NeonProgressRing';

