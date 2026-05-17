'use client';

import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { useHasShell } from './ShellContext';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const hasShell = useHasShell();

  if (hasShell) return <>{children}</>;

  return (
    <div className="easy-app-shell flex min-h-screen flex-col bg-gray-50 pt-16 mobile-app-layout" data-app-shell="app">
      <Navbar onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} isMobileMenuOpen={isSidebarOpen} />
      <div className="flex min-h-0 flex-1 mobile-content-shell">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="min-w-0 flex-1 bg-gray-50 p-3 pb-20 md:p-4 lg:ml-0 lg:p-6 mobile-main-content">
          <div className="mx-auto w-full max-w-[1600px] min-w-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
