import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useHunterStore } from '../stores/useHunterStore';

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
  const currentUserRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    // Safety timeout: Garante que o loading nunca passe de 5 segundos
    // Evita travamentos eternos ("Despertando...") por problemas de rede ou cold starts
    const safetyTimeout = setTimeout(() => {
      if (active) {
        setLoading(false);
        console.warn("Safety timeout do AuthContext disparado. Forçando loading = false.");
      }
    }, 5000);

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          currentUserRef.current = currentSession.user.id;
          await loadProfile(currentSession.user.id);
        } else {
          currentUserRef.current = null;
          reset();
        }
      } catch (err) {
        console.error("Erro na inicialização de autenticação:", err);
      } finally {
        if (active) {
          setLoading(false);
          clearTimeout(safetyTimeout);
        }
      }
    }

    void initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return;
      try {
        const newUserId = newSession?.user?.id ?? null;

        if (newUserId !== currentUserRef.current) {
          currentUserRef.current = newUserId;
          setSession(newSession);
          setUser(newSession?.user ?? null);

          if (newUserId) {
            setLoading(true);
            await loadProfile(newUserId);
          } else {
            reset();
          }
        } else {
          // Se for o mesmo usuário (ex: token refreshed silenciosamente no background),
          // atualiza os dados no Zustand sem recriar referências do objeto user no React (evitando loops).
          if (newUserId) {
            void loadProfile(newUserId);
          }
        }
      } catch (err) {
        console.error("Erro na mudança de autenticação:", err);
      } finally {
        if (active) {
          setLoading(false);
          clearTimeout(safetyTimeout);
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
    await supabase.auth.signOut();
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
