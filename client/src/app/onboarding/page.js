'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

import { ExternalLink } from 'lucide-react';

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
        throw new Error(data.message || 'Failed to save API key');
      }

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black p-4 font-sans">
      <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <UserButton appearance={{ elements: { userButtonAvatarBox: "w-14 h-14" } }} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">API Configuration</CardTitle>
          <CardDescription className="text-zinc-500">
            Please enter your Gemini API Key. You need this to use NotebookLM.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="apiKey" className="text-sm font-medium">Gemini API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
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
              <div className="text-sm text-red-500 font-medium p-3 bg-red-50 dark:bg-red-900/10 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full cursor-pointer" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
