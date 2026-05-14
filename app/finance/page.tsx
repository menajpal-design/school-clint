"use client";

import { useEffect, useState } from "react";
import { CreditCard, Landmark, WalletCards } from "lucide-react";

import { LineChartCard } from "@/components/charts/LineChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FinancePage() {
  const [summary, setSummary] = useState<any>({});

  useEffect(() => {
    api.finance.dashboard().then((data: any) => setSummary(data.summary || {})).catch(() => undefined);
    api.dashboard.feeOverview().catch(() => undefined);
  }, []);

  const payments = summary.recentPayments || [];

  return (
    <div className="space-y-5">
      <PageHeader title="Finance Dashboard" description="Collections, dues, salaries and recent payment activity." icon={Landmark} />
      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total Collection" value={formatCurrency(summary.totalCollection || 0)} icon={WalletCards} tone="emerald" />
        <StatCard label="Total Due" value={formatCurrency(summary.totalDue || 0)} icon={CreditCard} tone="rose" />
        <StatCard label="Today Collection" value={formatCurrency(summary.todayCollection || 0)} icon={WalletCards} tone="blue" />
        <StatCard label="Monthly Salary" value={formatCurrency(summary.monthlySalary || 0)} icon={Landmark} tone="amber" />
        <StatCard label="Pending Payments" value={summary.pendingPayments || 0} icon={CreditCard} />
      </div>
      <LineChartCard title="Monthly collection trend" data={summary.monthlyTrend || []} />
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead></TableRow></TableHeader><TableBody>
          {payments.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-slate-500">No recent payments.</TableCell></TableRow> : payments.map((p: any) => <TableRow key={p._id}><TableCell>{p.receiptNumber}</TableCell><TableCell>{p.studentId?.userId?.name || p.studentId?.rollNumber || "-"}</TableCell><TableCell>{formatCurrency(p.amount || 0)}</TableCell><TableCell className="capitalize">{p.paymentMethod}</TableCell><TableCell>{formatDate(p.paymentDate)}</TableCell></TableRow>)}
        </TableBody></Table>
      </section>
    </div>
  );
}
