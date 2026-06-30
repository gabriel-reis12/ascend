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
} from 'lucide-react';
import { usePreferences } from '@/contexts/preferences';
import { LanguageSwitcher } from '@/components/preferences/LanguageSwitcher';

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
  ...rest
}: AppInputProps & Record<string, unknown>) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full space-y-2">
      {label && (
        <label
          htmlFor={name}
          className={`block text-[11px] font-bold font-orbitron uppercase tracking-[0.18em] transition-colors duration-300 ${
            isFocused ? 'text-cyan-200' : 'text-slate-400'
          }`}
        >
          {label}
        </label>
      )}

      <div className="group relative">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-400/0 via-violet-500/0 to-orange-400/0 opacity-0 blur-xl transition-opacity duration-300 group-focus-within:opacity-60" />
        <div className="relative flex h-[56px] items-center rounded-2xl border border-white/10 bg-white/[0.045] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300 hover:border-cyan-300/25 hover:bg-white/[0.065] focus-within:border-cyan-300/55 focus-within:bg-white/[0.075] focus-within:ring-2 focus-within:ring-cyan-300/15">
          {icon && (
            <div
              className={`ml-4 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 transition-colors duration-300 ${
                isFocused ? 'text-cyan-200' : 'text-slate-500'
              }`}
            >
              {icon}
            </div>
          )}
          <input
            id={name}
            name={name}
            className="h-full min-w-0 flex-1 bg-transparent px-4 text-[15px] font-medium font-orbitron text-white outline-none placeholder:text-slate-600"
            placeholder={placeholder}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            {...rest}
          />
          {action && <div className="mr-3 shrink-0">{action}</div>}
        </div>
      </div>
    </div>
  );
};

export interface HunterLoginProps {
  mode?: 'signin' | 'signup';
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode?: () => void;
  loading?: boolean;
  error?: string | null;
}

