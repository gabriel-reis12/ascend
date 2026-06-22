import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Zap, Play } from 'lucide-react';
import { usePreferences } from '../../contexts/preferences';

interface TourStep {
  title: string;
  lore: string;
  target?: string;
  position?: 'top' | 'bottom' | 'center';
}

const getTourSteps = (l: (pt: string, en: string) => string): TourStep[] => [
  {
    title: l('PORTAL DE COMANDO', 'COMMAND PORTAL'),
    lore: l(
      'Bem-vindo ao Portal de Comando. A partir daqui, suas ações diárias no mundo real moldarão sua força RPG. Vamos calibrar seus módulos de evolução.',
      'Welcome to the Command Portal. From here on, your daily real-world actions will shape your RPG strength. Let us calibrate your evolution modules.'
    ),
    position: 'center',
  },
  {
    title: l('FICHA DE INTEGRAÇÃO', 'NEURAL INTEGRATION'),
    lore: l(
      'Aqui são exibidos seu Rank ativo, seu nome de caçador, sua classe despertada, nível e o progresso reativo de XP. Acumule XP para subir de nível e aumentar sua força!',
      'Here your active Rank, hunter name, awakened class, level, and reactive XP progress are displayed. Accumulate XP to level up and increase your strength!'
    ),
    target: 'tour-portal-header',
    position: 'bottom',
  },
  {
    title: l('MISSÕES RECOMENDADAS', 'RECOMMENDED MISSIONS'),
    lore: l(
      'Esta seção destaca a próxima missão prioritária recomendada pelo Sistema para que você mantenha sua consistência e ganhe recompensas imediatas.',
      'This section highlights the next priority mission recommended by the System to keep your consistency and earn immediate rewards.'
    ),
    target: 'tour-portal-recommended',
    position: 'bottom',
  },
  {
    title: l('PORTAIS PRINCIPAIS', 'PRIMARY PORTALS'),
    lore: l(
      'Estes portais dão acesso à sua Ficha de Status detalhada, Quadro de Missões e ao seu Centro de Treinamento físico. São as ferramentas centrais da sua evolução.',
      'These portals grant access to your detailed Status Sheet, Quest Board, and Physical Training Center. They are the core tools for your evolution.'
    ),
    target: 'tour-portal-primary',
    position: 'top',
  },
  {
    title: l('MÓDULOS EXPANDIDOS', 'COMPLEMENTARY MODULES'),
    lore: l(
      'Eixos de suporte como Recuperação & Nutrição, Módulo Fortuna (Financeiro), Portal dos Chefes e Santuário do Descanso. Evolua essas áreas para equilibrar seus atributos.',
      'Support axes like Recovery & Nutrition, Fortune (Finance) Module, Boss Portal, and Sanctuary of Rest. Evolve these areas to balance your attributes.'
    ),
    target: 'tour-portal-secondary',
    position: 'top',
  },
  {
    title: l('ASCENSÃO DO CAÇADOR', 'HUNTER ASCENSION'),
    lore: l(
      'A calibração do portal está concluída. Purifique suas fendas, complete seus objetivos e conquiste a subida do Rank E ao Rank S. Ascenda!',
      'Portal calibration is complete. Purify your rifts, complete your goals, and conquer the climb from Rank E to Rank S. Ascend!'
    ),
    position: 'center',
  },
];

