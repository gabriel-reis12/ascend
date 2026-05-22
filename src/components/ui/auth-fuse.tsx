import * as React from "react";
import { useState, useId, useEffect, useRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Typewriter ─────────────────────────────────────────────── */
interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

function Typewriter({ text, speed = 80, cursor = "|", loop = false, deleteSpeed = 40, delay = 2000, className }: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] ?? "";

  useEffect(() => {
    if (!currentText) return;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentIndex < currentText.length) {
          setDisplayText((p) => p + currentText[currentIndex]);
          setCurrentIndex((p) => p + 1);
        } else if (loop) {
          setTimeout(() => setIsDeleting(true), delay);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText((p) => p.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex(0);
          setTextArrayIndex((p) => (p + 1) % textArray.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);
    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, currentText, loop, speed, deleteSpeed, delay, displayText, text, textArray.length]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse text-blue-400">{cursor}</span>
    </span>
  );
}

/* ── Label ──────────────────────────────────────────────────── */
const labelVariants = cva("text-sm uppercase tracking-wider font-semibold text-[#94A3B8] ml-1");

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

/* ── Button ─────────────────────────────────────────────────── */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-bold transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 tracking-wide",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-[0_0_20px_rgba(59,130,246,0.35)] hover:shadow-[0_0_30px_rgba(59,130,246,0.55)]",
        outline:
          "border border-[#38384A] bg-[#1C1C24] text-[#E2E8F0] hover:bg-[#2A2A35] hover:border-blue-500/50",
        ghost:
          "text-[#94A3B8] hover:text-[#E2E8F0] hover:bg-[#2A2A35]",
        link:
          "text-blue-400 hover:text-blue-300 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm",
        sm: "h-10 px-4 text-xs",
        lg: "h-14 px-8 text-base",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

/* ── Input ──────────────────────────────────────────────────── */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base text-[#E2E8F0] placeholder:text-[#4A4A5A] backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:border-blue-500/70 focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:opacity-50 hover:bg-white/10",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

/* ── PasswordInput ──────────────────────────────────────────── */
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, label, ...props }, ref) => {
  const id = useId();
  const [show, setShow] = useState(false);
  return (
    <div className="grid w-full gap-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input id={id} type={show ? "text" : "password"} className={cn("pr-12", className)} ref={ref} {...props} />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-[#94A3B8] hover:text-[#E2E8F0] transition-colors focus-visible:outline-none"
          aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

/* ── Interactive Hover Image ────────────────────────────────── */
function HoverImage({ src, alt }: { src: string; alt: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x, y });
  };

  const rotateX = isHovered ? (mousePos.y - 0.5) * -12 : 0;
  const rotateY = isHovered ? (mousePos.x - 0.5) * 12 : 0;
  const glowX = mousePos.x * 100;
  const glowY = mousePos.y * 100;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMousePos({ x: 0.5, y: 0.5 }); }}
      style={{ perspective: "1200px" }}
    >
      {/* Glow layer behind image that follows mouse */}
      <motion.div
        className="absolute rounded-3xl pointer-events-none"
        animate={{
          opacity: isHovered ? 0.7 : 0,
          scale: isHovered ? 1 : 0.9,
        }}
        transition={{ duration: 0.4 }}
        style={{
          width: "85%",
          height: "85%",
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(59, 130, 246, 0.5) 0%, rgba(124, 58, 237, 0.25) 40%, transparent 70%)`,
          filter: "blur(40px)",
        }}
      />

      {/* Main image container */}
      <motion.div
        className="relative z-10 w-[80%] max-w-[420px] rounded-2xl overflow-hidden cursor-pointer"
        animate={{
          rotateX,
          rotateY,
          scale: isHovered ? 1.04 : 1,
        }}
        transition={{ type: "spring", stiffness: 200, damping: 25 }}
        style={{
          transformStyle: "preserve-3d",
          boxShadow: isHovered
            ? "0 25px 60px -12px rgba(59, 130, 246, 0.5), 0 0 40px rgba(124, 58, 237, 0.2), 0 0 0 1px rgba(59, 130, 246, 0.3)"
            : "0 10px 30px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 56, 74, 0.5)",
        }}
      >
        {/* The image */}
        <motion.img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover"
          animate={{
            scale: isHovered ? 1.08 : 1,
            filter: isHovered ? "brightness(1.1) contrast(1.05)" : "brightness(0.95) contrast(1)",
          }}
          transition={{ duration: 0.5 }}
          draggable={false}
        />

        {/* Gradient overlay at bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, transparent 50%, rgba(15, 15, 19, 0.6) 100%)",
          }}
        />

        {/* Shine / glint effect on hover */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255, 255, 255, 0.12) 0%, transparent 50%)`,
          }}
        />

        {/* Border glow ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{
            border: "1px solid rgba(59, 130, 246, 0.5)",
            boxShadow: "inset 0 0 20px rgba(59, 130, 246, 0.15)",
          }}
        />
      </motion.div>

      {/* Floating particles around image on hover */}
      {isHovered && (
        <>
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              initial={{
                opacity: 0,
                scale: 0,
                x: `${50 + (Math.random() - 0.5) * 20}%`,
                y: `${50 + (Math.random() - 0.5) * 20}%`,
              }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0, 1, 0],
                y: [`${40 + i * 10}%`, `${20 + i * 5}%`],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeOut",
              }}
              style={{
                width: 3 + Math.random() * 4,
                height: 3 + Math.random() * 4,
                background: i % 2 === 0
                  ? "rgba(59, 130, 246, 0.8)"
                  : "rgba(124, 58, 237, 0.8)",
                boxShadow: i % 2 === 0
                  ? "0 0 6px rgba(59, 130, 246, 0.6)"
                  : "0 0 6px rgba(124, 58, 237, 0.6)",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}

/* ── Form handlers ──────────────────────────────────────────── */
export interface AuthHandlers {
  onSignIn: (email: string, password: string) => Promise<{ error: string | null }>;
  onSignUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  onSignInSuccess: () => void;
  onSignUpSuccess: () => void;
}

function SignInForm({ handlers, onSwitchToSignUp }: { handlers: AuthHandlers; onSwitchToSignUp: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await handlers.onSignIn(email, password);
    setLoading(false);
    if (err) { setError(err); }
    else handlers.onSignInSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center mb-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#94A3B8] tracking-tight">Logar Sistema</h1>
        <p className="text-base text-[#94A3B8]">Bem-vindo de volta, Hunter.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
          {error}
        </motion.div>
      )}

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="signin-email">Email</Label>
          <Input id="signin-email" name="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Senha" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <Button type="submit" disabled={loading} className="mt-4 text-base h-14">
          {loading && <Loader2 className="size-5 animate-spin" />}
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>

      <p className="text-center text-base text-[#94A3B8] mt-2">
        Novo Hunter?{" "}
        <button type="button" onClick={onSwitchToSignUp} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Despertar agora
        </button>
      </p>
    </form>
  );
}

