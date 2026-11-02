'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    // 1. Check for GitHub OAuth code in query params (?code=...)
    const code = searchParams.get('code');
    if (code) {
      authApi.githubAuth(code)
        .then(({ data }) => {
          setAuthData(data);
          router.push('/dashboard');
        })
        .catch((err) => {
          setError(err.response?.data?.message || 'GitHub OAuth failed');
        });
      return;
    }

    // 2. Check for Google OAuth access_token in URL hash (#access_token=...)
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token') || hashParams.get('id_token');
      if (accessToken) {
        authApi.googleAuth(accessToken)
          .then(({ data }) => {
            setAuthData(data);
            router.push('/dashboard');
          })
          .catch((err) => {
            setError(err.response?.data?.message || 'Google OAuth failed');
          });
        return;
      }
    }

    // If neither exists
    const timer = setTimeout(() => {
      setError('No OAuth authorization credentials received.');
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchParams, router, setAuthData]);

  if (error) {
    return (
      <div>
        <p className="text-red-500 font-medium mb-3">{error}</p>
        <button
          onClick={() => router.push('/login')}
          className="btn-primary text-sm px-4 py-2"
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-500 font-medium">Completing OAuth authentication…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="card p-8 w-full max-w-sm text-center shadow-sm">
        <Suspense
          fallback={
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Loading…</p>
            </div>
          }
        >
          <CallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
