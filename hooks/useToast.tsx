'use client';

import React, { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { ToastContainer, toast as toastify, ToastOptions, TypeOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface Toast {
  id?: string;
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

function normalizeToast(input: any): Omit<Toast, 'id'> {
  const type = input?.type || input?.icon || 'info';
  return {
    title: input?.title || (type === 'success' ? 'Success' : type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Notification'),
    message: input?.message || input?.text || input?.html || '',
    type: ['success', 'error', 'info', 'warning'].includes(type) ? type : 'info',
    duration: input?.duration ?? input?.timer ?? 4500,
  };
}

function showReactToast(input: Omit<Toast, 'id'>) {
  const normalized = normalizeToast(input);
  const options: ToastOptions = {
    autoClose: normalized.duration && normalized.duration > 0 ? normalized.duration : false,
    position: 'top-right',
  };
  const content = normalized.message ? `${normalized.title}: ${normalized.message}` : normalized.title;
  toastify(content, { ...options, type: normalized.type as TypeOptions });
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const recentToastRef = useRef<{ key: string; time: number } | null>(null);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    const normalized = normalizeToast(toast);
    const key = `${normalized.type}:${normalized.title}:${normalized.message}`;
    const now = Date.now();
    if (recentToastRef.current?.key === key && now - recentToastRef.current.time < 1200) return;
    recentToastRef.current = { key, time: now };
    showReactToast(normalized);
  };

  const removeToast = (id: string) => {
    toastify.dismiss(id);
  };

  useEffect(() => {
    window.appToast = (toast) => addToast(toast);
    window.Swal = {
      fire: async (options: any) => {
        const normalized = normalizeToast(options);
        addToast(normalized);
        if (options?.showCancelButton || options?.confirmButtonText || options?.cancelButtonText) {
          return { isConfirmed: true, isDismissed: false, value: true };
        }
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
    <ToastContext.Provider value={{ toasts: [], addToast, removeToast }}>
      {children}
      <ToastContainer newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
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
