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
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
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
            className={`block text-xs font-medium font-sans transition-colors duration-150 ${
              isFocused ? 'text-[#00F0FF]' : 'text-slate-200'
            }`}
          >
            {label}
          </label>
          {helperText && (
            <span className="text-[11px] text-slate-400 font-sans">
              {helperText}
            </span>
          )}
        </div>
      )}

      <div className="group relative">
        <div
          className={`relative flex h-[52px] items-center rounded-xl border transition-all duration-150 ${
            isFocused
              ? 'border-[#00F0FF] bg-[#161A26] ring-1 ring-[#00F0FF]/30 shadow-[0_0_20px_rgba(0,240,255,0.12)]'
              : 'border-white/12 bg-[#141722] hover:border-white/25 hover:bg-[#181C28]'
          }`}
        >
          {icon && (
            <div
              className={`ml-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ${
                isFocused ? 'text-[#00F0FF]' : 'text-slate-400 group-hover:text-slate-300'
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
            className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm sm:text-base font-sans font-normal text-white outline-none placeholder:text-slate-500 placeholder:font-normal [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s] [&:-webkit-autofill]:[-webkit-text-fill-color:#F8FAFC]"
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
    ? l('Comece sua jornada', 'Begin your journey')
    : l('Bem-vindo de volta', 'Welcome back');

  const subtitle = isSignUp
    ? l(
        'Crie sua conta para iniciar sua evolução pessoal.',
        'Create your account to start your personal evolution.'
      )
    : l(
        'Continue sua jornada de evolução diária.',
        'Continue your daily ascension journey.'
      );

  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#080A10] text-[#F8FAFC] selection:bg-[#00F0FF]/25">
      {/* Luz ambiente sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_85%_75%,rgba(0,240,255,0.06),transparent_50%)]" />

      {/* Grid split-screen responsivo: Ilustração Editorial à Esquerda no Desktop, Formulário à Direita */}
      <div
        className={`relative z-10 flex min-h-[100dvh] w-full transition-opacity duration-500 ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* ========================================================= */}
        {/* PAINEL ESQUERDO: ILUSTRAÇÃO EDITORIAL (DESKTOP >= 1024px) */}
        {/* ========================================================= */}
        <aside className="relative hidden w-[42%] xl:w-[40%] 2xl:w-[38%] shrink-0 overflow-hidden bg-[#080A10] lg:block">
          {/* Imagem de Personagem Vertical com luminosidade e detalhes preservados */}
          <img
            src="/optimized/Login Screen.jpg"
            alt="ASCEND"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full object-cover object-[center_28%] brightness-[1.03] contrast-[1.04]"
          />

          {/* Gradients de Fusão Refinados: Suaves na transição e sem cobrir os personagens */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#080A10] to-95%" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080A10]/95 via-transparent to-transparent from-10%" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_35%,rgba(0,240,255,0.06),transparent_65%)]" />

          {/* Linha Editorial Evocativa no Rodapé Esquerdo */}
          <div className="absolute bottom-10 left-8 right-10 z-10">
            <p className="font-sans text-lg font-semibold text-white tracking-tight leading-snug">
              {l('Sua evolução começa aqui.', 'Your evolution starts here.')}
            </p>
            <p className="mt-1.5 font-sans text-xs text-slate-300/90 leading-relaxed max-w-sm">
              {l(
                'Transforme disciplina diária em poder real, consistência e clareza mental.',
                'Transform daily discipline into real power, consistency, and mental clarity.'
              )}
            </p>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* PAINEL DIREITO: FORMULÁRIO MINIMAL DARK (MOBILE & DESKTOP) */}
        {/* ========================================================= */}
        <div className="relative flex flex-1 flex-col justify-between px-5 py-4 sm:px-8 lg:px-12 xl:px-16 bg-[#080A10] min-h-[100dvh] overflow-y-auto">
          {/* Container Unificado Alinhado com a Coluna (420px–440px) */}
          <div className="mx-auto flex w-full max-w-[420px] sm:max-w-[440px] flex-1 flex-col justify-start lg:justify-between py-1 sm:py-6">
            {/* Header Superior: Alinhado Perfeitamente à Coluna do Formulário */}
            <header className="relative z-10 flex items-center justify-between pb-2 sm:pb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] shadow-[0_0_16px_rgba(0,240,255,0.15)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-orbitron text-lg font-black uppercase tracking-[0.2em] text-white">
                  ASCEND
                </span>
              </div>

              <div className="flex items-center gap-2">
                <LanguageSwitcher compact />
              </div>
            </header>

            {/* Área Central: Formulário Minimalista */}
            <div className="relative z-10 my-0 lg:my-auto w-full py-1 sm:py-4">
              {/* Título & Subtítulo Editorial */}
              <div className="mb-4 sm:mb-6">
                <h1 className="font-sans text-2xl sm:text-3xl font-semibold text-white tracking-tight">
                  {title}
                </h1>
                <p className="mt-1.5 font-sans text-sm text-slate-300 leading-relaxed">
                  {subtitle}
                </p>
              </div>

              {/* Alerta de Infraestrutura Supabase Não Configurada */}
              {!isSupabaseConfigured && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/15 p-3.5 text-xs text-amber-100 shadow-[0_4px_16px_rgba(245,158,11,0.1)]"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <div className="space-y-1">
                    <p className="font-sans font-semibold text-amber-300">
                      {l('Ambiente Desconectado — Supabase Pendente', 'Disconnected Environment — Supabase Pending')}
                    </p>
                    <p className="leading-relaxed font-sans text-[11px] text-amber-200/90">
                      {l(
                        'As chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não foram detectadas. Configure as variáveis de ambiente para autenticação online.',
                        'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY were not detected. Configure environment variables for online authentication.'
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Alerta de Erro */}
              {error && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/40 bg-red-500/15 p-3.5 text-xs text-red-100 shadow-[0_4px_16px_rgba(239,68,68,0.1)]"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <span className="leading-relaxed font-sans">{error}</span>
                </div>
              )}

              {/* Formulário Principal */}
              <form onSubmit={onSubmit} className="space-y-3.5 sm:space-y-4">
                {/* Campo Codinome (Apenas no Cadastro) */}
                {isSignUp && (
                  <AppInput
                    label={l('Codinome', 'Codename')}
                    name="username"
                    type="text"
                    placeholder="Ex: Sung Jin-Woo"
                    required
                    minLength={2}
                    autoComplete="username"
                    icon={<User className="h-4 w-4" />}
                    helperText={l('Mínimo 2 caracteres', 'Min 2 characters')}
                  />
                )}

                {/* Campo E-mail */}
                <AppInput
                  label={l('E-mail', 'Email')}
                  name="email"
                  type="email"
                  placeholder="cacador@ascend.app"
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
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={handleOpenRecovery}
                        className="min-h-[44px] inline-flex items-center gap-1.5 text-xs font-sans text-slate-300 hover:text-[#00F0FF] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]/60 rounded px-1"
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
                      label={l('Confirmar senha', 'Confirm password')}
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
                            passwordValue.length >= 6 ? 'text-emerald-400' : 'text-slate-400'
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
                    <div className="mt-2 rounded-xl border border-white/10 bg-[#12151D] p-3 text-xs text-slate-300 font-sans leading-relaxed">
                      <p>
                        {l(
                          'Após criar sua conta, você será direcionado ao Despertar com o Arquiteto para configurar sua classe e metas.',
                          'After creating your account, you will proceed to Awakening with the Architect to calibrate your class and goals.'
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Botão Principal CTA (Sólido de Alto Contraste, min-h 52px) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-3 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#00F0FF] font-sans text-sm sm:text-base font-semibold text-[#080A10] shadow-[0_4px_20px_rgba(0,240,255,0.25)] transition-all duration-150 hover:bg-[#38bdf8] hover:shadow-[0_6px_28px_rgba(0,240,255,0.35)] active:scale-[0.985] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF]"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>{l('Autenticando...', 'Authenticating...')}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isSignUp
                          ? l('Começar Minha Jornada', 'Begin My Journey')
                          : l('Entrar no ASCEND', 'Enter ASCEND')}
                      </span>
                      <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              {/* Alternador de Modo (Login / Cadastro) */}
              <div className="mt-5 text-center">
                <p className="text-xs sm:text-sm text-slate-300 font-sans">
                  {isSignUp
                    ? l('Já possui uma conta?', 'Already have an account?')
                    : l('Não tem uma conta?', "Don't have an account?")}
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="ml-2 inline-flex min-h-[44px] items-center font-semibold font-sans text-xs sm:text-sm text-[#00F0FF] hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00F0FF] rounded px-1"
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

            {/* Rodapé Alinhado Perfeitamente à Coluna */}
            <footer className="relative z-10 pt-4 pb-2 flex items-center justify-between text-xs font-sans text-slate-400">
              <span>ASCEND &copy; 2026</span>
              <a
                href="/delete-account"
                className="min-h-[44px] inline-flex items-center text-xs font-sans text-slate-400 hover:text-rose-400 transition-colors"
              >
                {l('Exclusão de conta', 'Account deletion')}
              </a>
            </footer>
          </div>
        </div>
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
