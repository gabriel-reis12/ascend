import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  RefreshCw, 
  Trash2, 
  Calendar, 
  ShieldAlert, 
  Sword, 
  Book, 
  Zap, 
  Shield, 
  Check, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useHunterStore, type HunterClass } from '../stores/useHunterStore';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hunterStore = useHunterStore();
  
  // Estado local dos formulários
  const [fullName, setFullName] = useState(hunterStore.fullName || '');
  const [birthday, setBirthday] = useState(hunterStore.birthday || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loadings
  const [profileLoading, setProfileLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [resetRpgLoading, setResetRpgLoading] = useState(false);
  const [resetAllLoading, setResetAllLoading] = useState(false);
  
  // Notificações / Status
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [securityMsg, setSecurityMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Modais de confirmação
  const [showResetRpgModal, setShowResetRpgModal] = useState(false);
  const [showResetAllModal, setShowResetAllModal] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    if (user) {
      void hunterStore.loadProfile(user.id);
    }
  }, [user]);

  // Atualizar inputs locais caso mudem no Zustand
  useEffect(() => {
    setFullName(hunterStore.fullName || '');
    setBirthday(hunterStore.birthday || '');
  }, [hunterStore.fullName, hunterStore.birthday]);

  // Configuração visual por classe
  const getClassConfig = (hClass: HunterClass | null, rank: string | null | undefined) => {
    const getRankImageName = (r: string | null | undefined): string => {
      if (!r) return 'Rank E';
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

    switch (hClass) {
      case 'Warrior':
        return {
          title: 'WARRIOR',
          glow: 'shadow-[0_0_35px_rgba(59,130,246,0.35)]',
          border: 'border-blue-500/40',
          bgGlow: 'bg-blue-500/5',
          text: 'text-blue-400',
          icon: <Sword className="w-6 h-6 text-blue-400" />,
          image: `/Classes/Warrior/${rankName}.jpeg`
        };
      case 'Scholar':
        return {
          title: 'SCHOLAR',
          glow: 'shadow-[0_0_35px_rgba(124,58,237,0.4)]',
          border: 'border-purple-500/40',
          bgGlow: 'bg-purple-500/5',
          text: 'text-purple-400',
          icon: <Book className="w-6 h-6 text-purple-400" />,
          image: `/Classes/Scholar/${rankName}.jpeg`
        };
      case 'Monk':
        return {
          title: 'MONK',
          glow: 'shadow-[0_0_35px_rgba(6,182,212,0.35)]',
          border: 'border-cyan-500/40',
          bgGlow: 'bg-cyan-500/5',
          text: 'text-cyan-400',
          icon: <Zap className="w-6 h-6 text-cyan-400" />,
          image: `/Classes/Monk/${rankName}.jpeg`
        };
      case 'Titan':
        return {
          title: 'TITAN',
          glow: 'shadow-[0_0_35px_rgba(239,68,68,0.35)]',
          border: 'border-red-500/40',
          bgGlow: 'bg-red-500/5',
          text: 'text-red-400',
          icon: <Shield className="w-6 h-6 text-red-400" />,
          image: `/Classes/Titan/${rankName}.jpeg`
        };
      default:
        return {
          title: 'CAÇADOR DESPERTO',
          glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
          border: 'border-purple-500/30',
          bgGlow: 'bg-purple-500/5',
          text: 'text-purple-400',
          icon: <User className="w-6 h-6 text-purple-400" />,
          image: `/Classes/Warrior/${rankName}.jpeg`
        };
    }
  };

  const classConfig = getClassConfig(hunterStore.hunterClass, hunterStore.rank);

  // 1. Atualizar Perfil Opcional
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setProfileLoading(true);
    setProfileMsg(null);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          birthday: birthday || null
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Sincronizar Zustand
      await hunterStore.loadProfile(user.id);
      
      setProfileMsg({
        text: 'REGISTRO ATUALIZADO: Sua identidade no Codex foi gravada com sucesso.',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: `ERRO DE GRAVAÇÃO: ${err.message || 'Erro inesperado.'}`,
        type: 'error'
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // 2. Atualizar Segurança (E-mail e Senha)
  const handleSaveSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (password && password !== confirmPassword) {
      setSecurityMsg({ text: 'VALIDAÇÃO FALHOU: As senhas digitadas não coincidem.', type: 'error' });
      return;
    }
    
    setSecurityLoading(true);
    setSecurityMsg(null);
    
    try {
      const updates: { email?: string; password?: string } = {};
      if (email && email !== user.email) updates.email = email;
      if (password) updates.password = password;
      
      if (Object.keys(updates).length === 0) {
        setSecurityMsg({ text: 'Nenhuma credencial nova foi informada.', type: 'error' });
        setSecurityLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
      setSecurityMsg({
        text: 'SISTEMA DE SEGURANÇA ATUALIZADO: Suas novas chaves de acesso foram sincronizadas.',
        type: 'success'
      });
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      setSecurityMsg({
        text: `ERRO DE SEGURANÇA: ${err.message || 'Erro de autenticação.'}`,
        type: 'error'
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  // 3. Reset Simples - Apenas Pontos de RPG e Atributos
  const handleResetRPG = async () => {
    if (!user) return;
    setResetRpgLoading(true);
    setShowResetRpgModal(false);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          level: 1,
          xp: 0,
          xp_to_next_level: 100,
          rank: 'E',
          strength: 10,
          intelligence: 10,
          endurance: 10,
          vitality: 10,
          discipline: 10
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Sincronizar local
      await hunterStore.loadProfile(user.id);
      
      // Feedback Épico
      setProfileMsg({
        text: 'FALHA DE REGISTRO CORRIGIDA: Seus atributos bônus e níveis de caçador foram purificados de volta ao Nível 1. Suas missões permanecem intactas.',
        type: 'success'
      });
    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: `ERRO DE REDEFINIÇÃO: ${err.message || 'Não foi possível redefinir atributos.'}`,
        type: 'error'
      });
    } finally {
      setResetRpgLoading(false);
    }
  };

  // 4. Reset Geral - Limpar App do Zero
  const handleResetAll = async () => {
    if (!user || resetConfirmText.toLowerCase() !== 'destruir') return;
    setResetAllLoading(true);
    setShowResetAllModal(false);
    
    try {
      // 1. Deletar completions e subitens
      await supabase.from('habit_completions').delete().eq('user_id', user.id);
      await supabase.from('routine_completions').delete().eq('user_id', user.id);
      await supabase.from('meal_completions').delete().eq('user_id', user.id);
      await supabase.from('routine_exercises').delete().filter('id', 'in', 
        (await supabase.from('workout_routines').select('id').eq('user_id', user.id)).data?.map(r => r.id) || []
      );
      await supabase.from('meal_plan_items').delete().filter('id', 'in', 
        (await supabase.from('meal_plans').select('id').eq('user_id', user.id)).data?.map(m => m.id) || []
      );

      // 2. Deletar tabelas principais
      await supabase.from('habits').delete().eq('user_id', user.id);
      await supabase.from('tasks').delete().eq('user_id', user.id);
      await supabase.from('workout_routines').delete().eq('user_id', user.id);
      await supabase.from('workout_logs').delete().eq('user_id', user.id);
      await supabase.from('meal_plans').delete().eq('user_id', user.id);
      await supabase.from('food_logs').delete().eq('user_id', user.id);
      await supabase.from('achievements').delete().eq('user_id', user.id);
      await supabase.from('daily_checklist').delete().eq('user_id', user.id);

      // 3. Deletar customs criados pelo usuário
      await supabase.from('exercises').delete().eq('created_by', user.id);
      await supabase.from('foods').delete().eq('created_by', user.id);

      // 4. Redefinir perfil no Supabase de volta ao estado purificado inicial (class = null, etc)
      const { error: errorProfile } = await supabase
        .from('profiles')
        .update({
          class: null,
          level: 1,
          xp: 0,
          xp_required: 100,
          rank: 'E',
          strength: 10,
          intelligence: 10,
          endurance: 10,
          vitality: 10,
          discipline: 10,
          streak_current: 0,
          streak_best: 0,
          last_check_in: null,
          birthday: null,
          full_name: ''
        })
        .eq('id', user.id);
        
      if (errorProfile) throw errorProfile;
      
      // 5. Limpar Zustand Store e redirecionar imediatamente para o onboarding
      hunterStore.reset();
      
      // Pequeno delay dramático
      setTimeout(() => {
        navigate('/onboarding', { replace: true });
      }, 1000);
      
    } catch (err: any) {
      console.error(err);
      setProfileMsg({
        text: `ERRO DE RESET COMPLETO: ${err.message || 'Falha crítica ao limpar dados.'}`,
        type: 'error'
      });
    } finally {
      setResetAllLoading(false);
      setResetConfirmText('');
    }
  };

  return (
    <div className="space-y-8 pb-16 text-silver">
      
      {/* ── TÍTULO DA PÁGINA ── */}
      <div className="flex flex-col gap-1.5 border-l-2 border-blue-500 pl-4 py-1">
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-wider text-white font-orbitron text-glow-blue">
          Ajustes de <span className="text-blue-500">Sistema</span>
        </h1>
        <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Modificação e Controle Central da Fenda do Caçador
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* COLUNA ESQUERDA: FICHA DA CLASSE ATIVA */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-3xl border ${classConfig.border} bg-[#0F0F13] p-5 sm:p-6 text-center ${classConfig.glow}`}
          >
            {/* Glow centralizador */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f13] via-transparent to-[#0f0f13] z-10" />
            
            {/* Imagem de classe com blur de entrada */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-5 sm:mb-6 group border border-[#1e1e26]">
              <img 
                src={classConfig.image} 
                alt={classConfig.title} 
                className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              
              {/* Selo RPG do Rank */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex size-10 sm:size-12 items-center justify-center rounded-xl sm:rounded-2xl border border-blue-500/40 bg-black/70 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                <span className="text-xl sm:text-2xl font-black text-blue-400 italic font-orbitron">{hunterStore.rank || 'E'}</span>
              </div>
            </div>

            {/* Texto de Ficha */}
            <div className="relative z-20 space-y-2">
              <div className="flex items-center justify-center gap-2">
                {classConfig.icon}
                <h3 className={`text-2xl font-black font-orbitron tracking-widest italic ${classConfig.text}`}>
                  {classConfig.title}
                </h3>
              </div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide">
                Nível {hunterStore.level} Caçador
              </p>
              <div className="h-px w-2/3 mx-auto bg-gray-800/80 my-4" />
              
              {/* Descrição temática */}
              <p className="text-xs text-gray-500 italic max-w-xs mx-auto leading-relaxed">
                "Esta é a sua arte de vocação selada nas fendas profundas. Seu progresso, conquistas e reputação são espelhados em seus atributos de batalha diária."
              </p>
            </div>
          </motion.div>
        </div>

        {/* COLUNA CENTRAL & DIREITA: FORMULÁRIOS E ZONAS */}
        <div className="lg:col-span-2 space-y-8">

          {/* PAINEL 1: PERFIL DO CAÇADOR (NOME E ANIVERSÁRIO) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  Perfil de <span className="text-blue-500">Caçador</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  Dados de Identidade Opcionais no Codex
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <User size={16} />
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 sm:space-y-6">
              {profileMsg && (
                <div className={`p-4 rounded-xl border text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                  profileMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {profileMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nome Completo */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Nome de Batismo (Codinome Real)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Gabriel Reis"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    />
                    <User className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Data de Nascimento (Ciclo Solar)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-blue-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(59,130,246,0.15)] [color-scheme:dark]"
                    />
                    <Calendar className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-blue-600 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 hover:shadow-blue-500/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {profileLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Atualizar Registro
                </button>
              </div>
            </form>
          </motion.div>

          {/* PAINEL 2: CREDENCIAIS DE ACESSO (SEGURANÇA) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-[#1E1E26] bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  Credenciais de <span className="text-purple-500">Acesso</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  Modificação de Chaves Criptográficas
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Lock size={16} />
              </div>
            </div>

            <form onSubmit={handleSaveSecurity} className="space-y-5 sm:space-y-6">
              {securityMsg && (
                <div className={`p-4 rounded-xl border text-[10px] sm:text-xs font-semibold uppercase tracking-wide ${
                  securityMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}>
                  {securityMsg.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* E-mail */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    E-mail do Sistema
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="seuemail@provedor.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-purple-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    />
                    <Mail className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Nova Senha */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-purple-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    />
                    <Lock className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5 md:col-span-1">
                  <label className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-500">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs sm:text-sm font-semibold text-white placeholder-gray-600 transition-all focus:border-purple-500 focus:bg-black/60 focus:outline-none focus:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                    />
                    <Lock className="absolute left-3.5 top-3 sm:top-3.5 w-4 h-4 text-gray-600" />
                  </div>
                </div>

              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={securityLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl bg-purple-600 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-purple-600/20 transition-all hover:bg-purple-500 hover:shadow-purple-500/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {securityLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Atualizar Segurança
                </button>
              </div>
            </form>
          </motion.div>

          {/* PAINEL 2.5: DIRETRIZES DE SISTEMA (TUTORIAL) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-3xl border border-purple-500/20 bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  Diretrizes de <span className="text-purple-400">Sistema</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  Calibração de Interface e Guias Virtuais
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Zap className="w-4 h-4 text-purple-400 fill-purple-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-semibold italic">
                "Se você deseja recalibrar seus sensores cognitivos e rever a apresentação holográfica das seções e módulos vitais do aplicativo, re-inicie o protocolo de guia do caçador."
              </p>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('ascend_tour_completed');
                    navigate('/');
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 sm:py-3 rounded-xl border border-purple-500/30 bg-purple-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-400 transition-all hover:bg-purple-500/20 hover:border-purple-500 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar Guia do Caçador
                </button>
              </div>
            </div>
          </motion.div>

          {/* PAINEL 3: ZONA DE PERIGO (REDEFINIÇÕES) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-3xl border border-rose-500/20 bg-[#0F0F13] p-5 sm:p-8 shadow-xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="mb-5 sm:mb-6 flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-wider text-white font-orbitron">
                  Zona de <span className="text-rose-500">Perigo</span>
                </h2>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-600">
                  Ações Irreversíveis de Modificação de Matriz
                </p>
              </div>
              <div className="flex size-9 sm:size-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                <ShieldAlert size={16} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Reset Simples (Zerar RPG) */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#1e1e26] bg-black/30 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                    Zerar RPG (Atributos & XP)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                    Purifica seu progresso para o **Nível 1** e redefine todos os status base (FOR, INT, RES, VIT, DIS) para **10**. 
                    <span className="text-orange-400/90 font-bold block mt-1">⚠️ Mantém intocados seus treinos, dietas, hábitos e tarefas.</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetRpgModal(true)}
                  disabled={resetRpgLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border border-orange-500/30 bg-orange-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-orange-400 transition-all hover:bg-orange-500/20 hover:border-orange-500 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {resetRpgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Zerar Atributos
                </button>
              </div>

              {/* Reset Geral (Reset total) */}
              <div className="p-5 sm:p-6 rounded-2xl border border-[#1e1e26] bg-black/30 flex flex-col justify-between gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    Destruir Registro (Reset Geral)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                    Apaga permanentemente **todas as fichas de treino, refeições, tarefas, hábitos e históricos**. 
                    Redefine sua classe para **nulo** para obrigá-lo a recomeçar do onboarding.
                    <span className="text-rose-500 font-bold block mt-1">💀 Ação totalmente irreversível!</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetAllModal(true)}
                  disabled={resetAllLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl border border-rose-500/30 bg-rose-500/5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-500 transition-all hover:bg-rose-500/20 hover:border-rose-500 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {resetAllLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Zerar Sistema do App
                </button>
              </div>

            </div>
          </motion.div>

        </div>

      </div>

      {/* ── MODAL 1: CONFIRMAÇÃO RESET RPG ── */}
      <AnimatePresence>
        {showResetRpgModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full rounded-[2rem] border border-orange-500/30 bg-[#0F0F13] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black font-orbitron uppercase text-white tracking-wide">
                  Purificar Atributos?
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Você está prestes a redefinir seu nível de Caçador para **1**, seu XP para **0** e todos os seus atributos RPG base para **10**. 
                </p>
                <div className="p-4 rounded-xl bg-orange-950/20 border border-orange-500/10 text-xs text-orange-300 font-semibold leading-relaxed">
                  💡 Seus hábitos, treinos cadastrados, tarefas criadas e planos alimentares **NÃO** serão afetados!
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => setShowResetRpgModal(false)}
                    className="py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-black/60 active:scale-95 cursor-pointer"
                  >
                    Abortar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetRPG}
                    className="py-3 rounded-xl bg-orange-600 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/20 transition-all hover:bg-orange-500 active:scale-95 cursor-pointer"
                  >
                    Confirmar Reset
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: CONFIRMAÇÃO RESET GERAL ── */}
      <AnimatePresence>
        {showResetAllModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full rounded-[2rem] border border-rose-500/30 bg-[#0F0F13] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black font-orbitron uppercase text-white tracking-wide">
                  Destruição da Matriz!
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Isso irá deletar de forma definitiva todos os seus treinos, rotinas, hábitos, tarefas, logs de comida e conquistas do servidor. Sua classe de caçador será apagada e você recomeçará do zero.
                </p>
                
                <div className="w-full space-y-2 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    Digite <span className="font-extrabold underline">DESTRUIR</span> para confirmar
                  </label>
                  <input
                    type="text"
                    placeholder="DESTRUIR"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    className="w-full py-3 rounded-xl border border-rose-500/30 bg-black/60 text-center text-sm font-black tracking-widest text-rose-500 uppercase placeholder-rose-950 focus:border-rose-500 focus:outline-none focus:bg-black/80"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetAllModal(false);
                      setResetConfirmText('');
                    }}
                    className="py-3 rounded-xl border border-[#1e1e26] bg-black/40 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-black/60 active:scale-95 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleResetAll}
                    disabled={resetConfirmText.toLowerCase() !== 'destruir'}
                    className="py-3 rounded-xl bg-rose-600 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-rose-600/20 transition-all hover:bg-rose-500 active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                  >
                    Confirmar Destruição
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
