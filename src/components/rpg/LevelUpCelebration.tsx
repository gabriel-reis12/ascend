import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHunterStore } from '@/stores/useHunterStore';

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  angle: (i / 24) * 360,
  distance: 120 + Math.random() * 80,
  size: 4 + Math.random() * 6,
  color: i % 3 === 0 ? '#FBBF24' : i % 3 === 1 ? '#7C3AED' : '#D946EF',
}));

export function LevelUpCelebration() {
  const pendingLevelUp = useHunterStore((s) => s.pendingLevelUp);
  const rank = useHunterStore((s) => s.rank);
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const clearLevelUp = useHunterStore((s) => s.clearLevelUp);

  const title = hunterClass ? `${hunterClass} de Rank ${rank}` : `Caçador de Rank ${rank}`;

  useEffect(() => {
    if (!pendingLevelUp) return;
    const t = setTimeout(clearLevelUp, 4000);
    return () => clearTimeout(t);
  }, [pendingLevelUp, clearLevelUp]);

  return (
    <AnimatePresence>
      {pendingLevelUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={clearLevelUp}
        >
          <div className="relative flex flex-col items-center">
            {/* Particles */}
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
                  y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
                  scale: 0,
                }}
                transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                className="absolute rounded-full"
                style={{ width: p.size, height: p.size, background: p.color }}
              />
            ))}

            {/* Card */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="relative flex flex-col items-center gap-4 rounded-2xl border border-[#7C3AED]/60 bg-[#1C1C24] px-10 py-8 shadow-2xl shadow-[#7C3AED]/30"
            >
              <motion.div
                animate={{ rotate: [0, -8, 8, -8, 8, 0] }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-6xl"
              >
                ⚔️
              </motion.div>

              <div className="text-center">
                <p className="font-mono text-sm uppercase tracking-[0.3em] text-[#7C3AED]">
                  Level Up!
                </p>
                <motion.p
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, delay: 0.15 }}
                  className="mt-1 font-display text-6xl font-bold text-[#FBBF24]"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {pendingLevelUp}
                </motion.p>
                <p className="mt-2 text-sm text-[#94A3B8]">
                  Você agora é um <span className="font-semibold text-[#E2E8F0]">{title}</span>
                </p>
              </div>

              <p className="text-xs text-[#94A3B8]">clique para continuar</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
