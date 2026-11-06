import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Sword, 
  Flame, 
  Crown, 
  Award, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  RotateCcw,
  Info,
  CheckCircle2,
  Brain,
  Scale,
  Compass,
  Heart,
  Timer,
  Activity,
  Gift,
  Lock,
  Swords,
  TrendingDown,
  TrendingUp,
  Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { 
  useBossStore, 
  BOSS_LIST, 
  getBossRaidDeadline, 
  calculateRaidRemainingTime, 
  getRaidLifecycleState, 
  formatRaidDeadlineLocal 
} from '@/stores/useBossStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import type { HudCardVariant } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { RankBadge } from '@/components/ui/rank-badge';

const EN_BOSS_COPY: Record<string, {
  name: string;
  titleReward: string;
  lore: string;
  victoryLore: string;
  weakness: string;
}> = {
  boss_01: {
    name: 'The Lord of Procrastination',
    titleReward: 'Relentless Executor',
    lore: 'A colossal entity forged from chains, broken clocks, and abandoned missions. It grows stronger whenever unfinished work accumulates.',
    victoryLore: 'You broke the chains of delay and reclaimed your time. The Rift recognizes you as a Relentless Executor.',
    weakness: 'Complete daily tasks and regular quests.',
  },
  boss_02: {
    name: 'The King of Sloth',
    titleReward: 'The Tireless',
    lore: 'An immovable creature seated on a throne of stone and decay, draining the energy of every Hunter who approaches.',
    victoryLore: 'Your training shattered the throne and dispersed its lethargy. Nothing can stop your advance.',
    weakness: 'Complete workouts in the Training Center.',
  },
  boss_03: {
    name: 'The Siren of Distraction',
    titleReward: 'Master of Focus',
    lore: 'An ethereal entity surrounded by notifications and endless screens, feeding on fragmented attention.',
    victoryLore: 'You silenced the digital noise and recovered deep focus. Empty lights no longer command your mind.',
    weakness: 'Complete reading, study, and deep-focus activities.',
  },
  boss_04: {
    name: 'The Devourer of Progress',
    titleReward: 'Master of Discipline',
    lore: 'A creature shaped by excess and instant gratification, persuading Hunters to trade long-term growth for short-lived comfort.',
    victoryLore: 'Your nutritional discipline starved the creature of excess. Consistency became your shield.',
    weakness: 'Log meals and stay within your nutrition targets.',
  },
  boss_05: {
    name: 'The Merchant of Debt',
    titleReward: 'Guardian of Freedom',
    lore: 'A dimensional merchant whose tempting offers conceal chains that bind future freedom.',
    victoryLore: 'By controlling expenses and resisting impulse purchases, you broke the golden contract.',
    weakness: 'Track finances, control expenses, and record investments.',
  },
  boss_06: {
    name: 'The Herald of Chaos',
    titleReward: 'Master of Clarity',
    lore: 'A silent catastrophe that turns priorities into noise and motion into directionless activity.',
    victoryLore: 'Clear priorities and organized routines dispersed the fog. The path is visible again.',
    weakness: 'Plan your week, set priorities, and organize your environment.',
  },
  boss_07: {
    name: 'The Reflection of Self-Sabotage',
    titleReward: 'The Purified',
    lore: 'The final enemy is a reflection built from every version of you that once chose to quit.',
    victoryLore: 'You overcame the weakest reflection of yourself and completed the final purification.',
    weakness: 'Maintain long daily streaks and consistent activity.',
  },
};

