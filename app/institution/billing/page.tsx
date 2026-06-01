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
"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';

export default function BillingPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/finance')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <RoleGuard roles={["head", "assistant_head"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Billing Management</h1>
        <p className="text-sm text-muted-foreground">Manage fees, collections, and view summaries.</p>
        {loading && <div>Loading...</div>}
        {data && (
          <div className="space-y-3">
            <div>Total Collections: {data.summary?.totalCollection}</div>
            <div>Total Due: {data.summary?.totalDue}</div>
            <div>Monthly Salary: {data.summary?.monthlySalary}</div>
            <div className="flex gap-2 mt-2">
              <Button onClick={() => window.location.assign('/api/finance/audit/export?format=csv')}>Download CSV</Button>
              <Button onClick={() => window.location.assign('/api/finance/audit/export?format=pdf')}>Download PDF</Button>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
