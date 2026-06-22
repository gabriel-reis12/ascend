import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, 
  Compass, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Sparkles,
  Smile,
  Heart,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useHunterStore } from '../stores/useHunterStore';
import { useBossStore } from '../stores/useBossStore';

interface RestLog {
  id: string;
  type: 'sleep' | 'meditation' | 'hobby';
  duration_min: number;
  quality: number | null;
  notes: string | null;
  logged_at: string;
}

export function Rest() {
  const { user } = useAuth();
  const { addXp, updateStat } = useHunterStore();
  const [activeSubTab, setActiveSubTab] = useState<'sleep_lazer' | 'meditation'>('sleep_lazer');
  const [logs, setLogs] = useState<RestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Formulário Sono & Lazer
  const [sleepHours, setSleepHours] = useState<number>(8);
  const [sleepQuality, setSleepQuality] = useState<number>(4);
  const [hobbyDuration, setHobbyDuration] = useState<number>(30);
  const [hobbyNotes, setHobbyNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados Meditação (Cronômetro)
  const [meditationTime, setMeditationTime] = useState<number>(10); // minutos padrão
  const [timeLeft, setTimeLeft] = useState<number>(600); // 10 min em segundos
  const [isMeditationActive, setIsMeditationActive] = useState<boolean>(false);
  const [breatheState, setBreatheState] = useState<'Inspire' | 'Segure' | 'Expire' | 'Prenda'>('Inspire');

  // Efeitos visuais de Recompensa
  const [showReward, setShowReward] = useState<{ xp: number; stat: string; val: number } | null>(null);

  useEffect(() => {
    fetchLogs();
  }, [user]);

  // Efeito do Cronômetro de Meditação
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isMeditationActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleCompleteMeditation(meditationTime);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isMeditationActive, timeLeft]);

  // Efeito do Círculo de Respiração Guiada (Sincronizado de 4s em 4s)
  useEffect(() => {
    if (!isMeditationActive) return;
    const breatheTimer = setInterval(() => {
      setBreatheState(prev => {
        if (prev === 'Inspire') return 'Segure';
        if (prev === 'Segure') return 'Expire';
        if (prev === 'Expire') return 'Prenda';
        return 'Inspire';
      });
    }, 4000);

    return () => clearInterval(breatheTimer);
  }, [isMeditationActive]);

  async function fetchLogs() {
    if (!user) return;
    try {
      setLoading(true);
      setDataError(null);
      const { data, error } = await supabase
        .from('rest_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('logged_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Erro ao buscar logs de descanso:', err);
      setDataError('Erro ao sincronizar logs de descanso.');
    } finally {
      setLoading(false);
    }
  }

  // Registros Rápidos
  async function handleLogSleep() {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const durationMin = Math.round(sleepHours * 60);
      const { error } = await supabase.from('rest_logs').insert({
        user_id: user.id,
        type: 'sleep',
        duration_min: durationMin,
        quality: sleepQuality,
        notes: `Qualidade: ${sleepQuality}/5`
      });

      if (error) throw error;

      // Recompensas RPG: +20 XP e +2 Equilíbrio (BAL)
      await addXp(20, user.id);
      await updateStat('balance', 2, user.id);
      
      // Dano ao Boss ativo na fenda
      await useBossStore.getState().attackActiveBoss(user.id, 15, 'Estudo'); // Atrelado a equilíbrio mental

      setShowReward({ xp: 20, stat: 'EQUILÍBRIO', val: 2 });
      setTimeout(() => setShowReward(null), 4000);

      fetchLogs();
    } catch (err) {
      console.error('Erro ao registrar sono:', err);
      alert('Falha ao registrar sono.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogHobby() {
    if (!user || hobbyDuration <= 0) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('rest_logs').insert({
        user_id: user.id,
        type: 'hobby',
        duration_min: hobbyDuration,
        notes: hobbyNotes.trim() || null
      });

      if (error) throw error;

      // Recompensas RPG: +15 XP e +1 Equilíbrio (BAL)
      await addXp(15, user.id);
      await updateStat('balance', 1, user.id);

      // Dano ao Boss ativo na fenda
      await useBossStore.getState().attackActiveBoss(user.id, 10, 'Estudo');

      setShowReward({ xp: 15, stat: 'EQUILÍBRIO', val: 1 });
      setTimeout(() => setShowReward(null), 4000);

      setHobbyNotes('');
      fetchLogs();
    } catch (err) {
      console.error('Erro ao registrar lazer:', err);
      alert('Falha ao registrar lazer.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteMeditation(mins: number) {
    if (!user) return;
    setIsMeditationActive(false);
    try {
      const { error } = await supabase.from('rest_logs').insert({
        user_id: user.id,
        type: 'meditation',
        duration_min: mins,
        quality: 5,
        notes: 'Sessão de Meditação Cronometrada Concluída'
      });

      if (error) throw error;

      // Recompensas RPG: +15 XP e +2 Equilíbrio (BAL)
      await addXp(15, user.id);
      await updateStat('balance', 2, user.id);

      // Dano Crítico de Estudo/Calma ao Boss
      await useBossStore.getState().attackActiveBoss(user.id, 20, 'Estudo');

      setShowReward({ xp: 15, stat: 'EQUILÍBRIO', val: 2 });
      setTimeout(() => setShowReward(null), 4000);

      fetchLogs();
    } catch (err) {
      console.error('Erro ao registrar meditação concluída:', err);
    }
  }

  async function handleDeleteLog(id: string) {
    try {
      const { error } = await supabase.from('rest_logs').delete().eq('id', id);
      if (error) throw error;
      fetchLogs();
    } catch (err) {
      console.error('Erro ao deletar log:', err);
    }
  }

  // Cálculos Estatísticos (Últimos 7 dias)
  const stats = React.useMemo(() => {
    const sleepLogs = logs.filter(l => l.type === 'sleep');
    const medLogs = logs.filter(l => l.type === 'meditation');
    const hobbyLogs = logs.filter(l => l.type === 'hobby');
    const todayKey = new Date().toLocaleDateString('en-CA');
    const todayLogs = logs.filter(log => new Date(log.logged_at).toLocaleDateString('en-CA') === todayKey);
    const todayMeditation = todayLogs
      .filter(log => log.type === 'meditation')
      .reduce((sum, log) => sum + log.duration_min, 0);
    const todayHobby = todayLogs
      .filter(log => log.type === 'hobby')
      .reduce((sum, log) => sum + log.duration_min, 0);

    const latestSleep = sleepLogs[0] ? sleepLogs[0].duration_min / 60 : 0;
    const avgSleep = sleepLogs.length > 0 
      ? (sleepLogs.reduce((sum, l) => sum + l.duration_min, 0) / sleepLogs.length / 60).toFixed(1)
      : '0';

    const totalMedMins = medLogs.reduce((sum, l) => sum + l.duration_min, 0);
    const totalHobbyHours = (hobbyLogs.reduce((sum, l) => sum + l.duration_min, 0) / 60).toFixed(1);

    return {
      lastSleep: latestSleep.toFixed(1),
      avgSleep,
      totalMed: totalMedMins,
      totalHobby: totalHobbyHours,
      todayMeditation,
      todayHobby,
    };
  }, [logs]);
  const sleepProgress = Math.min(100, (Number(stats.lastSleep) / 8) * 100);
  const meditationProgress = Math.min(100, (stats.todayMeditation / 10) * 100);
  const hobbyProgress = Math.min(100, (stats.todayHobby / 60) * 100);
  const balanceProgress = Math.round((sleepProgress + meditationProgress + hobbyProgress) / 3);
  const balanceStatus = balanceProgress >= 80 ? 'Equilíbrio restaurado' : balanceProgress >= 45 ? 'Recuperação em progresso' : 'Mana em recuperação';

  function toggleTimer() {
    setIsMeditationActive(!isMeditationActive);
  }

  function resetTimer() {
    setIsMeditationActive(false);
    setTimeLeft(meditationTime * 60);
    setBreatheState('Inspire');
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-[#0F0F13] p-6 shadow-[0_0_26px_rgba(99,102,241,0.06)]">
        <div className="absolute right-0 top-0 h-full w-72 bg-gradient-to-l from-indigo-500/10 to-transparent" />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-4 bg-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-400">Rest & Recharge</span>
            </div>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-white italic font-orbitron">
              Descanso & <span className="text-indigo-400">Lazer</span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-400">Regenere sua mana e calibre o atributo Equilíbrio (EQU).</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Sono atual', value: `${stats.lastSleep}h`, icon: Moon, tone: 'text-indigo-300' },
              { label: 'Meditação acumulada', value: `${stats.totalMed} min`, icon: Compass, tone: 'text-purple-300' },
              { label: 'Lazer offline', value: `${stats.totalHobby}h`, icon: Smile, tone: 'text-cyan-300' },
              { label: 'Estado de equilíbrio', value: balanceStatus, icon: Activity, tone: balanceProgress >= 80 ? 'text-emerald-300' : 'text-amber-300' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-black/25 p-3 transition-colors hover:border-white/10">
                <item.icon className={`size-4 ${item.tone}`} />
                <p className="mt-2 text-xs font-medium text-gray-500">{item.label}</p>
                <p className={`mt-1 truncate text-sm font-bold ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recompensa flutuante (Toast RPG) */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed left-1/2 top-24 z-50 flex -translate-x-1/2 items-center gap-4 rounded-3xl border border-amber-500/30 bg-black/90 p-6 shadow-[0_0_30px_rgba(245,158,11,0.25)] backdrop-blur-md"
          >
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-amber-500 font-orbitron">Mana Restaurada!</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                +{showReward.xp} XP • +{showReward.val} {showReward.stat}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Sono */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 transition-colors hover:border-indigo-500/25">
          <div className="absolute -right-4 -top-4 size-20 bg-indigo-500/5 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-300 font-orbitron">Sono</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Moon size={16} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white font-orbitron">{stats.lastSleep}<span className="text-xs text-gray-500 font-bold ml-1">H</span></p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">Meta diária: 8h</span>
              <span className={sleepProgress >= 100 ? 'text-emerald-300' : 'text-indigo-300'}>{sleepProgress >= 100 ? 'Meta alcançada' : `${Math.round(sleepProgress)}%`}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${sleepProgress}%` }} className="h-full rounded-full bg-gradient-to-r from-indigo-700 to-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
            </div>
            <p className="mt-2 text-xs text-gray-500">Média registrada: {stats.avgSleep}h</p>
          </div>
        </motion.div>

        {/* Meditação */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 transition-colors hover:border-purple-500/25">
          <div className="absolute -right-4 -top-4 size-20 bg-purple-500/5 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-300 font-orbitron">Meditação</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Compass size={16} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white font-orbitron">{stats.totalMed}<span className="text-xs text-gray-500 font-bold ml-1">MIN</span></p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">Meta diária: 10 min</span>
              <span className={meditationProgress >= 100 ? 'text-emerald-300' : 'text-purple-300'}>{meditationProgress >= 100 ? 'Foco calibrado' : `${Math.round(meditationProgress)}%`}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${meditationProgress}%` }} className="h-full rounded-full bg-gradient-to-r from-purple-700 to-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
            </div>
            <p className="mt-2 text-xs text-gray-500">{stats.todayMeditation} min registrados hoje</p>
          </div>
        </motion.div>

        {/* Lazer Offline */}
        <motion.div whileHover={{ y: -2 }} className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 transition-colors hover:border-cyan-500/25">
          <div className="absolute -right-4 -top-4 size-20 bg-cyan-500/5 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-300 font-orbitron">Lazer Offline</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Smile size={16} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white font-orbitron">{stats.totalHobby}<span className="text-xs text-gray-500 font-bold ml-1">H</span></p>
            <div className="mt-4 flex items-center justify-between text-xs font-semibold">
              <span className="text-gray-500">Meta diária: 60 min</span>
              <span className={hobbyProgress >= 100 ? 'text-emerald-300' : 'text-cyan-300'}>{hobbyProgress >= 100 ? 'Desconexão completa' : `${Math.round(hobbyProgress)}%`}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${hobbyProgress}%` }} className="h-full rounded-full bg-gradient-to-r from-cyan-700 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
            </div>
            <p className="mt-2 text-xs text-gray-500">{stats.todayHobby} min longe das telas hoje</p>
          </div>
        </motion.div>
      </div>

      {/* Sub-abas de Navegação */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-[#1E1E26] bg-[#0B0B0F] p-2 sm:grid-cols-2">
        {[
          { id: 'sleep_lazer' as const, title: 'Sono & Lazer', subtitle: 'registro de descanso e hobbies', icon: Moon, tone: 'indigo' },
          { id: 'meditation' as const, title: 'Templo da Mente', subtitle: 'respiração, meditação e foco', icon: Compass, tone: 'purple' },
        ].map(item => {
          const ItemIcon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubTab(item.id)}
              className={`group relative flex min-h-[72px] items-center gap-3 overflow-hidden rounded-xl border px-4 py-3 text-left transition-all duration-200 active:scale-[0.99] ${
                isActive
                  ? item.tone === 'indigo'
                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                    : 'border-purple-500/40 bg-purple-500/10 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.12)]'
                  : 'border-transparent bg-white/[0.025] text-gray-500 hover:border-white/10 hover:bg-white/[0.045] hover:text-gray-200'
              }`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                isActive ? 'border-current/20 bg-current/10' : 'border-white/5 bg-black/20 group-hover:border-white/10'
              }`}>
                <ItemIcon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-black font-orbitron">{item.title}</span>
                <span className={`mt-1 block text-xs ${isActive ? 'text-white/60' : 'text-gray-600 group-hover:text-gray-500'}`}>{item.subtitle}</span>
              </span>
              {isActive && <motion.span layoutId="rest-active-tab" className="absolute inset-x-4 bottom-0 h-px bg-current shadow-[0_0_8px_currentColor]" />}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das Abas */}
      <motion.div
        key={activeSubTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="space-y-6"
      >
        {dataError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs font-semibold text-rose-200">
            <span className="font-black uppercase tracking-widest text-rose-400">Erro: </span>
            {dataError}
          </div>
        )}

        {/* ─── ABA 1: SONO & LAZER ─── */}
        {activeSubTab === 'sleep_lazer' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Formulários */}
            <div className="lg:col-span-1 space-y-4">
              {/* Registro de Sono */}
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 transition-colors hover:border-indigo-500/20">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                    <Moon className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white font-orbitron">Registrar Sono</h2>
                    <p className="mt-1 text-xs text-gray-500">Informe duração e percepção de qualidade.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Horas dormidas</label>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
                      <button 
                        onClick={() => setSleepHours(Math.max(1, sleepHours - 0.5))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-indigo-600 hover:text-white transition-all"
                      >-</button>
                      <span className="text-base font-black text-white font-orbitron">{sleepHours.toFixed(1)}h</span>
                      <button 
                        onClick={() => setSleepHours(Math.min(24, sleepHours + 0.5))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-indigo-600 hover:text-white transition-all"
                      >+</button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Qualidade do sono</label>
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-white/5 p-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setSleepQuality(star)}
                          className={`text-lg transition-transform hover:scale-125 ${
                            star <= sleepQuality ? 'text-indigo-400' : 'text-gray-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleLogSleep}
                    disabled={isSubmitting}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-black text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] active:scale-[0.98] disabled:opacity-50"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <Moon size={14} />
                    {isSubmitting ? 'Registrando...' : 'Registrar Descanso'}
                  </button>
                </div>
              </div>

              {/* Registro de Lazer */}
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 transition-colors hover:border-cyan-500/20">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                    <Smile className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white font-orbitron">Registrar Lazer</h2>
                    <p className="mt-1 text-xs text-gray-500">Registre uma pausa offline que ajudou sua recuperação.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Duração em minutos</label>
                    <div className="flex items-center justify-between rounded-xl bg-white/5 p-2.5">
                      <button 
                        onClick={() => setHobbyDuration(Math.max(10, hobbyDuration - 10))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-cyan-600 hover:text-white transition-all"
                      >-</button>
                      <span className="text-base font-black text-white font-orbitron">{hobbyDuration} min</span>
                      <button 
                        onClick={() => setHobbyDuration(Math.min(300, hobbyDuration + 10))}
                        className="size-8 flex items-center justify-center rounded-lg bg-[#1E1E26] text-gray-400 hover:bg-cyan-600 hover:text-white transition-all"
                      >+</button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-300">Hobby ou atividade</label>
                    <input 
                      type="text"
                      placeholder="Ex: Leitura, Violão, Caminhada..."
                      value={hobbyNotes}
                      onChange={(e) => setHobbyNotes(e.target.value)}
                      className="w-full rounded-xl border border-[#1E1E26] bg-[#0A0A0D] px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleLogHobby}
                    disabled={isSubmitting}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-black text-white transition-all hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-[0.98] disabled:opacity-50"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <Smile size={14} />
                    {isSubmitting ? 'Registrando...' : 'Registrar Lazer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista Histórica */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6 flex flex-col h-full">
                <h2 className="text-base font-black uppercase italic text-white tracking-tight mb-4 font-orbitron">
                  Histórico de <span className="text-indigo-400">Recuperação</span>
                </h2>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[500px]">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5 border border-white/5" />
                    ))
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-500/20 bg-indigo-500/[0.025] px-6 py-16 text-center">
                      <div className="flex size-14 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-400">
                        <Heart className="size-6" />
                      </div>
                      <p className="mt-5 text-sm font-bold text-white">O Sistema ainda não detectou registros de recuperação.</p>
                      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-gray-500">
                        Registre sono, meditação ou lazer para iniciar sua trilha de equilíbrio.
                      </p>
                    </div>
                  ) : (
                    logs.map((log) => {
                      const date = new Date(log.logged_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      const hours = (log.duration_min / 60).toFixed(1);

                      return (
                        <div key={log.id} className="flex items-center justify-between rounded-2xl border border-[#1E1E26] bg-white/5 p-4 hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center gap-4">
                            <div className={`flex size-10 items-center justify-center rounded-xl ${
                              log.type === 'sleep' ? 'bg-indigo-500/10 text-indigo-400' :
                              log.type === 'meditation' ? 'bg-purple-500/10 text-purple-400' : 'bg-cyan-500/10 text-cyan-400'
                            }`}>
                              {log.type === 'sleep' ? <Moon size={18} /> : 
                               log.type === 'meditation' ? <Compass size={18} /> : <Smile size={18} />}
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                                {log.type === 'sleep' ? 'Repouso Noturno' : 
                                 log.type === 'meditation' ? 'Meditação / Calma' : 'Hobby & Desconexão'}
                              </h4>
                              <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">
                                {date} • {log.notes || 'Sem observações'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-xs font-black font-orbitron text-white">
                              {log.type === 'sleep' || log.type === 'hobby' ? `${hours}H` : `${log.duration_min}Min`}
                            </span>
                            <button
                              onClick={() => handleDeleteLog(log.id)}
                              className="rounded-lg p-1.5 text-gray-600 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ABA 2: TEMPLO DA MENTE (MEDITAÇÃO) ─── */}
        {activeSubTab === 'meditation' && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-purple-500/15 bg-[#0F0F13] px-6 py-12 shadow-[0_0_28px_rgba(168,85,247,0.05)]">
            <div className="max-w-md w-full text-center space-y-8">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-purple-400 font-orbitron">Templo do Silêncio</span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white font-orbitron">
                  Meditação <span className="text-purple-400">Guiada</span>
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-400">
                  Acalme sua mente para recuperar mana. Siga o pulso de respiração para sincronizar seus batimentos.
                </p>
              </div>

              {/* Círculo de Meditação Pulsante */}
              <div className="relative flex items-center justify-center mx-auto w-64 h-64">
                {/* Círculos de pulso */}
                <AnimatePresence>
                  {isMeditationActive && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border border-purple-500/20"
                        animate={{ scale: breatheState === 'Inspire' || breatheState === 'Segure' ? 1.3 : 1.0 }}
                        transition={{ duration: 4, ease: 'easeInOut' }}
                      />
                      <motion.div
                        className="absolute inset-4 rounded-full border border-purple-500/40"
                        animate={{ scale: breatheState === 'Inspire' || breatheState === 'Segure' ? 1.25 : 1.0 }}
                        transition={{ duration: 4, ease: 'easeInOut' }}
                      />
                    </>
                  )}
                </AnimatePresence>

                {/* Círculo Principal */}
                <motion.div
                  className="relative z-10 flex h-52 w-52 flex-col items-center justify-center rounded-full border-2 border-purple-500 bg-purple-950/20 shadow-[0_0_48px_rgba(168,85,247,0.18)]"
                  animate={isMeditationActive ? { 
                    scale: breatheState === 'Inspire' || breatheState === 'Segure' ? [1, 1.18] : [1.18, 1],
                    boxShadow: breatheState === 'Inspire' || breatheState === 'Segure' 
                      ? '0 0 45px rgba(168,85,247,0.45)' 
                      : '0 0 15px rgba(168,85,247,0.15)'
                  } : { scale: 1 }}
                  transition={isMeditationActive ? { duration: 4, ease: 'easeInOut' } : { duration: 0.5 }}
                >
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-purple-400 font-orbitron">
                    {isMeditationActive ? breatheState : 'PRONTO'}
                  </span>
                  <span className="mt-2 text-4xl font-black text-white font-orbitron drop-shadow-[0_0_12px_rgba(168,85,247,0.28)]">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-gray-500">
                    Meta: {meditationTime} Min
                  </span>
                </motion.div>
              </div>

              {/* Seletores de Tempo */}
              {!isMeditationActive && (
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setMeditationTime(mins);
                        setTimeLeft(mins * 60);
                      }}
                      className={`min-h-10 rounded-xl border px-2 py-2 text-xs font-black transition-all ${
                        meditationTime === mins
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.14)]'
                          : 'border-[#1E1E26] bg-[#0F0F13] text-gray-500 hover:border-purple-500/50 hover:text-purple-400'
                      }`}
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      {mins} Min
                    </button>
                  ))}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-center gap-3">
                <button
                  onClick={toggleTimer}
                  className={`flex min-h-12 items-center gap-2 rounded-xl px-9 text-sm font-black text-white transition-all active:scale-[0.98] ${
                    isMeditationActive 
                      ? 'bg-amber-600 hover:bg-amber-500 hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                      : 'bg-purple-600 hover:bg-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  }`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {isMeditationActive ? <Pause size={14} /> : <Play size={14} />}
                  {isMeditationActive ? 'Pausar' : 'Iniciar'}
                </button>

                {timeLeft < meditationTime * 60 && (
                  <button
                    onClick={resetTimer}
                    className="flex min-h-12 items-center gap-2 rounded-xl border border-[#1E1E26] bg-white/5 px-6 text-sm font-black text-gray-400 transition-all hover:bg-white/10 hover:text-white"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <RotateCcw size={14} />
                    Reiniciar
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
