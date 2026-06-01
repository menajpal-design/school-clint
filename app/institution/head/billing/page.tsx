"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import RoleGuard from '@/components/RoleGuard';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

export default function HeadBillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const res: any = await api.institution.profile();
        setInstitution(res.institution || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleManage = () => router.push('/billing');

  const requestCancel = async () => {
    if (!institution) return;
    setStatus('Requesting cancellation...');
    try {
      const updated = await api.institution.updateProfile({ settings: { cancellationRequested: true } });
      setInstitution(updated.institution || institution);
      setStatus('Cancellation request recorded. Admin will review.');
    } catch (err: any) {
      setStatus(err?.message || 'Failed to request cancellation.');
    }
  };

  return (
    <RoleGuard roles={["head"]}>
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Billing (Head)</CardTitle>
            <CardDescription>View subscription and manage billing for your institution.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <div>Loading...</div> : (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <div><strong>Plan:</strong> {institution?.billing?.planName || 'No plan'}</div>
                  <div><strong>Cycle:</strong> {institution?.billing?.billingCycle || 'monthly'}</div>
                  <div><strong>Status:</strong> {institution?.billing?.billingStatus || 'pending'}</div>
                  <div><strong>Due:</strong> {formatCurrency(Number(institution?.billing?.dueAmount || 0))}</div>
                  <div><strong>Received:</strong> {formatCurrency(Number(institution?.billing?.receivedAmount || 0))}</div>
                  <div><strong>SMS Balance:</strong> {Number(institution?.billing?.smsBalance || 0)}</div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleManage}>Manage Billing</Button>
                  <Button variant="destructive" onClick={requestCancel}>Request Cancellation</Button>
                </div>

                {status ? <div className="text-sm text-muted-foreground">{status}</div> : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
