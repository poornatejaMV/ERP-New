'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi, User, getToken, removeToken } from '@/lib/api-client';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initAuth = async () => {
      const token = getToken();
      console.log('🔐 AuthProvider initAuth:', { hasToken: !!token });
      if (token) {
        try {
          console.log('📡 Fetching current user...');
          const currentUser = await authApi.getCurrentUser();
          console.log('✅ User fetched:', currentUser.email);
          setUser(currentUser);
        } catch (error: any) {
          console.error('❌ Failed to fetch user:', error);
          // Only remove token if it's specifically a 401 Unauthorized
          if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
             console.log('🚫 401 Unauthorized - clearing token');
             removeToken();
          } else {
             console.log('⚠️ Error fetching user, but NOT clearing token (might be backend error)');
             // We don't remove token for other errors (like network issues or 500s)
             // This allows the user to stay "logged in" via token check even if user profile fails
          }
        }
      }
      setLoading(false);
      console.log('✅ AuthProvider initialized, loading:', false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    // Protect routes - redirect to login if not authenticated
    const token = getToken();
    const isLoginPage = pathname === '/login';
    
    // Only redirect if we're done loading
    if (loading) {
      return;
    }
    
    // If we have a token, allow access (even if user object not loaded yet)
    // The user object will load asynchronously
    if (!token && !isLoginPage) {
      console.log('🚫 AuthProvider: No token, redirecting to login');
      router.push('/login');
    } else if (token && isLoginPage) {
      // If we have a token on login page, redirect to home
      console.log('✅ AuthProvider: Token found on login page, redirecting to /');
      // Use window.location for immediate redirect
      window.location.href = '/';
    }
    // If token exists but user not loaded, that's OK - don't redirect
    // The user will load asynchronously
  }, [pathname, loading, router]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ username: email, password });
    setUser(response.user);
    // Force a refresh to update auth state
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const register = async (email: string, password: string) => {
    await authApi.register({ email, password });
    const response = await authApi.login({ username: email, password });
    setUser(response.user);
    // Force redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const logout = () => {
    authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

