import React from 'react';
import {
  X,
  Shield,
  Trophy,
  Flame,
  UserPlus,
  UserCheck,
  UserX,
  Ban,
  Sparkles,
  Copy,
  Check,
  Crown,
  Award,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialStore } from '@/stores/useSocialStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { RankBadge } from '@/components/ui/rank-badge';
import type { PublicHunterProfile } from '@/lib/socialScore';

interface HunterPublicProfileModalProps {
  hunter: PublicHunterProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function HunterPublicProfileModal({
  hunter,
  isOpen,
  onClose,
}: HunterPublicProfileModalProps) {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const {
    friends,
    outgoingRequests,
    sendFriendRequest,
    removeFriend,
    blockUser,
  } = useSocialStore();

  const [copied, setCopied] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState(false);
  const [feedbackMsg, setFeedbackMsg] = React.useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen || !hunter) return null;

  const isSelf = user?.id === hunter.userId;
  const isFriend = friends.some((f) => f.userId === hunter.userId);
  const isPending = outgoingRequests.some((r) => r.receiver?.userId === hunter.userId);

  const handleCopyTag = () => {
    navigator.clipboard.writeText(hunter.hunterTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendRequest = async () => {
    if (!user?.id) return;
    setActionLoading(true);
    setFeedbackMsg(null);
    const res = await sendFriendRequest(hunter, user.id);
    setActionLoading(false);
    if (res.success) {
      setFeedbackMsg({ text: l('Solicitação enviada com sucesso!', 'Friend request sent successfully!') });
    } else {
      setFeedbackMsg({ text: res.error || l('Falha ao enviar solicitação.', 'Failed to send request.'), error: true });
    }
  };

  const handleRemoveFriend = async () => {
    if (!user?.id) return;
    if (window.confirm(l(`Deseja remover ${hunter.username} dos seus amigos?`, `Remove ${hunter.username} from friends?`))) {
      setActionLoading(true);
      await removeFriend(hunter.userId, user.id);
      setActionLoading(false);
      onClose();
    }
  };

  const handleBlockUser = async () => {
    if (!user?.id) return;
    if (window.confirm(l(`Bloquear ${hunter.username}? Vocês não poderão interagir no Sistema.`, `Block ${hunter.username}? You won't be able to interact in the System.`))) {
      setActionLoading(true);
      await blockUser(hunter, user.id);
      setActionLoading(false);
      onClose();
    }
  };

  const classImageMap: Record<string, string> = {
    Warrior: '/optimized/Classes/Warrior/Rank E.jpg',
    Scholar: '/optimized/Classes/Scholar/Rank E.jpg',
    Creator: '/optimized/Classes/Creator/Rank E.jpg',
    Monk: '/optimized/Classes/Monk/Rank E.jpg',
    Leader: '/optimized/Classes/Leader/Rank E.jpg',
  };

  const avatarSrc = hunter.avatarUrl || (hunter.hunterClass ? classImageMap[hunter.hunterClass] : '/optimized/Classes/Warrior/Rank E.jpg');

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg animate-in zoom-in-95 duration-200">
        <HudCard
          variant="cyan"
          corners
          radialGlow
          className="relative p-6 sm:p-7 border border-cyan-400/35 bg-[#0B0D17]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.18)]"
        >
          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            aria-label={l('Fechar perfil', 'Close profile')}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <X className="size-4" />
          </button>

          {/* Cabeçalho do Perfil Social */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 pb-5 border-b border-white/10">
            {/* Avatar da Classe */}
            <div className="relative group shrink-0">
              <div className="size-20 sm:size-24 rounded-2xl overflow-hidden border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.3)] bg-black/60">
                <img
                  src={avatarSrc}
                  alt={hunter.username}
                  className="size-full object-cover object-top"
                />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <RankBadge rank={hunter.rank} size="sm" />
              </div>
            </div>

            {/* Informações Principais */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-lg sm:text-xl font-black font-orbitron text-white uppercase tracking-wider">
                  {hunter.username}
                </h2>
                {isFriend && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold font-orbitron text-emerald-300">
                    <UserCheck className="size-2.5" />
                    {l('Amigo', 'Friend')}
                  </span>
                )}
              </div>

              {/* Hunter Tag & Botão de Copiar */}
              <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-xs font-semibold text-cyan-300 bg-cyan-500/10 border border-cyan-400/20 px-2 py-0.5 rounded-lg">
                  {hunter.hunterTag}
                </span>
                <button
                  type="button"
                  onClick={handleCopyTag}
                  aria-label={l('Copiar Tag', 'Copy Tag')}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                </button>
              </div>

              {/* Título Equipado & Classe */}
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs">
                <span className="font-orbitron font-bold text-amber-300 bg-amber-500/10 border border-amber-400/20 px-2 py-0.5 rounded">
                  <Crown className="size-3 inline mr-1 -mt-0.5" />
                  {hunter.activeTitle}
                </span>
                <span className="font-orbitron text-[11px] text-slate-300">
                  {l('Nível', 'Level')} {hunter.level} &bull; {hunter.hunterClass || l('Desperto', 'Awakened')}
                </span>
              </div>
            </div>
          </div>

          {/* Bio do Caçador */}
          {hunter.bio && (
            <div className="my-4 rounded-xl border border-white/5 bg-black/40 p-3 text-xs text-slate-300 italic font-sans leading-relaxed">
              "{hunter.bio}"
            </div>
          )}

          {/* Estatísticas Autorizadas */}
          <div className="my-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[10px] font-bold font-orbitron uppercase">
                <Flame className="size-3" />
                <span>Streak</span>
              </div>
              <p className="font-orbitron text-base font-black text-white mt-1">
                {hunter.streakCurrent}d
              </p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                {l('Dias Consecutivos', 'Consecutive Days')}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-cyan-400 text-[10px] font-bold font-orbitron uppercase">
                <Shield className="size-3" />
                <span>Rank</span>
              </div>
              <p className="font-orbitron text-base font-black text-white mt-1">
                {hunter.rank}
              </p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                {l('Patente Oficial', 'Official Grade')}
              </p>
            </div>

            <div className="col-span-2 sm:col-span-1 rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
              <div className="flex items-center justify-center gap-1.5 text-purple-400 text-[10px] font-bold font-orbitron uppercase">
                <Trophy className="size-3" />
                <span>{l('Honra', 'Honor')}</span>
              </div>
              <p className="font-orbitron text-base font-black text-white mt-1">
                {hunter.featuredAchievements.length}
              </p>
              <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                {l('Troféus em Vitrine', 'Showcased')}
              </p>
            </div>
          </div>

          {/* Troféus em Destaque */}
          {hunter.featuredAchievements.length > 0 && (
            <div className="my-4 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold uppercase tracking-wider text-slate-400">
                <Award className="size-3.5 text-amber-400" />
                <span>{l('Conquistas em Destaque', 'Showcased Achievements')}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {hunter.featuredAchievements.map((trophy, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-500/5 p-2"
                  >
                    <Trophy className="size-4 text-amber-400 shrink-0" />
                    <span className="text-[11px] font-orbitron font-semibold text-amber-200 truncate">
                      {trophy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensagem de Feedback */}
          {feedbackMsg && (
            <div
              className={`mb-3 p-3 rounded-xl text-xs font-medium border ${
                feedbackMsg.error
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {feedbackMsg.text}
            </div>
          )}

          {/* Ações Táticas */}
          {!isSelf && (
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                {isFriend ? (
                  <button
                    type="button"
                    onClick={handleRemoveFriend}
                    disabled={actionLoading}
                    className="h-10 px-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 text-xs font-orbitron font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <UserX className="size-3.5" />
                    <span>{l('Desfazer Amizade', 'Unfriend')}</span>
                  </button>
                ) : isPending ? (
                  <div className="h-10 px-4 rounded-xl border border-white/10 bg-white/5 text-slate-400 text-xs font-orbitron font-semibold flex items-center gap-1.5 cursor-default">
                    <UserCheck className="size-3.5 text-cyan-400" />
                    <span>{l('Solicitação Pendente', 'Request Pending')}</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendRequest}
                    disabled={actionLoading || !hunter.allowFriendRequests}
                    className="h-10 px-4 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:brightness-110 active:scale-[0.985] text-xs font-orbitron font-bold transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="size-3.5" />
                    <span>
                      {hunter.allowFriendRequests
                        ? l('Adicionar Amigo', 'Add Friend')
                        : l('Solicitações Desativadas', 'Requests Disabled')}
                    </span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleBlockUser}
                disabled={actionLoading}
                className="h-10 px-3 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 text-xs font-orbitron transition-colors flex items-center gap-1"
                title={l('Bloquear Caçador', 'Block Hunter')}
              >
                <Ban className="size-3.5" />
                <span>{l('Bloquear', 'Block')}</span>
              </button>
            </div>
          )}
        </HudCard>
      </div>
    </div>
  );
}

