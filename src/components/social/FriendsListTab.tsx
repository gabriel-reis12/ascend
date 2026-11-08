import React from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  Sparkles,
  ArrowRight,
  Flame,
  Shield,
  Check,
  X,
  Crown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialStore } from '@/stores/useSocialStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { RankBadge } from '@/components/ui/rank-badge';
import type { PublicHunterProfile } from '@/lib/socialScore';

interface FriendsListTabProps {
  onOpenHunterProfile: (hunter: PublicHunterProfile) => void;
  onOpenAddFriend: () => void;
}

export function FriendsListTab({
  onOpenHunterProfile,
  onOpenAddFriend,
}: FriendsListTabProps) {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const {
    friends,
    incomingRequests,
    outgoingRequests,
    acceptFriendRequest,
    declineFriendRequest,
  } = useSocialStore();

  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const handleAccept = async (reqId: string) => {
    if (!user?.id) return;
    setProcessingId(reqId);
    await acceptFriendRequest(reqId, user.id);
    setProcessingId(null);
  };

  const handleDecline = async (reqId: string) => {
    if (!user?.id) return;
    setProcessingId(reqId);
    await declineFriendRequest(reqId, user.id);
    setProcessingId(null);
  };

  const classImageMap: Record<string, string> = {
    Warrior: '/optimized/Classes/Warrior/Rank E.jpg',
    Scholar: '/optimized/Classes/Scholar/Rank E.jpg',
    Creator: '/optimized/Classes/Creator/Rank E.jpg',
    Monk: '/optimized/Classes/Monk/Rank E.jpg',
    Leader: '/optimized/Classes/Leader/Rank E.jpg',
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
            <Users className="size-5" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-white text-sm">
              {l('Guilda de Caçadores', 'Hunter Guild')}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {friends.length} {l('companheiros ativos', 'active companions')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenAddFriend}
          className="h-10 px-4 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center gap-1.5"
        >
          <UserPlus className="size-4" />
          <span>{l('Adicionar Caçador', 'Add Hunter')}</span>
        </button>
      </div>

      {/* Solicitações de Amizade Recebidas */}
      {incomingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-orbitron font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="size-3.5" />
            <span>{l('Solicitações Recebidas', 'Incoming Requests')} ({incomingRequests.length})</span>
          </div>

          <div className="space-y-2">
            {incomingRequests.map((req) => {
              const sender = req.sender;
              if (!sender) return null;
              const isBusy = processingId === req.id;

              return (
                <div
                  key={req.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-amber-400/30 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onOpenHunterProfile(sender)}
                  >
                    <div className="size-11 rounded-xl overflow-hidden border border-amber-400/30 bg-black/50 shrink-0">
                      <img
                        src={sender.avatarUrl || (sender.hunterClass ? classImageMap[sender.hunterClass] : classImageMap.Warrior)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-orbitron font-bold text-white text-xs sm:text-sm">
                          {sender.username}
                        </h4>
                        <span className="font-mono text-[10px] text-amber-300">
                          {sender.hunterTag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-orbitron mt-0.5">
                        {l('Nível', 'Level')} {sender.level} &bull; {sender.rank} &bull; {sender.activeTitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleAccept(req.id)}
                      className="h-9 px-3.5 rounded-xl border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 text-xs font-orbitron font-bold hover:bg-emerald-500/30 transition-all flex items-center gap-1"
                    >
                      <Check className="size-3.5" />
                      <span>{l('Aceitar', 'Accept')}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDecline(req.id)}
                      className="h-9 px-3 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 text-xs font-orbitron transition-all"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Solicitações Enviadas Pendentes */}
      {outgoingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-400">
            <Clock className="size-3.5 text-cyan-400" />
            <span>{l('Solicitações Enviadas', 'Outgoing Requests')} ({outgoingRequests.length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {outgoingRequests.map((req) => {
              const rec = req.receiver;
              if (!rec) return null;

              return (
                <div
                  key={req.id}
                  onClick={() => onOpenHunterProfile(rec)}
                  className="flex items-center justify-between p-3 rounded-xl border border-white/10 bg-black/30 hover:border-white/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center font-orbitron font-bold text-cyan-300 text-xs shrink-0">
                      {rec.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-orbitron font-bold text-white text-xs truncate">
                        {rec.username}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400 truncate">
                        {rec.hunterTag}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-orbitron text-cyan-300/80 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/20 shrink-0">
                    {l('Pendente', 'Pending')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista Principal de Amigos */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-orbitron font-bold uppercase tracking-wider text-slate-400">
          <span>{l('Lista de Companheiros', 'Guild Companions')} ({friends.length})</span>
        </div>

        {friends.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {friends.map((friend) => (
              <HudCard
                key={friend.userId}
                variant="cyan"
                corners
                onClick={() => onOpenHunterProfile(friend)}
                className="p-4 border border-white/10 bg-black/40 hover:border-cyan-400/50 hover:bg-black/60 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-12 rounded-xl overflow-hidden border border-cyan-400/30 bg-black/60 shrink-0 group-hover:border-cyan-300 transition-colors">
                      <img
                        src={friend.avatarUrl || (friend.hunterClass ? classImageMap[friend.hunterClass] : classImageMap.Warrior)}
                        alt=""
                        className="size-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-orbitron font-bold text-white text-xs sm:text-sm truncate group-hover:text-cyan-300 transition-colors">
                        {friend.username}
                      </h4>
                      <p className="font-mono text-[10px] text-slate-400 truncate">
                        {friend.hunterTag}
                      </p>
                      <p className="font-orbitron text-[10px] text-amber-300 truncate mt-0.5">
                        <Crown className="size-2.5 inline mr-1" />
                        {friend.activeTitle}
                      </p>
                    </div>
                  </div>

                  <RankBadge rank={friend.rank} size="sm" />
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-orbitron text-slate-400">
                  <span>{l('Nível', 'Level')} {friend.level}</span>
                  <span className="flex items-center gap-1 text-amber-300 font-mono text-[11px]">
                    <Flame className="size-3" />
                    {friend.streakCurrent}d streak
                  </span>
                </div>
              </HudCard>
            ))}
          </div>
        ) : (
          /* Estado Vazio */
          <HudCard variant="cyan" corners className="p-8 text-center my-6 space-y-3">
            <Users className="size-8 text-cyan-400 mx-auto" />
            <h3 className="font-orbitron font-black text-white text-base">
              {l('Nenhum companheiro adicionado', 'No companions added yet')}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {l(
                'Adicione outros caçadores usando a Hunter Tag para compartilhar conquistas e disputar o ranking!',
                'Add other hunters using their Hunter Tag to share achievements and climb leaderboards together!'
              )}
            </p>
            <button
              type="button"
              onClick={onOpenAddFriend}
              className="mt-2 px-5 py-2.5 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-95 transition-all"
            >
              {l('Buscar Caçadores', 'Find Hunters')}
            </button>
          </HudCard>
        )}
      </div>
    </div>
  );
}

