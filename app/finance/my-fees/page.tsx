"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, Printer, RefreshCw, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

const safeText = (value: unknown) => String(value ?? "-").replace(/[&<>'\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char] || char));
const receiptTitle = (receiptNo: string) => `Professional Fee Receipt - ${receiptNo || "Payment"}`;

function getStudentName(payment: any, child: any) {
  return payment?.studentId?.userId?.name || payment?.studentId?.name || child?.userId?.name || child?.name || "Student";
}

function getStudentMeta(child: any) {
  return {
    roll: child?.rollNumber || child?.roll || "-",
    className: child?.classId?.name || child?.className || child?.class || "-",
    section: child?.sectionId?.name || child?.sectionName || child?.section || "-",
    guardian: child?.guardianName || child?.parentName || "-",
  };
}

export default function MyFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [childId, setChildId] = useState("");
  const [loading, setLoading] = useState(false);
  const [printingId, setPrintingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.finance.myFees() as any;
      setFees(data.myFees || []);
      setPayments(data.payments || []);
      setChildren(data.children || []);
      setChildId((current) => current || data.children?.[0]?._id || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load fee information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const selectedChild = useMemo(() => children.find((item) => String(item._id) === String(childId)), [children, childId]);
  const visibleFees = useMemo(() => childId ? fees.filter((f) => String(f.studentId) === String(childId) || String(f.studentId?._id) === String(childId)) : fees, [fees, childId]);
  const visiblePayments = useMemo(() => childId ? payments.filter((p) => String(p.studentId) === String(childId) || String(p.studentId?._id) === String(childId)) : payments, [payments, childId]);
  const due = visibleFees.filter((f) => f.status !== "paid").reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const paid = visiblePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const nextDue = visibleFees.filter((f) => f.status !== "paid").sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const latestPayment = visiblePayments.slice().sort((a, b) => new Date(b.paymentDate || b.createdAt || 0).getTime() - new Date(a.paymentDate || a.createdAt || 0).getTime())[0];

  const printReceipt = async (payment: any) => {
    const paymentChild = children.find((item) => String(item._id) === String(payment.studentId?._id || payment.studentId || childId)) || selectedChild;
    const studentName = getStudentName(payment, paymentChild);
    const meta = getStudentMeta(paymentChild);
    const receiptNo = payment.receiptNumber || `RCPT-${String(payment._id || Date.now()).slice(-8).toUpperCase()}`;
    const collectedBy = payment.collectedBy?.name || payment.createdBy?.name || "Accounts Office";
    const paymentDate = payment.paymentDate || payment.createdAt || new Date();
    const amount = Number(payment.amount || 0);
    setPrintingId(String(payment._id || receiptNo));

    const body = `
      <main class="print-card professional-receipt">
        <section class="receipt-topline">
          <div>
            <p class="receipt-label">Official Money Receipt</p>
            <h1 class="receipt-title">Fee Payment Receipt</h1>
            <p class="receipt-muted">Generated from EasySchool student/parent fee portal.</p>
          </div>
          <div class="paid-stamp">PAID</div>
        </section>

        <section class="receipt-summary">
          <div><span>Receipt No</span><strong>${safeText(receiptNo)}</strong></div>
          <div><span>Payment Date</span><strong>${safeText(formatDate(paymentDate))}</strong></div>
          <div><span>Payment Method</span><strong>${safeText(payment.paymentMethod || "Cash")}</strong></div>
          <div><span>Status</span><strong>${safeText(payment.status || "Paid")}</strong></div>
        </section>

        <section class="receipt-two-col">
          <div class="receipt-box">
            <h2>Student Information</h2>
            <p><b>Name:</b> ${safeText(studentName)}</p>
            <p><b>Roll:</b> ${safeText(meta.roll)}</p>
            <p><b>Class:</b> ${safeText(meta.className)}</p>
            <p><b>Section:</b> ${safeText(meta.section)}</p>
            <p><b>Guardian:</b> ${safeText(meta.guardian)}</p>
          </div>
          <div class="receipt-box amount-box">
            <h2>Amount Received</h2>
            <div class="amount-large">${safeText(formatCurrency(amount))}</div>
            <p><b>Fee Type:</b> ${safeText(payment.feeId?.type || payment.type || "Student Fee")}</p>
            <p><b>Month/Year:</b> ${safeText(payment.month || payment.feeId?.month || "-")} ${safeText(payment.year || payment.feeId?.year || "")}</p>
          </div>
        </section>

        <section class="receipt-table-wrap">
          <table>
            <thead>
              <tr><th>SL</th><th>Description</th><th>Method</th><th>Date</th><th class="right">Amount</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>01</td>
                <td>${safeText(payment.feeId?.type || payment.type || "Fee Payment")}</td>
                <td>${safeText(payment.paymentMethod || "Cash")}</td>
                <td>${safeText(formatDate(paymentDate))}</td>
                <td class="right">${safeText(formatCurrency(amount))}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr><td colspan="4" class="right"><b>Total Paid</b></td><td class="right"><b>${safeText(formatCurrency(amount))}</b></td></tr>
            </tfoot>
          </table>
        </section>

        <section class="receipt-note"><b>Note:</b> Please preserve this receipt for future reference. For any mismatch, contact the accounts office with the receipt number.</section>

        <section class="receipt-signatures">
          <div><span></span><b>Accounts Officer</b><small>${safeText(collectedBy)}</small></div>
          <div><span></span><b>Guardian / Student</b><small>Received copy</small></div>
          <div><span class="seal-circle">SEAL</span><b>Institution Seal</b><small>Verified receipt</small></div>
        </section>
      </main>
    `;

    const styles = `
      .professional-receipt { border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; position: relative; overflow: hidden; }
      .professional-receipt:before { content: "PAID"; position: absolute; left: 70px; bottom: 80px; transform: rotate(-28deg); font-size: 94px; font-weight: 900; letter-spacing: .25em; color: rgba(15,23,42,.035); }
      .receipt-topline { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 18px; }
      .receipt-label { margin: 0 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: .24em; color: #64748b; font-weight: 800; }
      .receipt-title { margin: 0; font-size: 28px; line-height: 1.1; color: #0f172a; }
      .receipt-muted { margin: 6px 0 0; font-size: 12px; color: #64748b; }
      .paid-stamp { border: 3px solid #16a34a; color: #16a34a; border-radius: 999px; padding: 12px 18px; font-weight: 900; letter-spacing: .18em; transform: rotate(-8deg); }
      .receipt-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
      .receipt-summary div { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; background: #f8fafc; }
      .receipt-summary span { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; font-weight: 700; }
      .receipt-summary strong { display: block; margin-top: 4px; font-size: 13px; color: #0f172a; }
      .receipt-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 16px 0; }
      .receipt-box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px; background: #fff; }
      .receipt-box h2 { margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: .16em; color: #334155; }
      .receipt-box p { margin: 6px 0; font-size: 12px; color: #334155; }
      .amount-box { background: #f8fafc; }
      .amount-large { font-size: 30px; font-weight: 900; color: #0f172a; margin: 10px 0 12px; }
      .receipt-table-wrap { margin-top: 16px; }
      .receipt-table-wrap table { width: 100%; border-collapse: collapse; }
      .receipt-table-wrap th { background: #0f172a; color: #fff; border: 1px solid #0f172a; padding: 9px; font-size: 11px; }
      .receipt-table-wrap td { border: 1px solid #cbd5e1; padding: 9px; font-size: 12px; }
      .receipt-table-wrap tfoot td { background: #f1f5f9; }
      .right { text-align: right; }
      .receipt-note { margin-top: 14px; border-left: 4px solid #0f172a; background: #f8fafc; padding: 12px; font-size: 12px; color: #475569; }
      .receipt-signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 54px; align-items: end; }
      .receipt-signatures div { text-align: center; font-size: 12px; color: #334155; }
      .receipt-signatures span:not(.seal-circle) { display: block; height: 1px; background: #334155; margin-bottom: 8px; }
      .receipt-signatures b { display: block; color: #0f172a; }
      .receipt-signatures small { display: block; margin-top: 3px; color: #64748b; }
      .seal-circle { display: inline-flex; width: 74px; height: 74px; border: 2px dashed #64748b; border-radius: 999px; align-items: center; justify-content: center; font-weight: 900; color: #64748b; margin-bottom: 8px; }
    `;

    try {
      await printHtml(receiptTitle(receiptNo), body, styles, JSON.stringify({ type: "fee_receipt", receiptNumber: receiptNo, student: studentName, amount, date: paymentDate }));
    } finally {
      setPrintingId("");
    }
  };

  return <div className="space-y-5">
    <PageHeader
      title="My Fees"
      description="View dues, paid amount, next payment date and professional money receipts."
      icon={WalletCards}
      status={<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Professional Receipt</Badge>}
      actions={[<Button key="refresh" size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]}
    />

    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

    {children.length > 1 && <section className="rounded-lg border bg-card p-4 shadow-sm"><label className="mb-2 block text-sm font-medium">Select Child</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-auto" value={childId} onChange={(e) => setChildId(e.target.value)}>{children.map((c) => <option key={c._id} value={c._id}>{c.userId?.name || c.name}</option>)}</select></section>}

    <div className="grid gap-4 md:grid-cols-4">
      <StatCard label="Due Amount" value={formatCurrency(due)} tone="rose" />
      <StatCard label="Paid Amount" value={formatCurrency(paid)} tone="emerald" />
      <StatCard label="Next Payment Date" value={nextDue ? formatDate(nextDue.dueDate) : "N/A"} />
      <StatCard label="Receipts" value={visiblePayments.length} tone="blue" />
    </div>

    {latestPayment && <section className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">Latest payment received</span></div>
          <p className="mt-1 text-sm text-muted-foreground">Receipt: {latestPayment.receiptNumber || "-"} • {formatCurrency(latestPayment.amount || 0)} • {formatDate(latestPayment.paymentDate || latestPayment.createdAt)}</p>
        </div>
        <Button size="sm" onClick={() => printReceipt(latestPayment)} disabled={!!printingId}><Printer className="mr-2 h-4 w-4" />Print Latest Receipt</Button>
      </div>
    </section>}

    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b p-4"><h2 className="font-semibold">Fee Details</h2><p className="text-sm text-muted-foreground">All assigned fees and due status.</p></div>
      <div className="hidden md:block"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Fee</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading fees...</TableCell></TableRow> : visibleFees.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No fee records found.</TableCell></TableRow> : visibleFees.map((f) => <TableRow key={f._id}><TableCell className="capitalize font-medium">{f.type} {f.month} {f.year}</TableCell><TableCell>{formatCurrency(f.amount || 0)}</TableCell><TableCell>{formatDate(f.dueDate)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{f.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="grid gap-3 p-4 md:hidden">{visibleFees.length === 0 ? <p className="text-center text-sm text-muted-foreground">No fee records found.</p> : visibleFees.map((f) => <div key={f._id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><p className="font-medium capitalize">{f.type} {f.month} {f.year}</p><Badge variant="outline" className="capitalize">{f.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">Due: {formatDate(f.dueDate)}</p><p className="mt-1 font-semibold">{formatCurrency(f.amount || 0)}</p></div>)}</div>
    </section>

    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="border-b p-4"><h2 className="font-semibold">Professional Payment Receipts</h2><p className="text-sm text-muted-foreground">Download or print official receipt with student details, amount table, signatures, seal and verification QR.</p></div>
      <div className="hidden md:block"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading payments...</TableCell></TableRow> : visiblePayments.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payment receipts found.</TableCell></TableRow> : visiblePayments.map((p) => <TableRow key={p._id}><TableCell className="font-medium">{p.receiptNumber || "-"}</TableCell><TableCell>{formatCurrency(p.amount || 0)}</TableCell><TableCell>{p.paymentMethod || "-"}</TableCell><TableCell>{formatDate(p.paymentDate || p.createdAt)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{p.status || "paid"}</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => printReceipt(p)} disabled={printingId === String(p._id)}><Download className="mr-2 h-4 w-4" />{printingId === String(p._id) ? "Opening..." : "Professional Receipt"}</Button></TableCell></TableRow>)}</TableBody></Table></div>
      <div className="grid gap-3 p-4 md:hidden">{visiblePayments.length === 0 ? <p className="text-center text-sm text-muted-foreground">No payment receipts found.</p> : visiblePayments.map((p) => <div key={p._id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{p.receiptNumber || "Receipt"}</p><p className="text-sm text-muted-foreground">{formatDate(p.paymentDate || p.createdAt)} • {p.paymentMethod || "-"}</p></div><Badge variant="outline">{p.status || "paid"}</Badge></div><div className="mt-3 flex items-center justify-between"><p className="text-lg font-bold">{formatCurrency(p.amount || 0)}</p><Button size="sm" variant="outline" onClick={() => printReceipt(p)} disabled={printingId === String(p._id)}><FileText className="mr-2 h-4 w-4" />Receipt</Button></div></div>)}</div>
    </section>
  </div>;
}