import React, { useEffect, useState } from 'react';
import {
  Activity,
  ChevronRight,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Loader2,
  Mail,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  User,
  Zap,
  AlertTriangle,
  KeyRound,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import { HudCard } from '@/components/ui/hud-card';

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
}

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 17) % 84)}%`,
  top: `${10 + ((index * 29) % 78)}%`,
  delay: `${(index % 6) * 0.45}s`,
  duration: `${4.2 + (index % 5) * 0.55}s`,
}));

const AppInput = ({
  label,
  placeholder,
  icon,
  action,
  name,
  value,
  onChange,
  helperText,
  ...rest
}: AppInputProps & Record<string, unknown>) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={name}
            className={`block text-[11px] font-bold font-orbitron uppercase tracking-[0.18em] transition-colors duration-300 ${
              isFocused ? 'text-cyan-300' : 'text-slate-400'
            }`}
          >
            {label}
          </label>
          {helperText && (
            <span className="text-[10px] text-slate-500 font-mono">
              {helperText}
            </span>
          )}
        </div>
      )}

      <div className="group relative">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/0 via-violet-500/0 to-orange-400/0 opacity-0 blur-xl transition-opacity duration-300 group-focus-within:opacity-50" />
        <div
          className={`relative flex h-[50px] sm:h-[54px] items-center rounded-2xl border bg-[#0D101A]/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.3)] backdrop-blur-xl transition-all duration-300 ${
            isFocused
              ? 'border-cyan-400/60 bg-[#101422] ring-2 ring-cyan-400/20 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
              : 'border-white/10 hover:border-white/20 hover:bg-[#0D101A]'
          }`}
        >
          {icon && (
            <div
              className={`ml-3.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 bg-black/30 transition-colors duration-300 ${
                isFocused ? 'text-cyan-300 border-cyan-400/30' : 'text-slate-500'
              }`}
            >
              {icon}
            </div>
          )}
          <input
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="h-full min-w-0 flex-1 bg-transparent px-3.5 text-sm sm:text-[15px] font-sans font-medium text-white outline-none placeholder:text-slate-600 placeholder:font-sans"
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

  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
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

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  const handleOpenRecovery = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setRecoveryModalOpen(true);
    }
  };

  const systemStats = [
    { label: l('Rank do Caçador', 'Hunter Rank'), value: 'C', icon: Shield, tone: 'text-cyan-300' },
    { label: l('Nível Base', 'Base Level'), value: '12', icon: Trophy, tone: 'text-violet-300' },
    { label: 'Streak Ativo', value: l('18d', '18d'), icon: Flame, tone: 'text-amber-300' },
  ];

  const systemSignals = [
    { label: l('Classe Inicial', 'Starting Class'), value: 'Shadow Striker' },
    { label: l('Boss da Fenda', 'Active Boss'), value: l('Mente de Ferro', 'Iron Mind') },
    { label: l('Protocolo de Treino', 'Workout Protocol'), value: l('Personalizado', 'Customized') },
    { label: l('Metabolismo Basal', 'Target Nutrition'), value: l('Calibrado', 'Calibrated') },
  ];

  const title = isSignUp
    ? l('Primeiro Despertar', 'First Awakening')
    : l('Bem-vindo ao Sistema', 'Welcome to the System');

  const subtitle = isSignUp
    ? l(
        'Registre sua identidade de caçador e inicie sua calibração no Sistema.',
        'Register your hunter identity and initiate calibration in the System.'
      )
    : l(
        'Acesse sua frequência de caçador e continue sua jornada de evolução diária.',
        'Access your hunter frequency and continue your daily ascension journey.'
      );

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-[#03040a] text-white selection:bg-cyan-300/25"
      onMouseMove={handleMouseMove}
    >
      {/* Background Otimizado para Mobile */}
      <img
        src="/optimized/Login Screen.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-30 blur-[1px] lg:hidden"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.22),transparent_38%),radial-gradient(circle_at_76%_54%,rgba(34,211,238,0.18),transparent_35%),linear-gradient(135deg,#03040a_0%,#080712_42%,#02030a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />

      <div
        className="pointer-events-none absolute h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-[130px] transition-transform duration-500"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {particles.map((particle) => (
        <span
          key={particle.id}
          className="auth-system-particle absolute z-[1] h-1 w-1 rounded-full bg-cyan-200/70 shadow-[0_0_18px_rgba(103,232,249,0.9)]"
          style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
          }}
        />
      ))}

      <section
        className={`relative z-10 mx-auto grid min-h-screen w-full max-w-[1440px] grid-cols-1 transition-all duration-700 lg:grid-cols-[minmax(430px,0.92fr)_minmax(560px,1.08fr)] ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        }`}
      >
        {/* Painel Esquerdo: Formulário */}
        <div className="relative flex min-h-screen flex-col px-4 py-5 sm:px-8 lg:px-12 xl:px-16 justify-between">
          <div className="pointer-events-none absolute inset-y-0 right-[-12%] hidden w-[36%] bg-gradient-to-r from-transparent via-violet-500/12 to-cyan-300/10 blur-3xl lg:block" />

          {/* Top Header */}
          <header className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
                <Sparkles className="h-5 w-5 text-cyan-300 animate-pulse" />
                <div className="absolute inset-1 rounded-xl border border-violet-400/20" />
              </div>
              <div>
                <p className="text-xl font-black font-orbitron uppercase leading-none tracking-[0.22em] text-white">
                  Ascend
                </p>
                <p className="mt-1 text-[10px] font-bold font-orbitron uppercase tracking-[0.24em] text-cyan-300/80">
                  Evolution System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
              <div className="hidden rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3.5 py-1.5 text-[10px] font-bold font-orbitron uppercase tracking-[0.2em] text-cyan-300 backdrop-blur-xl sm:flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                <span>{l('Sistema Online', 'System Online')}</span>
              </div>
            </div>
          </header>

          {/* Conteúdo Central */}
          <div className="relative z-10 flex flex-1 items-center py-6 sm:py-8 lg:py-10">
            <div className="w-full max-w-[480px] mx-auto lg:mx-0">
              {/* Título & Badge */}
              <div className="mb-5 sm:mb-6">
                <div className="mb-2.5 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-[10px] font-black font-orbitron uppercase tracking-[0.22em] text-violet-200 shadow-[0_0_25px_rgba(124,58,237,0.2)] backdrop-blur-xl">
                  <Zap className="h-3 w-3 text-cyan-300" />
                  Ascend HUD v2.7
                </div>

                {/* Mantém text-2xl sm:text-3xl para garantir testes de contrato de ergonomia mobile */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-orbitron leading-tight tracking-normal text-white">
                  {title}
                </h1>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                  {subtitle}
                </p>
              </div>

              {/* Stats Decorativos (ocultos em mobile para não poluir espaço de teclado) */}
              <div className="mb-5 hidden sm:grid grid-cols-3 gap-2.5 sm:gap-3">
                {systemStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] p-3 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur-xl sm:p-3.5"
                    >
                      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 ${stat.tone}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-[9px] font-bold font-orbitron uppercase tracking-[0.14em] text-slate-400">
                        {stat.label}
                      </p>
                      <p className="mt-0.5 text-lg font-black font-orbitron text-white">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Barra de Fenda / XP Decorativa */}
              <div className="mb-5 hidden sm:block rounded-2xl border border-cyan-400/20 bg-black/40 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black font-orbitron uppercase tracking-[0.2em] text-cyan-300/80">
                      {l('Frequência de Acesso', 'Access Frequency')}
                    </p>
                    <p className="text-xs font-bold font-orbitron text-white">
                      {l('Canal Seguro & Criptografado', 'Secure & Encrypted Channel')}
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-black font-orbitron text-cyan-300">
                    256-BIT
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="auth-xp-bar h-full w-[88%] rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                </div>
              </div>

              {/* Formulário Principal */}
              <form className="w-full space-y-3.5" onSubmit={onSubmit}>
                {/* Alerta de Erro com HUD v2 */}
                {error && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/15 p-3.5 flex items-start gap-3 text-xs sm:text-sm text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.2)] backdrop-blur-xl animate-in fade-in duration-200">
                    <AlertTriangle className="size-4 sm:size-5 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-snug font-medium">{error}</span>
                  </div>
                )}

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

                {/* Campo Identidade / E-mail */}
                <AppInput
                  label={l('Identidade (E-mail)', 'Identity (Email)')}
                  name="email"
                  type="email"
                  placeholder="cacador@ascend.system"
                  required
                  autoComplete="email"
                  value={enteredEmail}
                  onChange={(e) => setEnteredEmail(e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                />

                {/* Campo Chave de Acesso / Senha */}
                <div className="space-y-1.5">
                  <AppInput
                    label={l('Chave de Acesso', 'Access Key')}
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
                            ? l('Ocultar chave', 'Hide key')
                            : l('Mostrar chave', 'Show key')
                        }
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    }
                  />

                  {/* Ação de Recuperação de Senha no Login */}
                  {!isSignUp && (
                    <div className="flex justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={handleOpenRecovery}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold font-orbitron uppercase tracking-wider text-slate-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 rounded px-1 py-0.5"
                      >
                        <KeyRound className="size-3" />
                        <span>{l('Recuperar chave de acesso', 'Recover access key')}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Campo Confirmação de Senha (Apenas no Cadastro) */}
                {isSignUp && (
                  <div className="space-y-1.5">
                    <AppInput
                      label={l('Confirmar Chave de Acesso', 'Confirm Access Key')}
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
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          {showConfirm ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      }
                    />

                    {/* Indicadores de Validação em Tempo Real */}
                    {passwordValue.length > 0 && (
                      <div className="flex flex-col gap-1 px-1 pt-1 text-[10px] font-mono">
                        <div
                          className={`flex items-center gap-1.5 ${
                            passwordValue.length >= 6 ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          <Check className="size-3" />
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
                            <Check className="size-3" />
                            <span>
                              {passwordValue === confirmValue
                                ? l('Chaves de acesso coincidem', 'Passwords match')
                                : l('As chaves não coincidem', 'Passwords do not match')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Banner Tático do Que Esperar (No Cadastro) */}
                {isSignUp && (
                  <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 flex items-start gap-2.5 text-xs text-cyan-200">
                    <Sparkles className="size-4 text-cyan-300 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {l(
                        'Após registrar seu codinome, você será direcionado ao Despertar com o Arquiteto para configurar sua classe e parâmetros corporais.',
                        'After registering your codename, you will proceed to Awakening with the Architect to calibrate your class and biological stats.'
                      )}
                    </p>
                  </div>
                )}

                {/* Botão CTA Principal com min-h de 52px */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex min-h-[52px] sm:min-h-[54px] w-full items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/30 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-[13px] font-black font-orbitron uppercase tracking-[0.2em] text-white shadow-[0_15px_45px_rgba(6,182,212,0.3),0_0_30px_rgba(124,58,237,0.25)] hover:shadow-[0_20px_60px_rgba(6,182,212,0.45),0_0_40px_rgba(124,58,237,0.35)] hover:brightness-110 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.3)_45%,transparent_60%)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
                  {loading ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  ) : (
                    <Swords className="mr-3 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  )}
                  <span>
                    {loading
                      ? l('Sincronizando com o Sistema...', 'Synchronizing with System...')
                      : isSignUp
                        ? l('Despertar no Sistema', 'Awaken in the System')
                        : l('Iniciar Ascensão', 'Begin Ascension')}
                  </span>
                  <ChevronRight className="ml-2.5 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>

              {/* Alternador de Modo (Login / Cadastro) */}
              <div className="mt-5 text-center">
                <p className="text-xs sm:text-sm text-slate-400">
                  {isSignUp
                    ? l('Já possui registro no sistema?', 'Already registered in the System?')
                    : l('Primeira vez no sistema?', 'First time in the System?')}
                  <button
                    type="button"
                    onClick={onToggleMode}
                    className="ml-2 min-h-[44px] inline-flex items-center font-black font-orbitron text-xs sm:text-sm text-cyan-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 rounded px-1"
                  >
                    {isSignUp
                      ? l('Acessar conta', 'Access account')
                      : l('Solicitar despertar', 'Request awakening')}
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Footer Esquerdo */}
          <footer className="relative z-10 pt-4 text-center lg:text-left text-[10px] font-orbitron text-slate-500 uppercase tracking-widest">
            ASCEND PROTOCOL &bull; SECURE LOGIN &bull; V2.7
          </footer>
        </div>

        {/* Painel Direito: Arte & Universo ASCEND (Desktop/Tablet) */}
        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <img
            src="/optimized/Login Screen.jpg"
            alt="Hunter em uma fenda de energia do Ascend System"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_40%,rgba(34,211,238,0.06),transparent_30%),linear-gradient(90deg,#03040a_0%,rgba(3,4,10,0.85)_12%,rgba(3,4,10,0.2)_40%,rgba(3,4,10,0.08)_100%)]" />
          <div className="absolute inset-y-0 left-[-15%] w-[45%] bg-gradient-to-r from-[#03040a] via-violet-500/20 to-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-[48%] bg-gradient-to-t from-[#03040a] via-[#03040a]/60 to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.8)]" />

          {/* Badge Superior */}
          <div className="absolute left-10 top-10 flex items-center gap-2 rounded-full border border-cyan-400/30 bg-black/40 px-4 py-2 text-[10px] font-black font-orbitron uppercase tracking-[0.24em] text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-xl">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{l('Gate Calibrado', 'Gate Calibrated')}</span>
          </div>

          {/* Cards Inferiores com HudCard */}
          <div className="absolute bottom-10 left-10 right-10 grid grid-cols-[1fr_1.15fr] gap-4">
            {/* Card 1: Prévia de Status */}
            <HudCard
              variant="cyan"
              corners
              radialGlow
              className="p-5 border border-cyan-400/30 bg-black/50 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
            >
              <div className="mb-3.5 flex items-center justify-between">
                <p className="text-[10px] font-black font-orbitron uppercase tracking-[0.22em] text-cyan-300">
                  {l('Prévia de Status', 'Status Preview')}
                </p>
                <Activity className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="space-y-2.5">
                {systemSignals.map((signal) => (
                  <div key={signal.label} className="flex items-center justify-between gap-4">
                    <span className="text-xs font-orbitron text-slate-400">{signal.label}</span>
                    <span className="text-right text-xs sm:text-sm font-black font-orbitron text-white">
                      {signal.value}
                    </span>
                  </div>
                ))}
              </div>
            </HudCard>

            {/* Card 2: Mensagem do Sistema */}
            <HudCard
              variant="purple"
              corners
              radialGlow
              className="flex flex-col justify-end p-5 border border-violet-400/30 bg-black/50 shadow-[0_20px_60px_rgba(124,58,237,0.2)] backdrop-blur-2xl"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="size-3.5 text-violet-300" />
                <p className="text-[10px] font-black font-orbitron uppercase tracking-[0.26em] text-violet-200/90">
                  {l('Mensagem do Sistema', 'System Message')}
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-black font-orbitron leading-snug text-white">
                {l('Transforme rotina em evolução visível.', 'Turn routine into visible evolution.')}
              </p>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-300">
                {l(
                  'Cada treino, refeição e hábito concluído vira XP para a sua próxima versão.',
                  'Every workout, meal, and completed habit turns into XP for your next version.'
                )}
              </p>
            </HudCard>
          </div>
        </aside>
      </section>

      {/* Modal Integrado de Recuperação de Senha */}
      <ForgotPasswordModal
        isOpen={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        initialEmail={enteredEmail}
      />
    </main>
  );
};
