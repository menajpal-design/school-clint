"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BookOpen, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";
import { SUBJECT_PRESETS } from "@/lib/academic-presets";
import { cn } from "@/lib/utils";

type ClassOption = { _id: string; name: string; grade?: string; academicYear?: string; isActive?: boolean };
type TeacherOption = { _id: string; userId?: { _id: string; name: string; email?: string } };
type SubjectItem = { _id: string; name: string; code: string; type: "core" | "elective" | "optional"; classId?: ClassOption | string; teacherId?: { _id: string; name: string; email?: string } | string; description?: string; creditHours: number; isActive: boolean };
type SubjectForm = { name: string; code: string; type: "core" | "elective" | "optional"; classId: string; teacherId: string; description: string; creditHours: number; isActive: boolean };
type Notice = { type: "success" | "error" | "info"; message: string };

const SUBJECT_CACHE_KEY = "easy-school-subject-cache-v2";
const emptyForm = (): SubjectForm => ({ name: "", code: "", type: "core", classId: "", teacherId: "", description: "", creditHours: 1, isActive: true });
const toast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
  if (typeof window === "undefined") return;
  window.appToast?.({ title, message, type, duration: type === "success" ? 5500 : 7500 });
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { title, message, type, duration: type === "success" ? 5500 : 7500 } }));
};
const getId = (value: any) => String(value?._id || value || "");
const getName = (value: any, fallback = "") => typeof value === "object" && value?.name ? value.name : fallback;
const readCachedSubjects = (): SubjectItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SUBJECT_CACHE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};
const writeCachedSubjects = (items: SubjectItem[]) => {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SUBJECT_CACHE_KEY, JSON.stringify(items)); } catch { /* ignore cache failure */ }
};
const normalizeSubject = (subject: any, classes: ClassOption[], teachers: TeacherOption[]): SubjectItem => {
  const classId = getId(subject.classId);
  const teacherId = getId(subject.teacherId);
  const classItem = classes.find((item) => item._id === classId);
  const teacherUser = teachers.find((item) => item.userId?._id === teacherId || item._id === teacherId)?.userId;
  return {
    _id: String(subject._id || `local-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    name: String(subject.name || "Subject"),
    code: String(subject.code || subject.name || "SUB").toUpperCase(),
    type: ["core", "elective", "optional"].includes(String(subject.type)) ? subject.type : "core",
    classId: typeof subject.classId === "object" && subject.classId?.name ? subject.classId : classItem || subject.classId,
    teacherId: typeof subject.teacherId === "object" && subject.teacherId?.name ? subject.teacherId : teacherUser || subject.teacherId,
    description: subject.description || "",
    creditHours: Number(subject.creditHours) || 1,
    isActive: subject.isActive !== false,
  };
};

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [bulkLines, setBulkLines] = useState("");

  const showNotice = (type: Notice["type"], message: string, title = type === "success" ? "Success" : type === "error" ? "Error" : "Info") => {
    setNotice({ type, message });
    toast(title, message, type);
    if (type === "error") setError(message);
    else setError("");
  };

  const filteredSubjects = useMemo(() => subjects.filter((subject) => {
    const subjectClassId = getId(subject.classId);
    return (classFilter === "all" || subjectClassId === classFilter) && (typeFilter === "all" || subject.type === typeFilter);
  }), [subjects, classFilter, typeFilter]);
  const activeSubjects = useMemo(() => subjects.filter((subject) => subject.isActive !== false).length, [subjects]);

  const loadData = async () => {
    setLoading(true); setError("");
    try {
      const [classResponse, teacherResponse] = await Promise.all([
        api.academic.classes.getAll() as Promise<{ classes: ClassOption[] }>,
        api.teachers.getAll() as Promise<{ teachers: TeacherOption[] }>,
      ]);
      const nextClasses = classResponse.classes || [];
      const nextTeachers = teacherResponse.teachers || [];
      setClasses(nextClasses); setTeachers(nextTeachers);

      let loadedSubjects: any[] = [];
      try {
        const subjectResponse = await api.academic.subjects.getAll() as { subjects: SubjectItem[] };
        loadedSubjects = Array.isArray(subjectResponse.subjects) ? subjectResponse.subjects : [];
      } catch {
        const academicResponse: any = await apiClient.get("/academic").catch(() => ({}));
        loadedSubjects = Array.isArray(academicResponse?.subjects) ? academicResponse.subjects : [];
      }
      let normalized = loadedSubjects.map((item) => normalizeSubject(item, nextClasses, nextTeachers));
      if (!normalized.length) normalized = readCachedSubjects();
      setSubjects(normalized);
      writeCachedSubjects(normalized);
      if (normalized.length) showNotice("success", `✅ Subject list loaded successfully. মোট ${normalized.length}টি subject পাওয়া গেছে।`, "Subjects loaded / লোড হয়েছে");
      else setNotice({ type: "info", message: "ℹ️ এখনো কোনো subject নেই। Add Subject চাপ দিয়ে নতুন subject তৈরি করুন।" });
    } catch (err: any) {
      const cached = readCachedSubjects();
      if (cached.length) {
        setSubjects(cached);
        showNotice("info", `ℹ️ Live API থেকে subject আসেনি, cached ${cached.length}টি subject দেখানো হচ্ছে।`, "Subjects cache loaded");
      } else {
        const message = err?.message || "Failed to load subject data";
        showNotice("error", `❌ Subject list load হয়নি। কারণ: ${message}`, "Subject API Error");
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openAddModal = () => { setEditingSubject(null); setForm({ ...emptyForm(), classId: classes[0]?._id || "" }); setBulkLines(""); setFormOpen(true); };
  const openEditModal = (subject: SubjectItem) => {
    setEditingSubject(subject);
    setForm({ name: subject.name || "", code: subject.code || "", type: subject.type || "core", classId: getId(subject.classId), teacherId: getId(subject.teacherId), description: subject.description || "", creditHours: subject.creditHours || 1, isActive: subject.isActive !== false });
    setFormOpen(true);
  };

  const parseBulkSubjects = () => bulkLines.split(/\n+/).map((line) => line.trim()).filter(Boolean).map((line) => {
    const [name = "", code = "", type = "", classId = "", teacherId = ""] = line.split("|").map((item) => item.trim());
    return { name, code: code || name.toUpperCase().replace(/[^A-Z0-9]+/g, "").slice(0, 10) || `SUB${Date.now().toString().slice(-4)}`, type: (type as SubjectForm["type"]) || form.type, classId: classId || form.classId, teacherId: teacherId || form.teacherId, description: form.description, creditHours: form.creditHours, isActive: form.isActive };
  }).filter((item) => item.name && item.classId);

  const upsertLocalSubjects = (items: any[]) => {
    const normalized = items.map((item) => normalizeSubject(item, classes, teachers));
    let nextList: SubjectItem[] = [];
    setSubjects((current) => {
      const map = new Map(current.map((item) => [item._id, item]));
      normalized.forEach((item) => map.set(item._id, item));
      nextList = Array.from(map.values()).sort((a, b) => String(b._id).localeCompare(String(a._id)));
      writeCachedSubjects(nextList);
      return nextList;
    });
    return normalized.length;
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice(null);
    try {
      if (editingSubject) {
        const response: any = await api.academic.subjects.update(editingSubject._id, form);
        upsertLocalSubjects([response.subject || { ...form, _id: editingSubject._id }]);
        showNotice("success", `✅ Subject update হয়েছে: ${form.name}. List refresh হয়েছে।`, "Subject updated / আপডেট হয়েছে");
      } else {
        const bulkItems = parseBulkSubjects();
        const response: any = await api.academic.subjects.create(bulkItems.length > 0 ? { items: bulkItems } : form);
        const created = Array.isArray(response?.subjects) ? response.subjects : response?.subject ? [response.subject] : bulkItems.length ? bulkItems.map((item, index) => ({ ...item, _id: `local-${Date.now()}-${index}` })) : [{ ...form, _id: `local-${Date.now()}` }];
        const count = upsertLocalSubjects(created);
        showNotice("success", `✅ Subject add হয়েছে। ${count || 1}টি subject save হয়েছে এবং list update হয়েছে।`, "Subject added / যোগ হয়েছে");
      }
      setFormOpen(false);
      loadData().catch(() => undefined);
    } catch (err: any) {
      const message = err?.message || "Failed to save subject";
      showNotice("error", `❌ Subject save হয়নি। কারণ: ${message}`, "Subject Save Failed / সেভ হয়নি");
    } finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return; setSaving(true); setError(""); setNotice(null);
    try {
      await api.academic.subjects.delete(deleteTarget._id);
      const next = subjects.filter((subject) => subject._id !== deleteTarget._id);
      setSubjects(next); writeCachedSubjects(next);
      showNotice("success", `✅ Subject delete হয়েছে: ${deleteTarget.name}.`, "Subject deleted / ডিলিট হয়েছে");
      setDeleteTarget(null);
      loadData().catch(() => undefined);
    } catch (err: any) {
      const message = err?.message || "Failed to delete subject";
      showNotice("error", `❌ Subject delete হয়নি। কারণ: ${message}`, "Subject Delete Failed / ডিলিট হয়নি");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Subject Management" description="Manage subject catalog, class assignment, teacher ownership and subject type." icon={BookOpen} status={<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{activeSubjects} active</Badge>} actions={[<Button key="refresh" variant="outline" size="sm" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>, <Button key="add-subject" size="sm" onClick={openAddModal}><Plus className="mr-2 h-4 w-4" />Add Subject</Button>]} />
      {notice && <div className={cn("rounded-lg border px-4 py-3 text-sm font-medium", notice.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : notice.type === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700")}>{notice.message}</div>}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-[1fr_220px_180px]"><div><div className="text-xs font-medium uppercase text-slate-500">Visible subjects</div><div className="mt-1 text-2xl font-semibold text-slate-950">{filteredSubjects.length}</div></div><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Class</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}><option value="all">All classes</option>{classes.map((classItem) => <option key={classItem._id} value={classItem._id}>{classItem.name}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-medium text-slate-700">Type</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">All types</option><option value="core">Core</option><option value="elective">Elective</option><option value="optional">Optional</option></select></label></div></section>
      {error && <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">{error}</div>}
      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Subject name</TableHead><TableHead>Code</TableHead><TableHead>Class</TableHead><TableHead>Teacher</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{loading ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">Loading subjects...</TableCell></TableRow> : filteredSubjects.length === 0 ? <TableRow><TableCell colSpan={7} className="h-32 text-center text-slate-500">No subjects found. Click Add Subject to create one.</TableCell></TableRow> : filteredSubjects.map((subject) => <TableRow key={subject._id}><TableCell><div className="font-medium text-slate-950">{subject.name}</div>{subject.description && <div className="text-xs text-slate-500">{subject.description}</div>}</TableCell><TableCell><Badge variant="outline" className="border-border bg-muted">{subject.code}</Badge></TableCell><TableCell>{getName(subject.classId, "Unassigned")}{typeof subject.classId === "object" && subject.classId?.grade && <span className="ml-1 text-xs text-slate-500">Grade {subject.classId.grade}</span>}</TableCell><TableCell>{getName(subject.teacherId, "Not assigned")}</TableCell><TableCell><Badge variant="outline" className="capitalize">{subject.type}</Badge></TableCell><TableCell><Badge variant="outline" className={cn(subject.isActive !== false ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500")}>{subject.isActive !== false ? "Active" : "Inactive"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button type="button" variant="outline" size="icon" title="Edit subject" onClick={() => openEditModal(subject)}><Edit2 className="h-4 w-4" /></Button><Button type="button" variant="destructive" size="icon" title="Delete subject" onClick={() => setDeleteTarget(subject)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>)}</TableBody></Table></section>
      <SubjectFormDialog open={formOpen} editing={Boolean(editingSubject)} form={form} classes={classes} teachers={teachers} saving={saving} bulkLines={bulkLines} setBulkLines={setBulkLines} onOpenChange={setFormOpen} onSubmit={submitForm} onFormChange={setForm} />
      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Delete subject?</DialogTitle><DialogDescription>This will remove {deleteTarget?.name} from its class and teacher assignment.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button type="button" variant="destructive" disabled={saving} onClick={confirmDelete}>{saving ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function SubjectFormDialog({ open, editing, form, classes, teachers, saving, bulkLines, setBulkLines, onOpenChange, onSubmit, onFormChange }: { open: boolean; editing: boolean; form: SubjectForm; classes: ClassOption[]; teachers: TeacherOption[]; saving: boolean; bulkLines: string; setBulkLines: (value: string) => void; onOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onFormChange: (form: SubjectForm) => void }) {
  const applySubjectPreset = (subjectName: string) => { const preset = SUBJECT_PRESETS.find((item) => item.name === subjectName); if (!preset) return; onFormChange({ ...form, name: preset.name, code: preset.code, type: preset.type, description: form.description || preset.name }); };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Edit subject" : "Add subject"}</DialogTitle><DialogDescription>Assign the subject to a class and choose the teacher responsible for it.</DialogDescription></DialogHeader><form className="space-y-5" onSubmit={onSubmit}><div className="grid gap-4 md:grid-cols-2"><Field label="Preset subject"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={SUBJECT_PRESETS.some((item) => item.name === form.name) ? form.name : ""} onChange={(event) => applySubjectPreset(event.target.value)}><option value="">Custom subject</option>{SUBJECT_PRESETS.map((subject) => <option key={subject.code} value={subject.name}>{subject.name}</option>)}</select></Field><Field label="Subject name / custom"><Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} placeholder="Select or type subject name" required /></Field><Field label="Code / custom"><Input value={form.code} onChange={(event) => onFormChange({ ...form, code: event.target.value.toUpperCase() })} placeholder="Auto filled, editable" required /></Field><Field label="Class"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.classId} onChange={(event) => onFormChange({ ...form, classId: event.target.value })} required><option value="">Select class</option>{classes.map((classItem) => <option key={classItem._id} value={classItem._id}>{classItem.name}{classItem.grade ? ` - Grade ${classItem.grade}` : ""}</option>)}</select></Field><Field label="Subject teacher"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.teacherId} onChange={(event) => onFormChange({ ...form, teacherId: event.target.value })}><option value="">Not assigned</option>{teachers.map((teacher) => <option key={teacher._id} value={teacher.userId?._id || ""}>{teacher.userId?.name || "Unnamed teacher"}</option>)}</select></Field><Field label="Type"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(event) => onFormChange({ ...form, type: event.target.value as SubjectForm["type"] })}><option value="core">Core</option><option value="elective">Elective</option><option value="optional">Optional</option></select></Field><Field label="Credit hours"><Input type="number" min={0} step="0.5" value={form.creditHours} onChange={(event) => onFormChange({ ...form, creditHours: Number(event.target.value) })} required /></Field><Field label="Status"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.isActive ? "active" : "inactive"} onChange={(event) => onFormChange({ ...form, isActive: event.target.value === "active" })}><option value="active">Active</option><option value="inactive">Inactive</option></select></Field><Field label="Description"><Input value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} /></Field></div>{!editing && <div className="space-y-2 rounded-lg border border-dashed border-border bg-popover p-4"><div className="text-sm font-semibold text-slate-950">Bulk create subjects</div><p className="text-xs text-slate-500">One subject per line. Format: name | code | type | class id | teacher id. Missing fields use the values above.</p><Textarea value={bulkLines} onChange={(event) => setBulkLines(event.target.value)} placeholder={"Bangla | BGL | core\nMath | MTH | core\nScience | SCI | core"} rows={5} /></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Subject"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
