import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { resolveSession } from '@/api/auth';
import { useStore } from '@/store/useStore';

export const AuthGuard = () => {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const session = await resolveSession();

      if (!active) {
        return;
      }

      if (session) {
        localStorage.setItem('daily_brew_user', JSON.stringify(session));
        useStore.getState().loadUser();
        setStatus('authenticated');
        return;
      }

      setStatus('unauthenticated');
    };

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};