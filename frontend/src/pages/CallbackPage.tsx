import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';

export default function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        navigate('/admin/upload', { replace: true });
      }
      if (payload.event === 'signInWithRedirect_failure') {
        setError('Sign-in failed. Please try again.');
      }
    });

    return unsubscribe;
  }, [navigate]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">{error}</p>
        <button
          className="underline"
          onClick={() => navigate('/')}
        >
          Return home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="w-8 h-8 border-4 border-current border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500">Completing sign in…</p>
    </div>
  );
}
