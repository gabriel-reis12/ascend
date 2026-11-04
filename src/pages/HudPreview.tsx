import React, { useState } from 'react';
import { ChevronRight, Dumbbell, Flame, Shield, Sparkles, Swords, Utensils } from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar, NeonProgressRing } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';
import { usePreferences } from '@/contexts/preferences';

export function HudPreview() {
  const { language, theme, toggleTheme } = usePreferences();
  const isEn = language === 'en-US';
  const [xpDemo, setXpDemo] = useState(68);
  const [bossHpDemo, setBossHpDemo] = useState(6500);
  const [loadingDemo, setLoadingDemo] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--hud-bg)] text-[var(--text-primary)] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header da Sandbox */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--hud-border)] pb-5">
          <div>
            <span className="font-orbitron text-[10px] font-bold uppercase tracking-[0.25em] text-[#00F0FF]">
              ASCEND HUD v2 • Design System Sandbox
            </span>
            <h1 className="mt-1 font-orbitron text-2xl font-black uppercase tracking-wider">
              {isEn ? 'HUD Components & Tokens' : 'Componentes & Tokens HUD'}
            </h1>
          </div>

          <TacticalButton
            variant="ghost"
            onClick={toggleTheme}
          >
            {isEn ? `Theme: ${theme.toUpperCase()}` : `Tema: ${theme.toUpperCase()}`}
          </TacticalButton>
        </div>

        {/* 1. Rank Badges */}
        <HudCard corners variant="elevated">
          <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-4">
            1. RankBadge (E → S)
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            {(['E', 'D', 'C', 'B', 'A', 'S'] as const).map((r) => (
              <div key={r} className="flex flex-col items-center gap-2">
                <RankBadge rank={r} size="lg" showLabel />
                <span className="font-orbitron text-[10px] font-bold text-[#94A3B8]">
                  Rank {r}
                </span>
              </div>
            ))}
          </div>
        </HudCard>

        {/* 2. Progress Rings & Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HudCard corners variant="cyan">
            <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-[#00F0FF] mb-4">
              2. NeonProgressRing (Dual & Single)
            </h2>
            <div className="flex items-center justify-around py-2">
              <NeonProgressRing value={xpDemo} secondaryValue={Math.max(10, xpDemo - 12)} size={136} variant="cyan-purple">
                <span className="font-orbitron text-2xl font-black text-[#00F0FF] text-glow-cyan">
                  {xpDemo}%
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                  {isEn ? 'Daily' : 'Diário'}
                </span>
              </NeonProgressRing>

              <NeonProgressRing value={60} size={116} variant="cyan">
                <span className="font-orbitron text-xl font-black text-white">
                  3 / 5
                </span>
                <span className="text-[10px] font-semibold text-[#94A3B8]">
                  (60%)
                </span>
              </NeonProgressRing>
            </div>
          </HudCard>

          <HudCard corners variant="purple">
            <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-[#A855F7] mb-4">
              3. NeonProgressBar (XP & Boss HP)
            </h2>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                  <span className="font-orbitron text-[#00F0FF]">LEVEL 24</span>
                  <span className="font-orbitron text-[#94A3B8]">14,250 / 18,000 XP</span>
                </div>
                <NeonProgressBar value={14250} max={18000} variant="xp" size="md" ariaLabel="XP Progress" />
              </div>

              <div className="space-y-2">
                <span className="font-orbitron text-[11px] font-bold uppercase tracking-wider text-[#EF4444]">
                  THE PROCRASTINATION LORD
                </span>
                <NeonProgressBar
                  value={bossHpDemo}
                  max={10000}
                  variant="boss-hp"
                  centerLabel={`HP ${bossHpDemo.toLocaleString()} / 10,000`}
                  ariaLabel="Boss HP"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setXpDemo((v) => (v >= 100 ? 25 : v + 15));
                    setBossHpDemo((hp) => Math.max(0, hp - 1250));
                  }}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
                >
                  {isEn ? 'Simulate Progress / Attack' : 'Simular Progresso / Ataque'}
                </button>
              </div>
            </div>
          </HudCard>
        </div>

        {/* 3. Tactical Buttons */}
        <HudCard corners>
          <h2 className="font-orbitron text-xs font-bold uppercase tracking-[0.2em] text-[#94A3B8] mb-4">
            4. TacticalButton Variants (Min Height 52px)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TacticalButton
              variant="secondary"
              accent="cyan"
              leftIcon={<Sparkles className="h-4 w-4 text-[#00F0FF]" />}
              rightIcon={<ChevronRight className="h-4 w-4" />}
              fullWidth
            >
              {isEn ? 'Complete mission' : 'Completar missão'}
            </TacticalButton>

            <TacticalButton
              variant="secondary"
              accent="purple"
              leftIcon={<Dumbbell className="h-4 w-4 text-[#A855F7]" />}
              rightIcon={<ChevronRight className="h-4 w-4" />}
              fullWidth
            >
              {isEn ? 'Log workout' : 'Registrar treino'}
            </TacticalButton>

            <TacticalButton
              variant="secondary"
              accent="cyan"
              leftIcon={<Utensils className="h-4 w-4 text-[#10B981]" />}
              rightIcon={<ChevronRight className="h-4 w-4" />}
              fullWidth
            >
              {isEn ? 'Register meal' : 'Registrar refeição'}
            </TacticalButton>

            <TacticalButton
              variant="primary"
              displayFont
              loading={loadingDemo}
              onClick={() => {
                setLoadingDemo(true);
                setTimeout(() => setLoadingDemo(false), 900);
              }}
              fullWidth
            >
              {isEn ? 'START WORKOUT' : 'INICIAR TREINO'}
            </TacticalButton>

            <TacticalButton
              variant="danger"
              displayFont
              leftIcon={<Swords className="h-4 w-4" />}
              fullWidth
              className="sm:col-span-2"
            >
              {isEn ? 'ATTACK! (LOG COMPLETED TASKS)' : 'ATACAR! (REGISTRAR MISSÕES CONCLUÍDAS)'}
            </TacticalButton>
          </div>
        </HudCard>

        {/* 4. HudCard Semantic Variants */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <HudCard variant="success">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-[#10B981]">
                COMPLETED
              </span>
              <span className="font-orbitron text-xs font-bold text-[#F59E0B]">+50 XP</span>
            </div>
            <p className="mt-2 text-sm font-semibold">Complete Strength Training</p>
          </HudCard>

          <HudCard variant="purple">
            <div className="flex items-center justify-between">
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest text-[#00F0FF]">
                IN PROGRESS
              </span>
              <span className="font-orbitron text-xs font-bold text-[#F59E0B]">+30 XP</span>
            </div>
            <p className="mt-2 text-sm font-semibold">Study for 45 Minutes</p>
          </HudCard>

          <HudCard variant="gold" corners>
            <div className="flex items-center gap-2 text-[#F59E0B]">
              <Shield className="h-4 w-4" />
              <span className="font-orbitron text-[10px] font-bold uppercase tracking-widest">
                RARE ACHIEVEMENT
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold">Procrastination Buster</p>
          </HudCard>
        </div>
      </div>
    </div>
  );
}

