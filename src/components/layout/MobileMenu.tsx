import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  Apple,
  Settings,
  LogOut,
  X,
  LayoutGrid,
  Skull,
  Coins,
  Moon,
  Trophy,
  Users,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useHunterStore } from '@/stores/useHunterStore';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/preferences';
import { MAX_LEVEL } from '@/lib/progression';
import { RankBadge } from '@/components/ui/rank-badge';
import { NeonProgressBar } from '@/components/ui/neon-progress';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/', labelKey: 'nav.portal' as const, icon: LayoutGrid },
  { path: '/status', labelKey: 'nav.status' as const, icon: LayoutDashboard },
  { path: '/quests', labelKey: 'nav.quests' as const, icon: CheckSquare },
  { path: '/bosses', labelKey: 'nav.bosses' as const, icon: Skull },
  { path: '/workouts', labelKey: 'nav.workouts' as const, icon: Dumbbell },
  { path: '/nutrition', labelKey: 'nav.nutrition' as const, icon: Apple },
  { path: '/fortuna', labelKey: 'nav.fortuna' as const, icon: Coins },
  { path: '/rest', labelKey: 'nav.rest' as const, icon: Moon },
  { path: '/trophies', labelKey: 'nav.trophies' as const, icon: Trophy },
  { path: '/social', labelKey: 'nav.social' as const, icon: Users },
  { path: '/settings', labelKey: 'nav.settings' as const, icon: Settings },
];

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const state = useHunterStore();
  const { signOut } = useAuth();
  const { t } = usePreferences();

  const lastPath = useRef(location.pathname);

  useEffect(() => {
    if (lastPath.current !== location.pathname) {
      onClose();
      lastPath.current = location.pathname;
    }
  }, [location.pathname, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const safeXpRequired = Math.max(state.xpRequired || 100, 1);
  const hunterName = state.username || state.fullName || 'Hunter';
  const hunterClass = state.hunterClass || t('common.classUndefined');
  const handleSignOut = async () => {
    await signOut();
    onClose();
    navigate('/login', { replace: true });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/85 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[var(--hud-border-strong)] bg-[var(--hud-bg,#07080C)]/95 backdrop-blur-xl shadow-2xl"
            style={{
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--hud-border)] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-[0_0_15px_rgba(0,240,255,0.3)]">
                  <img
                    src="/optimized/Icon 2.png"
                    alt="ASCEND"
                    decoding="async"
                    className="size-10 object-cover"
                  />
                </div>
                <span className="font-orbitron text-base font-black tracking-[0.14em] text-[#00F0FF] text-glow-cyan">
                  ASCEND
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#94A3B8] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-none">
              {navItems.map((item, i) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        'flex min-h-[46px] items-center gap-3.5 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-all',
                        isActive
                          ? 'bg-[#00F0FF]/10 text-[#00F0FF] border border-[#00F0FF]/35 shadow-[0_0_14px_rgba(0,240,255,0.12)]'
                          : 'text-[#94A3B8] hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon size={18} className={isActive ? 'text-[#00F0FF]' : ''} />
                      {t(item.labelKey)}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Hunter footer */}
            <div className="border-t border-[var(--hud-border)] p-4 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--hud-border)] bg-[var(--hud-surface)] p-3">
                <RankBadge rank={state.rank} size="md" showLabel />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black uppercase tracking-tight text-white">
                    {hunterName}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {hunterClass} <span className="text-slate-600">•</span> Rank {state.rank}
                  </p>
                  <p className="mt-1 font-orbitron text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]">
                    {t('common.level')} {state.level}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  <span>{t('common.systemXp')}</span>
                  <span className="font-orbitron">
                    {state.xp} / {state.xpRequired}
                  </span>
                </div>
                <NeonProgressBar
                  value={state.level >= MAX_LEVEL ? safeXpRequired : state.xp}
                  max={safeXpRequired}
                  variant="xp"
                  size="sm"
                  ariaLabel="System XP"
                />
              </div>

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#94A3B8] transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <LogOut size={16} />
                {t('common.disconnect')}
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
