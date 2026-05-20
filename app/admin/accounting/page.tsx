'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calculator, CreditCard, Download, RefreshCcw, Search, WalletCards } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const money = (value: any) => formatCurrency(Number(value || 0));
const dateText = (value: any) => value ? new Date(value).toLocaleDateString() : 'N/A';

export default function AdminAccountingPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [cycle, setCycle] = useState('all');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data: any = await api.admin.accounting({ search, status, cycle });
      setRows(data.rows || []);
      setSummary(data.summary || {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const csv = useMemo(() => {
    const header = ['School', 'Email', 'Phone', 'Plan', 'Cycle', 'Status', 'Due', 'Received', 'Balance', 'Transaction ID', 'Sender Number', 'Received At', 'Expires At'];
    const body = rows.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.planName,
      row.billingCycle,
      row.billingStatus,
      row.dueAmount,
      row.receivedAmount,
      row.balanceAmount,
      row.paymentTrxId,
      row.paymentSenderNumber,
      row.receivedAt ? new Date(row.receivedAt).toISOString() : '',
      row.subscriptionExpiresAt ? new Date(row.subscriptionExpiresAt).toISOString() : '',
    ]);
    return [header, ...body].map((line) => line.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  }, [rows]);

  const downloadCsv = () => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `admin-accounting-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Accounting</h1>
          <p className="mt-1 text-sm text-muted-foreground">All school subscription due, received amount, balance and payment reference in one place.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search school" />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cycle} onValueChange={setCycle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cycle</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={load} disabled={loading}><Search className="mr-2 h-4 w-4" />{loading ? 'Loading' : 'Filter'}</Button>
          <Button variant="outline" onClick={downloadCsv} disabled={!rows.length}><Download className="mr-2 h-4 w-4" />CSV</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          ['Schools', summary.totalSchools || 0, Calculator],
          ['Active', summary.activeSchools || 0, RefreshCcw],
          ['Blocked', summary.blockedSchools || 0, RefreshCcw],
          ['Total Due', money(summary.totalDue), CreditCard],
          ['Received', money(summary.totalReceived), WalletCards],
          ['Balance', money(summary.totalBalance), CreditCard],
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

      <Card>
        <CardHeader>
          <CardTitle>School Accounting Ledger</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-3 pr-3">School</th>
                <th className="py-3 pr-3">Plan</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3 text-right">Due</th>
                <th className="py-3 pr-3 text-right">Received</th>
                <th className="py-3 pr-3 text-right">Balance</th>
                <th className="py-3 pr-3">Payment</th>
                <th className="py-3 pr-3">Dates</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b align-top hover:bg-muted/30">
                  <td className="py-3 pr-3">
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-muted-foreground">{row.email} · {row.phone}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div>{row.planName}</div>
                    <div className="text-xs capitalize text-muted-foreground">{row.billingCycle}</div>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={row.isActive ? 'default' : 'secondary'}>{row.isActive ? 'Access' : 'Blocked'}</Badge>
                      <Badge variant="outline">{row.billingStatus}</Badge>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-right font-medium">{money(row.dueAmount)}</td>
                  <td className="py-3 pr-3 text-right font-medium text-emerald-700">{money(row.receivedAmount)}</td>
                  <td className="py-3 pr-3 text-right font-semibold text-amber-700">{money(row.balanceAmount)}</td>
                  <td className="py-3 pr-3">
                    <div>{row.paymentGateway || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">TRX: {row.paymentTrxId || 'N/A'}</div>
                    <div className="text-xs text-muted-foreground">Sender: {row.paymentSenderNumber || 'N/A'}</div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">
                    <div>Paid: {dateText(row.receivedAt)}</div>
                    <div>Expire: {dateText(row.subscriptionExpiresAt)}</div>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No accounting data found.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
