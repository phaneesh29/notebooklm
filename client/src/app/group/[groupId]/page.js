'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Bot, 
  FileText, 
  Globe, 
  Link2, 
  Loader2, 
  PanelLeft, 
  PanelLeftOpen,
  PlayCircle, 
  Plus, 
  Send, 
  Upload, 
  User, 
  X,
  Zap,
  ShieldCheck
} from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest, API_BASE_URL } from '@/lib/api';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


const statusBadgeVariant = {
  queued: 'warning',
  processing: 'secondary',
  ready: 'success',
  failed: 'destructive',
};

function formatDocumentType(type) {
  if (!type) return 'Document';
  if (type === 'docx') return 'DOCX';
  if (type === 'pdf' || type === 'txt') return type.toUpperCase();
  if (type === 'youtube') return 'YouTube';
  if (type === 'web') return 'Web';
  return type;
}

function formatCitations(text) {
  if (!text) return text;
  
  const citationRegex = /\[(?:Document:\s*)?([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    
    // We try to grab numbers or clean titles
    let citation = match[1].trim();
    if (citation.length > 30) citation = citation.substring(0, 27) + '...';

    parts.push(
      <sup 
        key={`cite-${match.index}`} 
        className="inline-flex cursor-pointer items-center justify-center bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all font-sans px-1 rounded-sm mx-0.5 tracking-tight shadow-sm" 
        style={{ fontSize: '0.65rem', padding: '0.1em 0.3em', transform: 'translateY(-0.5em)' }}
        title={`Source Reference: ${citation}`}
      >
        {citation}
      </sup>
    );
    lastIndex = citationRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts.length > 0 ? parts : text;
}

function getMessageText(message) {
  if (typeof message?.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message?.content)) {
    return message.content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (typeof item?.text === 'string') return item.text;
        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  if (Array.isArray(message?.parts)) {
    const textParts = message.parts
      .map((part) => {
        if (typeof part?.text === 'string') {
          return part.text;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n')
      .trim();

    if (textParts) {
      return textParts;
    }

    const hasToolOnlyParts = message.parts.some((part) =>
      typeof part?.type === 'string' && part.type.includes('tool')
    );

    if (hasToolOnlyParts) {
      return '';
    }
  }

  return '';
}

function normalizeCitationLabel(value) {
  const label = String(value || '').replace(/\s+/g, ' ').trim();
  if (!label) return '';
  return label.length > 80 ? `${label.slice(0, 77)}...` : label;
}

function collectSnippetTitles(value, acc) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((item) => collectSnippetTitles(item, acc));
    return;
  }

  if (typeof value === 'object') {
    if (typeof value.title === 'string') {
      const label = normalizeCitationLabel(value.title);
      if (label) acc.push(label);
    }

    if (Array.isArray(value.snippets)) {
      value.snippets.forEach((snippet) => {
        if (typeof snippet?.title === 'string') {
          const label = normalizeCitationLabel(snippet.title);
          if (label) acc.push(label);
        }
      });
    }

    Object.values(value).forEach((nested) => collectSnippetTitles(nested, acc));
  }
}

function getMessageCitations(message, messageText) {
  const citations = [];

  if (Array.isArray(message?.citations)) {
    message.citations.forEach((citation) => {
      const label = normalizeCitationLabel(citation);
      if (label) citations.push(label);
    });
  }

  if (Array.isArray(message?.metadata?.citations)) {
    message.metadata.citations.forEach((citation) => {
      const label = normalizeCitationLabel(citation);
      if (label) citations.push(label);
    });
  }

  // Extract titles from AI SDK tool parts when available.
  if (Array.isArray(message?.parts)) {
    message.parts.forEach((part) => {
      if (!part || typeof part !== 'object') return;

      const isToolPart = typeof part.type === 'string' && part.type.includes('tool');
      if (!isToolPart) return;

      collectSnippetTitles(part, citations);
    });
  }

  // Fallback to explicit inline citations in generated text, e.g. [Document: Resume.pdf].
  if (typeof messageText === 'string' && messageText.length > 0) {
    const citationRegex = /\[(?:Document:\s*)?([^\]]+)\]/g;
    let match;

    while ((match = citationRegex.exec(messageText)) !== null) {
      const label = normalizeCitationLabel(match[1]);
      if (label) citations.push(label);
    }
  }

  return [...new Set(citations)].slice(0, 6);
}

export default function GroupDetailPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const groupId = params?.groupId ?? '';
  const fileInputRef = useRef(null);
  const chatViewportRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [linkForm, setLinkForm] = useState({ title: '', sourceUrl: '', type: 'web' });
  const [fileForm, setFileForm] = useState({ title: '', file: null });
  const [chatInput, setChatInput] = useState('');

  const { 
    messages: chatMessages, 
    sendMessage,
    status: chatStatus,
    setMessages: setChatMessages, 
    error: chatErrorObj 
  } = useChat({
    transport: new DefaultChatTransport({
      api: `${API_BASE_URL}/groups/${groupId}/chat/stream`,
      fetch: async (url, options = {}) => {
        const token = await getToken();

        return fetch(url, {
          ...options,
          headers: {
            ...(options.headers ?? {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
      },
    }),
  });

  const isStreamingChat = chatStatus === 'submitted' || chatStatus === 'streaming';
  const chatError = chatErrorObj ? chatErrorObj.message : '';

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
        const [groupsResponse, documentsResponse, chatsResponse] = await Promise.all([
          apiRequest('/groups', { token }),
          apiRequest(`/groups/${groupId}/documents`, { token }),
          apiRequest(`/groups/${groupId}/chat`, { token }).catch(() => ({ messages: [] })),
        ]);
        const matchedGroup = (groupsResponse.data ?? []).find((item) => item.id === groupId);

        if (!matchedGroup) throw new Error('Group not found');

        setGroup(matchedGroup);
        setDocuments(documentsResponse.data ?? []);
        // Seed Vercel AI SDK chat state directly from standard Postgres Array
        setChatMessages(chatsResponse.messages ?? []);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupPage();
  }, [getToken, groupId, setChatMessages]);

  useEffect(() => {
    if (!groupId || isLoading) return undefined;
    const hasActiveDocuments = documents.some((doc) => doc.status === 'queued' || doc.status === 'processing');
    if (!hasActiveDocuments) return undefined;

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

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleLinkChange = (e) => setLinkForm({ ...linkForm, [e.target.name]: e.target.value });
  const handleFileSelection = (e) => setFileForm({ ...fileForm, file: e.target.files?.[0] ?? null });

  const handleSubmitLink = async (e) => {
    e.preventDefault();
    if (!linkForm.title.trim() || !linkForm.sourceUrl.trim()) return;
    try {
      setIsSubmittingLink(true);
      const token = await getToken();
      await apiRequest('/groups/documents/links', {
        method: 'POST',
        token,
        body: JSON.stringify({ groupId, ...linkForm }),
      });
      setLinkForm({ title: '', sourceUrl: '', type: 'web' });
      setShowAddSource(false);
      await loadDocuments(token);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsSubmittingLink(false);
    }
  };

  const handleSubmitFile = async (e) => {
    e.preventDefault();
    if (!fileForm.file) return;
    try {
      setIsSubmittingFile(true);
      const token = await getToken();
      const formData = new FormData();
      formData.append('groupId', groupId);
      formData.append('title', (fileForm.title || fileForm.file.name).trim());
      formData.append('file', fileForm.file);
      await apiRequest('/groups/documents/files', { method: 'POST', token, body: formData });
      setFileForm({ title: '', file: null });
      setShowAddSource(false);
      await loadDocuments(token);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setIsSubmittingFile(false);
    }
  };

  const handleSubmitChat = async (e) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    const trimmedInput = chatInput.trim();
    if (!trimmedInput || isStreamingChat || documents.length === 0) return;
    
    await sendMessage({ text: trimmedInput });
    setChatInput('');
  };

  return (
    <AuthGuard>
      <div className="fixed inset-0 flex bg-background overflow-hidden selection:bg-primary/20 z-50">
        {/* Sidebar Trigger (When collapsed) */}
        {isSidebarCollapsed && (
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute left-6 top-5 z-50 h-8 w-8 transition-transform"
            onClick={() => setIsSidebarCollapsed(false)}
          >
            <PanelLeftOpen className="size-4 text-muted-foreground" />
          </Button>
        )}

        {/* Sidebar: Sources */}
        <aside className={`border-r bg-muted/10 flex flex-col transition-all duration-500 ease-in-out ${isSidebarCollapsed ? '-translate-x-full w-0 border-none opacity-0 invisible overflow-hidden' : 'translate-x-0 w-80 lg:w-[22rem] opacity-100 visible'} absolute md:relative z-40 h-full min-h-0 shrink-0`}>
          <div className="p-4 border-b bg-card flex items-center justify-between">
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/50 transition-colors" asChild>
               <Link href="/groups"><ArrowLeft className="size-4" /></Link>
            </Button>
            <div className="flex-1 px-3 min-w-0">
               <h2 className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-50 tracking-tight leading-none pt-0.5">
                {isLoading ? <Skeleton className="h-4 w-24" /> : group?.title}
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-muted/50 transition-colors text-muted-foreground"
              onClick={() => setIsSidebarCollapsed(true)}
            >
              <PanelLeft className="size-4" />
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-muted-foreground">Source Documents</h3>
                <Badge variant="secondary" className="px-1.5 py-0 h-4 text-[10px]">{documents.length}</Badge>
              </div>

              {!showAddSource ? (
                <Button 
                  onClick={() => setShowAddSource(true)}
                  className="w-full justify-start gap-2 h-9 border-dashed border bg-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  variant="outline"
                  size="sm"
                >
                  <Plus className="size-3.5" />
                  <span className="text-xs font-medium">Add Context</span>
                </Button>
              ) : (
                <div className="rounded-xl overflow-hidden border border-border/50 bg-card shadow-sm">
                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                    <span className="text-xs font-semibold">New Source</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setShowAddSource(false)}>
                      <X className="size-3.5" />
                    </Button>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex p-1 bg-muted/40 rounded-lg gap-1 mb-2">
                      {[
                        { id: 'web', label: 'Web Page' },
                        { id: 'youtube', label: 'YouTube' },
                        { id: 'file', label: 'Local File' }
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => setLinkForm({ ...linkForm, type: t.id })}
                          className={`flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all ${linkForm.type === t.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {linkForm.type === 'file' ? (
                      <div className="space-y-3">
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full h-28 mx-auto border-dashed border-2 rounded-xl bg-muted/10 hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all border-border/60 hover:border-primary/50 text-center px-4"
                         >
                           <div className="p-2 rounded-full bg-background border shadow-sm">
                             <Upload className="size-4 text-muted-foreground" />
                           </div>
                           <div className="space-y-0.5">
                             <span className="text-xs font-semibold text-foreground block w-full truncate px-2">
                               {fileForm.file ? fileForm.file.name : 'Click or drag file to upload'}
                             </span>
                             {!fileForm.file && <span className="text-[10px] text-muted-foreground">PDF, DOCX, TXT up to 10MB</span>}
                           </div>
                         </div>
                         <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileSelection} />
                         {fileForm.file && (
                           <Button onClick={handleSubmitFile} disabled={isSubmittingFile} size="sm" className="w-full h-9 transition-all">
                             {isSubmittingFile ? <Loader2 className="animate-spin mr-2 size-3.5" /> : <Upload className="size-3.5 mr-2" />}
                             Upload File
                           </Button>
                         )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input 
                          name="sourceUrl" 
                          placeholder="Valid URL (https://...)" 
                          value={linkForm.sourceUrl} 
                          onChange={handleLinkChange}
                          className="h-9 text-xs bg-background"
                        />
                        <Input 
                          name="title" 
                          placeholder="Title (Optional)" 
                          value={linkForm.title} 
                          onChange={handleLinkChange}
                          className="h-9 text-xs bg-background"
                        />
                        <Button onClick={handleSubmitLink} disabled={isSubmittingLink} size="sm" className="w-full h-9 transition-all">
                          {isSubmittingLink ? <Loader2 className="animate-spin mr-2 size-3.5" /> : <Link2 className="size-3.5 mr-2" />}
                          Add Link
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
              ) : documents.length === 0 ? (
                <div className="text-center py-10 px-4 border border-dashed rounded-xl bg-muted/20 flex flex-col gap-3">
                   <div className="p-3 rounded-lg bg-background border border-border/50 mx-auto">
                      <FileText className="size-5 text-muted-foreground/60" />
                   </div>
                   <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-foreground">No sources added</p>
                      <p className="text-[10px] text-muted-foreground">Add files or links to start</p>
                   </div>
                </div>
              ) : documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="group flex items-start gap-3 p-3 rounded-xl hover:bg-card border border-transparent hover:border-border/50 transition-colors cursor-pointer"
                >
                  <div className="mt-0.5 p-2 rounded-md bg-muted text-foreground">
                    {doc.type === 'youtube' ? <PlayCircle className="size-3.5" /> : doc.type === 'web' ? <Globe className="size-3.5" /> : <FileText className="size-3.5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-medium truncate text-zinc-900 dark:text-zinc-100 pr-2 tracking-tight">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant={statusBadgeVariant[doc.status]} className="text-[9px] font-medium px-1.5 py-0 h-4">
                        {doc.status}
                      </Badge>
                      <span className="text-[9px] text-muted-foreground">{formatDocumentType(doc.type)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content: Chat */}
        <main className="flex-1 flex flex-col relative bg-background overflow-hidden w-full h-full min-h-0">
          {/* Main Header */}
          <header className={`h-14 border-b bg-card/50 backdrop-blur-md flex items-center px-6 justify-between sticky top-0 z-10 transition-all`}>
            <div className="flex items-center gap-3">
              {isSidebarCollapsed && <div className="w-8" />} {/* Space for trigger button */}
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 leading-none">Intelligence Engine</h1>
                <p className="text-[10px] text-muted-foreground mt-1">Ground logic enabled</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isStreamingChat ? (
                <div className="flex flex-row items-center gap-2">
                   <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                   <span className="text-xs text-muted-foreground hidden sm:inline-block">Thinking...</span>
                </div>
              ) : (
                <Badge variant="outline" className="rounded-full bg-background/50 border-border/50 px-3 py-0.5 font-medium text-[10px]">
                  Ready
                </Badge>
              )}
            </div>
          </header>

          {/* Chat Feed */}
          <div 
            ref={chatViewportRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-8 md:px-8 scroll-smooth"
          >
            <div className="max-w-5xl mx-auto space-y-10 pb-44">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-6 mt-20 md:mt-32">
                  <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border/50 shadow-sm">
                    <Bot className="size-12 text-muted-foreground/50" />
                  </div>
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Ask your workspace</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">Get answers based strictly on the source documents you provide.</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  (() => {
                    const messageText = getMessageText(msg);
                    const messageCitations = msg.role === 'assistant'
                      ? getMessageCitations(msg, messageText)
                      : [];
                    const fallbackStreamingText = (!messageText && isStreamingChat && msg.role === 'assistant' && idx === chatMessages.length - 1) ? '...' : '';

                    return (
                  <div 
                    key={msg.id || idx} 
                    className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-2 mb-1 px-1">
                       {msg.role === 'user' ? (
                          <span className="text-xs font-semibold text-muted-foreground">You</span>
                       ) : (
                          <>
                            <Bot className="size-3.5 text-primary" />
                            <span className="text-xs font-semibold">Agent</span>
                          </>
                       )}
                    </div>
                    <div className={`px-7 py-5 rounded-3xl text-[16px] leading-relaxed max-w-[96%] sm:max-w-[92%] shadow-md ${
                      msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground font-sans rounded-tr-sm' 
                      : 'bg-background border border-border/60 rounded-tl-sm text-foreground font-serif text-[18px] leading-8 pt-6 pb-7'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="space-y-3 leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => <h1 className="text-lg font-semibold mt-1 mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-semibold mt-1 mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mt-1 mb-2">{children}</h3>,
                              p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
                              li: ({ children }) => <li>{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 border-border pl-3 text-muted-foreground">{children}</blockquote>
                              ),
                              a: ({ href, children }) => (
                                <a href={href} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-2">
                                  {children}
                                </a>
                              ),
                              code: ({ className, children }) => {
                                const isBlock = className?.includes('language-');
                                if (isBlock) {
                                  return (
                                    <code className="block overflow-x-auto rounded-md bg-muted px-3 py-2 text-xs font-mono">
                                      {children}
                                    </code>
                                  );
                                }

                                return <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{children}</code>;
                              },
                              pre: ({ children }) => <pre className="overflow-x-auto rounded-md bg-muted p-0">{children}</pre>,
                            }}
                          >
                            {messageText || fallbackStreamingText}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">
                          {formatCitations(messageText || fallbackStreamingText)}
                        </p>
                      )}

                      {msg.role === 'assistant' && messageCitations.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-border/50 space-y-2">
                          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-sans font-semibold">
                            Sources Used
                          </p>
                          <div className="flex flex-wrap gap-2 font-sans">
                            {messageCitations.map((citation, citationIdx) => (
                              <span
                                key={`${msg.id || idx}-cite-${citationIdx}`}
                                className="inline-flex items-center rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] leading-none text-foreground"
                                title={citation}
                              >
                                {citation}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                    );
                  })()
                ))
              )}

              {chatError && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-4 mt-8">
                  <AlertTriangle className="size-5" />
                  <p>{chatError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none z-40">
            <div className="max-w-3xl mx-auto pointer-events-auto relative">
              {/* Optional glowing effect behind the floating box */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-background/50 to-primary/10 rounded-[2.5rem] blur-lg -z-10 pointer-events-none" />
              <form 
                onSubmit={handleSubmitChat}
                className="relative flex items-end p-2 bg-background/80 backdrop-blur-2xl border-2 border-border/40 shadow-2xl rounded-3xl focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary/50 transition-all font-sans"
              >
                <div className="flex-1 relative min-w-0">
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitChat(e);
                      }
                    }}
                    placeholder="Message the intelligence engine..."
                    className="w-full bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground/60 px-5 py-3.5 resize-none min-h-[52px] max-h-[160px] text-[16px] outline-none tracking-tight"
                    disabled={isStreamingChat}
                  />
                </div>
                
                {(() => {
                  const hasInput = chatInput.trim().length > 0;
                  const hasDocs = documents.length > 0;
                  const canSend = !isStreamingChat && hasInput && hasDocs;
                  
                  return (
                    <div className="pl-3 pr-2 pb-2 shrink-0 z-10 flex items-center justify-center">
                      <Button 
                        type="submit" 
                        disabled={!canSend}
                        size="icon" 
                        className={`size-[38px] rounded-full flex-shrink-0 transition-all duration-300 ${
                          canSend 
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:-translate-y-0.5' 
                            : 'bg-muted text-muted-foreground opacity-50'
                        }`}
                      >
                        {isStreamingChat ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </Button>
                    </div>
                  );
                })()}
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
