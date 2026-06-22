import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useBossStore, BOSS_LIST } from '@/stores/useBossStore';

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
  const [purifying, setPurifying] = useState(false);
  const [showAttackFeed, setShowAttackFeed] = useState(false);
  const [feedDamage, setFeedDamage] = useState(0);
  const [feedCritical, setFeedCritical] = useState(false);
  const [raidReferenceTime] = useState(() => Date.now());
  const [combatEvents, setCombatEvents] = useState<Array<{
    id: number;
    damage: number;
    critical: boolean;
    time: string;
  }>>([]);

  // Carrega a batalha ativa quando o componente monta
  useEffect(() => {
    if (user?.id) {
      void loadActiveBattle(user.id);
    }
  }, [user?.id, loadActiveBattle]);

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
          id: Date.now(),
          damage: recentDamage.damage,
          critical: recentDamage.isCritical,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
        ...current,
      ].slice(0, 5));
      timer = setTimeout(() => setShowAttackFeed(false), 2000);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (timer) clearTimeout(timer);
    };
  }, [recentDamage]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 uppercase tracking-widest">Acesso restrito — Faça login para entrar na fenda.</p>
      </div>
    );
  }

  const bossDef = activeBattle ? BOSS_LIST.find(b => b.id === activeBattle.boss_id) : null;
  const hpPercent = activeBattle ? (activeBattle.current_hp / activeBattle.max_hp) * 100 : 0;
  const damageDealt = activeBattle ? activeBattle.max_hp - activeBattle.current_hp : 0;
  const raidDeadline = activeBattle
    ? new Date(new Date(activeBattle.started_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const remainingMs = raidDeadline ? Math.max(0, raidDeadline.getTime() - raidReferenceTime) : 0;
  const remainingDays = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const remainingHours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const raidRisk = hpPercent > 70 ? 'Alto' : hpPercent > 30 ? 'Moderado' : 'Controlado';

  // Handler para simular um ataque leve (para testes do usuário)
  const handleTestAttack = async () => {
    if (!user.id || !activeBattle || activeBattle.current_hp <= 0) return;
    // Simula um ataque de treino de 15 de dano
    await attackActiveBoss(user.id, 15, 'workout');
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

  // Busca conquistas do usuário para saber quais bosses já foram derrotados
  // Verificamos no store de conquistas locais ou deduzimos a partir da BOSS_LIST e activeBattle
  // Para mostrar a galeria de troféus, listaremos os bosses e marcaremos como derrotados os que
  // têm IDs anteriores ao boss ativo, ou se já derrotou a campanha inteira.
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
      {/* Cabeçalho da Fenda */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/20 bg-[#0F0F13] p-6 shadow-[0_0_28px_rgba(168,85,247,0.07)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1fr_1.2fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-bold text-purple-300">
                Raid semanal ativa
              </span>
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-300">
                Fenda sincronizada
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white sm:text-3xl font-orbitron">
              Chefes Finais <span className="text-purple-400">& Provações</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">
              Caçador <span className="font-bold text-white">{hunterStore.fullName || hunterStore.username}</span> · Rank <span className="text-amber-300">{hunterStore.rank}</span> · Classe <span className="text-purple-300">{hunterStore.hunterClass || 'Nenhuma'}</span>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Boss da semana', value: bossDef?.name || 'Sincronizando', icon: Crown, tone: 'text-purple-300' },
              { label: 'HP restante', value: activeBattle ? `${activeBattle.current_hp} / ${activeBattle.max_hp}` : '--', icon: Heart, tone: 'text-rose-300' },
              { label: 'Dano acumulado', value: activeBattle ? `${damageDealt} de dano` : '--', icon: Swords, tone: 'text-amber-300' },
              { label: 'Prazo restante', value: activeBattle ? `${remainingDays}d ${remainingHours}h` : '--', icon: Timer, tone: 'text-blue-300' },
              { label: 'Recompensa', value: bossDef ? `+${bossDef.xpReward} XP` : '--', icon: Gift, tone: 'text-emerald-300' },
              { label: 'Título', value: bossDef?.titleReward || '--', icon: Award, tone: 'text-yellow-300' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-black/25 p-3 transition-colors hover:border-white/10">
                <item.icon className={`size-4 ${item.tone}`} />
                <p className="mt-2 text-xs font-medium text-gray-500">{item.label}</p>
                <p className={`mt-1 truncate text-sm font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {activeBattle && activeBattle.current_hp > 0 && (
          <button
            onClick={() => void resetBattle(user.id)}
            disabled={bossLoading}
            title="Resetar HP do Boss atual"
            className="absolute right-4 top-4 z-20 flex size-9 items-center justify-center rounded-xl border border-[#1e1e26] bg-black/50 text-gray-500 transition hover:border-gray-500/50 hover:text-white disabled:opacity-40"
          >
            <RotateCcw size={15} className={bossLoading ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Área Principal da Batalha */}
      {bossLoading && !activeBattle ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="relative size-16">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 animate-pulse font-orbitron">
            Sincronizando com a Fenda Dimensional...
          </p>
        </div>
      ) : bossError && !activeBattle ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/5 p-10 text-center shadow-xl">
          <ShieldAlert className="mx-auto mb-4 size-10 text-rose-400" />
          <p className="text-xs font-black uppercase tracking-widest text-rose-400 font-orbitron">
            Falha ao sincronizar a fenda
          </p>
          <p className="mx-auto mt-3 max-w-2xl break-words text-xs font-semibold text-rose-200/80">
            {bossError}
          </p>
          <button
            onClick={() => user?.id && void loadActiveBattle(user.id)}
            className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-500/20"
          >
            Tentar sincronizar novamente
          </button>
        </div>
      ) : activeBattle && bossDef ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card do Boss (Visual) */}
          <div className="lg:col-span-7 space-y-6">
            <div 
              className="relative rounded-3xl border border-[#1e1e26] bg-[#0c0c0f] overflow-hidden flex flex-col justify-end aspect-[4/5] w-full group shadow-2xl"
              style={{
                boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 30px -5px ${bossDef.color}20`
              }}
            >
              {/* Imagem do Chefe */}
              <motion.div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 ease-out group-hover:scale-105"
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
                  backgroundImage: `radial-gradient(circle at center, ${bossDef.color}, transparent 60%)`
                }}
              />

              {/* Feed de Dano Flutuante */}
              <AnimatePresence>
                {showAttackFeed && (
                  <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.5 }}
                    animate={{ opacity: 1, y: -80, scale: feedCritical ? 1.5 : 1 }}
                    exit={{ opacity: 0, y: -150, scale: 0.8 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    className="absolute inset-x-0 bottom-40 flex justify-center pointer-events-none z-20"
                  >
                    <div 
                      className={`font-orbitron font-black text-4xl sm:text-5xl uppercase italic select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center gap-1.5 ${
                        feedDamage < 0 
                          ? 'text-green-500' 
                          : feedCritical 
                            ? 'text-yellow-400 animate-pulse text-shadow-glow' 
                            : 'text-red-500'
                      }`}
                      style={{
                        textShadow: feedDamage < 0 
                          ? '0 0 15px rgba(34,197,94,0.6)' 
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
                  <span className="text-[10px] font-black uppercase tracking-widest font-orbitron" style={{ color: bossDef.color }}>
                    {bossDef.title}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <Award size={13} style={{ color: bossDef.color }} /> Recompensa: 
                    <span className="text-white font-orbitron" style={{ textShadow: `0 0 10px ${bossDef.color}40` }}>
                      {bossDef.titleReward}
                    </span>
                  </div>
                </div>

                {/* Nome do Boss */}
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white font-orbitron">
                  {bossDef.name}
                </h2>

                {/* Status de HP */}
                <div className="space-y-2">
                  <div className="flex items-end justify-between font-orbitron">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Integridade da Entidade
                    </span>
                    <span 
                      className="text-base font-black tracking-widest"
                      style={{ 
                        color: activeBattle.current_hp === 0 
                          ? '#10b981' 
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
                      className="h-full rounded-full transition-all duration-300 relative"
                      style={{
                        width: `${hpPercent}%`,
                        backgroundColor: bossDef.color,
                        boxShadow: `0 0 15px ${bossDef.color}`
                      }}
                      animate={{
                        opacity: activeBattle.current_hp > 0 && hpPercent < 25 ? [0.6, 1, 0.6] : 1
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 1
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
                        Entidade Purificada!
                      </h3>
                    </div>
                    
                    <p className="text-xs text-gray-300 font-medium leading-relaxed italic border-l-2 border-emerald-500/30 pl-4 bg-emerald-500/5 py-3 rounded-r-xl">
                      "{bossDef.victoryLore}"
                    </p>

                    <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4 space-y-2.5">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-orbitron">
                        Recompensas da Purificação
                      </h4>
                      <ul className="space-y-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        <li className="flex items-center gap-2">
                          <Zap size={11} className="text-amber-400" /> Bônus de Experiência: <span className="text-white font-orbitron">+{bossDef.xpReward} XP</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Crown size={11} className="text-emerald-400" /> Título Desbloqueado: <span className="text-white font-orbitron">{bossDef.titleReward}</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Award size={11} className="text-purple-400" /> Medalha: <span className="text-white font-orbitron">Insignia do Boss Derrotado</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={handlePurify}
                    disabled={purifying}
                    className="w-full mt-6 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/25 text-emerald-400 font-black text-xs uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-98 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={14} className={purifying ? 'animate-pulse' : ''} />
                    {purifying ? 'Canalizando Energia...' : 'Purificar Entidade & Avançar'}
                  </button>
                </div>
              ) : (
                // Boss ainda Vivo (Luta Ativa)
                <div className="space-y-6 flex-1 flex flex-col justify-between h-full">
                  <div className="space-y-5">
                    
                    {/* Descrição Lore */}
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-black text-white font-orbitron">
                        <Info size={16} style={{ color: bossDef.color }} /> Descrição do Boss
                      </h3>
                      <p className="text-sm leading-relaxed text-gray-400">
                        {bossDef.lore}
                      </p>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-[#1e1e26] border-dashed" />

                    {/* Mecânica de Fraqueza */}
                    <div className="space-y-2">
                      <h3 className="flex items-center gap-2 text-sm font-black text-yellow-400 font-orbitron">
                        <ShieldAlert size={14} className="text-yellow-400" /> Fraqueza Identificada
                      </h3>
                      <p className="text-sm font-semibold leading-relaxed text-gray-300">
                        {bossDef.weakness}
                      </p>
                      <div className="flex items-center gap-2 mt-1 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-2.5">
                        <div className="size-6 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
                          {getBossIcon(bossDef.weaknessCategory)}
                        </div>
                        <span className="text-xs font-bold text-yellow-400">
                          Multiplicador 2.0x para ações do tipo {bossDef.weaknessCategory}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-3">
                        <TrendingDown className="size-4 text-emerald-400" />
                        <p className="mt-2 text-xs font-bold text-white">Fontes de dano</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">Quests, treinos, nutrição, finanças e hábitos concluídos.</p>
                      </div>
                      <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                        <TrendingUp className="size-4 text-red-400" />
                        <p className="mt-2 text-xs font-bold text-white">Regeneração</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">Tarefas ignoradas ou streaks quebradas podem restaurar 15 HP.</p>
                      </div>
                      <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3">
                        <Activity className="size-4 text-purple-400" />
                        <p className="mt-2 text-xs font-bold text-white">Multiplicador ativo</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">2.0x em {bossDef.weaknessCategory}; sinergias especiais podem aplicar 1.5x.</p>
                      </div>
                      <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3">
                        <ShieldAlert className="size-4 text-amber-400" />
                        <p className="mt-2 text-xs font-bold text-white">Risco atual</p>
                        <p className="mt-1 text-xs leading-relaxed text-gray-500">{raidRisk} · {activeBattle.current_hp} HP ainda precisam ser removidos.</p>
                      </div>
                    </div>
                  </div>

                  {/* Painel de Interação de Ataque / Teste */}
                  <div className="space-y-3 pt-6 border-t border-[#1e1e26] border-dashed">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                      <span>Preview de ataque</span>
                      <span>Treino base: 15 · crítico: 30</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={handleTestAttack}
                        className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-purple-500/25 bg-purple-500/10 text-sm font-black text-purple-200 transition hover:bg-purple-500/20 hover:text-white hover:shadow-[0_0_18px_rgba(168,85,247,0.18)] active:scale-[0.98]"
                      >
                        <Swords size={16} className="text-yellow-400" />
                        Executar ataque de treino
                      </button>
                    </div>
                    
                    <p className="text-xs text-center leading-relaxed text-gray-600">
                      O dano principal é aplicado automaticamente ao concluir atividades nos módulos do Ascend.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-12 text-center shadow-xl">
          <p className="text-gray-500 font-orbitron uppercase tracking-widest">Nenhuma raid ativa encontrada na fenda.</p>
        </div>
      )}

      {activeBattle && bossDef && (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white font-orbitron">Histórico de Dano</h3>
                <p className="mt-1 text-xs text-gray-500">Eventos recentes registrados durante esta sessão de raid.</p>
              </div>
              <Activity className="size-5 text-purple-400" />
            </div>
            <div className="mt-5 space-y-2">
              {combatEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-purple-500/20 bg-purple-500/[0.025] p-5 text-center">
                  <p className="text-sm font-semibold text-gray-400">Nenhum impacto registrado nesta sessão.</p>
                  <p className="mt-1 text-xs text-gray-600">Conclua atividades ou execute o preview de ataque para gerar o primeiro evento.</p>
                </div>
              ) : (
                combatEvents.map(event => (
                  <motion.div
                    layout
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 items-center justify-center rounded-lg ${event.damage < 0 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {event.damage < 0 ? <TrendingUp className="size-4" /> : <Swords className="size-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {event.damage < 0 ? `Regeneração de ${Math.abs(event.damage)} HP` : `${event.damage} de dano aplicado`}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{event.critical ? 'Golpe crítico · multiplicador ativo' : 'Ataque registrado pelo Sistema'}</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-gray-600">{event.time}</span>
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
              <p className="mt-4 text-xs font-bold text-amber-300">Recompensa da purificação</p>
              <h3 className="mt-1 text-xl font-black text-white font-orbitron">{bossDef.titleReward}</h3>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                  <Zap className="size-4 text-yellow-400" />
                  <p className="mt-2 text-xs text-gray-500">Experiência</p>
                  <p className="mt-1 text-sm font-bold text-white">+{bossDef.xpReward} XP</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-black/25 p-3">
                  <Award className="size-4 text-purple-400" />
                  <p className="mt-2 text-xs text-gray-500">Relíquia</p>
                  <p className="mt-1 text-sm font-bold text-white">Insígnia do Boss</p>
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
            Galeria das Fendas <span className="text-purple-400">Purificadas</span>
          </h3>
          <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">
            Registro de todos os chefes derrotados no servidor do ASCEND
          </p>
        </div>

        {/* Grid de Bosses */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {BOSS_LIST.map((boss) => {
            const status = getBossStatus(boss.id);
            const isDefeated = status === 'defeated';
            const isActive = status === 'active';
            const isLocked = status === 'locked';

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
                <div className="space-y-0.5">
                  <p className="max-w-full truncate text-xs font-black leading-tight font-orbitron">
                    {boss.name}
                  </p>
                  <p className={`text-[10px] font-bold ${isDefeated ? 'text-emerald-400' : isActive ? 'text-purple-300' : 'text-gray-600'}`}>
                    {isDefeated ? 'Purificado' : isActive ? 'Em combate' : 'Bloqueado'}
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
