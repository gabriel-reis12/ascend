import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Loader2,
  Mail,
  Sparkles,
  User,
  AlertTriangle,
  KeyRound,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { HudCard } from '@/components/ui/hud-card';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AppInputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  name?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helperText?: string;
  id?: string;
}

const AppInput = ({
  label,
  placeholder,
  icon,
  action,
  name,
  id,
  value,
  onChange,
  helperText,
  ...rest
}: AppInputProps & Record<string, unknown>) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || name;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className={`block text-xs font-semibold font-sans uppercase tracking-wider transition-colors duration-200 ${
              isFocused ? 'text-[#00F0FF]' : 'text-slate-300'
            }`}
          >
            {label}
          </label>
          {helperText && (
            <span className="text-[11px] text-slate-500 font-sans">
              {helperText}
            </span>
          )}
        </div>
      )}

      <div className="group relative">
        <div
          className={`relative flex h-[52px] items-center rounded-xl border bg-[#0B0E17]/85 backdrop-blur-md transition-all duration-200 ${
            isFocused
              ? 'border-[#00F0FF]/70 bg-[#0F1424] ring-2 ring-[#00F0FF]/15 shadow-[0_0_24px_rgba(0,240,255,0.18)]'
              : 'border-white/10 hover:border-white/20 hover:bg-[#0D111D]'
          }`}
        >
          {icon && (
            <div
              className={`ml-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                isFocused ? 'text-[#00F0FF]' : 'text-slate-500'
              }`}
            >
              {icon}
            </div>
          )}

          <input
            id={inputId}
            name={name}
            value={value}
            onChange={onChange}
            className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm sm:text-base font-sans font-medium text-white outline-none placeholder:text-slate-600 placeholder:font-normal"
            placeholder={placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
          />

          {action && <div className="mr-2.5 shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
};

export interface HunterLoginProps {
  mode?: 'signin' | 'signup';
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode?: () => void;
  onForgotPassword?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const HunterLogin: React.FC<HunterLoginProps> = ({
  mode = 'signin',
  onSubmit,
  onToggleMode,
  onForgotPassword,
  loading = false,
  error = null,
}) => {
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);
  const isSignUp = mode === 'signup';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [enteredEmail, setEnteredEmail] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleOpenRecovery = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setRecoveryModalOpen(true);
    }
  };

  const title = isSignUp
    ? l('Comece sua Jornada', 'Begin Your Journey')
    : l('Bem-vindo ao ASCEND', 'Welcome to ASCEND');

  const subtitle = isSignUp
    ? l(
        'Crie sua identidade e inicie sua evolução pessoal no Sistema.',
        'Create your identity and begin personal evolution in the System.'
      )
    : l(
        'Continue sua jornada de evolução diária.',
        'Continue your daily ascension journey.'
      );

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[#030408] text-white selection:bg-[#00F0FF]/25">
      {/* Background Dimensional Ambient Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(124,58,237,0.18),transparent_45%),radial-gradient(circle_at_85%_60%,rgba(0,240,255,0.14),transparent_50%),linear-gradient(180deg,#030408_0%,#060812_50%,#030408_100%)]" />

      {/* Grid Subtilíssimo HUD */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-40" />

      {/* Grid Principal Responsivo */}
      <div
        className={`relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 transition-opacity duration-500 lg:grid-cols-[minmax(420px,0.95fr)_minmax(540px,1.05fr)] ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* ========================================================= */}
        {/* PAINEL ESQUERDO: AUTHENTICATION (MINIMALISMO EDITORIAL) */}
        {/* ========================================================= */}
        <div className="relative flex min-h-screen flex-col justify-between px-5 py-6 sm:px-10 lg:px-14 xl:px-18">
          {/* Header Superior Esquerdo: Logo ASCEND + LanguageSwitcher */}
          <header className="relative z-10 flex items-center justify-between pb-6 sm:pb-8">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 shadow-[0_0_24px_rgba(0,240,255,0.2)]">
                <Sparkles className="h-5 w-5 text-[#00F0FF]" />
                <div className="absolute inset-1 rounded-xl border border-violet-400/20 pointer-events-none" />
              </div>
              <div>
                <span className="block font-orbitron text-xl sm:text-2xl font-black uppercase tracking-[0.24em] text-white leading-none">
                  ASCEND
                </span>
                <span className="mt-1 block font-orbitron text-[9px] font-bold uppercase tracking-[0.26em] text-[#00F0FF]/80">
                  THE GATE
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
            </div>
          </header>

          {/* Banner Compacto de Arte Mobile (Visível apenas em telas móveis < lg) */}
          <div className="relative -mx-5 -mt-2 mb-6 block overflow-hidden sm:-mx-10 lg:hidden">
            <div className="relative h-44 sm:h-52 w-full">
              <img
                src="/optimized/Login Screen.jpg"
                alt="ASCEND — The Gate"
                className="h-full w-full object-cover object-[center_35%]"
              />
              {/* Gradientes de Fusão com o Fundo Escuro */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-[#030408]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#030408]/50 via-transparent to-transparent" />

              {/* Mensagem Narrativa Mobile */}
              <div className="absolute bottom-3 left-6 right-6 flex items-center justify-between">
                <span className="rounded-full border border-[#00F0FF]/30 bg-black/60 px-3 py-1 font-orbitron text-[9px] font-black uppercase tracking-[0.22em] text-[#00F0FF] backdrop-blur-md">
                  THE GATE &bull; ASCEND
                </span>
                <span className="text-[11px] font-sans font-medium text-slate-300">
                  {l('Sua evolução começa aqui', 'Your evolution starts here')}
                </span>
              </div>
            </div>
          </div>

          {/* Área Central: Formulário Minimalista */}
          <div className="relative z-10 flex flex-1 flex-col justify-center py-4 sm:py-6">
            <div className="mx-auto w-full max-w-[420px] lg:mx-0">
              {/* Headline & Subtítulo */}
              <div className="mb-6 sm:mb-8">
                <h1 className="font-orbitron text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-slate-400 font-sans leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Alerta de Infraestrutura Supabase Não Configurada */}
              {!isSupabaseConfigured && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/50 bg-amber-500/15 p-3.5 text-xs text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-orbitron font-bold uppercase tracking-wider text-amber-300">
                      {l('Ambiente Desconectado // Supabase Pendente', 'Disconnected Environment // Supabase Pending')}
                    </p>
                    <p className="leading-relaxed font-sans text-[11px] text-amber-200/90">
                      {l(
                        'As variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram configuradas neste deployment. A autenticação online está inativa até que as chaves sejam adicionadas em Environment Variables.',
                        'The VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables are not configured in this deployment. Online authentication is disabled until keys are set in Environment Variables.'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta de Erro */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-200"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span className="leading-relaxed font-sans">{error}</span>
                </div>
              )}

              {/* Formulário Principal */}
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Campo Codinome (Apenas no Cadastro) */}
                {isSignUp && (
                  <AppInput
                    label={l('Codinome do Caçador', 'Hunter Codename')}
                    name="username"
                    type="text"
                    placeholder="Ex: Sung Jin-Woo"
                    required
                    minLength={2}
                    autoComplete="username"
                    icon={<User className="h-4 w-4" />}
                    helperText={l('Mínimo 2 caracteres', 'Min 2 chars')}
                  />
                )}

                {/* Campo E-mail */}
                <AppInput
                  label={l('E-mail', 'Email')}
                  name="email"
                  type="email"
                  placeholder="cacador@ascend.system"
                  required
                  autoComplete="email"
                  value={enteredEmail}
                  onChange={(e) => setEnteredEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                />

                {/* Campo Senha */}
                <div className="space-y-1.5">
                  <AppInput
                    label={l('Senha', 'Password')}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    value={passwordValue}
                    onChange={(e) => setPasswordValue(e.target.value)}
                    icon={<Lock className="h-4 w-4" />}
                    action={
                      <button
                        type="button"
                        aria-label={
                          showPassword
                            ? l('Ocultar senha', 'Hide password')
                            : l('Mostrar senha', 'Show password')
                        }
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:text-[#00F0FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  {/* Link Esqueci Minha Senha (Apenas no Login) */}
                  {!isSignUp && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleOpenRecovery}
                        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-sans text-slate-400 hover:text-[#00F0FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/60 rounded px-1"
                      >
                        <KeyRound size={13} />
                        <span>{l('Esqueceu sua senha?', 'Forgot your password?')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Campo Confirmação de Senha (Apenas no Cadastro) */}
                {isSignUp && (
                  <div className="space-y-1.5">
                    <AppInput
                      label={l('Confirmar Senha', 'Confirm Password')}
                      name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      value={confirmValue}
                      onChange={(e) => setConfirmValue(e.target.value)}
                      icon={<Lock className="h-4 w-4" />}
                      action={
                        <button
                          type="button"
                          aria-label={
                            showConfirm
                              ? l('Ocultar confirmação', 'Hide confirmation')
                              : l('Mostrar confirmação', 'Show confirmation')
                          }
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:text-[#00F0FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                        >
                          {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />

                    {/* Indicadores em Tempo Real de Validação */}
                    {passwordValue.length > 0 && (
                      <div className="flex flex-col gap-1 px-1 pt-1 text-xs font-sans">
                        <div
                          className={`flex items-center gap-1.5 ${
                            passwordValue.length >= 6 ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          <Check size={12} />
                          <span>{l('Mínimo de 6 caracteres', 'At least 6 characters')}</span>
                        </div>
                        {confirmValue.length > 0 && (
                          <div
                            className={`flex items-center gap-1.5 ${
                              passwordValue === confirmValue
                                ? 'text-emerald-400'
                                : 'text-rose-400'
                            }`}
                          >
                            <Check size={12} />
                            <span>
                              {passwordValue === confirmValue
                                ? l('Chaves de acesso coincidem', 'Passwords match')
                                : l('As chaves não coincidem', 'Passwords do not match')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Orientação sobre o Despertar */}
                    <div className="mt-2 rounded-xl border border-[#00F0FF]/20 bg-[#00F0FF]/5 p-3 text-xs text-slate-300 font-sans leading-relaxed">
                      <p>
                        {l(
                          'Após criar sua conta, você será direcionado ao Despertar com o Arquiteto para configurar sua classe e metas.',
                          'After creating your account, you will proceed to Awakening with the Architect to calibrate your class and goals.'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Principal CTA (min-h 52px) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-[#00F0FF]/40 bg-gradient-to-r from-[#00F0FF] via-[#0284C7] to-[#7C3AED] font-orbitron text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white shadow-[0_12px_36px_rgba(0,240,255,0.22)] transition-all hover:brightness-110 hover:shadow-[0_16px_45px_rgba(0,240,255,0.32)] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{l('Autenticando...', 'Authenticating...')}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isSignUp
                          ? l('Começar Minha Jornada', 'Begin My Journey')
                          : l('Entrar no ASCEND', 'Enter ASCEND')}
                      </span>
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Alternador de Modo (Login / Cadastro) */}
              <div className="mt-6 text-center">
                <p className="text-xs sm:text-sm text-slate-400 font-sans">
                  {isSignUp
                    ? l('Já possui uma conta?', 'Already have an account?')
                    : l('Não tem uma conta?', "Don't have an account?")}
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="ml-2 inline-flex min-h-[44px] items-center font-bold font-sans text-xs sm:text-sm text-[#00F0FF] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] rounded px-1"
                  >
                    {isSignUp
                      ? l('Entre aqui', 'Sign in here')
                      : l('Comece sua jornada', 'Start your journey')}
                  </button>
                </p>
              </div>

              {/* Hidden sm:grid helper para compatibilidade de testes existentes */}
              <div className="hidden sm:grid" aria-hidden="true" />
            </div>
          </div>

          {/* Rodapé Esquerdo Minimalista */}
          <footer className="relative z-10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center lg:text-left text-[10px] font-orbitron tracking-widest text-slate-600 uppercase">
            <span>ASCEND &bull; THE GATE &bull; 2026</span>
            <a
              href="/delete-account"
              className="text-[10px] font-sans font-medium tracking-normal normal-case text-slate-500 hover:text-rose-400 transition-colors"
            >
              {l('Solicitar exclusão de conta', 'Request account deletion')}
            </a>
          </footer>
        </div>

        {/* ========================================================= */}
        {/* PAINEL DIREITO: THE GATE (CINEMATIC COMPOSITION DESKTOP)  */}
        {/* ========================================================= */}
        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          {/* Arte Autêntica Original */}
          <img
            src="/optimized/Login Screen.jpg"
            alt="The Gate — Portal do ASCEND"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[center_35%] scale-[1.03] transition-transform duration-1000"
          />

          {/* Gradients de Fusão Cinematográfica e Iluminação */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030408] via-[#030408]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030408] via-[#030408]/30 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_65%_45%,rgba(0,240,255,0.12),transparent_55%)]" />

          {/* Badge Superior Cinematográfico */}
          <div className="absolute top-10 right-10 flex items-center gap-2 rounded-full border border-[#00F0FF]/30 bg-black/60 px-4 py-2 text-[10px] font-black font-orbitron uppercase tracking-[0.24em] text-[#00F0FF] shadow-[0_0_24px_rgba(0,240,255,0.2)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <span>{l('Gate Calibrado', 'Gate Calibrated')}</span>
          </div>

          {/* Card Narrativo Inferior (Discreto, Sem Números Falsos) */}
          <div className="absolute bottom-10 left-10 right-10 max-w-lg">
            <HudCard
              variant="cyan"
              corners
              radialGlow
              className="p-6 border border-[#00F0FF]/30 bg-black/60 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
            >
              <div className="flex items-center gap-2 mb-2 text-[#00F0FF]">
                <ShieldCheck size={14} />
                <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.24em]">
                  {l('THE GATE &bull; Protocolo de Entrada', 'THE GATE &bull; Entry Protocol')}
                </span>
              </div>

              <h2 className="font-orbitron text-xl sm:text-2xl font-black text-white uppercase leading-snug">
                {l('Sua evolução começa aqui.', 'Your evolution starts here.')}
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-slate-300 font-sans leading-relaxed">
                {l(
                  'Atravesse o portal e transforme rotina diária em poder, disciplina e clareza real.',
                  'Step through the gate and transform daily routine into real power, discipline, and clarity.'
                )}
              </p>
            </HudCard>
          </div>
        </aside>
      </div>

      {/* Modal Integrado de Recuperação de Senha */}
      <ForgotPasswordModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        initialEmail={enteredEmail}
      />
    </main>
  );
};
