'use client';

import Link from 'next/link';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  FolderKanban,
  KeyRound,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/api';

const compactHighlights = [
  { title: 'Link or upload', icon: Upload },
  { title: 'Organize by group', icon: FolderKanban },
  { title: 'Ask for answers', icon: Sparkles },
];

export default function Home() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState(null);
  const [groups, setGroups] = useState([]);
  const [groupTitle, setGroupTitle] = useState('');
  const [pageError, setPageError] = useState('');
  const [groupError, setGroupError] = useState('');
  const [groupMessage, setGroupMessage] = useState('');
  const [isBooting, setIsBooting] = useState(true);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState('');

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setIsBooting(false);
      return;
    }

    const loadDashboard = async () => {
      try {
        setPageError('');
        const token = await getToken();
        const [profileResponse, groupsResponse] = await Promise.all([
          apiRequest('/auth/users/me', { token }),
          apiRequest('/groups', { token }),
        ]);

        setProfile(profileResponse.data ?? null);
        setGroups(groupsResponse.data ?? []);
      } catch (err) {
        setPageError(err.message);
      } finally {
        setIsBooting(false);
      }
    };

    loadDashboard();
  }, [getToken, isLoaded, isSignedIn]);

  const handleCreateGroup = async (event) => {
    event.preventDefault();

    if (!groupTitle.trim()) {
      setGroupError('Group title is required');
      return;
    }

    try {
      setIsCreatingGroup(true);
      setGroupError('');
      setGroupMessage('');
      const token = await getToken();
      const response = await apiRequest('/groups', {
        method: 'POST',
        token,
        body: JSON.stringify({ title: groupTitle }),
      });

      setGroups((currentGroups) => [response.data, ...currentGroups]);
      setGroupTitle('');
      setGroupMessage(response.message || 'Group created successfully');
    } catch (err) {
      setGroupError(err.message);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      setDeletingGroupId(groupId);
      setGroupError('');
      setGroupMessage('');
      const token = await getToken();
      const response = await apiRequest(`/groups/${groupId}`, {
        method: 'DELETE',
        token,
      });

      setGroups((currentGroups) => currentGroups.filter((group) => group.id !== groupId));
      setGroupMessage(response.message || 'Group deleted successfully');
    } catch (err) {
      setGroupError(err.message);
    } finally {
      setDeletingGroupId('');
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-xl space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen px-4 py-8 text-zinc-950 dark:text-zinc-50 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {!isSignedIn ? (
            <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
              <div className="grid gap-8 px-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-14">
                <div className="flex flex-col gap-6">
                  <Badge variant="outline" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.24em]">
                    <Bot className="size-3.5" />
                    AI Workspace
                  </Badge>
                  <div className="flex flex-col gap-3">
                    <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-5xl lg:text-6xl">
                      Your NotebookLM-style workspace.
                    </h1>
                    <p className="max-w-lg text-base text-zinc-600 dark:text-zinc-300">
                      Groups, sources, answers.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <SignInButton mode="modal">
                      <button className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition hover:opacity-90">
                        Open app
                      </button>
                    </SignInButton>
                    <Link
                      href="/onboarding"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white/80 px-6 text-sm font-medium text-zinc-700 transition hover:bg-white dark:bg-transparent dark:text-zinc-200 dark:hover:bg-white/5"
                    >
                      Setup
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3">
                  {compactHighlights.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Card key={item.title} className="rounded-[1.6rem] bg-white/72 py-0 dark:bg-white/6">
                        <CardHeader className="pb-4">
                          <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon />
                          </div>
                          <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/78 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <div className="grid gap-6 px-6 py-7 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-8">
                  <div className="flex flex-col gap-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-col gap-3">
                        <Badge variant="outline" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.24em]">
                          <Bot className="size-3.5" />
                          Workspace
                        </Badge>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant={profile?.hasApiKey ? 'success' : 'warning'}>
                            {profile?.hasApiKey ? 'API connected' : 'API required'}
                          </Badge>
                          <Badge variant="secondary">{groups.length} groups</Badge>
                        </div>
                      </div>
                      <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-11 w-11 ring-2 ring-white/80 shadow-sm' } }} />
                    </div>

                    <div className="flex flex-col gap-3">
                      <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">
                        Build with sources, not guesses.
                      </h1>
                      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                        One dashboard for groups, uploads, and grounded answers.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button asChild className="h-12 rounded-full px-6">
                        <Link href="/groups">
                          Open groups
                          <ArrowRight data-icon="inline-end" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-12 rounded-full px-6">
                        <Link href="/profile">Profile</Link>
                      </Button>
                    </div>
                  </div>

                  <Card className="rounded-[1.8rem] bg-white/72 py-0 dark:bg-white/6">
                    <CardHeader className="pb-3">
                      <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <KeyRound />
                      </div>
                      <CardTitle className="truncate text-2xl font-semibold tracking-tight">
                        {profile?.username || profile?.email || 'Authenticated'}
                      </CardTitle>
                      <CardDescription>Account overview</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-3 pb-6 text-sm text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                        <span>API</span>
                        <Badge variant={profile?.hasApiKey ? 'success' : 'warning'}>
                          {profile?.hasApiKey ? 'Ready' : 'Missing'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                        <span>Groups</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{groups.length}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                        <span>Status</span>
                        <Badge variant="secondary">Live</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[0.84fr_1.16fr]">
                <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="mb-2 inline-flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Plus />
                    </div>
                    <CardTitle className="text-xl font-semibold">Create group</CardTitle>
                    <CardDescription>Keep it short.</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-6">
                    <form onSubmit={handleCreateGroup} className="flex flex-col gap-3">
                      <Input
                        value={groupTitle}
                        onChange={(event) => setGroupTitle(event.target.value)}
                        placeholder="e.g. AI Research"
                        className="h-12 rounded-2xl bg-white/90 dark:bg-zinc-900/70"
                      />
                      <Button type="submit" disabled={isCreatingGroup} className="h-12 rounded-2xl">
                        <Plus data-icon="inline-start" />
                        {isCreatingGroup ? 'Creating...' : 'Create group'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <CardTitle className="text-xl font-semibold">Recent groups</CardTitle>
                        <CardDescription>Open one and start uploading.</CardDescription>
                      </div>
                      <Button asChild variant="ghost" className="rounded-full">
                        <Link href="/groups">View all</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 pb-6">
                    {isBooting ? (
                      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50/60 p-5 dark:border-zinc-700 dark:bg-white/5">
                        <Skeleton className="h-6 w-44" />
                        <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                        <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="rounded-[1.6rem] border border-dashed border-zinc-300 bg-white/65 px-6 py-14 text-center dark:border-zinc-700 dark:bg-white/5">
                        <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                          <FolderKanban />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No groups yet</h2>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Create your first workspace.</p>
                      </div>
                    ) : (
                      groups.slice(0, 3).map((group) => (
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
              </section>

              {pageError && (
                <Alert variant="destructive" className="rounded-[1.5rem] border-red-200 bg-red-50 shadow-sm dark:border-red-900/30 dark:bg-red-950/20">
                  <AlertTriangle />
                  <AlertTitle>Dashboard failed to load</AlertTitle>
                  <AlertDescription>{pageError}</AlertDescription>
                </Alert>
              )}

              {groupError && (
                <Alert variant="destructive" className="rounded-[1.5rem] border-red-200 bg-red-50 shadow-sm dark:border-red-900/30 dark:bg-red-950/20">
                  <AlertTriangle />
                  <AlertTitle>Group action failed</AlertTitle>
                  <AlertDescription>{groupError}</AlertDescription>
                </Alert>
              )}

              {groupMessage && (
                <Alert className="rounded-[1.5rem] border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                  <AlertTitle>Updated</AlertTitle>
                  <AlertDescription>{groupMessage}</AlertDescription>
                </Alert>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
