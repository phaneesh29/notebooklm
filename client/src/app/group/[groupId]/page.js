'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { AlertTriangle, ArrowLeft, FileText, Globe, Link2, PlayCircle, Upload } from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
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

function formatDocumentSource(document) {
  return document.sourceUrl || document.originalFileName || 'Stored document';
}

export default function GroupDetailPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const groupId = params?.groupId ?? '';
  const fileInputRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [pageError, setPageError] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: '', sourceUrl: '', type: 'web' });
  const [fileForm, setFileForm] = useState({ title: '', file: null });

  const loadDocuments = async (token) => {
    const response = await apiRequest(`/groups/${groupId}/documents`, { token });
    setDocuments(response.data ?? []);
  };

  useEffect(() => {
    const loadGroupPage = async () => {
      if (!groupId) {
        setPageError('Missing group id');
        setIsLoading(false);
        return;
      }

      try {
        setPageError('');
        const token = await getToken();
        const [groupsResponse, documentsResponse] = await Promise.all([
          apiRequest('/groups', { token }),
          apiRequest(`/groups/${groupId}/documents`, { token }),
        ]);
        const matchedGroup = (groupsResponse.data ?? []).find((item) => item.id === groupId);

        if (!matchedGroup) {
          throw new Error('Group not found');
        }

        setGroup(matchedGroup);
        setDocuments(documentsResponse.data ?? []);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupPage();
  }, [getToken, groupId]);

  useEffect(() => {
    if (!groupId || isLoading) {
      return undefined;
    }

    const hasActiveDocuments = documents.some((document) => document.status === 'queued' || document.status === 'processing');

    if (!hasActiveDocuments) {
      return undefined;
    }

    const intervalId = setInterval(async () => {
      try {
        const token = await getToken();
        await loadDocuments(token);
      } catch (error) {
        console.error('Error polling document statuses:', error);
      }
    }, 4000);

    return () => clearInterval(intervalId);
  }, [documents, getToken, groupId, isLoading]);

  const handleLinkChange = (event) => {
    const { name, value } = event.target;
    setLinkForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleFileTitleChange = (event) => {
    setFileForm((currentForm) => ({ ...currentForm, title: event.target.value }));
  };

  const setSelectedFile = (selectedFile) => {
    setFileForm((currentForm) => ({ ...currentForm, file: selectedFile }));
  };

  const handleFileSelection = (event) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleFileDrop = (event) => {
    event.preventDefault();
    setIsDraggingFile(false);
    setSelectedFile(event.dataTransfer.files?.[0] ?? null);
  };

  const handleSubmitLink = async (event) => {
    event.preventDefault();

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
          type: linkForm.type,
        }),
      });

      setLinkForm({ title: '', sourceUrl: '', type: 'web' });
      await loadDocuments(token);
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

      setFileForm({ title: '', file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      await loadDocuments(token);
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
                    <span>Stored docs</span>
                    <Badge variant="outline">{documents.length}</Badge>
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
                <CardDescription>Choose type, then submit.</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                <form onSubmit={handleSubmitLink} className="flex flex-col gap-4">
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

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="link-type">Source type</Label>
                    <Select
                      id="link-type"
                      name="type"
                      value={linkForm.type}
                      onChange={handleLinkChange}
                      className="bg-white/90 dark:bg-zinc-900/70"
                    >
                      <option value="web">Web link</option>
                      <option value="youtube">YouTube link</option>
                    </Select>
                  </div>

                  <Button type="submit" disabled={isSubmittingLink} className="h-12 rounded-2xl">
                    {linkForm.type === 'youtube' ? <PlayCircle data-icon="inline-start" /> : <Globe data-icon="inline-start" />}
                    {isSubmittingLink ? 'Queueing...' : 'Add source'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="rounded-[1.8rem] bg-white/78 py-0 dark:bg-white/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl font-semibold">Upload file</CardTitle>
                <CardDescription>Drag and drop or browse.</CardDescription>
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
                    <input
                      ref={fileInputRef}
                      id="document-file"
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileSelection}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsDraggingFile(true);
                      }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={handleFileDrop}
                      className={`flex min-h-36 flex-col items-center justify-center gap-3 rounded-[1.6rem] border border-dashed px-5 py-6 text-center transition ${
                        isDraggingFile
                          ? 'border-primary bg-primary/8 shadow-[0_18px_50px_rgba(59,130,246,0.14)]'
                          : 'border-border/80 bg-background/60 hover:border-primary/30 hover:bg-background/90'
                      }`}
                    >
                      <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Upload className="size-5" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          Drop file here or click to browse
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">
                          PDF, DOCX, TXT up to 25 MB
                        </span>
                      </div>
                    </button>
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
              <CardTitle className="text-xl font-semibold">Stored documents</CardTitle>
              <CardDescription>Saved for this group.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pb-6">
              {isLoading ? (
                <div className="flex flex-col gap-4">
                  <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                  <Skeleton className="h-24 w-full rounded-[1.25rem]" />
                </div>
              ) : documents.length === 0 ? (
                <div className="rounded-[1.6rem] border border-dashed border-zinc-300 bg-white/65 px-6 py-12 text-center dark:border-zinc-700 dark:bg-white/5">
                  <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
                    <Link2 />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">No documents yet</h2>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Add a source above.</p>
                </div>
              ) : (
                documents.map((document, index) => (
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
                      <p className="mt-2 truncate text-sm text-zinc-600 dark:text-zinc-300">{formatDocumentSource(document)}</p>
                    </div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">{document.createdAt ? new Date(document.createdAt).toLocaleDateString() : 'Saved'}</div>
                  </div>
                ))
              )}

              <Separator />

              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                This list now comes from the backend and stays visible after reload.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
