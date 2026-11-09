import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown, Terminal } from 'lucide-react';
import { HudCard } from '@/components/ui/hud-card';
import { TacticalButton } from '@/components/ui/tactical-button';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isChunkError: boolean;
}

const CHUNK_ERROR_PATTERNS = [
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Loading chunk [\d]+ failed/i,
  /error loading dynamic/i,
  /error loading dynamically imported module/i,
];

function isDynamicChunkError(err: unknown): boolean {
  if (!err) return false;
  const message = err instanceof Error ? err.message : String(err);
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

export class RouteErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isChunkError: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    const isChunk = isDynamicChunkError(error);
    return {
      hasError: true,
      error,
      isChunkError: isChunk,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RouteErrorBoundary] Erro capturado na rota:', error, errorInfo);
    this.setState({ errorInfo });

    // Se for erro de chunk em SPA recém-publicada, tenta um reload transparente uma única vez
    if (isDynamicChunkError(error)) {
      const reloadKey = 'ascend_chunk_error_reloaded';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();

      // Recarrega apenas se não tiver recarregado nos últimos 15 segundos
      if (!lastReload || now - parseInt(lastReload, 10) > 15000) {
        sessionStorage.setItem(reloadKey, String(now));
        console.warn('[RouteErrorBoundary] Recarregando aplicação para buscar chunks atualizados da nova versão...');
        window.location.reload();
      }
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, isChunkError: false });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleGoHub = () => {
    window.location.href = '/hub';
  };

  public render() {
    if (this.state.hasError) {
      const { error, errorInfo, isChunkError } = this.state;
      const isEnglish = typeof document !== 'undefined' && document.documentElement.lang?.includes('en');

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
          <HudCard
            variant="crimson"
            corners
            radialGlow
            className="w-full max-w-xl p-6 sm:p-8 space-y-6 border-rose-500/40 bg-[#0B0D14]/95 shadow-[0_0_35px_rgba(239,68,68,0.2)]"
          >
            {/* Header com Ícone e Título */}
            <div className="flex items-start gap-4 border-b border-rose-500/20 pb-5">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1">
                <span className="font-orbitron text-[10px] font-black uppercase tracking-[0.18em] text-rose-400">
                  {isChunkError
                    ? (isEnglish ? 'RESOURCE UPDATE / CHUNK DESYNC' : 'ATUALIZAÇÃO DE VERSÃO / SINCRONIZAÇÃO')
                    : (isEnglish ? 'MODULE SYSTEM EXCEPTION' : 'FALHA DE EXECUÇÃO DO MÓDULO')}
                </span>
                <h2 className="font-orbitron text-base sm:text-lg font-black uppercase tracking-wide text-white">
                  {isChunkError
                    ? (isEnglish ? 'Unable to load module package' : 'Não foi possível carregar o módulo')
                    : (isEnglish ? 'Unexpected error in this section' : 'Ocorreu um erro nesta seção')}
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isChunkError
                    ? (isEnglish
                        ? 'A new build was deployed or network connectivity dropped while loading module assets. Reloading normally resolves this.'
                        : 'Uma nova versão do sistema foi disponibilizada ou houve instabilidade de rede ao buscar os arquivos do módulo.')
                    : (isEnglish
                        ? 'The system encountered an unexpected error while initializing this view. Your saved progress remains safe.'
                        : 'O Sistema encontrou uma falha inesperada ao inicializar esta visualização. Seu progresso salvo permanece seguro.')}
                </p>
              </div>
            </div>

            {/* Ações de Recuperação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <TacticalButton
                onClick={this.handleRetry}
                variant="primary"
                accent="cyan"
                className="flex-1 min-h-[46px] text-xs font-black uppercase tracking-wider"
              >
                <RefreshCw size={15} />
                <span>{isEnglish ? 'Reload & Reconnect' : 'Tentar Novamente'}</span>
              </TacticalButton>

              <TacticalButton
                onClick={this.handleGoHub}
                variant="secondary"
                accent="purple"
                className="flex-1 min-h-[46px] text-xs font-black uppercase tracking-wider"
              >
                <span>{isEnglish ? 'Hunter Hub' : 'Central do Caçador'}</span>
              </TacticalButton>

              <TacticalButton
                onClick={this.handleGoHome}
                variant="ghost"
                className="min-h-[46px] text-xs font-bold px-4"
              >
                <Home size={15} />
                <span>{isEnglish ? 'Home' : 'Início'}</span>
              </TacticalButton>
            </div>

            {/* Gaveta de Diagnóstico Técnico */}
            <details className="group rounded-xl border border-white/10 bg-black/50 p-3 text-left transition-all">
              <summary className="flex cursor-pointer items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-white select-none">
                <span className="flex items-center gap-2">
                  <Terminal size={14} className="text-cyan-400" />
                  {isEnglish ? 'Technical Diagnostics (Debug Log)' : 'Diagnóstico Técnico (Log de Erro)'}
                </span>
                <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                <div className="rounded-lg bg-black/80 p-3 font-mono text-[10px] text-rose-300 overflow-x-auto">
                  <p className="font-bold">{error?.name}: {error?.message}</p>
                  {error?.stack && (
                    <pre className="mt-2 text-slate-400 whitespace-pre-wrap text-[9px] leading-tight">
                      {error.stack}
                    </pre>
                  )}
                  {errorInfo?.componentStack && (
                    <pre className="mt-2 text-slate-500 whitespace-pre-wrap text-[9px] leading-tight border-t border-white/10 pt-2">
                      {errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </div>
            </details>
          </HudCard>
        </div>
      );
    }

    return this.props.children;
  }
}

