"use client";

import { FormEvent, useEffect, useState } from "react";
import { Edit2, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

const empty = { classId: "", studentId: "", type: "monthly", amount: 0, scholarship: 0, discount: 0, month: "January", year: new Date().getFullYear(), dueDate: new Date().toISOString().slice(0,10), status: "pending" };

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);

  const load = async () => {
    const [feeRes, classRes] = await Promise.all([api.finance.fees.getAll() as Promise<any>, api.academic.classes.getAll() as Promise<any>]);
    setFees(feeRes.fees || []);
    setClasses(classRes.classes || []);
  };
  useEffect(() => { load().catch(() => undefined); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (editing) await api.finance.fees.update(editing._id, form);
    else await api.finance.fees.create(form);
    setOpen(false); setEditing(null); setForm(empty); await load();
  };

  return <div className="space-y-5">
    <PageHeader title="Fee Setup" description="Manage class-wise monthly, annual and exam fees with scholarship and discount options." icon={Plus} actions={[{ label: "Add Fee", icon: Plus, onClick: () => { setForm(empty); setEditing(null); setOpen(true); }, active: true }]} />
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Class</TableHead><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Scholarship</TableHead><TableHead>Discount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {fees.map((fee) => <TableRow key={fee._id}><TableCell>{fee.classId?.name || "All / student"}</TableCell><TableCell>{fee.studentId?.userId?.name || fee.studentId?.rollNumber || "-"}</TableCell><TableCell className="capitalize">{fee.type}</TableCell><TableCell>{formatCurrency(fee.amount || 0)}</TableCell><TableCell>{formatCurrency(fee.scholarship || 0)}</TableCell><TableCell>{formatCurrency(fee.discount || 0)}</TableCell><TableCell>{formatDate(fee.dueDate)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{fee.status}</Badge></TableCell><TableCell className="text-right"><Button size="icon" variant="outline" onClick={() => { setEditing(fee); setForm({ ...empty, ...fee, classId: fee.classId?._id || "", studentId: fee.studentId?._id || "", dueDate: fee.dueDate?.slice?.(0,10) || empty.dueDate }); setOpen(true); }}><Edit2 className="h-4 w-4" /></Button></TableCell></TableRow>)}
      </TableBody></Table>
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Edit fee" : "Add fee"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={submit}>
      <Select label="Class" value={form.classId} onChange={(v) => setForm({ ...form, classId: v })}><option value="">Class-wise / optional</option>{classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select>
      <Select label="Fee type" value={form.type} onChange={(v) => setForm({ ...form, type: v })}><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="exam">Exam</option><option value="tuition">Tuition</option><option value="transport">Transport</option><option value="other">Other</option></Select>
      <div className="grid gap-3 md:grid-cols-3"><Field label="Amount"><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field><Field label="Scholarship"><Input type="number" value={form.scholarship} onChange={(e) => setForm({ ...form, scholarship: Number(e.target.value) })} /></Field><Field label="Discount"><Input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} /></Field></div>
      <div className="grid gap-3 md:grid-cols-3"><Field label="Month"><Input value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} /></Field><Field label="Year"><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></Field><Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field></div>
      <DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save Fee</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <Field label={label}><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select></Field>; }