export function Bosses() {
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const activeBattle = useBossStore((state) => state.activeBattle);
  const defeatedBossIds = useBossStore((state) => state.defeatedBossIds);
  const bossLoading = useBossStore((state) => state.loading);
  const bossError = useBossStore((state) => state.error);
  const recentDamage = useBossStore((state) => state.recentDamage);
  const loadActiveBattle = useBossStore((state) => state.loadActiveBattle);
  const attackActiveBoss = useBossStore((state) => state.attackActiveBoss);
  const purifyActiveBoss = useBossStore((state) => state.purifyActiveBoss);
  const resetBattle = useBossStore((state) => state.resetBattle);
  const retryExpiredBattle = useBossStore((state) => state.retryExpiredBattle);
  const { language, t } = usePreferences();
  const l = (pt: string, en: string) => language === 'en-US' ? en : pt;
  const reduceMotion = useReducedMotion();
  const manualAttackKey = user?.id && activeBattle
    ? `ascend_manual_boss_attack_${user.id}_${activeBattle.id}`
    : null;
  const [manualAttackUsedToday, setManualAttackUsedToday] = useState(false);
  const [purifying, setPurifying] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [showAttackFeed, setShowAttackFeed] = useState(false);
  const [feedDamage, setFeedDamage] = useState(0);
  const [feedCritical, setFeedCritical] = useState(false);
  const [raidReferenceTime, setRaidReferenceTime] = useState(() => Date.now());
  const [combatEvents, setCombatEvents] = useState<Array<{
    id: string;
    damage: number;
    critical: boolean;
    time: string;
  }>>([]);

  // Atualização em tempo real do temporizador a cada 1 segundo (1000ms)
  useEffect(() => {
    const timer = window.setInterval(() => setRaidReferenceTime(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Carrega a batalha ativa quando o componente monta
  useEffect(() => {
    if (user?.id) {
      void loadActiveBattle(user.id);
    }
  }, [user?.id, loadActiveBattle]);

  useEffect(() => {
    if (!manualAttackKey) {
      setManualAttackUsedToday(false);
      return;
    }
    setManualAttackUsedToday(localStorage.getItem(manualAttackKey) === new Date().toLocaleDateString('en-CA'));
  }, [manualAttackKey]);

  useEffect(() => {
    if (!user?.id) return;
    const key = `ascend_boss_combat_events_${user.id}`;
    try {
      const persisted = JSON.parse(localStorage.getItem(key) || '[]') as Array<{
        id: string;
        damage: number;
        critical: boolean;
        occurredAt: string;
      }>;
      setCombatEvents(persisted.slice(0, 5).map(event => ({
        id: event.id,
        damage: event.damage,
        critical: event.critical,
        time: new Date(event.occurredAt).toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }),
      })));
    } catch {
      setCombatEvents([]);
    }
  }, [language, user?.id]);

  // Monitora alterações de dano recente para exibir animação de floating numbers
  useEffect(() => {
    if (!recentDamage) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = window.requestAnimationFrame(() => {
      setFeedDamage(recentDamage.damage);
      setFeedCritical(recentDamage.isCritical);
      setShowAttackFeed(true);
      setCombatEvents((current) => [
        {
          id: recentDamage.id,
          damage: recentDamage.damage,
          critical: recentDamage.isCritical,
          time: new Date().toLocaleTimeString(language, { hour: '2-digit', minute: '2-digit' }),
        },
        ...current.filter(event => event.id !== recentDamage.id),
      ].slice(0, 5));
      timer = setTimeout(() => setShowAttackFeed(false), 2000);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [language, recentDamage]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 uppercase tracking-widest font-orbitron">
          {l('Acesso restrito — Faça login para entrar na fenda.', 'Restricted access — Sign in to enter the Rift.')}
        </p>
      </div>
    );
  }

  const bossDef = activeBattle ? BOSS_LIST.find(b => b.id === activeBattle.boss_id) : null;
  const localizedBoss = bossDef && language === 'en-US' ? EN_BOSS_COPY[bossDef.id] : null;
  const localizedWeaknessCategory = bossDef && language === 'en-US'
    ? ({
        task: 'tasks',
        workout: 'workouts',
        foco: 'focus',
        nutrition: 'nutrition',
        finance: 'finance',
        organization: 'organization',
        streak: 'streaks',
      }[bossDef.weaknessCategory] || bossDef.weaknessCategory)
    : bossDef?.weaknessCategory;

  const hpPercent = activeBattle ? (activeBattle.current_hp / activeBattle.max_hp) * 100 : 0;
  const damageDealt = activeBattle ? activeBattle.max_hp - activeBattle.current_hp : 0;

  // Cálculo determinístico do prazo e contagem regressiva
  const raidDeadline = activeBattle ? getBossRaidDeadline(activeBattle) : null;
  const remaining = calculateRaidRemainingTime(raidDeadline, raidReferenceTime);
  const lifecycleState = getRaidLifecycleState(activeBattle, raidReferenceTime);
  const isRaidExpired = lifecycleState === 'expired_loss';
  const isCriticalDeadline = remaining.isCritical && !remaining.isExpired && Boolean(activeBattle && activeBattle.current_hp > 0);
  const formattedDeadlineSaoPaulo = formatRaidDeadlineLocal(raidDeadline, language);

  const raidRisk = hpPercent > 70 ? t('bosses.high') : hpPercent > 30 ? t('bosses.moderate') : t('bosses.controlled');

  // Determinar o tom do card do cabeçalho
  const headerCardVariant: HudCardVariant = isRaidExpired
    ? 'crimson'
    : lifecycleState === 'boss_defeated'
      ? 'gold'
      : isCriticalDeadline
        ? 'gold'
        : 'purple';

  // Handler para simular um ataque leve (para testes do usuário)
  const handleTestAttack = async () => {
    if (!user.id || !activeBattle || activeBattle.current_hp <= 0 || isRaidExpired || manualAttackUsedToday) return;
    await attackActiveBoss(user.id, 15, 'workout');
    if (manualAttackKey) {
      localStorage.setItem(manualAttackKey, new Date().toLocaleDateString('en-CA'));
      setManualAttackUsedToday(true);
    }
  };

  // Handler para purificar o boss derrotado
  const handlePurify = async () => {
    if (!user.id) return;
    setPurifying(true);
    try {
      await purifyActiveBoss(user.id);
    } finally {
      setPurifying(false);
    }
  };

  // Handler para reiniciar um ciclo após prazo expirado
  const handleRetryExpired = async () => {
    if (!user.id) return;
    setRetrying(true);
    try {
      await retryExpiredBattle(user.id);
    } finally {
      setRetrying(false);
    }
  };

  // Status de cada chefe para a galeria
  const getBossStatus = (bossId: string) => {
    if (!activeBattle) return bossLoading ? 'locked' : 'locked';

    const activeIndex = BOSS_LIST.findIndex(b => b.id === activeBattle.boss_id);
    const targetIndex = BOSS_LIST.findIndex(b => b.id === bossId);
    
    if (targetIndex === activeIndex) return 'active';
    if (defeatedBossIds.includes(bossId)) return 'defeated';
    return 'locked';
  };

  const getBossIcon = (category: string) => {
    switch (category) {
      case 'task': return <Sword size={16} />;
      case 'workout': return <Flame size={16} />;
      case 'foco': return <Brain size={16} />;
      case 'nutrition': return <Heart size={16} />;
      case 'finance': return <Scale size={16} />;
      case 'organization': return <Compass size={16} />;
      case 'streak': return <Crown size={16} />;
      default: return <Award size={16} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho da Fenda HUD v2 */}
      <HudCard variant={headerCardVariant} corners className="p-5 sm:p-6 shadow-[0_0_28px_rgba(168,85,247,0.08)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_1.2fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isRaidExpired ? (
                <span className="rounded-md border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-300">
                  {l('PRAZO ENCERRADO · CHEFE ESCAPOU', 'DEADLINE EXPIRED · BOSS ESCAPED')}
                </span>
              ) : lifecycleState === 'boss_defeated' ? (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                  {l('ENTIDADE PURIFICADA · VITÓRIA', 'ENTITY PURIFIED · VICTORY')}
                </span>
              ) : isCriticalDeadline ? (
                <span className="rounded-md border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300 animate-pulse">
                  {l('ALERTA: PRAZO CRÍTICO (<24H)', 'ALERT: CRITICAL DEADLINE (<24H)')}
                </span>
              ) : (
                <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
                  {t('bosses.weeklyRaid')}
                </span>
              )}
              <span className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                {t('bosses.synced')}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white sm:text-3xl font-orbitron">
              {t('bosses.title')}
            </h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-sm leading-relaxed text-slate-300">
              <RankBadge rank={hunterStore.rank} size="sm" showLabel={false} />
              <span>
                {l('Caçador', 'Hunter')} <strong className="text-white">{hunterStore.fullName || hunterStore.username}</strong> · Rank <strong className="text-amber-300">{hunterStore.rank}</strong> · {l('Classe', 'Class')} <strong className="text-purple-300">{hunterStore.hunterClass || l('Nenhuma', 'None')}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t('bosses.weekBoss'), value: localizedBoss?.name || bossDef?.name || '...', icon: Crown, tone: 'text-purple-300' },
              { label: t('bosses.hpRemaining'), value: activeBattle ? `${activeBattle.current_hp} / ${activeBattle.max_hp}` : '--', icon: Heart, tone: 'text-rose-300' },
              { label: t('bosses.damageDealt'), value: activeBattle ? `${damageDealt} HP` : '--', icon: Swords, tone: 'text-amber-300' },
              {
                label: t('bosses.deadline'),
                value: activeBattle
                  ? isRaidExpired
                    ? `00d 00h 00m 00s (${l('Expirado', 'Expired')})`
                    : lifecycleState === 'boss_defeated'
                      ? l('Purificado!', 'Purified!')
                      : remaining.formattedString
                  : '--',
                icon: isRaidExpired ? ShieldAlert : Timer,
                tone: isRaidExpired
                  ? 'text-rose-400 font-mono font-black'
                  : lifecycleState === 'boss_defeated'
                    ? 'text-emerald-300 font-mono font-black'
                    : isCriticalDeadline
                      ? 'text-amber-300 font-mono font-black animate-pulse'
                      : 'text-cyan-300 font-mono font-black',
                subtext: raidDeadline ? `${l('Até', 'Ends')} ${formattedDeadlineSaoPaulo}` : undefined,
              },
              { label: t('bosses.reward'), value: bossDef ? `+${bossDef.xpReward} XP` : '--', icon: Gift, tone: 'text-emerald-300' },
              { label: t('bosses.titleReward'), value: localizedBoss?.titleReward || bossDef?.titleReward || '--', icon: Award, tone: 'text-yellow-300' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-black/35 p-3 transition-colors hover:border-white/10">
                <item.icon className={`size-4 ${item.tone}`} />
                <p className="mt-2 text-xs font-medium text-slate-400">{item.label}</p>
                <p className={`mt-1 truncate text-xs sm:text-sm font-bold ${item.tone}`}>{item.value}</p>
                {item.subtext && (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500 font-mono">{item.subtext}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {activeBattle && activeBattle.current_hp > 0 && !isRaidExpired && (
          <button
            onClick={() => void resetBattle()}
            disabled={bossLoading}
            title={l('Reiniciar ciclo desta Raid', 'Reset current Raid cycle')}
            className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-xl border border-[#1e1e26] bg-black/50 text-slate-400 transition hover:border-slate-500/50 hover:text-white disabled:opacity-40"
          >
            <RotateCcw size={15} className={bossLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </HudCard>

      {/* Área Principal da Batalha */}
      {bossLoading && !activeBattle ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="relative size-16">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 animate-pulse font-orbitron">
            {l('Sincronizando com a Fenda Dimensional...', 'Synchronizing with the Dimensional Rift...')}
          </p>
        </div>
      ) : bossError && !activeBattle ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-10 text-center shadow-xl">
          <ShieldAlert className="mx-auto mb-4 size-10 text-rose-400" />
          <p className="text-xs font-black uppercase tracking-widest text-rose-400 font-orbitron">
            {l('Falha ao sincronizar a fenda', 'Failed to synchronize the Rift')}
          </p>
          <p className="mx-auto mt-3 max-w-2xl break-words text-xs font-semibold text-rose-200/80">
            {bossError}
          </p>
          <button
            onClick={() => user?.id && void loadActiveBattle(user.id)}
            className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/20"
          >
            {l('Tentar sincronizar novamente', 'Try synchronizing again')}
          </button>
        </div>
      ) : activeBattle && bossDef ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card do Boss (Visual) */}
          <div className="lg:col-span-7 space-y-6">
            <div 
              className="theme-preserve-dark relative rounded-3xl border border-[#1e1e26] bg-[#0c0c0f] overflow-hidden flex flex-col justify-end aspect-[4/5] w-full group shadow-2xl"
              style={{
                boxShadow: isRaidExpired
                  ? '0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 30px -5px rgba(239,68,68,0.2)'
                  : `0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 30px -5px ${bossDef.color}20`
              }}
            >
              {/* Imagem do Chefe com filtro desativado quando expirado */}
              <motion.div
                className={`absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105 ${
                  isRaidExpired ? 'grayscale opacity-35' : ''
                }`}
                style={{ 
                  backgroundImage: `url('${bossDef.image}')` 
                }}
              />
              
              {/* Máscara de degrade escuro com cores neon do boss */}
              <div 
                className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-black/40 to-transparent pointer-events-none"
              />
              <div 
                className="absolute inset-0 opacity-15 mix-blend-color bg-gradient-to-tr pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(circle at center, ${isRaidExpired ? '#ef4444' : bossDef.color}, transparent 60%)`
                }}
              />

              {/* Overlay visual de colapso quando a Raid expirou */}
              {isRaidExpired && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 p-6 text-center backdrop-blur-xs">
                  <div className="size-14 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-center text-rose-400 shadow-[0_0_24px_rgba(244,63,94,0.3)] mb-3">
                    <ShieldAlert size={28} />
                  </div>
                  <span className="rounded-md border border-rose-500/40 bg-rose-500/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-300 font-orbitron">
                    {l('Fenda Desestabilizada', 'Rift Destabilized')}
                  </span>
                  <h3 className="mt-2 text-xl font-black uppercase text-white font-orbitron">
                    {l('O Chefe Escapou', 'The Boss Escaped')}
                  </h3>
                  <p className="mt-1.5 max-w-xs text-xs text-rose-200/70">
                    {l('O tempo semanal esgotou. A entidade retornou às profundezas da fenda.', 'The weekly timer ran out. The entity returned into the rift depths.')}
                  </p>
                </div>
              )}

              {/* Feed de Dano Flutuante */}
              <AnimatePresence mode="wait">
                {showAttackFeed && (
                  <motion.div
                    key={recentDamage?.id ?? `${feedDamage}-${feedCritical}`}
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: -80, scale: feedCritical ? 1.5 : 1 }}
                    exit={{ opacity: 0, y: -150, scale: 0.8 }}
                    transition={{ duration: reduceMotion ? 0.01 : 1.5, ease: 'easeOut' }}
                    className="absolute inset-x-0 bottom-40 flex justify-center pointer-events-none z-20"
                  >
                    <div 
                      className={`font-orbitron font-black text-4xl sm:text-5xl uppercase italic select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center gap-1.5 ${
                        feedDamage < 0 
                          ? 'text-rose-400' 
                          : feedCritical 
                            ? 'text-yellow-400 animate-pulse text-shadow-glow' 
                            : 'text-red-500'
                      }`}
                      style={{
                        textShadow: feedDamage < 0 
                          ? '0 0 15px rgba(244,63,94,0.6)' 
                          : feedCritical 
                            ? '0 0 20px rgba(234,179,8,0.8)' 
                            : '0 0 15px rgba(239,68,68,0.6)'
                      }}
                    >
                      {feedDamage < 0 ? `+${Math.abs(feedDamage)} HP` : `-${feedDamage}`}
                      {feedCritical && feedDamage > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 tracking-widest font-sans ml-2">
                          CRÍTICO!
                        </span>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Conteúdo sobreposto */}
              <div className="p-6 sm:p-8 space-y-4 z-10">
                
                {/* ID e Título de Recompensa */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest font-orbitron" style={{ color: isRaidExpired ? '#ef4444' : bossDef.color }}>
                    {bossDef.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Award size={13} style={{ color: bossDef.color }} /> {l('Recompensa', 'Reward')}:
                    <span className="text-white font-orbitron" style={{ textShadow: `0 0 10px ${bossDef.color}40` }}>
                      {localizedBoss?.titleReward || bossDef.titleReward}
                    </span>
                  </div>
                </div>

                {/* Nome do Boss */}
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-orbitron">
                  {localizedBoss?.name || bossDef.name}
                </h2>

                {/* Status de HP */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between font-orbitron">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {l('Integridade da Entidade', 'Entity Integrity')}
                    </span>
                    <span 
                      className="text-base font-black tracking-widest"
                      style={{ 
                        color: activeBattle.current_hp === 0 
                          ? '#10b981' 
                          : isRaidExpired
                            ? '#ef4444'
                            : activeBattle.current_hp / activeBattle.max_hp < 0.25 
                              ? '#ef4444' 
                              : '#ffffff' 
                      }}
                    >
                      {activeBattle.current_hp} <span className="text-xs text-gray-600">/ {activeBattle.max_hp} HP</span>
                    </span>
                  </div>
                  
                  {/* Container da Barra */}
                  <div className="h-3.5 w-full bg-black/50 rounded-full border border-[#1e1e26] p-[2px] overflow-hidden relative">
                    <motion.div
                      className="h-full rounded-full relative"
                      style={{
                        backgroundColor: isRaidExpired ? '#ef4444' : bossDef.color,
                        boxShadow: `0 0 15px ${isRaidExpired ? '#ef4444' : bossDef.color}`
                      }}
                      animate={{
                        width: `${hpPercent}%`,
                        opacity: activeBattle.current_hp > 0 && hpPercent < 25 && !reduceMotion ? [0.6, 1, 0.6] : 1
                      }}
                      transition={{
                        width: { duration: reduceMotion ? 0.01 : 0.45, ease: 'easeOut' },
                        opacity: {
                          repeat: activeBattle.current_hp > 0 && hpPercent < 25 && !reduceMotion ? Infinity : 0,
                          duration: 1
                        }
                      }}
                    />
                    {/* Efeito Glow Interno */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lore, Fraqueza e Controle (Interação) */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            
            {/* Box de Informações / Lores */}
            <div className="flex-1 rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              
              {/* Vitória do Boss (Purificado) */}
              {activeBattle.current_hp === 0 ? (
                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-emerald-400">
                      <div className="size-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <CheckCircle2 size={16} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider font-orbitron">
                        {l('Entidade Purificada!', 'Entity Purified!')}
                      </h3>
                    </div>
                    
                    <p className="text-xs text-gray-300 font-medium leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/5 py-3 rounded-r-xl">
                      “{localizedBoss?.victoryLore || bossDef.victoryLore}”
                    </p>

                    <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-orbitron">
                        {l('Recompensas da Purificação', 'Purification Rewards')}
                      </h4>
                      <ul className="space-y-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <li className="flex items-center gap-2">
                          <Zap size={11} className="text-amber-400" /> {l('Bônus de Experiência', 'Experience Bonus')}: <span className="text-white font-orbitron">+{bossDef.xpReward} XP</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Crown size={11} className="text-emerald-400" /> {l('Título Desbloqueado', 'Title Unlocked')}: <span className="text-white font-orbitron">{localizedBoss?.titleReward || bossDef.titleReward}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Award size={11} className="text-purple-400" /> {l('Medalha', 'Medal')}: <span className="text-white font-orbitron">{l('Insígnia do Boss Derrotado', 'Defeated Boss Insignia')}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <TacticalButton
                    variant="primary"
                    accent="gold"
                    displayFont
                    fullWidth
                    onClick={handlePurify}
                    disabled={purifying}
                    leftIcon={<Sparkles size={14} className={purifying ? 'animate-pulse' : ''} />}
                  >
                    {purifying ? l('Canalizando Energia...', 'Channeling Energy...') : l('Purificar Entidade & Avançar', 'Purify Entity & Advance')}
                  </TacticalButton>
                </div>
              ) : isRaidExpired ? (
                /* Estado Expirado (Derrota por Prazo) */
                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 text-rose-400">
                      <div className="size-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(244,63,94,0.15)]">
                        <ShieldAlert size={16} />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-wider font-orbitron">
                        {l('Prazo Encerrado — Fenda Fechada', 'Deadline Expired — Rift Closed')}
                      </h3>
                    </div>

                    <p className="text-xs text-gray-300 font-medium leading-relaxed italic border-l-2 border-rose-500/30 pl-4 bg-rose-500/5 py-3 rounded-r-xl">
                      {l(
                        'A janela semanal encerrou antes da neutralização total da entidade. O chefe recuou nas sombras e nenhuma recompensa foi conquistada neste ciclo.',
                        'The weekly window ended before total neutralization. The boss retreated into shadows and no rewards were earned this cycle.'
                      )}
                    </p>

                    <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400 font-orbitron">
                        {l('Relatório da Incursão', 'Incursion Report')}
                      </h4>
                      <ul className="space-y-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <li className="flex items-center gap-2">
                          <Swords size={11} className="text-amber-400" /> {l('Dano Aplicado', 'Damage Dealt')}: <span className="text-white font-orbitron">{damageDealt} HP</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Heart size={11} className="text-rose-400" /> {l('HP Restante do Chefe', 'Boss Remaining HP')}: <span className="text-rose-300 font-orbitron">{activeBattle.current_hp} HP</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Timer size={11} className="text-blue-400" /> {l('Prazo Semanal', 'Weekly Window')}: <span className="text-gray-300 font-orbitron">{bossDef.targetDays} {l('dias esgotados', 'days expired')}</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <TacticalButton
                    variant="danger"
                    accent="crimson"
                    displayFont
                    fullWidth
                    onClick={handleRetryExpired}
                    disabled={retrying}
                    leftIcon={<RotateCcw size={15} className={retrying ? 'animate-spin' : ''} />}
                  >
                    {retrying ? l('Reabrindo Fenda...', 'Reopening Rift...') : l('Iniciar Novo Ciclo da Raid', 'Start New Raid Cycle')}
                  </TacticalButton>
                </div>
              ) : (
                // Boss ainda Vivo (Luta Ativa)
                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-5">
                    
                    {/* Alerta de Prazo Crítico (<24h) */}
                    {isCriticalDeadline && (
                      <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-300 animate-pulse">
                        <ShieldAlert size={16} className="shrink-0 text-amber-400" />
                        <span className="text-xs font-bold leading-tight">
                          {l(
                            'ALERTA: Restam menos de 24 horas! Finalize suas atividades antes do colapso da fenda.',
                            'ALERT: Less than 24 hours remaining! Complete your activities before the Rift collapses.'
                          )}
                        </span>
                      </div>
                    )}

                    {/* Descrição Lore */}
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-black text-white font-orbitron">
                        <Info size={16} style={{ color: bossDef.color }} /> {l('Descrição do Boss', 'Boss Description')}
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {localizedBoss?.lore || bossDef.lore}
                      </p>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-[#1e1e26] border-dashed" />

                    {/* Mecânica de Fraqueza */}
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-black text-yellow-400 font-orbitron">
                        <ShieldAlert size={14} className="text-yellow-400" /> {l('Fraqueza Identificada', 'Weakness Identified')}
                      </h3>
                      <p className="text-sm font-semibold leading-relaxed text-gray-300">
                        {localizedBoss?.weakness || bossDef.weakness}
                      </p>
                      <div className="flex items-center gap-2 mt-1 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-2.5">
                        <div className="size-6 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
                          {getBossIcon(bossDef.weaknessCategory)}
                        </div>
                        <span className="text-xs font-bold text-yellow-400">
                          {l('Multiplicador 1.75x para ações do tipo', '1.75x multiplier for')} {localizedWeaknessCategory}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                        <TrendingDown className="size-4 text-emerald-400" />
                        <p className="mt-2 text-xs font-bold text-white">{l('Fontes de dano', 'Damage sources')}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{l('Quests, treinos, nutrição, finanças e hábitos concluídos.', 'Completed quests, workouts, nutrition, finances, and habits.')}</p>
                      </div>
                      <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                        <TrendingUp className="size-4 text-red-400" />
                        <p className="mt-2 text-xs font-bold text-white">{l('Regeneração', 'Regeneration')}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{l('Desfazer atividades restaura o mesmo dano aplicado, impedindo farm de golpes.', 'Undoing activities restores the same damage, preventing attack farming.')}</p>
                      </div>
                      <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3">
                        <Activity className="size-4 text-purple-400" />
                        <p className="mt-2 text-xs font-bold text-white">{l('Multiplicador ativo', 'Active multiplier')}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                          {l(`1.75x em ${bossDef.weaknessCategory}; sinergias especiais aplicam 1.35x.`, `1.75x for ${localizedWeaknessCategory}; special synergies apply 1.35x.`)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
                        <ShieldAlert className="size-4 text-amber-400" />
                        <p className="mt-2 text-xs font-bold text-white">{l('Risco atual', 'Current risk')}</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">
                          {raidRisk} · {l(`${activeBattle.current_hp} HP ainda precisam ser removidos.`, `${activeBattle.current_hp} HP still need to be removed.`)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Painel de Interação de Ataque / Teste */}
                  <div className="space-y-3 pt-6 border-t border-[#1e1e26] border-dashed">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>{l('Ataque manual diário', 'Daily manual attack')}</span>
                      <span>{manualAttackUsedToday ? l('Disponível amanhã', 'Available tomorrow') : l('1 uso disponível', '1 use available')}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <TacticalButton
                        variant="primary"
                        accent="purple"
                        displayFont
                        fullWidth
                        onClick={handleTestAttack}
                        disabled={manualAttackUsedToday || isRaidExpired}
                        leftIcon={<Swords size={16} className="text-yellow-400" />}
                      >
                        {manualAttackUsedToday ? l('Ataque diário utilizado', 'Daily attack used') : l('Executar ataque de treino', 'Perform training attack')}
                      </TacticalButton>
                    </div>
                    
                    <p className="text-xs text-center leading-relaxed text-gray-600">
                      {l('O dano principal é aplicado automaticamente ao concluir atividades nos módulos do Ascend.', 'Most damage is applied automatically when you complete activities across Ascend modules.')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-12 text-center shadow-xl">
          <p className="text-gray-500 font-orbitron uppercase tracking-widest">{l('Nenhuma raid ativa encontrada na fenda.', 'No active raid found in the Rift.')}</p>
        </div>
      )}

      {activeBattle && bossDef && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white font-orbitron">{l('Histórico de Dano', 'Damage History')}</h3>
                <p className="mt-1 text-xs text-gray-500">{l('Eventos recentes registrados durante esta sessão de raid.', 'Recent events recorded during this raid session.')}</p>
              </div>
              <Activity className="size-5 text-purple-400" />
            </div>
            <div className="mt-5 space-y-2">
              {combatEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-purple-500/20 bg-purple-500/[0.025] p-5 text-center">
                  <p className="text-sm font-semibold text-gray-400">{l('Nenhum impacto registrado nesta sessão.', 'No impact recorded in this session.')}</p>
                  <p className="mt-1 text-xs text-gray-600">{l('Conclua atividades ou use o ataque manual diário para gerar o primeiro evento.', 'Complete activities or use the daily manual attack to create the first event.')}</p>
                </div>
              ) : (
                combatEvents.map(event => (
                  <motion.div
                    layout
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                      event.damage < 0
                        ? 'border-rose-500/30 bg-rose-500/5'
                        : event.critical
                          ? 'border-amber-400/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                          : 'border-white/5 bg-white/[0.025]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex size-9 items-center justify-center rounded-lg ${
                          event.damage < 0
                            ? 'bg-rose-500/20 text-rose-400'
                            : event.critical
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-white/5 text-slate-300'
                        }`}
                      >
                        {event.damage < 0 ? (
                          <TrendingUp className="size-4" />
                        ) : (
                          <Swords className="size-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p
                            className={`text-sm font-bold ${
                              event.damage < 0
                                ? 'text-rose-300'
                                : event.critical
                                  ? 'text-amber-300 font-orbitron'
                                  : 'text-white'
                            }`}
                          >
                            {event.damage < 0
                              ? l(`Regeneração de +${Math.abs(event.damage)} HP`, `Regeneration of +${Math.abs(event.damage)} HP`)
                              : l(`${event.damage} de dano aplicado`, `${event.damage} damage dealt`)}
                          </p>
                          {event.critical && event.damage > 0 && (
                            <span className="rounded border border-amber-400/40 bg-amber-500/20 px-1.5 py-0.5 font-orbitron text-[9px] font-black uppercase text-amber-300">
                              {l('CRÍTICO', 'CRITICAL')}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {event.damage < 0
                            ? l('Atividade desfeita · restauração de HP', 'Activity undone · HP restored')
                            : event.critical
                              ? l('Golpe crítico · multiplicador ativo', 'Critical strike · active multiplier')
                              : l('Ataque registrado pelo Sistema', 'Attack registered by the System')}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{event.time}</span>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0F0F13] p-6 shadow-[0_0_22px_rgba(245,158,11,0.06)]">
            <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-amber-500/10 to-transparent" />
            <div className="relative">
              <div className="flex size-11 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
                <Trophy className="size-5" />
              </div>
              <p className="mt-4 text-xs font-bold text-amber-300">{l('Recompensa da purificação', 'Purification reward')}</p>
              <h3 className="mt-1 text-xl font-black text-white font-orbitron">{localizedBoss?.titleReward || bossDef.titleReward}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                  <Zap className="size-4 text-yellow-400" />
                  <p className="mt-2 text-xs text-gray-500">{l('Experiência', 'Experience')}</p>
                  <p className="mt-1 text-sm font-bold text-white">+{bossDef.xpReward} XP</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                  <Award className="size-4 text-purple-400" />
                  <p className="mt-2 text-xs text-gray-500">{l('Relíquia', 'Relic')}</p>
                  <p className="mt-1 text-sm font-bold text-white">{l('Insígnia do Boss', 'Boss Insignia')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Galeria de Conquistas / Bosses Purificados */}
      <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="mb-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-white font-orbitron">
            {l('Galeria das Fendas', 'Rift Gallery')} <span className="text-purple-400">{l('Purificadas', 'Purified')}</span>
          </h3>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {l('Registro de todos os chefes derrotados no servidor do ASCEND', 'Record of every boss defeated on the ASCEND server')}
          </p>
        </div>

        {/* Grid de Bosses */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {BOSS_LIST.map((boss) => {
            const status = getBossStatus(boss.id);
            const isDefeated = status === 'defeated';
            const isActive = status === 'active';
            const isLocked = status === 'locked';
            const galleryBossName = language === 'en-US' ? EN_BOSS_COPY[boss.id]?.name || boss.name : boss.name;

            return (
              <motion.div
                key={boss.id}
                whileHover={{ y: -3 }}
                className={`relative flex min-h-36 flex-col items-center justify-center space-y-3 overflow-hidden rounded-2xl border p-4 text-center transition-all ${
                  isDefeated
                    ? 'bg-emerald-500/5 border-emerald-500/25 text-emerald-400 hover:shadow-[0_0_16px_rgba(16,185,129,0.1)]'
                    : isActive
                      ? 'bg-purple-500/10 border-purple-500/45 text-purple-300 shadow-[0_0_22px_rgba(168,85,247,0.16)]'
                      : 'bg-black/40 border-[#252530] text-gray-600 hover:border-gray-700'
                }`}
              >
                {/* Imagem em miniatura do boss */}
                <div 
                  className={`size-14 rounded-xl bg-cover bg-center border transition-all ${
                    isDefeated
                      ? 'border-emerald-500/25 opacity-65'
                      : isActive
                        ? 'border-purple-500/40'
                        : 'border-[#1e1e26] grayscale opacity-20'
                  }`}
                  style={{ backgroundImage: `url('${boss.image}')` }}
                />

                {/* Info Text */}
                <div className="flex min-h-16 w-full flex-col items-center justify-center gap-1">
                  <p className="w-full whitespace-normal break-words text-[10px] font-black leading-4 font-orbitron [overflow-wrap:anywhere] sm:text-[11px]">
                    {galleryBossName}
                  </p>
                  <p className={`text-[10px] font-bold ${isDefeated ? 'text-emerald-400' : isActive ? 'text-purple-300' : 'text-gray-600'}`}>
                    {isDefeated
                      ? l('Purificado', 'Purified')
                      : isActive
                        ? l('Em combate', 'In combat')
                        : l('Bloqueado', 'Locked')}
                  </p>
                </div>
                
                {/* Selo Visual de Status */}
                <div className="absolute top-2 right-2">
                  {isDefeated && <CheckCircle2 size={10} className="text-emerald-400" />}
                  {isActive && <Zap size={10} className="text-purple-400 animate-bounce" />}
                  {isLocked && <Lock size={10} className="text-gray-600" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
