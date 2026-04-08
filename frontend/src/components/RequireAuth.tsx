import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth() {
  const { user, isLoading, isLoggingOut, login } = useAuth();

  useEffect(() => {
    if (!isLoading && !isLoggingOut && !user) {
      login();
    }
  }, [isLoading, isLoggingOut, user, login]);

  if (isLoading || isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Outlet />;
}
