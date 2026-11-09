import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bug,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Download,
  Smartphone,
  Send,
} from 'lucide-react';
import { TacticalButton } from '@/components/ui/tactical-button';
import {
  createBetaReport,
  getStoredBetaReports,
  formatBetaReportAsMarkdown,
  exportBetaReportsAsJson,
  type BetaSeverity,
  type BetaIssueReport,
  ASCEND_BETA_VERSION,
} from '@/lib/betaObservability';
import { usePreferences } from '@/contexts/preferences';

interface BetaFeedbackModalProps {
  open: boolean;
  onClose: () => void;
  currentScreen?: string;
}

export function BetaFeedbackModal({
  open,
  onClose,
  currentScreen,
}: BetaFeedbackModalProps) {
  const { language } = usePreferences();
  const isEn = language === 'en-US';
  const l = (pt: string, en: string) => (isEn ? en : pt);

  const [activeTab, setActiveTab] = useState<'new' | 'list'>('new');
  const [title, setTitle] = useState('');
  const [steps, setSteps] = useState('');
  const [expected, setExpected] = useState('');
  const [actual, setActual] = useState('');
  const [evidence, setEvidence] = useState('');
  const [severity, setSeverity] = useState<BetaSeverity>('medium');
  const [submittedReport, setSubmittedReport] = useState<BetaIssueReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reports = getStoredBetaReports();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !actual.trim()) {
      setErrorMsg(l('Preencha pelo menos o título e o resultado encontrado.', 'Please fill at least the title and the actual result.'));
      return;
    }

    setErrorMsg(null);
    const newReport = createBetaReport({
      title,
      stepsToReproduce: steps,
      expectedResult: expected,
      actualResult: actual,
      evidence,
      severity,
      screen: currentScreen || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    });

    setSubmittedReport(newReport);
    // Copia automaticamente o Markdown para a área de transferência se suportado
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatBetaReportAsMarkdown(newReport)).catch(() => {});
    }
  };

  const handleCopyMarkdown = (report: BetaIssueReport) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(formatBetaReportAsMarkdown(report))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  };

  const handleExportJson = () => {
    const jsonStr = exportBetaReportsAsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ascend_beta_reports_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResetForm = () => {
    setTitle('');
    setSteps('');
    setExpected('');
    setActual('');
    setEvidence('');
    setSeverity('medium');
    setSubmittedReport(null);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-white/10 bg-[#090D16] shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-[#05070D]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400">
                <Bug className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-orbitron text-sm font-bold uppercase tracking-wider text-white">
                    {l('Observabilidade // Beta Feedback', 'Observability // Beta Feedback')}
                  </h3>
                  <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-orbitron text-[9px] font-bold text-amber-400">
                    {ASCEND_BETA_VERSION}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {l('Registre problemas técnicos e inconsistências durante o teste.', 'Report bugs and inconsistencies during testing.')}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Abas */}
          <div className="flex border-b border-white/10 bg-[#070A12] px-5">
            <button
              type="button"
              onClick={() => { setActiveTab('new'); handleResetForm(); }}
              className={`py-2.5 px-4 font-orbitron text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'new'
                  ? 'border-[#00F0FF] text-[#00F0FF]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {l('Novo Relatório', 'New Report')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`py-2.5 px-4 font-orbitron text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
                activeTab === 'list'
                  ? 'border-[#00F0FF] text-[#00F0FF]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {l('Histórico de Problemas', 'Issue History')} ({reports.length})
            </button>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'new' ? (
              submittedReport ? (
                <div className="space-y-4 text-center py-6">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="font-orbitron text-base font-bold text-white uppercase tracking-wider">
                      {l('Problema Registrado com Sucesso!', 'Issue Reported Successfully!')}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      ID: <span className="font-mono text-[#00F0FF]">{submittedReport.id}</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {l('O relatório formatado em Markdown já foi copiado para sua área de transferência.', 'The Markdown formatted report was copied to your clipboard.')}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#05070D] p-3 text-left">
                    <pre className="text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {formatBetaReportAsMarkdown(submittedReport)}
                    </pre>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    <TacticalButton
                      variant="primary"
                      onClick={() => handleCopyMarkdown(submittedReport)}
                    >
                      <Copy className="h-4 w-4 mr-1.5" />
                      {copied ? l('Copiado!', 'Copied!') : l('Copiar Markdown', 'Copy Markdown')}
                    </TacticalButton>
                    <TacticalButton
                      variant="ghost"
                      onClick={handleResetForm}
                    >
                      {l('Reportar Outro', 'Report Another')}
                    </TacticalButton>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                        {l('Gravidade', 'Severity')}
                      </label>
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as BetaSeverity)}
                        className="w-full h-10 rounded-xl border border-white/10 bg-[#0D1220] px-3 text-xs text-white focus:border-[#00F0FF] focus:outline-none"
                      >
                        <option value="low">🟢 {l('Baixa — Visual / Cosmético', 'Low — Visual / Cosmetic')}</option>
                        <option value="medium">🟡 {l('Média — Funcionalidade Parcial', 'Medium — Partial Feature')}</option>
                        <option value="high">🟠 {l('Alta — Impede Ação Secundária', 'High — Blocks Secondary Action')}</option>
                        <option value="critical">🔴 {l('Crítica — Falha Total / Crash', 'Critical — Crash / Blocker')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                        {l('Tela Afetada', 'Screen')}
                      </label>
                      <input
                        type="text"
                        disabled
                        value={currentScreen || (typeof window !== 'undefined' ? window.location.pathname : '/')}
                        className="w-full h-10 rounded-xl border border-white/10 bg-[#05070D] px-3 text-xs text-slate-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                      {l('Título do Problema *', 'Issue Title *')}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={l('Ex: Botão de concluir treino não responde no iOS', 'Ex: Workout finish button does not respond on iOS')}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/10 bg-[#0D1220] px-3 text-xs text-white placeholder-slate-500 focus:border-[#00F0FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                      {l('Passos para Reproduzir', 'Steps to Reproduce')}
                    </label>
                    <textarea
                      rows={2}
                      placeholder={l('1. Abri a página de treinos\n2. Iniciei o Treino A\n3. Ao finalizar a 3ª série...', '1. Opened workouts\n2. Started Routine A\n3. After set 3...')}
                      value={steps}
                      onChange={(e) => setSteps(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0D1220] p-2.5 text-xs text-white placeholder-slate-500 focus:border-[#00F0FF] focus:outline-none font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                        {l('Resultado Esperado', 'Expected Result')}
                      </label>
                      <input
                        type="text"
                        placeholder={l('Ex: A série deveria ser marcada como verde', 'Ex: Set should turn green')}
                        value={expected}
                        onChange={(e) => setExpected(e.target.value)}
                        className="w-full h-10 rounded-xl border border-white/10 bg-[#0D1220] px-3 text-xs text-white placeholder-slate-500 focus:border-[#00F0FF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                        {l('Resultado Encontrado *', 'Actual Result *')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={l('Ex: A tela travou por 2 segundos', 'Ex: Screen froze for 2 seconds')}
                        value={actual}
                        onChange={(e) => setActual(e.target.value)}
                        className="w-full h-10 rounded-xl border border-white/10 bg-[#0D1220] px-3 text-xs text-white placeholder-slate-500 focus:border-[#00F0FF] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-orbitron font-bold uppercase tracking-wider text-slate-300 mb-1">
                      {l('Notas Complementares / Evidência', 'Additional Notes / Evidence')}
                    </label>
                    <input
                      type="text"
                      placeholder={l('Mensagem de erro, código de status ou detalhes do aparelho', 'Error message or device specifics')}
                      value={evidence}
                      onChange={(e) => setEvidence(e.target.value)}
                      className="w-full h-10 rounded-xl border border-white/10 bg-[#0D1220] px-3 text-xs text-white placeholder-slate-500 focus:border-[#00F0FF] focus:outline-none"
                    />
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.02] p-2.5 text-[11px] text-slate-400 flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-[#00F0FF] shrink-0" />
                    <span>
                      {l('Telemetria técnica (viewport, navegador, versão) é anexada automaticamente sem coletar senhas ou dados privados.', 'Device telemetry is attached automatically without capturing passwords or private data.')}
                    </span>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <TacticalButton type="button" variant="ghost" onClick={onClose}>
                      {l('Cancelar', 'Cancel')}
                    </TacticalButton>
                    <TacticalButton type="submit" variant="primary">
                      <Send className="h-4 w-4 mr-1.5" />
                      {l('Registrar Problema', 'Submit Issue')}
                    </TacticalButton>
                  </div>
                </form>
              )
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs text-slate-400">
                    {reports.length} {reports.length === 1 ? l('relatório registrado', 'report recorded') : l('relatórios registrados', 'reports recorded')}
                  </span>
                  {reports.length > 0 && (
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="flex items-center gap-1 text-xs font-orbitron text-[#00F0FF] hover:underline"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {l('Exportar JSON', 'Export JSON')}
                    </button>
                  )}
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs">
                    {l('Nenhum problema registrado ainda neste dispositivo.', 'No issues recorded yet on this device.')}
                  </div>
                ) : (
                  reports.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-white/10 bg-[#070A12] p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            r.severity === 'critical' ? 'bg-rose-500' :
                            r.severity === 'high' ? 'bg-amber-500' :
                            r.severity === 'medium' ? 'bg-yellow-400' : 'bg-emerald-400'
                          }`} />
                          <span className="font-orbitron text-xs font-bold text-white">
                            {r.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyMarkdown(r)}
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {l('Copiar', 'Copy')}
                        </button>
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono flex flex-wrap gap-x-4">
                        <span>ID: {r.id}</span>
                        <span>Rota: {r.screen}</span>
                        <span>{r.createdAt.slice(0, 16).replace('T', ' ')}</span>
                      </div>

                      <p className="text-xs text-slate-300">
                        <strong className="text-slate-400">{l('Encontrado:', 'Actual:')}</strong> {r.actualResult}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

