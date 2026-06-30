import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useHunterStore } from '../stores/useHunterStore';
import { useBossStore } from '../stores/useBossStore';
import { evaluateYesterdayNutrition } from '../lib/nutritionDailyScore';
import { hasManualPremiumAccess } from '../lib/premiumAccess';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
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
  // Ref para evitar chamadas concorrentes ao loadProfile
  const loadingProfileRef = useRef(false);

  const syncProfileAndDailyNutrition = async (currentUser: User) => {
    await loadProfile(currentUser.id);
    if (hasManualPremiumAccess(currentUser.email)) {
      useHunterStore.setState({ isPremium: true });
      void supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', currentUser.id)
        .then(({ error }) => {
          if (error) console.warn('[AuthContext] Premium manual nao sincronizado:', error);
        });
    }
    void evaluateYesterdayNutrition(currentUser.id, {
      addXp: useHunterStore.getState().addXp,
      updateStat: useHunterStore.getState().updateStat,
      attackBoss: useBossStore.getState().attackActiveBoss,
    }).catch((err) => {
      console.warn('[AuthContext] Avaliacao diaria de nutricao ignorada:', err);
    });
  };

  useEffect(() => {
    let active = true;

    // Safety timeout: nunca mais de 6 segundos no loading inicial
    const safetyTimeout = setTimeout(() => {
      if (active && loading) {
        setLoading(false);
        console.warn('[AuthContext] Safety timeout disparado. Forçando loading = false.');
      }
    }, 6000);

    async function initAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!active) return;

        if (error) {
          console.error('[AuthContext] Erro ao obter sessão:', error);
          setLoading(false);
          return;
        }

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          const userId = currentSession.user.id;
          currentUserRef.current = userId;
          // Carrega o perfil apenas se ainda não foi carregado (evita chamadas duplas)
          if (!loadingProfileRef.current) {
            loadingProfileRef.current = true;
            try {
              await syncProfileAndDailyNutrition(currentSession.user);
            } finally {
              loadingProfileRef.current = false;
            }
          }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!active) return;

      const newUserId = newSession?.user?.id ?? null;

      // Ignora eventos que não mudam o usuário (ex: TOKEN_REFRESHED com mesmo ID)
      // para evitar loops de re-render e re-carregamento de dados
      if (event === 'TOKEN_REFRESHED' && newUserId === currentUserRef.current) {
        // Apenas atualiza a sessão silenciosamente (o token mudou, mas o usuário não)
        setSession(newSession);
        return;
      }

      if (newUserId !== currentUserRef.current) {
        currentUserRef.current = newUserId;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newUserId) {
          setLoading(true);
          if (!loadingProfileRef.current) {
            loadingProfileRef.current = true;
            try {
              if (newSession?.user) {
                await syncProfileAndDailyNutrition(newSession.user);
              }
            } catch (err) {
              console.error('[AuthContext] Erro ao carregar perfil:', err);
            } finally {
              loadingProfileRef.current = false;
            }
          }
          if (active) setLoading(false);
        } else {
          reset();
          if (active) setLoading(false);
        }
      }
    });

    return () => {
      active = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, [loadProfile, reset]);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp = async (
    email: string,
    password: string,
    username: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
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
      setSession(null);
      setUser(null);
      reset();
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