export function ProductTour() {
  const { language } = usePreferences();
  const l = (pt: string, en: string) => (language === 'pt-BR' ? pt : en);
  const steps = getTourSteps(l);

  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Inicialização do Tour se não concluído e explicitamente solicitado (pelo Onboarding ou pelas Configurações)
  useEffect(() => {
    const justFinishedOnboarding = localStorage.getItem('ascend_just_finished_onboarding');
    const completed = localStorage.getItem('ascend_tour_completed');
    
    if (justFinishedOnboarding && !completed) {
      // Pequeno delay para garantir que a página renderizou completamente antes de calcular as posições das âncoras
      const timer = setTimeout(() => {
        setOpen(true);
        setCurrentStep(0);
        // Limpa o indicador temporário imediatamente para não re-exibir em recarregamentos futuros (F5)
        localStorage.removeItem('ascend_just_finished_onboarding');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  // Detector de Responsividade
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Atualização dinâmica de âncora/highlighter
  const updateHighlight = useCallback(() => {
    if (!open) return;
    const step = steps[currentStep];
    if (step && step.target) {
      let targetId = step.target;

      // Fallback dinâmico para mobile caso o botão da barra lateral (sidebar) não esteja visível no DOM
      if (targetId === 'tour-nav-workouts') {
        const desktopEl = document.getElementById('tour-nav-workouts');
        if (!desktopEl || desktopEl.offsetWidth === 0) {
          targetId = 'tour-shortcut-workouts';
        }
      } else if (targetId === 'tour-nav-nutrition') {
        const desktopEl = document.getElementById('tour-nav-nutrition');
        if (!desktopEl || desktopEl.offsetWidth === 0) {
          targetId = 'tour-shortcut-nutrition';
        }
      }

      const element = document.getElementById(targetId);
      if (element) {
        // Rola suavemente até o elemento se necessário
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Timeout pequeno para esperar a rolagem estabilizar antes de tirar o bounding box
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          setHighlightRect(rect);
        }, 150);
        return;
      }
    }
    setHighlightRect(null);
  }, [open, currentStep]);

  useEffect(() => {
    updateHighlight();
  }, [updateHighlight]);

  // Listener para reajuste em resize ou scroll
  useEffect(() => {
    if (!open) return;
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight);
    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight);
    };
  }, [open, updateHighlight]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    localStorage.setItem('ascend_tour_completed', 'true');
    setOpen(false);
  };

  if (!open) return null;

  const step = steps[currentStep];

  // Cálculo de Posição do Card (Desktop e Mobile com posicionamento anti-sobreposição inteligente)
  const getCardStyle = () => {
    if (isMobile) {
      if (step.position === 'center' || !highlightRect) {
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '440px',
        };
      }

      // Evita sobreposição do card explicativo no celular com o elemento sob foco
      const isElementInBottomHalf = highlightRect.top + highlightRect.height / 2 > window.innerHeight / 2;
      if (isElementInBottomHalf) {
        // Elemento está na metade inferior da tela: colocamos o card explicativo no topo
        return {
          position: 'fixed' as const,
          top: '16px',
          left: '16px',
          right: '16px',
          width: 'calc(100% - 32px)',
          maxWidth: 'none',
          transform: 'none',
        };
      } else {
        // Elemento está na metade superior da tela: colocamos o card explicativo na base
        return {
          position: 'fixed' as const,
          bottom: '16px',
          left: '16px',
          right: '16px',
          width: 'calc(100% - 32px)',
          maxWidth: 'none',
          transform: 'none',
        };
      }
    }

    if (!highlightRect) {
      if (step.position === 'center') {
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '440px',
        };
      }
      return {};
    }

    const spacing = 18;
    const cardWidth = 420;
    const leftPos = Math.max(20, Math.min(window.innerWidth - cardWidth - 20, highlightRect.left + (highlightRect.width / 2) - (cardWidth / 2)));

    if (step.position === 'top') {
      return {
        position: 'fixed' as const,
        top: `${Math.max(20, highlightRect.top - spacing)}px`,
        left: `${leftPos}px`,
        transform: 'translateY(-100%)',
        width: `${cardWidth}px`,
      };
    }

    // Default: bottom
    return {
      position: 'fixed' as const,
      top: `${highlightRect.bottom + spacing}px`,
      left: `${leftPos}px`,
      width: `${cardWidth}px`,
      transform: 'none',
    };
  };

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden pointer-events-none">
      {/* ── Backdrop Escuro com Recorte Virtual ─────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-[1px] pointer-events-auto"
      />

      {/* ── Highlighter de Foco com Borda Roxa Neon ─────────────── */}
      <AnimatePresence>
        {highlightRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12
            }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed rounded-2xl border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)] z-[1000] pointer-events-none animate-pulse-purple"
            style={{
              boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), inset 0 0 10px rgba(168, 85, 247, 0.2)'
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Card Explicativo Cyberpunk do Tour ───────────────────── */}
      <div className="absolute inset-0 z-[1001] pointer-events-none">
        <div
          style={getCardStyle()}
          className="pointer-events-auto transition-all duration-300 ease-out"
        >
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 210 }}
            className="w-full rounded-2xl border-2 border-purple-500 bg-[#0F0F13] p-5 sm:p-6 shadow-[0_0_30px_rgba(168,85,247,0.3)] flex flex-col justify-between relative"
          >
            {/* Glowing matrix lines inside card */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent pointer-events-none rounded-2xl" />

            {/* Header */}
            <div className="relative mb-4 flex items-center justify-between border-b border-purple-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-purple-400 fill-purple-400 animate-pulse" />
                <h4 
                  className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-400 font-orbitron"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {step.title}
                </h4>
              </div>
              <button 
                onClick={handleClose}
                className="rounded-lg p-1 text-gray-500 hover:bg-white/5 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Lore/Descricao */}
            <div className="relative mb-5 flex-1">
              <p className="text-xs sm:text-sm leading-relaxed text-gray-300 font-medium italic">
                "{step.lore}"
              </p>
            </div>

            {/* Footer Controls */}
            <div className="relative border-t border-purple-500/20 pt-4 flex items-center justify-between">
              {/* Step Counter */}
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-600 font-orbitron">
                {l('Sistema', 'System')} <span className="text-purple-500">{currentStep + 1}</span> / {steps.length}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Skip Button */}
                {currentStep < steps.length - 1 && (
                  <button
                    onClick={handleClose}
                    className="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {l('Pular', 'Skip')}
                  </button>
                )}

                {/* Prev Button */}
                {currentStep > 0 && (
                  <button
                    onClick={handlePrev}
                    className="flex size-8 items-center justify-center rounded-lg border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all shrink-0"
                  >
                    <ChevronLeft size={16} strokeWidth={3} />
                  </button>
                )}

                {/* Next/Done Button */}
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 15px rgba(168,85,247,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleNext}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-[10px] font-black uppercase italic tracking-widest text-white hover:bg-purple-500 transition-all shadow-md"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <span>{l('Despertar', 'Awaken')}</span>
                      <Play size={10} className="fill-current" />
                    </>
                  ) : (
                    <>
                      <span>{l('Avançar', 'Next')}</span>
                      <ChevronRight size={10} strokeWidth={3} />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
