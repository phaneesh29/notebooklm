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
        <section className="w-full max-w-6xl px-6 py-24 sm:py-32 flex flex-col items-center text-center gap-8 animate-in fade-in duration-700">
          <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/12 text-primary border-primary/25 shadow-sm">
             Next-Gen AI Research
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
             Your Intelligence, <br /> Organized.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">
            NotebookLM-style workspaces that ground Gemini in your own sources. Link files, YouTube, or web pages and get answers that never hallucinate.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <SignInButton mode="modal">
               <Button size="lg" className="h-12 px-6 font-medium shadow-md transition-all bg-primary hover:bg-primary/90 hover:-translate-y-0.5">
                 Get Started Free <ArrowRight className="size-4 ml-2" />
               </Button>
            </SignInButton>
            <Button size="lg" variant="outline" className="h-12 px-6 font-medium shadow-sm border-border/70 bg-card/50" asChild>
               <Link href="/onboarding">Setup Guide</Link>
            </Button>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="w-full max-w-6xl px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-700 delay-200">
           {[
             { title: 'Grounded Responses', desc: 'AI answers based strictly on the documents you provide.', icon: Sparkles, color: 'text-amber-500' },
             { title: 'Multi-Source Groups', desc: 'Organize research by project. Mix PDFs, links, and docs.', icon: FolderKanban, color: 'text-blue-500' },
             { title: 'Secure & Private', desc: 'Your data stays within your authenticated workspaces.', icon: KeyRound, color: 'text-emerald-500' },
           ].map((feat, i) => (
             <Card key={i} className="bg-card/70 backdrop-blur-sm shadow-sm border border-border/60 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <CardHeader className="p-6">
                   <div className={`p-2.5 rounded-lg bg-muted/50 w-fit ${feat.color} border border-border/50 mb-4`}>
                     <feat.icon className="size-5" />
                   </div>
                   <CardTitle className="text-xl font-semibold">{feat.title}</CardTitle>
                   <CardDescription className="text-sm leading-relaxed mt-2">{feat.desc}</CardDescription>
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
      <div className="flex-1 flex flex-col pt-10 pb-14 px-4 sm:px-8 max-w-6xl mx-auto w-full gap-9 animate-in fade-in duration-500">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
             <span className="text-primary">Intelligence</span>
             <span className="opacity-40">/</span>
             <span>Dashboard</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome back, {profile?.username || 'Researcher'}
          </h1>
          <p className="text-muted-foreground text-sm">You have {groups.length} active research workspaces ready for interaction.</p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 mt-2">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Recent Notebooks</h2>
              <Button asChild variant="ghost" size="sm" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                 <Link href="/groups">View All</Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {isLoading ? (
                 Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
               ) : groups.length === 0 ? (
                 <div className="col-span-full py-16 flex flex-col items-center justify-center gap-4 bg-muted/20 border border-dashed border-border/60 rounded-xl">
                    <FolderKanban className="size-8 text-muted-foreground/40" />
                    <p className="font-medium text-sm text-muted-foreground">No active notebooks</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => document.getElementById('new-group-input')?.focus()}>
                       Create Workspace
                    </Button>
                 </div>
               ) : (
                 groups.slice(0, 4).map((g) => (
                   <Card key={g.id} className="group hover:border-primary/35 transition-all duration-300 bg-card/75 backdrop-blur-sm border border-border/60 shadow-sm relative overflow-hidden flex flex-col hover:-translate-y-0.5 hover:shadow-md">
                      <Link href={`/group/${g.id}`} className="flex-1 block p-5">
                         <div className="flex items-start justify-between mb-3">
                            <div className="p-2 rounded-md bg-primary/10 text-primary">
                               <FolderKanban className="size-4" />
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0 h-5">Notebook</Badge>
                         </div>
                         <CardTitle className="text-lg font-semibold group-hover:text-primary transition-colors">{g.title}</CardTitle>
                         <CardDescription className="truncate text-xs text-muted-foreground mt-1 opacity-70">ID: {g.id}</CardDescription>
                      </Link>
                      <div className="px-5 pb-4 flex justify-between items-center mt-auto border-t border-border/30 pt-3">
                         <span className="text-[10px] font-medium text-muted-foreground">Active Workspace</span>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                           disabled={deletingId === g.id}
                           onClick={() => handleDeleteGroup(g.id)}
                         >
                           <Trash2 className="size-3.5" />
                         </Button>
                      </div>
                   </Card>
                 ))
               )}
            </div>
          </div>

          <aside className="space-y-6">
             <div className="space-y-4">
                <Card className="bg-card/75 backdrop-blur-sm shadow-sm border border-border/60 overflow-hidden">
                   <CardHeader className="p-6 pb-4 border-b border-border/30 bg-muted/10">
                      <CardTitle className="text-base font-semibold">Fast Initialize</CardTitle>
                      <CardDescription className="text-sm mt-1">Create a ground-ready notebook instantly.</CardDescription>
                   </CardHeader>
                   <CardContent className="p-6 space-y-4">
                      <form onSubmit={handleCreateGroup} className="space-y-3">
                          <Input 
                            id="new-group-input"
                            placeholder="E.g. Quantum Computing" 
                            className="bg-background border-border/60 h-10 px-3 text-sm"
                            value={groupTitle}
                            onChange={(e) => setGroupTitle(e.target.value)}
                          />
                          <Button type="submit" className="w-full h-10 text-sm font-medium shadow-sm transition-all" disabled={isCreating}>
                            {isCreating ? <LoaderCircle className="animate-spin size-4" /> : 'Create Notebook'}
                          </Button>
                      </form>
                   </CardContent>
                </Card>

                <Card className="bg-card/75 backdrop-blur-sm shadow-sm border border-border/60 overflow-hidden">
                   <CardHeader className="p-5 pb-3 flex flex-row items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-md">
                         <KeyRound className="size-4" />
                      </div>
                      <span className="text-sm font-semibold">System Configuration</span>
                   </CardHeader>
                   <CardContent className="px-5 pb-5 pt-2 space-y-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                         <span className="text-xs font-medium">API Context</span>
                         <Badge variant={profile?.hasApiKey ? 'outline' : 'warning'} className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${profile?.hasApiKey ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' : ''}`}>
                           {profile?.hasApiKey ? 'Connected' : 'Missing'}
                         </Badge>
                      </div>
                      <Button size="sm" variant={profile?.hasApiKey ? 'outline' : 'default'} className="w-full h-9 text-xs font-medium" asChild>
                        <Link href={profile?.hasApiKey ? '/profile' : '/onboarding'}>
                          {profile?.hasApiKey ? 'Manage API Key' : 'Setup API Access'}
                        </Link>
                      </Button>
                   </CardContent>
                </Card>
             </div>
          </aside>
        </section>
      </div>
    </AuthGuard>
  );
}
