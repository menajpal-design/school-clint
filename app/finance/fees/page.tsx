"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit2, Plus } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BarChartCard } from '@/components/charts/BarChartCard';

const feeTypes = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
  { value: "admission", label: "Admission" },
  { value: "re_admission", label: "Re-admission" },
  { value: "exam", label: "Exam" },
  { value: "tuition", label: "Tuition" },
  { value: "session", label: "Session" },
  { value: "registration", label: "Registration" },
  { value: "id_card", label: "ID Card" },
  { value: "admit_card", label: "Admit Card" },
  { value: "library", label: "Library" },
  { value: "laboratory", label: "Laboratory" },
  { value: "transport", label: "Transport" },
  { value: "sports", label: "Sports" },
  { value: "development", label: "Development" },
  { value: "computer", label: "Computer" },
  { value: "hostel", label: "Hostel" },
  { value: "certificate", label: "Certificate" },
  { value: "transfer_certificate", label: "Transfer Certificate" },
  { value: "fine", label: "Fine" },
  { value: "other", label: "Other" },
];

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const labelOfType = (value: string) => feeTypes.find((item) => item.value === value)?.label || String(value || "Other").replace(/_/g, " ");
const empty = { classId: "", studentId: "", type: "monthly", amount: 0, scholarship: 0, discount: 0, month: "All Months", year: new Date().getFullYear(), dueDate: new Date().toISOString().slice(0,10), status: "pending" };

const feeApi = {
  getAll: () => apiClient.get('/finance/fees'),
  create: (data: any) => apiClient.post('/finance/fees', data),
  update: (id: string, data: any) => apiClient.put(`/finance/fees/${id}`, data),
  delete: (id: string) => apiClient.delete(`/finance/fees/${id}`),
};

const normalizeFeeForm = (form: any) => {
  const payload = { ...form };
  payload.month = payload.type === "monthly" ? "All Months" : payload.month || "N/A";
  if (!payload.studentId) delete payload.studentId;
  if (!payload.classId) delete payload.classId;
  return payload;
};

