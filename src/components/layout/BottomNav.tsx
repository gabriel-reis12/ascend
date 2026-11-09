import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Dumbbell, Apple, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/preferences';
import type { TranslationKey } from '@/contexts/preferences';

export interface BottomNavItem {
  path: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  tourId?: string;
  subPaths?: string[];
}

export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { path: '/', labelKey: 'nav.home', icon: Home },
  { path: '/quests', labelKey: 'nav.quests', icon: CheckSquare },
  { path: '/workouts', labelKey: 'nav.workoutsShort', icon: Dumbbell, tourId: 'tour-mobile-nav-workouts' },
  { path: '/nutrition', labelKey: 'nav.nutrition', icon: Apple, tourId: 'tour-mobile-nav-nutrition' },
  { path: '/hub', labelKey: 'nav.hub', icon: Compass, tourId: 'tour-mobile-nav-hub', subPaths: ['/hub', '/status', '/bosses', '/trophies', '/fortuna', '/rest', '/social', '/settings'] },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = usePreferences();
  const prefersReducedMotion = useReducedMotion();

  const isItemActive = (item: BottomNavItem): boolean => {
    const pathname = location.pathname;
    if (item.path === '/') {
      return pathname === '/';
    }
    if (item.subPaths && item.subPaths.length > 0) {
      return item.subPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    }
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  };

  return (
    <nav
      aria-label="Mobile Primary Navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-30 border-t border-[var(--hud-border-strong)] bg-[var(--hud-surface-glass)] backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.65)]"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="mx-auto grid h-[66px] max-w-lg grid-cols-5 items-stretch px-1 sm:px-2">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = isItemActive(item);
          const Icon = item.icon;
          const label = t(item.labelKey);

          return (
            <Link
              key={item.path}
              to={item.path}
              id={item.tourId}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group relative flex min-h-[48px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 select-none transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] focus-visible:ring-inset',
                'active:scale-[0.96]',
                isActive
                  ? 'text-[#00F0FF]'
                  : 'text-[var(--hud-text-muted,#64748B)] hover:text-[var(--text-primary)]'
              )}
            >
              {/* Indicador Luminoso Superior Ciano da Aba Ativa */}
              {isActive && (
                <motion.span
                  layoutId={prefersReducedMotion ? undefined : 'ascend-bottom-nav-indicator'}
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 380, damping: 32 }
                  }
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-2.5 top-0 h-[2.5px] rounded-b-full bg-[#00F0FF] shadow-[0_0_12px_#00F0FF,0_2px_10px_rgba(0,240,255,0.6)]"
                />
              )}

              {/* Halo radial suave atrás do ícone ativo */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1.5 h-8 w-10 rounded-full bg-[#00F0FF]/12 blur-md"
                />
              )}

              <Icon
                size={20}
                strokeWidth={isActive ? 2.4 : 1.9}
                aria-hidden="true"
                className={cn(
                  'relative z-10 shrink-0 transition-transform duration-150',
                  isActive
                    ? 'scale-105 text-[#00F0FF] drop-shadow-[0_0_6px_rgba(0,240,255,0.55)]'
                    : 'group-hover:scale-105'
                )}
              />

              <span
                className={cn(
                  'relative z-10 max-w-full truncate text-[10px] leading-tight tracking-wide',
                  isActive ? 'font-bold text-[#00F0FF]' : 'font-medium'
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
