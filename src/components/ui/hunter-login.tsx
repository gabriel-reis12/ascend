import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// ── Input Component ────────────────────────────────────────────────────────── //

interface AppInputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  name?: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
}

const AppInput = ({ label, placeholder, icon, name, ...rest }: AppInputProps & Record<string, any>) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={name}
          className={`text-[11px] font-semibold tracking-[0.15em] uppercase transition-colors duration-300 ${isFocused ? 'text-violet-400' : 'text-zinc-500'
            }`}
        >
          {label}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={name}
          name={name}
          style={{ paddingLeft: '16px', paddingRight: icon ? '52px' : '16px' }}
          className="border border-white/[0.08] h-[52px] w-full rounded-xl bg-white/[0.03] text-[15px] text-zinc-100 font-normal outline-none transition-all duration-300 ease-out hover:bg-white/[0.05] hover:border-white/15 focus:bg-white/[0.05] focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/15 placeholder:text-zinc-600"
          placeholder={placeholder}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...rest}
        />

        {/* Glow on focus */}
        <div
          className={`absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-500 ${isFocused ? 'opacity-100' : 'opacity-0'}`}
          style={{ boxShadow: '0 0 20px 2px rgba(139,92,246,0.12)' }}
        />

        {icon && (
          <div className={`absolute right-4 top-1/2 -translate-y-1/2 z-10 transition-colors duration-300 ${isFocused ? 'text-violet-400' : 'text-zinc-600'}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Types ─────────────────────────────────────────────────────────────────── //

export interface HunterLoginProps {
  mode?: 'signin' | 'signup';
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onToggleMode?: () => void;
  loading?: boolean;
  error?: string | null;
}

// ── Main Component ────────────────────────────────────────────────────────── //

export const HunterLogin: React.FC<HunterLoginProps> = ({
  mode = 'signin',
  onSubmit,
  onToggleMode,
  loading = false,
  error = null,
}) => {
  const isSignUp = mode === 'signup';
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] flex items-center justify-center lg:p-6 xl:p-10 overflow-hidden selection:bg-violet-500/30">

      {/* Background ambient glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] bg-violet-600/[0.06] rounded-full blur-[200px]" />
      </div>

      {/* Card */}
      <div
        className={`relative z-10 w-full max-w-[1140px] flex flex-col lg:flex-row min-h-[100dvh] lg:min-h-[720px] lg:h-auto rounded-none lg:rounded-[2rem] overflow-hidden border-0 lg:border border-white/[0.06] shadow-2xl lg:shadow-[0_0_80px_rgba(139,92,246,0.1)] bg-[#0a0a0a] transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      >

        {/* ── LEFT: Form ── */}
        <div
          className="w-full lg:w-[44%] flex flex-col justify-center items-center min-h-[100dvh] lg:min-h-0 relative z-10 px-8 sm:px-14 py-14 lg:py-0 bg-[#0a0a0a]"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {/* Cursor glow */}
          <div
            className={`hidden lg:block absolute pointer-events-none w-[500px] h-[500px] rounded-full blur-[100px] transition-opacity duration-700 ${isHovering ? 'opacity-100' : 'opacity-0'}`}
            style={{
              background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
              transform: `translate(${mousePosition.x - 250}px, ${mousePosition.y - 250}px)`,
              transition: 'transform 0.15s ease-out, opacity 0.5s',
            }}
          />

          {/* Form Content */}
          <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">

            {/* Heading */}
            <div className="text-center mb-10">
              <h1 className="text-[1.75rem] sm:text-[2rem] font-extrabold text-white leading-tight" style={{ letterSpacing: '-0.02em' }}>
                {isSignUp ? 'Crie sua conta!' : 'Bem-vindo!'}
              </h1>
              <p className="mt-2 text-[15px] text-zinc-500 leading-relaxed">
                {isSignUp
                  ? 'Inicie seu despertar e torne-se um Hunter hoje.'
                  : 'Insira suas credenciais ou registre-se já.'}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="w-full rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 flex items-start gap-3 mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Form */}
            <form className="flex flex-col w-full" style={{ gap: '20px' }} onSubmit={onSubmit}>

              {isSignUp && (
                <AppInput
                  label="Codinome"
                  name="username"
                  type="text"
                  placeholder="Ex: Sung Jin Woo"
                  required
                  minLength={3}
                  autoComplete="username"
                />
              )}

              <AppInput
                label="E-mail"
                name="email"
                type="email"
                placeholder="hunter@protocol.com"
                required
                autoComplete="email"
              />

              <div className="flex flex-col" style={{ gap: '6px' }}>
                <AppInput
                  label="Senha"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  icon={
                    <button
                      type="button"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none rounded-lg"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  }
                />

                {!isSignUp && (
                  <a
                    href="#"
                    className="text-[12px] text-zinc-500 hover:text-violet-400 transition-colors hover:underline underline-offset-4 focus-visible:outline-none font-medium"
                  >
                    Esqueceu a senha?
                  </a>
                )}
              </div>

              {isSignUp && (
                <AppInput
                  label="Confirmar Senha"
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  icon={
                    <button
                      type="button"
                      aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none rounded-lg"
                    >
                      {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  }
                />
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group/button relative w-full flex justify-center items-center overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 h-[52px] text-[14px] font-bold text-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.35)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
                style={{ letterSpacing: '0.12em', marginTop: '4px' }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2.5" />}
                <span>{loading ? 'CONECTANDO...' : isSignUp ? 'DESPERTAR' : 'ENTRAR'}</span>
                {/* Shine sweep */}
                <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-13deg)_translateX(-150%)] group-hover/button:duration-1000 group-hover/button:[transform:skew(-13deg)_translateX(150%)] transition-transform ease-out">
                  <div className="relative h-full w-12 bg-white/20 blur-md" />
                </div>
              </button>
            </form>

            {/* Toggle signin/signup */}
            <p className="text-center text-[14px] text-zinc-500 font-normal" style={{ marginTop: '28px' }}>
              {isSignUp ? 'Já despertou? ' : 'Novo por aqui? '}
              <button
                type="button"
                onClick={onToggleMode}
                className="text-violet-400 hover:text-violet-300 font-semibold transition-all hover:underline underline-offset-4 focus-visible:outline-none rounded-sm ml-0.5"
              >
                {isSignUp ? 'Fazer login' : 'Crie sua conta'}
              </button>
            </p>

          </div>
        </div>

        {/* ── RIGHT: Hero Image ── */}
        <div className="hidden lg:flex lg:w-[56%] relative overflow-hidden bg-[#0a0a0a]">

          <img
            src="/Login Screen.jpeg"
            alt="Hunter World"
            className="absolute inset-0 w-full h-full object-cover object-center scale-[1.02]"
            style={{ opacity: 0.85 }}
          />

          {/* Left fade */}
          <div className="absolute inset-y-0 left-0 w-full z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, #0a0a0a 0%, rgba(10,10,10,0.92) 12%, rgba(10,10,10,0.6) 35%, rgba(10,10,10,0.2) 60%, transparent 100%)' }}
          />
          {/* Right fade */}
          <div className="absolute inset-y-0 right-0 w-24 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, #0a0a0a 0%, rgba(10,10,10,0.4) 30%, transparent 100%)' }}
          />
          {/* Top fade */}
          <div className="absolute inset-x-0 top-0 h-32 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, #0a0a0a 0%, rgba(10,10,10,0.4) 50%, transparent 100%)' }}
          />
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-48 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.75) 30%, rgba(10,10,10,0.3) 60%, transparent 100%)' }}
          />
          {/* Vignette */}
          <div className="absolute inset-0 z-[8] pointer-events-none"
            style={{ boxShadow: 'inset 0 0 80px 20px rgba(0,0,0,0.6)' }}
          />

          {/* Overlay Text */}
          <div className="absolute bottom-14 left-0 right-0 z-20 flex flex-col items-center px-10 gap-4">
            <div
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md"
              style={{ background: 'rgba(10,10,10,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.7)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
              <span className="text-[10px] font-semibold tracking-[0.3em] text-zinc-300 uppercase">
                Ascend System
              </span>
            </div>

            <p
              className="text-center text-white text-2xl xl:text-[1.85rem] font-semibold leading-snug max-w-[400px]"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,1), 0 0 60px rgba(0,0,0,0.7)' }}
            >
              Transforme seus limites em{' '}
              <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">
                conquistas épicas
              </span>
              .
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
