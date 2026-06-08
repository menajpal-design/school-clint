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
import { mergeStudentIntoRow } from "@/lib/student-normalizer";
import { formatCurrency, formatDate } from "@/lib/utils";

const PAGE_SIZE = 5;
const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const dataFromScan = (code: string) => { const text = String(code || "").trim(); try { const url = new URL(text); return url.searchParams.get("data") || text; } catch { const match = text.match(/[?&]data=([^&]+)/); return match?.[1] ? decodeURIComponent(match[1]) : text; } };
const studentNameOf = (row: any) => row.studentName || row.student?.name || row.studentId?.name || row.studentId?.userId?.name || row.employeeType || "-";
const rollOf = (row: any) => row.rollNumber || row.roll || row.student?.roll || row.studentId?.rollNumber || "-";
const classNameOf = (row: any) => row.className || row.student?.className || row.studentId?.className || row.studentId?.classId?.name || row.classId?.name || row.invoiceId?.classId?.name || "-";
const sectionOf = (row: any) => row.sectionName || row.section || row.student?.section || row.studentId?.sectionName || row.studentId?.sectionId?.name || "-";
const guardianPhoneOf = (row: any) => row.guardianPhone || row.student?.guardianPhone || row.studentId?.guardianPhone || "-";

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
      const [data, profile, studentData] = await Promise.all([
        api.finance.reports({ startDate, endDate }) as Promise<any>,
        api.institution.profile().catch(() => null) as Promise<any>,
        api.students.getAll({ skipToast: true }).catch(() => ({ students: [] })) as Promise<any>,
      ]);
      const students = studentData?.students || [];
      const rawReports = data.reports || {};
      setReports({
        ...rawReports,
        collections: (rawReports.collections || []).map((row: any) => mergeStudentIntoRow(row, students)),
        dues: (rawReports.dues || []).map((row: any) => mergeStudentIntoRow(row, students)),
      });
      setInstitutionProfile(profile?.institution || profile?.profile || null);
    } catch (err: any) { setError(err?.message || "Failed to load finance reports."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load().catch(() => undefined); }, [startDate, endDate]);

  const classWiseRows = useMemo(() => {
    const map = new Map<string, any>();
    (reports.collections || []).forEach((row: any) => {
      const name = [classNameOf(row), sectionOf(row) !== "-" ? sectionOf(row) : ""].filter(Boolean).join(" / ") || "-";
      const item = map.get(name) || { _id: name, className: name, count: 0, amount: 0, collections: [] };
      item.count += 1; item.amount += Number(row.amount || 0); item.collections.push(row); map.set(name, item);
    });
    return [...map.values()].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
  }, [reports.collections]);

  const fileSuffix = `${startDate}_to_${endDate}`;
  const exportCsv = () => { const rows = [["Type","Student Name","Roll","Class","Section","Guardian Phone","Paid Amount","Due","Date","Status","Receipt"], ...(reports.collections || []).map((p:any)=>["Collection",studentNameOf(p), rollOf(p), classNameOf(p), sectionOf(p), guardianPhoneOf(p), p.amount || 0, "", formatDate(p.paymentDate || p.paidAt || p.createdAt), p.status || "collection", p.receiptNumber || p.receiptNo || ""]), ...(reports.dues || []).map((f:any)=>["Due",studentNameOf(f), rollOf(f), classNameOf(f), sectionOf(f), guardianPhoneOf(f), "", f.amount || f.dueAmount || 0, formatDate(f.dueDate), f.status || "due",""]), ...(reports.salaries || []).map((s:any)=>["Salary",s.employeeType,"","","","",s.netSalary,"",formatDate(s.paymentDate),s.status || "salary",""])]; downloadCsv(`finance-report-${fileSuffix}.csv`, rows); };
  const exportPdf = () => downloadElementPdf(reportRef.current, `finance-report-${fileSuffix}.pdf`);
  const handleQrScan = (code: string) => { const data = dataFromScan(code); setScannerOpen(false); window.open(`/verify/fee-receipt?data=${encodeURIComponent(data)}`, '_blank', 'noopener,noreferrer'); };
  const downloadReceipt = async (payment: any) => { const id = String(payment._id || payment.receiptNumber || payment.receiptNo || Date.now()); setPrintingId(id); try { await printPremiumFeeReceipt(payment, payment.student || payment.studentId, institutionProfile); } finally { setPrintingId(""); } };
  const verifyReceipt = (payment: any) => { const url = buildFeeReceiptVerifyUrl(payment, payment.student || payment.studentId, institutionProfile?.name); window.open(url, "_blank", "noopener,noreferrer"); };

  return <div className="space-y-5">
    <PageHeader title="Finance Reports" description="Fee collection, dues and salary reports with corrected student information." icon={FileBarChart} actions={[{ label: loading ? "Refreshing..." : "Refresh", icon: RefreshCw, onClick: load }, { label: "QR Verify", icon: QrCode, onClick: () => setScannerOpen(true) }, { label: "Export Excel", icon: Download, onClick: exportCsv }, { label: "Export PDF", icon: Download, onClick: exportPdf }]} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    <Dialog open={scannerOpen} onOpenChange={setScannerOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>QR Receipt Scanner</DialogTitle><DialogDescription>Scan receipt QR. After scan, verification page will open.</DialogDescription></DialogHeader><WebcamScanner enabled={scannerOpen} onScan={handleQrScan} /></DialogContent></Dialog>
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><label className="space-y-2"><span className="text-sm font-medium">Start date</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} /></label><label className="space-y-2"><span className="text-sm font-medium">End date</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} /></label><div className="flex items-end"><Button variant="outline" onClick={load} disabled={loading} className="w-full">Apply Filter</Button></div></div></section>
    <div className="grid gap-5 xl:grid-cols-2"><LineChartCard title="Fee collection trend" data={reports.trend || []} /><BarChartCard title="Fee type breakdown" data={reports.byType || []} /></div>
    <div ref={reportRef} className="space-y-5 bg-card"><div className="rounded-lg border border-border bg-card p-4"><h2 className="text-xl font-semibold text-slate-950">Finance Report</h2><p className="mt-1 text-sm text-slate-600">Period: {startDate} to {endDate}</p></div><ClassCollectionTable rows={classWiseRows} loading={loading} onDownloadReceipt={downloadReceipt} onVerifyReceipt={verifyReceipt} printingId={printingId} /><ReportTable title="Fee Collection Report" rows={reports.collections || []} kind="collection" loading={loading} onDownloadReceipt={downloadReceipt} onVerifyReceipt={verifyReceipt} printingId={printingId} /><ReportTable title="Due Report" rows={reports.dues || []} kind="due" loading={loading} /><ReportTable title="Salary Report" rows={reports.salaries || []} kind="salary" loading={loading} /></div>
  </div>;
}

