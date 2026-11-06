import React, { useState, useEffect, useMemo } from 'react';
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
  Activity,
  Shield,
  Zap,
  Wind
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useHunterStore } from '@/stores/useHunterStore';
import { useBossStore } from '@/stores/useBossStore';
import { usePreferences } from '@/contexts/preferences';
import { translateUiText } from '@/lib/uiEnglish';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { NeonProgressBar } from '@/components/ui/neon-progress';

interface RestLog {
  id: string;
  type: 'sleep' | 'meditation' | 'hobby';
  duration_min: number;
  quality: number | null;
  notes: string | null;
  logged_at: string;
}

export function Rest() {
  const { language, t } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;
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
      setDataError(l('Erro ao sincronizar logs de descanso.', 'Error syncing recovery logs.'));
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
      const { data: restLog, error } = await supabase.from('rest_logs').insert({
        user_id: user.id,
        type: 'sleep',
        duration_min: durationMin,
        quality: sleepQuality,
        notes: `${l('Qualidade', 'Quality')}: ${sleepQuality}/5`
      }).select('id').single();

      if (error) throw error;

      // Recompensas RPG: +20 XP e +2 Equilíbrio (BAL)
      const xpResult = await addXp(20, user.id, {
        eventId: `rest:${restLog.id}`,
      });
      await updateStat('balance', 2, user.id);
      
      // Dano ao Boss ativo na fenda
      if (xpResult.awardedXp > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, xpResult.awardedXp, 'Estudo');
      }

      setShowReward({ xp: 20, stat: l('EQUILÍBRIO', 'BALANCE'), val: 2 });
      setTimeout(() => setShowReward(null), 4000);

      fetchLogs();
    } catch (err) {
      console.error('Erro ao registrar sono:', err);
      alert(l('Falha ao registrar sono.', 'Failed to log sleep.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLogHobby() {
    if (!user || hobbyDuration <= 0) return;
    setIsSubmitting(true);
    try {
      const { data: restLog, error } = await supabase.from('rest_logs').insert({
        user_id: user.id,
        type: 'hobby',
        duration_min: hobbyDuration,
        notes: hobbyNotes.trim() || null
      }).select('id').single();

      if (error) throw error;

      // Recompensas RPG: +15 XP e +1 Equilíbrio (BAL)
      const xpResult = await addXp(15, user.id, {
        eventId: `rest:${restLog.id}`,
      });
      await updateStat('balance', 1, user.id);

      // Dano ao Boss ativo na fenda
      if (xpResult.awardedXp > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, xpResult.awardedXp, 'Estudo');
      }

      setShowReward({ xp: 15, stat: l('EQUILÍBRIO', 'BALANCE'), val: 1 });
      setTimeout(() => setShowReward(null), 4000);

      setHobbyNotes('');
      fetchLogs();
    } catch (err) {
      console.error('Erro ao registrar lazer:', err);
      alert(l('Falha ao registrar lazer.', 'Failed to log leisure.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCompleteMeditation(mins: number) {
    if (!user) return;
    setIsMeditationActive(false);
    try {
      const { data: restLog, error } = await supabase.from('rest_logs').insert({
        user_id: user.id,
        type: 'meditation',
        duration_min: mins,
        quality: 5,
        notes: l('Sessão de Meditação Cronometrada Concluída', 'Timed Meditation Session Completed')
      }).select('id').single();

      if (error) throw error;

      // Recompensas RPG: +15 XP e +2 Equilíbrio (BAL)
      const xpResult = await addXp(15, user.id, {
        eventId: `rest:${restLog.id}`,
      });
      await updateStat('balance', 2, user.id);

      // Dano Crítico de Estudo/Calma ao Boss
      if (xpResult.awardedXp > 0) {
        await useBossStore.getState().attackActiveBoss(user.id, xpResult.awardedXp, 'Estudo');
      }

      setShowReward({ xp: 15, stat: l('EQUILÍBRIO', 'BALANCE'), val: 2 });
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

  // Cálculos Estatísticos
  const stats = useMemo(() => {
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
  const balanceStatus = balanceProgress >= 80 
    ? l('Equilíbrio Restaurado', 'Balance Restored') 
    : balanceProgress >= 45 
      ? l('Recuperação em Progresso', 'Recovery in Progress') 
      : l('Mana em Recuperação', 'Mana Recovering');

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
    <div className="space-y-6 pb-28 sm:pb-32">
      {/* ── CABEÇALHO HUD v2 ── */}
      <HudCard variant="cyan" corners radialGlow className="relative overflow-hidden p-5 sm:p-6">
        <div className="relative grid gap-6 lg:grid-cols-[1.1fr_1.2fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Rest & Recovery
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/15 text-purple-300 border border-purple-500/30">
                {l('Atributo: EQU / BAL (Equilíbrio)', 'Stat: EQU / BAL (Balance)')}
              </span>
            </div>

            <h1 className="mt-2 text-2xl sm:text-3xl font-black uppercase tracking-tight text-white italic font-orbitron">
              {l('Módulo', 'Module')} <span className="text-cyan-400">{l('Descanso', 'Recovery')}</span>
            </h1>

            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-gray-400">
              {l(
                'Regenere sua mana vital, calibre o sono reparador e treine a mente com respiração guiada.',
                'Regenerate your vital mana, calibrate restful sleep, and train your mind with guided breathing.'
              )}
            </p>
          </div>

          {/* Grid de Métricas do Cabeçalho */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { label: l('Sono Registrado', 'Current Sleep'), value: `${stats.lastSleep}h`, icon: Moon, tone: 'text-indigo-300' },
              { label: l('Meditação Total', 'Total Meditation'), value: `${stats.totalMed} min`, icon: Compass, tone: 'text-purple-300' },
              { label: l('Lazer Offline', 'Offline Leisure'), value: `${stats.totalHobby}h`, icon: Smile, tone: 'text-cyan-300' },
              { label: l('Estado Geral', 'Overall State'), value: balanceStatus, icon: Activity, tone: balanceProgress >= 80 ? 'text-emerald-300' : 'text-amber-300' },
            ].map(item => (
              <div key={item.label} className="rounded-xl border border-white/5 bg-black/40 p-3 transition-colors hover:border-white/10">
                <item.icon className={`size-4 ${item.tone}`} />
                <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-gray-500">{item.label}</p>
                <p className={`mt-0.5 truncate text-xs sm:text-sm font-black font-orbitron ${item.tone}`}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </HudCard>

      {/* ── TOAST RPG DE RECOMPENSA ── */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-3.5 rounded-2xl border border-cyan-500/40 bg-black/95 p-4 shadow-[0_0_30px_rgba(0,240,255,0.25)] backdrop-blur-md"
          >
            <div className="flex size-11 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300 font-orbitron">
                {l('Mana & Equilíbrio Restaurados!', 'Mana & Balance Restored!')}
              </p>
              <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">
                +{showReward.xp} XP • +{showReward.val} {showReward.stat}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CARDS DE RESUMO TÁTICO (3 METAS) ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Sono */}
        <HudCard variant="cyan" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-300 font-orbitron">
              {l('Sono Noturno', 'Night Sleep')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Moon size={16} />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black text-white font-orbitron">
              {stats.lastSleep}<span className="text-xs text-gray-500 font-bold ml-1">H</span>
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-400">{l('Meta diária: 8h', 'Daily target: 8h')}</span>
              <span className={sleepProgress >= 100 ? 'text-emerald-400' : 'text-indigo-400 font-orbitron'}>
                {sleepProgress >= 100 ? l('Meta alcançada', 'Goal reached') : `${Math.round(sleepProgress)}%`}
              </span>
            </div>
            <div className="mt-1.5">
              <NeonProgressBar value={Number(stats.lastSleep)} max={8} variant="cyan" />
            </div>
            <p className="mt-2 text-[10px] text-gray-500">
              {l('Média recente:', 'Recent average:')} <b className="text-gray-300 font-orbitron">{stats.avgSleep}h</b>
            </p>
          </div>
        </HudCard>

        {/* Meditação */}
        <HudCard variant="purple" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-300 font-orbitron">
              {l('Meditação', 'Meditation')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Compass size={16} />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black text-white font-orbitron">
              {stats.totalMed}<span className="text-xs text-gray-500 font-bold ml-1">MIN</span>
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-400">{l('Meta diária: 10 min', 'Daily target: 10 min')}</span>
              <span className={meditationProgress >= 100 ? 'text-emerald-400' : 'text-purple-400 font-orbitron'}>
                {meditationProgress >= 100 ? l('Calibrado', 'Calibrated') : `${Math.round(meditationProgress)}%`}
              </span>
            </div>
            <div className="mt-1.5">
              <NeonProgressBar value={stats.todayMeditation} max={10} variant="xp" />
            </div>
            <p className="mt-2 text-[10px] text-gray-500">
              {stats.todayMeditation} {l('min registrados hoje', 'min logged today')}
            </p>
          </div>
        </HudCard>

        {/* Lazer Offline */}
        <HudCard variant="cyan" className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-gray-300 font-orbitron">
              {l('Lazer Offline', 'Offline Leisure')}
            </span>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Smile size={16} />
            </div>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-black text-white font-orbitron">
              {stats.totalHobby}<span className="text-xs text-gray-500 font-bold ml-1">H</span>
            </p>
            <div className="mt-3 flex items-center justify-between text-[10px] font-bold">
              <span className="text-gray-400">{l('Meta diária: 60 min', 'Daily target: 60 min')}</span>
              <span className={hobbyProgress >= 100 ? 'text-emerald-400' : 'text-cyan-400 font-orbitron'}>
                {hobbyProgress >= 100 ? l('Desconectado', 'Disconnected') : `${Math.round(hobbyProgress)}%`}
              </span>
            </div>
            <div className="mt-1.5">
              <NeonProgressBar value={stats.todayHobby} max={60} variant="cyan" />
            </div>
            <p className="mt-2 text-[10px] text-gray-500">
              {stats.todayHobby} {l('min longe das telas hoje', 'min off-screen today')}
            </p>
          </div>
        </HudCard>
      </div>

      {/* ── NAVEGAÇÃO DE SUB-ABAS (SONO & LAZER vs MEDITAÇÃO) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border border-white/5 bg-black/40 p-1.5">
        {[
          { id: 'sleep_lazer' as const, title: l('Sono & Lazer', 'Sleep & Leisure'), subtitle: l('registros de descanso, noites e hobbies', 'log nights, rest, and hobbies'), icon: Moon, tone: 'indigo' },
          { id: 'meditation' as const, title: l('Templo da Mente', 'Mind Temple'), subtitle: l('respiração guiada e meditação com foco', 'guided breathing and focused meditation'), icon: Compass, tone: 'purple' },
        ].map(item => {
          const ItemIcon = item.icon;
          const isActive = activeSubTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSubTab(item.id)}
              className={`flex min-h-[64px] items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? item.tone === 'indigo'
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                    : 'border-purple-500/50 bg-purple-500/15 text-purple-200 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                  : 'border-transparent bg-transparent text-gray-500 hover:border-white/10 hover:bg-white/[0.03] hover:text-gray-300'
              }`}
            >
              <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${
                isActive ? 'border-current/30 bg-current/10' : 'border-white/5 bg-white/5'
              }`}>
                <ItemIcon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs sm:text-sm font-black font-orbitron uppercase tracking-wider">{item.title}</span>
                <span className="block text-[11px] text-gray-400 truncate">{item.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── CONTEÚDO DAS ABAS ── */}
      <AnimatePresence mode="wait">
        {dataError && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            {dataError}
          </div>
        )}

        {/* ─── ABA 1: SONO & LAZER ─── */}
        {activeSubTab === 'sleep_lazer' && (
          <motion.div
            key="sleep_lazer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          >
            {/* Formulários (Coluna 1) */}
            <div className="lg:col-span-1 space-y-4">
              {/* Registro de Sono */}
              <HudCard variant="default" corners className="p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-indigo-500/30 bg-indigo-500/15 text-indigo-400">
                    <Moon className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black uppercase text-white font-orbitron">{l('Registrar Sono', 'Log Sleep')}</h2>
                    <p className="text-[10px] text-gray-500">+20 XP • +2 EQU / BAL</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-300">{l('Horas dormidas', 'Hours slept')}</label>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-2">
                      <button 
                        type="button"
                        onClick={() => setSleepHours(Math.max(1, sleepHours - 0.5))}
                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-bold text-gray-300 hover:border-indigo-500/40 hover:bg-indigo-500/20 hover:text-white transition-all active:scale-95"
                      >-</button>
                      <span className="text-base font-black text-white font-orbitron">{sleepHours.toFixed(1)}h</span>
                      <button 
                        type="button"
                        onClick={() => setSleepHours(Math.min(24, sleepHours + 0.5))}
                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-bold text-gray-300 hover:border-indigo-500/40 hover:bg-indigo-500/20 hover:text-white transition-all active:scale-95"
                      >+</button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-300">{l('Qualidade do sono', 'Sleep quality')}</label>
                    <div className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setSleepQuality(star)}
                          className={`flex size-8 items-center justify-center text-xl transition-transform hover:scale-125 ${
                            star <= sleepQuality ? 'text-indigo-400' : 'text-gray-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <TacticalButton
                    onClick={handleLogSleep}
                    disabled={isSubmitting}
                    variant="primary"
                    accent="cyan"
                    displayFont
                    className="w-full min-h-[44px] text-xs"
                  >
                    <Moon size={14} />
                    {isSubmitting ? l('Registrando...', 'Logging...') : l('Registrar Sono (+20 XP)', 'Log Sleep (+20 XP)')}
                  </TacticalButton>
                </div>
              </HudCard>

              {/* Registro de Lazer */}
              <HudCard variant="default" corners className="p-5 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="flex size-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/15 text-cyan-400">
                    <Smile className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-xs sm:text-sm font-black uppercase text-white font-orbitron">{l('Registrar Lazer', 'Log Leisure')}</h2>
                    <p className="text-[10px] text-gray-500">+15 XP • +1 EQU / BAL</p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-300">{l('Duração em minutos', 'Duration in minutes')}</label>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/40 p-2">
                      <button 
                        type="button"
                        onClick={() => setHobbyDuration(Math.max(10, hobbyDuration - 10))}
                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-bold text-gray-300 hover:border-cyan-500/40 hover:bg-cyan-500/20 hover:text-white transition-all active:scale-95"
                      >-</button>
                      <span className="text-base font-black text-white font-orbitron">{hobbyDuration} min</span>
                      <button 
                        type="button"
                        onClick={() => setHobbyDuration(Math.min(300, hobbyDuration + 10))}
                        className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-base font-bold text-gray-300 hover:border-cyan-500/40 hover:bg-cyan-500/20 hover:text-white transition-all active:scale-95"
                      >+</button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-gray-300">{l('Hobby ou atividade', 'Hobby or activity')}</label>
                    <input 
                      type="text"
                      placeholder={l('Ex: Leitura, Violão, Caminhada...', 'e.g., Reading, Guitar, Walking...')}
                      value={hobbyNotes}
                      onChange={(e) => setHobbyNotes(e.target.value)}
                      className="w-full min-h-[44px] rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white placeholder:text-gray-600 focus:border-cyan-500/50 focus:outline-none"
                    />
                  </div>

                  <TacticalButton
                    onClick={handleLogHobby}
                    disabled={isSubmitting}
                    variant="primary"
                    accent="cyan"
                    displayFont
                    className="w-full min-h-[44px] text-xs"
                  >
                    <Smile size={14} />
                    {isSubmitting ? l('Registrando...', 'Logging...') : l('Registrar Lazer (+15 XP)', 'Log Leisure (+15 XP)')}
                  </TacticalButton>
                </div>
              </HudCard>
            </div>

            {/* Lista Histórica (Coluna 2 e 3) */}
            <div className="lg:col-span-2 space-y-4">
              <HudCard variant="default" className="p-5 sm:p-6 flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
                  <h2 className="text-xs sm:text-sm font-black uppercase text-white font-orbitron">
                    {l('Histórico de Recuperação', 'Recovery History')}
                  </h2>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                    {logs.length} {l('registros', 'entries')}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[620px] pr-1">
                  {loading ? (
                    Array(4).fill(0).map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5 border border-white/5" />
                    ))
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20 px-6 py-16 text-center">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                        <Heart className="size-6" />
                      </div>
                      <p className="mt-4 text-xs sm:text-sm font-bold text-white font-orbitron">
                        {l('Nenhum registro de recuperação detectado.', 'No recovery records detected yet.')}
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-gray-500 leading-relaxed">
                        {l('Registre suas noites de sono, pausas de lazer ou sessões de respiração para iniciar a calibragem de Equilíbrio.', 'Log your sleep, leisure breaks, or breathing sessions to start calibrating Balance.')}
                      </p>
                    </div>
                  ) : (
                    logs.map((log) => {
                      const date = new Date(log.logged_at).toLocaleDateString(language, { day: '2-digit', month: '2-digit' });
                      const hours = (log.duration_min / 60).toFixed(1);

                      return (
                        <div key={log.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3.5 hover:border-cyan-500/30 hover:bg-cyan-500/[0.02] transition-all">
                          <div className="flex items-center gap-3.5">
                            <div className={`flex size-10 items-center justify-center rounded-xl border ${
                              log.type === 'sleep' ? 'border-indigo-500/30 bg-indigo-500/15 text-indigo-400' :
                              log.type === 'meditation' ? 'border-purple-500/30 bg-purple-500/15 text-purple-400' : 'border-cyan-500/30 bg-cyan-500/15 text-cyan-400'
                            }`}>
                              {log.type === 'sleep' ? <Moon size={18} /> : 
                               log.type === 'meditation' ? <Compass size={18} /> : <Smile size={18} />}
                            </div>
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-white font-orbitron">
                                {log.type === 'sleep' ? l('Sono Noturno', 'Night Sleep') : 
                                 log.type === 'meditation' ? l('Meditação / Calma', 'Meditation / Calm') : l('Hobby Offline', 'Offline Hobby')}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                {date} • {log.notes ? l(log.notes, translateUiText(log.notes)) : l('Sem observações', 'No notes')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs sm:text-sm font-black font-orbitron text-white">
                              {log.type === 'sleep' || log.type === 'hobby' ? `${hours}h` : `${log.duration_min} min`}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLog(log.id)}
                              className="rounded-lg p-1.5 text-gray-600 hover:bg-rose-500/15 hover:text-rose-400 transition-colors"
                              title={l('Excluir registro', 'Delete log')}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </HudCard>
            </div>
          </motion.div>
        )}

        {/* ─── ABA 2: TEMPLO DA MENTE (MEDITAÇÃO GUIADA) ─── */}
        {activeSubTab === 'meditation' && (
          <motion.div
            key="meditation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-purple-500/20 bg-[#0F0F13] px-6 py-12 shadow-[0_0_32px_rgba(168,85,247,0.08)]"
          >
            <div className="max-w-md w-full text-center space-y-6">
              <div className="space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-purple-400 font-orbitron">
                  {l('Templo do Silêncio', 'Silence Sanctuary')}
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-white font-orbitron">
                  {l('Respiração &', 'Guided')} <span className="text-purple-400">{l('Meditação', 'Meditation')}</span>
                </h2>
                <p className="mx-auto max-w-sm text-xs sm:text-sm leading-relaxed text-gray-400">
                  {l(
                    'Acalme a mente para regenerar mana. Siga o pulso de respiração de 4 fases para sincronizar sua clareza mental.',
                    'Calm your mind to regenerate mana. Follow the 4-phase breathing pulse to sync your mental focus.'
                  )}
                </p>
              </div>

              {/* Círculo de Meditação Pulsante */}
              <div className="relative flex items-center justify-center mx-auto w-64 h-64 my-4">
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
                  className="relative z-10 flex h-52 w-52 flex-col items-center justify-center rounded-full border-2 border-purple-500 bg-purple-950/30 shadow-[0_0_48px_rgba(168,85,247,0.22)]"
                  animate={isMeditationActive ? { 
                    scale: breatheState === 'Inspire' || breatheState === 'Segure' ? [1, 1.15] : [1.15, 1],
                    boxShadow: breatheState === 'Inspire' || breatheState === 'Segure' 
                      ? '0 0 50px rgba(168,85,247,0.5)' 
                      : '0 0 18px rgba(168,85,247,0.2)'
                  } : { scale: 1 }}
                  transition={isMeditationActive ? { duration: 4, ease: 'easeInOut' } : { duration: 0.5 }}
                >
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-purple-400 font-orbitron">
                    {isMeditationActive ? (
                      breatheState === 'Inspire' ? l('Inspire', 'Inhale') :
                      breatheState === 'Segure' ? l('Segure', 'Hold') :
                      breatheState === 'Expire' ? l('Expire', 'Exhale') : l('Prenda', 'Hold')
                    ) : l('PRONTO', 'READY')}
                  </span>
                  <span className="mt-2 text-4xl font-black text-white font-orbitron drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]">
                    {formatTime(timeLeft)}
                  </span>
                  <span className="mt-2 text-xs font-semibold text-gray-500">
                    {l('Meta:', 'Target:')} {meditationTime} Min
                  </span>
                </motion.div>
              </div>

              {/* Seletores de Tempo */}
              {!isMeditationActive && (
                <div className="grid grid-cols-5 gap-2">
                  {[1, 5, 10, 15, 20].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setMeditationTime(mins);
                        setTimeLeft(mins * 60);
                      }}
                      className={`min-h-[44px] rounded-xl border px-2 py-2 text-xs font-black font-orbitron transition-all ${
                        meditationTime === mins
                          ? 'border-purple-500 bg-purple-500/25 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                          : 'border-white/10 bg-black/40 text-gray-400 hover:border-purple-500/40 hover:text-white'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              )}

              {/* Botões de Ação */}
              <div className="flex justify-center gap-3 pt-2">
                <TacticalButton
                  onClick={toggleTimer}
                  variant="primary"
                  accent="purple"
                  displayFont
                  className="min-h-[48px] px-8 text-xs font-black"
                >
                  {isMeditationActive ? <Pause size={16} /> : <Play size={16} />}
                  {isMeditationActive ? l('Pausar', 'Pause') : l('Iniciar Meditação', 'Start Meditation')}
                </TacticalButton>

                {timeLeft < meditationTime * 60 && (
                  <TacticalButton
                    onClick={resetTimer}
                    variant="ghost"
                    className="min-h-[48px] px-5 text-xs font-bold"
                  >
                    <RotateCcw size={16} />
                    {l('Reiniciar', 'Reset')}
                  </TacticalButton>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
