import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Dumbbell, Apple, Settings, LogOut, Menu, AlertTriangle, LayoutGrid, Skull, Coins, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHunterStore } from '@/stores/useHunterStore';
import { useAuth } from '@/contexts/AuthContext';
import { MobileMenu } from './MobileMenu';
import { supabase } from '@/lib/supabase';
import { usePreferences } from '@/contexts/preferences';
import { MAX_LEVEL } from '@/lib/progression';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';

const navItems = [
  { path: '/', labelKey: 'nav.portal' as const, icon: LayoutGrid },
  { path: '/status', labelKey: 'nav.status' as const, icon: LayoutDashboard },
  { path: '/quests', labelKey: 'nav.quests' as const, icon: CheckSquare },
  { path: '/bosses', labelKey: 'nav.bosses' as const, icon: Skull },
  { path: '/workouts', labelKey: 'nav.workouts' as const, icon: Dumbbell },
  { path: '/nutrition', labelKey: 'nav.nutrition' as const, icon: Apple },
  { path: '/fortuna', labelKey: 'nav.fortuna' as const, icon: Coins },
  { path: '/rest', labelKey: 'nav.rest' as const, icon: Moon },
  { path: '/settings', labelKey: 'nav.settings' as const, icon: Settings },
];

export function RPGLayout() {
  const location = useLocation();
  const state = useHunterStore();
  const { signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const { language, t } = usePreferences();

  useEffect(() => {
    async function checkConnection() {
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setSupabaseError(t('errors.supabaseKeysMissing'));
        return;
      }
      try {
        const { error } = await supabase.from('exercises').select('id').limit(1);
        if (error) {
          setSupabaseError(error.message);
        }
      } catch (err: any) {
        setSupabaseError(err.message || String(err));
      }
    }
    void checkConnection();
  }, [t]);

  // Se o username não estiver preenchido, talvez o profile ainda esteja carregando
  // Mas vamos deixar renderizar com fallback se necessário.
  const xpPct = state.level >= MAX_LEVEL
    ? 100
    : state.xpRequired > 0
      ? Math.min(100, (state.xp / state.xpRequired) * 100)
      : 0;
  const hunterName = state.username || state.fullName || 'Hunter';
  const hunterClass = state.hunterClass || t('common.classUndefined');

  return (
    <div className="flex h-screen bg-[#0B0B0F] text-[#C9CED6] overflow-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0B0B0F]">

        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <img
              src="/Icon 2.png"
              alt="ASCEND"
              className="size-[52px] object-cover"
            />
          </div>
          <span
            className="text-xl font-black italic tracking-tighter text-white"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            ASCEND
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const navTourIds: Record<string, string> = {
              '/workouts': 'tour-nav-workouts',
              '/nutrition': 'tour-nav-nutrition',
            };
            return (
              <Link
                key={item.path}
                to={item.path}
                id={navTourIds[item.path]}
                className={cn(
                  'group flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-bold tracking-wide transition-all duration-200',
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.2)]'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <Icon
                  size={20}
                  className={cn(
                    'shrink-0 transition-colors',
                    isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-gray-200'
                  )}
                />
                <span className="uppercase tracking-widest text-[11px]">{t(item.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Hunter profile footer */}
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Avatar + info */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-black text-white shadow-lg">
              {state.rank}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black uppercase tracking-tight text-white">{hunterName}</p>
              <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-gray-400">
                {hunterClass} <span className="text-gray-600">•</span> Rank {state.rank}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">{t('common.level')} {state.level}</p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="px-1">
            <div className="mb-1.5 flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
              <span>{t('common.systemXp')}</span>
              <span>{state.xp} / {state.xpRequired}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${xpPct}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              />
            </div>
          </div>

          {/* Sign out */}
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut size={16} />
            {t('common.disconnect')}
          </button>
        </div>
      </aside>

      {/* ── Mobile Menu ──────────────────────────────────── */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[#0B0B0F]">

        {/* Mobile top bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-4 border-b border-white/5 bg-[#0B0B0F] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 text-gray-500 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <img
            src="/Icon 2.png"
            alt="ASCEND"
            className="h-[47px] w-[47px] object-cover rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          />
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-black text-white shadow-lg">
              {state.rank}
            </div>
          </div>
        </header>

        {/* Desktop top bar */}
        <div className="hidden md:flex items-center justify-between border-b border-white/5 bg-[#0B0B0F] px-8 py-4 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
            {new Date().toLocaleDateString(language, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">
                {t('common.status')}: {t('common.active')}
              </span>
              <span className="text-xs font-black text-white uppercase tracking-tight">{state.username || 'Hunter'}</span>
            </div>
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)] animate-pulse" />
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {supabaseError && (
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="flex-1 font-orbitron text-[11px] leading-relaxed">
                  {t('common.warning')}: {t('errors.supabaseConnection')} ({supabaseError})
                </span>
                <Link to="/settings" className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-black transition-all active:scale-95 text-[10px] uppercase tracking-wider border border-rose-500/20 shrink-0">
                  {t('common.diagnose')}
                </Link>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
