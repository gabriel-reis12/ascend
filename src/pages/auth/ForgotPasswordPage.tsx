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
  ShieldCheck,
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
    <main className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-[#030408] text-white selection:bg-[#00F0FF]/25 p-5 sm:p-10">
      {/* Background Dimensional Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,240,255,0.12),transparent_55%),radial-gradient(circle_at_20%_80%,rgba(124,58,237,0.15),transparent_45%),linear-gradient(180deg,#030408_0%,#060812_50%,#030408_100%)]" />

      {/* Grid Subtil HUD */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />

      {/* Header Superior: Logo ASCEND + LanguageSwitcher */}
      <header className="relative z-10 flex items-center justify-between max-w-4xl w-full mx-auto pb-4">
        <div
          onClick={() => navigate('/login')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_24px_rgba(0,240,255,0.2)] group-hover:border-[#00F0FF] transition-colors">
            <Sparkles className="h-5 w-5 text-[#00F0FF]" />
            <div className="absolute inset-1 rounded-xl border border-violet-400/20 pointer-events-none" />
          </div>
          <div>
            <span className="block font-orbitron text-lg sm:text-xl font-black uppercase tracking-[0.22em] text-white leading-none">
              ASCEND
            </span>
            <span className="mt-1 block font-orbitron text-[9px] font-bold uppercase tracking-[0.24em] text-[#00F0FF]/80">
              THE GATE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
        </div>
      </header>

      {/* Card Central com Estética THE GATE */}
      <section className="relative z-10 w-full max-w-md mx-auto my-auto py-8">
        <HudCard
          variant={success ? 'cyan' : 'cyan'}
          corners
          radialGlow
          className="p-6 sm:p-8 border border-[#00F0FF]/30 bg-[#0A0D15]/90 shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_35px_rgba(0,240,255,0.12)] backdrop-blur-xl"
        >
          {/* Cabeçalho do Card */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${
                success
                  ? 'border-emerald-400/40 bg-emerald-500/15 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                  : 'border-[#00F0FF]/40 bg-[#00F0FF]/15 text-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.25)]'
              }`}
            >
              {success ? <CheckCircle2 className="size-6" /> : <KeyRound className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-orbitron font-bold uppercase tracking-widest text-[#00F0FF]">
                <ShieldCheck className="size-3" />
                <span>{l('Protocolo de Recuperação', 'Recovery Protocol')}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black font-orbitron text-white uppercase tracking-wider mt-0.5">
                {success
                  ? l('Sinal Transmitido', 'Signal Transmitted')
                  : l('Recuperar Acesso', 'Recover Access')}
              </h1>
            </div>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-200">
                <p className="text-sm font-sans font-medium leading-relaxed">
                  {l(
                    `Enviamos um link seguro de recuperação para ${email}. Verifique sua caixa de entrada e pasta de lixo eletrônico (spam).`,
                    `We sent a secure recovery link to ${email}. Please check your inbox and spam folder.`
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full min-h-[52px] rounded-xl border border-emerald-400/40 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-orbitron font-bold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:brightness-110 active:scale-[0.985] transition-all flex items-center justify-center gap-2"
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
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertTriangle className="size-4 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug font-sans">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="page-recovery-email"
                  className="block text-xs font-semibold font-sans uppercase tracking-wider text-slate-300"
                >
                  {l('E-mail', 'Email')}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-500 pointer-events-none">
                    <Mail className="size-4" />
                  </div>
                  <input
                    id="page-recovery-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cacador@ascend.system"
                    className="w-full h-[52px] pl-10 pr-4 rounded-xl border border-white/10 bg-[#0B0E17]/80 text-sm sm:text-base text-white font-sans placeholder:text-slate-600 focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/15 transition-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[52px] rounded-xl border border-[#00F0FF]/40 bg-gradient-to-r from-[#00F0FF] via-[#0284C7] to-[#7C3AED] text-white font-orbitron font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(0,240,255,0.25)] hover:brightness-110 active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
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
                  className="w-full min-h-[44px] rounded-xl border border-white/10 bg-white/5 text-slate-400 font-sans font-semibold text-xs uppercase tracking-wider hover:bg-white/10 hover:text-white transition-colors flex items-center justify-center gap-1.5"
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
      <footer className="relative z-10 text-center text-[10px] font-orbitron text-slate-600 uppercase tracking-widest max-w-4xl w-full mx-auto pt-4">
        ASCEND &bull; THE GATE &bull; 2026
      </footer>
    </main>
  );
}
