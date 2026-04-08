import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getCurrentUser,
  fetchUserAttributes,
  signInWithRedirect,
  signOut,
  type AuthUser,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface AuthContextValue {
  user: AuthUser | null;
  userAttributes: Record<string, string>;
  isLoading: boolean;
  isLoggingOut: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadUser(): Promise<{ user: AuthUser; attrs: Record<string, string> } | null> {
  try {
    const user = await getCurrentUser();
    const raw = await fetchUserAttributes();
    const attrs: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (v !== undefined) attrs[k] = v;
    }
    return { user, attrs };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userAttributes, setUserAttributes] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Restore session on mount
    loadUser().then((result) => {
      if (result) {
        setUser(result.user);
        setUserAttributes(result.attrs);
      }
      setIsLoading(false);
    });

    // React to Amplify auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn') {
        loadUser().then((result) => {
          if (result) {
            setUser(result.user);
            setUserAttributes(result.attrs);
          }
        });
      }
      if (payload.event === 'signedOut') {
        setUser(null);
        setUserAttributes({});
      }
    });

    return unsubscribe;
  }, []);

  function login() {
    signInWithRedirect().catch((err: unknown) => {
      console.error('signInWithRedirect failed:', err);
    });
  }

  function logout() {
    setIsLoggingOut(true);
    setUser(null);
    setUserAttributes({});
    signOut().catch((err: unknown) => {
      console.error('signOut failed:', err);
      setIsLoggingOut(false);
    });
  }

  return (
    <AuthContext.Provider value={{ user, userAttributes, isLoading, isLoggingOut, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
