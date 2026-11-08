import React, { useState, useEffect } from 'react';
import {
  Shield,
  Copy,
  Check,
  Trophy,
  Crown,
  Eye,
  EyeOff,
  UserCheck,
  Globe,
  Award,
  Sparkles,
  Save,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialStore } from '@/stores/useSocialStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { ALL_POSSIBLE_ACHIEVEMENTS } from '@/lib/achievementsData';
import { supabase } from '@/lib/supabase';

export function SocialProfileTab() {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const {
    myPublicProfile,
    updatePrivacySettings,
    updateFeaturedTrophies,
  } = useSocialStore();

  const [copied, setCopied] = useState(false);
  const [bio, setBio] = useState(myPublicProfile?.bio || '');
  const [isPublic, setIsPublic] = useState(myPublicProfile?.isPublic ?? true);
  const [allowRequests, setAllowRequests] = useState(myPublicProfile?.allowFriendRequests ?? true);
  const [includeInGlobal, setIncludeInGlobal] = useState(myPublicProfile?.includeInGlobalLeaderboard ?? true);
  const [featured, setFeatured] = useState<string[]>(myPublicProfile?.featuredAchievements || []);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sincroniza estado inicial do perfil
  useEffect(() => {
    if (myPublicProfile) {
      setBio(myPublicProfile.bio || '');
      setIsPublic(myPublicProfile.isPublic);
      setAllowRequests(myPublicProfile.allowFriendRequests);
      setIncludeInGlobal(myPublicProfile.includeInGlobalLeaderboard);
      setFeatured(myPublicProfile.featuredAchievements || []);
    }
  }, [myPublicProfile]);

  // Carrega conquistas reais do usuário
  useEffect(() => {
    async function loadAchievements() {
      if (!user?.id) return;
      try {
        const { data } = await supabase
          .from('achievements')
          .select('title')
          .eq('user_id', user.id);

        if (data && data.length > 0) {
          setUnlockedAchievements(data.map((d) => d.title));
        } else {
          // Fallback para conquistas conhecidas iniciais
          setUnlockedAchievements([
            'Primeiro Despertar',
            'Início da Jornada',
            'Execução Perfeita',
          ]);
        }
      } catch {
        setUnlockedAchievements([
          'Primeiro Despertar',
          'Início da Jornada',
          'Execução Perfeita',
        ]);
      }
    }
    void loadAchievements();
  }, [user?.id]);

  const handleCopyTag = () => {
    if (!myPublicProfile?.hunterTag) return;
    navigator.clipboard.writeText(myPublicProfile.hunterTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFeatured = (title: string) => {
    if (featured.includes(title)) {
      setFeatured(featured.filter((t) => t !== title));
    } else {
      if (featured.length >= 3) return; // Máximo 3
      setFeatured([...featured, title]);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    setSavedSuccess(false);

    await updatePrivacySettings(user.id, {
      isPublic,
      allowFriendRequests: allowRequests,
      includeInGlobalLeaderboard: includeInGlobal,
      bio: bio.trim(),
    });

    await updateFeaturedTrophies(user.id, featured);

    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Card da Hunter Tag Oficial */}
      <HudCard
        variant="cyan"
        corners
        radialGlow
        className="p-5 sm:p-6 border border-cyan-400/35 bg-black/50"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold uppercase tracking-wider text-cyan-400">
              <Sparkles className="size-3" />
              <span>{l('Identificador Oficial de Caçador', 'Official Hunter ID')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-orbitron text-white mt-1">
              {myPublicProfile?.hunterTag || 'hunter#0000'}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {l(
                'Compartilhe este código para que outros caçadores enviem solicitações de amizade.',
                'Share this code so other hunters can send you friend requests.'
              )}
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopyTag}
            className="min-h-[46px] px-4 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {copied ? <Check className="size-4 text-white" /> : <Copy className="size-4" />}
            <span>{copied ? l('Copiado!', 'Copied!') : l('Copiar Tag', 'Copy Tag')}</span>
          </button>
        </div>
      </HudCard>

      {/* Seção de Bio do Caçador */}
      <HudCard variant="default" corners className="p-5 space-y-3 border-white/10 bg-black/40">
        <label
          htmlFor="hunter-bio"
          className="block text-xs font-orbitron font-bold uppercase tracking-wider text-slate-300"
        >
          {l('Frase de Caçador (Bio)', 'Hunter Motto (Bio)')}
        </label>
        <textarea
          id="hunter-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 120))}
          rows={3}
          placeholder={l('Ex: Rumo ao Rank S. Foco total em consistência física.', 'E.g. Road to Rank S. Absolute focus on consistency.')}
          className="w-full p-3.5 rounded-xl border border-white/10 bg-black/50 text-xs sm:text-sm text-white font-sans placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none"
        />
        <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
          <span>{l('Visível apenas no perfil público.', 'Only visible in your public profile.')}</span>
          <span>{bio.length}/120</span>
        </div>
      </HudCard>

      {/* Vitrine de Conquistas (Trophy Room Integration) */}
      <HudCard variant="purple" corners className="p-5 space-y-3.5 border-violet-400/30 bg-black/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="size-4 text-amber-400" />
            <h4 className="font-orbitron font-bold text-white text-xs sm:text-sm">
              {l('Vitrine de Conquistas (Até 3)', 'Showcase Achievements (Up to 3)')}
            </h4>
          </div>
          <span className="text-[11px] font-mono text-cyan-300 font-bold">
            {featured.length}/3
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {l(
            'Selecione as conquistas que outros caçadores verão no seu perfil público.',
            'Select the achievements other hunters will see on your public profile.'
          )}
        </p>

        {unlockedAchievements.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto pr-1">
            {unlockedAchievements.map((ach) => {
              const isSelected = featured.includes(ach);
              return (
                <button
                  type="button"
                  key={ach}
                  onClick={() => handleToggleFeatured(ach)}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all ${
                    isSelected
                      ? 'border-amber-400/60 bg-amber-500/15 text-amber-200'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Award className={`size-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span className="text-xs font-orbitron font-semibold truncate">{ach}</span>
                  </div>
                  {isSelected && <Check className="size-3.5 text-amber-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-500 italic">
            {l('Desbloqueie conquistas na Trophy Room para destacá-las aqui.', 'Unlock achievements in Trophy Room to showcase them here.')}
          </p>
        )}
      </HudCard>

      {/* Controles de Privacidade Rigorosos */}
      <HudCard variant="default" corners className="p-5 space-y-4 border-white/10 bg-black/40">
        <h4 className="font-orbitron font-bold text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
          <Shield className="size-4 text-cyan-400" />
          <span>{l('Controles de Privacidade', 'Privacy Controls')}</span>
        </h4>

        <div className="space-y-3 pt-1">
          {/* Toggle Perfil Público */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <div>
              <p className="text-xs font-orbitron font-bold text-white">
                {l('Perfil Público Ativo', 'Public Profile Active')}
              </p>
              <p className="text-[11px] text-slate-400">
                {l('Permite que outros caçadores vejam seu card de honra.', 'Allows other hunters to view your honor card.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPublic(!isPublic)}
              className={`size-6 rounded-md flex items-center justify-center transition-colors ${
                isPublic ? 'bg-cyan-500 text-black' : 'border border-white/20 bg-transparent text-transparent'
              }`}
            >
              <Check className="size-4" />
            </button>
          </div>

          {/* Toggle Solicitações de Amizade */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <div>
              <p className="text-xs font-orbitron font-bold text-white">
                {l('Receber Pedidos de Amizade', 'Accept Friend Requests')}
              </p>
              <p className="text-[11px] text-slate-400">
                {l('Outros caçadores podem enviar solicitações via Hunter Tag.', 'Other hunters can send requests via Hunter Tag.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAllowRequests(!allowRequests)}
              className={`size-6 rounded-md flex items-center justify-center transition-colors ${
                allowRequests ? 'bg-cyan-500 text-black' : 'border border-white/20 bg-transparent text-transparent'
              }`}
            >
              <Check className="size-4" />
            </button>
          </div>

          {/* Toggle Ranking Global */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.02]">
            <div>
              <p className="text-xs font-orbitron font-bold text-white">
                {l('Participar do Ranking Global', 'Join Global Leaderboard')}
              </p>
              <p className="text-[11px] text-slate-400">
                {l('Exibir sua pontuação competitiva na tabela geral.', 'Display your competitive score on the general board.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIncludeInGlobal(!includeInGlobal)}
              className={`size-6 rounded-md flex items-center justify-center transition-colors ${
                includeInGlobal ? 'bg-cyan-500 text-black' : 'border border-white/20 bg-transparent text-transparent'
              }`}
            >
              <Check className="size-4" />
            </button>
          </div>
        </div>

        <div className="pt-2">
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            {l(
              'Garantia de Privacidade: E-mail, peso, medidas corporais, alimentação e finanças NUNCA são expostos publicamente.',
              'Privacy Guarantee: Email, weight, body measurements, nutrition, and finances are NEVER publicly exposed.'
            )}
          </p>
        </div>
      </HudCard>

      {/* Botão de Salvar Alterações */}
      <div className="flex items-center justify-between pt-2">
        {savedSuccess ? (
          <span className="text-xs text-emerald-400 font-orbitron font-bold flex items-center gap-1.5">
            <Check className="size-4" />
            {l('Configurações salvas no Sistema!', 'Settings saved to System!')}
          </span>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="min-h-[50px] px-6 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          <span>{saving ? l('Salvando...', 'Saving...') : l('Salvar Alterações', 'Save Changes')}</span>
        </button>
      </div>
    </div>
  );
}

