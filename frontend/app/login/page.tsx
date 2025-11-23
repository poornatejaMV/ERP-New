'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, getToken } from '@/lib/api-client';
import { useAuth } from '@/components/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    const token = getToken();
    console.log('🔍 Login page mount check:', { hasToken: !!token });
    if (token) {
      console.log('✅ Token found on login page, redirecting immediately...');
      // Use window.location for immediate redirect
      window.location.href = '/';
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 FORM SUBMITTED - handleLogin called!', { email, password: '***' });
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Starting login...', { email });
      
      // Call login API
      console.log('📡 About to call authApi.login...');
      const response = await authApi.login({ username: email, password });
      console.log('✅ Login API response received');
      console.log('   Token present:', !!response.access_token);
      console.log('   User:', response.user?.email);
      
      // Verify token is saved
      await new Promise(resolve => setTimeout(resolve, 100));
      const token = localStorage.getItem('auth_token');
      console.log('📦 Token in localStorage:', token ? `Yes (${token.substring(0, 20)}...)` : 'NO - THIS IS THE PROBLEM!');
      
      if (!token) {
        console.error('❌ Token was not saved!');
        throw new Error('Token not saved to localStorage');
      }
      
      console.log('🚀 Redirecting to dashboard...');
      
      // Use window.location for immediate redirect (bypasses React router)
      window.location.href = '/';
      
      // Fallback: if window.location doesn't work, try router
      setTimeout(() => {
        console.log('⚠️ Fallback redirect using router...');
        router.push('/');
      }, 500);
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Login failed');
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.register({ email, password });
      // After registration, automatically login
      await authApi.login({ username: email, password });
      // Small delay to ensure token is saved
      await new Promise(resolve => setTimeout(resolve, 200));
      // Force page reload to refresh auth state
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isRegister ? 'Create Account' : 'Sign in to ERP'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isRegister ? 'Register a new account' : 'Enter your credentials to continue'}
          </p>
        </div>
        <form 
          className="mt-8 space-y-6" 
          onSubmit={(e) => {
            console.log('📝 Form onSubmit triggered!', { isRegister });
            if (isRegister) {
              handleRegister(e);
            } else {
              handleLogin(e);
            }
          }}
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Register' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

