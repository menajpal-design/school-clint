"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSquare, Send } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendancePresentSmsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [date, setDate] = useState(today());
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [rollFrom, setRollFrom] = useState("");
  const [rollTo, setRollTo] = useState("");
  const [allClasses, setAllClasses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<any>(null);

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = useMemo(() => selectedClass?.sections?.filter((item) => item.isActive !== false) || [], [selectedClass]);

  const loadClasses = useCallback(async () => {
    const data = await api.academic.classes.getAll() as { classes?: ClassItem[] };
    setClasses(data.classes || []);
  }, []);

  useEffect(() => {
    loadClasses().catch(() => setClasses([]));
  }, [loadClasses]);

  const sendSms = async () => {
    setLoading(true);
    setMessage("");
    setResult(null);
    try {
      const response = await api.attendance.sendPresentSms({
        date,
        allClasses,
        classId: allClasses ? undefined : classId || undefined,
        sectionId: allClasses ? undefined : sectionId || undefined,
        rollFrom: rollFrom || undefined,
        rollTo: rollTo || undefined,
      });
      setResult(response);
      setMessage(response?.message || "Present SMS completed.");
    } catch (error: any) {
      setMessage(error?.message || "Present SMS পাঠাতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Present SMS"
        description="Send present attendance SMS to guardian numbers by class, section, roll range or all classes."
        icon={MessageSquare}
        actions={[
          <Button key="send" onClick={sendSms} disabled={loading} className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            {loading ? "Sending..." : "Send SMS"}
          </Button>,
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-6">
          <Field label="Date">
            <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </Field>
          <Field label="Class">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={classId} onChange={(event) => { setClassId(event.target.value); setSectionId(""); }} disabled={allClasses}>
              <option value="">All assigned classes</option>
              {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Section">
            <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={sectionId} onChange={(event) => setSectionId(event.target.value)} disabled={allClasses || !classId}>
              <option value="">All sections</option>
              {sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </Field>
          <Field label="Roll From">
            <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={rollFrom} onChange={(event) => setRollFrom(event.target.value.replace(/\D/g, ""))} placeholder="1" />
          </Field>
          <Field label="Roll To">
            <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={rollTo} onChange={(event) => setRollTo(event.target.value.replace(/\D/g, ""))} placeholder="50" />
          </Field>
          <label className="flex items-end gap-2 rounded-md border border-border px-3 py-2 text-sm">
            <Checkbox checked={allClasses} onCheckedChange={(checked) => { setAllClasses(Boolean(checked)); setClassId(""); setSectionId(""); }} />
            <span className="pb-0.5">All classes</span>
          </label>
        </div>
        {message && <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>}
      </section>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Matched" value={result?.totalMatchedStudents || 0} loading={loading} />
        <StatCard label="Present" value={result?.presentStudents || 0} tone="emerald" loading={loading} />
        <StatCard label="Sent" value={result?.sent || 0} tone="emerald" loading={loading} />
        <StatCard label="Failed" value={result?.failed || 0} tone="rose" loading={loading} />
        <StatCard label="Skipped" value={result?.skipped || 0} tone="amber" loading={loading} />
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Student</TableHead>
              <TableHead>Guardian Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!result?.results?.length ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-slate-500">No SMS result yet.</TableCell></TableRow>
            ) : result.results.map((item: any) => (
              <TableRow key={`${item.studentId}-${item.guardianPhone}`}>
                <TableCell className="font-medium">{item.studentName}</TableCell>
                <TableCell>{item.guardianPhone}</TableCell>
                <TableCell className="capitalize">{item.status}</TableCell>
                <TableCell>{item.reason || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}
