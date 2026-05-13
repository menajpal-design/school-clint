'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Bell, LogOut, Settings, User, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface NavbarProps {
  onMenuClick?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Navbar({ onMenuClick, isMobileMenuOpen }: NavbarProps) {
  const { user, logout } = useAuth();
  const { can } = usePermission();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [language, setLanguage] = useState('en');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('lang') : null;
    if (saved) setLanguage(saved);

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
        setUnreadMessages(res.unreadCount || 0);
      } catch (e) {}
    };

    loadNotices();
    loadMessages();

    // Refresh every 30 seconds
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

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>

          {/* Logo and Institution Name */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="hidden font-bold text-gray-800 sm:inline-block">EASY SCHOOL</span>
          </Link>
        </div>

        {/* Center - Global Search */}
        <div className="hidden flex-1 max-w-md lg:flex">
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* mobile search */}
        <div className="lg:hidden">
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="rounded-lg p-2 hover:bg-gray-100"
            aria-label="Toggle search"
          >
            <Globe className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2 lg:gap-4">
          {/* Messages Button */}
          <Link href="/messages" title="Messages">
            <button className="relative rounded-lg p-2 hover:bg-gray-100">
              <svg
                className="h-5 w-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">
                  {unreadMessages > 99 ? '99+' : unreadMessages}
                </span>
              )}
            </button>
          </Link>

          {/* Notifications Dropdown */}
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
            }} className="relative rounded-lg p-2 hover:bg-gray-100" title="Notifications">
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-xs font-semibold leading-none text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-xs rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="flex items-center justify-between px-3 py-2">
                  <div className="text-sm font-medium">Notifications</div>
                  <button className="text-xs text-blue-600" onClick={async () => { try { await api.notifications.markAll(); setNotifications((prev)=>prev.map(n=>({ ...n, isRead: true }))); setUnreadCount(0); } catch(e){} }}>Mark all</button>
                </div>
                <div className="max-h-64 overflow-auto">
                  {notifications.length === 0 && <div className="p-3 text-sm text-muted-foreground">No notifications</div>}
                  {notifications.map((n) => (
                    <div key={n._id} className={"flex items-start gap-2 px-3 py-2 border-t last:border-b cursor-pointer " + (n.isRead ? 'bg-white' : 'bg-blue-50')} onClick={async () => { try { await api.notifications.markRead(n._id); setNotifications((prev)=>prev.map(x=>x._id===n._id?{...x,isRead:true}:x)); setUnreadCount((c)=>Math.max(0,c-1)); if (n.link) window.location.href = n.link; } catch(e){} }}>
                      <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold">N</div>
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

          {/* ID Card Shortcut */}
          {can('download:idcard') && (
            <Link href="/id-cards/my-card">
              <button className="hidden rounded-lg p-2 hover:bg-gray-100 md:block">
                <span className="text-xs font-semibold text-gray-600">ID Card</span>
              </button>
            </Link>
          )}

          {/* Language Switcher */}
          <select
            value={language}
            onChange={(e) => { setLanguage(e.target.value); if (typeof window !== 'undefined') localStorage.setItem('lang', e.target.value); }}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none"
            aria-label="Language"
          >
            <option value="en">EN</option>
            <option value="bn">BN</option>
          </select>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden text-sm font-medium text-gray-700 lg:inline">
                {user?.name || 'User'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <Link href="/profile">
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="h-4 w-4" />
                    My Profile
                  </button>
                </Link>
                <Link href="/settings">
                  <button className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                </Link>
                <hr className="my-1" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}