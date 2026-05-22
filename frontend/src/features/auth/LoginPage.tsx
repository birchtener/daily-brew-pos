import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { resolveSession } from '@/api/auth';
import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const session = await resolveSession();

      if (!active || !session) {
        return;
      }

      localStorage.setItem('daily_brew_user', JSON.stringify(session));
      setIsAuthenticated(true);
      navigate('/', { replace: true });
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  )
}