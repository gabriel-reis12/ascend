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
  const [tasksCompletedToday, setTasksCompletedToday] = React.useState<number>(0);
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
    async function fetchDailyData() {
      const uid = user?.id;
      if (!uid) return;
      try {
        setLoadingVolume(true);
        const todayStr = new Date().toISOString().split('T')[0];
        
        // 1. Volume de Treino
        const { data: workoutData, error: workoutError } = await supabase
          .from('workout_logs')
          .select('sets, reps, weight_kg')
          .eq('user_id', uid)
          .gte('logged_at', `${todayStr}T00:00:00.000Z`)
          .lte('logged_at', `${todayStr}T23:59:59.999Z`);

        if (workoutError) throw workoutError;

        const volume = (workoutData || []).reduce((sum, log) => {
          const sets = log.sets || 0;
          const reps = log.reps || 0;
          const weight = log.weight_kg || 0;
          return sum + (sets * reps * weight);
        }, 0);

        setTodayVolume(volume);

        // 2. Tarefas Concluídas
        const { count, error: tasksError } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('completed', true)
          .gte('completed_at', `${todayStr}T00:00:00.000Z`)
          .lte('completed_at', `${todayStr}T23:59:59.999Z`);

        if (!tasksError && count !== null) {
          setTasksCompletedToday(count);
        }
      } catch (err) {
        console.error('Erro ao buscar dados diários do caçador:', err);
      } finally {
        setLoadingVolume(false);
      }
    }

    void fetchDailyData();
  }, [user?.id, workoutStatusKey, completedToday]);

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
      creator: { 
        border: 'border-amber-500/30 hover:border-amber-500/60', 
        text: 'text-amber-400', 
        bg: 'bg-amber-500/5 hover:bg-amber-500/10',
        glow: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]',
        shadowColor: 'rgba(251, 191, 36, 0.4)'
      },
      monk: { 
        border: 'border-cyan-500/30 hover:border-cyan-500/60', 
        text: 'text-cyan-400', 
        bg: 'bg-cyan-500/5 hover:bg-cyan-500/10',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.15)]',
        shadowColor: 'rgba(6, 182, 212, 0.4)'
      },
      leader: { 
        border: 'border-rose-500/30 hover:border-rose-500/60', 
        text: 'text-rose-400', 
        bg: 'bg-rose-500/5 hover:bg-rose-500/10',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.15)]',
        shadowColor: 'rgba(244, 63, 94, 0.4)'
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
    const validClasses = ['Warrior', 'Scholar', 'Creator', 'Monk', 'Leader'];
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
      { label: 'SAB', value: state.stats.wisdom, max: 100 },
      { label: 'EQU', value: state.stats.balance, max: 100 },
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

  // Atributos chaves por classe
  const classKeyStats = React.useMemo(() => {
    const hClass = (state.hunterClass || 'Warrior').toLowerCase();
    if (hClass === 'warrior') return ['strength', 'endurance'];
    if (hClass === 'scholar') return ['intelligence', 'wisdom'];
    if (hClass === 'creator') return ['discipline', 'balance'];
    if (hClass === 'monk') return ['vitality', 'balance'];
    if (hClass === 'leader') return ['discipline', 'wisdom'];
    return ['strength', 'endurance'];
  }, [state.hunterClass]);

  // Se completou a quest da classe
  const completedClassQuest = React.useMemo(() => {
    const finishedHabits = activeHabits.filter(h => completedToday.has(h.id));
    return finishedHabits.some(h => h.stat_target && classKeyStats.includes(h.stat_target));
  }, [activeHabits, completedToday, classKeyStats]);

  // Lista de Daily Main Quests
  const todayStr = React.useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const claimKey = React.useMemo(() => `daily_bonus_claimed_${user?.id}_${todayStr}`, [user?.id, todayStr]);
  const [bonusClaimed, setBonusClaimed] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (user?.id) {
      const claimed = localStorage.getItem(claimKey) === 'true';
      setBonusClaimed(claimed);
    }
  }, [user?.id, claimKey]);

  const dailyQuestsList = React.useMemo(() => {
    return [
      {
        id: 'workout',
        title: 'Superação Física',
        desc: workoutMissions.length > 0 ? "Execute pelo menos 1 treino ativo hoje" : "Nenhum treino agendado hoje (Livre)",
        isCompleted: workoutMissions.length > 0 ? workoutMissions.some(m => m.isCompleted) : true,
        icon: Dumbbell,
        path: '/workouts'
      },
      {
        id: 'meal',
        title: 'Ciclo de Nutrição',
        desc: mealMissions.length > 0 ? "Registre todas as refeições do seu cardápio" : "Nenhum cardápio ativo hoje (Livre)",
        isCompleted: mealMissions.length > 0 ? mealMissions.every(m => m.isCompleted) : true,
        icon: UtensilsCrossed,
        path: '/nutrition'
      },
      {
        id: 'habits',
        title: 'Foco do Desperto',
        desc: `Conclua 2 hábitos ou tarefas hoje (${completedToday.size + tasksCompletedToday}/2)`,
        isCompleted: (completedToday.size + tasksCompletedToday) >= 2,
        icon: CheckCircle2,
        path: '/quests'
      },
      {
        id: 'class',
        title: 'Desafio de Classe',
        desc: activeHabits.some(h => h.stat_target && classKeyStats.includes(h.stat_target))
          ? `Realize 1 hábito/tarefa de classe [${classKeyStats.map(s => s.slice(0, 3).toUpperCase()).join('/')}]`
          : 'Nenhum desafio de classe agendado hoje (Livre)',
        isCompleted: activeHabits.some(h => h.stat_target && classKeyStats.includes(h.stat_target)) ? completedClassQuest : true,
        icon: Zap,
        path: '/quests'
      }
    ];
  }, [workoutMissions, mealMissions, completedToday, tasksCompletedToday, activeHabits, classKeyStats, completedClassQuest]);

  const completedQuestsCount = React.useMemo(() => dailyQuestsList.filter(q => q.isCompleted).length, [dailyQuestsList]);
  const allQuestsCompleted = completedQuestsCount === 4;

  const handleClaimDailyBonus = async () => {
    if (!user?.id || bonusClaimed || !allQuestsCompleted) return;
    localStorage.setItem(claimKey, 'true');
    setBonusClaimed(true);
    await state.addXp(100, user.id);
  };

  // Domínios da Evolução
  const domains = React.useMemo(() => {
    const strength = state.stats.strength || 10;
    const endurance = state.stats.endurance || 10;
    const vitality = state.stats.vitality || 10;
    const intelligence = state.stats.intelligence || 10;
    const wisdom = state.stats.wisdom || 10;
    const discipline = state.stats.discipline || 10;
    const balance = state.stats.balance || 10;

    const corpoSum = Math.round((strength + endurance + vitality) / 3);
    const menteSum = Math.round((intelligence + wisdom) / 2);
    const fortunaSum = balance;
    const carreiraSum = discipline;
    const equilibrioSum = Math.round((strength + endurance + vitality + intelligence + wisdom + discipline + balance) / 7);

    const list = [
      { name: 'Corpo', value: corpoSum, desc: 'Força, Resistência & Vitalidade', color: 'from-red-500 to-orange-500' },
      { name: 'Mente', value: menteSum, desc: 'Inteligência & Sabedoria', color: 'from-purple-500 to-indigo-500' },
      { name: 'Fortuna', value: fortunaSum, desc: 'Equilíbrio Financeiro & Vida', color: 'from-emerald-500 to-teal-500' },
      { name: 'Carreira', value: carreiraSum, desc: 'Disciplina & Produtividade', color: 'from-blue-500 to-cyan-500' },
      { name: 'Equilíbrio', value: equilibrioSum, desc: 'Média de Harmonia Geral', color: 'from-pink-500 to-rose-500' },
    ];

    return list.map(d => {
      const level = Math.floor(d.value / 10);
      const progress = (d.value % 10) * 10;
      return {
        ...d,
        level: level === 0 ? 1 : level,
        progress
      };
    });
  }, [state.stats]);

  // Alerta de XP flutuante
  const [xpAlerts, setXpAlerts] = React.useState<{ id: number; amount: number }[]>([]);
  const prevXp = React.useRef(state.xp);
  const prevLevel = React.useRef(state.level);

  React.useEffect(() => {
    if (state.xp !== prevXp.current && prevXp.current !== undefined) {
      let diff = 0;
      if (state.level === prevLevel.current) {
        diff = state.xp - prevXp.current;
      } else if (state.level > prevLevel.current) {
        diff = state.xp;
      }
      
      if (diff > 0) {
        const id = Date.now();
        setXpAlerts(prev => [...prev, { id, amount: diff }]);
        setTimeout(() => {
          setXpAlerts(prev => prev.filter(alert => alert.id !== id));
        }, 1500);
      }
    }
    prevXp.current = state.xp;
    prevLevel.current = state.level;
  }, [state.xp, state.level]);

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
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest font-orbitron mt-1.5 flex items-center gap-1">
                  <span>🏆 Título Equipado:</span>
                  <span className="text-glow-amber">{state.activeTitle || 'Iniciante'}</span>
                </p>
                <p className="mt-1 flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 uppercase tracking-widest italic">
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
                <div className="flex items-center gap-2 relative">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500">Experience Points</span>
                  
                  {/* Floating XP Alerts */}
                  <AnimatePresence>
                    {xpAlerts.map(alert => (
                      <motion.span
                        key={alert.id}
                        initial={{ opacity: 0, y: 5, scale: 0.8 }}
                        animate={{ opacity: 1, y: -15, scale: 1.1 }}
                        exit={{ opacity: 0, y: -25, scale: 0.9 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute left-full ml-4 text-[10px] font-black text-cyan-400 tracking-widest font-orbitron drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] whitespace-nowrap"
                      >
                        +{alert.amount} XP
                      </motion.span>
                    ))}
                  </AnimatePresence>
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

      {/* 🏆 ── Missões Principais do Dia (Daily Main Quests HUD) ────── */}
      <motion.div
        id="daily-main-quests"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.02 }}
        className="relative overflow-hidden rounded-2xl sm:rounded-[2rem] border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-7 shadow-2xl"
      >
        <div className="absolute -right-20 -top-20 size-60 rounded-full bg-amber-500/5 blur-[80px]" />
        
        <div className="relative flex flex-col md:flex-row gap-6 justify-between items-stretch">
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight text-white italic font-orbitron" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                Missões Principais <span className="text-amber-400">do Dia</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-1">
                Protocolo Diário de Sobrevivência • Progresso: {completedQuestsCount}/4 Quests
              </p>
            </div>
            
            {/* Grid de Quests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dailyQuestsList.map((q) => {
                const IconComponent = q.icon;
                return (
                  <motion.button 
                    key={q.id}
                    onClick={() => navigate(q.path)}
                    whileHover={{ 
                      scale: 1.02, 
                      x: 2, 
                      borderColor: q.isCompleted ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                      boxShadow: q.isCompleted ? '0 0 15px rgba(16, 185, 129, 0.1)' : '0 0 15px rgba(59, 130, 246, 0.1)'
                    }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-all text-left cursor-pointer ${
                      q.isCompleted 
                        ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
                        : 'border-[#1E1E26] bg-black/20 text-gray-400 hover:border-blue-500/30'
                    }`}
                  >
                    <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      q.isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-gray-500'
                    }`}>
                      <IconComponent size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-black uppercase tracking-wider font-orbitron truncate ${
                        q.isCompleted ? 'text-emerald-400' : 'text-white'
                      }`}>
                        {q.title}
                      </p>
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest truncate mt-0.5">
                        {q.desc}
                      </p>
                    </div>
                    {q.isCompleted ? (
                      <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 shrink-0 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Concluído</span>
                    ) : (
                      <span className="text-[8px] font-black uppercase tracking-widest text-orange-400 shrink-0 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20 animate-pulse">Pendente</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
          
          {/* Botão de Resgate de Bônus Diário */}
          <div className="flex shrink-0 items-center justify-center md:border-l md:border-[#1E1E26] md:pl-6">
            <motion.button
              whileHover={allQuestsCompleted && !bonusClaimed ? { scale: 1.05 } : {}}
              whileTap={allQuestsCompleted && !bonusClaimed ? { scale: 0.95 } : {}}
              disabled={!allQuestsCompleted || bonusClaimed}
              onClick={handleClaimDailyBonus}
              className={`relative flex flex-col items-center justify-center rounded-xl p-5 w-full md:w-48 text-center border transition-all cursor-pointer select-none ${
                bonusClaimed
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                  : allQuestsCompleted
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.15)] animate-pulse-amber'
                    : 'border-[#1E1E26] bg-black/40 text-gray-600 cursor-not-allowed'
              }`}
            >
              <Trophy size={28} className={allQuestsCompleted && !bonusClaimed ? 'text-amber-400 animate-bounce' : 'text-gray-600'} />
              <span className="text-xs font-black uppercase tracking-widest font-orbitron mt-2">
                {bonusClaimed ? 'Resgatado' : 'Bônus Diário'}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest mt-1">
                {bonusClaimed 
                  ? 'BÔNUS COLETADO' 
                  : allQuestsCompleted 
                    ? 'REIVINDICAR +100 XP' 
                    : `${completedQuestsCount}/4 COMPLETAS`
                }
              </span>
            </motion.button>
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
          id="tour-shortcut-workouts"
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
          id="tour-shortcut-nutrition"
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
                              {m.totalKcal > 0 ? `${m.totalKcal} kcal` : 'Alimentação'} • Recompensa Consolidada
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
              <div className="mt-6 grid w-full grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                {statsData.map((stat) => (
                  <div key={stat.label} className="group flex flex-col items-center gap-1 sm:gap-1.5 rounded-xl border border-[#1E1E26] bg-black/40 py-2 transition-all hover:border-blue-500/30">
                    <span className="text-[8px] sm:text-[9px] font-black text-gray-500 group-hover:text-blue-400 transition-colors uppercase tracking-widest">{stat.label}</span>
                    <span className="text-xs sm:text-base font-black text-white italic" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Domínios da Evolução */}
            <div className="border-t border-[#1E1E26] border-dashed pt-6 mt-8 space-y-4 w-full">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                  Domínios de Evolução
                </h3>
                <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Dimensões da Vida</span>
              </div>

              <div className="space-y-3">
                {domains.map((dom) => (
                  <div key={dom.name} className="space-y-1.5">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase text-white font-orbitron">{dom.name}</span>
                        <span className="text-[8px] font-bold text-blue-400 uppercase">LVL {dom.level}</span>
                      </div>
                      <span className="text-[9px] font-black text-gray-500 font-orbitron">
                        {dom.progress}%
                      </span>
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-black/40 p-0.5 border border-[#1E1E26]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${dom.progress}%` }}
                        transition={{ duration: 0.5, ease: 'circOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${dom.color} shadow-[0_0_8px_rgba(255,255,255,0.05)]`}
                      />
                    </div>
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

