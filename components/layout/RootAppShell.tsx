'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';

const publicPrefixes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/pricing',
  '/result',
  '/admission',
  '/public',
];

function isPublicRoute(pathname: string) {
  if (pathname === '/') return true;
  return publicPrefixes.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function RootAppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const { user, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="fixed left-0 right-0 top-0 z-50 h-16 border-b border-border bg-background/95 shadow-sm" />
        <main className="pt-20">
          <div className="mx-auto max-w-7xl p-4">
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 pt-16 mobile-app-layout">
      <Navbar
        onMenuClick={() => setIsSidebarOpen((open) => !open)}
        isMobileMenuOpen={isSidebarOpen}
      />
      <div className="flex min-h-0 flex-1 mobile-content-shell">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="min-w-0 flex-1 bg-gray-50 p-3 pb-20 md:p-4 lg:ml-0 lg:p-6 mobile-main-content">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