export const HunterLogin: React.FC<HunterLoginProps> = ({
  mode = 'signin',
  onSubmit,
  onToggleMode,
  loading = false,
  error = null,
}) => {
  const { language } = usePreferences();
  const l = (pt: string, en: string) => language === 'en-US' ? en : pt;
  const isSignUp = mode === 'signup';
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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

  const systemStats = [
    { label: l('Rank do Caçador', 'Hunter Rank'), value: 'C', icon: Shield, tone: 'text-cyan-200' },
    { label: l('Nível', 'Level'), value: '12', icon: Trophy, tone: 'text-violet-200' },
    { label: 'Streak', value: l('18d', '18d'), icon: Flame, tone: 'text-orange-200' },
  ];
  const systemSignals = [
    { label: l('Classe', 'Class'), value: 'Shadow Striker' },
    { label: l('Boss da Semana', 'Weekly Boss'), value: l('Disciplina', 'Discipline') },
    { label: l('Quests da comunidade', 'Community quests'), value: '+12,000' },
  ];

  const title = isSignUp ? l('Primeiro despertar', 'First Awakening') : l('Bem-vindo ao Sistema', 'Welcome to the System');
  const subtitle = isSignUp
    ? l('Registre sua identidade e desbloqueie o protocolo de evolução.', 'Register your identity and unlock the evolution protocol.')
    : l('Acesse sua jornada de evolução, quests, bosses e progressão diária.', 'Access your journey of evolution, quests, bosses, and daily progression.');

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden bg-[#03040a] text-white selection:bg-cyan-300/25"
      onMouseMove={handleMouseMove}
    >
      <img
        src="/optimized/Login Screen.jpg"
        alt=""
        aria-hidden="true"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-[62%_center] opacity-35 blur-[1px] lg:hidden"
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(124,58,237,0.28),transparent_34%),radial-gradient(circle_at_76%_54%,rgba(34,211,238,0.2),transparent_31%),linear-gradient(135deg,#03040a_0%,#080712_42%,#02030a_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.08]" />
      <div
        className="pointer-events-none absolute h-[560px] w-[560px] rounded-full bg-cyan-300/10 blur-[120px] transition-transform duration-500"
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
        <div className="relative flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:px-12 xl:px-16">
          <div className="pointer-events-none absolute inset-y-0 right-[-12%] hidden w-[36%] bg-gradient-to-r from-transparent via-violet-500/12 to-cyan-300/10 blur-3xl lg:block" />

          <header className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-200/10 shadow-[0_0_34px_rgba(34,211,238,0.25)]">
                <Sparkles className="h-5 w-5 text-cyan-100" />
                <div className="absolute inset-1 rounded-xl border border-violet-300/20" />
              </div>
              <div>
                <p className="text-xl font-black font-orbitron uppercase leading-none tracking-[0.22em] text-white">Ascend</p>
                <p className="mt-1 text-[10px] font-bold font-orbitron uppercase tracking-[0.24em] text-cyan-200/70">
                  Evolution System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher compact />
              <div className="hidden rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-[10px] font-bold font-orbitron uppercase tracking-[0.2em] text-slate-300 backdrop-blur-xl sm:flex">
                {l('Sistema online', 'System online')}
              </div>
            </div>
          </header>

          <div className="relative z-10 flex flex-1 items-center py-8 lg:py-10">
            <div className="w-full">
              <div className="mb-7 max-w-[560px]">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/10 px-3 py-1.5 text-[10px] font-black font-orbitron uppercase tracking-[0.22em] text-violet-100 shadow-[0_0_30px_rgba(124,58,237,0.16)] backdrop-blur-xl">
                  <Zap className="h-3.5 w-3.5 text-cyan-200" />
                  Ascend System v2.7
                </div>

                <h1 className="max-w-[520px] text-[2.45rem] font-black font-orbitron leading-[0.95] tracking-normal text-white sm:text-[3.25rem] lg:text-[3.55rem]">
                  {title}
                </h1>
                <p className="mt-4 max-w-[450px] text-base leading-7 text-slate-300 sm:text-[17px]">
                  {subtitle}
                </p>
              </div>

              <div className="mb-7 grid grid-cols-3 gap-2.5 sm:gap-3">
                {systemStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.055] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:p-4"
                    >
                      <div className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 ${stat.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <p className="text-[10px] font-bold font-orbitron uppercase tracking-[0.14em] text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-xl font-black font-orbitron text-white sm:text-2xl">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-8 rounded-3xl border border-cyan-200/15 bg-black/24 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black font-orbitron uppercase tracking-[0.22em] text-cyan-200/70">{l('Protocolo ativo', 'Active protocol')}</p>
                    <p className="mt-1 text-sm font-bold font-orbitron text-white">{l('XP para o Nível 13', 'XP to Level 13')}</p>
                  </div>
                  <span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1 text-xs font-black font-orbitron text-orange-100">
                    82%
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.08]">
                  <div className="auth-xp-bar h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-300 via-violet-400 to-orange-300 shadow-[0_0_28px_rgba(34,211,238,0.45)]" />
                </div>
              </div>

              <form className="w-full max-w-[520px] space-y-4" onSubmit={onSubmit}>
                {error && (
                  <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100 shadow-[0_0_30px_rgba(248,113,113,0.1)] backdrop-blur-xl">
                    {error}
                  </div>
                )}

                {isSignUp && (
                  <AppInput
                    label={l('Codinome', 'Codename')}
                    name="username"
                    type="text"
                    placeholder="Ex: Sung Jin Woo"
                    required
                    minLength={3}
                    autoComplete="username"
                    icon={<User className="h-4.5 w-4.5" />}
                  />
                )}

                <AppInput
                  label={l('Identidade', 'Identity')}
                  name="email"
                  type="email"
                  placeholder="hunter@ascend.system"
                  required
                  autoComplete="email"
                  icon={<Mail className="h-4.5 w-4.5" />}
                />

                <div className="space-y-2">
                  <AppInput
                    label={l('Chave de acesso', 'Access key')}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    icon={<Lock className="h-4.5 w-4.5" />}
                    action={
                      <button
                        type="button"
                        aria-label={showPassword ? l('Ocultar senha', 'Hide password') : l('Mostrar senha', 'Show password')}
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                      >
                        {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    }
                  />

                  {!isSignUp && (
                    <a
                      href="#"
                      className="inline-flex text-[12px] font-bold font-orbitron uppercase tracking-[0.12em] text-slate-500 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                    >
                      {l('Recuperar chave', 'Recover key')}
                    </a>
                  )}
                </div>

                {isSignUp && (
                  <AppInput
                    label={l('Confirmar chave', 'Confirm key')}
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    icon={<Lock className="h-4.5 w-4.5" />}
                    action={
                      <button
                        type="button"
                        aria-label={showConfirm ? l('Ocultar confirmação', 'Hide confirmation') : l('Mostrar confirmação', 'Show confirmation')}
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-white/10 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                      >
                        {showConfirm ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                      </button>
                    }
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex h-[58px] w-full items-center justify-center overflow-hidden rounded-2xl border border-cyan-100/25 bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 text-[13px] font-black font-orbitron uppercase tracking-[0.2em] text-white shadow-[0_18px_55px_rgba(124,58,237,0.36),0_0_34px_rgba(34,211,238,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_75px_rgba(124,58,237,0.48),0_0_46px_rgba(34,211,238,0.26)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#03040a]"
                >
                  <span className="absolute inset-0 bg-[linear-gradient(110deg,transparent_0%,rgba(255,255,255,0.34)_45%,transparent_60%)] opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
                  {loading ? (
                    <Loader2 className="mr-3 h-4 w-4 animate-spin" />
                  ) : (
                    <Swords className="mr-3 h-4 w-4 transition-transform duration-300 group-hover:rotate-12" />
                  )}
                  {loading
                    ? l('Sincronizando...', 'Synchronizing...')
                    : isSignUp
                      ? l('Despertar no Sistema', 'Awaken in the System')
                      : l('Iniciar Ascensão', 'Begin Ascension')}
                  <ChevronRight className="ml-3 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </form>

              <p className="mt-6 max-w-[520px] text-center text-sm text-slate-400">
                {isSignUp
                  ? l('Já possui registro no sistema?', 'Already registered in the System?')
                  : l('Primeira vez no sistema?', 'First time in the System?')}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className="ml-2 font-black font-orbitron text-cyan-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
                >
                  {isSignUp ? l('Acessar conta', 'Access account') : l('Solicitar despertar', 'Request awakening')}
                </button>
              </p>
            </div>
          </div>
        </div>

        <aside className="relative hidden min-h-screen overflow-hidden lg:block">
          <img
            src="/optimized/Login Screen.jpg"
            alt="Hunter em uma fenda de energia do Ascend System"
            decoding="async"
            fetchPriority="high"
            className="absolute inset-0 h-full w-full scale-[1.03] object-cover object-center"
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_40%,rgba(34,211,238,0.05),transparent_26%),linear-gradient(90deg,#03040a_0%,rgba(3,4,10,0.86)_11%,rgba(3,4,10,0.18)_38%,rgba(3,4,10,0.08)_100%)]" />
          <div className="absolute inset-y-0 left-[-18%] w-[48%] bg-gradient-to-r from-[#03040a] via-violet-500/20 to-cyan-300/12 blur-3xl" />
          <div className="absolute bottom-0 left-0 right-0 h-[42%] bg-gradient-to-t from-[#03040a] via-[#03040a]/52 to-transparent" />
          <div className="absolute inset-0 shadow-[inset_0_0_140px_rgba(0,0,0,0.74)]" />

          <div className="absolute left-10 top-10 rounded-full border border-cyan-200/20 bg-black/25 px-4 py-2 text-[10px] font-black font-orbitron uppercase tracking-[0.24em] text-cyan-100 shadow-[0_0_28px_rgba(34,211,238,0.14)] backdrop-blur-xl">
            {l('Gate calibrado', 'Gate calibrated')}
          </div>

          <div className="absolute bottom-10 left-10 right-10 grid grid-cols-[1fr_1.2fr] gap-4">
            <div className="rounded-3xl border border-white/10 bg-black/34 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-black font-orbitron uppercase tracking-[0.22em] text-slate-400">{l('Prévia de status', 'Status preview')}</p>
                <Activity className="h-4 w-4 text-cyan-200" />
              </div>
              <div className="space-y-3">
                {systemSignals.map((signal) => (
                  <div key={signal.label} className="flex items-center justify-between gap-4">
                    <span className="text-xs font-orbitron text-slate-500">{signal.label}</span>
                    <span className="text-right text-sm font-black font-orbitron text-white">{signal.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end rounded-3xl border border-violet-300/15 bg-violet-300/10 p-5 shadow-[0_24px_80px_rgba(124,58,237,0.18)] backdrop-blur-2xl">
              <p className="mb-3 text-[10px] font-black font-orbitron uppercase tracking-[0.26em] text-violet-100/70">{l('Mensagem do sistema', 'System message')}</p>
              <p className="text-2xl font-black font-orbitron leading-tight text-white">
                {l('Transforme rotina em progressão visível.', 'Turn routine into visible progression.')}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {l('Cada treino, refeição e decisão vira XP para a sua próxima versão.', 'Every workout, meal, and decision becomes XP for your next version.')}
              </p>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
};
