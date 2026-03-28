'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AlertTriangle, ArrowLeft, FileText, Globe, Link2, PlayCircle, Upload } from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/api';

const sourceTypes = [
  { title: 'YouTube', icon: PlayCircle },
  { title: 'Web', icon: Globe },
  { title: 'Files', icon: FileText },
];

const statusBadgeVariant = {
  queued: 'warning',
  processing: 'secondary',
  ready: 'success',
  failed: 'destructive',
};

function formatDocumentType(type) {
  if (!type) {
    return 'Document';
  }

  if (type === 'docx') {
    return 'DOCX';
  }

  if (type === 'pdf' || type === 'txt') {
    return type.toUpperCase();
  }

  if (type === 'youtube') {
    return 'YouTube';
  }

  if (type === 'web') {
    return 'Web';
  }

  return type;
}

export default function GroupDetailPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const groupId = params?.groupId ?? '';

  const [group, setGroup] = useState(null);
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [pageError, setPageError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: '', sourceUrl: '' });
  const [fileForm, setFileForm] = useState({ title: '', file: null });

  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) {
        setPageError('Missing group id');
        setIsLoading(false);
        return;
      }

      try {
        setPageError('');
        const token = await getToken();
        const response = await apiRequest('/groups', { token });
        const matchedGroup = (response.data ?? []).find((item) => item.id === groupId);

        if (!matchedGroup) {
          throw new Error('Group not found');
        }

        setGroup(matchedGroup);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroup();
  }, [getToken, groupId]);

  const prependRecentDocument = (document) => {
    setRecentDocuments((currentDocuments) => [document, ...currentDocuments].slice(0, 5));
  };

  const handleLinkChange = (event) => {
    const { name, value } = event.target;
    setLinkForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleFileTitleChange = (event) => {
    setFileForm((currentForm) => ({ ...currentForm, title: event.target.value }));
  };

  const handleFileSelection = (event) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFileForm((currentForm) => ({ ...currentForm, file: selectedFile }));
  };

  const handleSubmitLink = async (type) => {
    if (!linkForm.title.trim() || !linkForm.sourceUrl.trim()) {
      setPageError('Link title and URL are required');
      return;
    }

    try {
      setIsSubmittingLink(true);
      setPageError('');
      setFeedbackMessage('');

      const token = await getToken();
      const response = await apiRequest('/groups/documents/links', {
        method: 'POST',
        token,
        body: JSON.stringify({
          groupId,
          title: linkForm.title.trim(),
          sourceUrl: linkForm.sourceUrl.trim(),
          type,
        }),
      });

      prependRecentDocument(response.data);
      setLinkForm({ title: '', sourceUrl: '' });
      setFeedbackMessage(response.message || 'Link document queued successfully');
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleSubmitFile = async (event) => {
    event.preventDefault();

    if (!fileForm.file) {
      setPageError('Choose a PDF, DOCX, or TXT file before uploading');
      return;
    }

    try {
      setIsSubmittingFile(true);
      setPageError('');
      setFeedbackMessage('');

      const token = await getToken();
      const formData = new FormData();
      formData.append('groupId', groupId);
      formData.append('title', fileForm.title.trim());
      formData.append('file', fileForm.file);

      const response = await apiRequest('/groups/documents/files', {
        method: 'POST',
        token,
        body: formData,
      });

      prependRecentDocument(response.data);
      setFileForm({ title: '', file: null });
      setFeedbackMessage(response.message || 'File uploaded and queued successfully');
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsSubmittingFile(false);
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
                  Group
                </Badge>
                <div className="flex flex-col gap-2">
                  <h1 className="text-4xl font-semibold tracking-[-0.05em] text-zinc-950 dark:text-zinc-50 sm:text-5xl">
                    Add sources fast.
                  </h1>
                  <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-300">
                    Links, files, answers.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button asChild variant="outline" className="h-11 rounded-full px-5">
                    <Link href="/groups">
                      <ArrowLeft data-icon="inline-start" />
                      Groups
                    </Link>
                  </Button>
                  {sourceTypes.map((item) => {
                    const Icon = item.icon;

                    return (
                      <Badge key={item.title} variant="secondary" className="h-11 rounded-full px-4 text-sm">
                        <Icon className="size-4" />
                        {item.title}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <Card className="rounded-[1.8rem] bg-white/72 py-0 dark:bg-white/6">
                <CardHeader className="pb-3">
                  <CardDescription className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
                    Workspace
                  </CardDescription>
                  {isLoading ? (
                    <div className="flex flex-col gap-3">
                      <Skeleton className="h-8 w-2/3" />
                      <Skeleton className="h-5 w-full" />
                    </div>
                  ) : (
                    <>
                      <CardTitle className="break-all text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                        {group?.title || groupId}
                      </CardTitle>
                      <CardDescription className="break-all">{groupId}</CardDescription>
                    </>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-3 pb-6 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Links</span>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Files</span>
                    <Badge variant="secondary">Ready</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3">
                    <span>Session docs</span>
                    <Badge variant="outline">{recentDocuments.length}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {pageError && (
            <Alert variant="destructive" className="rounded-[1.5rem] border-red-200 bg-red-50 shadow-sm dark:border-red-900/30 dark:bg-red-950/20">
              <AlertTriangle />
              <AlertTitle>Document action failed</AlertTitle>
              <AlertDescription>{pageError}</AlertDescription>
            </Alert>
          )}

          {feedbackMessage && (
            <Alert className="rounded-[1.5rem] border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-300">
              <AlertTitle>Updated</AlertTitle>
              <AlertDescription>{feedbackMessage}</AlertDescription>
            </Alert>
          )}

          <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">Add link</CardTitle>
                <CardDescription>Web or YouTube.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pb-6">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="link-title">Title</Label>
                  <Input
                    id="link-title"
                    name="title"
                    value={linkForm.title}
                    onChange={handleLinkChange}
                    placeholder="Design systems"
                    className="h-12 rounded-2xl bg-white/90 dark:bg-zinc-900/70"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="link-source-url">URL</Label>
                  <Input
                    id="link-source-url"
                    name="sourceUrl"
                    value={linkForm.sourceUrl}
                    onChange={handleLinkChange}
                    placeholder="https://..."
                    className="h-12 rounded-2xl bg-white/90 dark:bg-zinc-900/70"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button
                    type="button"
                    disabled={isSubmittingLink}
                    onClick={() => handleSubmitLink('web')}
                    className="h-12 flex-1 rounded-2xl"
                  >
                    <Globe data-icon="inline-start" />
                    {isSubmittingLink ? 'Queueing...' : 'Add web'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmittingLink}
                    onClick={() => handleSubmitLink('youtube')}
                    className="h-12 flex-1 rounded-2xl"
                  >
                    <PlayCircle data-icon="inline-start" />
                    {isSubmittingLink ? 'Queueing...' : 'Add YouTube'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">Upload file</CardTitle>
                <CardDescription>PDF, DOCX, TXT.</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <form onSubmit={handleSubmitFile} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="file-title">Title</Label>
                    <Input
                      id="file-title"
                      value={fileForm.title}
                      onChange={handleFileTitleChange}
                      placeholder="Optional"
                      className="h-12 rounded-2xl bg-white/90 dark:bg-zinc-900/70"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="document-file">File</Label>
                    <Input
                      id="document-file"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelection}
                      className="h-12 rounded-2xl bg-white/90 file:mr-4 file:border-0 file:bg-transparent file:text-sm file:font-medium dark:bg-zinc-900/70"
                    />
                  </div>

                  {fileForm.file && (
                    <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-4 py-3 text-sm">
                      <span className="truncate pr-4 text-zinc-700 dark:text-zinc-200">{fileForm.file.name}</span>
                      <Badge variant="outline">{Math.max(1, Math.round(fileForm.file.size / 1024))} KB</Badge>
                    </div>
                  )}

                  <Button type="submit" disabled={isSubmittingFile} className="h-12 rounded-2xl">
                    <Upload data-icon="inline-start" />
                    {isSubmittingFile ? 'Uploading...' : 'Upload'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl font-semibold">Recent activity</CardTitle>
              <CardDescription>Current session only.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-6">
              {recentDocuments.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-zinc-300 bg-white/65 px-6 py-12 text-center dark:border-zinc-700 dark:bg-white/5">
                  <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                    <Link2 />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No documents yet</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Add a source above.</p>
                </div>
              ) : (
                recentDocuments.map((document, index) => (
                  <div
                    key={document.id ?? `${document.title}-${index}`}
                    className="flex flex-col gap-4 rounded-[1.6rem] border border-white/70 bg-white/88 p-5 dark:border-white/10 dark:bg-white/6 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">{document.title}</h2>
                        <Badge variant="outline">{formatDocumentType(document.type)}</Badge>
                        <Badge variant={statusBadgeVariant[document.status] || 'secondary'}>{document.status}</Badge>
                      </div>
                      <p className="mt-2 truncate text-sm text-zinc-600 dark:text-zinc-300">
                        {document.sourceUrl || document.originalFileName || 'Stored document'}
                      </p>
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">Job {document.queueJobId || 'queued'}</div>
                  </div>
                ))
              )}

              <Separator />

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Full history can be added once the backend exposes a document listing route.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
