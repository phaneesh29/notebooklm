'use client';

import Link from 'next/link';
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Brain,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';

const dashboardHighlights = [
  {
    title: 'Structured research',
    description: 'Separate work by theme, course, or client so context stays clean as the product grows.',
    icon: FolderKanban,
  },
  {
    title: 'Secure model access',
    description: 'Authentication and API key management remain behind validated server-side routes.',
    icon: ShieldCheck,
  },
  {
    title: 'Operator speed',
    description: 'Fast create flows, clear status, and polished workspace surfaces reduce friction.',
    icon: Sparkles,
  },
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
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 text-zinc-950 dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          {!isSignedIn ? (
            <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
              <div className="grid gap-10 px-8 py-12 lg:grid-cols-[1.15fr_0.85fr] lg:px-12 lg:py-16">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Premium Research Dashboard
                  </div>
                  <div className="space-y-4">
                    <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                      Organize every notebook stream before the first document lands.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg">
                      NotebookLM gives you a clean operating surface for grouped research, protected access, and future conversations built around real structure.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <SignInButton mode="modal">
                      <button className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200">
                        Enter Dashboard
                      </button>
                    </SignInButton>
                    <Link
                      href="/onboarding"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-300 bg-white px-6 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-white/15 dark:bg-transparent dark:text-zinc-200 dark:hover:bg-white/5"
                    >
                      Open Onboarding
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4">
                  {dashboardHighlights.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Card
                        key={item.title}
                        className="rounded-[1.6rem] border-zinc-200/80 bg-zinc-50/90 py-0 shadow-sm dark:border-white/10 dark:bg-white/5"
                      >
                        <CardHeader className="pb-2">
                          <div className="mb-3 inline-flex rounded-2xl bg-zinc-950 p-3 text-white dark:bg-white dark:text-zinc-950">
                            <Icon className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg font-semibold">{item.title}</CardTitle>
                          <CardDescription className="leading-6">{item.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : (
            <>
              <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-8">
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-white shadow-sm dark:bg-white dark:text-zinc-950">
                            <Bot className="h-4 w-4" />
                          </span>
                          <span className="font-medium tracking-[0.2em] uppercase">Research Command Center</span>
                        </div>
                      </div>
                      <UserButton appearance={{ elements: { userButtonAvatarBox: 'h-11 w-11 ring-2 ring-white/80 shadow-sm' } }} />
                    </div>

                    <div className="space-y-4">
                      <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                        Build, review, and steer your groups from one place.
                      </h1>
                      <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                        The main dashboard now acts like your workspace home: status on the right, creation flow up front, and every group visible without leaving the page.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button asChild className="h-12 rounded-full px-6 text-sm font-medium">
                        <Link href="/profile">
                          Open Profile
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="h-12 rounded-full px-6 text-sm font-medium">
                        <Link href="/onboarding">Manage API Access</Link>
                      </Button>
                    </div>
                  </div>

                  <Card className="rounded-[1.75rem] border-zinc-200/80 bg-zinc-50/90 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <CardDescription className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                            Account Status
                          </CardDescription>
                          <CardTitle className="truncate text-2xl font-semibold tracking-tight">
                            {profile?.username || profile?.email || 'Authenticated'}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-0 pb-5 text-sm text-zinc-600 dark:text-zinc-300">
                      <div className="flex items-center justify-between border-t border-zinc-200/80 py-3 dark:border-white/10">
                        <span>Gemini API key</span>
                        <span className={profile?.hasApiKey ? 'font-medium text-emerald-600 dark:text-emerald-400' : 'font-medium text-amber-600 dark:text-amber-400'}>
                          {profile?.hasApiKey ? 'Connected' : 'Setup required'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-200/80 py-3 dark:border-white/10">
                        <span>Groups</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{groups.length}</span>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-200/80 py-3 dark:border-white/10">
                        <span>Identity</span>
                        <span className="truncate pl-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          {profile?.email || 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between border-t border-zinc-200/80 py-3 dark:border-white/10">
                        <span>Workspace health</span>
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Operational</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card className="rounded-[1.75rem] border-white/70 bg-white/80 py-0 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="mb-1 flex items-center gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/12 text-violet-600 dark:text-violet-400">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-violet-200 via-zinc-200 to-transparent dark:from-violet-500/30 dark:via-white/10 dark:to-transparent" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Create a group</CardTitle>
                    <CardDescription>
                      Start a new workspace for notes, documents, and future conversations without leaving the dashboard.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    <form onSubmit={handleCreateGroup} className="space-y-4">
                      <Input
                        value={groupTitle}
                        onChange={(event) => setGroupTitle(event.target.value)}
                        placeholder="e.g. AI Research Sprint"
                        className="h-12 rounded-xl bg-white dark:bg-zinc-900/80"
                      />
                      <Button type="submit" disabled={isCreatingGroup} className="h-12 w-full rounded-xl text-sm font-medium">
                        <Plus className="h-4 w-4" />
                        {isCreatingGroup ? 'Creating group...' : 'Create Group'}
                      </Button>
                    </form>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-2 inline-flex rounded-xl bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
                          <Brain className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Topic-first structure</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">Keep sources and chats grouped around the work they belong to.</p>
                      </div>
                      <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                        <div className="mb-2 inline-flex rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Ready for scale</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">Your dashboard now behaves like a real workspace, not a test screen.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[1.75rem] border-white/70 bg-white/80 py-0 shadow-[0_20px_50px_rgba(15,23,42,0.06)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-xl font-semibold">All groups</CardTitle>
                        <CardDescription>Your active workspace containers, available directly from the main dashboard.</CardDescription>
                      </div>
                      <Button asChild variant="ghost" className="rounded-full text-sm font-medium">
                        <Link href="/groups">Dedicated page</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-6">
                    {isBooting ? (
                      <div className="flex min-h-56 items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50/60 dark:border-zinc-700 dark:bg-white/5">
                        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-300">
                          <LoaderCircle className="h-5 w-5 animate-spin" />
                          Loading your workspace...
                        </div>
                      </div>
                    ) : groups.length === 0 ? (
                      <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50/60 px-6 py-14 text-center dark:border-zinc-700 dark:bg-white/5">
                        <div className="mx-auto mb-4 inline-flex rounded-2xl bg-zinc-950 p-3 text-white dark:bg-white dark:text-zinc-950">
                          <FolderKanban className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No groups yet</h2>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                          Create your first group on the left and it will appear here immediately.
                        </p>
                      </div>
                    ) : (
                      groups.map((group) => (
                        <div
                          key={group.id}
                          className="flex flex-col gap-4 rounded-[1.5rem] border border-zinc-200/80 bg-zinc-50/80 p-4 transition hover:border-zinc-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/8 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-white/10">
                                <FolderKanban className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <h2 className="truncate text-xl font-semibold text-zinc-950 dark:text-zinc-50">{group.title}</h2>
                                <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{group.id}</p>
                              </div>
                            </div>
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
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </section>

              <section className="grid gap-3 lg:grid-cols-3">
                <Card className="rounded-[1.5rem] border-white/70 bg-white/80 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="mb-3 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Security posture</CardTitle>
                    <CardDescription>Your access layer is protected through Clerk authentication and validated server routes.</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="rounded-[1.5rem] border-white/70 bg-white/80 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="mb-3 inline-flex rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
                      <Brain className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Workspace logic</CardTitle>
                    <CardDescription>The dashboard now loads groups live, supports creation inline, and lets you remove groups without leaving home.</CardDescription>
                  </CardHeader>
                </Card>

                <Card className="rounded-[1.5rem] border-white/70 bg-white/80 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="mb-3 inline-flex rounded-2xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                      <KeyRound className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold">Account controls</CardTitle>
                    <CardDescription>Profile and onboarding stay one click away when you want to update identity or model access.</CardDescription>
                  </CardHeader>
                </Card>
              </section>

              {pageError && (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                  {pageError}
                </div>
              )}

              {groupError && (
                <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
                  {groupError}
                </div>
              )}

              {groupMessage && (
                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
                  {groupMessage}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
