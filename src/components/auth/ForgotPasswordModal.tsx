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
    } catch {
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[420px] sm:max-w-[440px] animate-in zoom-in-95 duration-200">
        <HudCard
          variant={success ? 'success' : 'cyan'}
          corners
          className="p-6 sm:p-7 relative border border-white/12 bg-[#12151D] shadow-[0_24px_64px_rgba(0,0,0,0.8)] rounded-2xl"
        >
          {/* Botão de Fechar */}
          <button
            type="button"
            onClick={onClose}
            aria-label={l('Fechar modal', 'Close modal')}
            className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#00F0FF]"
          >
            <X className="size-4" />
          </button>

          {/* Cabeçalho */}
          <div className="flex items-center gap-3.5 mb-5 pr-8">
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                success
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                  : 'border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]'
              }`}
            >
              {success ? <CheckCircle2 className="size-5" /> : <KeyRound className="size-5" />}
            </div>
            <div>
              <h2
                id="forgot-password-title"
                className="text-lg font-sans font-semibold text-white tracking-tight"
              >
                {success
                  ? l('Sinal Transmitido', 'Signal Transmitted')
                  : l('Recuperar acesso', 'Recover access')}
              </h2>
              <p className="text-xs font-sans text-slate-300 mt-0.5">
                {l('Redefinição segura de senha', 'Secure password reset')}
              </p>
            </div>
          </div>

          {/* Estado de Sucesso */}
          {success ? (
            <div className="space-y-4 pt-1">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                <p className="text-xs sm:text-sm font-sans font-normal leading-relaxed">
                  {l(
                    `Enviamos um link seguro de recuperação para ${email}. Verifique sua caixa de entrada e pasta de lixo eletrônico (spam).`,
                    `We sent a secure recovery link to ${email}. Please check your inbox and spam folder.`
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[48px] rounded-xl bg-[#00F0FF] text-[#080A10] font-sans font-semibold text-xs sm:text-sm hover:bg-[#38bdf8] active:scale-[0.985] transition-all"
              >
                {l('Concluir & Voltar ao Login', 'Done & Return to Login')}
              </button>
            </div>
          ) : (
            /* Formulário de Envio */
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                {l(
                  'Informe o e-mail cadastrado no ASCEND para receber o link de redefinição de senha.',
                  'Enter your registered ASCEND email to receive a password reset link.'
                )}
              </p>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3 flex items-start gap-2.5 text-xs text-red-100">
                  <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-sans">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="recovery-email"
                  className="block text-xs font-medium font-sans text-slate-200"
                >
                  {l('E-mail', 'Email')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail className="size-4" />
                  </div>
                  <input
                    id="recovery-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cacador@ascend.app"
                    className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-white/12 bg-[#141722] text-sm text-white font-sans placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/30 transition-all [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="order-2 sm:order-1 flex-1 min-h-[48px] rounded-xl border border-white/10 bg-white/5 text-slate-300 font-sans font-medium text-xs hover:bg-white/10 hover:text-white transition-colors"
                >
                  <ArrowLeft className="size-3.5 inline mr-1.5 -mt-0.5" />
                  {l('Voltar', 'Back')}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="order-1 sm:order-2 flex-[2] min-h-[48px] sm:min-h-[52px] rounded-xl bg-[#00F0FF] text-[#080A10] font-sans font-semibold text-xs sm:text-sm hover:bg-[#38bdf8] shadow-[0_4px_20px_rgba(0,240,255,0.2)] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{l('Enviando...', 'Sending...')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      <span>{l('Enviar Link', 'Send Link')}</span>
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
