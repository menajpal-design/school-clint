"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MyFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [childId, setChildId] = useState("");
  const [loading, setLoading] = useState(false);
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

  const visibleFees = useMemo(() => childId ? fees.filter((f) => String(f.studentId) === String(childId) || String(f.studentId?._id) === String(childId)) : fees, [fees, childId]);
  const visiblePayments = useMemo(() => childId ? payments.filter((p) => String(p.studentId) === String(childId) || String(p.studentId?._id) === String(childId)) : payments, [payments, childId]);
  const due = visibleFees.filter((f) => f.status !== "paid").reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const paid = visiblePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const nextDue = visibleFees.filter((f) => f.status !== "paid").sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  const printReceipt = (payment: any) => {
    const child = children.find((item) => String(item._id) === String(payment.studentId?._id || payment.studentId || childId));
    printHtml("Fee Receipt", `
      <main class="print-card">
        <p class="print-title">Fee Receipt</p>
        <p class="print-muted">Receipt No: ${payment.receiptNumber || "-"}</p>
        <div class="print-grid">
          <div class="print-row"><strong>Student</strong>${payment.studentId?.userId?.name || child?.userId?.name || child?.name || "-"}</div>
          <div class="print-row"><strong>Amount</strong>${formatCurrency(payment.amount || 0)}</div>
          <div class="print-row"><strong>Method</strong>${payment.paymentMethod || "-"}</div>
          <div class="print-row"><strong>Date</strong>${formatDate(payment.paymentDate || new Date())}</div>
        </div>
        <div class="signature"><div>Accounts Office</div><div>Guardian Signature</div></div>
      </main>
    `, "", JSON.stringify({
      type: "fee_receipt",
      receiptNumber: payment.receiptNumber,
      student: payment.studentId?.userId?.name || child?.userId?.name || child?.name,
      amount: payment.amount,
      date: payment.paymentDate || new Date(),
    }));
  };

  return <div className="space-y-5">
    <PageHeader title="My Fees" description="View dues, paid amount, next payment date and receipts." icon={WalletCards} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {children.length > 1 && <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-auto" value={childId} onChange={(e) => setChildId(e.target.value)}>{children.map((c) => <option key={c._id} value={c._id}>{c.userId?.name || c.name}</option>)}</select>}
    <div className="grid gap-4 md:grid-cols-3"><StatCard label="Due Amount" value={formatCurrency(due)} tone="rose" /><StatCard label="Paid Amount" value={formatCurrency(paid)} tone="emerald" /><StatCard label="Next Payment Date" value={nextDue ? formatDate(nextDue.dueDate) : "N/A"} /></div>
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Fee</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading fees...</TableCell></TableRow> : visibleFees.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No fee records found.</TableCell></TableRow> : visibleFees.map((f) => <TableRow key={f._id}><TableCell className="capitalize">{f.type} {f.month} {f.year}</TableCell><TableCell>{formatCurrency(f.amount || 0)}</TableCell><TableCell>{formatDate(f.dueDate)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{f.status}</Badge></TableCell></TableRow>)}</TableBody></Table></section>
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead>Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading payments...</TableCell></TableRow> : visiblePayments.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No payment receipts found.</TableCell></TableRow> : visiblePayments.map((p) => <TableRow key={p._id}><TableCell>{p.receiptNumber || "-"}</TableCell><TableCell>{formatCurrency(p.amount || 0)}</TableCell><TableCell>{p.paymentMethod || "-"}</TableCell><TableCell>{formatDate(p.paymentDate)}</TableCell><TableCell><Button size="sm" variant="outline" onClick={() => printReceipt(p)}><Download className="mr-2 h-4 w-4" />Receipt</Button></TableCell></TableRow>)}</TableBody></Table></section>
  </div>;
}