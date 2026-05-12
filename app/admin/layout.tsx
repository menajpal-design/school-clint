'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useAuth } from '@/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const canAccess = !!user && ['admin', 'super_admin'].includes(user.role);

  useEffect(() => {
    if (!isLoading && !canAccess) router.replace('/dashboard');
  }, [canAccess, isLoading, router]);

  if (isLoading || !canAccess) return <ProtectedLayout><div /></ProtectedLayout>;
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
