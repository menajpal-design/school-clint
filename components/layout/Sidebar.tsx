'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMenuForUser } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

const iconMap: { [key: string]: any } = {
  LayoutGrid: Icons.LayoutGrid,
  CreditCard: Icons.CreditCard,
  Building2: Icons.Building2,
  BookOpen: Icons.BookOpen,
  BookMarked: Icons.BookMarked,
  BookOpenCheck: Icons.BookOpenCheck,
  CalendarDays: Icons.CalendarDays,
  CheckCircle2: Icons.CheckCircle2,
  DollarSign: Icons.DollarSign,
  FileText: Icons.FileText,
  Users: Icons.Users,
  Users2: Icons.Users2,
  Home: Icons.Home,
  Bell: Icons.Bell,
  MessageSquare: Icons.MessageSquare,
  User: Icons.User,
  Settings: Icons.Settings,
  ShieldCheck: Icons.ShieldCheck,
};

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const normalizePath = (value?: string | null) => (value || '/').split('?')[0].replace(/\/$/, '') || '/';
const isSameOrChild = (pathname: string, href: string) => {
  const path = normalizePath(pathname);
  const target = normalizePath(href);
  return path === target || (target !== '/' && path.startsWith(`${target}/`));
};

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem('sidebarCollapsed') === '1';
    } catch (e) { return false; }
  });

  const menuItems = useMemo(() => getMenuForUser(user), [user]);

  useEffect(() => {
    const next = new Set<string>();
    menuItems.forEach((item) => {
      if (item.children?.some((child) => isSameOrChild(pathname || '/', child.href))) {
        next.add(item.href);
      }
    });
    if (next.size) {
      setExpandedItems((prev) => new Set([...Array.from(prev), ...Array.from(next)]));
    }
  }, [pathname, menuItems]);

  if (isLoading) {
    return (
      <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-64px)] w-64 border-r border-border bg-background p-4 lg:sticky lg:top-16 lg:translate-x-0">
        <div className="space-y-3 animate-pulse">
          <div className="h-4 w-28 rounded bg-muted" />
          <div className="h-10 rounded bg-popover" />
          <div className="h-10 rounded bg-popover" />
          <div className="h-10 rounded bg-popover" />
          <div className="h-10 rounded bg-popover" />
        </div>
      </aside>
    );
  }

  if (!user) return null;

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  const itemIsActive = (item: any) => {
    if (isSameOrChild(pathname || '/', item.href)) return true;
    return Boolean(item.children?.some((child: any) => isSameOrChild(pathname || '/', child.href)));
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-64px)] transform border-r border-border bg-background shadow-xl transition-transform duration-300 overflow-y-auto lg:sticky lg:top-16 lg:z-30 lg:translate-x-0 lg:self-start lg:shadow-none',
          collapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <nav className={cn('space-y-1 p-2', collapsed ? 'px-2' : 'p-4')} aria-label="Sidebar navigation">
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon || 'LayoutGrid'] || Icons.LayoutGrid;
            const hasChildren = item.children && item.children.length > 0;
            const active = itemIsActive(item);
            const expanded = expandedItems.has(item.href);

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.href)}
                    title={t(item.label)}
                    aria-expanded={expanded}
                    className={cn(
                      'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-popover text-primary' : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{t(item.label)}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')} />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={t(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active ? 'bg-popover text-primary' : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{t(item.label)}</span>}
                  </Link>
                )}

                {hasChildren && expanded && !collapsed && (
                  <div className="ml-3 mt-1 space-y-1 border-l border-border pl-3">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          'block w-full rounded-lg px-3 py-2 text-sm transition-colors',
                          isSameOrChild(pathname || '/', child.href)
                            ? 'bg-popover font-medium text-primary'
                            : 'text-muted-foreground hover:bg-popover'
                        )}
                      >
                        {t(child.label)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => {
                setCollapsed(!collapsed);
                try { localStorage.setItem('sidebarCollapsed', !collapsed ? '1' : '0'); } catch (e) {}
              }}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {collapsed ? t('Expand') : t('Collapse')}
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