function ClassCollectionTable({ rows, loading, onDownloadReceipt, onVerifyReceipt, printingId }: { rows: any[]; loading: boolean; onDownloadReceipt: (row: any) => void; onVerifyReceipt: (row: any) => void; printingId: string }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); const [selectedClass, setSelectedClass] = useState<any>(null); const visible = rows.slice(0, visibleCount); const detailRows = selectedClass?.collections || [];
  useEffect(() => setVisibleCount(PAGE_SIZE), [rows.length]);
  return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-4"><span className="font-semibold">Class-wise Collection Summary</span>{rows.length > PAGE_SIZE && <span className="text-xs text-muted-foreground">Showing {Math.min(visibleCount, rows.length)} of {rows.length}</span>}</div><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Class / Section</TableHead><TableHead>Total Receipts</TableHead><TableHead>Total Collection</TableHead><TableHead className="text-right">View</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading records...</TableCell></TableRow> : rows.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No class-wise collection found.</TableCell></TableRow> : visible.map((r:any)=><TableRow key={r.className}><TableCell>{r.className}</TableCell><TableCell>{r.count}</TableCell><TableCell>{formatCurrency(r.amount || 0)}</TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => setSelectedClass(r)}><Eye className="mr-1 h-4 w-4" />View</Button></TableCell></TableRow>)}</TableBody></Table><LoadMoreFooter total={rows.length} visible={visibleCount} onLoadMore={() => setVisibleCount((n) => n + PAGE_SIZE)} /><Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}><DialogContent className="max-h-[85vh] max-w-6xl overflow-y-auto"><DialogHeader><DialogTitle>{selectedClass?.className || "Class"} Collection Details</DialogTitle><DialogDescription>Total receipts: {selectedClass?.count || 0} - Total collection: {formatCurrency(selectedClass?.amount || 0)}</DialogDescription></DialogHeader><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Student</TableHead><TableHead>Roll</TableHead><TableHead>Guardian Phone</TableHead><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{detailRows.length === 0 ? <TableRow><TableCell colSpan={7} className="h-20 text-center text-muted-foreground">No collection found.</TableCell></TableRow> : detailRows.map((r:any)=>{ const id = String(r._id || r.receiptNumber || r.receiptNo); return <TableRow key={id}><TableCell>{studentNameOf(r)}</TableCell><TableCell>{rollOf(r)}</TableCell><TableCell>{guardianPhoneOf(r)}</TableCell><TableCell>{r.receiptNumber || r.receiptNo || "-"}</TableCell><TableCell>{formatCurrency(r.amount || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.paidAt || r.createdAt)}</TableCell><TableCell className="text-right"><div className="flex flex-col justify-end gap-2 sm:flex-row"><Button size="sm" variant="outline" onClick={() => onVerifyReceipt(r)}><QrCode className="mr-1 h-4 w-4" />Verify</Button><Button size="sm" onClick={() => onDownloadReceipt(r)} disabled={printingId === id}><Download className="mr-1 h-4 w-4" />Receipt</Button></div></TableCell></TableRow>; })}</TableBody></Table></div></DialogContent></Dialog></section>;
}
function ReportTable({ title, rows, kind, loading, onDownloadReceipt, onVerifyReceipt, printingId }: { title: string; rows: any[]; kind: string; loading: boolean; onDownloadReceipt?: (row: any) => void; onVerifyReceipt?: (row: any) => void; printingId?: string }) { const [visibleCount, setVisibleCount] = useState(PAGE_SIZE); const isCollection = kind === "collection"; const isSalary = kind === "salary"; const colSpan = isSalary ? 4 : isCollection ? 9 : 8; const visibleRows = rows.slice(0, visibleCount); useEffect(() => setVisibleCount(PAGE_SIZE), [rows.length]); return <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-4"><span className="font-semibold">{title}</span>{rows.length > PAGE_SIZE && <span className="text-xs text-muted-foreground">Showing {Math.min(visibleCount, rows.length)} of {rows.length}</span>}</div><Table><TableHeader><TableRow className="bg-muted hover:bg-muted">{isSalary ? <><TableHead>Name</TableHead><TableHead>Amount</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead></> : <><TableHead>Student Name</TableHead><TableHead>Roll</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Guardian Phone</TableHead><TableHead>{isCollection ? "Paid Amount" : "Due"}</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead>{isCollection && <TableHead className="text-right">Receipt</TableHead>}</>}</TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">Loading records...</TableCell></TableRow> : rows.length===0 ? <TableRow><TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow> : visibleRows.map((r:any)=>{ const id = String(r._id || r.receiptNumber || r.receiptNo); return <TableRow key={id}>{isSalary ? <><TableCell>{r.employeeType || "-"}</TableCell><TableCell>{formatCurrency(r.netSalary || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.createdAt)}</TableCell><TableCell className="capitalize">{r.status || kind}</TableCell></> : <><TableCell>{studentNameOf(r)}</TableCell><TableCell>{rollOf(r)}</TableCell><TableCell>{classNameOf(r)}</TableCell><TableCell>{sectionOf(r)}</TableCell><TableCell>{guardianPhoneOf(r)}</TableCell><TableCell>{formatCurrency(r.amount || r.dueAmount || 0)}</TableCell><TableCell>{formatDate(r.paymentDate || r.paidAt || r.dueDate || r.createdAt)}</TableCell><TableCell className="capitalize">{r.status || kind}</TableCell>{isCollection && <TableCell className="text-right"><div className="flex flex-col justify-end gap-2 sm:flex-row"><Button size="sm" variant="outline" onClick={() => onVerifyReceipt?.(r)}><QrCode className="mr-1 h-4 w-4" />Verify</Button><Button size="sm" onClick={() => onDownloadReceipt?.(r)} disabled={printingId === id}><Download className="mr-1 h-4 w-4" />{printingId === id ? "Opening..." : "Receipt"}</Button></div></TableCell>}</>}</TableRow>; })}</TableBody></Table><LoadMoreFooter total={rows.length} visible={visibleCount} onLoadMore={() => setVisibleCount((n) => n + PAGE_SIZE)} /></section>; }
function LoadMoreFooter({ total, visible, onLoadMore }: { total: number; visible: number; onLoadMore: () => void }) { if (total <= PAGE_SIZE) return null; const shown = Math.min(visible, total); const done = shown >= total; return <div className="flex flex-col items-center justify-between gap-2 border-t p-3 text-sm text-muted-foreground sm:flex-row"><span>Showing {shown} of {total}</span>{done ? <span className="font-medium text-emerald-700">All rows loaded</span> : <Button size="sm" variant="outline" onClick={onLoadMore}>Load More</Button>}</div>; }
