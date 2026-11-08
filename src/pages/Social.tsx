import React, { useEffect, useState } from 'react';
import {
  Trophy,
  Users,
  Shield,
  Sparkles,
  ArrowLeft,
  UserPlus,
  Loader2,
  Calendar,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialStore } from '@/stores/useSocialStore';
import { usePreferences } from '@/contexts/preferences';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { LeaderboardTab } from '@/components/social/LeaderboardTab';
import { FriendsListTab } from '@/components/social/FriendsListTab';
import { SocialProfileTab } from '@/components/social/SocialProfileTab';
import { HunterPublicProfileModal } from '@/components/social/HunterPublicProfileModal';
import { AddFriendModal } from '@/components/social/AddFriendModal';
import type { PublicHunterProfile } from '@/lib/socialScore';

export function Social() {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    loadSocialHub,
    currentPeriod,
    incomingRequests,
    loading,
  } = useSocialStore();

  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'friends' | 'profile'>(
    tabParam === 'friends' || tabParam === 'profile' ? tabParam : 'leaderboard'
  );

  const [selectedHunter, setSelectedHunter] = useState<PublicHunterProfile | null>(null);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      void loadSocialHub(user.id);
    }
  }, [user?.id, loadSocialHub]);

  const handleTabChange = (tab: 'leaderboard' | 'friends' | 'profile') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-[#07080C] text-white selection:bg-cyan-300/25 pb-24">
      {/* Background Gradients */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.15),transparent_70%)]" />
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20" />

      {/* Container Principal */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 space-y-6">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-4 pb-2 border-b border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label={l('Voltar para a Home', 'Back to Home')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-orbitron font-bold uppercase tracking-widest text-cyan-400">
                  Ascend Social v1
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-orbitron uppercase tracking-wider text-white">
                {l('Fenda Social do Caçador', 'Hunter Social Gate')}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />
          </div>
        </header>

        {/* Banner de Ciclo Ativo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-cyan-400/25 bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold font-orbitron text-white">
                {currentPeriod.labelPt}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {l(
                  'Pontuação baseada em treinos legítimos, hábitos cumpridos e dano na Raid.',
                  'Score based on verified workouts, daily habits, and Raid damage.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-black/40 px-3 py-1.5 rounded-xl border border-cyan-400/20 self-start sm:self-auto">
            <Calendar className="size-3.5" />
            <span>{currentPeriod.daysRemaining} {l('dias restantes', 'days left')}</span>
          </div>
        </div>

        {/* Abas de Navegação (HUD v2) */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => handleTabChange('leaderboard')}
            className={`min-h-[48px] px-3 rounded-xl font-orbitron text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="size-4 shrink-0" />
            <span className="truncate">{l('Ranking', 'Leaderboard')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('friends')}
            className={`min-h-[48px] px-3 rounded-xl font-orbitron text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'friends'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="size-4 shrink-0" />
            <span className="truncate">{l('Companheiros', 'Friends')}</span>
            {incomingRequests.length > 0 && (
              <span className="size-5 rounded-full bg-amber-400 text-black text-[10px] font-black flex items-center justify-center ml-1">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('profile')}
            className={`min-h-[48px] px-3 rounded-xl font-orbitron text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="size-4 shrink-0" />
            <span className="truncate">{l('Meu Perfil', 'My Profile')}</span>
          </button>
        </div>

        {/* Conteúdo da Aba Ativa */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="size-8 text-cyan-400 animate-spin" />
            <p className="text-xs font-orbitron text-slate-400 uppercase tracking-widest">
              {l('Sincronizando Fenda Social...', 'Syncing Social Gate...')}
            </p>
          </div>
        ) : (
          <div>
            {activeTab === 'leaderboard' && (
              <LeaderboardTab
                onOpenHunterProfile={(hunter) => setSelectedHunter(hunter)}
                onOpenAddFriend={() => setIsAddFriendOpen(true)}
              />
            )}

            {activeTab === 'friends' && (
              <FriendsListTab
                onOpenHunterProfile={(hunter) => setSelectedHunter(hunter)}
                onOpenAddFriend={() => setIsAddFriendOpen(true)}
              />
            )}

            {activeTab === 'profile' && <SocialProfileTab />}
          </div>
        )}
      </div>

      {/* Modal de Perfil do Caçador */}
      <HunterPublicProfileModal
        hunter={selectedHunter}
        isOpen={Boolean(selectedHunter)}
        onClose={() => setSelectedHunter(null)}
      />

      {/* Modal de Adicionar Amigo */}
      <AddFriendModal
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
        onOpenHunterProfile={(hunter) => setSelectedHunter(hunter)}
      />
    </div>
  );
}

