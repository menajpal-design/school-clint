"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Eye, FileBarChart, QrCode, RefreshCw } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { downloadCsv, downloadElementPdf } from "@/lib/export-utils";
import { buildFeeReceiptVerifyUrl, printPremiumFeeReceipt } from "@/lib/premium-fee-receipt";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 5;
const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const classNameOf = (row: any) => row.studentId?.classId?.name || row.classId?.name || row.invoiceId?.classId?.name || "Unassigned";
const dataFromScan = (code: string) => { const text = String(code || "").trim(); try { const url = new URL(text); return url.searchParams.get("data") || text; } catch { const match = text.match(/[?&]data=([^&]+)/); return match?.[1] ? decodeURIComponent(match[1]) : text; } };

export default function FinanceReportsPage() {
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [startDate, setStartDate] = useState(firstDay());
  const [endDate, setEndDate] = useState(today());
  const [reports, setReports] = useState<any>({ collections: [], dues: [], salaries: [], trend: [], byType: [] });
  const [institutionProfile, setInstitutionProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [printingId, setPrintingId] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [data, profile] = await Promise.all([api.finance.reports({ startDate, endDate }) as Promise<any>, api.institution.profile().catch(() => null) as Promise<any>]);
      setReports(data.reports || {});
      setInstitutionProfile(profile?.institution || profile?.profile || null);
    } catch (err: any) { setError(err?.message || "Failed to load finance reports."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load().catch(() => undefined); }, [startDate, endDate]);

  const classWiseRows = useMemo(() => {
    const map = new Map<string, any>();
    (reports.collections || []).forEach((row: any) => {
      const name = classNameOf(row);
      const item = map.get(name) || { _id: name, className: name, count: 0, amount: 0, collections: [] };
      item.count += 1; item.amount += Number(row.amount || 0); item.collections.push(row); map.set(name, item);
    });
    return [...map.values()].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  }, [reports.collections]);

  const fileSuffix = `${startDate}_to_${endDate}`;
  const exportCsv = () => { const rows = [["Type","Name","Class","Amount","Date","Status","Receipt"], ...(reports.collections || []).map((p:any)=>["Collection",p.studentId?.userId?.name || "", classNameOf(p), p.amount, formatDate(p.paymentDate || p.paidAt || p.createdAt), p.status || "collection", p.receiptNumber || p.receiptNo || ""]), ...(reports.dues || []).map((f:any)=>["Due",f.studentId?.userId?.name || "", classNameOf(f), f.amount || f.dueAmount, formatDate(f.dueDate), f.status || "due",""]), ...(reports.salaries || []).map((s:any)=>["Salary",s.employeeType,"",s.netSalary,formatDate(s.paymentDate),s.status || "salary",""])]; downloadCsv(`finance-report-${fileSuffix}.csv`, rows); };
  const exportPdf = () => downloadElementPdf(reportRef.current, `finance-report-${fileSuffix}.pdf`);
  const openQrVerify = () => setScannerOpen(true);
  const handleQrScan = (code: string) => { const data = dataFromScan(code); setScannerOpen(false); window.open(`/verify/fee-receipt?data=${encodeURIComponent(data)}`, '_blank', 'noopener,noreferrer'); };
  const downloadReceipt = async (payment: any) => { const id = String(payment._id || payment.receiptNumber || payment.receiptNo || Date.now()); setPrintingId(id); try { await printPremiumFeeReceipt(payment, payment.studentId, institutionProfile); } finally { setPrintingId(""); } };
  const verifyReceipt = (payment: any) => { const url = buildFeeReceiptVerifyUrl(payment, payment.studentId, institutionProfile?.name); window.open(url, "_blank", "noopener,noreferrer"); };

  return <div className="space-y-5">
    <PageHeader title="Finance Reports" description="Fee collection, dues and salary reports with receipt download, QR verification and Load More tables." icon={FileBarChart} actions={[{ label: loading ? "Refreshing..." : "Refresh", icon: RefreshCw, onClick: load }, { label: "QR Verify", icon: QrCode, onClick: openQrVerify }, { label: "Export Excel", icon: Download, onClick: exportCsv }, { label: "Export PDF", icon: Download, onClick: exportPdf }]} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <Dialog open={scannerOpen} onOpenChange={setScannerOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>QR Receipt Scanner</DialogTitle><DialogDescription>Receipt QR camera দিয়ে scan করুন। Scan হলে verification page auto open হবে।</DialogDescription></DialogHeader><WebcamScanner enabled={scannerOpen} onScan={handleQrScan} /></DialogContent></Dialog>
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><label className="space-y-2"><span className="text-sm font-medium">Start date</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">End date</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></label><div className="flex items-end"><Button variant="outline" onClick={load} disabled={loading} className="w-full">Apply Filter</Button></div></div></section>
    <div className="grid gap-5 xl:grid-cols-2"><LineChartCard title="Fee collection trend" data={reports.trend || []} /><BarChartCard title="Fee type breakdown" data={reports.byType || []} /></div>
    <div ref={reportRef} className="space-y-5 bg-card"><div className="rounded-lg border border-border bg-card p-4"><h2 className="text-xl font-semibold text-slate-950">Finance Report</h2><p className="mt-1 text-sm text-slate-600">Period: {startDate} to {endDate}</p></div><ClassCollectionTable rows={classWiseRows} loading={loading} onDownloadReceipt={downloadReceipt} onVerifyReceipt={verifyReceipt} printingId={printingId} /><ReportTable title="Fee Collection Report" rows={reports.collections || []} kind="collection" loading={loading} onDownloadReceipt={downloadReceipt} onVerifyReceipt={verifyReceipt} printingId={printingId} /><ReportTable title="Due Report" rows={reports.dues || []} kind="due" loading={loading} /><ReportTable title="Salary Report" rows={reports.salaries || []} kind="salary" loading={loading} /></div>
  </div>;
}

function ClassCollectionTable({ rows, loading, onDownloadReceipt, onVerifyReceipt, printingId }: { rows: any[]; loading: boolean; onDownloadReceipt: (row: any) => void; onVerifyReceipt: (row: any) => void; printingId: string }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); const [selectedClass, setSelectedClass] = useState<any>(null); const visible = rows.slice(0, visibleCount); const detailRows = selectedClass?.collections || [];
  useEffect(() => setVisibleCount(PAGE_SIZE), [rows.length]);
  return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-4"><span className="font-semibold">Class-wise Collection Summary</span>{rows.length > PAGE_SIZE && <span className="text-xs text-muted-foreground">Showing {Math.min(visibleCount, rows.length)} of {rows.length}</span>}</div><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Class</TableHead><TableHead>Total Receipts</TableHead><TableHead>Total Collection</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading records...</TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No class-wise collection found.</TableCell></TableRow> : visible.map((r:any)=><TableRow key={r.className}><TableCell>{r.className}</TableCell><TableCell>{r.count}</TableCell><TableCell>{formatCurrency(r.amount || 0)}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSelectedClass(r)}><Eye className="mr-1 h-4 w-4" />View</Button></TableCell></TableRow>)}</TableBody></Table><LoadMoreFooter total={rows.length} visible={visibleCount} onLoadMore={() => setVisibleCount((n) => n + PAGE_SIZE)} /><Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}><DialogContent className="max-h-[85vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{selectedClass?.className || "Class"} Collection Details</DialogTitle><DialogDescription>Total receipts: {selectedClass?.count || 0} · Total collection: {formatCurrency(selectedClass?.amount || 0)}</DialogDescription></DialogHeader><div className="grid gap-3 md:grid-cols-3"><div className="rounded-lg border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Class</p><p className="font-semibold">{selectedClass?.className || "-"}</p></div><div className="rounded-lg border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Total Receipts</p><p className="font-semibold">{selectedClass?.count || 0}</p></div><div className="rounded-lg border bg-muted/40 p-3"><p className="text-xs text-muted-foreground">Total Collection</p><p className="font-semibold">{formatCurrency(selectedClass?.amount || 0)}</p></div></div><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Student</TableHead><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{detailRows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No collection found.</TableCell></TableRow> : detailRows.map((r:any)=>{ const id = String(r._id || r.receiptNumber || r.receiptNo); return <TableRow key={id}><TableCell>{r.studentId?.userId?.name || r.studentId?.rollNumber || "-"}</TableCell><TableCell>{r.receiptNumber || r.receiptNo || "-"}</TableCell><TableCell>{formatCurrency(r.amount || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.paidAt || r.createdAt)}</TableCell><TableCell className="capitalize">{r.status || "collection"}</TableCell><TableCell className="text-right"><div className="flex flex-col justify-end gap-2 sm:flex-row"><Button size="sm" variant="outline" onClick={() => onVerifyReceipt(r)}><QrCode className="mr-1 h-4 w-4" />Verify</Button><Button size="sm" onClick={() => onDownloadReceipt(r)} disabled={printingId === id}><Download className="mr-1 h-4 w-4" />Receipt</Button></div></TableCell></TableRow>; })}</TableBody></Table></div></DialogContent></Dialog></section>;
}
function ReportTable({ title, rows, kind, loading, onDownloadReceipt, onVerifyReceipt, printingId }: { title: string; rows: any[]; kind: string; loading: boolean; onDownloadReceipt?: (row: any) => void; onVerifyReceipt?: (row: any) => void; printingId?: string }) { const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); const isCollection = kind === "collection"; const colSpan = isCollection ? 6 : 4; const visibleRows = rows.slice(0, visibleCount); useEffect(() => setVisibleCount(PAGE_SIZE), [rows.length]); return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-4"><span className="font-semibold">{title}</span>{rows.length > PAGE_SIZE && <span className="text-xs text-muted-foreground">Showing {Math.min(visibleCount, rows.length)} of {rows.length}</span>}</div><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>{isCollection && <TableHead className="text-right">Receipt</TableHead>}</TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">Loading records...</TableCell></TableRow> : rows.length===0 ? <TableRow><TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow> : visibleRows.map((r:any)=>{ const id = String(r._id || r.receiptNumber || r.receiptNo); return <TableRow key={id}><TableCell>{r.studentId?.userId?.name || r.employeeType || "-"}</TableCell><TableCell>{formatCurrency(r.amount || r.netSalary || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.paidAt || r.dueDate || r.createdAt)}</TableCell><TableCell className="capitalize">{r.status || kind}</TableCell>{isCollection && <TableCell className="text-right"><div className="flex flex-col justify-end gap-2 sm:flex-row"><Button size="sm" variant="outline" onClick={() => onVerifyReceipt?.(r)}><QrCode className="mr-1 h-4 w-4" />Verify</Button><Button size="sm" onClick={() => onDownloadReceipt?.(r)} disabled={printingId === id}><Download className="mr-1 h-4 w-4" />{printingId === id ? "Opening..." : "Receipt"}</Button></div></TableCell>}</TableRow>; })}</TableBody></Table><LoadMoreFooter total={rows.length} visible={visibleCount} onLoadMore={() => setVisibleCount((n) => n + PAGE_SIZE)} /></section>; }
function LoadMoreFooter({ total, visible, onLoadMore }: { total: number; visible: number; onLoadMore: () => void }) { if (total <= PAGE_SIZE) return null; const shown = Math.min(visible, total); const done = shown >= total; return <div className="flex flex-col items-center justify-between gap-2 border-t p-3 text-sm text-muted-foreground sm:flex-row"><span>Showing {shown} of {total}</span>{done ? <span className="font-medium text-emerald-700">All rows loaded</span> : <Button size="sm" variant="outline" onClick={onLoadMore}>Load More</Button>}</div>; }
