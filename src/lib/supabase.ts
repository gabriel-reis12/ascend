import { createClient } from '@supabase/supabase-js'
import { authStorageAdapter } from './authStorage'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Aviso de desenvolvimento: ajuda a debugar configurações faltando
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] ERRO CRÍTICO: Variáveis de ambiente não configuradas!\n' +
    'VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌ FALTANDO',
    '\nVITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌ FALTANDO',
    '\n\nNo Vercel: Acesse Settings → Environment Variables e adicione as duas variáveis.'
  );
}

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
