'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Bell, LogOut, Settings, User, Search, Languages, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/lib/api';
import { getMenuForUser } from '@/lib/permissions';
import { useLanguage } from '@/lib/i18n';

interface NavbarProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

const avatarGradients = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  'linear-gradient(135deg, #10b981, #0ea5e9)',
  'linear-gradient(135deg, #f59e0b, #f97316)',
];

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

  /* Pick a consistent avatar gradient based on user name */
  const avatarGradient = avatarGradients[
    (user?.name?.charCodeAt(0) || 0) % avatarGradients.length
  ];

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
        const unreadFetcher = api.messages.getUnreadCount || api.messages.unread;
        const res: any = await unreadFetcher();
        if (res?.unreadCount !== undefined) setUnreadMessages(res.unreadCount);
      } catch (error: any) {
        console.debug('Messages stats not available:', error?.message);
      }
    };

    loadNotices();
    loadMessages();
    const interval = setInterval(() => { loadNotices(); loadMessages(); }, 30000);
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
    const match = routes.find((item) =>
      item.label.toLowerCase().includes(term) || item.href.toLowerCase().includes(term)
    );
    if (match) {
      setShowMobileSearch(false);
      setGlobalSearch('');
      router.push(match.href);
    }
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const navStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.88)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(226,232,240,0.7)',
    boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 8px 24px rgba(99,102,241,0.06)',
  };

  const iconBtnStyle: React.CSSProperties = {
    borderRadius: '0.75rem',
    padding: '0.5rem',
    color: '#64748b',
    transition: 'all 0.2s ease',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const BadgeDot = ({ count }: { count: number }) =>
    count > 0 ? (
      <span
        className="absolute -right-0.5 -top-0.5 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none text-white"
        style={{ background: 'linear-gradient(135deg, #f43f5e, #ec4899)', minWidth: '1rem' }}
      >
        {count > 99 ? '99+' : count}
      </span>
    ) : null;

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 w-full overflow-visible"
      style={navStyle}
    >
      {/* Top rainbow line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: 'linear-gradient(90deg, #6366f1 0%, #ec4899 35%, #f59e0b 65%, #10b981 100%)' }}
      />

      <div className="grid h-16 w-full grid-cols-[auto_1fr] items-center gap-1 overflow-visible px-2 sm:grid-cols-[auto_1fr_auto] sm:px-4 lg:px-6">
        {/* Left: burger + brand */}
        <div className="flex min-w-0 items-center gap-1 sm:gap-3">
          <button
            onClick={onMenuClick}
            style={iconBtnStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen
              ? <X className="h-5 w-5" />
              : <Menu className="h-5 w-5" />
            }
          </button>

          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white font-bold text-sm shadow-lg"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
            >
              E
            </div>
            <div className="hidden sm:block">
              <div
                className="font-extrabold text-sm leading-none"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                EASY SCHOOL
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5 font-medium">Management System</div>
            </div>
          </Link>
        </div>

        {/* Center: search */}
        <div className="hidden max-w-sm px-4 lg:block">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
              style={{ color: '#a5b4fc' }}
            />
            <input
              type="search"
              placeholder="Search anything…"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runGlobalSearch(); }}
              style={{
                width: '100%',
                paddingLeft: '2.5rem',
                paddingRight: '1rem',
                paddingTop: '0.5rem',
                paddingBottom: '0.5rem',
                fontSize: '0.875rem',
                background: 'rgba(99,102,241,0.05)',
                border: '1.5px solid rgba(99,102,241,0.15)',
                borderRadius: '0.75rem',
                color: '#0f172a',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#fff';
                (e.currentTarget as HTMLElement).style.borderColor = '#6366f1';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)';
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.15)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex min-w-0 items-center justify-end gap-0.5 overflow-visible sm:gap-1.5">
          {/* Mobile search toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            style={iconBtnStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; (e.currentTarget as HTMLElement).style.color = '#6366f1'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
            className="lg:hidden"
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Messages */}
          <Link
            href="/messages"
            title="Messages"
            className="relative min-[420px]:block hidden"
            style={iconBtnStyle}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(14,165,233,0.08)'; (e.currentTarget as HTMLElement).style.color = '#0ea5e9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
          >
            <Mail className="h-5 w-5" />
            <BadgeDot count={unreadMessages} />
          </Link>

          {/* Notifications */}
          <div className="relative hidden min-[430px]:block">
            <button
              onClick={async () => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) {
                  try {
                    const res = await api.notifications.getAll();
                    const list = Array.isArray(res) ? res : [];
                    setNotifications(list);
                    setUnreadCount(list.filter((n) => !n.isRead).length);
                  } catch (e) {}
                }
              }}
              style={iconBtnStyle}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(245,158,11,0.08)'; (e.currentTarget as HTMLElement).style.color = '#f59e0b'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              <BadgeDot count={unreadCount} />
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 top-full z-[100] mt-2 overflow-hidden"
                style={{
                  width: 'min(calc(100vw - 1rem), 22rem)',
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 48px rgba(15,23,42,0.12), 0 0 0 1px rgba(99,102,241,0.06)',
                  animation: 'float-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(226,232,240,0.7)' }}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" style={{ color: '#6366f1' }} />
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    className="text-xs font-semibold"
                    style={{ color: '#6366f1' }}
                    onClick={async () => {
                      try {
                        await api.notifications.markAll();
                        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
                        setUnreadCount(0);
                      } catch (e) {}
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div className="max-h-72 overflow-auto">
                  {notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                      <Bell className="h-8 w-8 mb-2 opacity-40" />
                      <span className="text-sm">No notifications</span>
                    </div>
                  )}
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className="flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors"
                      style={{
                        borderBottom: '1px solid rgba(226,232,240,0.5)',
                        background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                      }}
                      onClick={async () => {
                        try {
                          await api.notifications.markRead(n._id);
                          setNotifications((prev) => prev.map((x) => x._id === n._id ? { ...x, isRead: true } : x));
                          setUnreadCount((c) => Math.max(0, c - 1));
                          if (n.link) window.location.href = n.link;
                        } catch (e) {}
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)'; }}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                      >
                        N
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-slate-800">{n.title}</div>
                        {n.body && <div className="line-clamp-2 text-xs text-slate-500 mt-0.5">{n.body}</div>}
                        <div className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                      </div>
                      {!n.isRead && (
                        <div className="h-2 w-2 rounded-full shrink-0 mt-1.5" style={{ background: '#6366f1' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ID Card */}
          {can('download:idcard') && (
            <Link
              href="/id-cards/my-card"
              className="hidden rounded-lg px-2.5 py-1.5 text-xs font-semibold md:flex items-center gap-1 transition-all"
              style={{
                background: 'rgba(99,102,241,0.08)',
                color: '#6366f1',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: '0.625rem',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.14)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
            >
              ID Card
            </Link>
          )}

          {/* Language switcher */}
          <div
            className="flex shrink-0 items-center p-0.5"
            style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1px solid rgba(99,102,241,0.14)',
              borderRadius: '99px',
            }}
            translate="no"
            title="Language"
          >
            <Languages className="hidden h-3.5 w-3.5 md:mx-1.5 md:block" style={{ color: '#a5b4fc' }} />
            {(['en', 'bn'] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => language !== lang && setLanguage(lang)}
                className="rounded-full px-1.5 py-1 text-[10px] font-semibold md:px-2 md:text-[11px] transition-all"
                style={
                  language === lang
                    ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }
                    : { background: 'transparent', color: '#94a3b8' }
                }
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Profile */}
          <div className="relative overflow-visible" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 transition-all"
              style={{
                borderRadius: '0.75rem',
                padding: '0.25rem 0.5rem 0.25rem 0.25rem',
                background: showProfileMenu ? 'rgba(99,102,241,0.08)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'; }}
              onMouseLeave={(e) => {
                if (!showProfileMenu) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
              aria-haspopup="true"
              title="Profile"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold text-white shadow-md"
                style={{ background: avatarGradient }}
              >
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden text-sm font-semibold text-slate-700 lg:inline">
                {user?.name || 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div
                className="absolute right-0 top-full z-[100] mt-2 w-52 overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.97)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(226,232,240,0.8)',
                  borderRadius: '1rem',
                  boxShadow: '0 20px 48px rgba(15,23,42,0.12), 0 0 0 1px rgba(99,102,241,0.06)',
                  animation: 'float-up 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                }}
              >
                {/* User info header */}
                <div
                  className="px-4 py-3"
                  style={{ borderBottom: '1px solid rgba(226,232,240,0.7)', background: 'rgba(99,102,241,0.03)' }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white shadow"
                      style={{ background: avatarGradient }}
                    >
                      {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{user?.name || 'User'}</div>
                      <div className="text-xs text-slate-500">{user?.role || ''}</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    { href: '/profile', icon: User, label: 'My Profile', color: '#6366f1' },
                    { href: '/settings', icon: Settings, label: 'Settings', color: '#0ea5e9' },
                  ].map(({ href, icon: Icon, label, color }) => (
                    <Link
                      key={href}
                      href={href}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition-colors"
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.05)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ background: `${color}18`, color }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-medium">{label}</span>
                    </Link>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid rgba(226,232,240,0.7)' }} className="py-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                    style={{ color: '#ef4444' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.06)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </div>
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showMobileSearch && (
        <div
          className="border-t px-3 py-3 lg:hidden"
          style={{ borderColor: 'rgba(226,232,240,0.7)', background: 'rgba(255,255,255,0.95)' }}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#a5b4fc' }} />
              <input
                type="search"
                autoFocus
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runGlobalSearch(); }}
                placeholder="Search menu…"
                style={{
                  width: '100%',
                  paddingLeft: '2.5rem',
                  paddingRight: '1rem',
                  paddingTop: '0.5rem',
                  paddingBottom: '0.5rem',
                  fontSize: '0.875rem',
                  background: 'rgba(99,102,241,0.05)',
                  border: '1.5px solid rgba(99,102,241,0.2)',
                  borderRadius: '0.75rem',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={runGlobalSearch}
              className="px-4 py-2 text-sm font-semibold text-white rounded-xl"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              Go
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}