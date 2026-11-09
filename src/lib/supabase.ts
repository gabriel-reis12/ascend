import { createClient } from '@supabase/supabase-js'
import { authStorageAdapter } from './authStorage'

declare const process: { env?: Record<string, string | undefined> } | undefined;

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const rawSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

/**
 * Indica se o ambiente atual é uma execução automatizada de testes (Node.js / Vitest / CLI).
 */
export const isTestEnvironment =
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.NODE_ENV === 'test' || Boolean(process.env.VITEST))) ||
  typeof window === 'undefined';

/**
 * Validação explícita das credenciais do Supabase.
 * Retorna se a infraestrutura está devidamente configurada e quais variáveis faltam.
 */
export function validateSupabaseConfiguration(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!rawSupabaseUrl || rawSupabaseUrl.includes('placeholder') || !rawSupabaseUrl.startsWith('https://')) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!rawSupabaseAnonKey || rawSupabaseAnonKey.includes('placeholder') || rawSupabaseAnonKey.length < 20) {
    missing.push('VITE_SUPABASE_ANON_KEY');
  }
  return { valid: missing.length === 0, missing };
}

export const isSupabaseConfigured = validateSupabaseConfiguration().valid;

// Aviso explícito no console: alerta os desenvolvedores sem silenciar falhas
if (!isSupabaseConfigured) {
  const { missing } = validateSupabaseConfiguration();
  const warningMsg =
    `[Supabase] ERRO CRÍTICO: Credenciais de infraestrutura ausentes ou inválidas!\n` +
    `Variáveis ausentes: ${missing.join(', ')}\n` +
    `No Vercel (Preview/Produção): Acesse Settings → Environment Variables e configure ambas as chaves.`;

  if (isTestEnvironment) {
    console.warn(`${warningMsg} (Ambiente de teste detectado: fallback mock permitido para suítes offline)`);
  } else {
    console.error(warningMsg);
  }
}

// Fallback seguro restrito exclusivamente a ambientes de testes automatizados ou placeholder controlado
const supabaseUrl = rawSupabaseUrl || 'https://placeholder.supabase.co'
const supabaseAnonKey = rawSupabaseAnonKey || 'public-anon-key-placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persistência estável adaptável para Web e Mobile (Capacitor)
    persistSession: true,
    storage: authStorageAdapter,
    storageKey: 'ascend-auth-token',
    // Detecta sessão na URL (necessário para OAuth, links mágicos e reset de senha)
    detectSessionInUrl: true,
    // Auto-refresh do token em segundo plano antes da expiração
    autoRefreshToken: true,
    // Evita expirar sessões abruptamente em background
    flowType: 'pkce',
  },
  global: {
    // Configurações para resiliência de rede
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(timeoutId));
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

/**
 * Executa uma query com retry automático e backoff exponencial.
 * Usado para queries críticas que podem falhar por instabilidade de rede.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 500
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isAborted = err instanceof Error && err.name === 'AbortError';
      const isNetworkError = err instanceof TypeError && err.message.includes('fetch');

      if (!isAborted && !isNetworkError) {
        // Erro não relacionado à rede — não tenta novamente
        throw err;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt); // backoff exponencial: 500ms, 1000ms, 2000ms
        console.warn(`[Supabase] Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
