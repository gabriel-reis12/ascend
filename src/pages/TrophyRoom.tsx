import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trophy,
  Crown,
  Award,
  Sparkles,
  CheckCircle2,
  Lock,
  Flame,
  Calendar,
  Shield,
  Sword,
  BookOpen,
  Heart,
  Compass,
  Scale,
  Brain,
  Zap,
  Swords,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore, BOSS_LIST } from '@/stores/useBossStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';
import { RankBadge } from '@/components/ui/rank-badge';
import {
  ALL_POSSIBLE_ACHIEVEMENTS,
  ALL_PRESTIGE_TITLES,
  EN_ACHIEVEMENT_COPY,
  EN_TITLE_COPY,
  type AchievementDefinition,
  type TitleDefinition,
} from '@/lib/achievementsData';
import { supabase } from '@/lib/supabase';

interface UnlockedAchievementRecord {
  title: string;
  description: string;
  icon: string;
  unlocked_at: string;
}

interface BossBattleRecord {
  id: string;
  boss_id: string;
  defeated: boolean;
  defeated_at: string | null;
  current_hp: number;
  max_hp: number;
}

export function TrophyRoom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const hunterStore = useHunterStore();
  const activeBattle = useBossStore((state) => state.activeBattle);
  const defeatedBossIds = useBossStore((state) => state.defeatedBossIds);
  const loadActiveBattle = useBossStore((state) => state.loadActiveBattle);
  const { language, t } = usePreferences();
  const l = (pt: string, en: string) => (language === 'en-US' ? en : pt);
  const reduceMotion = useReducedMotion();

  // Estados locais de dados
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievementRecord[]>([]);
  const [bossBattles, setBossBattles] = useState<BossBattleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [equippingTitle, setEquippingTitle] = useState<string | null>(null);

  // Filtros
  const [activeTab, setActiveTab] = useState<'all' | 'achievements' | 'titles' | 'bosses'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'streak' | 'stats' | 'boss'>('all');

  // Carregar dados reais do usuário
  useEffect(() => {
    async function loadTrophyData() {
      if (!user?.id) return;
      setLoading(true);
      try {
        // 1. Carregar conquistas reais desbloqueadas
        const { data: achData } = await supabase
          .from('achievements')
          .select('title, description, icon, unlocked_at')
          .eq('user_id', user.id)
          .order('unlocked_at', { ascending: false });

        if (achData) {
          setUnlockedAchievements(achData);
        }

        // 2. Carregar registros reais de chefes
        const { data: bossData } = await supabase
          .from('boss_battles')
          .select('id, boss_id, defeated, defeated_at, current_hp, max_hp')
          .eq('user_id', user.id);

        if (bossData) {
          setBossBattles(bossData);
        }

        // Sincronizar store de chefes
        void loadActiveBattle(user.id);
      } catch (err) {
        console.warn('[TrophyRoom] Falha ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    }

    void loadTrophyData();
  }, [user?.id, loadActiveBattle]);

  // Lista de títulos desbloqueados pelo caçador
  const unlockedTitlesSet = useMemo(() => {
    const titles = new Set<string>(['Iniciante']);
    
    // Títulos de conquistas
    unlockedAchievements.forEach((ach) => {
      const match = ALL_POSSIBLE_ACHIEVEMENTS.find((p) => p.title === ach.title);
      if (match?.titleReward) {
        titles.add(match.titleReward);
      }
    });

    // Títulos de chefes derrotados
    bossBattles.forEach((b) => {
      if (b.defeated) {
        const bossDef = BOSS_LIST.find((item) => item.id === b.boss_id);
        if (bossDef?.titleReward) {
          titles.add(bossDef.titleReward);
        }
      }
    });

    // Títulos de IDs derrotados no store
    defeatedBossIds.forEach((id) => {
      const bossDef = BOSS_LIST.find((item) => item.id === id);
      if (bossDef?.titleReward) {
        titles.add(bossDef.titleReward);
      }
    });

    return titles;
  }, [unlockedAchievements, bossBattles, defeatedBossIds]);

  // Métricas agregadas
  const totalAchievements = ALL_POSSIBLE_ACHIEVEMENTS.length;
  const unlockedAchievementsCount = unlockedAchievements.length;
  const achievementProgressPct = Math.round((unlockedAchievementsCount / totalAchievements) * 100);

  const totalTitles = ALL_PRESTIGE_TITLES.length;
  const unlockedTitlesCount = unlockedTitlesSet.size;

  const totalBosses = BOSS_LIST.length;
  const defeatedBossCount = new Set([
    ...defeatedBossIds,
    ...bossBattles.filter((b) => b.defeated).map((b) => b.boss_id),
  ]).size;

  const totalXpEarned = useMemo(() => {
    let sum = 0;
    unlockedAchievements.forEach((ach) => {
      const match = ALL_POSSIBLE_ACHIEVEMENTS.find((p) => p.title === ach.title);
      if (match) sum += match.xp;
    });
    return sum;
  }, [unlockedAchievements]);

  // Handler para equipar título
  const handleEquipTitle = async (titleName: string) => {
    if (!user?.id || equippingTitle) return;
    setEquippingTitle(titleName);
    try {
      await hunterStore.equipTitle(titleName, user.id);
    } finally {
      setEquippingTitle(null);
    }
  };

  // Renderizar ícone da conquista
  const renderAchievementIcon = (iconName: string, isUnlocked: boolean) => {
    const iconClass = `size-5 ${isUnlocked ? 'text-amber-400' : 'text-slate-500'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'Calendar':
        return <Calendar className={iconClass} />;
      case 'Shield':
        return <Shield className={iconClass} />;
      case 'Crown':
        return <Crown className={iconClass} />;
      case 'Sword':
        return <Sword className={iconClass} />;
      case 'Book':
        return <BookOpen className={iconClass} />;
      case 'Heart':
        return <Heart className={iconClass} />;
      case 'Brain':
        return <Brain className={iconClass} />;
      case 'Compass':
        return <Compass className={iconClass} />;
      case 'Scale':
        return <Scale className={iconClass} />;
      default:
        return <Award className={iconClass} />;
    }
  };

  // Conquistas filtradas
  const filteredAchievements = useMemo(() => {
    return ALL_POSSIBLE_ACHIEVEMENTS.filter((item) => {
      const isUnlocked = unlockedAchievements.some((a) => a.title === item.title);
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
      return true;
    });
  }, [unlockedAchievements, statusFilter, categoryFilter]);

  // Títulos filtrados
  const filteredTitles = useMemo(() => {
    return ALL_PRESTIGE_TITLES.filter((item) => {
      const isUnlocked = unlockedTitlesSet.has(item.name);
      if (statusFilter === 'unlocked' && !isUnlocked) return false;
      if (statusFilter === 'locked' && isUnlocked) return false;
      return true;
    });
  }, [unlockedTitlesSet, statusFilter]);

  // Chefes com status
  const bossesWithStatus = useMemo(() => {
    return BOSS_LIST.map((boss) => {
      const battleRecord = bossBattles.find((b) => b.boss_id === boss.id);
      const isDefeated =
        defeatedBossIds.includes(boss.id) || Boolean(battleRecord?.defeated);
      const isActive = activeBattle?.boss_id === boss.id && !isDefeated;
      return {
        ...boss,
        isDefeated,
        isActive,
        defeatedAt: battleRecord?.defeated_at,
        currentHp: isActive ? activeBattle?.current_hp ?? boss.maxHp : isDefeated ? 0 : boss.maxHp,
      };
    }).filter((item) => {
      if (statusFilter === 'unlocked' && !item.isDefeated) return false;
      if (statusFilter === 'locked' && item.isDefeated) return false;
      return true;
    });
  }, [bossBattles, defeatedBossIds, activeBattle, statusFilter]);

  // Formatar data de desbloqueio
  const formatDate = (isoString?: string | null) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return new Intl.DateTimeFormat(language === 'en-US' ? 'en-US' : 'pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-8 pb-28">
      {/* ── BOTÃO DE RETORNO RÁPIDO ───────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-white/20 hover:text-white active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>{l('Voltar', 'Back')}</span>
        </button>

        <div className="flex items-center gap-2">
          <Link
            to="/status"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-purple-300 transition hover:bg-purple-500/20"
          >
            <span>{l('Player Status', 'Player Status')}</span>
          </Link>
          <Link
            to="/bosses"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-2 font-orbitron text-xs font-bold uppercase tracking-wider text-cyan-300 transition hover:bg-cyan-500/20"
          >
            <span>{l('Portal de Raids', 'Raid Portal')}</span>
            <ExternalLink size={13} />
          </Link>
        </div>
      </div>

      {/* ── HERO / CABEÇALHO DO SALÃO DE CONQUISTAS ─────────── */}
      <HudCard variant="gold" corners className="p-5 sm:p-7 shadow-[0_0_35px_rgba(245,158,11,0.12)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 grid gap-6 xl:grid-cols-[1.2fr_1fr] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 font-orbitron text-[10px] font-black uppercase tracking-widest text-amber-300">
                ASCEND TROPHY ROOM
              </span>
              <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                {l('Galeria de Honrarias', 'Hall of Honors')}
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-black uppercase tracking-wider text-white sm:text-3xl font-orbitron">
              {l('Salão de Conquistas & Troféus', 'Hall of Trophies & Honors')}
            </h1>

            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              {l(
                'Registro lendário da sua evolução pessoal no ASCEND. Conquistas desbloqueadas, títulos de prestígio equipáveis e troféus das entidades purificadas nas fendas dimensionais.',
                'Legendary chronicle of your personal growth in ASCEND. Unlocked achievements, equipable prestige titles, and trophies of entities purified across dimensional rifts.'
              )}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <RankBadge rank={hunterStore.rank} size="sm" showLabel={false} />
              <div className="text-xs text-slate-300">
                {l('Caçador', 'Hunter')} <strong className="text-white">{hunterStore.fullName || hunterStore.username}</strong> · {l('Título Atual', 'Current Title')}:{' '}
                <strong className="text-amber-300 font-orbitron">
                  {language === 'en-US' ? EN_TITLE_COPY[hunterStore.activeTitle]?.name || hunterStore.activeTitle : hunterStore.activeTitle}
                </strong>
              </div>
            </div>
          </div>

          {/* Cards de Métricas do Salão */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/5 bg-black/40 p-3.5 sm:p-4 hover:border-amber-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <Trophy className="size-4 text-amber-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 font-orbitron">
                  {achievementProgressPct}%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">{l('Conquistas', 'Achievements')}</p>
              <p className="mt-1 text-lg font-black text-white font-orbitron">
                {unlockedAchievementsCount} <span className="text-xs text-slate-500 font-normal">/ {totalAchievements}</span>
              </p>
              <div className="mt-2.5">
                <NeonProgressBar value={achievementProgressPct} variant="xp" size="sm" />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-3.5 sm:p-4 hover:border-purple-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <Crown className="size-4 text-purple-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 font-orbitron">
                  {Math.round((unlockedTitlesCount / totalTitles) * 100)}%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">{l('Títulos Obtidos', 'Titles Earned')}</p>
              <p className="mt-1 text-lg font-black text-white font-orbitron">
                {unlockedTitlesCount} <span className="text-xs text-slate-500 font-normal">/ {totalTitles}</span>
              </p>
              <div className="mt-2.5">
                <NeonProgressBar
                  value={(unlockedTitlesCount / totalTitles) * 100}
                  variant="xp"
                  size="sm"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-3.5 sm:p-4 hover:border-cyan-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <Swords className="size-4 text-cyan-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-orbitron">
                  {Math.round((defeatedBossCount / totalBosses) * 100)}%
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">{l('Chefes Purificados', 'Purified Bosses')}</p>
              <p className="mt-1 text-lg font-black text-white font-orbitron">
                {defeatedBossCount} <span className="text-xs text-slate-500 font-normal">/ {totalBosses}</span>
              </p>
              <div className="mt-2.5">
                <NeonProgressBar
                  value={(defeatedBossCount / totalBosses) * 100}
                  variant="cyan"
                  size="sm"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/5 bg-black/40 p-3.5 sm:p-4 hover:border-emerald-500/20 transition-colors">
              <div className="flex items-center justify-between">
                <Zap className="size-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 font-orbitron">
                  XP
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-slate-400">{l('XP de Conquistas', 'Achievement XP')}</p>
              <p className="mt-1 text-lg font-black text-emerald-300 font-orbitron">
                +{totalXpEarned} <span className="text-xs text-slate-400 font-sans font-bold">XP</span>
              </p>
              <p className="mt-2 text-[10px] text-slate-500">
                {l('Recompensas atômicas', 'Claimed awards')}
              </p>
            </div>
          </div>
        </div>
      </HudCard>

      {/* ── BARRA DE FILTROS ERGONÔMICA ───────────────────────── */}
      <div className="space-y-3">
        {/* Filtro de Abas Principais */}
        <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
          {[
            { id: 'all', label: l('Visão Completa', 'Full View'), count: totalAchievements + totalTitles + totalBosses },
            { id: 'achievements', label: l('Conquistas', 'Achievements'), count: totalAchievements },
            { id: 'titles', label: l('Títulos de Prestígio', 'Prestige Titles'), count: totalTitles },
            { id: 'bosses', label: l('Troféus de Raid', 'Raid Trophies'), count: totalBosses },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 font-orbitron text-xs font-bold uppercase tracking-wider transition-all select-none ${
                activeTab === tab.id
                  ? 'border border-amber-500/60 bg-amber-500/20 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border border-white/5 bg-white/[0.025] text-slate-400 hover:border-white/15 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span className="rounded-md bg-black/40 px-1.5 py-0.5 text-[10px] tabular-nums text-slate-300">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sub-filtros por Status de Desbloqueio e Categoria */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-bold uppercase text-[10px] font-orbitron mr-1">
              {l('Status', 'Status')}:
            </span>
            {[
              { id: 'all', label: l('Todos', 'All') },
              { id: 'unlocked', label: l('Desbloqueados', 'Unlocked') },
              { id: 'locked', label: l('Bloqueados', 'Locked') },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as typeof statusFilter)}
                className={`min-h-[36px] rounded-lg border px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider transition ${
                  statusFilter === filter.id
                    ? 'border-amber-400/40 bg-amber-500/15 text-amber-300'
                    : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {(activeTab === 'all' || activeTab === 'achievements') && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold uppercase text-[10px] font-orbitron mr-1">
                {l('Categoria', 'Category')}:
              </span>
              {[
                { id: 'all', label: l('Todas', 'All') },
                { id: 'streak', label: l('Streaks', 'Streaks') },
                { id: 'stats', label: l('Atributos', 'Attributes') },
                { id: 'boss', label: l('Chefes', 'Bosses') },
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setCategoryFilter(filter.id as typeof categoryFilter)}
                  className={`min-h-[36px] rounded-lg border px-3 py-1 font-orbitron text-[10px] font-bold uppercase tracking-wider transition ${
                    categoryFilter === filter.id
                      ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300'
                      : 'border-white/5 bg-white/[0.02] text-slate-400 hover:text-white'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="relative size-14">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/10" />
            <div className="absolute inset-0 rounded-full border-t-2 border-amber-500 animate-spin" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 animate-pulse font-orbitron">
            {l('Acessando o Códex de Conquistas...', 'Accessing Achievement Codex...')}
          </p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* ══════════════════════════════════════════════════════
              SEÇÃO 1: GALERIA DE CONQUISTAS DO SISTEMA
             ══════════════════════════════════════════════════════ */}
          {(activeTab === 'all' || activeTab === 'achievements') && (
            <section aria-labelledby="section-achievements-heading" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-amber-400 shadow-[0_0_8px_#F59E0B]" />
                  <h2
                    id="section-achievements-heading"
                    className="font-orbitron text-base sm:text-lg font-black uppercase tracking-wider text-white"
                  >
                    {l('Insígnias & Conquistas', 'Badges & Achievements')}
                  </h2>
                </div>
                <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-orbitron text-xs font-bold text-amber-300 tabular-nums">
                  {filteredAchievements.length} {l('listadas', 'listed')}
                </span>
              </div>

              {filteredAchievements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-center text-slate-500">
                  <p className="text-xs font-bold uppercase tracking-widest font-orbitron">
                    {l('Nenhuma conquista encontrada com os filtros selecionados.', 'No achievements found with active filters.')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredAchievements.map((item) => {
                    const unlockRecord = unlockedAchievements.find((a) => a.title === item.title);
                    const isUnlocked = Boolean(unlockRecord);
                    const localizedCopy = language === 'en-US' ? EN_ACHIEVEMENT_COPY[item.key] : null;
                    const displayTitle = localizedCopy?.title || item.title;
                    const displayDesc = localizedCopy?.desc || item.desc;
                    const unlockDate = formatDate(unlockRecord?.unlocked_at);

                    return (
                      <motion.div
                        key={item.key}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                      >
                        <HudCard
                          variant={isUnlocked ? 'gold' : 'default'}
                          corners={isUnlocked}
                          className={`h-full transition-all duration-200 ${
                            isUnlocked
                              ? 'border-amber-500/30 bg-[#0F0F14]'
                              : 'border-white/5 bg-black/40 opacity-70 hover:opacity-90'
                          }`}
                        >
                          <div className="flex h-full flex-col justify-between p-4 sm:p-5">
                            <div>
                              {/* Topo do card com medalha e status */}
                              <div className="flex items-start justify-between gap-3">
                                <div
                                  className={`flex size-11 items-center justify-center rounded-xl border transition-all ${
                                    isUnlocked
                                      ? 'border-amber-500/40 bg-amber-500/15 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                                      : 'border-white/10 bg-white/5'
                                  }`}
                                >
                                  {renderAchievementIcon(item.icon, isUnlocked)}
                                </div>

                                <div className="text-right">
                                  {isUnlocked ? (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-400 font-orbitron">
                                      <CheckCircle2 size={10} />
                                      {l('CONQUISTADA', 'UNLOCKED')}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-orbitron">
                                      <Lock size={10} />
                                      {l('BLOQUEADA', 'LOCKED')}
                                    </span>
                                  )}
                                  {unlockDate && (
                                    <p className="mt-1 text-[9px] text-slate-500 font-mono">
                                      {unlockDate}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Título e Descrição */}
                              <div className="mt-3.5">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-orbitron">
                                  {item.category === 'streak'
                                    ? l('Constância Diária', 'Daily Streak')
                                    : item.category === 'stats'
                                      ? l('Meta de Atributo', 'Stat Milestone')
                                      : l('Conquista de Chefe', 'Boss Conquest')}
                                </span>
                                <h3
                                  className={`mt-0.5 text-sm font-bold uppercase tracking-wider font-orbitron ${
                                    isUnlocked ? 'text-white' : 'text-slate-400'
                                  }`}
                                >
                                  {displayTitle}
                                </h3>
                                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                                  {displayDesc}
                                </p>
                              </div>
                            </div>

                            {/* Recompensas da Conquista */}
                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-orbitron">
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                <Zap size={11} className="text-emerald-400" />
                                +{item.xp} XP
                              </span>
                              <span className="text-amber-300 font-bold text-[10px] truncate max-w-[150px]">
                                {language === 'en-US' ? EN_TITLE_COPY[item.titleReward]?.name || item.titleReward : item.titleReward}
                              </span>
                            </div>
                          </div>
                        </HudCard>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ══════════════════════════════════════════════════════
              SEÇÃO 2: SALÃO DE TÍTULOS DE PRESTÍGIO
             ══════════════════════════════════════════════════════ */}
          {(activeTab === 'all' || activeTab === 'titles') && (
            <section aria-labelledby="section-titles-heading" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-purple-400 shadow-[0_0_8px_#A855F7]" />
                  <h2
                    id="section-titles-heading"
                    className="font-orbitron text-base sm:text-lg font-black uppercase tracking-wider text-white"
                  >
                    {l('Títulos de Prestígio', 'Prestige Titles')}
                  </h2>
                </div>
                <span className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 font-orbitron text-xs font-bold text-purple-300 tabular-nums">
                  {unlockedTitlesCount} / {totalTitles} {l('desbloqueados', 'unlocked')}
                </span>
              </div>

              {/* Banner do Título Atualmente Equipado */}
              <HudCard variant="purple" corners className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-purple-500/40 bg-purple-500/20 text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                      <Crown size={22} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 font-orbitron">
                        {l('Título Atualmente Equipado', 'Currently Equipped Title')}
                      </span>
                      <h3 className="text-xl font-black uppercase text-white font-orbitron">
                        {language === 'en-US'
                          ? EN_TITLE_COPY[hunterStore.activeTitle]?.name || hunterStore.activeTitle
                          : hunterStore.activeTitle}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {l(
                          'Este título é exibido no seu cabeçalho HUD e na ficha do personagem.',
                          'This title is displayed on your HUD header and Hunter profile.'
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-400 font-orbitron">
                    <CheckCircle2 size={13} />
                    {l('ATIVO NO PERFIL', 'ACTIVE ON PROFILE')}
                  </span>
                </div>
              </HudCard>

              {/* Grid de Todos os 19 Títulos */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTitles.map((title) => {
                  const isUnlocked = unlockedTitlesSet.has(title.name);
                  const isEquipped = hunterStore.activeTitle === title.name;
                  const localizedTitle = language === 'en-US' ? EN_TITLE_COPY[title.name] : null;
                  const displayName = localizedTitle?.name || title.name;
                  const displaySource = localizedTitle?.source || title.sourceDescription;

                  return (
                    <motion.div
                      key={title.name}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                      className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                        isEquipped
                          ? 'border-amber-400/60 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                          : isUnlocked
                            ? 'border-white/10 bg-[#0F0F14] hover:border-purple-500/30'
                            : 'border-white/5 bg-black/40 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider font-orbitron ${
                              title.category === 'boss'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : title.category === 'stats'
                                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                                  : title.category === 'streak'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                            }`}
                          >
                            {title.category.toUpperCase()}
                          </span>

                          {isEquipped ? (
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-400 font-orbitron">
                              <Crown size={11} /> {l('Equipado', 'Equipped')}
                            </span>
                          ) : isUnlocked ? (
                            <span className="text-[10px] font-bold uppercase text-emerald-400 font-orbitron">
                              {l('Disponível', 'Available')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500 font-orbitron">
                              <Lock size={11} /> {l('Bloqueado', 'Locked')}
                            </span>
                          )}
                        </div>

                        <h3 className="mt-2.5 text-sm font-black uppercase tracking-wider text-white font-orbitron">
                          {displayName}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                          {displaySource}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5">
                        {isEquipped ? (
                          <div className="w-full py-2 text-center text-xs font-bold uppercase tracking-wider text-amber-300 font-orbitron">
                            ✓ {l('Em uso', 'In use')}
                          </div>
                        ) : isUnlocked ? (
                          <TacticalButton
                            variant="secondary"
                            accent="purple"
                            fullWidth
                            disabled={Boolean(equippingTitle)}
                            onClick={() => void handleEquipTitle(title.name)}
                            leftIcon={
                              equippingTitle === title.name ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Crown size={13} />
                              )
                            }
                          >
                            {equippingTitle === title.name ? l('Equipando...', 'Equipping...') : l('Equipar Título', 'Equip Title')}
                          </TacticalButton>
                        ) : (
                          <div className="w-full py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-600 font-orbitron">
                            {l('Requisito pendente', 'Requirement locked')}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ══════════════════════════════════════════════════════
              SEÇÃO 3: TROFÉUS DE RAID (CHEFES PURIFICADOS)
             ══════════════════════════════════════════════════════ */}
          {(activeTab === 'all' || activeTab === 'bosses') && (
            <section aria-labelledby="section-bosses-heading" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#00F0FF]" />
                  <h2
                    id="section-bosses-heading"
                    className="font-orbitron text-base sm:text-lg font-black uppercase tracking-wider text-white"
                  >
                    {l('Troféus de Raid & Relíquias', 'Raid Trophies & Relics')}
                  </h2>
                </div>
                <span className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-orbitron text-xs font-bold text-cyan-300 tabular-nums">
                  {defeatedBossCount} / {totalBosses} {l('purificados', 'purified')}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {bossesWithStatus.map((boss) => {
                  const defeatDate = formatDate(boss.defeatedAt);
                  return (
                    <motion.div
                      key={boss.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: reduceMotion ? 0.01 : 0.2 }}
                    >
                      <HudCard
                        variant={boss.isDefeated ? 'success' : boss.isActive ? 'purple' : 'default'}
                        corners={boss.isDefeated}
                        className={`h-full overflow-hidden transition-all duration-200 ${
                          boss.isDefeated
                            ? 'border-emerald-500/30 bg-[#0C0E14]'
                            : boss.isActive
                              ? 'border-purple-500/40 bg-[#0F0D16] shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                              : 'border-white/5 bg-black/40 opacity-70'
                        }`}
                      >
                        {/* Imagem do Chefe */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden bg-black/60">
                          <div
                            className={`absolute inset-0 bg-cover bg-center transition-transform duration-700 ${
                              boss.isDefeated
                                ? 'opacity-70 group-hover:scale-105'
                                : boss.isActive
                                  ? 'opacity-85'
                                  : 'grayscale opacity-25'
                            }`}
                            style={{ backgroundImage: `url('${boss.image}')` }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-black/40 to-transparent" />

                          {/* Badge de Status sobreposto */}
                          <div className="absolute top-3 right-3">
                            {boss.isDefeated ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-300 font-orbitron shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                                <Trophy size={11} /> {l('PURIFICADO', 'PURIFIED')}
                              </span>
                            ) : boss.isActive ? (
                              <span className="inline-flex items-center gap-1 rounded-md border border-purple-500/50 bg-purple-500/25 px-2.5 py-1 text-[10px] font-black uppercase text-purple-200 font-orbitron animate-pulse">
                                <Zap size={11} /> {l('EM COMBATE', 'IN BATTLE')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-400 font-orbitron">
                                <Lock size={11} /> {l('SELADO', 'SEALED')}
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-orbitron">
                              {boss.title}
                            </span>
                            <h3 className="text-base font-black uppercase tracking-wider text-white font-orbitron truncate">
                              {boss.name}
                            </h3>
                          </div>
                        </div>

                        {/* Conteúdo do Card */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
                          <div>
                            {boss.isDefeated ? (
                              <p className="text-xs text-slate-300 italic leading-relaxed border-l-2 border-emerald-500/40 pl-3 bg-emerald-500/5 py-2 rounded-r-lg">
                                “{boss.victoryLore}”
                              </p>
                            ) : (
                              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                {boss.lore}
                              </p>
                            )}

                            {defeatDate && (
                              <p className="mt-2 text-[10px] text-emerald-400 font-mono">
                                {l('Purificado em', 'Purified on')}: {defeatDate}
                              </p>
                            )}
                          </div>

                          {/* Recompensas / CTA */}
                          <div className="pt-3 border-t border-white/5 space-y-3">
                            <div className="flex items-center justify-between text-xs font-orbitron">
                              <span className="text-slate-400 text-[10px]">{l('Recompensa', 'Reward')}:</span>
                              <span className="text-amber-300 font-bold text-[10px]">
                                +{boss.xpReward} XP · {boss.titleReward}
                              </span>
                            </div>

                            {boss.isActive && (
                              <Link
                                to="/bosses"
                                className="w-full inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/15 py-2 text-xs font-black uppercase tracking-wider text-purple-200 transition hover:bg-purple-500/25 active:scale-98 font-orbitron"
                              >
                                <span>{l('Entrar na Batalha', 'Enter Battle')}</span>
                                <ChevronRight size={14} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </HudCard>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
