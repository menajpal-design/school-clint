"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit2, Eye, EyeOff, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type ClassOption = { _id: string; name: string; grade?: string };
type SubjectOption = { _id: string; name: string; code: string; classId?: ClassOption | string };
type SubjectMark = { subjectId: string; date: string; duration: number; totalMarks: number; passingMarks: number };
type ExamType = "term" | "half-yearly" | "annual" | "midterm" | "final" | "quiz" | "assignment" | "project";
type ExamStatus = "draft" | "scheduled" | "approved" | "published" | "completed";

type ExamItem = {
  _id: string;
  name: string;
  type: ExamType;
  classId?: ClassOption;
  startDate?: string;
  endDate?: string;
  subjectMarks?: Array<{ subjectId?: SubjectOption; date?: string; duration?: number; totalMarks?: number; passingMarks?: number }>;
  approvalRequired?: boolean;
  status?: ExamStatus;
  syllabus?: string;
  instructions?: string;
  isPublished?: boolean;
};

type ExamForm = {
  name: string;
  type: ExamType;
  classId: string;
  startDate: string;
  endDate: string;
  approvalRequired: boolean;
  status: ExamStatus;
  syllabus: string;
  instructions: string;
  isPublished: boolean;
  subjectMarks: SubjectMark[];
};

const approvalTypes: ExamType[] = ["term", "half-yearly", "annual"];
const today = () => new Date().toISOString().slice(0, 10);
const SUBJECT_CACHE_KEY = "easy-school-subject-cache-v2";
const CLASS_CACHE_KEY = "easy-school-syllabus-class-cache-v1";
const EXAM_CACHE_KEY = "easy-school-exam-routine-exams-v2";
const readJson = (key: string) => { if (typeof window === "undefined") return [] as any[]; try { const data = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(data) ? data : []; } catch { return []; } };
const writeJson = (key: string, value: any[]) => { if (typeof window === "undefined") return; try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ } };
const idOf = (value: any) => String(value?._id || value?.id || value || "");
const uniqueById = <T extends any>(items: T[]) => { const map = new Map<string, T>(); items.forEach((item: any) => { const id = idOf(item); if (id) map.set(id, item); }); return Array.from(map.values()); };

const emptyForm = (): ExamForm => ({
  name: "",
  type: "term",
  classId: "",
  startDate: today(),
  endDate: today(),
  approvalRequired: true,
  status: "scheduled",
  syllabus: "",
  instructions: "",
  isPublished: false,
  subjectMarks: [],
});

