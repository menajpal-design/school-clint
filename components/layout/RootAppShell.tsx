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

export function RootAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isPublicRoute(pathname)) return <>{children}</>;

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><div className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-border bg-background/95 shadow-sm" /><main className="pt-20"><div className="mx-auto max-w-7xl p-4"><div className="h-32 animate-pulse rounded-xl bg-muted" /></div></main></div>;
  }

  if (!user) return <>{children}</>;

  const allowed = isRouteAllowed(pathname, user.role);

  return (
    <ShellProvider>
      <div className="easy-root-shell app-surface flex min-h-screen flex-col pt-16 mobile-app-layout" data-app-shell="root">
        <Navbar onMenuClick={() => setIsSidebarOpen((open) => !open)} isMobileMenuOpen={isSidebarOpen} />
        <div className="flex min-h-0 flex-1 mobile-content-shell">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <main className={`min-w-0 flex-1 p-3 pb-20 md:p-4 lg:p-6 mobile-main-content transition-all duration-300`}>
            <div className="mx-auto w-full max-w-[1600px] min-w-0">
              {allowed ? children : (
                <div className="min-h-[50vh] flex items-center justify-center p-4">
                  <div className="max-w-md w-full text-center space-y-4 bg-white p-8 rounded-xl border shadow-sm">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
                    <p className="text-slate-600 text-sm">
                      আপনি এই পেজটি দেখার জন্য অনুমোদিত নন।
                    </p>
                    <p className="text-slate-400 text-xs">
                      (You do not have permission to access this page.)
                    </p>
                    <div className="pt-2">
                      <a href="/dashboard" className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none">
                        Back to Dashboard
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
