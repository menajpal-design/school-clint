"use client";

import { useEffect, useState } from "react";
import { CreditCard, Printer, ScanLine, Search } from "lucide-react";

import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
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

  const load = async () => {
    const data = await api.finance.collections({ search }) as any;
    setStudents(data.students || []);
  };
  useEffect(() => { load().catch(() => undefined); }, []);

  const collect = async () => {
    if (!selected) return;
    const data = await api.finance.payments.create({ studentId: selected._id, amount, paymentMethod, notes }) as any;
    setReceipt(data.payment);
  };

  const choose = (student: any) => { setSelected(student); setAmount(student.dueAmount || 0); };

  return <div className="space-y-5">
    <PageHeader title="Fee Collection" description="Search students, collect dues and generate receipts." icon={CreditCard} actions={[{ label: "Scan ID Card", icon: ScanLine, onClick: () => setScanOpen(true) }]} />
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, roll or ID card number" /><Button onClick={load}><Search className="mr-2 h-4 w-4" />Search</Button></div>
      <div className="mt-3 grid gap-2 md:grid-cols-3">{students.map((s) => <button key={s._id} onClick={() => choose(s)} className="rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50"><div className="font-medium">{s.userId?.name}</div><div className="text-sm text-slate-500">Roll {s.rollNumber} · Due {formatCurrency(s.dueAmount || 0)}</div></button>)}</div>
    </section>
    {selected && <div className="grid gap-5 lg:grid-cols-2">
      <Card><CardContent className="p-5"><h2 className="font-semibold">{selected.userId?.name}</h2><p className="mt-1 text-sm text-slate-500">Roll {selected.rollNumber} · {selected.classId?.name} · Section {selected.sectionId?.name}</p><p className="mt-4 text-2xl font-semibold">{formatCurrency(selected.dueAmount || 0)}</p><p className="text-sm text-slate-500">Due amount</p></CardContent></Card>
      <Card><CardContent className="space-y-3 p-5"><Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}><option value="cash">Cash</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="card">Card</option><option value="bank_transfer">Bank transfer</option></select><Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note" /><Button onClick={collect}>Collect Payment</Button></CardContent></Card>
    </div>}
    {receipt && <Card><CardContent className="p-5"><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold">Receipt Preview</h2><p className="text-sm text-slate-500">{receipt.receiptNumber}</p></div><Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print Receipt</Button></div><div className="mt-4 grid gap-2 text-sm md:grid-cols-2"><p>Student: {receipt.studentId?.userId?.name}</p><p>Amount: {formatCurrency(receipt.amount || 0)}</p><p>Method: {receipt.paymentMethod}</p><p>Date: {formatDate(receipt.paymentDate)}</p></div></CardContent></Card>}
    <Dialog open={scanOpen} onOpenChange={setScanOpen}><DialogContent className="max-w-md"><DialogHeader><DialogTitle>Scan ID Card</DialogTitle></DialogHeader><WebcamScanner enabled={scanOpen} onScan={(code) => {
      setSearch(code);
      setScanOpen(false);
      // Trigger search after setting the code
      setTimeout(() => load(), 100);
    }} /></DialogContent></Dialog>
  </div>;
}
