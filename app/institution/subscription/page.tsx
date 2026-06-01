"use client";

import React, { useEffect, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';

export default function SubscriptionPage() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/institution/billing/subscription');
      const data = await res.json();
      setBilling(data.billing);
    } catch (e) {
      setBilling(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async () => {
    if (!confirm('Confirm cancel subscription? This will deactivate the school.')) return;
    const res = await fetch('/api/institution/billing/cancel', { method: 'POST' });
    if (res.ok) { alert('Subscription cancelled'); load(); } else { alert('Cancel failed'); }
  };

  return (
    <RoleGuard roles={["head", "assistant_head"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Subscription</h1>
        {loading && <div>Loading...</div>}
        {!loading && !billing && <div>No subscription data available.</div>}
        {billing && (
          <div className="space-y-2">
            <div>Plan: {billing.planName} ({billing.planCode})</div>
            <div>Cycle: {billing.billingCycle}</div>
            <div>Due Amount: {billing.dueAmount}</div>
            <div>Billing Status: {billing.billingStatus}</div>
            <div>Subscription Expires: {billing.subscriptionExpiresAt ? new Date(billing.subscriptionExpiresAt).toLocaleString() : 'N/A'}</div>
            <div className="flex gap-2 mt-3">
              <Button onClick={() => window.location.assign('/institution/billing')}>Change/Upgrade Plan</Button>
              <Button variant="destructive" onClick={cancel}>Cancel Subscription</Button>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
