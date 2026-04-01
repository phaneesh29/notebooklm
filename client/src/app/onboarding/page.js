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

import { Bot, ExternalLink, KeyRound, LoaderCircle, ShieldCheck, Zap } from 'lucide-react';

export default function OnboardingPage() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { getToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError('API Key is required to activate the agent.');
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
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_0%,rgba(63,63,70,0.05),transparent_50%)] animate-in fade-in duration-1000">
      <Card className="w-full max-w-2xl rounded-[3rem] border-white/10 bg-card/60 shadow-[0_50px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden relative ring-1 ring-zinc-500/5">
        <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 translate-x-8 -translate-y-8 pointer-events-none transition-transform duration-1000">
          <Zap className="size-64" />
        </div>
        
        <CardHeader className="space-y-6 text-center pt-16">
          <div className="flex justify-center -mt-8 mb-4">
             <div className="relative group">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
                <UserButton appearance={{ elements: { userButtonAvatarBox: "h-20 w-20 ring-4 ring-background shadow-2xl transition-transform group-hover:scale-105" } }} />
             </div>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-4 py-1.5 bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-[0.2em]">
               System Activation
            </Badge>
            <h1 className="text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 leading-none">Initialize Intelligence</h1>
            <CardDescription className="max-w-md mx-auto text-sm font-bold text-muted-foreground/80 leading-relaxed pt-2">
               Connect your Gemini API gateway to ground the research engine in your authenticated identity.
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pb-16 px-8 sm:px-16 space-y-10">
           <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="space-y-4">
                 <Label htmlFor="apiKey" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 ml-1">Gemini Gateway Key</Label>
                 <div className="relative group">
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-primary/5 transition-all pointer-events-none shadow-sm" />
                    <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                    <Input
                       id="apiKey"
                       type="password"
                       placeholder="Enter AIza key..."
                       value={apiKey}
                       onChange={(e) => setApiKey(e.target.value)}
                       className="pl-14 h-16 rounded-2xl bg-background/50 border-white/5 font-mono text-sm focus-visible:ring-0 focus-visible:shadow-[0_0_30px_rgba(var(--primary),0.05)] transition-all outline-none"
                       autoFocus
                    />
                 </div>
                 <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest leading-none">Generate Access:</span>
                    <a 
                       href="https://aistudio.google.com/app/apikey" 
                       target="_blank" 
                       rel="noreferrer"
                       className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline inline-flex items-center gap-1.5"
                    >
                       Google AI Studio <ExternalLink className="size-3" />
                    </a>
                 </div>
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-[1.5rem] border-destructive/20 bg-destructive/10 animate-in shake-in">
                   <AlertTitle className="text-[10px] font-black uppercase tracking-widest">Access Refused</AlertTitle>
                   <AlertDescription className="text-xs font-bold opacity-80">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" size="lg" className="w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.95] bg-primary ring-4 ring-primary/10" disabled={isLoading}>
                 {isLoading ? (
                   <span className="flex items-center gap-3">
                     <LoaderCircle className="size-5 animate-spin" /> Verifying Connection...
                   </span>
                 ) : 'Enable Research Core'}
              </Button>
           </form>

           <div className="relative">
              <div className="absolute inset-0 flex items-center">
                 <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 bg-card rounded-full px-4 mx-auto w-fit">
                 Protocol Security
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8 text-center pt-2">
              <div className="space-y-2 group">
                 <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-1 transition-transform group-hover:scale-110">
                    <ShieldCheck className="size-6" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">End-to-End</p>
                 <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Vault Enforced</p>
              </div>
              <div className="space-y-2 group">
                 <div className="size-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-1 transition-transform group-hover:scale-110">
                    <Bot className="size-6" />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">System Ready</p>
                 <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Grounded Logic</p>
              </div>
           </div>
        </CardContent>
      </Card>
      
      <div className="mt-10 flex flex-col items-center gap-2 opacity-30">
         <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em] italic">
            Built with grounded intelligence
         </p>
         <div className="h-px w-24 bg-muted-foreground/30" />
      </div>
    </div>
  );
}
