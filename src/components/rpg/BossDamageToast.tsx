import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Flame, RefreshCcw, Skull, Swords } from 'lucide-react';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { useBossStore } from '@/stores/useBossStore';
import { usePreferences } from '@/contexts/preferences';
import { triggerGameFeel } from '@/lib/gameFeel';

export function BossDamageToast() {
  const location = useLocation();
  const recentDamage = useBossStore((s) => s.recentDamage);
  const activeBattle = useBossStore((s) => s.activeBattle);
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const prefersReducedMotion = useReducedMotion();

  const lastPlayedDamageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!recentDamage || !recentDamage.id) return;
    if (lastPlayedDamageIdRef.current === recentDamage.id) return;
    lastPlayedDamageIdRef.current = recentDamage.id;

    if (recentDamage.damage > 0) {
      triggerGameFeel('bossHit');
    }
  }, [recentDamage]);

  // Evita feedback visual duplicado quando o usuário já está dentro da arena /bosses (Req 7.3)
  if (!recentDamage || !activeBattle || recentDamage.damage === 0 || location.pathname === '/bosses') {
    return null;
  }

  const isDamage = recentDamage.damage > 0;
  const absDelta = Math.abs(recentDamage.damage);
  const hpPercent = Math.max(
    0,
    Math.min(100, Math.round((activeBattle.current_hp / Math.max(1, activeBattle.max_hp)) * 100))
  );

  return (
    <AnimatePresence>
      <motion.div
        key={recentDamage.id}
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed top-16 sm:top-20 left-1/2 z-[65] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2"
      >
        <div
          className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${
            isDamage
              ? recentDamage.isCritical
                ? 'border-amber-400/50 bg-[#140D0B]/95 shadow-[0_0_30px_rgba(245,158,11,0.28)]'
                : 'border-rose-500/45 bg-[#120A10]/95 shadow-[0_0_28px_rgba(244,63,94,0.25)]'
              : 'border-slate-500/40 bg-[#0B0F17]/95'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${
                  isDamage
                    ? recentDamage.isCritical
                      ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                      : 'border-rose-500/40 bg-rose-500/15 text-rose-400'
                    : 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                }`}
              >
                {isDamage ? (
                  recentDamage.isCritical ? (
                    <Flame className="h-4 w-4" />
                  ) : (
                    <Swords className="h-4 w-4" />
                  )
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Skull className="h-3 w-3 text-rose-400 shrink-0" />
                  <span className="truncate font-orbitron text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    {activeBattle.name}
                  </span>
                  {isDamage && recentDamage.isCritical && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 font-orbitron text-[8px] font-black uppercase text-amber-300">
                      {l('CRÍTICO!', 'CRITICAL!')}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {isDamage
                    ? l('Dano confirmado na Raid Semanal', 'Confirmed Weekly Raid Damage')
                    : l('Ação desmarcada • HP regenerado', 'Action unchecked • HP regenerated')}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span
                className={`font-orbitron text-sm sm:text-base font-black tabular-nums ${
                  isDamage
                    ? recentDamage.isCritical
                      ? 'text-amber-300'
                      : 'text-rose-400'
                    : 'text-emerald-300'
                }`}
              >
                {isDamage ? `-${absDelta} HP` : `+${absDelta} HP`}
              </span>
              <span className="block font-orbitron text-[9px] font-bold text-slate-400 tabular-nums">
                {activeBattle.current_hp} / {activeBattle.max_hp} ({hpPercent}%)
              </span>
            </div>
          </div>

          <div className="mt-2">
            <NeonProgressBar
              value={activeBattle.current_hp}
              max={Math.max(1, activeBattle.max_hp)}
              variant="boss-hp"
              size="sm"
              ariaLabel="Boss HP"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
