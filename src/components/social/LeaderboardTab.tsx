import React, { useState } from 'react';
import {
  Trophy,
  Crown,
  Medal,
  Users,
  Globe,
  Flame,
  Dumbbell,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialStore, type LeaderboardEntry } from '@/stores/useSocialStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { RankBadge } from '@/components/ui/rank-badge';
import type { PublicHunterProfile } from '@/lib/socialScore';

interface LeaderboardTabProps {
  onOpenHunterProfile: (hunter: PublicHunterProfile) => void;
  onOpenAddFriend: () => void;
}

export function LeaderboardTab({
  onOpenHunterProfile,
  onOpenAddFriend,
}: LeaderboardTabProps) {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const {
    globalLeaderboard,
    friendsLeaderboard,
    currentPeriod,
    switchPeriod,
    userRankPosition,
  } = useSocialStore();

  const [scope, setScope] = useState<'global' | 'friends'>('global');
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly'>('weekly');

  const activeEntries = scope === 'global' ? globalLeaderboard : friendsLeaderboard;
  const currentRankPos = scope === 'global' ? userRankPosition.global : userRankPosition.friends;

  const handlePeriodChange = async (newType: 'weekly' | 'monthly') => {
    if (newType === periodType) return;
    setPeriodType(newType);
    if (user?.id) {
      await switchPeriod(newType, user.id);
    }
  };

  const top3 = activeEntries.slice(0, 3);
  const remainingEntries = activeEntries.slice(3);

  const classImageMap: Record<string, string> = {
    Warrior: '/optimized/Classes/Warrior/Rank E.jpg',
    Scholar: '/optimized/Classes/Scholar/Rank E.jpg',
    Creator: '/optimized/Classes/Creator/Rank E.jpg',
    Monk: '/optimized/Classes/Monk/Rank E.jpg',
    Leader: '/optimized/Classes/Leader/Rank E.jpg',
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Temporada */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        {/* Alternador Global vs Amigos */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setScope('global')}
            className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-lg font-orbitron text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              scope === 'global'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="size-3.5" />
            <span>{l('Ranking Global', 'Global Board')}</span>
          </button>

          <button
            type="button"
            onClick={() => setScope('friends')}
            className={`flex-1 sm:flex-none min-h-[40px] px-4 rounded-lg font-orbitron text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              scope === 'friends'
                ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="size-3.5" />
            <span>{l('Guilda / Amigos', 'Friends Board')}</span>
          </button>
        </div>

        {/* Alternador Semanal vs Mensal */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-bold font-orbitron uppercase tracking-wider text-slate-400">
              {currentPeriod.type === 'weekly' ? currentPeriod.labelPt : currentPeriod.labelPt}
            </p>
            <p className="text-[11px] font-mono text-cyan-300">
              {l('Termina em', 'Ends in')} {currentPeriod.daysRemaining} {l('dias', 'days')}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => handlePeriodChange('weekly')}
              className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-semibold transition-all ${
                periodType === 'weekly'
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {l('Semanal', 'Weekly')}
            </button>
            <button
              type="button"
              onClick={() => handlePeriodChange('monthly')}
              className={`px-3 py-1.5 rounded-lg font-orbitron text-xs font-semibold transition-all ${
                periodType === 'monthly'
                  ? 'bg-white/15 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {l('Mensal', 'Monthly')}
            </button>
          </div>
        </div>
      </div>

      {/* Pódio dos Top 3 Caçadores */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
          {/* 2º Lugar (Prata) */}
          {top3[1] && (
            <div className="order-2 sm:order-1 sm:pt-6">
              <HudCard
                variant="cyan"
                corners
                onClick={() => onOpenHunterProfile(top3[1].hunter)}
                className="p-4 text-center cursor-pointer hover:border-cyan-300/60 transition-all border-slate-300/30 bg-black/50"
              >
                <div className="size-7 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/50 flex items-center justify-center font-orbitron font-black text-xs mx-auto mb-2">
                  2
                </div>
                <div className="size-16 rounded-2xl mx-auto overflow-hidden border border-slate-300/40 mb-2">
                  <img
                    src={top3[1].hunter.avatarUrl || (top3[1].hunter.hunterClass ? classImageMap[top3[1].hunter.hunterClass] : classImageMap.Warrior)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <h4 className="font-orbitron font-bold text-white text-xs truncate">
                  {top3[1].hunter.username}
                </h4>
                <p className="font-mono text-[10px] text-slate-400">{top3[1].hunter.hunterTag}</p>
                <div className="mt-2 text-xs font-orbitron font-black text-slate-200">
                  {top3[1].score.toLocaleString()} PTS
                </div>
              </HudCard>
            </div>
          )}

          {/* 1º Lugar (Ouro) */}
          {top3[0] && (
            <div className="order-1 sm:order-2">
              <HudCard
                variant="gold"
                corners
                radialGlow
                onClick={() => onOpenHunterProfile(top3[0].hunter)}
                className="p-5 text-center cursor-pointer hover:border-amber-300 transition-all border-amber-400/50 bg-[#121008]/80 shadow-[0_0_35px_rgba(245,158,11,0.2)]"
              >
                <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
                  <Crown className="size-4 animate-bounce" />
                  <span className="font-orbitron font-black text-xs uppercase tracking-widest">
                    {l('Campeão', 'Champion')}
                  </span>
                </div>
                <div className="size-8 rounded-full bg-amber-500/30 text-amber-300 border border-amber-400/60 flex items-center justify-center font-orbitron font-black text-sm mx-auto mb-2">
                  1
                </div>
                <div className="size-20 rounded-2xl mx-auto overflow-hidden border-2 border-amber-400/70 shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-2">
                  <img
                    src={top3[0].hunter.avatarUrl || (top3[0].hunter.hunterClass ? classImageMap[top3[0].hunter.hunterClass] : classImageMap.Warrior)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <h3 className="font-orbitron font-black text-white text-sm truncate">
                  {top3[0].hunter.username}
                </h3>
                <p className="font-mono text-[11px] text-amber-300/80">{top3[0].hunter.hunterTag}</p>
                <div className="mt-2 text-sm font-orbitron font-black text-amber-400">
                  {top3[0].score.toLocaleString()} PTS
                </div>
              </HudCard>
            </div>
          )}

          {/* 3º Lugar (Bronze) */}
          {top3[2] && (
            <div className="order-3 sm:order-3 sm:pt-8">
              <HudCard
                variant="crimson"
                corners
                onClick={() => onOpenHunterProfile(top3[2].hunter)}
                className="p-4 text-center cursor-pointer hover:border-amber-600 transition-all border-amber-700/40 bg-black/50"
              >
                <div className="size-7 rounded-full bg-amber-800/30 text-amber-500 border border-amber-700/50 flex items-center justify-center font-orbitron font-black text-xs mx-auto mb-2">
                  3
                </div>
                <div className="size-16 rounded-2xl mx-auto overflow-hidden border border-amber-700/40 mb-2">
                  <img
                    src={top3[2].hunter.avatarUrl || (top3[2].hunter.hunterClass ? classImageMap[top3[2].hunter.hunterClass] : classImageMap.Warrior)}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <h4 className="font-orbitron font-bold text-white text-xs truncate">
                  {top3[2].hunter.username}
                </h4>
                <p className="font-mono text-[10px] text-slate-400">{top3[2].hunter.hunterTag}</p>
                <div className="mt-2 text-xs font-orbitron font-black text-amber-600">
                  {top3[2].score.toLocaleString()} PTS
                </div>
              </HudCard>
            </div>
          )}
        </div>
      )}

      {/* Lista Completa dos Caçadores */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-3 text-[10px] font-bold font-orbitron uppercase tracking-wider text-slate-500">
          <span>{l('Posição & Caçador', 'Rank & Hunter')}</span>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">{l('Atividades Validadas', 'Validated Activities')}</span>
            <span>{l('Pontuação', 'Score')}</span>
          </div>
        </div>

        {activeEntries.length > 0 ? (
          <div className="space-y-2">
            {activeEntries.map((entry) => {
              const isMe = entry.isCurrentUser;
              return (
                <div
                  key={entry.hunter.userId}
                  onClick={() => onOpenHunterProfile(entry.hunter)}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isMe
                      ? 'border-cyan-400/60 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/30'
                      : 'border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`font-orbitron font-black text-sm w-7 text-center ${
                        entry.rankPosition <= 3
                          ? 'text-amber-400'
                          : isMe
                            ? 'text-cyan-300'
                            : 'text-slate-400'
                      }`}
                    >
                      #{entry.rankPosition}
                    </span>

                    <div className="size-10 rounded-xl overflow-hidden border border-white/10 bg-black/50 shrink-0">
                      <img
                        src={entry.hunter.avatarUrl || (entry.hunter.hunterClass ? classImageMap[entry.hunter.hunterClass] : classImageMap.Warrior)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-orbitron font-bold text-xs sm:text-sm truncate ${isMe ? 'text-cyan-200' : 'text-white'}`}>
                          {entry.hunter.username}
                        </p>
                        {isMe && (
                          <span className="text-[9px] font-bold font-orbitron px-1.5 py-0.5 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                            {l('VOCÊ', 'YOU')}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-slate-400 truncate">
                        {entry.hunter.hunterTag} &bull; {entry.hunter.activeTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1" title={l('Treinos', 'Workouts')}>
                        <Dumbbell className="size-3 text-cyan-400" />
                        {entry.workoutsCount}
                      </span>
                      <span className="flex items-center gap-1" title={l('Hábitos', 'Habits')}>
                        <CheckCircle2 className="size-3 text-emerald-400" />
                        {entry.habitsCount}
                      </span>
                    </div>

                    <div className="text-right">
                      <p className={`font-orbitron font-black text-sm sm:text-base ${isMe ? 'text-cyan-300' : 'text-white'}`}>
                        {entry.score.toLocaleString()}
                      </p>
                      <p className="text-[9px] font-orbitron text-slate-500 uppercase">PTS</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Estado Vazio no Ranking de Amigos */
          <HudCard variant="cyan" corners className="p-8 text-center my-6 space-y-3">
            <Users className="size-8 text-cyan-400 mx-auto" />
            <h3 className="font-orbitron font-black text-white text-base">
              {l('Sua Guilda ainda não tem competidores', 'Your Guild has no competitors yet')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {l(
                'Adicione outros caçadores usando a Hunter Tag para competirem juntos na classificação semanal!',
                'Add other hunters using their Hunter Tag to compete together in the weekly cycle!'
              )}
            </p>
            <button
              type="button"
              onClick={onOpenAddFriend}
              className="mt-2 px-5 py-2.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-95 transition-all"
            >
              {l('Adicionar Caçador', 'Add Hunter')}
            </button>
          </HudCard>
        )}
      </div>

      {/* Barra Fixada de Posição do Jogador (se não estiver entre os top visíveis) */}
      {currentRankPos && currentRankPos > 5 && (
        <div className="sticky bottom-20 z-20 p-3.5 rounded-2xl border border-cyan-400/60 bg-[#0B0D17]/95 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.25)] flex items-center justify-between backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="font-orbitron font-black text-cyan-300 text-base">
              #{currentRankPos}
            </span>
            <div>
              <p className="font-orbitron font-bold text-white text-xs">
                {l('Sua Classificação Atual', 'Your Current Ranking')}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {l('Continue cumprindo treinos e hábitos para subir!', 'Keep completing workouts and habits to climb!')}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-xs font-orbitron font-bold">
            {l('Ativo', 'Active')}
          </span>
        </div>
      )}
    </div>
  );
}

