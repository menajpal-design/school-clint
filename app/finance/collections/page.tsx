"use client";

import { useEffect, useState } from "react";
import { CreditCard, Printer, ScanLine, Search } from "lucide-react";

import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function CollectionsPage() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<any>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadInstitution = async () => {
    try {
      const data = await api.institution.profile() as any;
      if (data?.institution && typeof window !== "undefined") {
        localStorage.setItem("printInstitution", JSON.stringify(data.institution));
        localStorage.setItem("institution", JSON.stringify(data.institution));
      }
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.finance.collections({ search }) as any;
      setStudents(data.students || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load students.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstitution();
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collect = async () => {
    if (!selected) return setError("Select a student first.");
    if (!amount || amount <= 0) return setError("Enter a valid payment amount.");
    if (selected.dueAmount && amount > selected.dueAmount) return setError("Payment amount cannot be greater than due amount.");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await api.finance.payments.create({ studentId: selected._id, amount, paymentMethod, notes }) as any;
      setReceipt(data.payment);
      setMessage("Payment collected successfully. Receipt is ready.");
      await load();
      setSelected((current: any) => current ? { ...current, dueAmount: Math.max(0, Number(current.dueAmount || 0) - Number(amount || 0)) } : current);
    } catch (err: any) {
      setError(err?.message || "Failed to collect payment.");
    } finally {
      setSaving(false);
    }
  };

  const choose = (student: any) => {
    setSelected(student);
    setAmount(Math.max(0, Number(student.dueAmount || 0)));
    setReceipt(null);
    setMessage("");
    setError("");
  };

  const printReceipt = async () => {
    if (!receipt) return;
    await loadInstitution();
    printHtml("Fee Receipt", `
      <main class="print-card">
        <p class="print-title">Fee Receipt</p>
        <p class="print-muted">Receipt No: ${receipt.receiptNumber || "-"}</p>
        <div class="print-grid">
          <div class="print-row"><strong>Student</strong>${receipt.studentId?.userId?.name || selected?.userId?.name || "-"}</div>
          <div class="print-row"><strong>Roll</strong>${receipt.studentId?.rollNumber || selected?.rollNumber || "-"}</div>
          <div class="print-row"><strong>Amount</strong>${formatCurrency(receipt.amount || 0)}</div>
          <div class="print-row"><strong>Method</strong>${receipt.paymentMethod || "-"}</div>
          <div class="print-row"><strong>Date</strong>${formatDate(receipt.paymentDate || new Date())}</div>
          <div class="print-row"><strong>Note</strong>${receipt.notes || notes || "-"}</div>
        </div>
        <div class="signature"><div>Collected By</div><div>Guardian Signature</div></div>
      </main>
    `, "", JSON.stringify({
      type: "fee_receipt",
      receiptNumber: receipt.receiptNumber,
      student: receipt.studentId?.userId?.name || selected?.userId?.name,
      amount: receipt.amount,
      date: receipt.paymentDate || new Date(),
    }));
  };

  return <div className="space-y-5">
    <PageHeader title="Fee Collection" description="Search students, collect dues and generate receipts." icon={CreditCard} actions={[{ label: "Scan ID Card", icon: ScanLine, onClick: () => setScanOpen(true) }]} />

    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search by name, roll or ID card number" />
        <Button onClick={load} disabled={loading} className="w-full sm:w-auto"><Search className="mr-2 h-4 w-4" />{loading ? "Searching..." : "Search"}</Button>
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        {students.length === 0 ? <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground md:col-span-3">No student found. Search by name, roll or ID card number.</div> : students.map((s) => (
          <button key={s._id} onClick={() => choose(s)} className={`rounded-lg border p-3 text-left transition hover:bg-slate-50 ${selected?._id === s._id ? "border-primary bg-primary/5" : "border-slate-200"}`}>
            <div className="font-medium">{s.userId?.name || "Unnamed student"}</div>
            <div className="text-sm text-slate-500">Roll {s.rollNumber || "-"} · Due {formatCurrency(s.dueAmount || 0)}</div>
          </button>
        ))}
      </div>
    </section>

    {selected && <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardContent className="p-5"><h2 className="font-semibold">{selected.userId?.name}</h2><p className="mt-1 text-sm text-slate-500">Roll {selected.rollNumber || "-"} · {selected.classId?.name || "-"} · Section {selected.sectionId?.name || "-"}</p><p className="mt-4 text-2xl font-semibold">{formatCurrency(selected.dueAmount || 0)}</p><p className="text-sm text-slate-500">Due amount</p></CardContent></Card>
      <Card><CardContent className="space-y-3 p-5">
        <Input type="number" min={1} max={selected.dueAmount || undefined} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
        <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option></select>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note" />
        <Button onClick={collect} disabled={saving || !amount || amount <= 0} className="w-full">{saving ? "Collecting..." : "Collect Payment"}</Button>
      </CardContent></Card>
    </div>}

    {receipt && <Card><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold">Receipt Preview</h2><p className="text-sm text-slate-500">{receipt.receiptNumber}</p></div><Button variant="outline" onClick={printReceipt} className="w-full sm:w-auto"><Printer className="mr-2 h-4 w-4" />Print Receipt</Button></div><div className="mt-4 grid gap-2 text-sm md:grid-cols-2"><p>Student: {receipt.studentId?.userId?.name || selected?.userId?.name}</p><p>Amount: {formatCurrency(receipt.amount || 0)}</p><p>Method: {receipt.paymentMethod}</p><p>Date: {formatDate(receipt.paymentDate || new Date())}</p></div></CardContent></Card>}

    <Dialog open={scanOpen} onOpenChange={setScanOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Scan ID Card</DialogTitle></DialogHeader><WebcamScanner enabled={scanOpen} onScan={(code) => { setSearch(code); setScanOpen(false); setTimeout(() => load(), 100); }} /></DialogContent></Dialog>
  </div>;
}