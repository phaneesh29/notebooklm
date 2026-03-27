'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/api';

import { ExternalLink, KeyRound, ShieldCheck } from 'lucide-react';

export default function OnboardingPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const token = await getToken();
      await apiRequest('/auth/users/api-key', {
        method: 'POST',
        token,
        body: JSON.stringify({ apiKey }),
      });

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4 dark:bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
        <Card className="w-full max-w-4xl rounded-[2rem] border-white/70 bg-white/85 py-0 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardHeader className="space-y-2 text-center">
          <div className="mb-2 flex justify-center">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "h-14 w-14 ring-2 ring-white/80 shadow-sm" } }} />
          </div>
          <div className="flex justify-center">
            <Badge variant="outline" className="rounded-full px-3 py-1 uppercase tracking-[0.2em]">
              Secure Setup
            </Badge>
          </div>
          <CardTitle className="text-3xl font-semibold tracking-[-0.04em]">Connect Gemini access</CardTitle>
          <CardDescription className="mx-auto max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
            Add your Gemini API key once so NotebookLM can unlock protected research flows, group actions, and future conversations.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-4 rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/85 p-6 text-left dark:border-white/10 dark:bg-white/5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">Why this matters</h2>
              <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                Your key stays tied to your authenticated workspace so group creation, profile actions, and protected server routes can work together.
              </p>
              <Separator />
              <div className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
                <div className="flex items-center justify-between">
                  <span>Workspace security</span>
                  <Badge variant="success">Protected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Setup time</span>
                  <Badge variant="secondary">1 minute</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Key source</span>
                  <Badge variant="outline">Google AI Studio</Badge>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 rounded-[1.5rem] border border-zinc-200/80 bg-white/90 p-6 text-left dark:border-white/10 dark:bg-zinc-950/40">
              <div className="space-y-2">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                  <KeyRound className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">API configuration</h2>
                <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Enter a Gemini key for your account. You can update it later from profile settings.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-sm font-medium">Gemini API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="h-12 rounded-xl bg-zinc-50 font-mono text-sm dark:bg-zinc-900/60"
              />
              <p className="text-xs text-zinc-500 pt-1">
                Get your API key securely from{' '}
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1"
                >
                  Google AI Studio <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Setup failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="h-12 w-full cursor-pointer rounded-xl" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save and Continue'}
              </Button>
            </form>
          </div>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
