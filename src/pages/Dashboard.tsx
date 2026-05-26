import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Zap, 
  Flame, 
  CheckCircle2, 
  Circle,
  Dumbbell,
  Droplets,
  Apple,
  BookOpen,
  GraduationCap,
  Moon,
  Sword,
  Target,
  ShieldCheck,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useHunterStore } from '@/stores/useHunterStore';
import { RadarChart } from '@/components/ui/RadarChart';
import { ProductTour } from '@/components/rpg/ProductTour';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { UtensilsCrossed } from 'lucide-react';

export function Dashboard() {
  const state = useHunterStore();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    activeHabits, 
    completedToday, 
    toggleCompletion, 
    workoutMissions, 
    mealMissions,
    toggleMealMission
  } = useHabits();

  const [todayVolume, setTodayVolume] = React.useState<number>(0);
  const [loadingVolume, setLoadingVolume] = React.useState<boolean>(true);
  const [chartSize, setChartSize] = React.useState<number>(340);
  const [isAvatarOpen, setIsAvatarOpen] = React.useState(false);

  React.useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 480) {
        setChartSize(255);
      } else if (window.innerWidth < 768) {
        setChartSize(285);
      } else {
        setChartSize(340);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Performance Velo-System: StatusKey calculada para evitar requisições infinitas e desnecessárias no Supabase
  const workoutStatusKey = React.useMemo(() => {
    return JSON.stringify(workoutMissions.map(m => m.isCompleted));
  }, [workoutMissions]);

  React.useEffect(() => {
    async function fetchTodayVolume() {
      const uid = user?.id;
      if (!uid) return;
      try {
        setLoadingVolume(true);
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('workout_logs')
          .select('sets, reps, weight_kg')
          .eq('user_id', uid)
          .gte('logged_at', `${todayStr}T00:00:00.000Z`)
          .lte('logged_at', `${todayStr}T23:59:59.999Z`);

        if (error) throw error;

        const volume = (data || []).reduce((sum, log) => {
          const sets = log.sets || 0;
          const reps = log.reps || 0;
          const weight = log.weight_kg || 0;
          return sum + (sets * reps * weight);
        }, 0);

        setTodayVolume(volume);
      } catch (err) {
        console.error('Erro ao buscar volume de treino de hoje:', err);
      } finally {
        setLoadingVolume(false);
      }
    }

    void fetchTodayVolume();
  }, [user?.id, workoutStatusKey]);

  // Cores neon dinâmicas baseadas na classe atual do caçador para o painel de atalhos rápidos e elementos visuais
  const themeColors = React.useMemo(() => {
    const classColorMap: Record<string, { border: string; text: string; bg: string; glow: string; shadowColor: string }> = {
      warrior: { 
        border: 'border-blue-500/30 hover:border-blue-500/60', 
        text: 'text-blue-400', 
        bg: 'bg-blue-500/5 hover:bg-blue-500/10',
        glow: 'shadow-[0_0_15px_rgba(59,130,246,0.15)]',
        shadowColor: 'rgba(59, 130, 246, 0.4)'
      },
      scholar: { 
        border: 'border-purple-500/30 hover:border-purple-500/60', 
        text: 'text-purple-400', 
        bg: 'bg-purple-500/5 hover:bg-purple-500/10',
        glow: 'shadow-[0_0_15px_rgba(124,58,237,0.15)]',
        shadowColor: 'rgba(124, 58, 237, 0.4)'
      },
      monk: { 
        border: 'border-cyan-500/30 hover:border-cyan-500/60', 
        text: 'text-cyan-400', 
        bg: 'bg-cyan-500/5 hover:bg-cyan-500/10',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        shadowColor: 'rgba(6, 182, 212, 0.4)'
      },
      titan: { 
        border: 'border-red-500/30 hover:border-red-500/60', 
        text: 'text-red-400', 
        bg: 'bg-red-500/5 hover:bg-red-500/10',
        glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
        shadowColor: 'rgba(239, 68, 68, 0.4)'
      },
    };
    const currentClass = (state.hunterClass || 'warrior').toLowerCase();
    return classColorMap[currentClass] || classColorMap.warrior;
  }, [state.hunterClass]);

  // Avatar dinâmico e reativo de Classe/Rank do Caçador
  const characterAvatar = React.useMemo(() => {
    const hClass = state.hunterClass || 'Warrior';
    const rank = state.rank || 'E';
    
    const getRankImageName = (r: string) => {
      const upperRank = r.toUpperCase();
      if (['E', 'D', 'C', 'B', 'A', 'S'].includes(upperRank)) {
        return `Rank ${upperRank}`;
      }
      if (upperRank === 'NATIONAL' || upperRank === 'MONARCH') {
        return 'Rank S';
      }
      return 'Rank E';
    };
    
    const rankName = getRankImageName(rank);
    const classFolder = hClass.charAt(0).toUpperCase() + hClass.slice(1).toLowerCase();
    const validClasses = ['Warrior', 'Scholar', 'Monk', 'Titan'];
    const finalClass = validClasses.includes(classFolder) ? classFolder : 'Warrior';
    
    return `/Classes/${finalClass}/${rankName}.jpeg`;
  }, [state.hunterClass, state.rank]);

  // Performance Velo-System: Memorização de cálculos complexos de missões diárias
  const { xpPercent, statsData, progressPct, totalCaloriesToday, energyLevel, dashboardMissions } = React.useMemo(() => {
    const xpPct = (state.xp / state.xpRequired) * 100;
    
    const stats = [
      { label: 'FOR', value: state.stats.strength, max: 100 },
      { label: 'INT', value: state.stats.intelligence, max: 100 },
      { label: 'RES', value: state.stats.endurance, max: 100 },
      { label: 'VIT', value: state.stats.vitality, max: 100 },
      { label: 'DIS', value: state.stats.discipline, max: 100 },
    ];

    const total = activeHabits.length + workoutMissions.length + mealMissions.length;
    const completed = completedToday.size + 
      workoutMissions.filter(m => m.isCompleted).length + 
      mealMissions.filter(m => m.isCompleted).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    
    const kcalToday = mealMissions
      .filter(m => m.isCompleted)
      .reduce((sum, m) => sum + (m.totalKcal || 0), 0);

    const energy = total > 0 ? Math.max(20, Math.round(progress)) : 100;

    type UnifiedMission = 
      | { type: 'workout'; data: any; time: string | null }
      | { type: 'meal'; data: any; time: string | null }
      | { type: 'habit'; data: any; time: string | null };

    const missions: UnifiedMission[] = [
      ...workoutMissions.map(m => ({ type: 'workout' as const, data: m, time: m.scheduled_time })),
      ...mealMissions.map(m => ({ type: 'meal' as const, data: m, time: m.scheduled_time })),
      ...activeHabits.map(h => ({ type: 'habit' as const, data: h, time: h.scheduled_time ? h.scheduled_time.slice(0, 5) : null }))
    ];

    missions.sort((a, b) => {
      if (!a.time && !b.time) return 0;
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });

    return {
      xpPercent: xpPct,
      statsData: stats,
      progressPct: progress,
      totalCaloriesToday: kcalToday,
      energyLevel: energy,
      dashboardMissions: missions.slice(0, 10)
    };
  }, [state.xp, state.xpRequired, state.stats, activeHabits, completedToday, workoutMissions, mealMissions]);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Hunter Status Header ──────────────────────────── */}
      <motion.div
        id="tour-hud"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-2xl"
      >
        {/* Glow Effects */}
        <div className="absolute -right-20 -top-20 size-80 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute -bottom-20 -left-20 size-80 rounded-full bg-blue-600/5 blur-[100px]" />
        
        <div className="relative flex flex-col gap-6 md:gap-8 md:flex-row md:items-center">
          {/* Avatar & Rank Container */}
          <div className="flex shrink-0 gap-4 sm:gap-6 items-center justify-center">
            {/* Avatar de Classe Dinâmico */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => setIsAvatarOpen(true)}
              transition={{ duration: 0.2 }}
              className={`relative size-24 sm:size-32 rounded-2xl sm:rounded-3xl overflow-hidden border bg-black/40 group cursor-pointer ${themeColors.border} ${themeColors.glow}`}
            >
              <img 
                src={characterAvatar} 
                alt="Avatar do Caçador" 
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-115"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
            </motion.div>

            {/* Rank Badge */}
            <motion.div 
              whileHover={{ 
                scale: 1.05,
                rotate: [0, -1, 1, 0],
                boxShadow: `0 0 35px ${themeColors.shadowColor}`,
                borderColor: 'rgba(59, 130, 246, 0.6)'
              }}
              transition={{ duration: 0.2 }}
              className="relative flex size-24 sm:size-32 items-center justify-center rounded-2xl sm:rounded-3xl border border-blue-500/30 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.2)] cursor-pointer"
            >
              <span className="text-4xl sm:text-6xl font-black text-blue-500 italic drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {state.rank || 'E'}
              </span>
              <div className="absolute -bottom-3 rounded-full bg-blue-600 px-4 py-1 text-[9px] font-black uppercase tracking-[0.2em] text-white shadow-xl">
                RANK
              </div>
            </motion.div>
          </div>

          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase italic animate-pulse-blue" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {state.username || 'Hunter'}
                  </h1>
                  <div className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-blue-400">
                    <Zap size={12} className="fill-current" />
                    {state.hunterClass || 'Shadow Monarch'}
                  </div>
                </div>
                <p className="mt-2 flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest italic">
                  Level {state.level} Hunter <span className="text-gray-700">•</span> O {state.hunterClass || 'Desperto'}
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Streak Atual</p>
                  <p className="text-2xl font-black text-orange-500 italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {state.streak.current} Dias
                  </p>
                </div>
              </div>
            </div>

            {/* XP Bar Progress */}
            <div className="space-y-3">
              <div className="flex items-end justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Experience Points</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {state.xp} <span className="text-gray-600">/</span> {state.xpRequired} XP
                  </span>
                  {state.streak.current > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5 border border-orange-500/20">
                      <Flame size={10} className="text-orange-500 fill-current" />
                      <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">
                        +{Math.min(state.streak.current * 2, 100)}% XP BONUS
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-black/40 p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.8, ease: 'circOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Atalhos Rápidos de Sistema (Acesso Fácil) ───────────────── */}
      <motion.div
        id="tour-shortcuts"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/workouts')}
          className={`flex items-center gap-3 rounded-xl border bg-black/40 p-3.5 transition-all text-left group cursor-pointer ${themeColors.border} ${themeColors.bg} ${themeColors.glow}`}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
            <Dumbbell size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white uppercase tracking-wider font-orbitron truncate">Treinamento</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">Módulo Treinos</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/nutrition')}
          className={`flex items-center gap-3 rounded-xl border bg-black/40 p-3.5 transition-all text-left group cursor-pointer ${themeColors.border} ${themeColors.bg} ${themeColors.glow}`}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 group-hover:scale-110 transition-transform">
            <Apple size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white uppercase tracking-wider font-orbitron truncate">Recuperação</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">Restaurar Mana</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/quests')}
          className={`flex items-center gap-3 rounded-xl border bg-black/40 p-3.5 transition-all text-left group cursor-pointer ${themeColors.border} ${themeColors.bg} ${themeColors.glow}`}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white uppercase tracking-wider font-orbitron truncate">Missões</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">Acessar Fenda</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, translateY: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/settings')}
          className={`flex items-center gap-3 rounded-xl border bg-black/40 p-3.5 transition-all text-left group cursor-pointer ${themeColors.border} ${themeColors.bg} ${themeColors.glow}`}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-500/10 text-gray-400 group-hover:scale-110 transition-transform">
            <Settings size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white uppercase tracking-wider font-orbitron truncate">Ajustes</p>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate">Menu Sistema</p>
          </div>
        </motion.button>
      </motion.div>

      {/* ── Grid Principal de Storytelling Bento RPG ─────────────────── */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        
        {/* 📜 ── Missões Diárias (Quests Ativas - Fenda do Dia) ── */}
        {/* Ocupa 7 colunas no Desktop e sobe no mobile para usabilidade snapper */}
        <motion.div
          id="tour-quests"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl sm:rounded-[2rem] border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl order-1 lg:order-1 lg:col-span-7"
        >
          <div className="mb-6 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-black uppercase tracking-tight text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Missões <span className="text-blue-500">Diárias</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
                Fendas Ativas • Progresso: {Math.round(progressPct)}%
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-[9px] font-black text-blue-500 uppercase tracking-widest italic shadow-[0_0_10px_rgba(59,130,246,0.1)]">
              Sincronizado
            </div>
          </div>

          <div className="space-y-3.5">
            {dashboardMissions.length === 0 ? (
              <div className="py-20 text-center space-y-4">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-white/5">
                  <Sword size={32} className="text-gray-700" />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-600">Nenhuma Quest Ativa no Momento.</p>
                <button onClick={() => navigate('/quests')} className="inline-block text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline cursor-pointer">
                  + Ativar Protocolo de Missão
                </button>
              </div>
            ) : (
              <>
                {dashboardMissions.map((mission, idx) => {
                  if (mission.type === 'workout') {
                    const m = mission.data;
                    return (
                      <motion.button
                        key={`workout_${m.id}_${idx}`}
                        onClick={() => navigate('/workouts')}
                        whileHover={{ 
                          scale: 1.01, 
                          x: 4,
                          boxShadow: '0 0 20px rgba(147, 51, 234, 0.15)',
                          borderColor: 'rgba(147, 51, 234, 0.4)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all cursor-pointer ${
                          m.isCompleted
                            ? 'border-purple-500/30 bg-purple-500/10'
                            : 'border-purple-500/20 bg-purple-900/5 hover:border-purple-500/50 hover:bg-purple-900/15'
                        }`}
                      >
                        <div className={`flex size-10 items-center justify-center rounded-xl transition-all ${
                          m.isCompleted ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]' : 'bg-purple-600/20 text-purple-400'
                        }`}>
                          {m.isCompleted ? <ShieldCheck size={18} /> : <Dumbbell size={18} />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            {mission.time && (
                              <span className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                {mission.time}
                              </span>
                            )}
                            <p className={`text-sm font-bold uppercase tracking-tight truncate transition-all ${
                              m.isCompleted ? 'text-white line-through opacity-40' : 'text-gray-200'
                            }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {m.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">+{m.xp_reward} XP • Treino</span>
                          </div>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-purple-500 group-hover:text-purple-300 transition-colors shrink-0">
                          {m.isCompleted ? 'Concluído' : 'Iniciar →'}
                        </div>
                      </motion.button>
                    );
                  } else if (mission.type === 'meal') {
                    const m = mission.data;
                    return (
                      <motion.button
                        key={`meal_${m.id}_${idx}`}
                        onClick={() => toggleMealMission(m.meal_plan_id)}
                        whileHover={{ 
                          scale: 1.01, 
                          x: 4,
                          boxShadow: '0 0 20px rgba(249, 115, 22, 0.15)',
                          borderColor: 'rgba(249, 115, 22, 0.4)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all cursor-pointer ${
                          m.isCompleted
                            ? 'border-orange-500/30 bg-orange-500/10'
                            : 'border-orange-500/20 bg-orange-900/5 hover:border-orange-500/50 hover:bg-orange-900/15'
                        }`}
                      >
                        <div className={`flex size-10 items-center justify-center rounded-xl transition-all ${
                          m.isCompleted ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' : 'bg-orange-500/10 text-orange-400'
                        }`}>
                          {m.isCompleted ? <CheckCircle2 size={18} /> : <UtensilsCrossed size={18} />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            {mission.time && (
                              <span className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                {mission.time}
                              </span>
                            )}
                            <p className={`text-sm font-bold uppercase tracking-tight truncate transition-all ${
                              m.isCompleted ? 'text-white line-through opacity-40' : 'text-gray-200'
                            }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                              {m.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-orange-400">
                              +{m.xp_reward} XP • {m.totalKcal > 0 ? `${m.totalKcal} kcal` : 'Alimentação'}
                            </span>
                          </div>
                        </div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-orange-400 group-hover:text-orange-300 transition-colors shrink-0">
                          {m.isCompleted ? 'Concluído' : 'Marcar →'}
                        </div>
                      </motion.button>
                    );
                  } else {
                    const quest = mission.data;
                    const isCompleted = completedToday.has(quest.id);
                    return (
                      <motion.button
                        key={`habit_${quest.id}_${idx}`}
                        onClick={() => toggleCompletion(quest.id)}
                        whileHover={{ 
                          scale: 1.01, 
                          x: 4,
                          boxShadow: '0 0 20px rgba(59, 130, 246, 0.15)',
                          borderColor: 'rgba(59, 130, 246, 0.4)'
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all cursor-pointer ${
                          isCompleted 
                            ? 'border-blue-500/30 bg-blue-500/10' 
                            : 'border-[#1E1E26] bg-black/40 hover:border-blue-500/50 hover:bg-[#16161D]'
                        }`}
                      >
                        <div className={`flex size-10 items-center justify-center rounded-xl transition-all ${
                          isCompleted ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-[#1E1E26] text-gray-500 group-hover:text-white'
                        }`}>
                          {isCompleted ? <ShieldCheck size={18} /> : <Circle size={18} />}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center gap-2">
                            {mission.time && (
                              <span className="rounded bg-gray-800/80 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-300">
                                {mission.time}
                              </span>
                            )}
                            <p className={`text-sm font-bold tracking-wide truncate transition-all ${
                              isCompleted ? 'text-white line-through opacity-40' : 'text-gray-200 uppercase tracking-tight'
                            }`} style={{ fontFamily: isCompleted ? 'inherit' : 'Orbitron, sans-serif' }}>
                              {quest.title}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">
                              +{quest.xp_reward} XP
                            </span>
                            {quest.stat_target && (
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 italic">
                                {quest.stat_target.slice(0, 3).toUpperCase()} +{quest.stat_reward}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`transition-opacity shrink-0 ${isCompleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <Zap size={16} className={isCompleted ? 'text-blue-500' : 'text-gray-700'} />
                        </div>
                      </motion.button>
                    );
                  }
                })}
              </>
            )}
          </div>
          {progressPct === 100 && activeHabits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-center shadow-[0_0_30px_rgba(59,130,246,0.15)]"
            >
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-500">
                Limites Superados
              </p>
              <p className="mt-1.5 text-xs text-gray-400 leading-relaxed uppercase italic">
                Todas as missões diárias foram concluídas. Sua força está aumentando...
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* ⚔️ ── Janela de Status & Recursos Físicos Unificados ── */}
        {/* Ocupa 5 colunas no Desktop e fica embaixo no mobile para visualização consolidada */}
        <motion.div
          id="tour-status"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="rounded-2xl sm:rounded-[2rem] border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl order-2 lg:order-2 lg:col-span-5 flex flex-col justify-between"
        >
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Janela de <span className="text-blue-500">Status</span>
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Atributos de Combate RPG</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Target size={20} className="animate-pulse" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <RadarChart stats={statsData} size={chartSize} />
              
              {/* Atributos Básicos Alinhados */}
              <div className="mt-6 grid w-full grid-cols-5 gap-1.5 sm:gap-2">
                {statsData.map((stat) => (
                  <div key={stat.label} className="group flex flex-col items-center gap-1 sm:gap-1.5 rounded-xl border border-[#1E1E26] bg-black/40 py-2 transition-all hover:border-blue-500/30">
                    <span className="text-[8px] sm:text-[9px] font-black text-gray-500 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{stat.label}</span>
                    <span className="text-xs sm:text-base font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Storytelling: Registros Biométricos e Recursos Físicos de Caçador (Cards Unificados) ── */}
          <div id="tour-biometrics" className="border-t border-[#1E1E26] border-dashed pt-6 mt-8 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
              Registros Físicos & Recursos
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* Calorias */}
              <div 
                onClick={() => navigate('/nutrition')}
                className="group rounded-xl border border-[#1E1E26] bg-black/30 p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:border-orange-500/30 hover:bg-orange-500/5 duration-300"
              >
                <div className="flex items-center justify-between text-orange-500">
                  <Flame size={14} className="group-hover:scale-110 group-hover:rotate-6 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-gray-600 group-hover:text-orange-400 truncate">MANA</span>
                </div>
                <div className="mt-2.5">
                  <p className="text-sm font-black text-white italic font-orbitron truncate">
                    {totalCaloriesToday} <span className="text-[8px] text-gray-500 font-normal">kcal</span>
                  </p>
                </div>
              </div>

              {/* Volume */}
              <div 
                onClick={() => navigate('/workouts')}
                className="group rounded-xl border border-[#1E1E26] bg-black/30 p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:border-blue-500/30 hover:bg-blue-500/5 duration-300"
              >
                <div className="flex items-center justify-between text-blue-500">
                  <Dumbbell size={14} className="group-hover:scale-110 group-hover:-rotate-12 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-gray-600 group-hover:text-blue-400 truncate">VOLUME</span>
                </div>
                <div className="mt-2.5">
                  <p className="text-sm font-black text-white italic font-orbitron truncate">
                    {loadingVolume ? '...' : todayVolume} <span className="text-[8px] text-gray-500 font-normal">kg</span>
                  </p>
                </div>
              </div>

              {/* Energia */}
              <div 
                onClick={() => navigate('/')}
                className="group rounded-xl border border-[#1E1E26] bg-black/30 p-2.5 flex flex-col justify-between cursor-pointer transition-all hover:border-purple-500/30 hover:bg-purple-500/5 duration-300"
              >
                <div className="flex items-center justify-between text-purple-500">
                  <TrendingUp size={14} className="group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-[8px] font-black uppercase tracking-wider text-gray-600 group-hover:text-purple-400 truncate">FATIGA</span>
                </div>
                <div className="mt-2.5">
                  <p className="text-sm font-black text-white italic font-orbitron truncate">
                    {energyLevel}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
      </div>

      {/* ── Lightbox do Avatar ─────────────────────────────── */}
      <AnimatePresence>
        {isAvatarOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop escuro com blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAvatarOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            {/* Imagem Ampliada */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative max-w-[90vw] max-h-[85vh] sm:max-w-md w-full aspect-square rounded-3xl overflow-hidden border border-white/10 bg-black/40 shadow-2xl z-10"
            >
              <img
                src={characterAvatar}
                alt="Avatar do Caçador Ampliado"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase text-white font-orbitron tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {state.username || 'Hunter'}
                  </h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                    Rank {state.rank} • {state.hunterClass || 'Monarch'}
                  </p>
                </div>
                <button
                  onClick={() => setIsAvatarOpen(false)}
                  className="rounded-xl bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/20 transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sistema de Onboarding Tour Cyberpunk */}
      <ProductTour />
    </div>
  );
}

