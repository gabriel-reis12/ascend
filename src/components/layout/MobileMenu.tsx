import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, CheckSquare, Dumbbell, Apple, Settings, LogOut, X, LayoutGrid, Skull, Coins, Moon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useHunterStore } from '@/stores/useHunterStore';
import { useAuth } from '@/contexts/AuthContext';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { path: '/',        label: 'Menu Rápido',  icon: LayoutGrid },
  { path: '/status',  label: 'Status',      icon: LayoutDashboard },
  { path: '/quests',  label: 'Missões',     icon: CheckSquare },
  { path: '/bosses',  label: 'Bosses',      icon: Skull },
  { path: '/workouts',label: 'Treinamento', icon: Dumbbell },
  { path: '/nutrition',label: 'Recuperação', icon: Apple },
  { path: '/fortuna',  label: 'Fortuna',     icon: Coins },
  { path: '/rest',     label: 'Descanso',    icon: Moon },
  { path: '/settings',label: 'Ajustes',     icon: Settings },
];

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const location = useLocation();
  const state = useHunterStore();
  const { signOut } = useAuth();

  const lastPath = useRef(location.pathname);

  useEffect(() => {
    if (lastPath.current !== location.pathname) {
      onClose();
      lastPath.current = location.pathname;
    }
  }, [location.pathname, onClose]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const xpPct = Math.min(100, (state.xp / Math.max(state.xpRequired, 1)) * 100);

  const classGlowMap: Record<string, string> = {
    mage: 'glow-mage',
    assassin: 'glow-assassin',
    warrior: 'glow-warrior',
    tank: 'glow-tank',
    healer: 'glow-healer',
  };
  const activeGlow = state.hunterClass ? classGlowMap[state.hunterClass.toLowerCase()] || '' : '';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/90 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-[#0B0B0F]/90 backdrop-blur-xl shadow-2xl",
              activeGlow
            )}
          >
            {/* Logo */}
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex size-[47px] shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                  <img src="/Icon 2.png" alt="ASCEND" className="size-[47px] object-cover" />
                </div>
                <span
                  className="text-lg font-black italic tracking-tighter text-white"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  ASCEND
                </span>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-gray-500 hover:bg-white/5 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-4 py-6">
              {navItems.map((item, i) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center gap-4 rounded-xl px-4 py-4 text-xs font-bold uppercase tracking-widest transition-all',
                        isActive
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                          : 'text-gray-500 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <Icon size={18} className={isActive ? 'text-blue-500' : ''} />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Hunter footer */}
            <div className="border-t border-white/5 p-6 space-y-6">
              <div className="flex items-center gap-4 rounded-2xl bg-white/5 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-black text-white shadow-lg">
                  {state.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-white uppercase tracking-tight">{state.username || 'Hunter'}</p>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Level {state.level}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                  <span>System XP</span>
                  <span>{xpPct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={() => void signOut()}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-500"
              >
                <LogOut size={18} />
                Desconectar
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
