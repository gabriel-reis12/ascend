import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Dumbbell,
  Apple,
  Settings,
  LogOut,
  Menu,
  AlertTriangle,
  LayoutGrid,
  Skull,
  Coins,
  Moon,
  Trophy,
  Users,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHunterStore } from '@/stores/useHunterStore';
import { useAuth } from '@/contexts/AuthContext';
import { MobileMenu } from './MobileMenu';
import { BottomNav } from './BottomNav';
import { supabase } from '@/lib/supabase';
import { usePreferences } from '@/contexts/preferences';
import { MAX_LEVEL } from '@/lib/progression';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { RankBadge } from '@/components/ui/rank-badge';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { EvolutionCelebrationModal } from '@/components/rpg/EvolutionCelebrationModal';
import { BossDamageToast } from '@/components/rpg/BossDamageToast';

const navItems = [
  { path: '/', labelKey: 'nav.portal' as const, icon: LayoutGrid },
  { path: '/hub', labelKey: 'nav.hub' as const, icon: Compass },
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

export function RPGLayout() {
  const location = useLocation();
  const navigate = useNavigate();
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
      if (!import.meta.env.DEV) return;
      try {
        const { error } = await supabase.from('exercises').select('id').limit(1);
        if (error) {
          setSupabaseError(error.message);
        }
      } catch (err: unknown) {
        setSupabaseError(err instanceof Error ? err.message : String(err));
      }
    }
    void checkConnection();
  }, [t]);

  const safeXpRequired = Math.max(1, state.xpRequired || 100);
  const xpPct =
    state.level >= MAX_LEVEL
      ? 100
      : Math.min(100, (state.xp / safeXpRequired) * 100);
  const hunterName = state.username || state.fullName || 'Hunter';
  const hunterClass = state.hunterClass || t('common.classUndefined');
  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-[100dvh] bg-[var(--hud-bg,#07080C)] text-[#C9CED6] overflow-hidden">
      {/* ── Desktop Sidebar ─────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-white/5 bg-[#0B0B0F]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="flex size-[52px] shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <img
              src="/optimized/Icon 2.png"
              alt="ASCEND"
              decoding="async"
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
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-none">
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
            <RankBadge rank={state.rank} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black uppercase tracking-tight text-white">
                {hunterName}
              </p>
              <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-gray-400">
                {hunterClass} <span className="text-gray-600">•</span> Rank {state.rank}
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                {t('common.level')} {state.level}
              </p>
            </div>
          </div>

          {/* XP Bar */}
          <div className="px-1">
            <div className="mb-1.5 flex justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
              <span>{t('common.systemXp')}</span>
              <span>
                {state.xp} / {state.xpRequired}
              </span>
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
            type="button"
            onClick={() => void handleSignOut()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-600 transition-colors hover:bg-red-500/10 hover:text-red-500"
          >
            <LogOut size={16} />
            {t('common.disconnect')}
          </button>
        </div>
      </aside>

      {/* ── Mobile Menu Drawer (Acesso completo a Bosses, Fortuna, Descanso, Ajustes e Logout) ── */}
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* ── Main Content Wrapper ─────────────────────────── */}
      <main className="flex flex-1 flex-col overflow-hidden bg-[var(--hud-bg,#07080C)]">
        {/* ── Mobile Compact HUD Header ──────────────────── */}
        <header
          className="md:hidden shrink-0 border-b border-[var(--hud-border-strong)] bg-[var(--hud-surface-glass)] backdrop-blur-xl z-20"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
            {/* Esquerda: Botão Menu de Módulos + Identidade ASCEND */}
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={language === 'pt-BR' ? 'Abrir menu de módulos' : 'Open modules menu'}
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#94A3B8] transition-colors hover:border-[#00F0FF]/40 hover:text-white active:scale-95"
              >
                <Menu size={19} />
              </button>

              <Link
                to="/"
                className="flex min-w-0 items-center gap-2 rounded-lg py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
              >
                <img
                  src="/optimized/Icon 2.png"
                  alt="ASCEND"
                  decoding="async"
                  className="size-7 shrink-0 rounded-lg object-cover shadow-[0_0_12px_rgba(0,240,255,0.28)]"
                />
                <span className="truncate font-orbitron text-sm sm:text-base font-black tracking-[0.14em] text-[#00F0FF] text-glow-cyan">
                  ASCEND
                </span>
              </Link>

              {location.pathname === '/' && (
                <span className="hidden xs:inline-flex items-center rounded-md border border-white/15 bg-gradient-to-b from-slate-700/60 to-slate-900/80 px-2 py-0.5 font-orbitron text-[9px] font-bold uppercase tracking-[0.16em] text-slate-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                  {language === 'en-US' ? 'PLAYER' : 'CAÇADOR'}
                </span>
              )}
            </div>

            {/* Direita: Indicador Compacto de Nível/XP (nas telas internas) + Idioma + Ajustes */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {location.pathname !== '/' && (
                <Link
                  to="/status"
                  aria-label={`${t('common.level')} ${state.level} — ${state.xp}/${state.xpRequired} XP`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1 transition-colors hover:border-[#00F0FF]/40"
                >
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 leading-none">
                      <span className="font-orbitron text-[10px] font-black uppercase tracking-wider text-white">
                        LV.{state.level}
                      </span>
                      <span className="hidden xs:inline font-orbitron text-[9px] font-semibold text-[#94A3B8] tabular-nums">
                        {state.xp}/{state.xpRequired}
                      </span>
                    </div>
                    <div className="mt-1 w-14 sm:w-20">
                      <NeonProgressBar
                        value={state.level >= MAX_LEVEL ? safeXpRequired : state.xp}
                        max={safeXpRequired}
                        variant="xp"
                        size="sm"
                        ariaLabel="Hunter XP"
                      />
                    </div>
                  </div>
                  <RankBadge rank={state.rank} size="sm" />
                </Link>
              )}

              <LanguageSwitcher compact />

              <Link
                to="/settings"
                aria-label={t('nav.settings')}
                title={t('nav.settings')}
                className={cn(
                  'inline-flex size-10 shrink-0 items-center justify-center rounded-xl border transition-colors active:scale-95',
                  location.pathname === '/settings'
                    ? 'border-[#00F0FF]/50 bg-[#00F0FF]/10 text-[#00F0FF]'
                    : 'border-white/10 bg-white/[0.03] text-[#94A3B8] hover:border-white/25 hover:text-white'
                )}
              >
                <Settings size={18} />
              </Link>
            </div>
          </div>
        </header>

        {/* ── Desktop Top Bar ────────────────────────────── */}
        <div className="hidden md:flex items-center justify-between border-b border-white/5 bg-[#0B0B0F] px-8 py-4 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500">
            {new Date().toLocaleDateString(language, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <div className="flex items-center gap-3">
            <LanguageSwitcher compact />
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest italic">
                {t('common.status')}: {t('common.active')}
              </span>
              <span className="text-xs font-black text-white uppercase tracking-tight">
                {state.username || 'Hunter'}
              </span>
            </div>
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)] animate-pulse" />
          </div>
        </div>

        {/* ── Page Content Scroll Container ──────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {supabaseError && (
            <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs font-semibold uppercase tracking-wider shadow-[0_0_15px_rgba(239,68,68,0.05)]">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="flex-1 font-orbitron text-[11px] leading-relaxed">
                  {t('common.warning')}: {t('errors.supabaseConnection')} ({supabaseError})
                </span>
                <Link
                  to="/settings"
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 font-black transition-all active:scale-95 text-[10px] uppercase tracking-wider border border-rose-500/20 shrink-0"
                >
                  {t('common.diagnose')}
                </Link>
              </div>
            </div>
          )}
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-4 pb-28 sm:pt-8 md:pb-8">
            <Outlet />
          </div>
        </div>

        {/* ── Mobile Fixed Bottom Navigation ─────────────── */}
        <BottomNav />
      </main>

      {/* ── Feedback Global de Evolução (Level-Up / Rank-Up) e Dano em Boss ── */}
      <EvolutionCelebrationModal />
      <BossDamageToast />
    </div>
  );
}
