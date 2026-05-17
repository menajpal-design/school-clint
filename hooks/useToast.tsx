'use client';

import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

declare global {
  interface Window {
    appToast?: (toast: Omit<Toast, 'id'>) => void;
    swal?: (options: any) => Promise<any>;
    Swal?: { fire: (options: any) => Promise<any> };
  }
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastStyles: Record<Toast['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
};

const toastAccent: Record<Toast['type'], string> = {
  success: 'bg-emerald-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
};

function normalizeToast(input: any): Omit<Toast, 'id'> {
  return {
    title: input?.title || (input?.icon === 'success' ? 'Success' : input?.icon === 'error' ? 'Error' : 'Notification'),
    message: input?.message || input?.text || input?.html || '',
    type: input?.type || input?.icon || 'info',
    duration: input?.duration ?? input?.timer ?? 4500,
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const recentToastRef = useRef<{ key: string; time: number } | null>(null);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const safeToast = { ...toast, type: ['success', 'error', 'info', 'warning'].includes(toast.type) ? toast.type : 'info' } as Omit<Toast, 'id'>;
    const key = `${safeToast.type}:${safeToast.message}`;
    const now = Date.now();
    if (recentToastRef.current?.key === key && now - recentToastRef.current.time < 1200) return;
    recentToastRef.current = { key, time: now };

    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...safeToast, id };
    setToasts((prev) => [...prev, newToast].slice(-5));

    const duration = safeToast.duration ?? 4500;
    if (duration > 0) setTimeout(() => removeToast(id), duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    window.appToast = (toast) => addToast(toast);
    window.Swal = {
      fire: async (options: any) => {
        const normalized = normalizeToast(options);
        if (options?.showCancelButton || options?.confirmButtonText || options?.cancelButtonText) {
          const ok = window.confirm(`${options?.title || 'Confirm'}\n\n${options?.text || options?.html || ''}`);
          return { isConfirmed: ok, isDismissed: !ok, value: ok };
        }
        addToast(normalized);
        return { isConfirmed: true, isDismissed: false, value: true };
      },
    };
    window.swal = window.Swal.fire;

    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<Toast, 'id'>>).detail;
      if (!detail?.message && !detail?.title) return;
      addToast(normalizeToast(detail));
    };

    window.addEventListener('app-toast', handleToast);
    return () => {
      window.removeEventListener('app-toast', handleToast);
      delete window.appToast;
      delete window.swal;
      delete window.Swal;
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="pointer-events-none fixed right-3 top-20 z-[9999] flex w-[calc(100vw-1.5rem)] max-w-sm flex-col gap-3 sm:right-4" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`pointer-events-auto overflow-hidden rounded-xl border shadow-2xl backdrop-blur ${toastStyles[toast.type]}`} role={toast.type === 'error' ? 'alert' : 'status'}>
            <div className={`h-1 w-full ${toastAccent[toast.type]}`} />
            <div className="flex items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.message && <p className="mt-1 break-words text-sm leading-5 opacity-90">{toast.message}</p>}
              </div>
              <button type="button" onClick={() => removeToast(toast.id)} className="rounded-md p-1 opacity-70 hover:bg-black/5 hover:opacity-100" aria-label="Close notification">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      toasts: [],
      addToast: (toast: Omit<Toast, 'id'>) => {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('app-toast', { detail: toast }));
      },
      removeToast: () => undefined,
    } as ToastContextType;
  }
  return context;
}
