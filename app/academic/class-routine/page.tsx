"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Download, Edit2, FileText, Plus, RefreshCw, Trash2, XCircle } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, apiClient } from "@/lib/api";
import { downloadElementPdf } from "@/lib/export-utils";
import { useAuth } from "@/hooks/useAuth";

const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const periods = ["1", "2", "3", "4", "Break", "5", "6", "7"];
const headRoles = ["head", "assistant_head", "admin", "super_admin"];
const proposalRoles = ["class_teacher", "subject_teacher", "teacher"];
const viewOnlyRoles = ["student", "parent"];

const emptyForm = {
  classId: "",
  sectionId: "",
  subjectId: "",
  teacherId: "",
  dayOfWeek: "saturday",
  periodName: "1",
  startTime: "08:00",
  endTime: "08:40",
  room: "",
  note: "",
  proposalNote: "",
  isActive: true,
  isPublic: false,
  status: "proposed",
};

const prettyDay = (day: string) => day.charAt(0).toUpperCase() + day.slice(1);
const periodSort = (value: string) => value.toLowerCase().includes("break") ? 4.5 : Number(String(value).replace(/[^0-9]/g, "")) || 99;

export default function ClassRoutinePage() {
  const { user } = useAuth();
  const role = user?.role || "";
  const canApprove = headRoles.includes(role);
  const canPropose = proposalRoles.includes(role) || canApprove;
  const isViewOnly = viewOnlyRoles.includes(role);

  const printRef = useRef<HTMLDivElement | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [statusFilter, setStatusFilter] = useState(canApprove ? "" : "approved");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [approvalTarget, setApprovalTarget] = useState<any>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvalPublic, setApprovalPublic] = useState(true);
  const [form, setForm] = useState<any>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item: any) => item.isActive !== false) || [];
  const formClass = classes.find((item) => item._id === form.classId);
  const classSubjects = useMemo(() => subjects.filter((subject) => !form.classId || subject.classId?._id === form.classId || subject.classId === form.classId), [subjects, form.classId]);
  const filteredRoutines = routines.filter((routine) => !statusFilter || routine.status === statusFilter);
  const grouped = days.map((day) => ({ day, items: filteredRoutines.filter((routine) => routine.dayOfWeek === day).sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))) }));
  const printPeriods = useMemo(() => {
    const fromData = Array.from(new Set(filteredRoutines.map((item) => item.periodName || "1")));
    const merged = Array.from(new Set([...periods, ...fromData]));
    return merged.sort((a, b) => periodSort(a) - periodSort(b));
  }, [filteredRoutines]);

  const loadLookups = async () => {
    if (isViewOnly) return;
    const [classResponse, subjectResponse, teacherResponse] = await Promise.all([
      api.academic.classes.getAll() as Promise<any>,
      api.academic.subjects.getAll() as Promise<any>,
      api.teachers.getAll() as Promise<any>,
    ]);
    setClasses(classResponse.classes || []);
    setSubjects(subjectResponse.subjects || []);
    setTeachers(teacherResponse.teachers || []);
    const firstClass = classResponse.classes?.[0]?._id || "";
    setClassId((current) => current || firstClass);
  };

  const loadRoutines = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (classId) params.set("classId", classId);
      if (sectionId) params.set("sectionId", sectionId);
      if (statusFilter && !isViewOnly) params.set("status", statusFilter);
      const endpoint = isViewOnly ? `/class-routines/my?${params.toString()}` : `/class-routines?${params.toString()}`;
      const data = await apiClient.get(endpoint) as any;
      setRoutines(data.routines || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load class routines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLookups().catch(() => undefined); }, [isViewOnly]);
  useEffect(() => { loadRoutines(); }, [classId, sectionId, statusFilter, isViewOnly]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, classId: classId || classes[0]?._id || "", sectionId: sectionId || "", status: canApprove ? "approved" : "proposed", isPublic: canApprove });
    setOpen(true);
  };

  const openEdit = (routine: any) => {
    setEditing(routine);
    setForm({
      classId: routine.classId?._id || routine.classId || "",
      sectionId: routine.sectionId?._id || routine.sectionId || "",
      subjectId: routine.subjectId?._id || routine.subjectId || "",
      teacherId: routine.teacherId?._id || routine.teacherId || "",
      dayOfWeek: routine.dayOfWeek || "saturday",
      periodName: routine.periodName || "1",
      startTime: routine.startTime || "08:00",
      endTime: routine.endTime || "08:40",
      room: routine.room || "",
      note: routine.note || "",
      proposalNote: routine.proposalNote || "",
      isActive: routine.isActive !== false,
      isPublic: routine.isPublic === true,
      status: routine.status || (canApprove ? "approved" : "proposed"),
    });
    setOpen(true);
  };

  const saveRoutine = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = { ...form, status: canApprove ? form.status : "proposed", isPublic: canApprove ? form.isPublic : false };
      if (editing) await apiClient.put(`/class-routines/${editing._id}`, payload);
      else await apiClient.post('/class-routines', payload);
      setOpen(false);
      setMessage(canApprove ? (editing ? "Class routine updated." : "Class routine created and ready for publishing.") : "Class routine proposal submitted for Head/Assistant Head approval.");
      await loadRoutines();
    } catch (err: any) {
      setError(err?.message || "Failed to save routine");
    } finally {
      setSaving(false);
    }
  };

  const updateApproval = async (status: "approved" | "rejected" | "proposed") => {
    if (!approvalTarget) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await apiClient.patch(`/class-routines/${approvalTarget._id}/approval`, { status, approvalNote, isPublic: approvalPublic });
      setApprovalTarget(null);
      setApprovalNote("");
      setMessage(status === "approved" ? "Routine approved and published for students/parents." : status === "rejected" ? "Routine proposal rejected." : "Routine returned to proposal.");
      await loadRoutines();
    } catch (err: any) {
      setError(err?.message || "Failed to update approval");
    } finally {
      setSaving(false);
    }
  };

  const deleteRoutine = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await apiClient.delete(`/class-routines/${deleteTarget._id}`);
      setDeleteTarget(null);
      setMessage("Class routine deleted.");
      await loadRoutines();
    } catch (err: any) {
      setError(err?.message || "Failed to delete routine");
    } finally {
      setSaving(false);
    }
  };

  const downloadPdf = async () => {
    await downloadElementPdf(printRef.current, `class-routine-${selectedClass?.name || "school"}.pdf`);
  };

  const subjectText = (routine: any) => routine?.subjectId?.name || routine?.note || "-";
  const teacherText = (routine: any) => routine?.teacherId?.name || routine?.teacherId?.userId?.name || "";
  const getCell = (day: string, period: string) => filteredRoutines.find((routine) => routine.dayOfWeek === day && String(routine.periodName || "").toLowerCase() === String(period).toLowerCase());

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class Routine"
        description={isViewOnly ? "View and download your published class routine." : "Teachers propose routines; Head or Assistant Head approves and publishes them for students and parents."}
        icon={CalendarDays}
        status={<Badge variant="outline">{filteredRoutines.length} routine items</Badge>}
        actions={[
          <Button key="refresh" size="sm" variant="outline" onClick={loadRoutines}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
          <Button key="download" size="sm" variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" />PDF Download</Button>,
          canPropose && <Button key="add" size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />{canApprove ? "Create Routine" : "Propose Routine"}</Button>,
        ].filter(Boolean) as any}
      />

      {!isViewOnly && <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Section</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={sectionId} onChange={(e) => setSectionId(e.target.value)}><option value="">All sections</option>{sections.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Status</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="">All status</option><option value="proposed">Proposed</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="draft">Draft</option></select></label>
          <div className="flex items-end"><Button variant="outline" onClick={loadRoutines} className="w-full">Apply Filter</Button></div>
        </div>
      </section>}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Routine Preview</h2>
            <p className="text-sm text-muted-foreground">PDF download will use this school routine format.</p>
          </div>
          <Button variant="outline" onClick={downloadPdf}><FileText className="mr-2 h-4 w-4" />Download PDF</Button>
        </div>
        <div className="overflow-x-auto rounded-lg border bg-white p-2">
          <div ref={printRef} className="min-w-[920px] bg-white p-8 text-black">
            <div className="mb-5 text-center">
              <h1 className="text-xl font-bold uppercase tracking-wide">{(user as any)?.institution?.name || "School Class Routine"}</h1>
              <h2 className="mt-1 text-sm font-bold underline">ONLINE CLASS ROUTINE</h2>
            </div>
            <div className="mb-2 grid grid-cols-3 gap-2 text-sm font-semibold">
              <div>ROUTINE: <span className="ml-2">YEAR {new Date().getFullYear()}</span></div>
              <div>CLASS TEACHER: <span className="ml-2">{teacherText(filteredRoutines[0]) || "-"}</span></div>
              <div className="text-right">CLASS: <span className="ml-2">{selectedClass?.name || filteredRoutines[0]?.classId?.name || "-"}</span></div>
            </div>
            <table className="w-full border-collapse text-center text-[11px]">
              <thead>
                <tr>
                  <th className="border border-black p-2">TIME</th>
                  {printPeriods.map((period) => <th key={period} className="border border-black p-1"><div>{period.toLowerCase().includes("break") ? "" : filteredRoutines.find((r) => r.periodName === period)?.startTime || ""}</div></th>)}
                </tr>
                <tr>
                  <th className="border border-black p-2">PERIOD</th>
                  {printPeriods.map((period) => <th key={period} className="border border-black p-2 uppercase">{period}</th>)}
                </tr>
              </thead>
              <tbody>
                {days.map((day) => <tr key={day}>
                  <td className="border border-black p-2 text-left font-bold">{prettyDay(day)}</td>
                  {printPeriods.map((period) => {
                    const routine = getCell(day, period);
                    const isBreak = period.toLowerCase().includes("break");
                    return <td key={`${day}-${period}`} className="border border-black p-2 font-semibold align-middle">{isBreak ? <span className="tracking-[0.45em]">BREAK</span> : <><div>{subjectText(routine)}</div>{teacherText(routine) && <div className="mt-1 text-[9px] font-normal">{teacherText(routine)}</div>}</>}</td>;
                  })}
                </tr>)}
              </tbody>
            </table>
            <div className="mt-4 grid grid-cols-3 text-xs">
              <div>Prepared By: __________________</div>
              <div className="text-center">Approved By: __________________</div>
              <div className="text-right">Head/Assistant Head</div>
            </div>
          </div>
        </div>
      </section>

      {!isViewOnly && <section className="rounded-lg border bg-card shadow-sm">
        <div className="grid gap-3 p-4">
          {loading ? <p className="py-8 text-center text-muted-foreground">Loading routines...</p> : filteredRoutines.length === 0 ? <p className="py-8 text-center text-muted-foreground">No class routine found.</p> : grouped.map(({ day, items }) => items.length > 0 && <div key={day} className="rounded-xl border bg-white p-3">
            <h3 className="mb-3 font-semibold capitalize">{day}</h3>
            <div className="grid gap-2">
              {items.map((routine: any) => <div key={routine._id} className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[1fr_auto]">
                <div className="grid gap-2 md:grid-cols-5">
                  <Info label="Time" value={`${routine.startTime} - ${routine.endTime}`} />
                  <Info label="Period" value={routine.periodName} />
                  <Info label="Class" value={`${routine.classId?.name || "-"}${routine.sectionId?.name ? ` (${routine.sectionId.name})` : ""}`} />
                  <Info label="Subject" value={routine.subjectId?.name || "-"} />
                  <Info label="Teacher" value={routine.teacherId?.name || "-"} />
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge variant="outline" className={routine.status === "approved" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : routine.status === "rejected" ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-700"}>{routine.status || "draft"}</Badge>
                  {routine.isPublic && <Badge className="bg-blue-600">Public</Badge>}
                  {canApprove && routine.status !== "approved" && <Button size="sm" onClick={() => { setApprovalTarget(routine); setApprovalPublic(true); }}><CheckCircle2 className="mr-2 h-4 w-4" />Review</Button>}
                  {canApprove && routine.status === "approved" && <Button size="sm" variant="outline" onClick={() => { setApprovalTarget(routine); setApprovalPublic(routine.isPublic === true); }}><CheckCircle2 className="mr-2 h-4 w-4" />Update</Button>}
                  {canPropose && <Button size="icon" variant="outline" onClick={() => openEdit(routine)}><Edit2 className="h-4 w-4" /></Button>}
                  {canPropose && <Button size="icon" variant="destructive" onClick={() => setDeleteTarget(routine)}><Trash2 className="h-4 w-4" /></Button>}
                </div>
              </div>)}
            </div>
          </div>)}
        </div>
      </section>}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Class Routine" : canApprove ? "Create Class Routine" : "Propose Class Routine"}</DialogTitle><DialogDescription>Teachers can submit proposal. Head or Assistant Head can approve and publish.</DialogDescription></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Class"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "", subjectId: "" })}><option value="">Select class</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
            <Field label="Section"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}><option value="">All sections</option>{(formClass?.sections || []).map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
            <Field label="Subject"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Select subject</option>{classSubjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
            <Field label="Teacher"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">Select teacher</option>{teachers.map((item: any) => <option key={item.userId?._id || item._id} value={item.userId?._id || item._id}>{item.userId?.name || item.name || item.employeeId}</option>)}</select></Field>
            <Field label="Day"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>{days.map((day) => <option key={day} value={day}>{prettyDay(day)}</option>)}</select></Field>
            <Field label="Period"><Input value={form.periodName} onChange={(e) => setForm({ ...form, periodName: e.target.value })} placeholder="1, 2, 3 or Break" /></Field>
            <Field label="Start Time"><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
            <Field label="End Time"><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
            <Field label="Room"><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
            <Field label="Proposal Note"><Input value={form.proposalNote} onChange={(e) => setForm({ ...form, proposalNote: e.target.value })} /></Field>
            {canApprove && <><Field label="Status"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">Draft</option><option value="proposed">Proposed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></Field><label className="flex items-center gap-3 rounded-lg border p-3"><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} /><span className="text-sm font-medium">Publish for students/parents</span></label></>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving || !form.classId || !form.dayOfWeek || !form.startTime || !form.endTime} onClick={saveRoutine}>{saving ? "Saving..." : canApprove ? "Save Routine" : "Submit Proposal"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(approvalTarget)} onOpenChange={(next) => !next && setApprovalTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Review Routine Proposal</DialogTitle><DialogDescription>Approve to publish for student/parent view or reject for correction.</DialogDescription></DialogHeader><div className="space-y-3"><label className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={approvalPublic} onChange={(e) => setApprovalPublic(e.target.checked)} /><span className="text-sm font-medium">Public after approval</span></label><Input placeholder="Approval note" value={approvalNote} onChange={(e) => setApprovalNote(e.target.value)} /></div><DialogFooter><Button variant="outline" onClick={() => updateApproval("proposed")} disabled={saving}>Return</Button><Button variant="destructive" onClick={() => updateApproval("rejected")} disabled={saving}><XCircle className="mr-2 h-4 w-4" />Reject</Button><Button onClick={() => updateApproval("approved")} disabled={saving}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(next) => !next && setDeleteTarget(null)}>
        <DialogContent><DialogHeader><DialogTitle>Delete routine?</DialogTitle><DialogDescription>This routine item will be removed.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" disabled={saving} onClick={deleteRoutine}>Delete</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium">{label}</span>{children}</label>;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div><div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div><div className="text-sm font-medium text-slate-900">{value || "-"}</div></div>;
}