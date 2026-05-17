'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMenuForUser } from '@/lib/permissions';
import { cn } from '@/lib/utils';

const iconMap: { [key: string]: any } = {
  LayoutGrid: Icons.LayoutGrid,
  CreditCard: Icons.CreditCard,
  Building2: Icons.Building2,
  BookOpen: Icons.BookOpen,
  CalendarDays: Icons.CalendarDays,
  CheckCircle2: Icons.CheckCircle2,
  DollarSign: Icons.DollarSign,
  FileText: Icons.FileText,
  Users: Icons.Users,
  Users2: Icons.Users2,
  Home: Icons.Home,
  Bell: Icons.Bell,
  User: Icons.User,
  Settings: Icons.Settings,
  ShieldCheck: Icons.ShieldCheck,
};

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      if (typeof window === 'undefined') return false;
      return localStorage.getItem('sidebarCollapsed') === '1';
    } catch (e) { return false; }
  });

  if (isLoading) {
    return (
      <aside className="fixed left-0 top-16 z-40 h-[calc(100vh-64px)] w-64 border-r border-border bg-background p-4 lg:relative lg:top-0 lg:translate-x-0">
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

  const menuItems = getMenuForUser(user);

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(href)) {
        next.delete(href);
      } else {
        next.add(href);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-64px)] transform border-r border-border bg-background shadow-xl transition-transform duration-300 overflow-y-auto lg:relative lg:top-0 lg:z-auto lg:translate-x-0 lg:shadow-none',
          collapsed ? 'w-20' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className={cn('space-y-1 p-2', collapsed ? 'px-2' : 'p-4')}>
          {menuItems.map((item) => {
            const Icon = iconMap[item.icon || 'LayoutGrid'] || Icons.LayoutGrid;
            const hasChildren = item.children && item.children.length > 0;
            const active = isActive(item.href);
            const expanded = expandedItems.has(item.href);

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpanded(item.href)}
                    title={item.label}
                    className={cn(
                      'w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-popover text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {!collapsed && <span>{item.label}</span>}
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        expanded && 'rotate-180'
                      )}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-popover text-primary'
                        : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )}

                {hasChildren && expanded && (
                  <div className="ml-3 space-y-1 border-l border-border pl-3">
                    {item.children?.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={cn(
                          'block w-full rounded-lg px-3 py-2 text-sm transition-colors',
                          isActive(child.href)
                            ? 'bg-popover font-medium text-primary'
                            : 'text-muted-foreground hover:bg-popover'
                        )}
                      >
                        {!collapsed && child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() => { setCollapsed(!collapsed); try { localStorage.setItem('sidebarCollapsed', !collapsed ? '1' : '0'); } catch (e) {} }}
              className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            >
              {collapsed ? 'Expand' : 'Collapse'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}