import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Moon, 
  Zap, 
  Compass, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  X, 
  Trash2, 
  CheckCircle2, 
  Sparkles,
  Smile,
  Heart,
  Clock,
  Plus
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useHunterStore } from '../stores/useHunterStore';
import { useBossStore } from '../stores/useBossStore';
import { localDayBounds } from '../lib/date';

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
    } else {
      setIsMeditationActive(false);
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

    const totalSleepToday = sleepLogs[0] ? (sleepLogs[0].duration_min / 60).toFixed(1) : '0';
    const avgSleep = sleepLogs.length > 0 
      ? (sleepLogs.reduce((sum, l) => sum + l.duration_min, 0) / sleepLogs.length / 60).toFixed(1)
      : '0';

    const totalMedMins = medLogs.reduce((sum, l) => sum + l.duration_min, 0);
    const totalHobbyHours = (hobbyLogs.reduce((sum, l) => sum + l.duration_min, 0) / 60).toFixed(1);

    return {
      lastSleep: totalSleepToday,
      avgSleep,
      totalMed: totalMedMins,
      totalHobby: totalHobbyHours
    };
  }, [logs]);

  function startTimer(mins: number) {
    setMeditationTime(mins);
    setTimeLeft(mins * 60);
    setIsMeditationActive(true);
    setBreatheState('Inspire');
  }

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-1 w-4 bg-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Rest & Recharge</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white italic font-orbitron">
          Descanso & <span className="text-indigo-400">Lazer</span>
        </h1>
        <p className="text-xs text-gray-500 uppercase tracking-widest leading-none mt-1">Regenere sua mana e calibre o Atributo Equilíbrio (BAL)</p>
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
        <div className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
          <div className="absolute -right-4 -top-4 size-20 bg-indigo-500/5 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-orbitron">Sono</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Moon size={16} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white font-orbitron">{stats.lastSleep}<span className="text-xs text-gray-500 font-bold ml-1">H</span></p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Média: {stats.avgSleep}h (Meta: 8.0h)</p>
          </div>
        </div>

        {/* Meditação */}
        <div className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
          <div className="absolute -right-4 -top-4 size-20 bg-purple-500/5 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-orbitron">Meditação</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Compass size={16} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white font-orbitron">{stats.totalMed}<span className="text-xs text-gray-500 font-bold ml-1">MIN</span></p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Tempo de foco acumulado</p>
          </div>
        </div>

        {/* Lazer Offline */}
        <div className="relative overflow-hidden rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
          <div className="absolute -right-4 -top-4 size-20 bg-cyan-500/5 blur-2xl" />
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 font-orbitron">Lazer Offline</span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
              <Smile size={16} />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-white font-orbitron">{stats.totalHobby}<span className="text-xs text-gray-500 font-bold ml-1">H</span></p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Desconexão de telas</p>
          </div>
        </div>
      </div>

      {/* Sub-abas de Navegação */}
      <div className="flex gap-6 border-b border-[#1E1E26]">
        <button
          onClick={() => setActiveSubTab('sleep_lazer')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'sleep_lazer' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-white'
          }`}
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Sono & Lazer
        </button>
        <button
          onClick={() => setActiveSubTab('meditation')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${
            activeSubTab === 'meditation' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-500 hover:text-white'
          }`}
          style={{ fontFamily: 'Orbitron, sans-serif' }}
        >
          Templo da Mente
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="space-y-6">
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
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
                <h2 className="text-base font-black uppercase italic text-white tracking-tight mb-4 font-orbitron">
                  Registrar <span className="text-indigo-400">Sono</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Horas Dormidas</label>
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
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Qualidade</label>
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
                    className="w-full rounded-xl bg-indigo-600 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    <Moon size={14} />
                    {isSubmitting ? 'Registrando...' : 'Registrar Descanso'}
                  </button>
                </div>
              </div>

              {/* Registro de Lazer */}
              <div className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-6">
                <h2 className="text-base font-black uppercase italic text-white tracking-tight mb-4 font-orbitron">
                  Registrar <span className="text-cyan-400">Lazer</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Duração (Minutos)</label>
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
                    <label className="block text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Qual Hobbies / Atividade?</label>
                    <input 
                      type="text"
                      placeholder="Ex: Leitura, Violão, Caminhada..."
                      value={hobbyNotes}
                      onChange={(e) => setHobbyNotes(e.target.value)}
                      className="w-full rounded-xl border border-[#1E1E26] bg-[#0F0F13] px-4 py-3 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleLogHobby}
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-cyan-600 py-3.5 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-cyan-500 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
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
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <p className="text-3xl">💤</p>
                      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">Nenhum registro encontrado.</p>
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
          <div className="flex flex-col items-center justify-center rounded-3xl border border-[#1E1E26] bg-[#0F0F13] py-12 px-6">
            <div className="max-w-md w-full text-center space-y-8">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400 font-orbitron">Templo do Silêncio</span>
                <h2 className="text-2xl font-black uppercase italic tracking-tight text-white font-orbitron">
                  Meditação <span className="text-purple-400">Guiada</span>
                </h2>
                <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
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
                  className="w-48 h-48 rounded-full bg-purple-950/20 border-2 border-purple-500 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.15)] relative z-10"
                  animate={isMeditationActive ? { 
                    scale: breatheState === 'Inspire' || breatheState === 'Segure' ? [1, 1.18] : [1.18, 1],
                    boxShadow: breatheState === 'Inspire' || breatheState === 'Segure' 
                      ? '0 0 45px rgba(168,85,247,0.45)' 
                      : '0 0 15px rgba(168,85,247,0.15)'
                  } : { scale: 1 }}
                  transition={isMeditationActive ? { duration: 4, ease: 'easeInOut' } : { duration: 0.5 }}
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-400 font-orbitron">
                    {isMeditationActive ? breatheState : 'PRONTO'}
                  </span>
                  <span className="text-3xl font-black text-white font-orbitron mt-2">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">
                    Meta: {meditationTime} Min
                  </span>
                </motion.div>
              </div>

              {/* Seletores de Tempo */}
              {!isMeditationActive && (
                <div className="flex justify-center gap-2">
                  {[1, 5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => {
                        setMeditationTime(mins);
                        setTimeLeft(mins * 60);
                      }}
                      className={`rounded-xl border px-3 py-2 text-[10px] font-black uppercase transition-all ${
                        meditationTime === mins
                          ? 'border-purple-500 bg-purple-500/20 text-purple-400'
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
                  className={`flex items-center gap-2 rounded-xl px-8 py-3.5 text-xs font-black uppercase tracking-widest text-white transition-all ${
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
                    className="flex items-center gap-2 rounded-xl border border-[#1E1E26] bg-white/5 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-white/10 hover:text-white"
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
      </div>
    </div>
  );
}
