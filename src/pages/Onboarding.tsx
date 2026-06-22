import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useHunterStore, type HunterClass, type HunterGender } from '../stores/useHunterStore';
import { supabase } from '../lib/supabase';
import { MatrixLoader } from '../components/ui/matrix-loader';
import {
  Shield, Sword, Book, Zap, ChevronRight, Lightbulb, Crown,
  User, Calendar, Ruler, Weight, Target, Brain, Dumbbell, Star,
  CheckCircle2, ArrowRight, Sparkles, Activity, ScanLine, Trophy,
  Maximize2, X
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type OnboardingStep =
  | 'loading'
  | 'basic-info'
  | 'physical-profile'
  | 'main-goal'
  | 'experience-level'
  | 'architect-intro'
  | 'class-quiz'
  | 'awakening'
  | 'class-selection';

interface FormData {
  fullName: string;
  birthday: string;
  gender: HunterGender | '';
  height: string;
  weightCurrent: string;
  weightTarget: string;
  trainingFocus: string;
  nutritionGoal: string;
  mainGoal: string;
  experienceLevel: string;
}

// ─── Dados do Questionário (narrativa do Arquiteto) ───────────────────────────
const QUESTIONS = [
  {
    id: 'q1',
    title: '"Quando você pensa em evoluir, o que te vem primeiro à mente?"',
    options: [
      { id: 'Warrior',  label: 'Superar meus limites físicos. Ser mais forte e inabalável.' },
      { id: 'Scholar',  label: 'Aprender. Dominar conhecimento e habilidades com precisão.' },
      { id: 'Creator',  label: 'Criar. Construir algo que inspire e impacte o mundo.' },
      { id: 'Monk',     label: 'Equilíbrio. Paz interior e harmonia entre corpo e mente.' },
      { id: 'Leader',   label: 'Liderar. Elevar as pessoas ao meu redor enquanto cresço.' },
    ],
  },
  {
    id: 'q2',
    title: '"Um obstáculo aparece na sua frente. Como você age?"',
    options: [
      { id: 'Warrior',  label: 'Enfrento de cabeça com força e determinação, sem recuar.' },
      { id: 'Scholar',  label: 'Estudo o problema a fundo e encontro a solução mais inteligente.' },
      { id: 'Creator',  label: 'Procuro um ângulo diferente. Encontro soluções que ninguém viu.' },
      { id: 'Monk',     label: 'Respiro fundo, me adapto e fluo ao redor dele como água.' },
      { id: 'Leader',   label: 'Mobilizo quem está ao meu redor. Juntos resolvemos mais rápido.' },
    ],
  },
  {
    id: 'q3',
    title: '"O que não pode faltar na sua rotina de evolução?"',
    options: [
      { id: 'Warrior',  label: 'Progressão constante de intensidade e superação de carga.' },
      { id: 'Scholar',  label: 'Registro metódico, análise de progresso e aprendizado diário.' },
      { id: 'Creator',  label: 'Espaço para criar, experimentar e expressar minhas ideias.' },
      { id: 'Monk',     label: 'Mobilidade, meditação e escuta do próprio corpo.' },
      { id: 'Leader',   label: 'Conexão com pessoas. Feedback, mentoria e relacionamentos.' },
    ],
  },
  {
    id: 'q4',
    title: '"Como você prefere ser lembrado por quem te conhece?"',
    options: [
      { id: 'Warrior',  label: 'Pela força física e conquistas que todo mundo consegue ver.' },
      { id: 'Scholar',  label: 'Pela clareza, inteligência e profundidade de conhecimento.' },
      { id: 'Creator',  label: 'Por ter criado algo que durou muito além de mim.' },
      { id: 'Monk',     label: 'Pela calma e equilíbrio mesmo sob pressão extrema.' },
      { id: 'Leader',   label: 'Por ter transformado a vida de quem caminhou comigo.' },
    ],
  },
  {
    id: 'q5',
    title: '"Qual dessas frases ressoa mais fundo em você?"',
    options: [
      { id: 'Warrior',  label: '"O ferro forja o guerreiro. A dor é combustível."' },
      { id: 'Scholar',  label: '"Conhecimento é poder absoluto. Cada página é uma arma."' },
      { id: 'Creator',  label: '"Quem cria, deixa marcas que o tempo não apaga."' },
      { id: 'Monk',     label: '"A mente em silêncio move montanhas invisíveis."' },
      { id: 'Leader',   label: '"Um verdadeiro líder caminha à frente, mas nunca sozinho."' },
    ],
  },
];

// ─── Classes ──────────────────────────────────────────────────────────────────
const CLASSES = [
  {
    id: 'Warrior' as HunterClass,
    name: 'WARRIOR',
    tagline: 'O Corpo é a Arma',
    description: 'Especialista em Força Bruta. Sua jornada é pavimentada por ferro e superação física.',
    icon: <Sword className="w-10 h-10 text-blue-400" />,
    color: 'border-blue-500/50 hover:border-blue-400',
    accent: 'text-blue-400',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
    image: '/Classes/Warrior/Rank E.jpeg',
    stats: 'FOR ▲▲▲  RES ▲▲  VIT ▲',
  },
  {
    id: 'Scholar' as HunterClass,
    name: 'SCHOLAR',
    tagline: 'A Mente é o Campo de Batalha',
    description: 'Mestre da Mente. Evolução pelo conhecimento, foco e disciplina intelectual.',
    icon: <Book className="w-10 h-10 text-purple-400" />,
    color: 'border-purple-500/50 hover:border-purple-400',
    accent: 'text-purple-400',
    glow: 'shadow-[0_0_30px_rgba(124,58,237,0.3)]',
    image: '/Classes/Scholar/Rank E.jpeg',
    stats: 'INT ▲▲▲  SAB ▲▲  DIS ▲',
  },
  {
    id: 'Creator' as HunterClass,
    name: 'CREATOR',
    tagline: 'Criar é Evoluir',
    description: 'Arquiteto de Mundos. Evolui construindo, expressando e inovando sem limites.',
    icon: <Sparkles className="w-10 h-10 text-amber-400" />,
    color: 'border-amber-500/50 hover:border-amber-400',
    accent: 'text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(251,191,36,0.3)]',
    image: '/Classes/Creator/Rank E.jpeg',
    stats: 'INT ▲▲  DIS ▲▲  SAB ▲',
  },
  {
    id: 'Monk' as HunterClass,
    name: 'MONK',
    tagline: 'O Equilíbrio é Poder',
    description: 'Harmonia Total. Busca a perfeição entre o corpo e a mente através da vitalidade.',
    icon: <Zap className="w-10 h-10 text-cyan-400" />,
    color: 'border-cyan-500/50 hover:border-cyan-400',
    accent: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
    image: '/Classes/Monk/Rank E.jpeg',
    stats: 'VIT ▲▲▲  EQU ▲▲  RES ▲',
  },
  {
    id: 'Leader' as HunterClass,
    name: 'LEADER',
    tagline: 'Quem Lidera, Multiplica',
    description: 'Comandante Supremo. Cresce elevando os que estão ao seu redor.',
    icon: <Crown className="w-10 h-10 text-rose-400" />,
    color: 'border-rose-500/50 hover:border-rose-400',
    accent: 'text-rose-400',
    glow: 'shadow-[0_0_30px_rgba(244,63,94,0.3)]',
    image: '/Classes/Leader/Rank E.jpeg',
    stats: 'DIS ▲▲▲  SAB ▲▲  EQU ▲',
  },
];

const RANK_DESCRIPTIONS: Record<HunterClass, Record<string, string>> = {
  Warrior: {
    E: "Soldado Recruta. Força física ligeiramente elevada. O início de sua pavimentação por ferro.",
    D: "Guerreiro de Vanguarda. Corpo blindado capaz de suportar impactos diretos de mana.",
    C: "Cavaleiro do Caos. Domínio excelente de combate a curta distância e golpes destruidores.",
    B: "Paladino da Ruína. A força física gera ondas de choque destrutivas ao colidir.",
    A: "Warlord Titã. Um exército de um homem só capaz de limpar fendas de alto nível sozinho.",
    S: "Monarca do Ferro. O ápice da força inabalável. Nada no universo pode romper sua armadura."
  },
  Scholar: {
    E: "Aprendiz de Mana. Percepção sensorial e leitura inicial do fluxo oculto de energia.",
    D: "Mago Incipiente. Foco mental afiado e raciocínio lógico sob pressão extrema.",
    C: "Sabedor das Runas. Decifração de escritas proibidas e conjuração de feitiços médios.",
    B: "Arquimago do Conhecimento. Domínio de feitiços complexos e estratégias profundas de evolução.",
    A: "Sábio Dimensional. Distorção das leis físicas simples e manipulação de espaço-tempo.",
    S: "Arquivista do Destino. Conhecimento absoluto do Sistema. Sua mente calcula todas as variáveis do universo."
  },
  Creator: {
    E: "Artesão Iniciante. Criação de ferramentas rudimentares e prototipagem rápida de hábitos.",
    D: "Inventor do Sistema. Planejamento geométrico de rotinas de alta durabilidade.",
    C: "Forjador de Runas. Criação de itens de suporte que auxiliam na jornada e aumentam a produtividade.",
    B: "Engenheiro de Mana. Automação de processos cognitivos e rotinas de evolução em lote.",
    A: "Arquiteto da Fenda. Manipulação espacial de áreas personalizadas de treino corporal.",
    S: "Criador do Vazio. Capacidade de manifestar e forjar qualquer realidade através da mana pura."
  },
  Monk: {
    E: "Iniciado do Templo. Respiração controlada e meditação básica para equilíbrio inicial.",
    D: "Monge da Brisa. Agilidade física aprimorada e flexibilidade muscular.",
    C: "Guerreiro Espiritual. Alinhamento perfeito permitindo cura e remoção rápida de fadiga física.",
    B: "Mestre do Qi. Manipulação interna de energia vital para imunidade a desgastes diários.",
    A: "Asceta Iluminado. Estado mental inabalável e imunidade completa à fadiga psicológica.",
    S: "Monarca do Nirvana. Controle biológico perfeito. Sua vitalidade e energia de mana tornam-se infinitas."
  },
  Leader: {
    E: "Líder de Esquadrão. Orientação de pequenos grupos e compartilhamento de metas de evolução.",
    D: "Comandante de Campo. Capacidade de inspirar persistência e disciplina nos companheiros.",
    C: "Estrategista de Guilda. Coordenação de equipes para maximizar o rendimento coletivo.",
    B: "General das Fendas. Habilidade tática superior para liderar campanhas complexas de evolução.",
    A: "Soberano da Aliança. Influência massiva guiando guildas inteiras em direção ao progresso.",
    S: "Imperador do Destino. Autoridade soberana. Sua presença eleva o poder de todos ao redor a níveis lendários."
  }
};

const AWAKENING_MESSAGES = [
  'Inicializando protocolo de avaliação...',
  'Lendo assinatura de mana...',
  'Analisando bio-sinais do caçador...',
  'Sincronizando com a Fenda...',
  'Padrão identificado na linha S...',
  'Classe determinada pelo Arquiteto.',
];

const RITUAL_STEPS: Array<{ id: Exclude<OnboardingStep, 'loading'>; label: string; phase: string }> = [
  { id: 'basic-info', label: 'Calibração de Identidade', phase: 'Fase I' },
  { id: 'physical-profile', label: 'Análise Corporal', phase: 'Fase II' },
  { id: 'main-goal', label: 'Missão Central', phase: 'Fase III' },
  { id: 'experience-level', label: 'Calibração de Rank', phase: 'Fase IV' },
  { id: 'architect-intro', label: 'Contato do Arquiteto', phase: 'Fase V' },
  { id: 'class-quiz', label: 'Avaliação do Sistema', phase: 'Fase VI' },
  { id: 'awakening', label: 'Síntese de Mana', phase: 'Fase VII' },
  { id: 'class-selection', label: 'Despertar da Classe', phase: 'Fase VIII' },
];

const RITUAL_PARTICLES = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  left: `${6 + ((index * 19) % 88)}%`,
  top: `${8 + ((index * 31) % 82)}%`,
  delay: `${(index % 7) * 0.3}s`,
}));