function SignUpForm({ handlers, onSwitchToSignIn }: { handlers: AuthHandlers; onSwitchToSignIn: () => void }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("As senhas não coincidem."); return; }
    if (password.length < 6) { setError("Senha mínima: 6 caracteres."); return; }
    setLoading(true);
    const { error: err } = await handlers.onSignUp(email, password, username);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setSuccess(true);
      setTimeout(() => handlers.onSignUpSuccess(), 2500);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 py-8 text-center"
      >
        <div className="text-6xl drop-shadow-[0_0_15px_rgba(59,130,246,0.6)]">⚡</div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Despertar Concluído!</h2>
          <p className="text-base text-[#94A3B8]">
            Verifique seu email para confirmar seu rank e depois faça login.
          </p>
        </div>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="mt-4 text-blue-400 hover:text-blue-300 text-base font-semibold transition-colors flex items-center gap-2"
        >
          Acessar sistema <span className="text-xl">→</span>
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 text-center mb-2">
        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#94A3B8] tracking-tight">Despertar Hunter</h1>
        <p className="text-base text-[#94A3B8]">Sua jornada para o Rank S começa aqui.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 text-center">
          {error}
        </motion.div>
      )}

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="username">Codinome Hunter</Label>
          <Input id="username" name="username" type="text" placeholder="ex: Sung_Jin_Woo" required minLength={3} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input id="signup-email" name="email" type="email" placeholder="seu@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <PasswordInput name="password" label="Senha" required placeholder="mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        <PasswordInput name="confirm" label="Confirmar Senha" required placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        <Button type="submit" disabled={loading} className="mt-4 text-base h-14">
          {loading && <Loader2 className="size-5 animate-spin" />}
          {loading ? "Processando despertar..." : "Despertar AGORA"}
        </Button>
      </div>

      <p className="text-center text-base text-[#94A3B8] mt-2">
        Já desperto?{" "}
        <button type="button" onClick={onSwitchToSignIn} className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
          Logar sistema
        </button>
      </p>
    </form>
  );
}

