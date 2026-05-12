'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppLayout } from './AppLayout';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const platformAdmin = user && ['admin', 'super_admin'].includes(user.role);
  const schoolInactive = !!user?.institution && user.institution.isActive === false;

  React.useEffect(() => {
    if (!isLoading && user?.role === 'head' && schoolInactive && pathname !== '/billing') {
      router.replace('/billing');
    }
  }, [isLoading, pathname, router, schoolInactive, user?.role]);

  if (!isLoading && user && !platformAdmin && schoolInactive && user.role !== 'head') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
        <p className="text-xl font-semibold text-slate-900">আপনার প্রতিষ্ঠান প্রধানের সাথে যোগাযোগ করুন।</p>
      </main>
    );
  }

  if (!isLoading && user?.role === 'head' && schoolInactive && pathname !== '/billing') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
        <p className="text-xl font-semibold text-slate-900">আপনার অনুমতি নেই, আগে বিল পরিশোধ করুন।</p>
      </main>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