const getRitualProgress = (step: OnboardingStep, currentQuestionIndex: number) => {
  if (step === 'loading') return 0;
  const baseIndex = RITUAL_STEPS.findIndex(item => item.id === step);
  if (baseIndex < 0) return 0;
  const baseProgress = (baseIndex / RITUAL_STEPS.length) * 100;
  if (step === 'class-quiz') {
    return Math.round(baseProgress + ((currentQuestionIndex + 1) / QUESTIONS.length) * (100 / RITUAL_STEPS.length));
  }
  if (step === 'awakening') return 92;
  if (step === 'class-selection') return 100;
  return Math.round(((baseIndex + 1) / RITUAL_STEPS.length) * 100);
};

const getCurrentRitual = (step: OnboardingStep) =>
  RITUAL_STEPS.find(item => item.id === step) || RITUAL_STEPS[0];

// ─── Componente OptionCard ────────────────────────────────────────────────────
function OptionCard({
  label,
  isSelected,
  onClick,
  icon,
  delay = 0,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      role="button"
      aria-pressed={isSelected}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 p-4 rounded-xl border-l-4 cursor-pointer select-none overflow-hidden
        transition-all duration-200 ease-out active:scale-[0.99]
        ${isSelected
          ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_24px_rgba(124,58,237,0.42)] ring-1 ring-purple-500/50'
          : 'bg-purple-950/30 border-purple-700/60 hover:bg-purple-900/40 hover:border-purple-500 hover:shadow-[0_0_18px_rgba(124,58,237,0.18)]'}
      `}
    >
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_12%_50%,rgba(124,58,237,0.18),transparent_38%)] pointer-events-none" />
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <p className={`relative text-sm font-medium leading-snug flex-1 ${isSelected ? 'text-purple-100' : 'text-purple-200/80'}`}>
        {label}
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.6 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
      </motion.div>
      {isSelected && (
        <>
          <motion.div layoutId="option-glow" className="absolute inset-0 rounded-xl bg-purple-500/10 pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-3 top-2 text-[8px] font-orbitron uppercase tracking-[0.24em] text-purple-300/70"
          >
            Registrado
          </motion.div>
        </>
      )}
    </motion.div>
  );
}

// ─── Componente StepHeader ────────────────────────────────────────────────────
function StepHeader({ step, total, label, progress }: { step: number; total: number; label: string; progress?: number }) {
  return (
    <div className="space-y-4 text-center mb-8">
      {typeof progress === 'number' && (
        <div className="mx-auto max-w-sm rounded-2xl border border-purple-500/20 bg-purple-950/20 p-3 shadow-[0_0_24px_rgba(124,58,237,0.12)]">
          <div className="mb-2 flex items-center justify-between text-[9px] font-orbitron uppercase tracking-[0.22em] text-purple-400">
            <span className="flex items-center gap-1.5"><ScanLine className="w-3 h-3" /> Sincronização</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-purple-950/70">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_14px_rgba(124,58,237,0.65)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <motion.div
            key={i}
            className={`h-0.5 rounded-full transition-all duration-500 ${i < step ? 'bg-purple-400 w-8' : i === step - 1 ? 'bg-purple-500 w-12' : 'bg-purple-900/60 w-4'}`}
          />
        ))}
      </div>
      <span className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">
        Etapa {step} de {total} · {label}
      </span>
    </div>
  );
}

function DecisionFeedback({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-purple-500/25 bg-purple-500/10 px-4 py-2 text-[10px] font-orbitron uppercase tracking-[0.18em] text-purple-200 shadow-[0_0_24px_rgba(124,58,237,0.18)]"
        >
          <Activity className="w-3 h-3 text-purple-300" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hunterClass, setHunterClass } = useHunterStore();

  const [step, setStep] = useState<OnboardingStep>('loading');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealedClass, setRevealedClass] = useState<HunterClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<HunterClass | null>(null);
  const [awakeningMsgIdx, setAwakeningMsgIdx] = useState(0);
  const [decisionFeedback, setDecisionFeedback] = useState<string | null>(null);

  const [previewClassId, setPreviewClassId] = useState<HunterClass | null>(null);
  const [previewRank, setPreviewRank] = useState<'E' | 'D' | 'C' | 'B' | 'A' | 'S'>('E');

  const [form, setForm] = useState<FormData>({
    fullName: '',
    birthday: '',
    gender: '',
    height: '',
    weightCurrent: '',
    weightTarget: '',
    trainingFocus: '',
    nutritionGoal: 'maintain',
    mainGoal: '',
    experienceLevel: '',
  });

  useEffect(() => {
    if (hunterClass) {
      const t = setTimeout(() => navigate('/'), 1500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setStep('basic-info'), 3500);
      return () => clearTimeout(t);
    }
  }, [hunterClass, navigate]);

  // Animação de messages no awakening
  useEffect(() => {
    if (step !== 'awakening') return;
    const interval = setInterval(() => {
      setAwakeningMsgIdx(prev => {
        if (prev >= AWAKENING_MESSAGES.length - 1) {
          clearInterval(interval);
          setTimeout(() => setStep('class-selection'), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 750);
    return () => clearInterval(interval);
  }, [step]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const registerDecision = <K extends keyof FormData>(key: K, value: FormData[K], message: string) => {
    setField(key, value);
    setDecisionFeedback(message);
  };

  useEffect(() => {
    if (!decisionFeedback) return;
    const t = setTimeout(() => setDecisionFeedback(null), 1800);
    return () => clearTimeout(t);
  }, [decisionFeedback]);

  const calculateSuggestedClass = (): HunterClass => {
    const counts: Record<string, number> = { Warrior: 0, Scholar: 0, Creator: 0, Monk: 0, Leader: 0 };
    Object.values(answers).forEach(val => { if (counts[val] !== undefined) counts[val]++; });
    let topClass: HunterClass = 'Warrior';
    let max = 0;
    Object.entries(counts).forEach(([cls, count]) => {
      if (count > max) { max = count; topClass = cls as HunterClass; }
    });
    return topClass;
  };

  const handleSaveBasicInfo = async () => {
    if (!user || !form.fullName || !form.gender) return;
    await supabase.from('profiles').update({
      full_name: form.fullName,
      birthday: form.birthday || null,
      gender: form.gender || null,
    }).eq('id', user.id);
    setStep('physical-profile');
  };

  const handleSavePhysicalProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').update({
      height: form.height ? parseFloat(form.height) : null,
      weight_current: form.weightCurrent ? parseFloat(form.weightCurrent) : null,
      weight_target: form.weightTarget ? parseFloat(form.weightTarget) : null,
      training_focus: form.trainingFocus || null,
      nutrition_goal: form.nutritionGoal || 'maintain',
    }).eq('id', user.id);
    setStep('main-goal');
  };

  const handleSaveMainGoal = async () => {
    if (!user || !form.mainGoal) return;
    await supabase.from('profiles').update({ main_goal: form.mainGoal }).eq('id', user.id);
    setStep('experience-level');
  };

  const handleSaveExperience = async () => {
    if (!user || !form.experienceLevel) return;
    await supabase.from('profiles').update({ experience_level: form.experienceLevel }).eq('id', user.id);
    setStep('architect-intro');
  };

  const handleSelectQuizOption = (value: string) => {
    const questionId = QUESTIONS[currentQuestionIndex].id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setDecisionFeedback('Resposta registrada. Assinatura de classe atualizada.');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const suggested = calculateSuggestedClass();
      setRevealedClass(suggested);
      setSelectedClass(suggested);
      setStep('awakening');
    }
  };

  const handleConfirmClass = async () => {
    if (!user || !selectedClass) return;
    await setHunterClass(selectedClass, user.id);
    localStorage.setItem('ascend_just_finished_onboarding', 'true');
    navigate('/');
  };

  const currentAnswer = answers[QUESTIONS[currentQuestionIndex]?.id];
  const ritualProgress = getRitualProgress(step, currentQuestionIndex);
  const currentRitual = getCurrentRitual(step);
  const revealedClassData = CLASSES.find(c => c.id === revealedClass);

  return (
    <div className="relative min-h-screen bg-[#0B0B0F] text-white flex flex-col items-center justify-start pt-24 pb-12 px-6 overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_16%,rgba(124,58,237,0.12),transparent_32%),radial-gradient(circle_at_18%_82%,rgba(59,130,246,0.09),transparent_28%)]" />
      {RITUAL_PARTICLES.map(particle => (
        <span
          key={particle.id}
          className="onboarding-ritual-particle absolute h-1 w-1 rounded-full bg-purple-400/60 shadow-[0_0_14px_rgba(124,58,237,0.8)]"
          style={{ left: particle.left, top: particle.top, animationDelay: particle.delay }}
        />
      ))}
      {step !== 'loading' && (
        <div className="pointer-events-none absolute left-1/2 top-5 z-20 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-purple-500/20 bg-[#0B0B0F]/70 px-4 py-2 backdrop-blur-xl md:flex">
          <span className="text-[9px] font-orbitron uppercase tracking-[0.24em] text-purple-500">{currentRitual.phase}</span>
          <span className="h-1 w-1 rounded-full bg-purple-500" />
          <span className="text-[9px] font-orbitron uppercase tracking-[0.24em] text-gray-500">{currentRitual.label}</span>
          <span className="h-1 w-1 rounded-full bg-purple-500" />
          <span className="text-[9px] font-orbitron uppercase tracking-[0.24em] text-purple-400">{ritualProgress}%</span>
        </div>
      )}
      <AnimatePresence mode="wait">

        {/* ── LOADING ── */}
        {step === 'loading' && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
            <MatrixLoader />
          </motion.div>
        )}

        {/* ── ETAPA 1: INFORMAÇÕES BÁSICAS ── */}
        {step === 'basic-info' && (
          <motion.div key="basic-info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="max-w-lg w-full">
            <StepHeader step={1} total={8} label="Calibração Biológica" progress={ritualProgress} />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Protocolo de Identificação</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-white leading-tight">
                O Sistema precisa reconhecer o <span className="text-purple-400">Caçador</span>.
              </h1>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Sua assinatura inicial será gravada antes da abertura da primeira Fenda.
              </p>
            </div>

            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">
                  <User className="w-3 h-3" /> Nome do Caçador
                </label>
                <input
                  type="text"
                  placeholder="Seu nome verdadeiro..."
                  value={form.fullName}
                  onChange={e => setField('fullName', e.target.value)}
                  className="w-full bg-[#13131A] border border-purple-900/60 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium"
                />
              </div>

              {/* Data de Nascimento */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" /> Data de Nascimento
                </label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={e => setField('birthday', e.target.value)}
                  className="w-full bg-[#13131A] border border-purple-900/60 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  style={{ colorScheme: 'inherit' }}
                />
              </div>

              {/* Gênero */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">
                  <Shield className="w-3 h-3" /> Sexo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'male', label: 'Masculino', icon: '♂' },
                    { value: 'female', label: 'Feminino', icon: '♀' },
                  ].map(opt => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => registerDecision('gender', opt.value as HunterGender, `Sexo ${opt.label.toLowerCase()} registrado pelo Sistema`)}
                      className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all duration-150 ${
                        form.gender === opt.value
                          ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_20px_rgba(124,58,237,0.3)]'
                          : 'bg-purple-950/20 border-purple-900/60 hover:border-purple-700'
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <span className={`text-sm font-orbitron font-bold ${form.gender === opt.value ? 'text-purple-200' : 'text-gray-500'}`}>
                        {opt.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
                <DecisionFeedback message={decisionFeedback} />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <AnimatePresence>
                {form.fullName.trim() && form.gender && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={handleSaveBasicInfo}
                    className="btn-next-step"
                  >
                    <span>PRÓXIMO PASSO</span>
                    <ChevronRight strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── ETAPA 2: PERFIL FÍSICO ── */}
        {step === 'physical-profile' && (
          <motion.div key="physical" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="max-w-lg w-full">
            <StepHeader step={2} total={8} label="Análise Corporal" progress={ritualProgress} />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Varredura Biométrica</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold leading-tight">
                O Sistema está lendo sua <span className="text-purple-400">base física</span>.
              </h1>
              <p className="text-sm text-gray-500">Cada métrica ajusta a dificuldade das primeiras missões.</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'height', label: 'Altura (cm)', placeholder: '175', icon: <Ruler className="w-3 h-3" /> },
                  { key: 'weightCurrent', label: 'Peso Atual (kg)', placeholder: '80', icon: <Weight className="w-3 h-3" /> },
                  { key: 'weightTarget', label: 'Peso Meta (kg)', placeholder: '75', icon: <Target className="w-3 h-3" /> },
                ].map(field => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[9px] font-orbitron text-purple-400 uppercase tracking-widest">
                      {field.icon} {field.label}
                    </label>
                    <input
                      type="number"
                      placeholder={field.placeholder}
                      value={form[field.key as keyof FormData]}
                      onChange={e => setField(field.key as keyof FormData, e.target.value)}
                      className="w-full bg-[#13131A] border border-purple-900/60 rounded-xl px-3 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-all text-center font-orbitron font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">
                  <Target className="w-3 h-3" /> Objetivo Nutricional
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'lose', label: 'Perder peso' },
                    { value: 'maintain', label: 'Manter peso' },
                    { value: 'gain', label: 'Ganhar peso' },
                  ].map(goal => (
                    <motion.button
                      key={goal.value}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => registerDecision('nutritionGoal', goal.value, `Objetivo nutricional sincronizado: ${goal.label}`)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        form.nutritionGoal === goal.value
                          ? 'bg-purple-500/20 border-purple-400 text-purple-100'
                          : 'bg-purple-950/20 border-purple-900/60 text-gray-400 hover:border-purple-700'
                      }`}
                    >
                      {goal.label}
                    </motion.button>
                  ))}
                </div>
                <DecisionFeedback message={decisionFeedback} />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-orbitron text-purple-400 uppercase tracking-widest">
                  <Dumbbell className="w-3 h-3" /> Foco de Treino
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Musculação', 'Funcional', 'Cardio / Endurance', 'Esportes de Combate', 'Calistenia', 'Flexibilidade / Yoga'].map(focus => (
                    <motion.button
                      key={focus}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => registerDecision('trainingFocus', focus, `Foco de treino registrado: ${focus}`)}
                      className={`text-left px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                        form.trainingFocus === focus
                          ? 'bg-purple-500/20 border-purple-400 text-purple-100'
                          : 'bg-purple-950/20 border-purple-900/60 text-gray-400 hover:border-purple-700'
                      }`}
                    >
                      {focus}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <motion.button
                onClick={handleSavePhysicalProfile}
                className="btn-next-step"
              >
                <span>PRÓXIMO PASSO</span>
                <ChevronRight strokeWidth={3} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── ETAPA 3: OBJETIVO PRINCIPAL ── */}
        {step === 'main-goal' && (
          <motion.div key="main-goal" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="max-w-lg w-full">
            <StepHeader step={3} total={8} label="Missão Central" progress={ritualProgress} />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Missão Central</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold leading-tight">
                O Sistema detectou múltiplos caminhos. Qual representa sua <span className="text-purple-400">essência</span>?
              </h1>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Esta escolha define o primeiro eixo das suas quests de evolução.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'general', label: 'Evolução Geral', sub: 'Quero crescer em todas as áreas da vida.', icon: <Star className="w-5 h-5" /> },
                { value: 'health', label: 'Performance & Saúde', sub: 'Foco em físico, energia e saúde duradoura.', icon: <Dumbbell className="w-5 h-5" /> },
                { value: 'finance', label: 'Independência Financeira', sub: 'Construir riqueza e liberdade financeira real.', icon: <Target className="w-5 h-5" /> },
                { value: 'career', label: 'Carreira & Habilidades', sub: 'Dominar minha área e avançar na carreira.', icon: <Brain className="w-5 h-5" /> },
              ].map((opt, idx) => (
                <OptionCard
                  key={opt.value}
                  label={`${opt.label} — ${opt.sub}`}
                  isSelected={form.mainGoal === opt.value}
                  onClick={() => registerDecision('mainGoal', opt.value, `Missão central travada: ${opt.label}`)}
                  icon={<span className={`${form.mainGoal === opt.value ? 'text-purple-300' : 'text-purple-600'}`}>{opt.icon}</span>}
                  delay={idx * 0.06}
                />
              ))}
            </div>
            <DecisionFeedback message={decisionFeedback} />

            <div className="mt-8 flex justify-end">
              <AnimatePresence>
                {form.mainGoal && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={handleSaveMainGoal}
                    className="btn-next-step"
                  >
                    <span>PRÓXIMO PASSO</span>
                    <ChevronRight strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── ETAPA 4: NÍVEL DE EXPERIÊNCIA ── */}
        {step === 'experience-level' && (
          <motion.div key="experience" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="max-w-lg w-full">
            <StepHeader step={4} total={8} label="Calibração de Rank" progress={ritualProgress} />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Calibração de Rank</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold leading-tight">
                Informe seu <span className="text-purple-400">Rank</span> inicial para calibrar a ameaça.
              </h1>
              <p className="text-sm text-gray-500">O Sistema ajustará as primeiras missões sem quebrar seu ritmo.</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 'beginner', rank: 'E', label: 'Iniciante', sub: 'Começando agora. Cada passo conta.', color: 'text-gray-400' },
                { value: 'intermediate', rank: 'C', label: 'Intermediário', sub: 'Tenho consistência. Quero ir além.', color: 'text-blue-400' },
                { value: 'advanced', rank: 'S', label: 'Avançado', sub: 'Alta performance. Busco o limite máximo.', color: 'text-purple-400' },
              ].map((opt, idx) => (
                <OptionCard
                  key={opt.value}
                  label={`[Rank ${opt.rank}] ${opt.label} — ${opt.sub}`}
                  isSelected={form.experienceLevel === opt.value}
                  onClick={() => registerDecision('experienceLevel', opt.value, `Rank ${opt.rank} aceito pelo Sistema`)}
                  delay={idx * 0.07}
                />
              ))}
            </div>
            <DecisionFeedback message={decisionFeedback} />

            <div className="mt-8 flex justify-end">
              <AnimatePresence>
                {form.experienceLevel && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    onClick={handleSaveExperience}
                    className="btn-next-step"
                  >
                    <span>AVANÇAR</span>
                    <ChevronRight strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* ── O ARQUITETO: INTRODUÇÃO ── */}
        {step === 'architect-intro' && (
          <motion.div
            key="architect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-xl w-full text-center space-y-8"
          >
            {/* Glow de fundo */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-900/20 blur-[120px]" />
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
              className="w-20 h-20 mx-auto rounded-full bg-purple-900/40 border border-purple-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.5)]"
            >
              <Lightbulb className="w-10 h-10 text-purple-300" />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="space-y-4">
              <p className="text-[10px] font-orbitron text-purple-500 tracking-[0.4em] uppercase">Transmissão Recebida</p>
              <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white leading-tight">
                Eu sou o <span className="text-purple-400">Arquiteto</span>.
              </h2>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }} className="space-y-5">
              {[
                'Fui eu quem construiu o sistema das Fendas. Fui eu quem deu a caçadores como Sung Jin-Woo uma segunda chance.',
                'Agora, eu te ofereço a mesma oportunidade.',
                'Mas para calibrar seu poder, preciso entender do que você é feito.',
                '"Responda com honestidade. O sistema não mente — e você também não deveria."',
              ].map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + i * 0.25 }}
                  className={`text-sm leading-relaxed ${i === 3 ? 'text-purple-300 italic font-medium border-l-2 border-purple-500 pl-4 text-left' : 'text-gray-400'}`}
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.4 }}
              onClick={() => setStep('class-quiz')}
              className="btn-next-step mx-auto"
            >
              <span>ACEITAR O DESAFIO</span>
              <ArrowRight strokeWidth={3} />
            </motion.button>
          </motion.div>
        )}

        {/* ── QUESTIONÁRIO DE CLASSES ── */}
        {step === 'class-quiz' && (
          <motion.div
            key="class-quiz"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            className="max-w-2xl w-full flex flex-col items-center gap-8"
          >

            {/* Progresso */}
            <div className="w-full space-y-3 text-center">
              <div className="mx-auto max-w-md rounded-2xl border border-purple-500/20 bg-purple-950/20 p-3">
                <div className="mb-2 flex items-center justify-between text-[9px] font-orbitron uppercase tracking-[0.22em] text-purple-400">
                  <span className="flex items-center gap-1.5"><ScanLine className="w-3 h-3" /> Avaliação do Sistema</span>
                  <span>{ritualProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-purple-950/70">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500 shadow-[0_0_14px_rgba(124,58,237,0.65)]"
                    animate={{ width: `${ritualProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">
                Avaliação do Arquiteto · {currentQuestionIndex + 1} / {QUESTIONS.length}
              </span>
              <div className="flex gap-1 justify-center">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i < currentQuestionIndex ? 'bg-purple-400 w-10' : i === currentQuestionIndex ? 'bg-purple-500 w-14' : 'bg-purple-900/40 w-6'}`} />
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.h2
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-xl md:text-2xl font-orbitron font-bold text-white leading-tight"
                >
                  {QUESTIONS[currentQuestionIndex].title}
                </motion.h2>
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="w-full space-y-2.5"
              >
                {QUESTIONS[currentQuestionIndex].options.map((opt, idx) => (
                  <OptionCard
                    key={opt.id}
                    label={opt.label}
                    isSelected={currentAnswer === opt.id}
                    onClick={() => handleSelectQuizOption(opt.id)}
                    delay={idx * 0.055}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
            <DecisionFeedback message={decisionFeedback} />

            <AnimatePresence>
              {currentAnswer && (
                <motion.button
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleNextQuestion}
                  className="btn-next-step"
                >
                  <span>
                    {currentQuestionIndex === QUESTIONS.length - 1 ? 'REVELAR MEU CAMINHO' : 'PRÓXIMA QUESTÃO'}
                  </span>
                  <ChevronRight strokeWidth={3} />
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── TELA DE DESPERTAR ── */}
        {step === 'awakening' && (
          <motion.div
            key="awakening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative max-w-lg w-full text-center space-y-8"
          >
            {/* Glow de fundo pulsante */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-900/30 blur-[100px]" />
            </motion.div>

            {/* Anel pulsante */}
            <div className="relative flex items-center justify-center mx-auto w-32 h-32">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full border border-purple-500/40"
                  animate={{ scale: [1, 1.5 + i * 0.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                />
              ))}
              <div className="w-24 h-24 rounded-full bg-purple-900/60 border border-purple-500/60 flex items-center justify-center shadow-[0_0_60px_rgba(124,58,237,0.6)]">
                <Sparkles className="w-12 h-12 text-purple-300" />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-orbitron text-purple-500 tracking-[0.4em] uppercase">Sistema de Avaliação · Solo Leveling</p>
              <h2 className="text-2xl font-orbitron font-bold text-white">Analisando Caçador...</h2>

              {/* Mensagens de loading */}
              <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={awakeningMsgIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-purple-300/70 font-mono"
                  >
                    &gt; {AWAKENING_MESSAGES[awakeningMsgIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              {/* Barra de progresso */}
              <div className="w-64 mx-auto h-1 bg-purple-900/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((awakeningMsgIdx + 1) / AWAKENING_MESSAGES.length) * 100}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </div>

              {/* Linhas de lore */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-xs text-gray-600 italic mt-4"
              >
                "O sistema não escolhe os fracos. Ele revela os escolhidos."
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                className="text-[10px] text-gray-700 font-mono"
              >
                — O Arquiteto, Solo Leveling
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* ── SELEÇÃO DE CLASSE ── */}
        {step === 'class-selection' && (
          <motion.div
            key="classes"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl w-full text-center space-y-10"
          >
            {/* Header */}
            <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Resultado da Avaliação · Sistema do Arquiteto</p>
              <h1 className="text-3xl md:text-4xl font-orbitron font-bold text-white tracking-tight">
                Classe despertada:{' '}
                <motion.span
                  className="text-purple-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: [0.8, 1.12, 1] }}
                  transition={{ delay: 0.5, duration: 0.65, type: 'spring' }}
                >
                  {revealedClass}
                </motion.span>
              </h1>
              <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
                O Sistema identificou sua essência. Confirme o despertar ou escolha outro caminho antes de entrar na Fenda.
              </p>
              <p className="text-[11px] text-purple-600/60 italic font-mono">
                "A fraqueza não é uma limitação. É um ponto de partida." — Arquiteto, Solo Leveling
              </p>
            </motion.div>

            {revealedClassData && (
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.35, duration: 0.55, type: 'spring', stiffness: 170, damping: 18 }}
                className="relative mx-auto grid max-w-3xl overflow-hidden rounded-3xl border border-purple-500/30 bg-purple-950/20 p-4 text-left shadow-[0_0_60px_rgba(124,58,237,0.28)] md:grid-cols-[180px_1fr] md:p-5"
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_28%,rgba(124,58,237,0.28),transparent_34%),linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]"
                  animate={{ opacity: [0.45, 0.8, 0.45] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                />
                <div
                  onClick={() => {
                    setPreviewClassId(revealedClassData.id);
                    setPreviewRank('E');
                  }}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 cursor-pointer group/img transition-all"
                >
                  <img
                    src={revealedClassData.image}
                    alt={revealedClassData.name}
                    className="h-56 w-full object-cover md:h-full transition-transform duration-500 group-hover/img:scale-105"
                    style={{ imageRendering: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 rounded-full border border-purple-400/40 bg-purple-600/30 px-3 py-1 text-[9px] font-orbitron uppercase tracking-[0.2em] text-purple-100">
                    Desbloqueado
                  </div>
                  <div className="absolute top-3 right-3 rounded-full p-2 bg-black/60 border border-white/10 text-white/70 hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover/img:opacity-100 md:opacity-100">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="relative flex flex-col justify-center p-4 md:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/40 shadow-inner">
                      {revealedClassData.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-orbitron uppercase tracking-[0.24em] text-purple-400">Conquista de despertar</p>
                      <h2 className={`font-orbitron text-2xl font-bold ${revealedClassData.accent}`}>{revealedClassData.name}</h2>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-400">{revealedClassData.description}</p>
                  <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                    <p className="mb-1 text-[9px] font-orbitron uppercase tracking-[0.22em] text-gray-600">Atributos iniciais</p>
                    <p className="font-mono text-xs tracking-wider text-purple-200">{revealedClassData.stats}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-orbitron uppercase tracking-[0.2em] text-purple-300">
                    <Trophy className="w-4 h-4" />
                    Sua classe acabou de despertar.
                  </div>
                </div>
              </motion.div>
            )}

            {/* Grid de classes */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {CLASSES.map((c, idx) => {
                const isSuggested = revealedClass === c.id;
                const isSelected = selectedClass === c.id;
                return (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.05, y: -8, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ opacity: { delay: 0.15 + idx * 0.08 }, y: { delay: 0.15 + idx * 0.08 } }}
                    onClick={() => {
                      setSelectedClass(c.id);
                      setDecisionFeedback(`${c.name} selecionado para despertar`);
                    }}
                    className={`
                      relative glass-panel p-5 flex flex-col items-center gap-4 group
                      border-2 transition-colors duration-200 ${c.color} ${isSuggested ? c.glow : ''}
                      ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0B0B0F]' : ''}
                    `}
                  >
                    {isSuggested && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute -top-3 bg-purple-600 text-white text-[8px] font-orbitron uppercase tracking-widest px-2.5 py-1 rounded-full shadow-[0_0_12px_rgba(124,58,237,0.6)]"
                      >
                        ✦ Recomendado
                      </motion.div>
                    )}

                    <div className="p-3 rounded-full bg-black/40 border border-white/10 shadow-inner">
                      {c.icon}
                    </div>

                    <div className="space-y-1 text-center">
                      <h3 className={`font-orbitron font-bold text-base ${c.accent}`}>{c.name}</h3>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">{c.tagline}</p>
                    </div>

                    {/* Imagem ou placeholder */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewClassId(c.id);
                        setPreviewRank('E');
                      }}
                      className="w-full aspect-[3/4] relative rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors cursor-zoom-in group/img"
                    >
                      {c.image ? (
                        <>
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                            style={{ imageRendering: 'auto' }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute top-2 right-2 rounded-full p-1.5 bg-black/60 border border-white/10 text-white/50 group-hover/img:text-white transition-all opacity-0 group-hover/img:opacity-100">
                            <Maximize2 className="w-3 h-3" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-black/40 gap-2">
                          {c.icon}
                          <p className="text-[9px] text-gray-600 font-orbitron uppercase tracking-widest">Em breve</p>
                        </div>
                      )}
                    </div>

                    <p className="text-[8px] text-gray-600 font-mono tracking-wider">{c.stats}</p>

                    <p className="text-[9px] text-gray-500 leading-relaxed text-center">{c.description}</p>
                  </motion.button>
                );
              })}
            </div>

            <DecisionFeedback message={decisionFeedback} />

            {/* Botão de Confirmação */}
            <div className="flex justify-center pt-4">
              <AnimatePresence>
                {selectedClass && (
                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    onClick={handleConfirmClass}
                    className="btn-next-step"
                  >
                    <span>DESPERTAR PODER</span>
                    <Sparkles strokeWidth={2} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Lightbox para Visualização das Artes e Ranks */}
        <AnimatePresence>
          {previewClassId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewClassId(null)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0B0F]/95 p-4 md:p-6 backdrop-blur-md overflow-y-auto"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl rounded-3xl border border-purple-500/30 bg-[#13131A] p-5 shadow-[0_0_80px_rgba(124,58,237,0.35)] md:p-8 grid md:grid-cols-12 gap-6 items-center"
              >
                {/* Botão Fechar */}
                <button
                  onClick={() => setPreviewClassId(null)}
                  className="absolute top-4 right-4 rounded-full border border-purple-500/20 bg-purple-950/40 p-2 text-purple-400 hover:text-white hover:border-purple-400/50 hover:bg-purple-900/60 transition-all z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Lado Esquerdo: Imagem da Classe no Rank Selecionado */}
                <div className="md:col-span-6 relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-[0_0_30px_rgba(124,58,237,0.15)] flex items-center justify-center">
                  <motion.img
                    key={`${previewClassId}-${previewRank}`}
                    initial={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 0.4 }}
                    src={`/Classes/${previewClassId}/Rank ${previewRank}.jpeg`}
                    alt={`${previewClassId} Rank ${previewRank}`}
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Badge do Rank */}
                  <div className={`absolute bottom-4 left-4 rank-badge rank-${previewRank.toLowerCase()} text-xs font-orbitron tracking-widest px-3 py-1.5`}>
                    RANK {previewRank}
                  </div>
                </div>

                {/* Lado Direito: Informações e Seletores */}
                <div className="md:col-span-6 flex flex-col justify-between h-full space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Evolução de Classe</span>
                    </div>
                    <h2 className="font-orbitron text-3xl font-extrabold text-white tracking-tight uppercase">
                      {CLASSES.find(c => c.id === previewClassId)?.name}
                    </h2>
                    <p className="text-sm font-medium text-purple-300/80 font-orbitron tracking-wider mt-1">
                      {CLASSES.find(c => c.id === previewClassId)?.tagline}
                    </p>
                  </div>

                  {/* Seletor de Ranks */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-orbitron uppercase tracking-widest text-gray-500">Selecione o Nível de Rank</p>
                    <div className="grid grid-cols-6 gap-2">
                      {(['E', 'D', 'C', 'B', 'A', 'S'] as const).map((rk) => {
                        const isCurrent = previewRank === rk;
                        return (
                          <button
                            key={rk}
                            onClick={() => setPreviewRank(rk)}
                            className={`
                              py-2.5 rounded-xl font-orbitron text-sm font-bold border transition-all duration-200
                              ${isCurrent
                                ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(124,58,237,0.6)] scale-105'
                                : 'bg-purple-950/20 border-purple-900/40 text-purple-300/50 hover:border-purple-500 hover:text-purple-300'}
                            `}
                          >
                            {rk}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Descrição Dinâmica do Rank */}
                  <div className="rounded-2xl border border-white/10 bg-black/40 p-5 space-y-2">
                    <p className="text-[9px] font-orbitron uppercase tracking-[0.2em] text-purple-400">Atributo & Potencial de Mana</p>
                    <p className="text-sm text-gray-300 leading-relaxed min-h-[72px]">
                      {RANK_DESCRIPTIONS[previewClassId]?.[previewRank] || ""}
                    </p>
                  </div>

                  <div className="text-[10px] text-gray-600 font-mono tracking-wider text-center md:text-left">
                    Use o seletor para vislumbrar seu poder futuro no Rank S.
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimatePresence>
    </div>
  );
}
