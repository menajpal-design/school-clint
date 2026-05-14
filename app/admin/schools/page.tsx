'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, CreditCard, Search, ShieldCheck, X } from 'lucide-react';
import { api } from '@/lib/api';
import { calculatePlanDue, schoolPlans } from '@/lib/plans';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const money = (value: any) => `BDT ${Number(value || 0).toLocaleString()}`;

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [status, setStatus] = useState('');

  const load = () => api.admin.schools(search ? { search } : undefined).then((data: any) => setSchools(data.schools || []));
  useEffect(() => { load().catch(() => setSchools([])); }, []);

  const due = useMemo(() => calculatePlanDue(form.planCode, form.billingCycle, form.useEasySchoolStorage), [form]);

  const openBilling = (school: any) => {
    const billing = school.billing || {};
    setSelected(school);
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

  const saveBilling = async () => {
    if (!selected) return;
    setStatus('Saving...');
    await api.admin.updateSchool(selected._id, { billing: form, isActive: ['active', 'expired'].includes(form.billingStatus) || selected.isActive });
    setStatus('Saved.');
    setSelected(null);
    await load();
  };

  const quickStatus = async (school: any, action: 'activate' | 'suspend') => {
    await api.admin.updateSchool(school._id, { statusAction: action });
    await load();
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">School Manage</h1>
          <p className="mt-1 text-sm text-muted-foreground">Suspend schools, activate subscriptions, record payments and dues.</p>
        </div>
        <div className="flex gap-2">
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school" />
          <Button onClick={() => load()}><Search className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4">
        {schools.map((school) => (
          <Card key={school._id} className="overflow-hidden border-slate-200">
            <CardContent className="p-0">
              <div className="grid gap-4 p-4 lg:grid-cols-[1.3fr_1fr_auto] lg:items-center">
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted"><Building2 className="h-5 w-5" /></div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{school.name}</h2>
                      <Badge variant={school.isActive ? 'default' : 'secondary'}>{school.isActive ? 'Active' : 'Suspended/Pending'}</Badge>
                      <Badge variant="outline">{school.billing?.billingStatus || 'pending'}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{school.email} · {school.phone}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{school.counts?.students || 0} students · {school.counts?.users || 0} users</p>
                  </div>
                </div>
                <div className="rounded-md border bg-popover p-3 text-sm">
                  <div className="font-medium">{school.billing?.planName || 'No plan'}</div>
                  <div className="text-muted-foreground">{school.billing?.billingCycle || 'monthly'} · {money(school.billing?.dueAmount)} due · paid {money(school.billing?.receivedAmount)}</div>
                  <div className="text-muted-foreground">SMS {Number(school.billing?.smsUsed || 0).toLocaleString()}/{Number(school.billing?.monthlySmsLimit || 0).toLocaleString()} · Exp {school.billing?.subscriptionExpiresAt ? new Date(school.billing.subscriptionExpiresAt).toLocaleDateString() : 'N/A'}</div>
                  <div className="text-muted-foreground">TrxID {school.billing?.paymentTrxId || 'N/A'} · Sender {school.billing?.paymentSenderNumber || 'N/A'}</div>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline" onClick={() => openBilling(school)}><CreditCard className="mr-2 h-4 w-4" />Subscription</Button>
                  <Button variant={school.isActive ? 'destructive' : 'default'} onClick={() => quickStatus(school, school.isActive ? 'suspend' : 'activate')}>
                    {school.isActive ? <X className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    {school.isActive ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription and Payment</DialogTitle>
            <DialogDescription>{selected?.name} payment, due and activation settings.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Plan</label>
              <Select value={form.planCode} onValueChange={(v) => setForm((f: any) => ({ ...f, planCode: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{schoolPlans.map((p) => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Subscription</label>
              <Select value={form.billingCycle} onValueChange={(v) => setForm((f: any) => ({ ...f, billingCycle: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Storage</label>
              <Select value={String(form.useEasySchoolStorage)} onValueChange={(v) => setForm((f: any) => ({ ...f, useEasySchoolStorage: v === 'true' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="true">EASY SCHOOL storage</SelectItem><SelectItem value="false">Own MongoDB + ImgBB</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Permission</label>
              <Select value={form.billingStatus} onValueChange={(v) => setForm((f: any) => ({ ...f, billingStatus: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Paid and active</SelectItem>
                  <SelectItem value="pending">Due and inactive</SelectItem>
                  <SelectItem value="expired">Overdue but active</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Paid amount" type="number" value={form.receivedAmount} onChange={(e) => setForm((f: any) => ({ ...f, receivedAmount: e.target.value }))} />
            <Input placeholder="Gateway" value={form.paymentGateway} onChange={(e) => setForm((f: any) => ({ ...f, paymentGateway: e.target.value }))} />
            <Input placeholder="Transaction ID" value={form.paymentTrxId} onChange={(e) => setForm((f: any) => ({ ...f, paymentTrxId: e.target.value }))} />
            <Input placeholder="Sender number" value={form.paymentSenderNumber} onChange={(e) => setForm((f: any) => ({ ...f, paymentSenderNumber: e.target.value }))} />
            <div className="md:col-span-2 rounded-lg border bg-slate-50 p-4 text-sm">
              Due: {money(due.baseAmount)} + storage {money(due.storageAmount)} = <span className="font-semibold">{money(due.total)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{status}</p>
            <Button onClick={saveBilling}>Save and Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
