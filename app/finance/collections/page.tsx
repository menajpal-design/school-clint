"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Download, ScanLine, Search } from "lucide-react";

import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { BarChartCard } from '@/components/charts/BarChartCard';
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, apiClient } from "@/lib/api";
import { printHtml } from "@/lib/export-utils";
import { formatCurrency, formatDate } from "@/lib/utils";

const financeApi = {
  collections: (params: any) => apiClient.get('/finance/collections', { params }),
  collectPayment: (data: any) => apiClient.post('/finance/collections/collect', data),
};
const dueOf = (student: any) => Number(student?.dueAmount || 0);

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
    setLoading(true); setError("");
    try {
      const data = await financeApi.collections({ search }) as any;
      const rows = data.students || [];
      setStudents(rows);
      if (selected?._id) {
        const fresh = rows.find((s: any) => String(s._id) === String(selected._id));
        if (fresh) { setSelected(fresh); setAmount(Math.max(0, dueOf(fresh))); }
      }
    } catch (err: any) { setError(err?.message || "Failed to load students."); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadInstitution(); load().catch(() => undefined); }, []);
  const dueStudents = useMemo(() => students.filter((s) => dueOf(s) > 0), [students]);
  const noDueStudents = useMemo(() => students.filter((s) => dueOf(s) <= 0), [students]);
  const topDues = useMemo(() => dueStudents.slice().sort((a,b)=>dueOf(b)-dueOf(a)).slice(0,8).map((s:any)=>({ name: s.userId?.name || s.rollNumber || 'Student', value: dueOf(s) })), [dueStudents]);
  const collect = async () => {
    if (!selected) return setError("Select a student first.");
    const dueAmount = dueOf(selected);
    if (dueAmount <= 0) return setError("This student has no due fee. Collection is not allowed.");
    if (!amount || amount <= 0) return setError("Enter a valid payment amount.");
    if (amount > dueAmount) return setError("Payment amount cannot be greater than due amount.");
    setSaving(true); setError(""); setMessage("");
    try {
      const data = await financeApi.collectPayment({ studentId: selected._id, amount, paymentMethod, notes }) as any;
      setReceipt(data.payment); setMessage("Offline fee collected successfully. Receipt is ready and student profile history updated.");
      await load();
      setSelected((current: any) => current ? { ...current, dueAmount: Math.max(0, Number(current.dueAmount || 0) - Number(amount || 0)) } : current);
      setAmount(0);
    } catch (err: any) { setError(err?.message || "Failed to collect payment."); }
    finally { setSaving(false); }
  };
  const choose = (student: any) => {
    const dueAmount = dueOf(student);
    setSelected(student);
    setAmount(dueAmount > 0 ? dueAmount : 0);
    setReceipt(null); setMessage("");
    setError(dueAmount <= 0 ? "This student has no due fee. Select a student with due amount." : "");
  };
  const printReceipt = async () => {
    if (!receipt) return;
    await loadInstitution();
    const studentName = receipt.studentId?.userId?.name || selected?.userId?.name || "-";
    const roll = receipt.studentId?.rollNumber || selected?.rollNumber || "-";
    const cls = receipt.studentId?.classId?.name || selected?.classId?.name || "-";
    const section = receipt.studentId?.sectionId?.name || selected?.sectionId?.name || "-";
    await printHtml("Professional Fee Receipt", `<main class="print-card"><p class="print-title">Official Fee Collection Receipt</p><p class="print-muted">Receipt No: ${receipt.receiptNumber || receipt.receiptNo || "-"}</p><div class="print-grid"><div class="print-row"><strong>Student</strong>${studentName}</div><div class="print-row"><strong>Roll</strong>${roll}</div><div class="print-row"><strong>Class</strong>${cls}</div><div class="print-row"><strong>Section</strong>${section}</div><div class="print-row"><strong>Paid Amount</strong>${formatCurrency(receipt.amount || 0)}</div><div class="print-row"><strong>Payment Method</strong>${receipt.paymentMethod || paymentMethod || "cash"}</div><div class="print-row"><strong>Payment Date</strong>${formatDate(receipt.paymentDate || receipt.createdAt || new Date())}</div><div class="print-row"><strong>Collected By</strong>${receipt.collectedBy?.name || "School Office"}</div><div class="print-row"><strong>Note</strong>${receipt.notes || receipt.note || notes || "Offline fee collection"}</div></div><div class="signature"><div>Accounts / Class Teacher</div><div>Guardian Signature</div></div></main>`, "", JSON.stringify({ type: "fee_receipt", receiptNumber: receipt.receiptNumber || receipt.receiptNo, student: studentName, amount: receipt.amount, date: receipt.paymentDate || receipt.createdAt || new Date() }));
  };

  return <div className="space-y-5">
    <PageHeader title="Fees Collect" description="Class teacher can collect only assigned class fees. Head, Assistant Head and Finance Officer can collect all classes. Receipts are added to student fee profile history." icon={CreditCard} actions={[{ label: "Scan ID Card", icon: ScanLine, onClick: () => setScanOpen(true) }]} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="flex flex-col gap-2 sm:flex-row"><Input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search by name, roll, guardian phone, class or ID card number" /><Button onClick={load} disabled={loading} className="w-full sm:w-auto"><Search className="mr-2 h-4 w-4" />{loading ? "Searching..." : "Search"}</Button></div><div className="mt-4"><BarChartCard title="Top due students" data={topDues} /></div><div className="mt-3 grid gap-2 md:grid-cols-3">{students.length === 0 ? <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground md:col-span-3">No student found. Search by name, roll or ID card number.</div> : dueStudents.map((s) => <button key={s._id} onClick={() => choose(s)} className={`rounded-lg border p-3 text-left transition hover:bg-slate-50 ${selected?._id === s._id ? "border-primary bg-primary/5" : "border-slate-200"}`}><div className="font-medium">{s.userId?.name || "Unnamed student"}</div><div className="text-sm text-slate-500">Roll {s.rollNumber || "-"} · {s.classId?.name || "-"} · Due {formatCurrency(s.dueAmount || 0)}</div></button>)}</div>{noDueStudents.length > 0 && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold text-slate-700">No due students</p><div className="mt-2 grid gap-2 md:grid-cols-3">{noDueStudents.map((s) => <button key={s._id} onClick={() => choose(s)} className="rounded-lg border border-slate-200 bg-white p-3 text-left opacity-75"><div className="font-medium">{s.userId?.name || "Unnamed student"}</div><div className="text-sm text-slate-500">Roll {s.rollNumber || "-"} · {s.classId?.name || "-"} · Due {formatCurrency(0)}</div></button>)}</div></div>}</section>
    {selected && <div className="grid gap-5 lg:grid-cols-2"><Card><CardContent className="p-5"><h2 className="font-semibold">{selected.userId?.name || "Unnamed student"}</h2><p className="mt-1 text-sm text-slate-500">Roll {selected.rollNumber || "-"} · {selected.classId?.name || "-"} · Section {selected.sectionId?.name || "-"}</p><p className="mt-4 text-2xl font-semibold">{formatCurrency(selected.dueAmount || 0)}</p><p className="text-sm text-slate-500">Due amount</p></CardContent></Card><Card><CardContent className="space-y-3 p-5"><Input type="number" min={1} max={dueOf(selected) || 0} value={amount} disabled={dueOf(selected) <= 0} onChange={(e) => setAmount(Math.min(Number(e.target.value), dueOf(selected)))} /><select disabled={dueOf(selected) <= 0} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option></select><Input disabled={dueOf(selected) <= 0} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note" /><Button onClick={collect} disabled={saving || dueOf(selected) <= 0 || !amount || amount <= 0} className="w-full">{saving ? "Collecting..." : dueOf(selected) <= 0 ? "No Due Fee" : "Collect Offline Fee"}</Button></CardContent></Card></div>}
    {receipt && <Card><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold">Professional Receipt Ready</h2><p className="text-sm text-slate-500">{receipt.receiptNumber || receipt.receiptNo}</p></div><Button variant="outline" onClick={printReceipt} className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />Print / Download Receipt</Button></div><div className="mt-4 grid gap-2 text-sm md:grid-cols-2"><p>Student: {receipt.studentId?.userId?.name || selected?.userId?.name}</p><p>Amount: {formatCurrency(receipt.amount || 0)}</p><p>Method: {receipt.paymentMethod}</p><p>Date: {formatDate(receipt.paymentDate || receipt.createdAt || new Date())}</p></div></CardContent></Card>}
    <Dialog open={scanOpen} onOpenChange={setScanOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Scan ID Card</DialogTitle><DialogDescription>Scan a student ID card to search and collect fees.</DialogDescription></DialogHeader><WebcamScanner enabled={scanOpen} onScan={(code) => { setSearch(code); setScanOpen(false); setTimeout(() => load(), 100); }} /></DialogContent></Dialog>
  </div>;
}
