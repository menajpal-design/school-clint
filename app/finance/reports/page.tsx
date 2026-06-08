"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileBarChart, QrCode, RefreshCw } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { downloadCsv, downloadElementPdf } from "@/lib/export-utils";
import { buildFeeReceiptVerifyUrl, printPremiumFeeReceipt } from "@/lib/premium-fee-receipt";
import { formatCurrency, formatDate } from "@/lib/utils";

const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export default function FinanceReportsPage() {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [startDate, setStartDate] = useState(firstDay());
  const [endDate, setEndDate] = useState(today());
  const [reports, setReports] = useState<any>({ collections: [], dues: [], salaries: [], trend: [], byType: [] });
  const [institutionProfile, setInstitutionProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [printingId, setPrintingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [data, profile] = await Promise.all([api.finance.reports({ startDate, endDate }) as Promise<any>, api.institution.profile().catch(() => null) as Promise<any>]);
      setReports(data.reports || {});
      setInstitutionProfile(profile?.institution || profile?.profile || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load finance reports.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load().catch(() => undefined); }, [startDate, endDate]);

  const fileSuffix = `${startDate}_to_${endDate}`;
  const exportCsv = () => {
    const rows = [["Type","Name","Amount","Date","Status","Receipt"], ...(reports.collections || []).map((p:any)=>["Collection",p.studentId?.userId?.name || "",p.amount,formatDate(p.paymentDate || p.paidAt || p.createdAt),p.status || "collection",p.receiptNumber || p.receiptNo || ""]), ...(reports.dues || []).map((f:any)=>["Due",f.studentId?.userId?.name || "",f.amount || f.dueAmount,formatDate(f.dueDate),f.status || "due",""]), ...(reports.salaries || []).map((s:any)=>["Salary",s.employeeType,s.netSalary,formatDate(s.paymentDate),s.status || "salary",""])];
    downloadCsv(`finance-report-${fileSuffix}.csv`, rows);
  };
  const exportPdf = () => downloadElementPdf(reportRef.current, `finance-report-${fileSuffix}.pdf`);
  const downloadReceipt = async (payment: any) => {
    const id = String(payment._id || payment.receiptNumber || payment.receiptNo || Date.now());
    setPrintingId(id);
    try { await printPremiumFeeReceipt(payment, payment.studentId, institutionProfile); }
    finally { setPrintingId(""); }
  };
  const verifyReceipt = (payment: any) => {
    const url = buildFeeReceiptVerifyUrl(payment, payment.studentId, institutionProfile?.name);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return <div className="space-y-5">
    <PageHeader title="Finance Reports" description="Fee collection, dues and salary reports with receipt download and QR verification." icon={FileBarChart} actions={[{ label: loading ? "Refreshing..." : "Refresh", icon: RefreshCw, onClick: load }, { label: "Export Excel", icon: Download, onClick: exportCsv }, { label: "Export PDF", icon: Download, onClick: exportPdf }]} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-2"><span className="text-sm font-medium">Start date</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></label>
        <label className="space-y-2"><span className="text-sm font-medium">End date</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></label>
        <div className="flex items-end"><Button variant="outline" onClick={load} disabled={loading} className="w-full">Apply Filter</Button></div>
      </div>
    </section>
    <div className="grid gap-5 xl:grid-cols-2"><LineChartCard title="Fee collection trend" data={reports.trend || []} /><BarChartCard title="Fee type breakdown" data={reports.byType || []} /></div>
    <div ref={reportRef} className="space-y-5 bg-card">
      <div className="rounded-lg border border-border bg-card p-4"><h2 className="text-xl font-semibold text-slate-950">Finance Report</h2><p className="mt-1 text-sm text-slate-600">Period: {startDate} to {endDate}</p></div>
      <ReportTable title="Fee Collection Report" rows={reports.collections || []} kind="collection" loading={loading} onDownloadReceipt={downloadReceipt} onVerifyReceipt={verifyReceipt} printingId={printingId} />
      <ReportTable title="Due Report" rows={reports.dues || []} kind="due" loading={loading} />
      <ReportTable title="Salary Report" rows={reports.salaries || []} kind="salary" loading={loading} />
    </div>
  </div>;
}

function ReportTable({ title, rows, kind, loading, onDownloadReceipt, onVerifyReceipt, printingId }: { title: string; rows: any[]; kind: string; loading: boolean; onDownloadReceipt?: (row: any) => void; onVerifyReceipt?: (row: any) => void; printingId?: string }) {
  const isCollection = kind === "collection";
  const colSpan = isCollection ? 6 : 4;
  return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="border-b border-border p-4 font-semibold">{title}</div><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>{isCollection && <TableHead className="text-right">Receipt</TableHead>}</TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">Loading records...</TableCell></TableRow> : rows.length===0 ? <TableRow><TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow> : rows.map((r:any)=>{ const id = String(r._id || r.receiptNumber || r.receiptNo); return <TableRow key={id}><TableCell>{r.studentId?.userId?.name || r.employeeType || "-"}</TableCell><TableCell>{formatCurrency(r.amount || r.netSalary || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.paidAt || r.dueDate || r.createdAt)}</TableCell><TableCell className="capitalize">{r.status || kind}</TableCell>{isCollection && <TableCell className="text-right"><div className="flex flex-col justify-end gap-2 sm:flex-row"><Button size="sm" variant="outline" onClick={() => onVerifyReceipt?.(r)}><QrCode className="mr-1 h-4 w-4" />Verify</Button><Button size="sm" onClick={() => onDownloadReceipt?.(r)} disabled={printingId === id}><Download className="mr-1 h-4 w-4" />{printingId === id ? "Opening..." : "Receipt"}</Button></div></TableCell>}</TableRow>; })}</TableBody></Table></section>;
}