export default function FeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [feeRes, classRes] = await Promise.all([feeApi.getAll() as Promise<any>, api.academic.classes.getAll() as Promise<any>]);
      setFees(feeRes.fees || []);
      setClasses(classRes.classes || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load fee setup.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load().catch(() => undefined); }, []);

  const feesByClass = useMemo(() => {
    const map: Record<string, number> = {};
    fees.forEach((f) => { const name = f.classId?.name || 'General'; map[name] = (map[name] || 0) + Number(f.amount || 0); });
    return Object.keys(map).slice(0,12).map((k) => ({ name: k, value: map[k] }));
  }, [fees]);

  const feesByType = useMemo(() => {
    const map: Record<string, number> = {};
    fees.forEach((f) => { const name = labelOfType(f.type); map[name] = (map[name] || 0) + Number(f.amount || 0); });
    return Object.keys(map).slice(0,12).map((k) => ({ name: k, value: map[k] }));
  }, [fees]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) return setError("Fee amount must be greater than zero.");
    if (Number(form.discount || 0) + Number(form.scholarship || 0) > Number(form.amount || 0)) return setError("Discount and scholarship cannot be greater than amount.");
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = normalizeFeeForm(form);
      if (editing) await feeApi.update(editing._id, payload);
      else await feeApi.create(payload);
      setOpen(false); setEditing(null); setForm(empty); setMessage(editing ? "Fee updated successfully." : "Fee added successfully."); await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save fee.");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (fee: any) => {
    setEditing(fee);
    setForm({ ...empty, ...fee, classId: fee.classId?._id || "", studentId: fee.studentId?._id || "", month: fee.type === "monthly" ? "All Months" : fee.month || "N/A", dueDate: fee.dueDate?.slice?.(0,10) || empty.dueDate });
    setOpen(true);
  };

  const updateType = (value: string) => {
    setForm((current: any) => ({ ...current, type: value, month: value === "monthly" ? "All Months" : current.month === "All Months" ? "January" : current.month }));
  };

  return <div className="space-y-5">
    <PageHeader title="Fee Setup" description="Manage monthly, admission, exam, transport, library, lab and other school fees with scholarship and discount options." icon={Plus} actions={[{ label: "Add Fee", icon: Plus, onClick: () => { setForm(empty); setEditing(null); setOpen(true); }, active: true }]} />
    {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <BarChartCard title="Fees setup by class" data={feesByClass} />
        <BarChartCard title="Fees setup by type" data={feesByType} />
      </div>
      <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Class</TableHead><TableHead>Student</TableHead><TableHead>Type</TableHead><TableHead>Month</TableHead><TableHead>Amount</TableHead><TableHead>Scholarship</TableHead><TableHead>Discount</TableHead><TableHead>Due Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
        {loading ? <TableRow><TableCell colSpan={10} className="h-28 text-center text-slate-500">Loading fees...</TableCell></TableRow> : fees.length === 0 ? <TableRow><TableCell colSpan={10} className="h-28 text-center text-slate-500">No fees configured yet.</TableCell></TableRow> : fees.map((fee) => <TableRow key={fee._id}><TableCell>{fee.classId?.name || "All / student"}</TableCell><TableCell>{fee.studentId?.userId?.name || fee.studentId?.rollNumber || "-"}</TableCell><TableCell className="capitalize">{labelOfType(fee.type)}</TableCell><TableCell>{fee.type === "monthly" ? "All Months" : fee.month || "-"}</TableCell><TableCell>{formatCurrency(fee.amount || 0)}</TableCell><TableCell>{formatCurrency(fee.scholarship || 0)}</TableCell><TableCell>{formatCurrency(fee.discount || 0)}</TableCell><TableCell>{formatDate(fee.dueDate)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{fee.status}</Badge></TableCell><TableCell className="text-right"><Button size="icon" variant="outline" onClick={() => openEdit(fee)}><Edit2 className="h-4 w-4" /></Button></TableCell></TableRow>)}
      </TableBody></Table>
    </section>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Edit fee" : "Add fee"}</DialogTitle><DialogDescription>{form.type === "monthly" ? "Monthly class fee applies equally to every month of the selected year. No month selection is needed." : "Set fee amount, applicable period, scholarship and discount."}</DialogDescription></DialogHeader><form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 md:grid-cols-2"><Select label="Class" value={form.classId} onChange={(v) => setForm({ ...form, classId: v })}><option value="">Class-wise / optional</option>{classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select>
      <Select label="Fee type" value={form.type} onChange={updateType}>{feeTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</Select></div>
      {form.type === "monthly" && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">মাসিক চার্জ ক্লাসের জন্য বছরে সব মাসেই সমান থাকবে। তাই মাস সিলেক্ট করার দরকার নেই।</div>}
      {form.type !== "monthly" && <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{labelOfType(form.type)} fee one-time বা selected month/year অনুযায়ী due হবে। দরকার হলে Month field-এ month/term নাম লিখুন।</div>}
      <div className="grid gap-3 md:grid-cols-3"><Field label="Amount"><Input type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field><Field label="Scholarship"><Input type="number" min={0} value={form.scholarship} onChange={(e) => setForm({ ...form, scholarship: Number(e.target.value) })} /></Field><Field label="Discount"><Input type="number" min={0} value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} /></Field></div>
      <div className="grid gap-3 md:grid-cols-3">{form.type !== "monthly" && <Field label="Month / Term"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={monthNames.includes(form.month) ? form.month : "custom"} onChange={(e) => setForm({ ...form, month: e.target.value === "custom" ? "" : e.target.value })}><option value="custom">Custom / Term</option>{monthNames.map((m) => <option key={m} value={m}>{m}</option>)}</select><Input className="mt-2" value={form.month || ""} onChange={(e) => setForm({ ...form, month: e.target.value })} placeholder="e.g. First Term / January" /></Field>}<Field label="Year"><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></Field><Field label="Due date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field></div>
      <DialogFooter><Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Fee"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <Field label={label}><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(e) => onChange(e.target.value)}>{children}</select></Field>; }
