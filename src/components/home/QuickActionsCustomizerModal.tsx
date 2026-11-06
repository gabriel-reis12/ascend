import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronUp,
  ChevronDown,
  Pin,
  PinOff,
  RotateCcw,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  CheckSquare,
  Dumbbell,
  Apple,
  Moon,
  Repeat,
  Coins,
  Skull,
  Trophy,
  LayoutDashboard,
} from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';
import { usePreferences } from '@/contexts/preferences';
import {
  QUICK_ACTIONS_CATALOG,
  MAX_PINNED_ACTIONS,
  MIN_PINNED_ACTIONS,
  getQuickActionById,
  type QuickActionDefinition,
} from '@/lib/quickActionsCatalog';
import { useQuickActionsStore } from '@/stores/useQuickActionsStore';

interface QuickActionsCustomizerModalProps {
  open: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  CheckSquare: <CheckSquare className="h-4 w-4" />,
  Dumbbell: <Dumbbell className="h-4 w-4" />,
  Apple: <Apple className="h-4 w-4" />,
  Moon: <Moon className="h-4 w-4" />,
  Repeat: <Repeat className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Coins: <Coins className="h-4 w-4" />,
  Skull: <Skull className="h-4 w-4" />,
  Trophy: <Trophy className="h-4 w-4" />,
  LayoutDashboard: <LayoutDashboard className="h-4 w-4" />,
};

export function QuickActionsCustomizerModal({
  open,
  onClose,
}: QuickActionsCustomizerModalProps) {
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  const {
    pinnedActionIds,
    pinAction,
    unpinAction,
    reorderAction,
    showRecentSuggestions,
    toggleRecentSuggestions,
    showHunterGuidance,
    toggleHunterGuidance,
    resetToDefaults,
    clearHistory,
  } = useQuickActionsStore();

  if (!open) return null;

  const pinnedActions: QuickActionDefinition[] = pinnedActionIds
    .map((id) => getQuickActionById(id))
    .filter(Boolean) as QuickActionDefinition[];

  const unpinnedActions: QuickActionDefinition[] = QUICK_ACTIONS_CATALOG.filter(
    (action) => !pinnedActionIds.includes(action.id)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col z-10"
        >
          <HudCard
            variant="elevated"
            corners
            className="border-white/15 bg-[#0D1019]/95 shadow-2xl flex flex-col max-h-[90vh] p-0 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF]">
                  <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-orbitron text-sm sm:text-base font-bold uppercase tracking-wider text-white truncate">
                    {l('Personalizar Ações Rápidas', 'Customize Quick Actions')}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {l(
                      `Fixe de ${MIN_PINNED_ACTIONS} a ${MAX_PINNED_ACTIONS} atalhos na tela inicial`,
                      `Pin from ${MIN_PINNED_ACTIONS} to ${MAX_PINNED_ACTIONS} shortcuts on home`
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition-colors hover:border-white/20 hover:text-white"
                aria-label={l('Fechar', 'Close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-6 flex-1">
              {/* Section 1: Pinned Shortcuts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-orbitron text-xs font-bold uppercase tracking-wider text-slate-300">
                    {l('Atalhos Fixados', 'Pinned Shortcuts')} (
                    <span className="text-[#00F0FF]">
                      {pinnedActions.length}/{MAX_PINNED_ACTIONS}
                    </span>
                    )
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {l('Reordene ou remova', 'Reorder or remove')}
                  </span>
                </div>

                <div className="space-y-2">
                  {pinnedActions.map((action, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === pinnedActions.length - 1;
                    const canUnpin = pinnedActions.length > MIN_PINNED_ACTIONS;

                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="font-orbitron text-xs font-bold text-slate-400 w-4">
                            {idx + 1}.
                          </span>
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-[#00F0FF]">
                            {ICON_MAP[action.iconName] || <Sparkles className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-white truncate">
                              {isEnglish ? action.titleEn : action.titlePt}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {isEnglish ? action.sublabelEn : action.sublabelPt}
                            </p>
                          </div>
                        </div>

                        {/* Order & Unpin Controls */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => reorderAction(action.id, 'up')}
                            disabled={isFirst}
                            aria-label={l('Mover para cima', 'Move up')}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => reorderAction(action.id, 'down')}
                            disabled={isLast}
                            aria-label={l('Mover para baixo', 'Move down')}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => unpinAction(action.id)}
                            disabled={!canUnpin}
                            aria-label={l('Desafixar atalho', 'Unpin shortcut')}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/20 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <PinOff className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Available Catalog Actions */}
              {unpinnedActions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-orbitron text-xs font-bold uppercase tracking-wider text-slate-300">
                      {l('Disponíveis no Catálogo', 'Available in Catalog')}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {pinnedActions.length >= MAX_PINNED_ACTIONS
                        ? l('Limite de 6 atingido', 'Max of 6 reached')
                        : l('Clique para fixar', 'Click to pin')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {unpinnedActions.map((action) => {
                      const canPin = pinnedActions.length < MAX_PINNED_ACTIONS;

                      return (
                        <div
                          key={action.id}
                          className="flex items-center justify-between gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 transition-colors hover:bg-white/[0.04]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-slate-300">
                              {ICON_MAP[action.iconName] || <Sparkles className="h-4 w-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-white truncate">
                                {isEnglish ? action.titleEn : action.titlePt}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {isEnglish ? action.sublabelEn : action.sublabelPt}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => pinAction(action.id)}
                            disabled={!canPin}
                            className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-bold text-cyan-200 transition-colors hover:bg-cyan-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Pin className="h-3 w-3" />
                            <span>{l('Fixar', 'Pin')}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 3: Privacy, Suggestions & Guidance Toggles */}
              <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <h4 className="font-orbitron text-xs font-bold uppercase tracking-wider text-slate-300">
                  {l('Preferências e Privacidade', 'Preferences & Privacy')}
                </h4>
                <p className="text-xs text-slate-400">
                  {l(
                    'Sem envio a terceiros. As ordenações e sugestões utilizam estritamente o histórico local do dispositivo.',
                    'Zero third-party tracking. Recents and suggestions strictly use device-local data.'
                  )}
                </p>

                <div className="space-y-3 pt-2">
                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-xs font-medium text-slate-200">
                      {l('Exibir Sugestões Recentes', 'Show Recent Suggestions')}
                    </span>
                    <input
                      type="checkbox"
                      checked={showRecentSuggestions}
                      onChange={(e) => toggleRecentSuggestions(e.target.checked)}
                      className="size-4 accent-[#00F0FF] rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-xs font-medium text-slate-200">
                      {l('Exibir Orientação do Caçador', 'Show Hunter Guidance')}
                    </span>
                    <input
                      type="checkbox"
                      checked={showHunterGuidance}
                      onChange={(e) => toggleHunterGuidance(e.target.checked)}
                      className="size-4 accent-[#A855F7] rounded"
                    />
                  </label>
                </div>

                <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={clearHistory}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{l('Limpar Histórico Local', 'Clear Local History')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="inline-flex items-center gap-1.5 text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>{l('Restaurar Padrões', 'Reset to Defaults')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-end">
              <TacticalButton
                variant="primary"
                accent="cyan"
                onClick={onClose}
                className="min-h-[44px] px-6 text-xs font-bold"
              >
                {l('Concluir', 'Done')}
              </TacticalButton>
            </div>
          </HudCard>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

