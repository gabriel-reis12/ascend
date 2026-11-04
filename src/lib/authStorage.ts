/**
 * Adaptador de armazenamento de sessão para Supabase Auth.
 * 
 * Implementa a interface SupportedStorage do @supabase/supabase-js,
 * desacoplando o storage do navegador e preparando a aplicação para:
 * 1. Web moderna: Persistência confiável no localStorage com fallback para memória.
 * 2. Capacitor Mobile (futuro): Injeção transparente de SecureStorage / Preferences nativo.
 */

export interface IAuthStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// Fallback em memória para ambientes onde Storage não está disponível ou acessível
class MemoryStorageAdapter implements IAuthStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

/**
 * Adaptador Web padrão usando localStorage com resiliência contra erros de cota/permissão.
 */
class WebLocalStorageAdapter implements IAuthStorage {
  private fallback = new MemoryStorageAdapter();

  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (err) {
      console.warn('[AuthStorage] Falha ao ler localStorage, usando fallback de memória:', err);
    }
    return this.fallback.getItem(key);
  }

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch (err) {
      console.warn('[AuthStorage] Falha ao salvar no localStorage, usando fallback de memória:', err);
    }
    this.fallback.setItem(key, value);
  }

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
    } catch (err) {
      console.warn('[AuthStorage] Falha ao remover do localStorage, usando fallback de memória:', err);
    }
    this.fallback.removeItem(key);
  }
}

// Provedor ativo de armazenamento de autenticação
let activeStorage: IAuthStorage = new WebLocalStorageAdapter();

/**
 * Permite registrar um storage customizado no bootstrap (ex: Capacitor Secure Storage ou Preferences).
 * Quando a migração para Capacitor ocorrer, basta chamar registerAuthStorage() antes de inicializar o client.
 */
export function registerAuthStorage(storage: IAuthStorage) {
  activeStorage = storage;
}

/**
 * Adaptador exportado que satisfaz a interface SupportedStorage do Supabase.
 */
export const authStorageAdapter: IAuthStorage = {
  getItem: (key: string) => activeStorage.getItem(key),
  setItem: (key: string, value: string) => activeStorage.setItem(key, value),
  removeItem: (key: string) => activeStorage.removeItem(key),
};

/**
 * Função de limpeza que remove dados de sessão persistidos em caso de logout global.
 */
export function clearAllAuthSessionTokens() {
  if (typeof window === 'undefined') return;

  try {
    // Limpa tanto sessionStorage antigo quanto localStorage
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('auth-token') || key === 'ascend-auth-token')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));

    // Limpa também qualquer resquício do sessionStorage anterior
    if (window.sessionStorage) {
      const sessionKeys: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('auth-token'))) {
          sessionKeys.push(key);
        }
      }
      sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
    }
  } catch (err) {
    console.warn('[AuthStorage] Falha ao limpar tokens de autenticação:', err);
  }
}

