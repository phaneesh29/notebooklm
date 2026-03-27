'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ArrowLeft, FolderKanban, LoaderCircle, Plus, Trash2 } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                  <FolderKanban className="h-3.5 w-3.5" />
                  Group Workspace
                </div>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                    Create the containers your research will live in.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                    Group documents and conversations by topic, project, or client so the rest of the product has a clean structure to build on.
                  </p>
                </div>
                <Button asChild variant="outline" className="h-12 rounded-full px-6 text-sm font-medium">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4" />
                    Back to dashboard
                  </Link>
                </Button>
              </div>

              <Card className="rounded-[1.75rem] border-zinc-200/80 bg-zinc-50/90 py-0 dark:border-white/10 dark:bg-white/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold">New group</CardTitle>
                  <CardDescription>Name a workspace for a topic, course, or research stream.</CardDescription>
                </CardHeader>
                <CardContent className="pb-6">
                  <form onSubmit={handleCreateGroup} className="space-y-4">
                    <Input
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      placeholder="e.g. Q2 Product Research"
                      className="h-12 rounded-xl bg-white dark:bg-zinc-900/80"
                    />
                    <Button type="submit" disabled={isCreating} className="h-12 w-full rounded-xl text-sm font-medium">
                      <Plus className="h-4 w-4" />
                      {isCreating ? 'Creating group...' : 'Create group'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </section>

          {error && (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
              {message}
            </div>
          )}

          <section className="grid gap-4">
            {isLoading ? (
              <div className="flex min-h-56 items-center justify-center rounded-[1.75rem] border border-white/70 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                  Loading groups...
                </div>
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-zinc-300 bg-white/70 px-6 py-14 text-center shadow-sm dark:border-zinc-700 dark:bg-white/5">
                <div className="mx-auto mb-4 inline-flex rounded-2xl bg-zinc-950 p-3 text-white dark:bg-white dark:text-zinc-950">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No groups yet</h2>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                  Create your first group above to start organizing notes, documents, and future conversations.
                </p>
              </div>
            ) : (
              groups.map((group) => (
                <Card key={group.id} className="rounded-[1.75rem] border-white/70 bg-white/80 py-0 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-semibold text-zinc-950 dark:text-zinc-50">{group.title}</h2>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{group.id}</p>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deletingGroupId === group.id}
                      onClick={() => handleDeleteGroup(group.id)}
                      className="h-11 rounded-full px-5 text-sm font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deletingGroupId === group.id ? 'Deleting...' : 'Delete'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </section>
        </div>
      </div>
    </AuthGuard>
  );
}
