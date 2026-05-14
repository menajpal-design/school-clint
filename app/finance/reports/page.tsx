"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileBarChart } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { downloadCsv, downloadElementPdf } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export default function FinanceReportsPage() {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [startDate, setStartDate] = useState(firstDay());
  const [endDate, setEndDate] = useState(today());
  const [reports, setReports] = useState<any>({ collections: [], dues: [], salaries: [], trend: [], byType: [] });
  const load = async () => { const data = await api.finance.reports({ startDate, endDate }) as any; setReports(data.reports || {}); };
  useEffect(() => { load().catch(() => undefined); }, [startDate, endDate]);
  const fileSuffix = `${startDate}_to_${endDate}`;
  const exportCsv = () => {
    const rows = [["Type","Name","Amount","Date","Status"], ...(reports.collections || []).map((p:any)=>["Collection",p.studentId?.userId?.name || "",p.amount,formatDate(p.paymentDate),p.status || "collection"]), ...(reports.dues || []).map((f:any)=>["Due",f.studentId?.userId?.name || "",f.amount,formatDate(f.dueDate),f.status || "due"]), ...(reports.salaries || []).map((s:any)=>["Salary",s.employeeType,s.netSalary,formatDate(s.paymentDate),s.status || "salary"])];
    downloadCsv(`finance-report-${fileSuffix}.csv`, rows);
  };
  const exportPdf = () => downloadElementPdf(reportRef.current, `finance-report-${fileSuffix}.pdf`);
  return <div className="space-y-5">
    <PageHeader title="Finance Reports" description="Fee collection, dues and salary reports with exports." icon={FileBarChart} actions={[{ label: "Export Excel", icon: Download, onClick: exportCsv }, { label: "Export PDF", icon: Download, onClick: exportPdf }]} />
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm\"><div className="grid gap-3 md:grid-cols-2"><input className="h-10 rounded-md border border-input bg-background px-3 text-sm\" type="date\" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /><input className=\"h-10 rounded-md border border-input bg-background px-3 text-sm\" type=\"date\" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></div></section>
    <div className="grid gap-5 xl:grid-cols-2"><LineChartCard title="Fee collection trend" data={reports.trend || []} /><BarChartCard title="Fee type breakdown" data={reports.byType || []} /></div>
    <div ref={reportRef} className="space-y-5 bg-card">
      <div className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-xl font-semibold text-slate-950">Finance Report</h2>
        <p className="mt-1 text-sm text-slate-600">Period: {startDate} to {endDate}</p>
      </div>
      <ReportTable title="Fee Collection Report" rows={reports.collections || []} kind="collection" />
      <ReportTable title="Due Report" rows={reports.dues || []} kind="due" />
      <ReportTable title="Salary Report" rows={reports.salaries || []} kind="salary" />
    </div>
  </div>;
}

function ReportTable({ title, rows, kind }: { title: string; rows: any[]; kind: string }) {
  return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="border-b border-border p-4 font-semibold">{title}</div><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{rows.length===0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No records.</TableCell></TableRow> : rows.map((r:any)=><TableRow key={r._id}><TableCell>{r.studentId?.userId?.name || r.employeeType || "-"}</TableCell><TableCell>{formatCurrency(r.amount || r.netSalary || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.dueDate || r.createdAt)}</TableCell><TableCell className="capitalize">{r.status || kind}</TableCell></TableRow>)}</TableBody></Table></section>;
}