/* ── AuthUI (main export) ───────────────────────────────────── */
interface AuthUIProps {
  handlers: AuthHandlers;
  initialMode?: "signin" | "signup";
}

export function AuthUI({ handlers, initialMode = "signin" }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(initialMode === "signin");

  const signInQuotes = [
    "Bem-vindo de volta, Hunter.",
    "O sistema aguarda suas métricas.",
    "A ascensão continua...",
  ];

  const signUpQuotes = [
    "Um novo despertar foi detectado.",
    "Acompanhe sua própria evolução.",
    "O sistema selecionou você.",
  ];

  const quotes = isSignIn ? signInQuotes : signUpQuotes;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 bg-[#0F0F13]">
      {/* Form side */}
      <div className="flex min-h-screen items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-md p-8 md:p-10 rounded-[2rem] bg-white/[0.02] backdrop-blur-3xl border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* Subtle top glow inside the card */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <motion.img
              src="/Logo.png"
              alt="ASCEND Logo"
              className="h-20 w-auto object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.4)]"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignIn ? "signin" : "signup"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {isSignIn
                ? <SignInForm handlers={handlers} onSwitchToSignUp={() => setIsSignIn(false)} />
                : <SignUpForm handlers={handlers} onSwitchToSignIn={() => setIsSignIn(true)} />
              }
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Visual side — only md+ */}
      <div className="hidden md:flex relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-[#0B0B0F] to-purple-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(59,130,246,0.25)_0%,_transparent_70%)]" />

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "linear-gradient(#38384A 1px, transparent 1px), linear-gradient(90deg, #38384A 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        {/* Floating orbs */}
        <motion.div
          animate={{ y: [-20, 20, -20], scale: [1, 1.05, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-48 h-48 rounded-full bg-blue-600/20 blur-3xl"
        />
        <motion.div
          animate={{ y: [20, -20, 20], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-purple-600/15 blur-3xl"
        />

        {/* Hero image with interactive hover effects */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-8">
          <HoverImage src="/Login Screen.jpeg" alt="RPG Hero transformation" />

          {/* Quote panel below */}
          <motion.div
            className="mt-8 glass-panel rounded-2xl px-8 py-5 max-w-sm text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <blockquote className="text-lg font-medium text-[#E2E8F0] min-h-[2rem]">
              "<Typewriter key={String(isSignIn)} text={quotes} speed={60} loop delay={2500} />"
            </blockquote>
            <p className="text-xs text-[#94A3B8] mt-3 uppercase tracking-widest">ASCEND</p>
          </motion.div>

          {/* Stat pills */}
          <div className="flex gap-3 mt-5">
            {[
              { label: "Força", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" },
              { label: "Inteligência", color: "text-purple-400 border-purple-500/30 bg-purple-500/10" },
              { label: "Resistência", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" },
            ].map((s) => (
              <motion.div
                key={s.label}
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${s.color}`}
                whileHover={{ scale: 1.1, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {s.label}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
