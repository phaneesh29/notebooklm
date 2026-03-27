'use client';

import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

export default function Home() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      setError(null);
      const token = await getToken();
      const res = await fetch('http://localhost:8080/api/v1/auth/users/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch');
      setProfileData(data);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isLoaded) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;

  return (
    <AuthGuard>
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black min-h-screen p-8">
        <main className="flex flex-col items-center gap-8 w-full max-w-2xl bg-white dark:bg-zinc-900 p-12 rounded-2xl shadow-xl">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Welcome to NotebookLM
          </h1>

          {!isSignedIn && (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="text-zinc-600 dark:text-zinc-400">
                Please sign in to access your dashboard.
              </p>
              <SignInButton mode="modal">
                <button className="px-6 py-3 rounded-full bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors cursor-pointer">
                  Sign In
                </button>
              </SignInButton>
            </div>
          )}

          {isSignedIn && (
            <div className="flex flex-col items-center gap-6 w-full">
              <div className="flex items-center gap-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full">
                <UserButton appearance={{ elements: { userButtonAvatarBox: "w-12 h-12" } }} />
                <div className="flex-1">
                  <p className="font-medium text-zinc-900 dark:text-white">Welcome back!</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Manage your account or sign out</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full mt-4">
                <Link 
                  href="/profile"
                  className="w-full text-center px-6 py-3 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer"
                >
                  Profile & Settings
                </Link>

                <button 
                  onClick={fetchProfile}
                  className="w-full px-6 py-3 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                >
                  Check Backend Conn
                </button>
              </div>

              {error && (
                <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm break-all">
                  Error: {error}
                </div>
              )}

              {profileData && (
                <div className="w-full p-6 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-auto mt-4">
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">Backend Response:</h3>
                  <pre className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap break-all">
                    {JSON.stringify(profileData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </AuthGuard>
  );
}
