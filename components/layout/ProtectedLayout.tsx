'use client';

import React from 'react';
import { AppLayout } from './AppLayout';

export function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
