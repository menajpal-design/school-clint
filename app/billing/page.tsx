'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditCard, Loader2, LogOut } from 'lucide-react';
import { api } from '@/lib/api';
import { authManager } from '@/lib/auth';
import { calculatePlanDue, schoolPlans } from '@/lib/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function BillingPage() {
  const router = useRouter();
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    planCode: 'students_100',
    billingCycle: 'monthly',
    useEasySchoolStorage: true,
    receivedAmount: '',
    paymentGateway: 'bkash',
    paymentTrxId: '',
    paymentSenderNumber: '',
  });

  const logout = () => {
    authManager.clear();
    router.replace('/login');
  };

  useEffect(() => {
    const user = authManager.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!['head', 'admin', 'super_admin'].includes(user.role)) {
      setLoading(false);
      return;
    }
    api.institution.profile()
      .then((data: any) => {
        const item = data.institution || {};
        const billing = item.billing || {};
        setInstitution(item);
        setForm({
          planCode: billing.planCode || 'students_100',
          billingCycle: billing.billingCycle || 'monthly',
          useEasySchoolStorage: billing.useEasySchoolStorage !== false,
          receivedAmount: billing.receivedAmount ? String(billing.receivedAmount) : '',
          paymentGateway: billing.paymentGateway || 'bkash',
          paymentTrxId: billing.paymentTrxId || '',
          paymentSenderNumber: billing.paymentSenderNumber || '',
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  const due = useMemo(
    () => calculatePlanDue(form.planCode, form.billingCycle as 'monthly' | 'yearly', form.useEasySchoolStorage),
    [form]
  );

  const submitPayment = async () => {
    setStatus('Submitting payment...');
    try {
      const response = await api.institution.recordPayment({
        ...form,
        receivedAmount: Number(form.receivedAmount || due.total),
      }) as any;
      setInstitution(response.institution);
      setStatus(response.message || 'Payment submitted. Admin will verify and activate your school.');
    } catch (error: any) {
      setStatus(error?.message || 'Payment submit failed.');
    }
  };

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-6 w-6 animate-spin" /></main>;
  }

  const user = authManager.getUser();
  if (user && !['head', 'admin', 'super_admin'].includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white p-6 text-center">
        <div className="space-y-4">
          <p className="text-xl font-semibold">আপনার প্রতিষ্ঠান প্রধানের সাথে যোগাযোগ করুন।</p>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Billing Required</h1>
            <p className="mt-2 text-sm text-slate-600">আপনার অনুমতি নেই, আগে বিল পরিশোধ করুন। Admin payment verify করলে school active হবে।</p>
          </div>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Logout</Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pay School Bill</CardTitle>
              <CardDescription>Send payment to bKash 0179007328, then submit TrxID and sender number.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Plan</label>
                <Select value={form.planCode} onValueChange={(value) => setForm((prev) => ({ ...prev, planCode: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schoolPlans.map((plan) => <SelectItem key={plan.code} value={plan.code}>{plan.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Billing Cycle</label>
                <Select value={form.billingCycle} onValueChange={(value) => setForm((prev) => ({ ...prev, billingCycle: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Storage</label>
                <Select value={String(form.useEasySchoolStorage)} onValueChange={(value) => setForm((prev) => ({ ...prev, useEasySchoolStorage: value === 'true' }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">EASY SCHOOL storage - BDT 100/month</SelectItem>
                    <SelectItem value="false">Own MongoDB + ImgBB - no cost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Input placeholder="Paid amount" type="number" value={form.receivedAmount} onChange={(event) => setForm((prev) => ({ ...prev, receivedAmount: event.target.value }))} />
              <Input placeholder="Transaction ID" value={form.paymentTrxId} onChange={(event) => setForm((prev) => ({ ...prev, paymentTrxId: event.target.value }))} />
              <Input placeholder="Sender number" value={form.paymentSenderNumber} onChange={(event) => setForm((prev) => ({ ...prev, paymentSenderNumber: event.target.value }))} />
              <div className="rounded-lg border bg-white p-4 text-sm md:col-span-2">
                Due amount: BDT {due.baseAmount.toLocaleString()} + storage BDT {due.storageAmount.toLocaleString()} = <span className="font-semibold">BDT {due.total.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-3 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-600">{status}</p>
                <Button onClick={submitPayment}>Pay / Submit Payment</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{institution?.name || 'School'}</CardTitle>
              <CardDescription>Current billing status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border p-3"><span className="text-slate-500">Status</span><div className="font-semibold">{institution?.isActive ? 'Active' : 'Pending / Inactive'}</div></div>
              <div className="rounded-md border p-3"><span className="text-slate-500">Billing</span><div className="font-semibold">{institution?.billing?.billingStatus || 'pending'}</div></div>
              <div className="rounded-md border p-3"><span className="text-slate-500">Paid</span><div className="font-semibold">BDT {Number(institution?.billing?.receivedAmount || 0).toLocaleString()}</div></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
