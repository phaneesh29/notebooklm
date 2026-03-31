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
  LoaderCircle, 
  PanelLeft, 
  PanelLeftOpen,
  PlayCircle, 
  Plus, 
  Send, 
  Upload, 
  User, 
  X,
  Zap
} from 'lucide-react';

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
import { apiRequest, API_BASE_URL } from '@/lib/api';

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

function parseSseChunk(chunk) {
  const event = { type: 'message', data: '' };
  chunk.split('\n').forEach((line) => {
    if (line.startsWith('event:')) {
      event.type = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      const value = line.slice(5).trim();
      event.data = event.data ? `${event.data}\n${value}` : value;
    }
  });
  return event;
}

export default function GroupDetailPage() {
  const params = useParams();
  const { getToken } = useAuth();
  const groupId = params?.groupId ?? '';
  const fileInputRef = useRef(null);
  const chatViewportRef = useRef(null);

  const [group, setGroup] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatQuery, setChatQuery] = useState('');
  const [chatError, setChatError] = useState('');
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isStreamingChat, setIsStreamingChat] = useState(false);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);
  const [isSubmittingFile, setIsSubmittingFile] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
        const [groupsResponse, documentsResponse, chatsResponse] = await Promise.all([
          apiRequest('/groups', { token }),
          apiRequest(`/groups/${groupId}/documents`, { token }),
          apiRequest(`/groups/${groupId}/chat`, { token }).catch(() => ({ messages: [] })),
        ]);
        const matchedGroup = (groupsResponse.data ?? []).find((item) => item.id === groupId);

        if (!matchedGroup) throw new Error('Group not found');

        setGroup(matchedGroup);
        setDocuments(documentsResponse.data ?? []);
        setChatMessages(chatsResponse.messages ?? []);
      } catch (error) {
        setPageError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadGroupPage();
  }, [getToken, groupId]);

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
    e.preventDefault();
    const trimmedQuery = chatQuery.trim();
    if (!trimmedQuery || isStreamingChat) return;

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;

    setChatQuery('');
    setChatError('');
    setIsStreamingChat(true);
    setChatMessages((messages) => [
      ...messages,
      { id: userMessageId, role: 'user', content: trimmedQuery },
      { id: assistantMessageId, role: 'assistant', content: '', isStreaming: true },
    ]);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: trimmedQuery }),
      });

      if (!response.ok) throw new Error('Failed to start chat');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() ?? '';
        chunks.forEach((chunk) => {
          if (!chunk.trim()) return;
          const event = parseSseChunk(chunk);
          const data = event.data ? JSON.parse(event.data) : {};
          if (event.type === 'delta') {
            setChatMessages((msgs) => msgs.map((m) => m.id === assistantMessageId ? { ...m, content: m.content + (data.text || '') } : m));
          } else if (event.type === 'message' || event.type === 'done') {
            setChatMessages((msgs) => msgs.map((m) => m.id === assistantMessageId ? { ...m, content: data.text || m.content } : m));
          } else if (event.type === 'error') throw new Error(data.message || 'Stream error');
        });
      }
    } catch (error) {
      setChatError(error.message);
    } finally {
      setIsStreamingChat(false);
      setChatMessages((msgs) => msgs.map((m) => m.id === assistantMessageId ? { ...m, isStreaming: false } : m));
    }
  };

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/20">
        {/* Sidebar Trigger (When collapsed) */}
        {isSidebarCollapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-6 top-5 z-50 rounded-xl bg-background/90 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-primary/20 text-primary hover:bg-background hover:scale-110 active:scale-95 transition-all animate-in fade-in slide-in-from-left-4 duration-500"
            onClick={() => setIsSidebarCollapsed(false)}
          >
            <PanelLeftOpen className="size-5" />
          </Button>
        )}

        {/* Sidebar: Sources */}
        <aside className={`border-r bg-muted/40 flex flex-col backdrop-blur-3xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSidebarCollapsed ? 'w-0 border-none opacity-0 invisible' : 'w-80 opacity-100 visible'}`}>
          <div className="p-4 border-b bg-card/60 backdrop-blur-xl flex items-center justify-between">
            <Button variant="ghost" size="icon" className="rounded-full bg-muted/20 hover:bg-muted/40 transition-all active:scale-90" asChild>
               <Link href="/groups"><ArrowLeft className="size-4" /></Link>
            </Button>
            <div className="flex-1 px-4 min-w-0">
               <div className="flex items-center gap-2 text-[8px] font-black tracking-[0.2em] uppercase text-muted-foreground/40 mb-0.5">
                  <span>Intelligence</span>
                  <span className="opacity-40">/</span>
                  <span className="text-primary/60 truncate max-w-[80px]">Research</span>
               </div>
               <h2 className="text-sm font-black truncate text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-none pt-0.5">
                {isLoading ? <Skeleton className="h-4 w-24" /> : group?.title}
              </h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full flex-shrink-0 hover:bg-muted/40 transition-all"
              onClick={() => setIsSidebarCollapsed(true)}
            >
              <PanelLeft className="size-4 opacity-40" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-none bg-[radial-gradient(circle_at_0%_0%,rgba(63,63,70,0.02),transparent_40%)]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Grounded Logic</h3>
                <Badge variant="secondary" className="rounded-full text-[9px] font-black px-2 h-5 bg-primary/10 text-primary border-primary/5">{documents.length}</Badge>
              </div>

              {!showAddSource ? (
                <Button 
                  onClick={() => setShowAddSource(true)}
                  className="w-full justify-start gap-3 rounded-2xl h-11 border-dashed border-2 bg-transparent hover:bg-muted/50 text-muted-foreground/60 hover:text-primary transition-all group ring-1 ring-primary/5 active:scale-95"
                  variant="outline"
                >
                  <Plus className="size-4 group-hover:rotate-90 transition-transform duration-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Connect Source</span>
                </Button>
              ) : (
                <Card className="rounded-[2rem] overflow-hidden border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700 bg-card/60 backdrop-blur-md">
                  <div className="p-4 border-b bg-muted/40 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">New Context</span>
                    <Button variant="ghost" size="icon" className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setShowAddSource(false)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="p-5 space-y-4">
                    <Select value={linkForm.type} onChange={(e) => setLinkForm({ ...linkForm, type: e.target.value })} className="h-11 text-[10px] rounded-xl font-black uppercase tracking-widest bg-background/50">
                      <option value="web">Web Access</option>
                      <option value="youtube">YouTube Ground</option>
                      <option value="file">Local Archive</option>
                    </Select>

                    {linkForm.type === 'file' ? (
                      <div className="space-y-4">
                         <div 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full h-32 border-dashed border-2 rounded-2xl bg-muted/20 hover:bg-muted/40 cursor-pointer flex flex-col items-center justify-center gap-3 transition-all border-muted-foreground/20 hover:border-primary/40 group overflow-hidden relative"
                         >
                           <Upload className="size-6 text-muted-foreground/40 group-hover:text-primary group-hover:scale-110 transition-all duration-500" />
                           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-6 text-center leading-relaxed">
                             {fileForm.file ? fileForm.file.name : 'Choose Archive\n(PDF/DOCX/TXT)'}
                           </span>
                           {fileForm.file && <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />}
                         </div>
                         <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileSelection} />
                         {fileForm.file && (
                           <Button onClick={handleSubmitFile} disabled={isSubmittingFile} className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary active:scale-95 transition-all">
                             {isSubmittingFile ? <LoaderCircle className="animate-spin mr-2" /> : <Upload className="size-4 mr-2" />}
                             Ground to System
                           </Button>
                         )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="relative group">
                          <div className="absolute inset-0 rounded-xl ring-1 ring-primary/5 transition-all pointer-events-none" />
                          <Input 
                            name="sourceUrl" 
                            placeholder="Resource URL (https://...)" 
                            value={linkForm.sourceUrl} 
                            onChange={handleLinkChange}
                            className="h-12 text-xs rounded-xl bg-background/50 border-white/5 font-bold tracking-tight px-4 focus-visible:ring-0 transition-all outline-none"
                          />
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-0 rounded-xl ring-1 ring-primary/5 transition-all pointer-events-none" />
                          <Input 
                            name="title" 
                            placeholder="Custom Identifier (Optional)" 
                            value={linkForm.title} 
                            onChange={handleLinkChange}
                            className="h-12 text-xs rounded-xl bg-background/50 border-white/5 font-bold tracking-tight px-4 focus-visible:ring-0 transition-all outline-none"
                          />
                        </div>
                        <Button onClick={handleSubmitLink} disabled={isSubmittingLink} className="w-full h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-primary/20 bg-primary active:scale-95 transition-all">
                          {isSubmittingLink ? <LoaderCircle className="animate-spin mr-2" /> : <Link2 className="size-4 mr-2" />}
                          Synchronize Context
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>

            <div className="space-y-3 pt-2">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
              ) : documents.length === 0 ? (
                <div className="text-center py-16 px-6 border-2 border-dashed rounded-[2.5rem] bg-muted/5 opacity-40 flex flex-col gap-4 animate-in fade-in duration-1000">
                   <div className="p-4 rounded-2xl bg-muted/20 w-fit mx-auto">
                      <FileText className="size-8 opacity-20" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-center">Empty Context</p>
                      <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Grounding Required</p>
                   </div>
                </div>
              ) : documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="group flex items-start gap-4 p-5 rounded-[2rem] hover:bg-card/80 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-transparent hover:border-primary/10 transition-all duration-500 cursor-pointer relative overflow-hidden ring-1 ring-zinc-500/5 hover:ring-primary/20 active:scale-[0.98]"
                >
                  <div className="mt-0.5 p-3 rounded-2xl bg-primary/5 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-inner">
                    {doc.type === 'youtube' ? <PlayCircle className="size-4" /> : doc.type === 'web' ? <Globe className="size-4" /> : <FileText className="size-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-bold truncate leading-none text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors pr-2 tracking-tight">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant={statusBadgeVariant[doc.status]} className="text-[8px] font-black px-2 h-4 uppercase tracking-tighter rounded-sm shadow-sm">
                        {doc.status}
                      </Badge>
                      <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">{formatDocumentType(doc.type)}</span>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-primary scale-y-0 group-hover:scale-y-100 transition-transform duration-700" />
                  
                  {/* Backdrop Zap icon decoration */}
                  <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.03] rotate-12 scale-150 pointer-events-none group-hover:scale-[2] group-hover:rotate-45 transition-all duration-1000">
                    <Zap className="size-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-5 border-t bg-muted/30 backdrop-blur-3xl">
            <div className="flex items-center gap-4 group">
              <div className="size-11 rounded-3xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-zinc-950 font-black text-sm shadow-2xl transition-transform group-hover:scale-110">
                {group?.title?.[0]?.toUpperCase() || 'N'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.2em] truncate text-muted-foreground/60">Researcher Identity</p>
                <p className="text-[10px] text-zinc-900 dark:text-zinc-100 font-black uppercase tracking-widest truncate pt-0.5">{group?.title} SYSTEM</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content: Chat */}
        <main className="flex-1 flex flex-col relative bg-card/[0.02] overflow-hidden">
          {/* Main Header */}
          <header className={`h-20 border-b bg-background/60 backdrop-blur-3xl flex items-center px-8 justify-between sticky top-0 z-10 transition-all duration-700`}>
            <div className="flex items-center gap-8">
              {!isSidebarCollapsed && (
                <div className="relative">
                   <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full opacity-50" />
                   <Bot className="size-7 text-primary relative z-10 animate-pulse" />
                </div>
              )}
              {isSidebarCollapsed && <div className="w-12" />} {/* Space for trigger button */}
              <div>
                <h1 className="text-sm font-black uppercase tracking-[0.4em] text-zinc-900 dark:text-zinc-100 leading-none">Intelligence Core</h1>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-2 opacity-30">Grounded Logic Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-4 pr-2">
              <div className="hidden sm:flex items-center gap-2 mr-4">
                 <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Stream Active</span>
              </div>
              <Badge variant="outline" className="rounded-full bg-background/50 border-white/5 px-4 py-1.5 font-black text-[10px] uppercase tracking-widest shadow-sm ring-1 ring-primary/10">
                {isStreamingChat ? (
                  <span className="flex items-center gap-2 text-primary">
                    <LoaderCircle className="size-3 animate-spin" /> Analyzing Source Context
                  </span>
                ) : 'System Active'}
              </Badge>
            </div>
          </header>

          {/* Chat Feed */}
          <div 
            ref={chatViewportRef}
            className="flex-1 overflow-y-auto px-6 py-12 md:px-10 scroll-smooth scrollbar-none"
          >
            <div className="max-w-4xl mx-auto space-y-24 pb-48">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-12 mt-32 opacity-80 animate-in fade-in zoom-in duration-1000">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="p-12 rounded-[4rem] bg-card/60 backdrop-blur-md border-2 border-dashed border-primary/20 shadow-inner relative z-10 transition-transform duration-700 group-hover:scale-110">
                      <Bot className="size-24 text-primary/40 group-hover:text-primary/60 transition-colors" />
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-100">Establish Grounding</h2>
                    <p className="text-sm font-bold text-muted-foreground max-w-sm mx-auto uppercase tracking-widest opacity-60 leading-relaxed">Ask questions based strictly on your synchronized source identity.</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div 
                    key={msg.id || idx} 
                    className={`flex gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-12 duration-700`}
                  >
                    <div className="flex-shrink-0 pt-1">
                      <div className={`size-14 rounded-[1.8rem] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-2xl ${
                        msg.role === 'user' 
                        ? 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 shadow-zinc-500/20 ring-4 ring-zinc-500/5' 
                        : 'bg-primary/10 text-primary border border-primary/10 shadow-primary/10 ring-4 ring-primary/5'
                      }`}>
                        {msg.role === 'user' ? <User className="size-6" /> : <Bot className="size-7" />}
                      </div>
                    </div>
                    <div className="flex-1 space-y-5 min-w-0">
                      <div className="flex items-center gap-6">
                        <span className={`text-[11px] font-black uppercase tracking-[0.4em] ${msg.role === 'user' ? 'text-zinc-900 dark:text-zinc-100' : 'text-primary'}`}>
                          {msg.role === 'user' ? 'Researcher' : 'Intelligence Agent'}
                        </span>
                        {msg.isStreaming && <LoaderCircle className="size-4 animate-spin text-primary opacity-60" />}
                        <div className="h-px flex-1 bg-border/40" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 italic">Protocol v1.0</span>
                      </div>
                      <div className={`text-zinc-800 dark:text-zinc-100 leading-9 font-medium text-lg tracking-tight selection:bg-primary/30`}>
                        <p className="whitespace-pre-wrap">
                          {msg.content || (msg.isStreaming ? '...' : '')}
                        </p>
                      </div>
                      {msg.role === 'assistant' && !msg.isStreaming && (
                         <div className="pt-6 flex flex-wrap items-center gap-3">
                            <Button variant="ghost" size="sm" className="h-9 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest bg-muted/20 hover:bg-primary/10 hover:text-primary transition-all active:scale-95 border border-white/5">
                               <ShieldCheck className="size-3.5 mr-2 opacity-60" />
                               Cite Protocol
                            </Button>
                            <Button variant="ghost" size="sm" className="h-9 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest bg-muted/20 hover:bg-primary/10 hover:text-primary transition-all active:scale-95 border border-white/5">
                               <Zap className="size-3.5 mr-2 opacity-60" />
                               Verify Logic
                            </Button>
                         </div>
                      )}
                    </div>
                  </div>
                ))
              )}

              {chatError && (
                <div className="p-8 rounded-[2.5rem] bg-destructive/10 border-2 border-destructive/20 text-destructive text-sm font-black flex items-center gap-6 animate-in shake-in shadow-2xl shadow-destructive/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(var(--destructive),0.05),transparent)]" />
                  <div className="p-4 rounded-2xl bg-destructive/20 relative z-10">
                     <AlertTriangle className="size-7" />
                  </div>
                  <div className="space-y-1 relative z-10">
                    <p className="uppercase tracking-[0.3em] font-black text-xs mb-1">Transmission Failure</p>
                    <p className="opacity-80 tracking-tight">{chatError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Chat Input */}
          <div className="absolute bottom-0 left-0 right-0 p-10 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
            <div className={`max-w-4xl mx-auto pointer-events-auto transition-all duration-1000 delay-300 animate-in slide-in-from-bottom-16`}>
              <form 
                onSubmit={handleSubmitChat}
                className="relative flex items-end gap-5 p-5 rounded-[3rem] bg-white/90 dark:bg-zinc-900/90 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.3)] dark:shadow-[0_40px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl group transition-all duration-700 overflow-hidden"
              >
                <div className="flex-1 relative pb-1">
                  <textarea
                    rows={1}
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmitChat(e);
                      }
                    }}
                    placeholder="Engage with grounded research context..."
                    className="w-full bg-transparent border-none focus:ring-0 placeholder:text-muted-foreground/30 px-6 pt-5 pb-3 resize-none h-[64px] max-h-56 text-lg font-bold tracking-tight leading-relaxed selection:bg-primary/20"
                    disabled={isStreamingChat}
                  />
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isStreamingChat || !chatQuery.trim()}
                  className="size-16 rounded-[2rem] shadow-2xl shadow-primary/30 transition-all hover:scale-110 active:scale-90 bg-primary hover:bg-primary/90 flex-shrink-0 ring-4 ring-primary/10 mb-1"
                >
                  {isStreamingChat ? <LoaderCircle className="size-7 animate-spin" /> : <Send className="size-6" />}
                </Button>
                
                {/* Status Indicator inside input */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-focus-within:opacity-100 transition-opacity">
                   <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black uppercase tracking-widest text-primary/60">Grounded Mode</span>
                       <div className="size-1.5 rounded-full bg-primary animate-pulse" />
                   </div>
                </div>

                {/* Visual Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity" />
              </form>
              <div className="flex justify-center flex-wrap gap-x-10 gap-y-2 mt-6">
                 <div className="flex items-center gap-3 opacity-20">
                    <ShieldCheck className="size-3 text-primary" />
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em]">
                      AI Integrity Guard
                    </p>
                 </div>
                 <div className="h-px w-10 bg-muted-foreground/10 self-center hidden sm:block" />
                 <div className="flex items-center gap-3 opacity-20">
                    <Zap className="size-3 text-primary" />
                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.4em]">
                      Grounded Synchronicity
                    </p>
                 </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

// Fixed missing ShieldCheck import
import { ShieldCheck as ShieldCheckIcon } from 'lucide-react';
const ShieldCheck = ShieldCheckIcon;
