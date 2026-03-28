'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AlertTriangle, ArrowLeft, FolderKanban, Plus, Sparkles, Trash2 } from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/api';

export default function GroupsPage() {
  const { getToken } = useAuth();
  const [groups, setGroups] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setError('');
        const token = await getToken();
        const response = await apiRequest('/groups', { token });
        setGroups(response.data ?? []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroups();
  }, [getToken]);

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError('Group title is required');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      setMessage('');
      const token = await getToken();
      const response = await apiRequest('/groups', {
        method: 'POST',
        token,
        body: JSON.stringify({ title }),
      });

      setGroups((currentGroups) => [response.data, ...currentGroups]);
      setTitle('');
      setMessage(response.message || 'Group created successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      setDeletingGroupId(groupId);
      setError('');
      setMessage('');
      const token = await getToken();
      const response = await apiRequest(`/groups/${groupId}`, {
        method: 'DELETE',
        token,
      });

      setGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupId));
      setMessage(response.message || 'Group deleted successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingGroupId('');
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
              <div className="flex flex-col gap-5">
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.24em]">
                  <FolderKanban className="size-3.5" />
                  Workspaces
                </Badge>
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-semibold tracking-[-0.05em] text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                    Clean group spaces for every topic.
                  </h1>
                  <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                    Create, open, upload.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" className="h-11 rounded-full px-5">
                    <Link href="/">
                      <ArrowLeft data-icon="inline-start" />
                      Dashboard
                    </Link>
                  </Button>
                  <Badge variant="secondary" className="h-11 rounded-full px-4 text-sm">
                    {groups.length} active groups
                  </Badge>
                </div>
              </div>

              <Card className="rounded-[1.8rem] bg-white/72 py-0 dark:bg-white/6">
                <CardHeader className="pb-3">
                  <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Sparkles />
                  </div>
                  <CardTitle className="text-xl font-semibold">New group</CardTitle>
                  <CardDescription>Short name. Fast start.</CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. ML Research"
                      className="h-12 rounded-2xl bg-white/90 dark:bg-zinc-900/70"
                    />
                    <Button type="submit" disabled={isCreating} className="h-12 rounded-2xl text-sm font-medium">
                      <Plus data-icon="inline-start" />
                      {isCreating ? 'Creating...' : 'Create group'}
                    </Button>
                  </form>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-300">
                    <span>Ready for uploads</span>
                    <Badge variant="success">Live</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {error && (
            <Alert variant="destructive" className="rounded-[1.5rem] border-red-200 bg-red-50 shadow-sm dark:border-red-900/30 dark:bg-red-950/20">
              <AlertTriangle />
              <AlertTitle>Group action failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className="rounded-[1.5rem] border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
              <AlertTitle>Updated</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-2xl font-semibold">All groups</CardTitle>
                  <CardDescription>Open a workspace and start adding sources.</CardDescription>
                </div>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  {groups.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-6">
              {isLoading ? (
                <div className="flex flex-col gap-4 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50/60 p-5 dark:border-zinc-700 dark:bg-white/5">
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                  <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                </div>
              ) : groups.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-zinc-300 bg-white/65 px-6 py-14 text-center dark:border-zinc-700 dark:bg-white/5">
                  <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                    <FolderKanban />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No groups yet</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Create one to begin.</p>
                </div>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex flex-col gap-4 rounded-[1.6rem] border border-white/70 bg-white/88 p-5 transition hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_24px_60px_rgba(59,130,246,0.12)] dark:border-white/10 dark:bg-white/6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <Link href={`/group/${group.id}`} className="min-w-0 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <FolderKanban />
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-2xl font-semibold tracking-[-0.03em] text-zinc-950 dark:text-zinc-50">
                            {group.title}
                          </h2>
                          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{group.id}</p>
                        </div>
                      </div>
                    </Link>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deletingGroupId === group.id}
                      onClick={() => handleDeleteGroup(group.id)}
                      className="h-11 rounded-full px-5"
                    >
                      <Trash2 data-icon="inline-start" />
                      {deletingGroupId === group.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
