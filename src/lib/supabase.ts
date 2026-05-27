import { createClient } from '@supabase/supabase-js'

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
    // Persiste a sessão no localStorage para evitar logout ao recarregar a página
    persistSession: true,
    // Detecta sessão na URL (necessário para OAuth e links mágicos)
    detectSessionInUrl: true,
    // Auto-refresh do token antes de expirar
    autoRefreshToken: true,
  },
})
