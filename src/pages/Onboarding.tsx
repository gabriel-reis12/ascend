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
  CheckCircle2, ArrowRight, Sparkles
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
    image: null, // placeholder — imagem será adicionada pelo usuário
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
    image: null, // placeholder — imagem será adicionada pelo usuário
    stats: 'DIS ▲▲▲  SAB ▲▲  EQU ▲',
  },
];

const AWAKENING_MESSAGES = [
  'Inicializando protocolo de avaliação...',
  'Lendo assinatura de mana...',
  'Analisando bio-sinais do caçador...',
  'Sincronizando com a Fenda...',
  'Padrão identificado na linha S...',
  'Classe determinada pelo Arquiteto.',
];

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
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 p-4 rounded-xl border-l-4 cursor-pointer select-none
        transition-all duration-150 ease-out hover:scale-[1.01] active:scale-[0.99]
        ${isSelected
          ? 'bg-purple-500/20 border-purple-400 shadow-[0_0_20px_rgba(124,58,237,0.35)] ring-1 ring-purple-500/50'
          : 'bg-purple-950/30 border-purple-700/60 hover:bg-purple-900/40 hover:border-purple-500'}
      `}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <p className={`text-sm font-medium leading-snug flex-1 ${isSelected ? 'text-purple-100' : 'text-purple-200/80'}`}>
        {label}
      </p>
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: isSelected ? 1 : 0, scale: isSelected ? 1 : 0.6 }}
        transition={{ duration: 0.2 }}
      >
        <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
      </motion.div>
      {isSelected && (
        <motion.div layoutId="option-glow" className="absolute inset-0 rounded-xl bg-purple-500/10 pointer-events-none" />
      )}
    </motion.div>
  );
}

// ─── Componente StepHeader ────────────────────────────────────────────────────
function StepHeader({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <div className="space-y-4 text-center mb-8">
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

  const [form, setForm] = useState<FormData>({
    fullName: '',
    birthday: '',
    gender: '',
    height: '',
    weightCurrent: '',
    weightTarget: '',
    trainingFocus: '',
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
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      const suggested = calculateSuggestedClass();
      setRevealedClass(suggested);
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

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex items-center justify-center p-6">
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
            <StepHeader step={1} total={4} label="Informações Básicas" />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Protocolo de Identificação</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-white leading-tight">
                Quem é o <span className="text-purple-400">Caçador</span>?
              </h1>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Cada caçador tem uma identidade única na Fenda. Precisamos registrar a sua.
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
                  style={{ colorScheme: 'dark' }}
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
                      onClick={() => setField('gender', opt.value as HunterGender)}
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
            <StepHeader step={2} total={4} label="Perfil Físico" />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Registros Biométricos</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold leading-tight">
                Seu <span className="text-purple-400">Corpo</span> é sua base
              </h1>
              <p className="text-sm text-gray-500">Estes dados ajudam a calibrar sua evolução física no sistema.</p>
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
                  <Dumbbell className="w-3 h-3" /> Foco de Treino
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Musculação', 'Funcional', 'Cardio / Endurance', 'Esportes de Combate', 'Calistenia', 'Flexibilidade / Yoga'].map(focus => (
                    <motion.button
                      key={focus}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setField('trainingFocus', focus)}
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
            <StepHeader step={3} total={4} label="Objetivo Principal" />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Missão Central</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold leading-tight">
                Por que você quer <span className="text-purple-400">Evoluir</span>?
              </h1>
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
                  onClick={() => setField('mainGoal', opt.value)}
                  icon={<span className={`${form.mainGoal === opt.value ? 'text-purple-300' : 'text-purple-600'}`}>{opt.icon}</span>}
                  delay={idx * 0.06}
                />
              ))}
            </div>

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
            <StepHeader step={4} total={4} label="Nível de Experiência" />

            <div className="space-y-2 text-center mb-8">
              <p className="text-[10px] font-orbitron text-purple-400 tracking-[0.3em] uppercase">Calibração de Rank</p>
              <h1 className="text-2xl md:text-3xl font-orbitron font-bold leading-tight">
                Qual é o seu <span className="text-purple-400">Rank</span> atual?
              </h1>
              <p className="text-sm text-gray-500">Isso calibra a dificuldade inicial das suas missões.</p>
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
                  onClick={() => setField('experienceLevel', opt.value)}
                  delay={idx * 0.07}
                />
              ))}
            </div>

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
            key={`quiz-${currentQuestionIndex}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35 }}
            className="max-w-2xl w-full flex flex-col items-center gap-8"
          >
            {/* Progresso */}
            <div className="w-full space-y-3 text-center">
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
                Você é um{' '}
                <motion.span
                  className="text-purple-400"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring' }}
                >
                  {revealedClass}
                </motion.span>
              </h1>
              <p className="text-gray-500 max-w-lg mx-auto text-sm leading-relaxed">
                O sistema identificou sua essência. Mas o poder final de escolha é sempre do caçador — confirme ou escolha outro caminho.
              </p>
              <p className="text-[11px] text-purple-600/60 italic font-mono">
                "A fraqueza não é uma limitação. É um ponto de partida." — Arquiteto, Solo Leveling
              </p>
            </motion.div>

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
                    onClick={() => setSelectedClass(c.id)}
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
                    <div className="w-full aspect-[3/4] relative rounded-lg overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                      {c.image ? (
                        <>
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-100"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
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

      </AnimatePresence>
    </div>
  );
}
