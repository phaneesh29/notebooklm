'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  ArrowLeft, 
  FolderKanban, 
  LoaderCircle,
  Plus, 
  Search, 
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

export default function GroupsPage() {
  const { getToken } = useAuth();
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        const token = await getToken();
        const response = await apiRequest('/groups', { token });
        setGroups(response.data ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadGroups();
  }, [getToken]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      setIsCreating(true);
      const token = await getToken();
      const response = await apiRequest('/groups', {
        method: 'POST',
        token,
        body: JSON.stringify({ title }),
      });
      setGroups([response.data, ...groups]);
      setTitle('');
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

  const filteredGroups = groups.filter(g => g.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col pt-6 pb-12 px-4 sm:px-8 max-w-7xl mx-auto w-full gap-8 animate-in fade-in duration-1000 bg-[radial-gradient(circle_at_50%_0%,rgba(63,63,70,0.03),transparent_40%)]">
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" className="rounded-full bg-muted/20 hover:bg-muted/40 transition-all active:scale-90" asChild>
                <Link href="/"><ArrowLeft className="size-4" /></Link>
             </Button>
             <div className="flex flex-col">
               <div className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground/40 mb-1">
                  <span className="hover:text-primary transition-colors cursor-pointer">Intelligence</span>
                  <span className="opacity-40">/</span>
                  <span className="text-primary/60">Workspaces</span>
               </div>
               <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Workspaces</h1>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
             <div className="relative flex-1 min-w-[280px] group">
                <div className="absolute inset-0 rounded-full ring-1 ring-primary/5 transition-all pointer-events-none shadow-sm" />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                   placeholder="Search notebooks..." 
                   className="pl-11 h-12 rounded-full bg-background/50 backdrop-blur-sm border-white/5 focus-visible:ring-0 focus-visible:shadow-[0_0_20px_rgba(var(--primary),0.05)] transition-all font-bold tracking-tight text-sm outline-none" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             
             <form onSubmit={handleCreateGroup} className="flex items-center gap-3 group">
                <div className="relative group">
                  <div className="absolute inset-0 rounded-full ring-1 ring-primary/10 transition-all pointer-events-none shadow-sm" />
                  <Input 
                    placeholder="New workspace title" 
                    className="h-12 rounded-full bg-background/50 backdrop-blur-sm border-white/5 focus-visible:ring-0 w-56 sm:w-72 font-bold tracking-tight text-sm px-6 outline-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <Button type="submit" size="icon" className="h-12 w-12 rounded-full shadow-2xl shadow-primary/20 hover:scale-110 active:scale-90 transition-all bg-primary ring-4 ring-primary/10" disabled={isCreating}>
                  {isCreating ? <LoaderCircle className="animate-spin" /> : <Plus className="size-5" />}
                </Button>
             </form>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {isLoading ? (
             Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52 rounded-[3rem]" />)
           ) : filteredGroups.length === 0 ? (
             <div className="col-span-full py-32 flex flex-col items-center justify-center gap-8 bg-muted/5 border-2 border-dashed border-zinc-500/10 rounded-[3rem] opacity-60">
                <div className="p-8 rounded-[2rem] bg-background shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-zinc-500/5">
                  <FolderKanban className="size-16 text-muted-foreground/30" />
                </div>
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-black uppercase tracking-tight">System Empty</h2>
                   <p className="text-sm font-medium text-muted-foreground">Add a workspace to initiate research grounded intelligence.</p>
                </div>
             </div>
           ) : (
             filteredGroups.map((g) => (
               <Card key={g.id} className="rounded-[3rem] group hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] transition-all duration-700 hover:-translate-y-2 bg-card/60 backdrop-blur-md border-white/10 overflow-hidden relative shadow-sm ring-1 ring-zinc-500/5 hover:ring-primary/20">
                  <Link href={`/group/${g.id}`} className="block">
                    <CardHeader className="p-8 pb-4">
                       <div className="flex items-center justify-between mb-4">
                          <div className="p-4 rounded-[1.2rem] bg-primary/10 text-primary shadow-inner transition-transform group-hover:scale-110">
                             <FolderKanban className="size-6" />
                          </div>
                          <Badge variant="outline" className="rounded-full bg-background/80 border-white/20 text-[10px] font-black px-3 py-1 uppercase tracking-widest text-muted-foreground/60">
                             Notebook
                          </Badge>
                       </div>
                       <CardTitle className="text-2xl font-black tracking-tighter group-hover:text-primary transition-colors mb-1">{g.title}</CardTitle>
                       <CardDescription className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40 group-hover:opacity-60 transition-opacity">{g.id}</CardDescription>
                    </CardHeader>
                  </Link>
                  <CardContent className="px-8 pb-8 pt-0 mt-6 flex justify-between items-center bg-gradient-to-t from-muted/20 to-transparent">
                     <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] italic">
                       Ground Ready
                     </span>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="size-11 rounded-2xl text-zinc-300 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                       disabled={deletingId === g.id}
                       onClick={() => handleDeleteGroup(g.id)}
                     >
                       <Trash2 className="size-4" />
                     </Button>
                  </CardContent>
                  {/* Decorative background element */}
                  <div className="absolute -bottom-10 -right-10 p-16 opacity-[0.02] pointer-events-none rotate-12 transition-transform duration-1000 group-hover:rotate-45 group-hover:scale-125">
                    <Zap className="size-48" />
                  </div>
               </Card>
             ))
           )}
        </section>
      </div>
    </AuthGuard>
  );
}
