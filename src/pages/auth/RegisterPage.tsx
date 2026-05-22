import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HunterLogin } from '../../components/ui/hunter-login';
import { useAuth } from '../../contexts/AuthContext';

export function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const username = formData.get('username') as string;

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    const { error: signUpError } = await signUp(email, password, username);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else {
      navigate('/login');
    }
  };

  return (
    <HunterLogin
      mode="signup"
      onSubmit={handleSubmit}
      onToggleMode={() => navigate('/login')}
      loading={loading}
      error={error}
    />
  );
}
