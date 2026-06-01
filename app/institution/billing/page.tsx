"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InstitutionBillingRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to the main billing page so sidebar/link works
    router.replace('/billing');
  }, [router]);

  return null;
}
