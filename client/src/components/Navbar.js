'use client';

import Link from 'next/link';
import { UserButton, useAuth } from '@clerk/nextjs';
import { Bot, ChevronRight, LayoutDashboard, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const pathname = usePathname();

  const isGroupDetail = pathname.startsWith('/group/');

  if (!isSignedIn || pathname === '/onboarding' || isGroupDetail) {
    return null;
  }

  const isHome = pathname === '/';
  const isGroups = pathname === '/groups';
  const isProfile = pathname === '/profile';


  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="inline-flex size-9 items-center justify-center rounded-xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 shadow-sm">
              <Bot className="size-5" />
            </div>
            <span className="hidden text-sm font-bold tracking-tight sm:block bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400 bg-clip-text text-transparent">
              AI Notebook
            </span>
          </Link>

          <div className="flex items-center text-xs font-medium text-muted-foreground/60">
            <ChevronRight className="size-3.5 mx-1" />
            <div className="flex items-center gap-1.5">
              {isHome && <span>Dashboard</span>}
              {isGroups && <span>Workspaces</span>}
              {isProfile && <span>Profile</span>}
              {isGroupDetail && <span>Notebook</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-1 sm:flex">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${isHome ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted font-medium'}`}
            >
              Overview
            </Link>
            <Link 
              href="/groups" 
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${isGroups || isGroupDetail ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted font-medium'}`}
            >
              Workspaces
            </Link>
          </div>

          <div className="h-6 w-px bg-border/60 mx-1" />
          
          <UserButton 
            appearance={{ 
              elements: { 
                userButtonAvatarBox: 'h-8 w-8 ring-1 ring-border/50 shadow-sm transition-transform active:scale-95' 
              } 
            }} 
          />
        </div>
      </div>
    </nav>
  );
}
