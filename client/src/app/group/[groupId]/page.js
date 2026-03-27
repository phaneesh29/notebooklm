'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, FileText, Globe, MessageSquareText, PlayCircle } from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const sourceTypes = [
  {
    title: 'YouTube links',
    description: 'Import video links so the workspace can extract and explain the content.',
    icon: PlayCircle,
  },
  {
    title: 'Web links',
    description: 'Save articles and web pages, then ask for summaries or plain-English explanations.',
    icon: Globe,
  },
  {
    title: 'PDF, DOCX, TXT',
    description: 'Upload files and turn raw documents into answers, notes, and guided explanations.',
    icon: FileText,
  },
];

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params?.groupId ?? '';

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] px-4 py-8 dark:bg-[radial-gradient(circle_at_top,rgba(34,197,94,0.12),transparent_28%),linear-gradient(180deg,#09090b_0%,#111827_100%)] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="grid gap-8 px-6 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8">
              <div className="space-y-5">
                <Badge variant="outline" className="w-fit rounded-full px-3 py-1 uppercase tracking-[0.24em]">
                  Workspace Detail
                </Badge>
                <div className="space-y-3">
                  <h1 className="text-4xl font-semibold tracking-[-0.04em] text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                    Group workspace
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-300">
                    This workspace will hold the sources for one topic so the LLM can explain them, answer follow-up questions, and keep the conversation grounded in uploaded material.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" className="h-12 rounded-full px-6 text-sm font-medium">
                    <Link href="/groups">
                      <ArrowLeft className="h-4 w-4" />
                      Back to groups
                    </Link>
                  </Button>
                </div>
              </div>

              <Card className="rounded-[1.75rem] border-zinc-200/80 bg-zinc-50/90 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
                <CardHeader className="pb-4">
                  <CardDescription className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Group ID
                  </CardDescription>
                  <CardTitle className="break-all text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                    {groupId}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pb-6 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between border-t border-zinc-200/80 pt-3 dark:border-white/10">
                    <span>Ready for uploads</span>
                    <Badge variant="success">Yes</Badge>
                  </div>
                  <div className="flex items-center justify-between border-t border-zinc-200/80 pt-3 dark:border-white/10">
                    <span>Assistant mode</span>
                    <Badge variant="secondary">Explain and answer</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            {sourceTypes.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="rounded-[1.5rem] border-white/70 bg-white/80 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <CardHeader className="pb-3">
                    <div className="mb-3 inline-flex rounded-2xl bg-sky-500/10 p-3 text-sky-600 dark:text-sky-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-xl font-semibold">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </section>

          <Card className="rounded-[1.75rem] border-white/70 bg-white/80 py-0 shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardHeader className="pb-3">
              <div className="mb-3 inline-flex rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                <MessageSquareText className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl font-semibold">Next step</CardTitle>
              <CardDescription>
                Connect your upload and chat flow here so each group becomes a mini NotebookLM experience with grounded explanations.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
