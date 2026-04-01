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
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30">
              <Bot className="size-4" />
            </div>
            <span className="hidden text-sm font-semibold tracking-tight sm:block text-foreground">
              AI Workspace
            </span>
          </Link>

          <div className="hidden items-center text-xs font-medium text-muted-foreground sm:flex">
            <ChevronRight className="size-3.5 mx-1 opacity-50" />
            <div className="flex items-center gap-1.5">
              {isHome && <span>Overview</span>}
              {isGroups && <span>Workspaces</span>}
              {isProfile && <span>Settings</span>}
              {isGroupDetail && <span>Notebook</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-card/65 p-1 shadow-sm sm:flex">
            <Link 
              href="/" 
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${isHome ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/groups" 
              className={`px-3 py-1.5 rounded-full text-xs transition-all ${isGroups || isGroupDetail ? 'bg-primary text-primary-foreground font-medium shadow-sm' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'}`}
            >
              Workspaces
            </Link>
          </div>
          
          <UserButton 
            appearance={{ 
              elements: { 
                userButtonAvatarBox: 'h-9 w-9 rounded-xl shadow-sm border border-border/60 bg-card/80 transition-transform active:scale-95' 
              } 
            }} 
          />
        </div>
      </div>
    </nav>
  );
}
