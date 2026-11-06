import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HunterLogin } from '../../components/ui/hunter-login';
import { useAuth } from '../../contexts/AuthContext';
import { useHunterStore } from '../../stores/useHunterStore';
import { usePreferences } from '@/contexts/preferences';

export function LoginPage() {
  const { user, signIn, loading: authLoading } = useAuth();
  const hunterClass = useHunterStore((s) => s.hunterClass);
  const profileLoaded = useHunterStore((s) => s.profileLoaded);
  const { language } = usePreferences();
  const isEnglish = language === 'en-US';
  const l = (pt: string, en: string) => isEnglish ? en : pt;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redireciona usuários já autenticados para evitar ficarem presos na tela de login
  useEffect(() => {
    if (user && !authLoading) {
      if (hunterClass) {
        navigate('/', { replace: true });
      } else if (profileLoaded) {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, authLoading, hunterClass, profileLoaded, navigate]);

  const formatAuthError = (rawError: string): string => {
    const errLower = rawError.toLowerCase();
    if (errLower.includes('invalid login credentials') || errLower.includes('invalid credentials')) {
      return l(
        'Chave de acesso ou e-mail inválidos. Verifique suas credenciais de caçador.',
        'Invalid access key or email. Please verify your hunter credentials.'
      );
    }
    if (errLower.includes('email not confirmed')) {
      return l(
        'Identidade pendente de ativação. Verifique a confirmação enviada ao seu e-mail.',
        'Identity pending activation. Please verify the confirmation sent to your email.'
      );
    }
    if (errLower.includes('too many requests') || errLower.includes('rate limit')) {
      return l(
        'Muitas tentativas em curto período. Aguarde alguns instantes antes de tentar novamente.',
        'Too many attempts in a short period. Please wait a moment before trying again.'
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

    if (!email || !password) {
      setError(l('Informe o e-mail e a chave de acesso.', 'Please enter your email and access key.'));
      setLoading(false);
      return;
    }

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(formatAuthError(signInError));
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <HunterLogin
      mode="signin"
      onSubmit={handleSubmit}
      onToggleMode={() => navigate('/register')}
      loading={loading || authLoading}
      error={error}
    />
  );
}
