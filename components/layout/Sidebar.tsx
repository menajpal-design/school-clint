'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Lock, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMenuForUser } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n';

const iconMap: { [key: string]: any } = {
  LayoutGrid:    Icons.LayoutGrid,
  BarChart3:     Icons.BarChart3,
  CreditCard:    Icons.CreditCard,
  Building2:     Icons.Building2,
  BookOpen:      Icons.BookOpen,
  BookMarked:    Icons.BookMarked,
  BookOpenCheck: Icons.BookOpenCheck,
  CalendarDays:  Icons.CalendarDays,
  CheckCircle2:  Icons.CheckCircle2,
  DollarSign:    Icons.DollarSign,
  FileText:      Icons.FileText,
  Users:         Icons.Users,
  Users2:        Icons.Users2,
  Home:          Icons.Home,
  Bell:          Icons.Bell,
  MessageSquare: Icons.MessageSquare,
  User:          Icons.User,
  Settings:      Icons.Settings,
  ShieldCheck:   Icons.ShieldCheck,
};

/* Each menu item gets a colour accent cycling through the palette */
const accentColors = [
  { bg: 'rgba(99,102,241,0.18)',  text: '#a5b4fc', glow: 'rgba(99,102,241,0.4)'  },  // indigo
  { bg: 'rgba(14,165,233,0.18)',  text: '#7dd3fc', glow: 'rgba(14,165,233,0.4)'  },  // sky
  { bg: 'rgba(16,185,129,0.18)',  text: '#6ee7b7', glow: 'rgba(16,185,129,0.4)'  },  // emerald
  { bg: 'rgba(236,72,153,0.18)',  text: '#f9a8d4', glow: 'rgba(236,72,153,0.4)'  },  // pink
  { bg: 'rgba(245,158,11,0.18)',  text: '#fcd34d', glow: 'rgba(245,158,11,0.4)'  },  // amber
  { bg: 'rgba(139,92,246,0.18)',  text: '#c4b5fd', glow: 'rgba(139,92,246,0.4)'  },  // violet
  { bg: 'rgba(249,115,22,0.18)',  text: '#fdba74', glow: 'rgba(249,115,22,0.4)'  },  // orange
  { bg: 'rgba(6,182,212,0.18)',   text: '#67e8f9', glow: 'rgba(6,182,212,0.4)'   },  // cyan
  { bg: 'rgba(244,63,94,0.18)',   text: '#fda4af', glow: 'rgba(244,63,94,0.4)'   },  // rose
];

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
      <aside style={{
        background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
      }} className="fixed left-0 top-16 z-40 h-[calc(100vh-64px)] w-64 p-4 lg:sticky lg:top-16 lg:translate-x-0">
        <div className="space-y-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)' }} />
          ))}
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
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 z-50 h-[calc(100vh-64px)] transform transition-all duration-300 overflow-y-auto lg:sticky lg:top-16 lg:z-30 lg:translate-x-0 lg:self-start',
          collapsed ? 'w-[72px]' : 'w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
        style={{
          background: 'linear-gradient(180deg, #1e1b4b 0%, #2d2a6e 35%, #1e2555 70%, #1a1a3e 100%)',
          boxShadow: '4px 0 24px rgba(99,102,241,0.15), inset -1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Top brand strip */}
        {!collapsed && (
          <div
            className="px-4 py-4 mb-1"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #6366f1, #ec4899)' }}
              >
                E
              </div>
              <div>
                <div className="text-white font-bold text-sm leading-none">EASY SCHOOL</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(165,180,252,0.7)' }}>Management</div>
              </div>
            </div>
          </div>
        )}

        <nav
          className={cn('space-y-0.5 py-3', collapsed ? 'px-2' : 'px-3')}
          aria-label="Sidebar navigation"
        >
          {menuItems.map((item, index) => {
            const Icon = iconMap[item.icon || 'LayoutGrid'] || Icons.LayoutGrid;
            const hasChildren = item.children && item.children.length > 0;
            const active = itemIsActive(item);
            const expanded = expandedItems.has(item.href);
            const accent = accentColors[index % accentColors.length];
            const locked = Boolean(item.locked);

            const itemBase: React.CSSProperties = {
              borderRadius: '0.75rem',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              marginBottom: '1px',
            };

            const activeStyle: React.CSSProperties = {
              ...itemBase,
              background: accent.bg,
              boxShadow: `0 0 0 1px ${accent.glow.replace('0.4', '0.25')}, 0 4px 12px ${accent.glow.replace('0.4', '0.2')}`,
            };

            const inactiveStyle: React.CSSProperties = {
              ...itemBase,
              background: 'transparent',
            };

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(item.href)}
                    title={t(item.label)}
                    aria-expanded={expanded}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium group',
                      collapsed && 'justify-center px-2',
                      locked && 'opacity-60'
                    )}
                    style={active ? activeStyle : inactiveStyle}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          background: active ? accent.bg : 'rgba(255,255,255,0.08)',
                          color: active ? accent.text : 'rgba(255,255,255,0.65)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      {!collapsed && (
                        <span style={{ color: active ? accent.text : 'rgba(255,255,255,0.75)' }}>
                          {t(item.label)}
                        </span>
                      )}
                    </div>
                    {locked && !collapsed && (
                      <span className="ml-auto mr-2 inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        <Lock className="h-3 w-3" />
                        Upgrade
                      </span>
                    )}
                    {!collapsed && (
                      <ChevronDown
                        className={cn('h-3.5 w-3.5 transition-transform duration-200', expanded && 'rotate-180')}
                        style={{ color: 'rgba(255,255,255,0.4)' }}
                      />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={onClose}
                    title={t(item.label)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium group',
                      collapsed && 'justify-center px-2 gap-0',
                      locked && 'opacity-60'
                    )}
                    style={active ? activeStyle : inactiveStyle}
                    onMouseEnter={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }
                    }}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: active ? accent.bg : 'rgba(255,255,255,0.08)',
                        color: active ? accent.text : 'rgba(255,255,255,0.65)',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                      {!collapsed && (
                      <span className={cn('min-w-0 flex-1 truncate', locked && 'blur-[1px]')} style={{ color: active ? accent.text : 'rgba(255,255,255,0.75)' }}>
                          {t(item.label)}
                        </span>
                      )}
                    {locked && !collapsed && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                        <Lock className="h-3 w-3" />
                        Upgrade
                      </span>
                    )}
                    {active && !collapsed && (
                      <div
                        className="ml-auto h-1.5 w-1.5 rounded-full"
                        style={{ background: accent.text }}
                      />
                    )}
                  </Link>
                )}

                {hasChildren && expanded && !collapsed && (
                  <div
                    className="ml-4 mt-0.5 mb-1 space-y-0.5 pl-3"
                    style={{ borderLeft: `2px solid ${accent.glow.replace('0.4', '0.2')}` }}
                  >
                    {item.children?.map((child) => {
                      const childActive = isSameOrChild(pathname || '/', child.href);
                      const childLocked = Boolean(child.locked);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                            childLocked && 'opacity-60'
                          )}
                          style={{
                            color: childActive ? accent.text : 'rgba(255,255,255,0.55)',
                            background: childActive ? accent.bg : 'transparent',
                            fontWeight: childActive ? 600 : 400,
                          }}
                          onMouseEnter={(e) => {
                            if (!childActive) {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!childActive) {
                              (e.currentTarget as HTMLElement).style.background = 'transparent';
                              (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.55)';
                            }
                          }}
                        >
                          <span className={cn('min-w-0 flex-1 truncate', childLocked && 'blur-[1px]')}>{t(child.label)}</span>
                          {childLocked && <Lock className="h-3.5 w-3.5 shrink-0 text-amber-200" />}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Collapse toggle */}
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              type="button"
              onClick={() => {
                setCollapsed(!collapsed);
                try { localStorage.setItem('sidebarCollapsed', !collapsed ? '1' : '0'); } catch (e) {}
              }}
              className={cn(
                'w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200',
                collapsed && 'justify-center'
              )}
              style={{
                color: 'rgba(255,255,255,0.5)',
                background: 'transparent',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.8)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)'; }}
            >
              {collapsed
                ? <PanelLeftOpen className="h-4 w-4" />
                : <><PanelLeftClose className="h-4 w-4" /><span>{t('Collapse')}</span></>
              }
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
