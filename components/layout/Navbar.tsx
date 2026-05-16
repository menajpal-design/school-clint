'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Bell, LogOut, Settings, User, Search, Languages } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/lib/api';
import { getMenuForUser } from '@/lib/permissions';
import { useLanguage } from '@/lib/i18n';

interface NavbarProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ onMenuClick, isMobileMenuOpen }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const { language, setLanguage } = useLanguage();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const res = await api.notifications.getAll();
        const list = Array.isArray(res) ? res : [];
        setNotifications(list);
        setUnreadCount(list.filter((n) => !n.isRead).length);
      } catch (e) {}
    };

    const loadMessages = async () => {
      try {
        const res: any = await api.messages.getUnreadCount();
        if (res?.unreadCount !== undefined) setUnreadMessages(res.unreadCount);
      } catch (error: any) {
        console.debug('Messages stats not available:', error?.message);
      }
    };

    loadNotices();
    loadMessages();
    const interval = setInterval(() => {
      loadNotices();
      loadMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const runGlobalSearch = () => {
    const term = globalSearch.trim().toLowerCase();
    if (!term || !user) return;
    const routes = getMenuForUser(user).flatMap((item) => [item, ...(item.children || [])]);
    const match = routes.find((item) => item.label.toLowerCase().includes(term) || item.href.toLowerCase().includes(term));
    if (match) {
      setShowMobileSearch(false);
      setGlobalSearch('');
      router.push(match.href);
    }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfileMenu(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-muted lg:hidden" aria-label="Toggle menu">
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-foreground">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <span className="hidden font-bold text-foreground sm:inline-block">EASY SCHOOL</span>
          </Link>
        </div>

        <div className="hidden max-w-md flex-1 lg:flex">
          <input
            type="search"
            placeholder="Search..."
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') runGlobalSearch(); }}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm focus:border-primary focus:bg-background focus:outline-none"
          />
        </div>

        <div className="lg:hidden">
          <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="rounded-lg p-2 hover:bg-muted" aria-label="Toggle search">
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <Link href="/messages" title="Messages" className="relative rounded-lg p-2 hover:bg-muted">
            <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            {unreadMessages > 0 && <span className="absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">{unreadMessages > 99 ? '99+' : unreadMessages}</span>}
          </Link>

          <div className="relative">
            <button onClick={async () => {
              setShowNotifications(!showNotifications);
              if (!showNotifications) {
                try {
                  const res = await api.notifications.getAll();
                  const list = Array.isArray(res) ? res : [];
                  setNotifications(list);
                  setUnreadCount(list.filter((n) => !n.isRead).length);
                } catch (e) {}
              }
            }} className="relative rounded-lg p-2 hover:bg-muted" title="Notifications">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-[min(calc(100vw-2rem),20rem)] rounded-lg border border-border bg-popover shadow-lg">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm font-medium">Notifications</div>
                  <button className="text-xs text-primary" onClick={async () => { try { await api.notifications.markAll(); setNotifications((prev)=>prev.map(n=>({ ...n, isRead: true }))); setUnreadCount(0); } catch(e){} }}>Mark all</button>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 && <div className="p-3 text-sm text-muted-foreground">No notifications</div>}
                  {notifications.map((n) => (
                    <div key={n._id} className={"flex cursor-pointer items-start gap-2 border-t px-3 py-2 last:border-b " + (n.isRead ? 'bg-popover' : 'bg-blue-50')} onClick={async () => { try { await api.notifications.markRead(n._id); setNotifications((prev)=>prev.map(x=>x._id===n._id?{...x,isRead:true}:x)); setUnreadCount((c)=>Math.max(0,c-1)); if (n.link) window.location.href = n.link; } catch(e){} }}>
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">N</div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{n.title}</div>
                        {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
                        <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {can('download:idcard') && <Link href="/id-cards/my-card" className="hidden rounded-lg p-2 hover:bg-muted md:block"><span className="text-xs font-semibold text-muted-foreground">ID Card</span></Link>}

          <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1" translate="no" title="Language">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <button type="button" onClick={() => language !== 'en' && setLanguage('en')} className={`rounded-md px-2 py-1 text-xs font-semibold ${language === 'en' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>EN</button>
            <button type="button" onClick={() => language !== 'bn' && setLanguage('bn')} className={`rounded-md px-2 py-1 text-xs font-semibold ${language === 'bn' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>BN</button>
          </div>

          <div className="relative" ref={profileRef}>
            <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted" aria-haspopup="true">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-semibold text-white">{user?.name?.charAt(0) || 'U'}</div>
              <span className="hidden text-sm font-medium text-foreground lg:inline">{user?.name || 'User'}</span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-popover shadow-lg">
                <Link href="/profile" className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"><User className="h-4 w-4" />My Profile</Link>
                <Link href="/settings" className="flex w-full items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-muted"><Settings className="h-4 w-4" />Settings</Link>
                <hr className="my-1 border-border" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
      {showMobileSearch && (
        <div className="border-t border-border px-4 py-3 lg:hidden">
          <div className="flex gap-2">
            <input type="search" autoFocus value={globalSearch} onChange={(event) => setGlobalSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') runGlobalSearch(); }} placeholder="Search menu..." className="min-w-0 flex-1 rounded-lg border border-border bg-muted px-3 py-2 text-sm focus:border-primary focus:bg-background focus:outline-none" />
            <button onClick={runGlobalSearch} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Go</button>
          </div>
        </div>
      )}
    </nav>
  );
}