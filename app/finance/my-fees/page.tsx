"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, FileText, RefreshCw, WalletCards } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { printPremiumFeeReceipt } from "@/lib/premium-fee-receipt";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function MyFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [childId, setChildId] = useState("");
  const [institutionProfile, setInstitutionProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [printingId, setPrintingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [feeData, profileData] = await Promise.all([api.finance.myFees() as Promise<any>, api.institution.profile().catch(() => null) as Promise<any>]);
      setFees(feeData.myFees || feeData.fees || []);
      setPayments(feeData.payments || []);
      setChildren(feeData.children || []);
      setChildId((current) => current || feeData.children?.[0]?._id || "");
      setInstitutionProfile(profileData?.institution || profileData?.profile || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load fee information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, []);

  const selectedChild = useMemo(() => children.find((item) => String(item._id) === String(childId)), [children, childId]);
  const visibleFees = useMemo(() => childId ? fees.filter((f) => String(f.studentId) === String(childId) || String(f.studentId?._id) === String(childId) || !f.studentId) : fees, [fees, childId]);
  const visiblePayments = useMemo(() => childId ? payments.filter((p) => String(p.studentId) === String(childId) || String(p.studentId?._id) === String(childId)) : payments, [payments, childId]);
  const due = visibleFees.filter((f) => f.status !== "paid").reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const paid = visiblePayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const nextDue = visibleFees.filter((f) => f.status !== "paid").sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
  const latestPayment = visiblePayments.slice().sort((a, b) => new Date(b.paymentDate || b.createdAt || 0).getTime() - new Date(a.paymentDate || a.createdAt || 0).getTime())[0];

  const receiptChild = (payment: any) => children.find((item) => String(item._id) === String(payment.studentId?._id || payment.studentId || childId)) || selectedChild || payment.studentId;
  const printReceipt = async (payment: any) => {
    const id = String(payment._id || payment.receiptNumber || Date.now());
    setPrintingId(id);
    try { await printPremiumFeeReceipt(payment, receiptChild(payment), institutionProfile); }
    finally { setPrintingId(""); }
  };

  return <div className="space-y-5">
    <PageHeader title="My Fees" description="View dues, paid amount and premium professional money receipts with QR verification." icon={WalletCards} status={<Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Premium Receipt</Badge>} actions={[<Button key="refresh" size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {children.length > 1 && <section className="rounded-lg border bg-card p-4 shadow-sm"><label className="mb-2 block text-sm font-medium">Select Child</label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-auto" value={childId} onChange={(e) => setChildId(e.target.value)}>{children.map((c) => <option key={c._id} value={c._id}>{c.userId?.name || c.name}</option>)}</select></section>}
    <div className="grid gap-4 md:grid-cols-4"><StatCard label="Due Amount" value={formatCurrency(due)} tone="rose" /><StatCard label="Paid Amount" value={formatCurrency(paid)} tone="emerald" /><StatCard label="Next Payment Date" value={nextDue ? formatDate(nextDue.dueDate) : "N/A"} /><StatCard label="Premium Receipts" value={visiblePayments.length} tone="blue" /></div>
    {latestPayment && <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5 shadow-sm"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /><span className="font-semibold">Latest payment received</span></div><p className="mt-1 text-sm text-muted-foreground">Receipt: {latestPayment.receiptNumber || "-"} • {formatCurrency(latestPayment.amount || 0)} • {formatDate(latestPayment.paymentDate || latestPayment.createdAt)}</p><p className="mt-1 text-xs font-semibold text-amber-700">Premium receipt includes school branding, QR verification, payment table, amount in words, signatures and seal.</p></div><Button size="sm" onClick={() => printReceipt(latestPayment)} disabled={!!printingId}><Download className="mr-2 h-4 w-4" />Download Premium Receipt</Button></div></section>}
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="border-b p-4"><h2 className="font-semibold">Fee Details</h2><p className="text-sm text-muted-foreground">All assigned fees and due status.</p></div><div className="hidden md:block"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Fee</TableHead><TableHead>Amount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading fees...</TableCell></TableRow> : visibleFees.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No fee records found.</TableCell></TableRow> : visibleFees.map((f) => <TableRow key={f._id}><TableCell className="capitalize font-medium">{f.type} {f.month} {f.year}</TableCell><TableCell>{formatCurrency(f.amount || 0)}</TableCell><TableCell>{formatDate(f.dueDate)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{f.status}</Badge></TableCell></TableRow>)}</TableBody></Table></div><div className="grid gap-3 p-4 md:hidden">{visibleFees.length === 0 ? <p className="text-center text-sm text-muted-foreground">No fee records found.</p> : visibleFees.map((f) => <div key={f._id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><p className="font-medium capitalize">{f.type} {f.month} {f.year}</p><Badge variant="outline" className="capitalize">{f.status}</Badge></div><p className="mt-2 text-sm text-muted-foreground">Due: {formatDate(f.dueDate)}</p><p className="mt-1 font-semibold">{formatCurrency(f.amount || 0)}</p></div>)}</div></section>
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><div className="border-b p-4"><h2 className="font-semibold">Premium Payment Receipts</h2><p className="text-sm text-muted-foreground">Premium receipt includes institution branding, QR code, amount in words, detailed payment table, signatures and seal. Mobile devices will download PDF if print is not supported.</p></div><div className="hidden md:block"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Receipt</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading payments...</TableCell></TableRow> : visiblePayments.length === 0 ? <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No payment receipts found.</TableCell></TableRow> : visiblePayments.map((p) => <TableRow key={p._id}><TableCell className="font-medium">{p.receiptNumber || "-"}</TableCell><TableCell>{formatCurrency(p.amount || 0)}</TableCell><TableCell>{p.paymentMethod || "-"}</TableCell><TableCell>{formatDate(p.paymentDate || p.createdAt)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{p.status || "paid"}</Badge></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => printReceipt(p)} disabled={printingId === String(p._id)}><Download className="mr-2 h-4 w-4" />{printingId === String(p._id) ? "Opening..." : "Premium Receipt"}</Button></TableCell></TableRow>)}</TableBody></Table></div><div className="grid gap-3 p-4 md:hidden">{visiblePayments.length === 0 ? <p className="text-center text-sm text-muted-foreground">No payment receipts found.</p> : visiblePayments.map((p) => <div key={p._id} className="rounded-lg border p-3"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{p.receiptNumber || "Receipt"}</p><p className="text-sm text-muted-foreground">{formatDate(p.paymentDate || p.createdAt)} • {p.paymentMethod || "-"}</p></div><Badge variant="outline">{p.status || "paid"}</Badge></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-lg font-bold">{formatCurrency(p.amount || 0)}</p><Button size="sm" variant="outline" onClick={() => printReceipt(p)} disabled={printingId === String(p._id)}><FileText className="mr-2 h-4 w-4" />Premium</Button></div></div>)}</div></section>
  </div>;
}
