import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Skull,
  Trophy,
  Coins,
  Moon,
  Users,
  Settings,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Activity,
  Layers,
  Award,
} from 'lucide-react';
import { useHunterStore } from '@/stores/useHunterStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { RankBadge } from '@/components/ui/rank-badge';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { MAX_LEVEL } from '@/lib/progression';

const CLASS_IMAGE_FALLBACK = '/optimized/Classes/Warrior/Rank E.jpg';

function handleClassImageError(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied) return;
  image.dataset.fallbackApplied = 'true';
  image.src = CLASS_IMAGE_FALLBACK;
}

export function HunterHub() {
  const navigate = useNavigate();
  const state = useHunterStore();
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  const hunterName = state.username || state.fullName || l('Caçador', 'Hunter');
  const hunterClass = state.hunterClass || l('Caçador Desperto', 'Awakened Hunter');
  const safeXpRequired = Math.max(1, state.xpRequired || 100);

  // Helper para imagem da classe de acordo com o Rank
  const getRankImageName = (r: unknown): string => {
    if (typeof r !== 'string') return 'Rank E';
    const upper = r.toUpperCase();
    if (['E', 'D', 'C', 'B', 'A', 'S'].includes(upper)) return `Rank ${upper}`;
    if (upper === 'NATIONAL' || upper === 'MONARCH') return 'Rank S';
    return 'Rank E';
  };

  const rankImageName = getRankImageName(state.rank);
  const classImg = state.hunterClass
    ? `/optimized/Classes/${state.hunterClass}/${rankImageName}.jpg`
    : `/optimized/Classes/Warrior/${rankImageName}.jpg`;

  return (
    <div className="space-y-6 pb-28 sm:pb-32 text-silver">
      {/* ── 1. CABEÇALHO DE IDENTIDADE DO CAÇADOR ── */}
      <HudCard variant="cyan" corners radialGlow className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Avatar + Info Principal */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="relative size-16 sm:size-20 shrink-0 rounded-2xl overflow-hidden border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              <img
                src={classImg}
                alt={hunterClass}
                onError={handleClassImageError}
                decoding="async"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-1 right-1">
                <RankBadge rank={state.rank || 'E'} size="sm" />
              </div>
            </div>

            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-orbitron text-[9px] sm:text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400">
                  {l('CENTRAL OPERACIONAL', 'OPERATIONAL HUB')}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 truncate">
                  🏆 {state.activeTitle || l('Iniciante', 'Beginner')}
                </span>
              </div>

              <h1 className="font-orbitron text-xl sm:text-2xl font-black uppercase tracking-tight text-white truncate text-glow-cyan">
                {hunterName}
              </h1>

              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <span className="text-slate-200">{hunterClass}</span>
                <span>•</span>
                <span className="text-cyan-400 font-orbitron font-black">
                  LV.{state.level}
                </span>
                <span>•</span>
                <span className="text-amber-400 font-orbitron font-black">
                  RANK {state.rank || 'E'}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progresso Rápida de XP */}
          <div className="w-full sm:w-64 space-y-1.5 sm:border-l sm:border-white/10 sm:pl-5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider font-orbitron text-slate-400">
              <span>{l('Progresso de Nível', 'Level Progress')}</span>
              <span className="text-cyan-400 font-mono">
                {state.xp} / {safeXpRequired} XP
              </span>
            </div>
            <NeonProgressBar
              value={state.level >= MAX_LEVEL ? safeXpRequired : state.xp}
              max={safeXpRequired}
              variant="xp"
              size="sm"
              ariaLabel="Hunter XP"
            />
          </div>
        </div>
      </HudCard>

      {/* ── 2. DESTAQUE PRINCIPAL: PLAYER STATUS (FICHA COMPLETA) ── */}
      <HudCard
        variant="purple"
        corners
        radialGlow
        className="p-5 sm:p-6 border-purple-500/40 bg-gradient-to-r from-purple-950/30 via-[#0B0D14] to-cyan-950/20"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40">
                <Activity size={16} />
              </span>
              <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.18em] text-purple-400">
                {l('FICHA PRINCIPAL DO CAÇADOR', 'PRIMARY HUNTER SHEET')}
              </span>
            </div>

            <h2 className="font-orbitron text-base sm:text-xl font-black uppercase tracking-wide text-white">
              {l('Player Status // 7 Atributos & Radar Tático', 'Player Status // 7 Stats & Tactical Radar')}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed">
              {l(
                'Acesse o radar de distribuição de atributos (Força, Vitalidade, Agilidade, Inteligência, Disciplina, Sabedoria e Equilíbrio), histórico de biometria e evolução física.',
                'Access stat distribution radar (Strength, Vitality, Endurance, Intelligence, Discipline, Wisdom, and Balance), biometric logs, and physical evolution.'
              )}
            </p>
          </div>

          <TacticalButton
            onClick={() => navigate('/status')}
            variant="primary"
            accent="purple"
            className="min-h-[48px] px-6 text-xs font-black uppercase tracking-wider shrink-0 self-start md:self-center shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          >
            <span>{l('Abrir Ficha de Status', 'Open Player Status')}</span>
            <ArrowRight size={15} />
          </TacticalButton>
        </div>
      </HudCard>

      {/* ── 3. GRUPOS FUNCIONAIS DE NAVEGAÇÃO ── */}
      <div className="space-y-6">

        {/* ── GRUPO 1: DESAFIOS & CONQUISTAS ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-1 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E]" />
            <h3 className="font-orbitron text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-slate-200">
              {l('Desafios & Conquistas', 'Challenges & Achievements')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Card Boss Raids */}
            <Link
              to="/bosses"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-2xl"
            >
              <HudCard
                variant="crimson"
                className="p-4 sm:p-5 h-full transition-all duration-200 group-hover:border-rose-500/60 group-hover:bg-rose-950/20 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30 group-hover:border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)]">
                    <Skull size={22} />
                  </div>
                  <span className="font-orbitron text-[9px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-md px-2 py-0.5">
                    {l('RAID SEMANAL', 'WEEKLY RAID')}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <h4 className="font-orbitron text-sm sm:text-base font-black uppercase tracking-wide text-white group-hover:text-rose-300 transition-colors">
                    {l('Boss Raids', 'Boss Raids')}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {l(
                      'Enfrente as anomalias da semana com dano convertido de treinos, hábitos e nutrição.',
                      'Battle weekly rift anomalies with damage converted from workouts, habits, and nutrition.'
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-400 font-orbitron group-hover:translate-x-1 transition-transform">
                  <span>{l('Acessar Chefes', 'Access Bosses')}</span>
                  <ChevronRight size={14} />
                </div>
              </HudCard>
            </Link>

            {/* Card Trophy Room */}
            <Link
              to="/trophies"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-2xl"
            >
              <HudCard
                variant="gold"
                className="p-4 sm:p-5 h-full transition-all duration-200 group-hover:border-amber-500/60 group-hover:bg-amber-950/20 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30 group-hover:border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                    <Trophy size={22} />
                  </div>
                  <span className="font-orbitron text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-2 py-0.5">
                    {l('CODEX & TÍTULOS', 'CODEX & TITLES')}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <h4 className="font-orbitron text-sm sm:text-base font-black uppercase tracking-wide text-white group-hover:text-amber-300 transition-colors">
                    {l('Trophy Room', 'Trophy Room')}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {l(
                      'Galeria de medalhas de prestígio, marcos históricos e títulos oficiais equipáveis.',
                      'Gallery of prestige medals, historical milestones, and equippable official titles.'
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 font-orbitron group-hover:translate-x-1 transition-transform">
                  <span>{l('Ver Conquistas', 'View Trophies')}</span>
                  <ChevronRight size={14} />
                </div>
              </HudCard>
            </Link>
          </div>
        </div>

        {/* ── GRUPO 2: VIDA, EQUILÍBRIO & COMUNIDADE ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
            <h3 className="font-orbitron text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-slate-200">
              {l('Vida, Equilíbrio & Comunidade', 'Life, Balance & Community')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
            {/* Card Fortuna */}
            <Link
              to="/fortuna"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 rounded-2xl"
            >
              <HudCard
                variant="gold"
                className="p-4 sm:p-5 h-full transition-all duration-200 group-hover:border-amber-400/60 group-hover:bg-amber-950/20 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <Coins size={22} />
                  </div>
                  <span className="font-orbitron text-[9px] font-bold uppercase tracking-wider text-amber-300">
                    SAB · {state.stats.wisdom}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <h4 className="font-orbitron text-sm sm:text-base font-black uppercase tracking-wide text-white group-hover:text-amber-300 transition-colors">
                    {l('Fortuna', 'Fortune')}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {l(
                      'Registro de despesas diárias, metas e evolução do atributo de Sabedoria.',
                      'Daily expense tracking, financial goals, and Wisdom stat progression.'
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 font-orbitron group-hover:translate-x-1 transition-transform">
                  <span>{l('Acessar Fortuna', 'Open Fortune')}</span>
                  <ChevronRight size={14} />
                </div>
              </HudCard>
            </Link>

            {/* Card Descanso */}
            <Link
              to="/rest"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
            >
              <HudCard
                variant="cyan"
                className="p-4 sm:p-5 h-full transition-all duration-200 group-hover:border-cyan-400/60 group-hover:bg-cyan-950/20 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                    <Moon size={22} />
                  </div>
                  <span className="font-orbitron text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                    EQU · {state.stats.balance}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <h4 className="font-orbitron text-sm sm:text-base font-black uppercase tracking-wide text-white group-hover:text-cyan-300 transition-colors">
                    {l('Descanso & Recuperação', 'Recovery & Rest')}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {l(
                      'Registro de sono profundo, lazer restaurador, meditação e Equilíbrio mental.',
                      'Deep sleep tracking, restorative leisure, meditation, and mental Balance.'
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400 font-orbitron group-hover:translate-x-1 transition-transform">
                  <span>{l('Acessar Descanso', 'Open Recovery')}</span>
                  <ChevronRight size={14} />
                </div>
              </HudCard>
            </Link>

            {/* Card Social */}
            <Link
              to="/social"
              className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded-2xl"
            >
              <HudCard
                variant="purple"
                className="p-4 sm:p-5 h-full transition-all duration-200 group-hover:border-purple-400/60 group-hover:bg-purple-950/20 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    <Users size={22} />
                  </div>
                  <span className="font-orbitron text-[9px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-md px-2 py-0.5">
                    {l('GUILDA', 'GUILD')}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1">
                  <h4 className="font-orbitron text-sm sm:text-base font-black uppercase tracking-wide text-white group-hover:text-purple-300 transition-colors">
                    {l('Social & Comunidade', 'Social & Community')}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {l(
                      'Quadro competitivo de caçadores, alianças táticas e feed de evolução cooperativa.',
                      'Competitive hunter rankings, tactical alliances, and cooperative evolution feed.'
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-400 font-orbitron group-hover:translate-x-1 transition-transform">
                  <span>{l('Abrir Comunidade', 'Open Social')}</span>
                  <ChevronRight size={14} />
                </div>
              </HudCard>
            </Link>
          </div>
        </div>

        {/* ── GRUPO 3: SISTEMA & CONFIGURAÇÕES ── */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-3 w-1 rounded-full bg-slate-400 shadow-[0_0_8px_#94A3B8]" />
            <h3 className="font-orbitron text-xs sm:text-sm font-black uppercase tracking-[0.16em] text-slate-200">
              {l('Sistema & Configurações', 'System & Configuration')}
            </h3>
          </div>

          <Link
            to="/settings"
            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
          >
            <HudCard
              variant="default"
              className="p-4 sm:p-5 transition-all duration-200 group-hover:border-cyan-400/50 group-hover:bg-white/[0.03] active:scale-[0.99]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-300 border border-white/10 group-hover:border-cyan-400/40 group-hover:text-cyan-400 transition-colors">
                    <Settings size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-orbitron text-sm sm:text-base font-black uppercase tracking-wide text-white group-hover:text-cyan-300 transition-colors">
                      {l('Ajustes do Sistema', 'System Settings')}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                      {l(
                        'Preferências de interface, idioma (PT/EN), efeitos de áudio, calibração biométrica, segurança de conta e diagnóstico de nuvem.',
                        'Interface preferences, language (PT/EN), SFX, biometric calibration, account security, and cloud diagnostics.'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-400 font-orbitron group-hover:translate-x-1 transition-transform self-start sm:self-center shrink-0">
                  <span>{l('Abrir Ajustes', 'Open Settings')}</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </HudCard>
          </Link>
        </div>

      </div>
    </div>
  );
}
export default HunterHub;

