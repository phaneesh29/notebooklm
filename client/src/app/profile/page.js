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
import Link from 'next/link';

import { ArrowLeft, KeyRound, LogOut, ShieldCheck, Zap } from 'lucide-react';

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
      <div className="flex-1 flex flex-col pt-8 pb-12 px-4 sm:px-8 max-w-5xl mx-auto w-full gap-10 animate-in fade-in duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(63,63,70,0.03),transparent_40%)]">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
           <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="rounded-full bg-muted/20 hover:bg-muted/40 transition-all active:scale-90" asChild>
                <Link href="/"><ArrowLeft className="size-4" /></Link>
             </Button>
             <div className="flex flex-col">
               <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/40 mb-1">
                  <span>Intelligence</span>
                  <span className="opacity-40">/</span>
                  <span className="text-primary/60">Settings</span>
               </div>
               <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Identity Center</h1>
             </div>
          </div>
          <SignOutButton>
             <Button variant="destructive" className="rounded-full px-8 font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-destructive/20 h-11 active:scale-95 transition-all">
                <LogOut className="size-4 mr-2" />
                Terminate Session
             </Button>
          </SignOutButton>
        </header>

        <div className="grid grid-cols-1 gap-10">
           {/* Gemini Configuration */}
           <Card className="rounded-[3rem] bg-card/60 backdrop-blur-md border-white/10 overflow-hidden relative ring-1 ring-zinc-500/5 shadow-sm">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] -rotate-12 translate-x-4 -translate-y-4 pointer-events-none">
                 <KeyRound className="size-48" />
              </div>
              <CardHeader className="p-8 pb-4">
                 <div className="flex items-center gap-4 mb-3">
                    <div className="p-4 bg-primary/10 text-primary rounded-[1.2rem] shadow-inner">
                       <Zap className="size-6" />
                    </div>
                    <div className="space-y-1">
                       <CardTitle className="text-2xl font-black tracking-tight">Gemini Gateway</CardTitle>
                       <CardDescription className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest leading-none pt-1">
                          Protocol Configuration
                       </CardDescription>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-8 pt-4">
                 <form onSubmit={handleUpdateKey} className="space-y-8 max-w-xl">
                    <div className="space-y-4">
                       <Label htmlFor="apiKey" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">New Gateway Key</Label>
                       <div className="relative group">
                          <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/5 transition-all pointer-events-none shadow-sm" />
                          <Input
                             id="apiKey"
                             type="password"
                             placeholder="Overwrite active mission key..."
                             value={apiKey}
                             onChange={(e) => setApiKey(e.target.value)}
                             className="h-14 rounded-2xl bg-background/50 border-white/5 font-mono text-sm px-6 focus-visible:ring-0 focus-visible:shadow-[0_0_20px_rgba(var(--primary),0.05)] transition-all outline-none"
                          />
                       </div>
                       <div className="flex items-start gap-2 text-[10px] text-muted-foreground/60 font-medium px-1">
                          <ShieldCheck className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <p>
                             Protocol updates are encrypted instantly. Visit
                             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary font-black hover:underline mx-1 uppercase tracking-widest text-[9px]">
                                Google Studio
                             </a> 
                             to verify key integrity.
                          </p>
                       </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="rounded-[1.5rem] bg-destructive/10 border-destructive/20 animate-in shake-in">
                         <AlertTitle className="text-[10px] font-black uppercase tracking-widest mb-1">Update Synchronicity Failed</AlertTitle>
                         <AlertDescription className="text-xs font-bold opacity-80">{error}</AlertDescription>
                      </Alert>
                    )}
                    {message && (
                      <Alert className="rounded-[1.5rem] border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                         <ShieldCheck className="size-4" />
                         <AlertTitle className="text-[10px] font-black uppercase tracking-widest mb-1">Configuration Synced</AlertTitle>
                         <AlertDescription className="text-xs font-bold opacity-80">{message}</AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={isLoading} className="rounded-full h-14 px-10 font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 bg-primary ring-4 ring-primary/10">
                       {isLoading ? 'Encrypting...' : 'Update Mission Access'}
                    </Button>
                 </form>
              </CardContent>
           </Card>

           {/* User Profile */}
           <div className="rounded-[3rem] border border-white/10 bg-card/60 backdrop-blur-md overflow-hidden shadow-sm relative ring-1 ring-zinc-500/5">
              <div className="p-8 border-b bg-muted/20">
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40">Researcher Identity Protocol</h2>
              </div>
              <UserProfile 
                routing="hash" 
                appearance={{ 
                  elements: { 
                    rootBox: "w-full shadow-none",
                    card: "shadow-none sm:rounded-none w-full bg-transparent p-0",
                    navbar: "hidden",
                    scrollBox: "p-4 sm:p-8",
                    cardBox: "shadow-none border-none bg-transparent"
                  } 
                }} 
              />
           </div>
        </div>
        
        <div className="text-center opacity-30 pb-4 flex flex-col items-center gap-2">
           <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.5em] italic">
              AI Notebook Intelligence v1.02.4
           </p>
           <div className="h-px w-32 bg-muted-foreground/30" />
        </div>
      </div>
    </AuthGuard>
  );
}
