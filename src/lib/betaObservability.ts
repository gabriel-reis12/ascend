/**
 * ASCEND — ETAPA 04.9: BETA OBSERVABILITY & ISSUE TRACKING
 * Sistema leve e determinístico de observabilidade e registro de problemas no Beta Web.
 * Coleta telemetria técnica não-sensível (dispositivo, viewport, rota, versão) e
 * impede vazamento de senhas, tokens ou dados pessoais em logs e relatórios.
 */

export type BetaSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BetaIssueStatus = 'open' | 'investigating' | 'resolved';

export interface BetaIssueReport {
  id: string;
  createdAt: string;
  device: {
    userAgent: string;
    viewport: string;
    language: string;
    isMobile: boolean;
    platform: string;
  };
  screen: string;
  title: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: BetaSeverity;
  evidence?: string;
  status: BetaIssueStatus;
  appVersion: string;
  buildMode: string;
}

export interface CreateBetaReportInput {
  screen?: string;
  title: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: BetaSeverity;
  evidence?: string;
}

const STORAGE_KEY = 'ascend_beta_issue_reports';
export const ASCEND_BETA_VERSION = '0.4.9-beta';

/**
 * Sanitiza textos para garantir que senhas, tokens JWT ou credenciais não vazem nos relatórios.
 */
export function sanitizeReportText(text: string): string {
  if (!text) return '';
  return text
    // Remove padrões comuns de tokens bearer / JWT
    .replace(/eyJ[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+/g, '[TOKEN_SANITIZED]')
    // Remove senhas explícitas em URLs ou JSON
    .replace(/(password|senha|secret|apiKey|anonKey)["':\s=]+([^,\s&]+)/gi, '$1=[REDACTED]')
    // Remove cartões de crédito acidentais
    .replace(/\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g, '[CARD_SANITIZED]');
}

/**
 * Coleta telemetria técnica do dispositivo/navegador sem violar privacidade.
 */
export function collectDeviceTelemetry() {
  if (typeof window === 'undefined') {
    return {
      userAgent: 'Node/TestRunner',
      viewport: '1280x800',
      language: 'pt-BR',
      isMobile: false,
      platform: 'Server',
    };
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || w <= 768;

  return {
    userAgent: ua.slice(0, 160), // Trunca para não poluir
    viewport: `${w}x${h} (ratio: ${window.devicePixelRatio || 1})`,
    language: navigator.language || 'pt-BR',
    isMobile,
    platform: (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || 'Web',
  };
}

/**
 * Cria e persiste um novo relatório de problema do Beta.
 */
export function createBetaReport(input: CreateBetaReportInput): BetaIssueReport {
  const timestamp = new Date().toISOString();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const id = `BETA-${timestamp.slice(0, 10).replace(/-/g, '')}-${randomSuffix}`;
  const device = collectDeviceTelemetry();

  const report: BetaIssueReport = {
    id,
    createdAt: timestamp,
    device,
    screen: input.screen || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    title: sanitizeReportText(input.title.trim()),
    stepsToReproduce: sanitizeReportText(input.stepsToReproduce.trim()),
    expectedResult: sanitizeReportText(input.expectedResult.trim()),
    actualResult: sanitizeReportText(input.actualResult.trim()),
    severity: input.severity || 'medium',
    evidence: input.evidence ? sanitizeReportText(input.evidence.trim()) : undefined,
    status: 'open',
    appVersion: ASCEND_BETA_VERSION,
    buildMode: import.meta.env.MODE || 'production',
  };

  saveReportToStorage(report);
  return report;
}

/**
 * Recupera os relatórios salvos localmente.
 */
export function getStoredBetaReports(): BetaIssueReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[BetaObservability] Falha ao ler relatórios locais:', err);
    return [];
  }
}

/**
 * Persiste um relatório na lista local.
 */
function saveReportToStorage(report: BetaIssueReport) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getStoredBetaReports();
    const updated = [report, ...existing].slice(0, 50); // Mantém últimos 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('[BetaObservability] Falha ao persistir relatório:', err);
  }
}

/**
 * Formata um relatório em Markdown estruturado, pronto para GitHub Issues, Discord ou documentação.
 */
export function formatBetaReportAsMarkdown(report: BetaIssueReport): string {
  const sevEmojis: Record<BetaSeverity, string> = {
    low: '🟢 Baixa',
    medium: '🟡 Média',
    high: '🟠 Alta',
    critical: '🔴 Crítica',
  };

  return [
    `### [${report.id}] ${report.title}`,
    ``,
    `- **Data/Hora:** ${report.createdAt}`,
    `- **Gravidade:** ${sevEmojis[report.severity] || report.severity}`,
    `- **Status:** \`${report.status}\``,
    `- **Tela/Rota:** \`${report.screen}\``,
    `- **Dispositivo:** ${report.device.isMobile ? 'Mobile' : 'Desktop/Tablet'} (${report.device.viewport}) | ${report.device.platform}`,
    `- **Versão:** \`${report.appVersion}\` (${report.buildMode})`,
    ``,
    `#### Passos para Reproduzir:`,
    report.stepsToReproduce || '_Não informados_',
    ``,
    `#### Resultado Esperado:`,
    report.expectedResult || '_Não informado_',
    ``,
    `#### Resultado Encontrado:`,
    report.actualResult || '_Não informado_',
    ``,
    report.evidence ? `#### Evidências / Notas:\n${report.evidence}\n` : '',
    `---`,
    `_Gerado pelo sistema de observabilidade ASCEND Beta Web._`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Exporta todos os relatórios armazenados como JSON para backup ou auditoria técnica.
 */
export function exportBetaReportsAsJson(): string {
  const reports = getStoredBetaReports();
  return JSON.stringify(reports, null, 2);
}
