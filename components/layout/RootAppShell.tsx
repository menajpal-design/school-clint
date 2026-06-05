'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { ShellProvider } from './ShellContext';
import { useAuth } from '@/hooks/useAuth';
import { isRouteAllowed } from '@/lib/permissions';

const publicPrefixes = ['/login', '/register', '/forgot-password', '/reset-password', '/pricing', '/result', '/admission', '/public'];

function isPublicRoute(pathname: string) {
  if (pathname === '/') return true;
  return publicPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function AccessDeniedContent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
        <p className="text-sm text-slate-600">আপনি এই পেজটি দেখার জন্য অনুমোদিত নন।</p>
        <p className="text-xs text-slate-400">You do not have permission to access this page.</p>
        <div className="pt-2">
          <a href="/dashboard" className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

function ProtectedShell({ children, isSidebarOpen, setIsSidebarOpen }: { children: React.ReactNode; isSidebarOpen: boolean; setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>> }) {
  return (
    <ShellProvider>
      <div className="easy-root-shell app-surface flex min-h-screen flex-col pt-16 mobile-app-layout" data-app-shell="root">
        <Navbar onMenuClick={() => setIsSidebarOpen((open) => !open)} isMobileMenuOpen={isSidebarOpen} />
        <div className="flex min-h-0 flex-1 mobile-content-shell">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className="min-w-0 flex-1 p-3 pb-20 transition-all duration-300 md:p-4 lg:p-6 mobile-main-content">
            <div className="mx-auto w-full max-w-[1600px] min-w-0">{children}</div>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}

export function RootAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isPublicRoute(pathname)) return <>{children}</>;

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><div className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-border bg-background/95 shadow-sm" /><main className="pt-20"><div className="mx-auto max-w-7xl p-4"><div className="h-32 animate-pulse rounded-xl bg-muted" /></div></main></div>;
  }

  if (!user) return <>{children}</>;

  if (!isRouteAllowed(pathname, user.role)) {
    return (
      <ProtectedShell isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
        <AccessDeniedContent />
      </ProtectedShell>
    );
  }

  return (
    <ProtectedShell isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}>
      {children}
    </ProtectedShell>
  );
}
