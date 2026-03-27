'use client';

import { useState } from 'react';
import { useAuth, UserProfile, SignOutButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';

import { KeyRound, ShieldCheck } from 'lucide-react';

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
      const res = await fetch('http://localhost:8080/api/v1/auth/users/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update API key');
      }

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
      <div className="min-h-screen bg-zinc-50/50 dark:bg-black py-16 px-4 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
        <div className="max-w-4xl mx-auto space-y-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Profile Settings</h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">Manage your identity and NotebookLM integrations.</p>
            </div>
            <div className="flex items-center gap-3">
              <SignOutButton>
                <Button variant="ghost" className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full px-6">
                  Sign Out
                </Button>
              </SignOutButton>
              <Button variant="outline" onClick={() => router.push('/')} className="cursor-pointer shadow-sm rounded-full px-6">
                &larr; Back to Dashboard
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-10">
            {/* Custom Shadcn card for Gemini API Key */}
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

                  {error && <div className="text-sm font-medium text-red-600 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl">{error}</div>}
                  {message && <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl">{message}</div>}

                  <Button type="submit" disabled={isLoading} className="cursor-pointer rounded-full px-8 shadow-sm">
                    {isLoading ? 'Updating Securely...' : 'Update API Key'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Clerk native profile component */}
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
