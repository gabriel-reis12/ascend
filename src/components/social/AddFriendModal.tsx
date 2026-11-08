import React, { useState } from 'react';
import {
  X,
  Search,
  UserPlus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocialStore } from '@/stores/useSocialStore';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';
import { RankBadge } from '@/components/ui/rank-badge';
import type { PublicHunterProfile } from '@/lib/socialScore';

interface AddFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHunterProfile?: (hunter: PublicHunterProfile) => void;
}

export function AddFriendModal({
  isOpen,
  onClose,
  onOpenHunterProfile,
}: AddFriendModalProps) {
  const { user } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const { searchHunter, sendFriendRequest } = useSocialStore();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<PublicHunterProfile | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; error?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setSearching(true);
    setStatusMessage(null);
    setHasSearched(false);

    try {
      const found = await searchHunter(clean);
      setResult(found);
      setHasSearched(true);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async () => {
    if (!user?.id || !result) return;
    setActionLoading(true);
    setStatusMessage(null);

    const res = await sendFriendRequest(result, user.id);
    setActionLoading(false);

    if (res.success) {
      setStatusMessage({ text: l('Solicitação de amizade enviada!', 'Friend request transmitted!') });
    } else {
      setStatusMessage({ text: res.error || l('Falha ao enviar.', 'Failed to send.'), error: true });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
        <HudCard
          variant="cyan"
          corners
          radialGlow
          className="relative p-6 border border-cyan-400/35 bg-[#0B0D17]/95 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(6,182,212,0.18)]"
        >
          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            aria-label={l('Fechar', 'Close')}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="size-4" />
          </button>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <UserPlus className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold uppercase tracking-widest text-cyan-400">
                <Sparkles className="size-3" />
                <span>{l('Conexão de Caçador', 'Hunter Link')}</span>
              </div>
              <h2 className="text-base sm:text-lg font-black font-orbitron text-white uppercase tracking-wider mt-0.5">
                {l('Adicionar Companheiro', 'Add Companion')}
              </h2>
            </div>
          </div>

          {/* Formulário de Busca */}
          <form onSubmit={handleSearch} className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              {l(
                'Digite a Hunter Tag única (ex: sung#9999) ou o codinome público do caçador.',
                'Enter the unique Hunter Tag (e.g. sung#9999) or public hunter codename.'
              )}
            </p>

            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: frost#4091"
                required
                className="w-full h-12 pl-10 pr-24 rounded-xl border border-white/10 bg-black/40 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
              />
              <Search className="absolute left-3.5 size-4 text-slate-500 pointer-events-none" />
              <button
                type="submit"
                disabled={searching || !query.trim()}
                className="absolute right-1.5 h-9 px-3 rounded-lg border border-cyan-400/30 bg-cyan-500/20 text-cyan-300 text-xs font-orbitron font-bold hover:bg-cyan-500/30 active:scale-95 transition-all disabled:opacity-40"
              >
                {searching ? <Loader2 className="size-3.5 animate-spin" /> : l('Buscar', 'Search')}
              </button>
            </div>
          </form>

          {/* Resultado da Busca */}
          {hasSearched && (
            <div className="mt-5 pt-4 border-t border-white/10">
              {result ? (
                <div className="rounded-xl border border-cyan-400/25 bg-black/40 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-xl bg-cyan-500/10 border border-cyan-400/30 overflow-hidden flex items-center justify-center font-orbitron font-black text-cyan-300 text-sm">
                        {result.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-orbitron font-bold text-white text-sm">
                          {result.username}
                        </h4>
                        <p className="font-mono text-xs text-cyan-300">
                          {result.hunterTag}
                        </p>
                      </div>
                    </div>
                    <RankBadge rank={result.rank} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 font-orbitron pt-1">
                    <span>
                      {l('Nível', 'Level')} {result.level} &bull; {result.hunterClass || 'Desperto'}
                    </span>
                    <span className="text-amber-300">{result.streakCurrent}d streak</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {onOpenHunterProfile && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenHunterProfile(result);
                          onClose();
                        }}
                        className="flex-1 h-10 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs font-orbitron font-semibold hover:bg-white/10 transition-colors flex items-center justify-center gap-1"
                      >
                        <span>{l('Ver Perfil', 'View Profile')}</span>
                        <ArrowRight className="size-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleSendRequest}
                      disabled={actionLoading}
                      className="flex-[1.5] h-10 rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <UserPlus className="size-3.5" />
                      )}
                      <span>{l('Enviar Convite', 'Send Invite')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 text-center space-y-1.5">
                  <AlertTriangle className="size-5 text-amber-400 mx-auto" />
                  <p className="text-xs font-orbitron font-bold text-slate-300">
                    {l('Nenhum caçador localizado', 'No hunter located')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {l('Verifique se a Hunter Tag ou o codinome estão digitados corretamente.', 'Make sure the Hunter Tag or codename is typed correctly.')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Feedback de Ação */}
          {statusMessage && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                statusMessage.error
                  ? 'border-red-500/40 bg-red-500/10 text-red-200'
                  : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {statusMessage.error ? (
                <AlertTriangle className="size-4 shrink-0" />
              ) : (
                <CheckCircle2 className="size-4 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </HudCard>
      </div>
    </div>
  );
}

