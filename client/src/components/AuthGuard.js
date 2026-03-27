'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthGuard({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // If they are not signed in, just let them see the public dashboard/login screen
      setIsChecking(false);
      return;
    }

    // Skip check if already on onboarding or profile
    if (pathname === '/onboarding' || pathname === '/profile' || pathname === '/groups') {
      setIsChecking(false);
      return;
    }

    const checkUserApiKey = async () => {
      try {
        const token = await getToken();
        const res = await fetch('http://localhost:8080/api/v1/auth/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await res.json();
        
        // Custom check for API key
        if (!data.data?.hasApiKey) {
          router.replace('/onboarding');
        } else {
          setIsChecking(false);
        }
      } catch (err) {
        console.error('Error checking API key status:', err);
        // Let the user through if this fails, or fallback to an error state
        setIsChecking(false);
      }
    };

    checkUserApiKey();
  }, [isLoaded, isSignedIn, pathname, router, getToken]);

  if (!isLoaded || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-50" />
          <p className="text-zinc-500 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  return children;
}