export default function ExamsPage() {
  const { user } = useAuth();
  const canManage = useMemo(() => ["head", "assistant_head", "admin", "super_admin", "subject_teacher", "class_teacher", "teacher"].includes(user?.role || ""), [user]);

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishingExamId, setPublishingExamId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamItem | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);

  const loadParentPortal = async () => {
    if (user?.role !== "parent") return;
    try {
      const res = await api.parent.portal() as any;
      const childList = res?.portal?.children || [];
      setChildren(childList);
      setSelectedChildId((current) => current || childList[0]?._id || "");
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.role === "parent") {
      loadParentPortal().catch(() => undefined);
    }
  }, [user]);

  const selectedChild = useMemo(() => user?.role === "parent" ? children.find((c) => c._id === selectedChildId) || children[0] : null, [user, children, selectedChildId]);

  const displayExams = useMemo(() => {
    if (user?.role === "parent" && selectedChild) {
      const childClassId = String(selectedChild.classId?._id || selectedChild.classId || "");
      return exams.filter((exam) => String(exam.classId?._id || exam.classId || "") === childClassId);
    }
    return exams;
  }, [exams, user, selectedChild]);

  const selectedClassSubjects = useMemo(() => {
    const matched = subjects.filter((subject) => idOf(subject.classId) === form.classId);
    return matched.length ? matched : subjects;
  }, [subjects, form.classId]);
  const scheduledExams = useMemo(() => displayExams.filter((exam) => exam.status === "scheduled" || exam.status === "approved").length, [displayExams]);
  const publicRoutineCount = useMemo(() => displayExams.filter((exam) => exam.isPublished).length, [displayExams]);

  const isRoutineReady = (exam: ExamItem) => {
    const marks = exam.subjectMarks || [];
    return marks.length > 0 && marks.every((mark) => Boolean(mark.subjectId?._id && mark.date && mark.duration));
  };

  const formRoutineReady = form.subjectMarks.length > 0 && form.subjectMarks.every((mark) => mark.subjectId && mark.date && mark.duration);

  const normalizeExamForList = (exam: any, fallbackForm?: ExamForm): ExamItem => {
    const classObj = typeof exam?.classId === "object" ? exam.classId : classes.find((item) => item._id === (exam?.classId || fallbackForm?.classId));
    const subjectMarks = Array.isArray(exam?.subjectMarks) ? exam.subjectMarks : (fallbackForm?.subjectMarks || []).map((mark) => ({
      ...mark,
      subjectId: subjects.find((subject) => subject._id === mark.subjectId) || { _id: mark.subjectId, name: "Subject", code: "" },
    }));
    return {
      _id: String(exam?._id || exam?.id || `local-${Date.now()}`),
      name: exam?.name || fallbackForm?.name || "Exam",
      type: exam?.type || fallbackForm?.type || "term",
      classId: classObj || exam?.classId || fallbackForm?.classId,
      startDate: exam?.startDate || fallbackForm?.startDate,
      endDate: exam?.endDate || fallbackForm?.endDate,
      subjectMarks,
      approvalRequired: exam?.approvalRequired ?? fallbackForm?.approvalRequired,
      status: exam?.status || fallbackForm?.status || "scheduled",
      syllabus: exam?.syllabus || fallbackForm?.syllabus || "",
      instructions: exam?.instructions || fallbackForm?.instructions || "",
      isPublished: exam?.isPublished === true,
    };
  };

  const upsertExam = (exam: ExamItem) => {
    setExams((current) => {
      const next = uniqueById([exam, ...current]);
      writeJson(EXAM_CACHE_KEY, next);
      return next;
    });
  };

  const buildRoutineNotice = (exam: ExamItem) => {
    const routineLines = (exam.subjectMarks || []).map((mark, index) => {
      const subjectName = mark.subjectId?.name || "Subject";
      const subjectCode = mark.subjectId?.code ? ` (${mark.subjectId.code})` : "";
      const dateText = mark.date ? formatDate(mark.date) : "Not set";
      const durationText = mark.duration ? `${mark.duration} min` : "Not set";
      return `${index + 1}. ${subjectName}${subjectCode} - ${dateText} - ${durationText}`;
    });
    return [`Exam: ${exam.name}`, `Class: ${exam.classId?.name || "Unassigned"}`, `Exam date: ${exam.startDate ? formatDate(exam.startDate) : "Not set"} to ${exam.endDate ? formatDate(exam.endDate) : "Not set"}`, "", "Routine:", ...routineLines, "", exam.instructions ? `Instructions: ${exam.instructions}` : "", exam.syllabus ? `Syllabus: ${exam.syllabus}` : ""].filter(Boolean).join("\n");
  };

  const createRoutineNotice = async (exam: ExamItem) => {
    const body = new FormData();
    body.append("title", `${exam.name} Routine`);
    body.append("content", buildRoutineNotice(exam));
    body.append("category", "academic");
    body.append("priority", "medium");
    body.append("targetAudience", "all");
    body.append("schedulePublish", "false");
    body.append("publishedAt", "");
    body.append("expiryDate", "");
    body.append("idCardRenewal", "false");
    body.append("targetRoles", "all");
    await apiClient.post('/notices', body, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const cachedExams = readJson(EXAM_CACHE_KEY) as ExamItem[];
      const [examResponse, classResponse, subjectResponse] = await Promise.all([
        api.academic.exams.getAll().catch(() => ({ exams: cachedExams })) as Promise<{ exams: ExamItem[] }>,
        api.academic.classes.getAll().catch(() => ({ classes: readJson(CLASS_CACHE_KEY) })) as Promise<{ classes: ClassOption[] }>,
        api.academic.subjects.getAll().catch(() => ({ subjects: readJson(SUBJECT_CACHE_KEY) })) as Promise<{ subjects: SubjectOption[] }>,
      ]);
      const apiExams = Array.isArray(examResponse.exams) ? examResponse.exams : [];
      const nextExams = apiExams.length ? uniqueById([...apiExams, ...cachedExams]) : cachedExams;
      const nextClasses = classResponse.classes || [];
      const nextSubjects = subjectResponse.subjects || [];
      setExams(nextExams);
      setClasses(nextClasses);
      setSubjects(nextSubjects);
      writeJson(EXAM_CACHE_KEY, nextExams);
      writeJson(CLASS_CACHE_KEY, nextClasses);
      writeJson(SUBJECT_CACHE_KEY, nextSubjects);
      if (!apiExams.length && cachedExams.length) setSuccess("Live API list empty, saved cached exams are showing.");
    } catch (err: any) {
      const cached = readJson(EXAM_CACHE_KEY) as ExamItem[];
      if (cached.length) {
        setExams(cached);
        setSuccess("Live API failed, cached exam list is showing.");
      } else setError(err?.message || "Failed to load exam data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const buildMarksForClass = (classId: string, existing: SubjectMark[] = []) => {
    const existingBySubject = new Map(existing.map((item) => [item.subjectId, item]));
    const matched = subjects.filter((subject) => idOf(subject.classId) === classId);
    const source = matched.length ? matched : subjects;
    return source.map((subject) => ({
      subjectId: subject._id,
      date: existingBySubject.get(subject._id)?.date || form.startDate || today(),
      duration: existingBySubject.get(subject._id)?.duration || 120,
      totalMarks: existingBySubject.get(subject._id)?.totalMarks || 100,
      passingMarks: existingBySubject.get(subject._id)?.passingMarks || 33,
    }));
  };

  const openCreateModal = () => {
    const nextForm = emptyForm();
    const firstClassId = classes[0]?._id || "";
    nextForm.classId = firstClassId;
    nextForm.subjectMarks = firstClassId ? buildMarksForClass(firstClassId) : [];
    nextForm.isPublished = false;
    setEditingExam(null);
    setForm(nextForm);
    setFormOpen(true);
  };

  const openEditModal = (exam: ExamItem) => {
    const classId = exam.classId?._id || "";
    const mappedMarks = (exam.subjectMarks || []).filter((item) => item.subjectId?._id).map((item) => ({
      subjectId: item.subjectId!._id,
      date: item.date ? item.date.slice(0, 10) : today(),
      duration: item.duration || 120,
      totalMarks: item.totalMarks || 100,
      passingMarks: item.passingMarks || 33,
    }));
    setEditingExam(exam);
    setForm({
      name: exam.name || "",
      type: exam.type || "term",
      classId,
      startDate: exam.startDate ? exam.startDate.slice(0, 10) : today(),
      endDate: exam.endDate ? exam.endDate.slice(0, 10) : today(),
      approvalRequired: exam.approvalRequired === true,
      status: exam.status || "scheduled",
      syllabus: exam.syllabus || "",
      instructions: exam.instructions || "",
      isPublished: exam.isPublished === true && Boolean(mappedMarks.length),
      subjectMarks: mappedMarks.length ? mappedMarks : buildMarksForClass(classId),
    });
    setFormOpen(true);
  };

  const updateClass = (classId: string) => {
    setForm((current) => {
      const matched = subjects.filter((subject) => idOf(subject.classId) === classId);
      const source = matched.length ? matched : subjects;
      return { ...current, classId, isPublished: false, subjectMarks: source.map((subject) => ({ subjectId: subject._id, date: current.startDate || today(), duration: 120, totalMarks: 100, passingMarks: 33 })) };
    });
  };

  const updateType = (type: ExamType) => setForm((current) => ({ ...current, type, approvalRequired: approvalTypes.includes(type) ? current.approvalRequired : false }));
  const updateSubjectMark = (index: number, value: Partial<SubjectMark>) => setForm((current) => ({ ...current, subjectMarks: current.subjectMarks.map((mark, markIndex) => markIndex === index ? { ...mark, ...value } : mark) }));

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let savedExam: ExamItem | null = null;
      const payload = { ...form, isPublished: form.isPublished && formRoutineReady, subjectMarks: form.subjectMarks.filter((item) => item.subjectId && item.date) };
      if (editingExam) {
        const data = await api.academic.exams.update(editingExam._id, payload) as { exam: ExamItem };
        savedExam = data.exam;
      } else {
        const data = await api.academic.exams.create(payload) as { exam: ExamItem };
        savedExam = data.exam;
      }
      const visibleExam = normalizeExamForList(savedExam || {}, payload);
      upsertExam(visibleExam);
      if (payload.isPublished && visibleExam) await createRoutineNotice(visibleExam);
      setFormOpen(false);
      setSuccess(payload.isPublished ? "Exam saved and routine notice published." : "Exam saved successfully and added to the list. Routine can be completed later from Exam Routine page.");
      loadData().catch(() => undefined);
    } catch (err: any) {
      setError(err?.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.academic.exams.delete(deleteTarget._id);
      const next = exams.filter((exam) => exam._id !== deleteTarget._id);
      setExams(next); writeJson(EXAM_CACHE_KEY, next);
      setDeleteTarget(null);
      setSuccess("Exam deleted successfully.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete exam");
    } finally {
      setSaving(false);
    }
  };

  const togglePublicRoutine = async (exam: ExamItem) => {
    if (!isRoutineReady(exam) && !exam.isPublished) {
      setError("Routine incomplete. Add subject, date and duration before making it public.");
      return;
    }
    setPublishingExamId(exam._id);
    setError("");
    setSuccess("");
    try {
      const nextPublished = !exam.isPublished;
      const data = await apiClient.patch(`/academic/exams/${exam._id}/public-routine`, { isPublished: nextPublished }) as { exam: ExamItem; message?: string };
      const updated = normalizeExamForList(data.exam || { ...exam, isPublished: nextPublished });
      upsertExam(updated);
      if (nextPublished) await createRoutineNotice(updated);
      setSuccess(nextPublished ? "Routine is public and published in Notice Board." : "Routine is now private.");
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to update public routine status");
    } finally {
      setPublishingExamId(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exam Management"
        description="Create exam schedules first. Routine subject/date can be completed now or later from Exam Routine page."
        icon={CalendarClock}
        status={<Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{scheduledExams} scheduled • {publicRoutineCount} public routines</Badge>}
        actions={[
          <Button key="refresh" variant="outline" size="sm" onClick={loadData}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
          canManage && <Button key="create-exam" size="sm" onClick={openCreateModal}><Plus className="mr-2 h-4 w-4" />Create Exam</Button>
        ].filter(Boolean) as any}
      />
      {error && <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      {user?.role === "parent" && children.length > 0 && (
        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="max-w-xs">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-800">Select Child</span>
              <select
                className="h-10 w-full rounded-md border px-3 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedChildId}
                onChange={(e) => setSelectedChildId(e.target.value)}
              >
                {children.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.userId?.name || `Roll: ${item.rollNumber}`} ({item.classId?.name || "N/A"})
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Exam name</TableHead>
              <TableHead>Routine</TableHead>
              <TableHead>Public routine</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>End date</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Status</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={canManage ? 10 : 9} className="h-32 text-center text-slate-500">Loading exams...</TableCell></TableRow>
            ) : displayExams.length === 0 ? (
              <TableRow><TableCell colSpan={canManage ? 10 : 9} className="h-32 text-center text-slate-500">No exams found.</TableCell></TableRow>
            ) : (
              displayExams.map((exam) => (
                <TableRow key={exam._id}>
                  <TableCell>
                    <div className="font-medium text-slate-950">{exam.name}</div>
                    <div className="text-xs text-slate-500">{exam.subjectMarks?.length || 0} subject schedule</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("w-fit capitalize", isRoutineReady(exam) ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700")}>
                      {isRoutineReady(exam) ? "Routine ready" : "Routine incomplete"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Badge variant="outline" className={exam.isPublished ? "w-fit border-blue-200 bg-blue-50 text-blue-700" : "w-fit border-slate-200 bg-slate-50 text-slate-600"}>
                        {exam.isPublished ? "Public" : "Private"}
                      </Badge>
                      {canManage && (
                        <Button
                          type="button"
                          size="sm"
                          variant={exam.isPublished ? "outline" : "default"}
                          className="w-fit"
                          disabled={publishingExamId === exam._id}
                          onClick={() => togglePublicRoutine(exam)}
                        >
                          {exam.isPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                          {publishingExamId === exam._id ? "Updating..." : exam.isPublished ? "Make private" : "Publish routine"}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="capitalize">{exam.type}</Badge></TableCell>
                  <TableCell>{exam.classId?.name || "Unassigned"}</TableCell>
                  <TableCell>{exam.startDate ? formatDate(exam.startDate) : "Not set"}</TableCell>
                  <TableCell>{exam.endDate ? formatDate(exam.endDate) : "Not set"}</TableCell>
                  <TableCell>{exam.approvalRequired ? "Yes" : "No"}</TableCell>
                  <TableCell><Badge variant="outline" className={statusClass(exam.status || "scheduled")}>{exam.status || "scheduled"}</Badge></TableCell>
                  {canManage && (
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="icon" title="Edit exam" onClick={() => openEditModal(exam)}><Edit2 className="h-4 w-4" /></Button>
                        <Button type="button" variant="destructive" size="icon" title="Delete exam" onClick={() => setDeleteTarget(exam)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>
      {canManage && <ExamFormDialog open={formOpen} editing={Boolean(editingExam)} form={form} classes={classes} selectedClassSubjects={selectedClassSubjects} saving={saving} routineReady={formRoutineReady} onOpenChange={setFormOpen} onSubmit={submitForm} onFormChange={setForm} onClassChange={updateClass} onTypeChange={updateType} onUpdateSubjectMark={updateSubjectMark} />}
      {canManage && <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Delete exam?</DialogTitle><DialogDescription>This will remove {deleteTarget?.name}. Exams with submitted results cannot be deleted.</DialogDescription></DialogHeader><DialogFooter><Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button type="button" variant="destructive" disabled={saving} onClick={confirmDelete}>{saving ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent></Dialog>}
    </div>
  );
}

function ExamFormDialog({ open, editing, form, classes, selectedClassSubjects, saving, routineReady, onOpenChange, onSubmit, onFormChange, onClassChange, onTypeChange, onUpdateSubjectMark }: { open: boolean; editing: boolean; form: ExamForm; classes: ClassOption[]; selectedClassSubjects: SubjectOption[]; saving: boolean; routineReady: boolean; onOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onFormChange: (form: ExamForm) => void; onClassChange: (classId: string) => void; onTypeChange: (type: ExamType) => void; onUpdateSubjectMark: (index: number, value: Partial<SubjectMark>) => void }) {
  const approvalToggleEnabled = approvalTypes.includes(form.type);
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "Edit exam" : "Create exam"}</DialogTitle><DialogDescription>Set the exam window first. Subject routine can be added now or later from Exam Routine page.</DialogDescription></DialogHeader><form className="space-y-5" onSubmit={onSubmit}><div className="grid gap-4 md:grid-cols-3"><Field label="Exam name"><Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required /></Field><Field label="Type"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(event) => onTypeChange(event.target.value as ExamType)}><option value="term">Term</option><option value="half-yearly">Half-yearly</option><option value="annual">Annual</option><option value="midterm">Midterm</option><option value="final">Final</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="project">Project</option></select></Field><Field label="Class"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.classId} onChange={(event) => onClassChange(event.target.value)} required><option value="">Select class</option>{classes.map((classItem) => <option key={classItem._id} value={classItem._id}>{classItem.name}</option>)}</select></Field><Field label="Start date"><Input type="date" value={form.startDate} onChange={(event) => onFormChange({ ...form, startDate: event.target.value })} required /></Field><Field label="End date"><Input type="date" value={form.endDate} onChange={(event) => onFormChange({ ...form, endDate: event.target.value })} required /></Field><Field label="Status"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(event) => onFormChange({ ...form, status: event.target.value as ExamStatus })}><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="approved">Approved</option><option value="published">Published</option><option value="completed">Completed</option></select></Field></div><label className={cn("flex items-center gap-3 rounded-lg border border-slate-200 p-3", !approvalToggleEnabled && "opacity-60")}><input type="checkbox" className="h-4 w-4" checked={form.approvalRequired} disabled={!approvalToggleEnabled} onChange={(event) => onFormChange({ ...form, approvalRequired: event.target.checked })} /><span className="text-sm font-medium text-slate-800">Approval required for term, half-yearly and annual exams</span></label><label className={cn("flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-3", !routineReady && "opacity-70")}><input type="checkbox" className="h-4 w-4" checked={form.isPublished && routineReady} disabled={!routineReady} onChange={(event) => onFormChange({ ...form, isPublished: event.target.checked })} /><span className="text-sm font-medium text-blue-900">Public Exam Routine — save করলে routine Notice Board-এ publish হবে</span></label>{!routineReady && <p className="text-xs text-amber-700">Subject/date complete না থাকলেও Exam Create হবে। Routine পরে Academic &gt; Exam Routine থেকে add/update করুন।</p>}<div className="space-y-3"><div><h3 className="text-sm font-semibold text-slate-950">Exam schedule and marks setup</h3><p className="mt-1 text-sm text-slate-500">Subjects are optional during exam creation. You can complete routine later.</p></div><div className="overflow-hidden rounded-lg border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Subject</TableHead><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Total marks</TableHead><TableHead>Passing marks</TableHead></TableRow></TableHeader><TableBody>{form.subjectMarks.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-slate-500">No subject schedule loaded. You can still create the exam and add routine later.</TableCell></TableRow> : form.subjectMarks.map((mark, index) => { const subject = selectedClassSubjects.find((item) => item._id === mark.subjectId); return <TableRow key={`${mark.subjectId}-${index}`}><TableCell><div className="font-medium text-slate-950">{subject?.name || "Subject"}</div><div className="text-xs text-slate-500">{subject?.code}</div></TableCell><TableCell><Input type="date" value={mark.date} onChange={(event) => onUpdateSubjectMark(index, { date: event.target.value })} /></TableCell><TableCell><Input type="number" min={0} value={mark.duration} onChange={(event) => onUpdateSubjectMark(index, { duration: Number(event.target.value) })} /></TableCell><TableCell><Input type="number" min={0} value={mark.totalMarks} onChange={(event) => onUpdateSubjectMark(index, { totalMarks: Number(event.target.value) })} /></TableCell><TableCell><Input type="number" min={0} value={mark.passingMarks} onChange={(event) => onUpdateSubjectMark(index, { passingMarks: Number(event.target.value) })} /></TableCell></TableRow>; })}</TableBody></Table></div></div><div className="grid gap-4 md:grid-cols-2"><Field label="Syllabus"><Input value={form.syllabus} onChange={(event) => onFormChange({ ...form, syllabus: event.target.value })} /></Field><Field label="Instructions"><Input value={form.instructions} onChange={(event) => onFormChange({ ...form, instructions: event.target.value })} /></Field></div><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving || !form.name.trim() || !form.classId}>{saving ? "Saving..." : editing ? "Save Changes" : "Create Exam"}</Button></DialogFooter></form></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function statusClass(status: ExamStatus) { if (status === "approved" || status === "published" || status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700 capitalize"; if (status === "draft") return "border-slate-200 bg-slate-50 text-slate-600 capitalize"; return "border-amber-200 bg-amber-50 text-amber-700 capitalize"; }
