import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Send,
  KeyRound,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/preferences';
import { HudCard } from '@/components/ui/hud-card';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
}: ForgotPasswordModalProps) {
  const { resetPasswordForEmail } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setError(null);
      setSuccess(false);
      setLoading(false);
    }
  }, [isOpen, initialEmail]);

  // Fecha com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError(l('Informe um endereço de e-mail válido.', 'Please provide a valid email address.'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetErr } = await resetPasswordForEmail(cleanEmail);

      if (resetErr) {
        const errLower = resetErr.toLowerCase();
        if (errLower.includes('too many') || errLower.includes('rate limit')) {
          setError(
            l(
              'Muitas tentativas em curto período. Aguarde alguns minutos antes de solicitar novamente.',
              'Too many attempts in a short period. Please wait a few minutes before trying again.'
            )
          );
        } else {
          setError(resetErr);
        }
        setLoading(false);
      } else {
        setSuccess(true);
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(
        l(
          'Falha de comunicação com o Sistema. Verifique sua conexão e tente novamente.',
          'System communication failure. Please check your connection and try again.'
        )
      );
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md animate-in zoom-in-95 duration-200">
        <HudCard
          variant={success ? 'success' : 'cyan'}
          corners
          radialGlow
          className="p-5 sm:p-6 relative border border-cyan-400/30 bg-[#0A0D14]/95 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(6,182,212,0.15)]"
        >
          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            aria-label={l('Fechar modal', 'Close modal')}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            <X className="size-4" />
          </button>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                success
                  ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'border-cyan-400/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
              }`}
            >
              {success ? <CheckCircle2 className="size-5" /> : <KeyRound className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold uppercase tracking-widest text-cyan-400">
                <Sparkles className="size-3" />
                <span>{l('Protocolo de Segurança', 'Security Protocol')}</span>
              </div>
              <h2
                id="forgot-password-title"
                className="text-base sm:text-lg font-black font-orbitron text-white uppercase tracking-wider mt-0.5"
              >
                {success
                  ? l('Sinal Transmitido', 'Signal Transmitted')
                  : l('Recuperar Chave de Acesso', 'Recover Access Key')}
              </h2>
            </div>
          </div>

          {/* Estado de Sucesso */}
          {success ? (
            <div className="space-y-4 pt-1">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  {l(
                    `Enviamos um sinal seguro com o link de redefinição para ${email}. Verifique sua caixa de entrada e pasta de lixo eletrônico (spam).`,
                    `We sent a secure reset link to ${email}. Please check your inbox and spam folder.`
                  )}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>{l('Aguardando redefinição pelo caçador...', 'Awaiting hunter reset...')}</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-[0.985] transition-all"
              >
                {l('Concluir & Voltar ao Login', 'Done & Return to Login')}
              </button>
            </div>
          ) : (
            /* Formulário de Envio */
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <p className="text-xs text-slate-300 leading-relaxed">
                {l(
                  'Informe a identidade (e-mail) associada ao seu registro de caçador para restabelecer seu acesso ao Sistema.',
                  'Enter the identity (email) associated with your hunter record to re-establish access to the System.'
                )}
              </p>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="recovery-email"
                  className="block text-[10px] font-bold font-orbitron uppercase tracking-widest text-slate-400"
                >
                  {l('Identidade (E-mail)', 'Identity (Email)')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                    <Mail className="size-4" />
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cacador@ascend.system"
                    className="w-full h-[48px] sm:h-[52px] pl-10 pr-4 rounded-xl border border-white/10 bg-black/40 text-sm text-white font-sans placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="order-2 sm:order-1 flex-1 min-h-[48px] rounded-xl border border-white/10 bg-white/5 text-slate-400 font-orbitron font-semibold text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ArrowLeft className="size-3.5 inline mr-1.5 -mt-0.5" />
                  {l('Voltar', 'Back')}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="order-1 sm:order-2 flex-[2] min-h-[48px] sm:min-h-[52px] rounded-xl border border-cyan-400/40 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:brightness-110 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{l('Transmitindo...', 'Transmitting...')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>{l('Transmitir Sinal', 'Send Signal')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </HudCard>
      </div>
    </div>
  );
}

