import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HunterLogin } from '../../components/ui/hunter-login';
import { useAuth } from '../../contexts/AuthContext';

export function LoginPage() {
  const { signIn } = useAuth();
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

    const { error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(signInError);
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
      loading={loading}
      error={error}
    />
  );
}
