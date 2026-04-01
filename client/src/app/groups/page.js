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
  Trash2, 
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
      <div className="flex-1 flex flex-col pt-6 pb-12 px-4 sm:px-8 max-w-6xl mx-auto w-full gap-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" className="h-9 w-9 rounded-full shadow-sm" asChild>
                <Link href="/"><ArrowLeft className="size-4" /></Link>
             </Button>
             <div className="flex flex-col">
               <div className="flex items-center gap-2 text-xs font-sans font-medium text-muted-foreground mb-1 uppercase tracking-wider">
                  <span className="text-primary hover:underline cursor-pointer">Intelligence</span>
                  <span className="opacity-40">/</span>
                  <span>Workspaces</span>
               </div>
               <h1 className="text-4xl font-serif font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Workspaces</h1>
             </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
             <div className="relative flex-1 min-w-[280px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input 
                   placeholder="Search notebooks..." 
                   className="pl-10 h-10 bg-background border-border" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             
             <form onSubmit={handleCreateGroup} className="flex items-center gap-3">
                <Input 
                  placeholder="New workspace title" 
                  className="h-10 bg-background border-border w-56 sm:w-64"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <Button type="submit" className="h-10 shadow-sm transition-all" disabled={isCreating}>
                  {isCreating ? <LoaderCircle className="animate-spin size-4" /> : <Plus className="size-4 mr-2" />}
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
             </form>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {isLoading ? (
             Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl bg-muted/40" />)
           ) : filteredGroups.length === 0 ? (
             <div className="col-span-full py-28 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-transparent to-muted/20 border-border/40 rounded-2xl">
                <div className="p-4 rounded-xl bg-background/50 border border-border shadow-sm backdrop-blur-sm">
                  <FolderKanban className="size-8 text-muted-foreground/60" />
                </div>
                <div className="text-center space-y-2">
                   <h2 className="text-xl font-serif font-medium tracking-tight">System Empty</h2>
                   <p className="text-sm font-sans text-muted-foreground max-w-sm">Add a workspace to initiate research grounded intelligence.</p>
                </div>
             </div>
           ) : (
             filteredGroups.map((g) => (
               <Card key={g.id} className="group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 bg-card border border-border/40 relative flex flex-col min-h-[200px] rounded-2xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <Link href={`/group/${g.id}`} className="flex-1 block p-6 pb-2 relative z-10">
                     <div className="flex items-start justify-between mb-4">
                        <div className="p-2 rounded-md bg-primary/10 text-primary">
                           <FolderKanban className="size-5" />
                        </div>
                        <Badge variant="secondary" className="text-[10px] font-medium px-2 py-0 h-5">
                           Notebook
                        </Badge>
                     </div>
                     <CardTitle className="text-xl font-serif font-semibold tracking-tight transition-colors">{g.title}</CardTitle>
                     <CardDescription className="text-[11px] font-sans font-medium text-muted-foreground truncate opacity-60 mt-1 uppercase tracking-widest">{g.id.split('-')[0]}</CardDescription>
                  </Link>
                  <div className="px-6 pb-4 pt-4 flex justify-between items-center mt-auto border-t border-border/30 z-10">
                     <span className="text-[10px] font-medium text-muted-foreground">
                       Ground Ready
                     </span>
                     <Button 
                       variant="ghost" 
                       size="icon" 
                       className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                       disabled={deletingId === g.id}
                       onClick={(e) => { e.preventDefault(); handleDeleteGroup(g.id); }}
                     >
                       <Trash2 className="size-4" />
                     </Button>
                  </div>
               </Card>
             ))
           )}
        </section>
      </div>
    </AuthGuard>
  );
}
