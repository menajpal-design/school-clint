"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Landmark, RefreshCw, WalletCards } from "lucide-react";

import { LineChartCard } from "@/components/charts/LineChartCard";
import { FinancePeriodFilter, defaultFinancePeriod, getFinancePeriodRange, isWithinFinancePeriod } from "@/components/finance/FinancePeriodFilter";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FinancePage() {
  const [summary, setSummary] = useState<any>({});
  const [reports, setReports] = useState<any>({ collections: [], dues: [], salaries: [], trend: [], byType: [], summary: {} });
  const [period, setPeriod] = useState(defaultFinancePeriod());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const range = getFinancePeriodRange(period);
      const data = await api.finance.reports({ startDate: range.startDate, endDate: range.endDate }) as any;
      const nextReports = data?.reports || {};
      const nextSummary = nextReports.summary || {};
      const today = new Date().toISOString().slice(0, 10);
      const collections = Array.isArray(nextReports.collections) ? nextReports.collections : [];
      const todayCollection = collections.filter((p: any) => String(p.paymentDate || p.paidAt || p.createdAt || "").slice(0, 10) === today).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const salaryTotal = Number(nextSummary.totalSalary || 0);
      setReports({ collections, dues: nextReports.dues || [], salaries: nextReports.salaries || [], trend: nextReports.trend || [], byType: nextReports.byType || [], summary: nextSummary });
      setSummary({
        totalCollection: Number(nextSummary.totalCollection || 0),
        totalDue: Number(nextSummary.totalDue || 0),
        todayCollection,
        monthlySalary: salaryTotal,
        pendingPayments: Number(nextSummary.dueCount || 0),
        monthlyTrend: nextReports.trend || [],
        recentPayments: collections,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load finance dashboard.");
      setReports({ collections: [], dues: [], salaries: [], trend: [], byType: [], summary: {} });
      setSummary({ totalCollection: 0, totalDue: 0, todayCollection: 0, monthlySalary: 0, pendingPayments: 0, monthlyTrend: [], recentPayments: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const payments = useMemo(() => (summary.recentPayments || []).filter((p: any) => isWithinFinancePeriod(p.paymentDate || p.paidAt || p.createdAt, period)), [summary.recentPayments, period]);
  const filteredCollection = payments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Finance Dashboard"
        description="Collections, dues, salaries and recent payment activity. This overview uses the same verified finance reports API as reports page."
        icon={Landmark}
        actions={[
          { label: loading ? "Refreshing..." : "Refresh", icon: RefreshCw, onClick: load },
          { label: "Head Salary Setup", href: "/finance/salary", active: true },
        ]}
      />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <FinancePeriodFilter period={period} onChange={setPeriod} onApply={load} />
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Filtered Collection" value={formatCurrency(filteredCollection || 0)} icon={WalletCards} tone="emerald" />
        <StatCard label="Total Due" value={formatCurrency(summary.totalDue || 0)} icon={CreditCard} tone="rose" />
        <StatCard label="Today Collection" value={formatCurrency(summary.todayCollection || 0)} icon={WalletCards} tone="blue" />
        <StatCard label="Salary" value={formatCurrency(summary.monthlySalary || 0)} icon={Landmark} tone="amber" />
        <StatCard label="Due Items" value={summary.pendingPayments || 0} icon={CreditCard} />
      </div>
      <LineChartCard title="Collection trend" data={summary.monthlyTrend || []} />
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b p-4">
          <h2 className="font-semibold">Recent Collections</h2>
          <p className="text-sm text-muted-foreground">Old fee payments and monthly invoice payments are shown together.</p>
        </div>
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
          {loading ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-slate-500">Loading recent payments...</TableCell></TableRow> : payments.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-slate-500">No payments found for selected period.</TableCell></TableRow> : payments.map((p: any) => <TableRow key={p._id || p.receiptNumber || p.receiptNo}><TableCell>{p.receiptNumber || p.receiptNo || "-"}</TableCell><TableCell>{p.studentId?.userId?.name || p.studentId?.rollNumber || "-"}</TableCell><TableCell>{formatCurrency(p.amount || 0)}</TableCell><TableCell className="capitalize">{p.paymentMethod || "-"}</TableCell><TableCell>{formatDate(p.paymentDate || p.paidAt || p.createdAt)}</TableCell></TableRow>)}
        </TableBody></Table>
      </section>
    </div>
  );
}
