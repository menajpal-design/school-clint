'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CreditCard, Search, ShieldAlert, WalletCards } from 'lucide-react';
import { api } from '@/lib/api';
import { calculatePlanDue, schoolPlans } from '@/lib/plans';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const money = (value: any) => `BDT ${Number(value || 0).toLocaleString()}`;

const statusLabels: Record<string, string> = {
  active: 'Paid and active',
  pending: 'Due and inactive',
  expired: 'Overdue but active',
  cancelled: 'Cancelled',
};

export default function AdminSubscriptionsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState('');

  const load = () => {
    const params: any = {};
    if (search) params.search = search;
    return api.admin.schools(params).then((data: any) => setSchools(data.schools || []));
  };

  useEffect(() => {
    load().catch(() => setSchools([]));
  }, []);

  const filteredSchools = useMemo(() => {
    if (statusFilter === 'all') return schools;
    return schools.filter((school) => (school.billing?.billingStatus || 'pending') === statusFilter);
  }, [schools, statusFilter]);

  const totals = useMemo(() => ({
    active: schools.filter((school) => school.billing?.billingStatus === 'active').length,
    pending: schools.filter((school) => (school.billing?.billingStatus || 'pending') === 'pending').length,
    expired: schools.filter((school) => school.billing?.billingStatus === 'expired').length,
    due: schools.reduce((sum, school) => sum + Number(school.billing?.dueAmount || 0), 0),
    paid: schools.reduce((sum, school) => sum + Number(school.billing?.receivedAmount || 0), 0),
  }), [schools]);

  const due = useMemo(() => calculatePlanDue(form.planCode, form.billingCycle, form.useEasySchoolStorage), [form]);

  const openSubscription = (school: any) => {
    const billing = school.billing || {};
    setSelected(school);
    setMessage('');
    setForm({
      planCode: billing.planCode || 'students_100',
      billingCycle: billing.billingCycle || 'monthly',
      useEasySchoolStorage: billing.useEasySchoolStorage !== false,
      billingStatus: billing.billingStatus || 'pending',
      receivedAmount: billing.receivedAmount || '',
      paymentGateway: billing.paymentGateway || 'bkash',
      paymentTrxId: billing.paymentTrxId || '',
      paymentSenderNumber: billing.paymentSenderNumber || '',
    });
  };

  const saveSubscription = async () => {
    if (!selected) return;
    setMessage('Saving subscription...');
    await api.admin.updateSchool(selected._id, {
      billing: form,
      isActive: ['active', 'expired'].includes(form.billingStatus) || selected.isActive,
    });
    setSelected(null);
    setMessage('');
    await load();
  };

  const setSchoolStatus = async (school: any, action: 'activate' | 'suspend') => {
    await api.admin.updateSchool(school._id, { statusAction: action });
    await load();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Handle school plan, paid amount, due amount, SMS limit and access status.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search school" />
          <Button onClick={() => load()}><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Active', totals.active, CheckCircle2],
          ['Pending', totals.pending, ShieldAlert],
          ['Expired', totals.expired, ShieldAlert],
          ['Total Due', money(totals.due), CreditCard],
          ['Received', money(totals.paid), WalletCards],
        ].map(([label, value, Icon]: any) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredSchools.map((school) => (
          <Card key={school._id} className="border-slate-200">
            <CardContent className="grid gap-4 p-4 xl:grid-cols-[1.2fr_1fr_auto] xl:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{school.name}</h2>
                  <Badge variant={school.isActive ? 'default' : 'secondary'}>{school.isActive ? 'School active' : 'School blocked'}</Badge>
                  <Badge variant="outline">{statusLabels[school.billing?.billingStatus || 'pending'] || 'Pending'}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{school.email} · {school.phone}</p>
                <p className="mt-1 text-xs text-muted-foreground">{school.counts?.students || 0} students · {school.counts?.users || 0} users</p>
              </div>
              <div className="grid gap-1 rounded-md border bg-slate-50 p-3 text-sm">
                <div className="font-medium">{school.billing?.planName || 'No plan'} · {school.billing?.billingCycle || 'monthly'}</div>
                <div className="text-muted-foreground">Due {money(school.billing?.dueAmount)} · Paid {money(school.billing?.receivedAmount)}</div>
                <div className="text-muted-foreground">SMS {Number(school.billing?.smsUsed || 0).toLocaleString()}/{Number(school.billing?.monthlySmsLimit || 0).toLocaleString()}</div>
                <div className="text-muted-foreground">Expires {school.billing?.subscriptionExpiresAt ? new Date(school.billing.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                <Button onClick={() => openSubscription(school)}><CreditCard className="mr-2 h-4 w-4" />Handle</Button>
                <Button variant={school.isActive ? 'destructive' : 'secondary'} onClick={() => setSchoolStatus(school, school.isActive ? 'suspend' : 'activate')}>
                  {school.isActive ? 'Suspend' : 'Give Access'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Handle Subscription</DialogTitle>
            <DialogDescription>{selected?.name} plan, paid money, due and access permission.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              <span>Plan</span>
              <Select value={form.planCode} onValueChange={(value) => setForm((current: any) => ({ ...current, planCode: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{schoolPlans.map((plan) => <SelectItem key={plan.code} value={plan.code}>{plan.name}</SelectItem>)}</SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Subscription cycle</span>
              <Select value={form.billingCycle} onValueChange={(value) => setForm((current: any) => ({ ...current, billingCycle: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Storage</span>
              <Select value={String(form.useEasySchoolStorage)} onValueChange={(value) => setForm((current: any) => ({ ...current, useEasySchoolStorage: value === 'true' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">EASY SCHOOL storage</SelectItem><SelectItem value="false">Own MongoDB + ImgBB</SelectItem></SelectContent>
              </Select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              <span>Permission status</span>
              <Select value={form.billingStatus} onValueChange={(value) => setForm((current: any) => ({ ...current, billingStatus: value }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Paid and active</SelectItem>
                  <SelectItem value="pending">Due and inactive</SelectItem>
                  <SelectItem value="expired">Overdue but active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <Input placeholder="Paid amount" type="number" value={form.receivedAmount} onChange={(event) => setForm((current: any) => ({ ...current, receivedAmount: event.target.value }))} />
            <Input placeholder="Gateway" value={form.paymentGateway} onChange={(event) => setForm((current: any) => ({ ...current, paymentGateway: event.target.value }))} />
            <Input placeholder="Transaction ID" value={form.paymentTrxId} onChange={(event) => setForm((current: any) => ({ ...current, paymentTrxId: event.target.value }))} />
            <Input placeholder="Sender number" value={form.paymentSenderNumber} onChange={(event) => setForm((current: any) => ({ ...current, paymentSenderNumber: event.target.value }))} />
            <div className="md:col-span-2 rounded-lg border bg-slate-50 p-4 text-sm">
              Due: {money(due.baseAmount)} + storage {money(due.storageAmount)} = <span className="font-semibold">{money(due.total)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">{message}</p>
            <Button onClick={saveSubscription}>Save and Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
