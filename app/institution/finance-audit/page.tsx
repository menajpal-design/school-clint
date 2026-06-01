"use client";

import { useEffect, useMemo, useState } from 'react';
import RoleGuard from '@/components/RoleGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Download, FileText, RefreshCcw, ShieldCheck, Sparkles, Wallet, Banknote, Receipt, ArrowUpRight } from 'lucide-react';

type AuditReport = {
  totals?: {
    totalIncome?: number;
    totalFees?: number;
    totalSalaries?: number;
    totalSms?: number;
  };
  counts?: {
    payments?: number;
    salaries?: number;
    smsTopups?: number;
    fees?: number;
  };
  items?: {
    payments?: any[];
    salaries?: any[];
    smsTopups?: any[];
    fees?: any[];
  };
};

const money = (value: any) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
const humanDate = (value: any) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const toIsoDate = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : '';

export default function FinanceAuditPage() {
  const [report, setReport] = useState<AuditReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [range, setRange] = useState({ start: '', end: '' });

  const queryString = useMemo(() => {
    const qs = new URLSearchParams();
    if (range.start) qs.set('start', range.start);
    if (range.end) qs.set('end', range.end);
    return qs.toString();
  }, [range.start, range.end]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/finance/audit${queryString ? `?${queryString}` : ''}`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Unable to load finance audit');
      setReport(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load finance audit');
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportReport = (format: 'csv' | 'pdf') => {
    window.location.assign(`/api/finance/audit/export?format=${format}${queryString ? `&${queryString}` : ''}`);
  };

  const items = useMemo(() => {
    const combined = [
      ...(report?.items?.payments || []).map((item) => ({ ...item, type: 'Payment', date: item.paymentDate, amount: item.amount || 0, label: item.receiptNumber || item._id, meta: item.notes || 'Tuition or collection payment' })),
      ...(report?.items?.salaries || []).map((item) => ({ ...item, type: 'Salary', date: item.paymentDate, amount: item.netSalary || item.net || 0, label: item.employeeId || item._id, meta: item.notes || 'Payroll disbursement' })),
      ...(report?.items?.smsTopups || []).map((item) => ({ ...item, type: 'SMS Top-up', date: item.createdAt, amount: item.amount || 0, label: item._id, meta: item.meta?.provider || 'SMS credit purchase' })),
      ...(report?.items?.fees || []).map((item) => ({ ...item, type: 'Fee', date: item.createdAt, amount: item.amount || 0, label: item._id, meta: item.description || 'Recorded fee' })),
    ];

    return combined
      .sort((a, b) => +new Date(b.date || 0) - +new Date(a.date || 0))
      .slice(0, 12);
  }, [report]);

  const totalCards = [
    { title: 'Total Income', value: money(report?.totals?.totalIncome), icon: Wallet, tone: 'from-emerald-500 to-emerald-700' },
    { title: 'Total Fees', value: money(report?.totals?.totalFees), icon: Receipt, tone: 'from-sky-500 to-sky-700' },
    { title: 'Total Salaries', value: money(report?.totals?.totalSalaries), icon: Banknote, tone: 'from-amber-500 to-amber-700' },
    { title: 'Total SMS Top-ups', value: money(report?.totals?.totalSms), icon: Sparkles, tone: 'from-violet-500 to-violet-700' },
  ];

  return (
    <RoleGuard roles={["head", "assistant_head"]}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_100%)] text-slate-900">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/75 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Head and assistant head only
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Finance Audit</h1>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    Review collections, fees, payroll, and SMS spending in one place. Filter any date range and export the audit as CSV or PDF for reporting.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button onClick={load} disabled={loading} className="gap-2 rounded-xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800">
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Refreshing' : 'Refresh audit'}
                  </Button>
                  <Button variant="outline" onClick={() => exportReport('csv')} className="gap-2 rounded-xl border-slate-200 bg-white px-5 hover:bg-slate-50">
                    <Download className="h-4 w-4" /> Export CSV
                  </Button>
                  <Button variant="outline" onClick={() => exportReport('pdf')} className="gap-2 rounded-xl border-slate-200 bg-white px-5 hover:bg-slate-50">
                    <FileText className="h-4 w-4" /> Export PDF
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/20">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <CalendarDays className="h-4 w-4" /> Date range
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Start date
                    <input
                      type="date"
                      value={range.start}
                      onChange={(e) => setRange((current) => ({ ...current, start: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-white/30"
                    />
                  </label>
                  <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    End date
                    <input
                      type="date"
                      value={range.end}
                      onChange={(e) => setRange((current) => ({ ...current, end: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-slate-400 focus:border-white/30"
                    />
                  </label>
                </div>
                <div className="mt-4 flex gap-3">
                  <Button onClick={load} className="rounded-xl bg-emerald-500 px-5 text-white hover:bg-emerald-400">
                    Apply range
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setRange({ start: '', end: '' })}
                    className="rounded-xl text-slate-200 hover:bg-white/10 hover:text-white"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {totalCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="overflow-hidden border-white/70 bg-white/85 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.6)] backdrop-blur">
                  <div className={`h-1 bg-gradient-to-r ${card.tone}`} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">{card.title}</p>
                        <div className="mt-2 text-2xl font-black tracking-tight text-slate-950">{card.value}</div>
                      </div>
                      <div className={`rounded-2xl bg-gradient-to-br ${card.tone} p-3 text-white shadow-lg`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="border-white/70 bg-white/85 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.55)] backdrop-blur">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <ArrowUpRight className="h-5 w-5 text-emerald-600" /> Recent activity
                </CardTitle>
                <CardDescription>Latest financial entries from the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-6 text-sm text-slate-500">Loading finance audit...</div>
                ) : items.length === 0 ? (
                  <div className="p-6 text-sm text-slate-500">No records found for the selected date range.</div>
                ) : (
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-[120px_1.2fr_1fr_110px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <div>Type</div>
                      <div>Reference</div>
                      <div>Description</div>
                      <div className="text-right">Amount</div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.map((item, index) => (
                        <div key={`${item.type}-${item.label}-${index}`} className="grid grid-cols-[120px_1.2fr_1fr_110px] gap-4 px-5 py-4 text-sm">
                          <div>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.type}</span>
                            <div className="mt-2 text-xs text-slate-400">{humanDate(item.date)}</div>
                          </div>
                          <div className="font-medium text-slate-950">{item.label || '—'}</div>
                          <div className="text-slate-600">{item.meta || '—'}</div>
                          <div className="text-right font-semibold text-slate-950">{money(item.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/70 bg-white/85 shadow-[0_18px_55px_-35px_rgba(15,23,42,0.55)] backdrop-blur">
              <CardHeader className="border-b border-slate-100 pb-4">
                <CardTitle className="text-lg text-slate-950">Activity summary</CardTitle>
                <CardDescription>Counts for the selected period.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <SummaryRow label="Payments" value={report?.counts?.payments || 0} />
                <SummaryRow label="Fees" value={report?.counts?.fees || 0} />
                <SummaryRow label="Salaries" value={report?.counts?.salaries || 0} />
                <SummaryRow label="SMS top-ups" value={report?.counts?.smsTopups || 0} />

                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Use the date filters to narrow the audit, then export a CSV or PDF for records or accounting review.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <span className="text-base font-black text-slate-950">{value}</span>
    </div>
  );
}
