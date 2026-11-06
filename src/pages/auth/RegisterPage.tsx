import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HunterLogin } from '../../components/ui/hunter-login';
import { useAuth } from '../../contexts/AuthContext';
import { useHunterStore } from '../../stores/useHunterStore';
import { usePreferences } from '@/contexts/preferences';

export function RegisterPage() {
  const { user, signUp, loading: authLoading } = useAuth();
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const profileLoaded = useHunterStore((s) => s.profileLoaded);
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => (isEnglish ? en : pt);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona usuários já autenticados
  useEffect(() => {
    if (user && !authLoading) {
      if (hunterClass) {
        navigate('/', { replace: true });
      } else if (profileLoaded) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, authLoading, hunterClass, profileLoaded, navigate]);

  const formatSignUpError = (rawError: string): string => {
    const errLower = rawError.toLowerCase();
    if (
      errLower.includes('already registered') ||
      errLower.includes('unique constraint') ||
      errLower.includes('already exists')
    ) {
      return l(
        'Este e-mail já possui um caçador registrado no Sistema. Faça login para continuar.',
        'This email already belongs to a registered Hunter in the System. Please sign in.'
      );
    }
    if (errLower.includes('at least 6 characters') || errLower.includes('least 6')) {
      return l(
        'A chave de acesso deve conter pelo menos 6 caracteres.',
        'The access key must have at least 6 characters.'
      );
    }
    if (errLower.includes('fetch') || errLower.includes('network') || errLower.includes('failed to fetch')) {
      return l(
        'Falha de comunicação com a Fenda. Verifique sua conexão de rede.',
        'Network communication failure with the Gate. Please check your connection.'
      );
    }
    return rawError;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string)?.trim();
    const password = (formData.get('password') as string) || '';
    const confirmPassword = (formData.get('confirmPassword') as string) || '';
    const username = (formData.get('username') as string)?.trim() || '';

    if (!username || username.length < 2) {
      setError(
        l(
          'O codinome do caçador deve ter pelo menos 2 caracteres.',
          'Hunter codename must be at least 2 characters.'
        )
      );
      setLoading(false);
      return;
    }

    if (!email || !email.includes('@')) {
      setError(
        l('Informe um endereço de e-mail válido.', 'Please provide a valid email address.')
      );
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(
        l(
          'A chave de acesso deve ter pelo menos 6 caracteres.',
          'Password must have at least 6 characters.'
        )
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(
        l('As chaves de acesso digitadas não coincidem.', 'The passwords do not match.')
      );
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password, username);

    if (signUpError) {
      setError(formatSignUpError(signUpError));
      setLoading(false);
    } else {
      // Se a conta foi criada e sessão iniciada automaticamente, segue para o onboarding
      navigate('/onboarding');
    }
  };

  return (
    <HunterLogin
      mode="signup"
      onSubmit={handleSubmit}
      onToggleMode={() => navigate('/login')}
      loading={loading || authLoading}
      error={error}
    />
  );
}
