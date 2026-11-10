import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
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
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { HudCard } from '@/components/ui/hud-card';

export function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
    <main className="relative min-h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-[#080A10] text-[#F8FAFC] selection:bg-[#00F0FF]/25 p-5 sm:p-8">
      {/* Luz ambiente sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_25%,rgba(0,240,255,0.06),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(124,58,237,0.08),transparent_50%)]" />

      {/* Header Superior: Alinhado Perfeitamente à Coluna (420px–440px) */}
      <header className="relative z-10 flex items-center justify-between max-w-[420px] sm:max-w-[440px] w-full mx-auto pb-4">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] rounded-lg p-1"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.15)] group-hover:border-[#00F0FF] transition-colors">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-orbitron text-lg font-black uppercase tracking-[0.2em] text-white">
            ASCEND
          </span>
        </button>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* Card Central com Estética Minimal Dark */}
      <section className="relative z-10 w-full max-w-[420px] sm:max-w-[440px] mx-auto my-auto py-4 sm:py-6">
        <HudCard
          variant="cyan"
          corners
          className="p-6 sm:p-8 border border-white/12 bg-[#12151D] shadow-[0_24px_64px_rgba(0,0,0,0.7)] backdrop-blur-md rounded-2xl"
        >
          {/* Cabeçalho do Card */}
          <div className="flex items-center gap-3.5 mb-6">
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
              <h1 className="text-xl font-sans font-semibold text-white tracking-tight">
                {success
                  ? l('Sinal Transmitido', 'Signal Transmitted')
                  : l('Recuperar acesso', 'Recover access')}
              </h1>
              <p className="text-xs font-sans text-slate-300 mt-0.5">
                {l('Instruções enviadas com segurança', 'Secure recovery instructions')}
              </p>
            </div>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                <p className="text-sm font-sans font-normal leading-relaxed">
                  {l(
                    `Enviamos um link seguro de recuperação para ${email}. Verifique sua caixa de entrada e pasta de lixo eletrônico (spam).`,
                    `We sent a secure recovery link to ${email}. Please check your inbox and spam folder.`
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full min-h-[52px] rounded-xl bg-[#00F0FF] text-[#080A10] font-sans font-semibold text-sm hover:bg-[#38bdf8] active:scale-[0.985] transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="size-4" />
                <span>{l('Retornar ao Login', 'Return to Login')}</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                {l(
                  'Informe o e-mail cadastrado no ASCEND para receber o link de redefinição de senha.',
                  'Enter your registered ASCEND email to receive a password reset link.'
                )}
              </p>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/15 p-3.5 flex items-start gap-2.5 text-xs text-red-100">
                  <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-sans">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="page-recovery-email"
                  className="block text-xs font-medium font-sans text-slate-200"
                >
                  {l('E-mail', 'Email')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Mail className="size-4" />
                  </div>
                  <input
                    id="page-recovery-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cacador@ascend.app"
                    className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-white/12 bg-[#141722] text-sm sm:text-base text-white font-sans placeholder:text-slate-500 focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF]/30 transition-all [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[52px] rounded-xl bg-[#00F0FF] text-[#080A10] font-sans font-semibold text-sm hover:bg-[#38bdf8] shadow-[0_4px_20px_rgba(0,240,255,0.25)] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>{l('Enviando...', 'Sending...')}</span>
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      <span>{l('Enviar Link de Recuperação', 'Send Recovery Link')}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 text-slate-300 font-sans font-medium text-xs hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>{l('Voltar ao Login', 'Back to Login')}</span>
                </button>
              </div>
            </form>
          )}
        </HudCard>
      </section>

      {/* Footer Minimalista */}
      <footer className="relative z-10 text-center text-xs font-sans text-slate-400 max-w-[420px] sm:max-w-[440px] w-full mx-auto pt-4 pb-2">
        ASCEND &copy; 2026
      </footer>
    </main>
  );
}
