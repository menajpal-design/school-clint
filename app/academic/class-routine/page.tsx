"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";

const days = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];

const emptyForm = {
  classId: "",
  sectionId: "",
  subjectId: "",
  teacherId: "",
  dayOfWeek: "saturday",
  periodName: "1st Period",
  startTime: "09:00",
  endTime: "09:45",
  room: "",
  note: "",
  isActive: true,
  isPublic: false,
};

export default function ClassRoutinePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item: any) => item.isActive !== false) || [];
  const classSubjects = useMemo(() => subjects.filter((subject) => !form.classId || subject.classId?._id === form.classId), [subjects, form.classId]);

  const loadLookups = async () => {
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
      const data = await apiClient.get(`/class-routines?${params.toString()}`) as any;
      setRoutines(data.routines || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load class routines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLookups().catch(() => undefined); }, []);
  useEffect(() => { loadRoutines(); }, [classId, sectionId]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, classId: classId || classes[0]?._id || "", sectionId: sectionId || "" });
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
      periodName: routine.periodName || "1st Period",
      startTime: routine.startTime || "09:00",
      endTime: routine.endTime || "09:45",
      room: routine.room || "",
      note: routine.note || "",
      isActive: routine.isActive !== false,
      isPublic: routine.isPublic === true,
    });
    setOpen(true);
  };

  const saveRoutine = async () => {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      if (editing) await apiClient.put(`/class-routines/${editing._id}`, form);
      else await apiClient.post('/class-routines', form);
      setOpen(false);
      setMessage(editing ? "Class routine updated." : "Class routine created.");
      await loadRoutines();
    } catch (err: any) {
      setError(err?.message || "Failed to save routine");
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

  const grouped = days.map((day) => ({ day, items: routines.filter((routine) => routine.dayOfWeek === day) }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Class Routine"
        description="Create and manage class-wise weekly routine. Public routines can be shown to students and parents."
        icon={CalendarDays}
        status={<Badge variant="outline">{routines.length} routine items</Badge>}
        actions={[
          <Button key="refresh" size="sm" variant="outline" onClick={loadRoutines}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
          <Button key="add" size="sm" onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Add Routine</Button>,
        ]}
      />

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={classId} onChange={(e) => { setClassId(e.target.value); setSectionId(""); }}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-medium">Section</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={sectionId} onChange={(e) => setSectionId(e.target.value)}><option value="">All sections</option>{sections.map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <div className="flex items-end"><Button variant="outline" onClick={loadRoutines} className="w-full">Apply Filter</Button></div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      <section className="rounded-lg border bg-card shadow-sm">
        <Table>
          <TableHeader><TableRow className="bg-muted"><TableHead>Day</TableHead><TableHead>Time</TableHead><TableHead>Period</TableHead><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead>Teacher</TableHead><TableHead>Room</TableHead><TableHead>Public</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">Loading routines...</TableCell></TableRow> : routines.length === 0 ? <TableRow><TableCell colSpan={9} className="h-32 text-center text-muted-foreground">No class routine found.</TableCell></TableRow> : grouped.flatMap(({ day, items }) => items.map((routine: any, index: number) => (
              <TableRow key={routine._id}>
                <TableCell className="capitalize font-medium">{index === 0 ? day : ""}</TableCell>
                <TableCell>{routine.startTime} - {routine.endTime}</TableCell>
                <TableCell>{routine.periodName}</TableCell>
                <TableCell>{routine.classId?.name || "-"}{routine.sectionId?.name ? ` (${routine.sectionId.name})` : ""}</TableCell>
                <TableCell>{routine.subjectId?.name || "-"}</TableCell>
                <TableCell>{routine.teacherId?.name || "-"}</TableCell>
                <TableCell>{routine.room || "-"}</TableCell>
                <TableCell><Badge variant="outline" className={routine.isPublic ? "border-blue-200 bg-blue-50 text-blue-700" : ""}>{routine.isPublic ? "Public" : "Private"}</Badge></TableCell>
                <TableCell><div className="flex justify-end gap-2"><Button size="icon" variant="outline" onClick={() => openEdit(routine)}><Edit2 className="h-4 w-4" /></Button><Button size="icon" variant="destructive" onClick={() => setDeleteTarget(routine)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
              </TableRow>
            ))) }
          </TableBody>
        </Table>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Class Routine" : "Add Class Routine"}</DialogTitle><DialogDescription>Set class, subject, teacher, day and time.</DialogDescription></DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Class"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, sectionId: "", subjectId: "" })}><option value="">Select class</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
            <Field label="Section"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}><option value="">All sections</option>{(classes.find((item) => item._id === form.classId)?.sections || []).map((item: any) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
            <Field label="Subject"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}><option value="">Select subject</option>{classSubjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></Field>
            <Field label="Teacher"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}><option value="">Select teacher</option>{teachers.map((item: any) => <option key={item.userId?._id || item._id} value={item.userId?._id || item._id}>{item.userId?.name || item.name || item.employeeId}</option>)}</select></Field>
            <Field label="Day"><select className="h-10 w-full rounded-md border px-3 text-sm" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>{days.map((day) => <option key={day} value={day}>{day}</option>)}</select></Field>
            <Field label="Period"><Input value={form.periodName} onChange={(e) => setForm({ ...form, periodName: e.target.value })} /></Field>
            <Field label="Start Time"><Input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} /></Field>
            <Field label="End Time"><Input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} /></Field>
            <Field label="Room"><Input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} /></Field>
            <Field label="Note"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <label className="flex items-center gap-3 rounded-lg border p-3 md:col-span-2"><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} /><span className="text-sm font-medium">Public routine — students/parents can see</span></label>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={saving || !form.classId || !form.dayOfWeek || !form.startTime || !form.endTime} onClick={saveRoutine}>{saving ? "Saving..." : "Save Routine"}</Button></DialogFooter>
        </DialogContent>
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
