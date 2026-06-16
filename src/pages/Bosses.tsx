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
  Calendar,
  Brain,
  Scale,
  Compass,
  Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore, BOSS_LIST } from '@/stores/useBossStore';

export function Bosses() {
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  const bossStore = useBossStore();
  const [purifying, setPurifying] = useState(false);
  const [showAttackFeed, setShowAttackFeed] = useState(false);
  const [feedDamage, setFeedDamage] = useState(0);
  const [feedCritical, setFeedCritical] = useState(false);

  // Carrega a batalha ativa quando o componente monta
  useEffect(() => {
    if (user?.id) {
      void bossStore.loadActiveBattle(user.id);
    }
  }, [user?.id]);

  // Monitora alterações de dano recente para exibir animação de floating numbers
  useEffect(() => {
    if (bossStore.recentDamage) {
      setFeedDamage(bossStore.recentDamage.damage);
      setFeedCritical(bossStore.recentDamage.isCritical);
      setShowAttackFeed(true);
      const timer = setTimeout(() => setShowAttackFeed(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [bossStore.recentDamage]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-gray-500 uppercase tracking-widest">Acesso restrito — Faça login para entrar na fenda.</p>
      </div>
    );
  }

  const activeBattle = bossStore.activeBattle;
  const bossDef = activeBattle ? BOSS_LIST.find(b => b.id === activeBattle.boss_id) : null;
  const hpPercent = activeBattle ? (activeBattle.current_hp / activeBattle.max_hp) * 100 : 0;

  // Handler para simular um ataque leve (para testes do usuário)
  const handleTestAttack = async () => {
    if (!user.id || !activeBattle || activeBattle.current_hp <= 0) return;
    // Simula um ataque de treino de 15 de dano
    await bossStore.attackActiveBoss(user.id, 15, 'workout');
  };

  // Handler para purificar o boss derrotado
  const handlePurify = async () => {
    if (!user.id) return;
    setPurifying(true);
    try {
      await bossStore.purifyActiveBoss(user.id);
    } finally {
      setPurifying(false);
    }
  };

  // Busca conquistas do usuário para saber quais bosses já foram derrotados
  // Verificamos no store de conquistas locais ou deduzimos a partir da BOSS_LIST e activeBattle
  // Para mostrar a galeria de troféus, listaremos os bosses e marcaremos como derrotados os que
  // têm IDs anteriores ao boss ativo, ou se já derrotou a campanha inteira.
  const getBossStatus = (bossId: string) => {
    if (!activeBattle) return 'defeated';
    const activeIndex = BOSS_LIST.findIndex(b => b.id === activeBattle.boss_id);
    const targetIndex = BOSS_LIST.findIndex(b => b.id === bossId);
    
    if (targetIndex < activeIndex) return 'defeated';
    if (targetIndex === activeIndex) return 'active';
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20">
              Módulo de Raid Semanal
            </span>
            <span className="px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Fenda Ativa
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white font-orbitron">
            Chefes Finais <span className="text-purple-400">& Provações de Consistência</span>
          </h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 leading-relaxed">
            Caçador: <span className="text-white font-orbitron">{hunterStore.fullName || hunterStore.username}</span> | Rank: <span className="text-amber-400 font-orbitron">{hunterStore.rank}</span> | Classe: <span className="text-purple-400 font-orbitron">{hunterStore.hunterClass || 'Nenhuma'}</span>
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          {activeBattle && activeBattle.current_hp > 0 && (
            <button
              onClick={() => void bossStore.resetBattle(user.id)}
              disabled={bossStore.loading}
              title="Resetar HP do Boss atual"
              className="flex size-9 items-center justify-center rounded-xl bg-black/40 border border-[#1e1e26] text-gray-400 hover:text-white hover:border-gray-500/50 transition cursor-pointer disabled:opacity-40"
            >
              <RotateCcw size={15} className={bossStore.loading ? 'animate-spin' : ''} />
            </button>
          )}
          <div className="flex size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <Sword size={18} />
          </div>
        </div>
      </div>

      {/* Área Principal da Batalha */}
      {bossStore.loading && !activeBattle ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="relative size-16">
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-purple-500 animate-spin" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 animate-pulse font-orbitron">
            Sincronizando com a Fenda Dimensional...
          </p>
        </div>
      ) : activeBattle && bossDef ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card do Boss (Visual) */}
          <div className="lg:col-span-7 space-y-6">
            <div 
              className="relative rounded-3xl border border-[#1e1e26] bg-[#0c0c0f] overflow-hidden flex flex-col justify-end min-h-[380px] sm:min-h-[460px] group shadow-2xl"
              style={{
                boxShadow: `0 10px 30px -10px rgba(0, 0, 0, 0.7), 0 0 30px -5px ${bossDef.color}20`
              }}
            >
              {/* Imagem do Chefe */}
              <div 
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
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 font-orbitron flex items-center gap-1.5">
                        <Info size={14} style={{ color: bossDef.color }} /> Descrição do Arquivo
                      </h3>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        {bossDef.lore}
                      </p>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-[#1e1e26] border-dashed" />

                    {/* Mecânica de Fraqueza */}
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-yellow-400 font-orbitron flex items-center gap-1.5">
                        <ShieldAlert size={14} className="text-yellow-400" /> Fraqueza Identificada
                      </h3>
                      <p className="text-[11px] text-gray-300 font-semibold leading-relaxed">
                        {bossDef.weakness}
                      </p>
                      <div className="flex items-center gap-2 mt-1 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-2.5">
                        <div className="size-6 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 shrink-0">
                          {getBossIcon(bossDef.weaknessCategory)}
                        </div>
                        <span className="text-[9px] uppercase font-black text-yellow-500 tracking-widest leading-none">
                          2.0x Dano Crítico ativado por atividades do tipo: {bossDef.weaknessCategory}
                        </span>
                      </div>
                    </div>

                    {/* Loss Aversion Warning */}
                    <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-[10px] text-gray-400 leading-relaxed">
                      <span className="text-red-400 font-black uppercase tracking-widest font-orbitron flex items-center gap-1 mr-1 mb-1">
                        ⚠️ Alerta de Regeneração (Loss Aversion)
                      </span>
                      Se você quebrar suas streaks diárias de hábitos ou deixar tarefas pendentes ao virar o dia, o Boss irá regenerar <span className="text-red-400 font-bold">15 HP</span> devido à procrastinação acumulada.
                    </div>
                  </div>

                  {/* Painel de Interação de Ataque / Teste */}
                  <div className="space-y-3 pt-6 border-t border-[#1e1e26] border-dashed">
                    <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-gray-500">
                      <span>Mecanismo de Dano Ativo</span>
                      <span>1 XP = 1 de Dano</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={handleTestAttack}
                        className="py-3 rounded-2xl bg-black/40 border border-[#1e1e26] hover:border-gray-500/30 hover:text-white text-gray-400 font-black text-[10px] uppercase tracking-widest transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                      >
                        <Zap size={12} className="text-yellow-400" />
                        Simular Ataque de Treino (15 de Dano)
                      </button>
                    </div>
                    
                    <p className="text-[9px] text-gray-600 text-center uppercase tracking-widest leading-relaxed">
                      *O verdadeiro dano é desferido de forma passiva ao concluir suas tarefas, rotinas de musculação e refeições no aplicativo.
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {BOSS_LIST.map((boss) => {
            const status = getBossStatus(boss.id);
            const isDefeated = status === 'defeated';
            const isActive = status === 'active';
            const isLocked = status === 'locked';

            return (
              <div 
                key={boss.id}
                className={`relative rounded-2xl p-4 border flex flex-col items-center justify-center text-center space-y-2.5 transition-all overflow-hidden ${
                  isDefeated 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                    : isActive 
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : 'bg-black/30 border-[#1e1e26] text-gray-600'
                }`}
              >
                {/* Imagem em miniatura do boss */}
                <div 
                  className={`size-12 rounded-xl bg-cover bg-center border ${
                    isDefeated 
                      ? 'border-emerald-500/20 grayscale-50 opacity-40' 
                      : isActive 
                        ? 'border-purple-500/30 animate-pulse' 
                        : 'border-[#1e1e26] grayscale opacity-10'
                  }`}
                  style={{ backgroundImage: `url('${boss.image}')` }}
                />

                {/* Info Text */}
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase tracking-widest leading-none font-orbitron truncate max-w-full">
                    {boss.name.split(' ').slice(-1)[0]}
                  </p>
                  <p className="text-[7px] font-bold uppercase tracking-widest text-gray-500">
                    {isDefeated ? 'PURIFICADO' : isActive ? 'EM COMBATE' : 'BLOQUEADO'}
                  </p>
                </div>
                
                {/* Selo Visual de Status */}
                <div className="absolute top-2 right-2">
                  {isDefeated && <CheckCircle2 size={10} className="text-emerald-400" />}
                  {isActive && <Zap size={10} className="text-purple-400 animate-bounce" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
