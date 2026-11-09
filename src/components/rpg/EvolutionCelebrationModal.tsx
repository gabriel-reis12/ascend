import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, Crown, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { RankBadge } from '@/components/ui/rank-badge';
import { useHunterStore } from '@/stores/useHunterStore';
import { usePreferences } from '@/contexts/preferences';
import { triggerGameFeel } from '@/lib/gameFeel';

export function EvolutionCelebrationModal() {
  const pendingLevelUp = useHunterStore((s) => s.pendingLevelUp);
  const pendingRankUp = useHunterStore((s) => s.pendingRankUp);
  const rank = useHunterStore((s) => s.rank);
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const clearLevelUp = useHunterStore((s) => s.clearLevelUp);

  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);
  const prefersReducedMotion = useReducedMotion();

  const lastAnnouncedKeyRef = useRef<string | null>(null);

  const isOpen = pendingLevelUp !== null;
  const isRankPromotion = Boolean(pendingRankUp && pendingRankUp.newRank !== pendingRankUp.previousRank);

  useEffect(() => {
    if (pendingLevelUp === null) return;
    const eventKey = `${pendingLevelUp}:${pendingRankUp?.newRank ?? rank}`;
    if (lastAnnouncedKeyRef.current === eventKey) return;
    lastAnnouncedKeyRef.current = eventKey;

    triggerGameFeel(isRankPromotion ? 'rankUp' : 'levelUp');
  }, [pendingLevelUp, pendingRankUp, rank, isRankPromotion]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evolution-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
          onClick={clearLevelUp}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.92, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-md"
        >
          <HudCard
            variant={isRankPromotion ? 'gold' : 'cyan'}
            corners
            radialGlow
            className={`p-6 sm:p-7 text-center space-y-5 border ${
              isRankPromotion
                ? 'border-amber-400/50 bg-[#120E08]/95 shadow-[0_0_50px_rgba(245,158,11,0.28)]'
                : 'border-[#00F0FF]/45 bg-[#080D18]/95 shadow-[0_0_45px_rgba(0,240,255,0.22)]'
            }`}
          >
            {/* Top System Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1">
              {isRankPromotion ? (
                <Crown className="h-3.5 w-3.5 text-amber-400" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" />
              )}
              <span
                className={`font-orbitron text-[10px] font-black uppercase tracking-[0.22em] ${
                  isRankPromotion ? 'text-amber-300' : 'text-[#00F0FF]'
                }`}
              >
                {isRankPromotion
                  ? l('PROMOÇÃO DE RANK OFICIAL', 'OFFICIAL RANK PROMOTION')
                  : l('NOTIFICAÇÃO DO SISTEMA • LEVEL UP', 'SYSTEM NOTIFICATION • LEVEL UP')}
              </span>
            </div>

            {/* Center Badge / Level Display */}
            <div className="space-y-3 py-1">
              {isRankPromotion && pendingRankUp ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center justify-center gap-3">
                    <RankBadge rank={pendingRankUp.previousRank} size="md" />
                    <ArrowRight className="h-5 w-5 text-amber-400" />
                    <RankBadge rank={pendingRankUp.newRank} size="lg" />
                  </div>
                  <h2
                    id="evolution-modal-title"
                    className="font-orbitron text-2xl sm:text-3xl font-black uppercase tracking-wider text-white"
                  >
                    {l(
                      `Despertar de Rank ${pendingRankUp.newRank}!`,
                      `Rank ${pendingRankUp.newRank} Awakening!`
                    )}
                  </h2>
                  <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed max-w-sm mx-auto">
                    {l(
                      `Você alcançou o Nível ${pendingLevelUp} e rompeu a barreira do Rank ${pendingRankUp.previousRank}. Sua presença na Fenda e sua aura de caçador evoluíram!`,
                      `You reached Level ${pendingLevelUp} and broke through Rank ${pendingRankUp.previousRank}. Your presence in the Gate and hunter aura have evolved!`
                    )}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-[#00F0FF]/40 bg-[#00F0FF]/10 shadow-[0_0_28px_rgba(0,240,255,0.2)]">
                    <span className="font-orbitron text-3xl sm:text-4xl font-black text-white tabular-nums">
                      {pendingLevelUp}
                    </span>
                  </div>
                  <h2
                    id="evolution-modal-title"
                    className="font-orbitron text-xl sm:text-2xl font-black uppercase tracking-wider text-white"
                  >
                    {l(`Nível ${pendingLevelUp} Alcançado!`, `Level ${pendingLevelUp} Reached!`)}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-sm mx-auto">
                    {l(
                      'Sua consistência real fortaleceu seus atributos. O Sistema registrou sua evolução com sucesso.',
                      'Your real-world consistency strengthened your attributes. The System has recorded your evolution.'
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Status Summary Strip */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span className="font-semibold">
                  {hunterClass || l('Caçador Desperto', 'Awakened Hunter')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-[#00F0FF]" />
                <span className="font-orbitron text-[11px] font-bold uppercase text-white">
                  {l('Nível', 'Level')} {pendingLevelUp} • Rank {rank}
                </span>
              </div>
            </div>

            {/* Action Button */}
            <TacticalButton
              type="button"
              variant="primary"
              accent={isRankPromotion ? 'gold' : 'cyan'}
              displayFont
              onClick={clearLevelUp}
              className="w-full min-h-[48px] text-xs sm:text-sm font-black uppercase tracking-wider"
            >
              {l('Continuar Evolução', 'Continue Evolution')}
            </TacticalButton>
          </HudCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
