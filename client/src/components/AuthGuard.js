'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/api';

export default function AuthGuard({ children }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const shouldSkipCheck = !isSignedIn || pathname === '/onboarding' || pathname === '/profile' || pathname === '/groups';

  useEffect(() => {
    if (!isLoaded) return;

    if (shouldSkipCheck) {
      return;
    }

    const checkUserApiKey = async () => {
      try {
        const token = await getToken();
        const data = await apiRequest('/auth/users/me', { token });
        
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
  }, [getToken, isLoaded, router, shouldSkipCheck]);

  if (!isLoaded || (!shouldSkipCheck && isChecking)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)]">
        <Card className="w-full max-w-md rounded-[1.75rem] border-white/70 bg-white/85 py-0 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
          <CardHeader className="pb-3">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold">Verifying access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pb-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <p className="text-sm text-muted-foreground">
              Checking your workspace permissions and saved API access before opening the app.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return children;
}
