import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { clearAllAuthSessionTokens } from '../lib/authStorage';
import { useHunterStore } from '../stores/useHunterStore';
import { useBossStore } from '../stores/useBossStore';
import { evaluateYesterdayNutrition } from '../lib/nutritionDailyScore';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string, redirectTo?: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const loadProfile = useHunterStore((s) => s.loadProfile);
  const reset = useHunterStore((s) => s.reset);
  // Ref para rastrear o ID do usuário atual, evitando re-cargas desnecessárias
  const currentUserRef = useRef<string | null>(null);
  // Ref com Promise deduplicada para evitar chamadas concorrentes e condições de corrida no loadProfile
  const activeSyncRef = useRef<{ userId: string; promise: Promise<void> } | null>(null);

  const syncProfileAndDailyNutrition = async (currentUser: User) => {
    await loadProfile(currentUser.id);
    void evaluateYesterdayNutrition(currentUser.id, {
      addXp: useHunterStore.getState().addXp,
      updateStat: useHunterStore.getState().updateStat,
      attackBoss: useBossStore.getState().attackActiveBoss,
    }).catch((err) => {
      console.warn('[AuthContext] Avaliacao diaria de nutricao ignorada:', err);
    });
  };

  const ensureProfileSynced = (currentUser: User): Promise<void> => {
    const storeState = useHunterStore.getState();
    if (
      storeState.profileLoaded &&
      storeState.profileUserId === currentUser.id &&
      !storeState.profileError
    ) {
      return Promise.resolve();
    }

    if (activeSyncRef.current && activeSyncRef.current.userId === currentUser.id) {
      return activeSyncRef.current.promise;
    }

    const promise = syncProfileAndDailyNutrition(currentUser).finally(() => {
      if (activeSyncRef.current?.promise === promise) {
        activeSyncRef.current = null;
      }
    });

    activeSyncRef.current = { userId: currentUser.id, promise };
    return promise;
  };

  useEffect(() => {
    let active = true;
    const pendingTimers = new Set<ReturnType<typeof setTimeout>>();

    const scheduleDeferred = (fn: () => void) => {
      const timerId = setTimeout(() => {
        pendingTimers.delete(timerId);
        if (active) fn();
      }, 0);
      pendingTimers.add(timerId);
    };

    // Safety timeout: nunca mais de 8 segundos preso no loading inicial
    const safetyTimeout = setTimeout(() => {
      if (!active) return;
      const storeState = useHunterStore.getState();
      if (storeState.profileLoading && !storeState.profileLoaded) {
        useHunterStore.setState({
          profileLoading: false,
          profileError: storeState.profileError || 'Tempo limite excedido ao sincronizar perfil com o Sistema.',
        });
      }
      setLoading((prev) => {
        if (prev) {
          console.warn('[AuthContext] Safety timeout disparado. Liberando estado de loading.');
        }
        return false;
      });
    }, 8000);

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          console.error('[AuthContext] Erro ao obter sessão persistida:', error);
          currentUserRef.current = null;
          clearAllAuthSessionTokens();
          setSession(null);
          setUser(null);
          reset();
          setLoading(false);
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const userId = currentSession.user.id;
          currentUserRef.current = userId;
          await ensureProfileSynced(currentSession.user);
        } else {
          currentUserRef.current = null;
          reset();
        }
      } catch (err) {
        console.error('[AuthContext] Erro na inicialização de autenticação:', err);
      } finally {
        if (active) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    }

    void initAuth();

    // IMPORTANTE: O callback de onAuthStateChange NUNCA deve ser async ou aguardar queries do Supabase
    // diretamente, pois o GoTrueClient invoca os listeners dentro de _acquireLock. Chamar supabase.from(...)
    // síncronamente dentro deste callback causa deadlock circular em supabase.auth.getSession().
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!active) return;

      const newUserId = newSession?.user?.id ?? null;

      // Evento de deslogamento explícito ou expiração total
      if (event === 'SIGNED_OUT') {
        currentUserRef.current = null;
        activeSyncRef.current = null;
        setSession(null);
        setUser(null);
        reset();
        clearAllAuthSessionTokens();
        setLoading(false);
        return;
      }

      // Atualização silenciosa de token para o mesmo usuário já carregado
      if (
        (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') &&
        newUserId === currentUserRef.current
      ) {
        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
        }
        return;
      }

      const storeState = useHunterStore.getState();
      const needsProfileSync =
        Boolean(newUserId) &&
        (newUserId !== currentUserRef.current || (!storeState.profileLoaded && !storeState.profileLoading));

      if (newUserId !== currentUserRef.current || needsProfileSync) {
        currentUserRef.current = newUserId;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newUserId && newSession?.user) {
          const targetUser = newSession.user;
          setLoading(true);
          // Desacopla a query PostgREST do lock interno (_acquireLock) do GoTrueClient
          scheduleDeferred(() => {
            void ensureProfileSynced(targetUser)
              .catch((err) => {
                console.error('[AuthContext] Erro ao sincronizar perfil após mudança de sessão:', err);
              })
              .finally(() => {
                if (active) setLoading(false);
              });
          });
        } else {
          reset();
          setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      pendingTimers.forEach((timerId) => clearTimeout(timerId));
      pendingTimers.clear();
      subscription.unsubscribe();
    };
  }, [loadProfile, reset]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Infraestrutura Supabase não configurada neste ambiente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel da Vercel.',
      };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    username: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Infraestrutura Supabase não configurada neste ambiente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel da Vercel.',
      };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { error: error?.message ?? null };
  };

  const resetPasswordForEmail = async (
    email: string,
    redirectTo?: string
  ): Promise<{ error: string | null }> => {
    if (!isSupabaseConfigured) {
      return {
        error:
          'Infraestrutura Supabase não configurada neste ambiente. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no painel da Vercel.',
      };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo || (typeof window !== 'undefined' ? `${window.location.origin}/settings` : undefined),
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    try {
      currentUserRef.current = null;
      await supabase.auth.signOut({ scope: 'global' });
    } catch (err) {
      console.error('[AuthContext] Erro no signOut do Supabase:', err);
    } finally {
      clearAllAuthSessionTokens();
      setSession(null);
      setUser(null);
      reset();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
