'use client';

import Link from 'next/link';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { 
  ArrowRight, 
  Bot, 
  Compass, 
  FolderKanban, 
  KeyRound, 
  LoaderCircle,
  Plus, 
  Sparkles, 
  Trash2, 
  Zap 
} from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/api';

export default function Home() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      if (isLoaded) setIsLoading(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        const token = await getToken();
        const [profileRes, groupsRes] = await Promise.all([
          apiRequest('/auth/users/me', { token }),
          apiRequest('/groups', { token }),
        ]);
        setProfile(profileRes.data);
        setGroups(groupsRes.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [getToken, isLoaded, isSignedIn]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupTitle.trim()) return;
    try {
      setIsCreating(true);
      const token = await getToken();
      const res = await apiRequest('/groups', {
        method: 'POST',
        token,
        body: JSON.stringify({ title: groupTitle }),
      });
      setGroups([res.data, ...groups]);
      setGroupTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (id) => {
    try {
      setDeletingId(id);
      const token = await getToken();
      await apiRequest(`/groups/${id}`, { method: 'DELETE', token });
      setGroups(groups.filter(g => g.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId('');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoaderCircle className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Guest Landing Page ---
  if (!isSignedIn) {
    return (
      <div className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-5xl px-6 py-24 sm:py-32 flex flex-col items-center text-center gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 bg-[radial-gradient(circle_at_50%_0%,rgba(63,63,70,0.05),transparent_50%)]">
          <Badge variant="secondary" className="rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
             Next-Gen AI Research
          </Badge>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tighter bg-gradient-to-b from-zinc-950 to-zinc-600 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent leading-[1.1]">
             Your Intelligence, <br /> Organized.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed font-medium">
            NotebookLM-style workspaces that ground Gemini in your own sources. Link files, YouTube, or web pages and get answers that never hallucinate.
          </p>
          <div className="flex items-center gap-4 pt-4">
            <SignInButton mode="modal">
               <Button size="lg" className="rounded-full h-14 px-8 font-black shadow-2xl transition-all hover:scale-105 active:scale-95 bg-primary ring-4 ring-primary/10">
                 Get Started Free <ArrowRight className="size-4 ml-2" />
               </Button>
            </SignInButton>
            <Button size="lg" variant="outline" className="rounded-full h-14 px-8 font-black hover:bg-muted border-white/10" asChild>
               <Link href="/onboarding">Setup Guide</Link>
            </Button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full max-w-7xl px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8 animate-in fade-in duration-1000 delay-300">
           {[
             { title: 'Grounded Responses', desc: 'AI answers based strictly on the documents you provide.', icon: Sparkles, color: 'text-amber-500' },
             { title: 'Multi-Source Groups', desc: 'Organize research by project. Mix PDFs, links, and docs.', icon: FolderKanban, color: 'text-blue-500' },
             { title: 'Secure & Private', desc: 'Your data stays within your authenticated workspaces.', icon: KeyRound, color: 'text-emerald-500' },
           ].map((feat, i) => (
             <Card key={i} className="rounded-[3rem] p-6 bg-card/60 backdrop-blur-md border-white/10 shadow-sm transition-all hover:bg-card/80 hover:ring-1 ring-primary/20 hover:shadow-2xl">
                <CardHeader className="p-0">
                   <div className={`p-4 rounded-[1.2rem] bg-background shadow-inner w-fit ${feat.color}`}>
                     <feat.icon className="size-6" />
                   </div>
                   <CardTitle className="pt-6 text-2xl font-black tracking-tight">{feat.title}</CardTitle>
                   <CardDescription className="text-sm font-medium leading-relaxed pt-2">{feat.desc}</CardDescription>
                </CardHeader>
             </Card>
           ))}
        </section>
      </div>
    );
  }

  // --- User Dashboard ---
  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col pt-8 pb-12 px-4 sm:px-8 max-w-7xl mx-auto w-full gap-10 animate-in fade-in duration-700 bg-[radial-gradient(circle_at_50%_0%,rgba(63,63,70,0.03),transparent_40%)]">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/40">
             <span className="text-primary/60">Intelligence</span>
             <span className="opacity-40">/</span>
             <span>Dashboard</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Welcome back, {profile?.username || 'Researcher'}
          </h1>
          <p className="text-muted-foreground font-bold text-sm">You have {groups.length} active research workspaces ready for interaction.</p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Your Notebooks</h2>
              <Button asChild variant="ghost" size="sm" className="rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all">
                 <Link href="/groups">View All Workspaces</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {isLoading ? (
                 Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-[3rem]" />)
               ) : groups.length === 0 ? (
                 <div className="col-span-full py-20 flex flex-col items-center justify-center gap-6 bg-muted/5 border-2 border-dashed border-zinc-500/10 rounded-[3rem] opacity-60">
                    <FolderKanban className="size-12 text-muted-foreground/20" />
                    <p className="font-black uppercase text-xs tracking-widest">No Active Notebooks</p>
                    <Button variant="outline" className="rounded-full px-6 text-[10px] font-black uppercase tracking-widest" onClick={() => document.getElementById('new-group-input')?.focus()}>
                       Initialize First Workspace
                    </Button>
                 </div>
               ) : (
                 groups.slice(0, 4).map((g) => (
                   <Card key={g.id} className="rounded-[2.5rem] group hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-1 bg-card/60 backdrop-blur-md border-white/10 ring-1 ring-zinc-500/5 hover:ring-primary/20 relative overflow-hidden">
                      <Link href={`/group/${g.id}`} className="block">
                        <CardHeader className="p-7">
                           <div className="flex items-center justify-between mb-4">
                              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                                 <FolderKanban className="size-5" />
                              </div>
                              <Badge variant="outline" className="rounded-full text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-0.5 bg-background/50 border-white/10">Notebook</Badge>
                           </div>
                           <CardTitle className="pt-2 text-2xl font-black tracking-tighter group-hover:text-primary transition-colors">{g.title}</CardTitle>
                           <CardDescription className="truncate text-[10px] font-mono uppercase tracking-widest opacity-40 pt-2">{g.id}</CardDescription>
                        </CardHeader>
                      </Link>
                      <CardContent className="flex justify-between items-center p-7 pt-2 border-t bg-muted/5">
                         <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] italic">Active Flow</span>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="size-10 rounded-2xl text-zinc-300 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                           disabled={deletingId === g.id}
                           onClick={() => handleDeleteGroup(g.id)}
                         >
                           <Trash2 className="size-4" />
                         </Button>
                      </CardContent>
                      <div className="absolute -bottom-6 -right-6 p-10 opacity-[0.02] pointer-events-none rotate-12 group-hover:rotate-45 transition-transform duration-1000">
                        <Zap className="size-24" />
                      </div>
                   </Card>
                 ))
               )}
            </div>
          </div>

          <aside className="space-y-10 pl-2 lg:pl-10">
             <div className="space-y-6">
                <div className="flex items-center gap-4">
                   <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 whitespace-nowrap leading-none">Intelligence Hub</h2>
                   <div className="h-px flex-1 bg-border/40" />
                </div>

                <Card className="rounded-[3rem] bg-zinc-950 text-white shadow-2xl overflow-hidden relative shadow-primary/20 ring-4 ring-zinc-500/10">
                   <div className="absolute top-0 right-0 p-6 opacity-10 rotate-12 scale-150 pointer-events-none">
                     <Zap className="size-32" />
                   </div>
                   <CardHeader className="p-8 pb-4 relative z-10">
                      <CardTitle className="text-2xl font-black tracking-tight">Fast Research</CardTitle>
                      <CardDescription className="text-zinc-400 font-medium pt-1">Initialize a ground-ready notebook instantly.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-8 pt-4 space-y-6 relative z-10">
                   <form onSubmit={handleCreateGroup} className="space-y-4">
                         <div className="relative group">
                            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 transition-all pointer-events-none" />
                            <Input 
                              id="new-group-input"
                              placeholder="E.g. Quantum Computing" 
                              className="bg-white/5 border-white/5 text-white placeholder:text-white/30 rounded-2xl h-14 px-5 font-bold tracking-tight focus-visible:ring-0 outline-none"
                              value={groupTitle}
                              onChange={(e) => setGroupTitle(e.target.value)}
                            />
                         </div>
                         <Button type="submit" className="w-full h-14 rounded-2xl bg-white text-zinc-950 hover:bg-zinc-200 font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all" disabled={isCreating}>
                           {isCreating ? <LoaderCircle className="animate-spin" /> : 'Launch Notebook'}
                         </Button>
                      </form>
                   </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] bg-card/60 backdrop-blur-md border-white/10 ring-1 ring-zinc-500/5 shadow-sm overflow-hidden">
                   <CardHeader className="p-7 pb-4">
                      <div className="flex items-center gap-3">
                         <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                            <KeyRound className="size-5" />
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">System Security</span>
                      </div>
                   </CardHeader>
                   <CardContent className="px-7 pb-7 pt-4 space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-[1.5rem] bg-background/50 border border-white/5 shadow-inner">
                         <span className="text-xs font-bold text-muted-foreground/80">API Gateway</span>
                         <Badge variant={profile?.hasApiKey ? 'success' : 'warning'} className="rounded-full px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                           {profile?.hasApiKey ? 'Connected' : 'Missing'}
                         </Badge>
                      </div>
                      <Button size="sm" className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 ${profile?.hasApiKey ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`} asChild>
                        <Link href={profile?.hasApiKey ? '/profile' : '/onboarding'}>
                          {profile?.hasApiKey ? 'Update Gateway Key' : 'Activate Access'}
                        </Link>
                      </Button>
                      <p className="text-[9px] text-muted-foreground/40 font-bold text-center uppercase tracking-widest px-4 leading-relaxed">
                        Securely grounded in your local identity.
                      </p>
                   </CardContent>
                </Card>
             </div>
          </aside>
        </section>
      </div>
    </AuthGuard>
  );
}
