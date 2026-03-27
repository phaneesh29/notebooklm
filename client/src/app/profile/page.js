'use client';

import { useState } from 'react';
import { useAuth, UserProfile, SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { apiRequest } from '@/lib/api';

import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { getToken } = useAuth();
  const router = useRouter();

  const handleUpdateKey = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const token = await getToken();
      await apiRequest('/auth/users/api-key', {
        method: 'POST',
        token,
        body: JSON.stringify({ apiKey }),
      });

      setMessage('Gemini API key updated successfully!');
      setApiKey('');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)] selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3">
                <Badge variant="outline" className="rounded-full px-3 py-1 uppercase tracking-[0.2em]">Account Center</Badge>
              </div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-900 dark:text-zinc-50">Profile Settings</h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">Manage your identity and NotebookLM integrations.</p>
            </div>
            <div className="flex items-center gap-3">
              <SignOutButton>
                <Button variant="ghost" className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full px-6">
                  Sign Out
                </Button>
              </SignOutButton>
              <Button variant="outline" onClick={() => router.push('/')} className="cursor-pointer shadow-sm rounded-full px-6">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-10">
            <Card className="shadow-sm border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950/50 backdrop-blur-sm overflow-hidden rounded-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-xl">Gemini Configuration</CardTitle>
                </div>
                <CardDescription className="text-base pt-1">
                  Overwrite the API key used for your intelligent NotebookLM interactions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateKey} className="space-y-5 max-w-xl">
                  <div className="space-y-3">
                    <Label htmlFor="apiKey" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      New API Key
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter new API key to overwrite..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="font-mono bg-zinc-50 dark:bg-zinc-900/50 rounded-xl"
                    />
                    <div className="flex items-start gap-2 text-xs text-zinc-500 mt-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p>
                        Need a new key? Visit{' '}
                        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                          Google AI Studio
                        </a> to generate one securely.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {error && (
                    <Alert variant="destructive">
                      <AlertTitle>Unable to update key</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  {message && (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                      <ShieldCheck className="h-4 w-4" />
                      <AlertTitle>Saved</AlertTitle>
                      <AlertDescription>{message}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={isLoading} className="cursor-pointer rounded-full px-8 shadow-sm">
                    {isLoading ? 'Updating Securely...' : 'Update API Key'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="w-full shadow-sm rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800/60 bg-white dark:bg-zinc-950/50">
              <UserProfile 
                routing="hash" 
                appearance={{ 
                  elements: { 
                    rootBox: "w-full shadow-none",
                    card: "shadow-none sm:rounded-none",
                  } 
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
