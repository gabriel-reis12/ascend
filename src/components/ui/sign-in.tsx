import React, { useState } from 'react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  mode?: 'signin' | 'signup';
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleSignIn?: () => void;
  onResetPassword?: () => void;
  onToggleMode?: () => void;
  loading?: boolean;
  error?: string | null;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-card/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-muted-foreground">{testimonial.handle}</p>
      <p className="mt-1 text-foreground/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  mode = 'signin',
  title = <span className="font-light text-foreground tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSubmit,
  onResetPassword,
  onToggleMode,
  loading = false,
  error = null,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isSignUp = mode === 'signup';

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-geist w-[100dvw] bg-[#0F0F13] text-[#E2E8F0]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-muted-foreground">{description}</p>

            {error && (
              <div className="animate-element animate-delay-200 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <form className="space-y-5" onSubmit={onSubmit}>
              {isSignUp && (
                <div className="animate-element animate-delay-300">
                  <label className="text-sm font-medium text-muted-foreground">Codinome Hunter</label>
                  <GlassInputWrapper>
                    <input name="username" type="text" placeholder="Ex: Sung Jin Woo" required minLength={3} className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                  </GlassInputWrapper>
                </div>
              )}

              <div className={`animate-element ${isSignUp ? 'animate-delay-400' : 'animate-delay-300'}`}>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="seu@email.com" required className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none" />
                </GlassInputWrapper>
              </div>

              <div className={`animate-element ${isSignUp ? 'animate-delay-500' : 'animate-delay-400'}`}>
                <label className="text-sm font-medium text-muted-foreground">Senha</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" required minLength={6} type={showPassword ? 'text' : 'password'} placeholder={isSignUp ? "Mínimo 6 caracteres" : "Sua senha"} className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              {isSignUp && (
                <div className="animate-element animate-delay-600">
                  <label className="text-sm font-medium text-muted-foreground">Confirmar Senha</label>
                  <GlassInputWrapper>
                    <div className="relative">
                      <input name="confirmPassword" required minLength={6} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute inset-y-0 right-3 flex items-center">
                        {showConfirm ? <EyeOff className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" /> : <Eye className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />}
                      </button>
                    </div>
                  </GlassInputWrapper>
                </div>
              )}

              {!isSignUp && (
                <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" name="rememberMe" className="custom-checkbox" />
                    <span className="text-foreground/90">Manter conectado</span>
                  </label>
                  <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-violet-400 transition-colors">Esqueceu a senha?</a>
                </div>
              )}

              <button type="submit" disabled={loading} className={`animate-element ${isSignUp ? 'animate-delay-700' : 'animate-delay-600'} flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-4 font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-50`}>
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? "Processando..." : (isSignUp ? "Despertar AGORA" : "Entrar")}
              </button>
            </form>

            <div className={`animate-element ${isSignUp ? 'animate-delay-800' : 'animate-delay-700'} relative flex items-center justify-center`}>
              <span className="w-full border-t border-border"></span>
              <span className="px-4 text-sm text-muted-foreground bg-[#0F0F13] absolute">Ou</span>
            </div>

            <p className={`animate-element ${isSignUp ? 'animate-delay-900' : 'animate-delay-800'} text-center text-sm text-muted-foreground`}>
              {isSignUp ? "Já despertou? " : "Novo Hunter? "}
              <a href="#" onClick={(e) => { e.preventDefault(); onToggleMode?.(); }} className="text-violet-400 hover:underline transition-colors font-medium">
                {isSignUp ? "Logar no sistema" : "Despertar agora"}
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-[2.5rem] bg-cover bg-center overflow-hidden" style={{ backgroundImage: `url("${heroImageSrc}")` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          </div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center z-10">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
