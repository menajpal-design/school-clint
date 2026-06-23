"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, ClipboardList, Edit2, Eye, EyeOff, FileText, Plus, RefreshCw, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { normalizeUserRole } from "@/lib/permissions";

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
  const normalizedRole = normalizeUserRole(user?.role);
  const canManage = useMemo(() => {
    return normalizedRole ? ["head", "assistant_head", "admin", "super_admin", "subject_teacher", "class_teacher", "teacher"].includes(normalizedRole) : false;
  }, [normalizedRole]);

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
    if (user?.role === "student" && user.student) {
      const studentClassId = String(user.student.classId?._id || user.student.classId || "");
      return exams.filter((exam) => String(exam.classId?._id || exam.classId || "") === studentClassId);
    }
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
  const firstSubjectId = (exam: ExamItem) => idOf(exam.subjectMarks?.find((mark) => idOf(mark.subjectId))?.subjectId);
  const resultEntryHref = (exam: ExamItem) => `/academic/results?classId=${idOf(exam.classId)}&examId=${exam._id}&subjectId=${firstSubjectId(exam)}`;

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
    await apiClient.post('/notices', body);
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
      passingMarks: item.passingMarks || 33
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
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">Loading exams...</TableCell></TableRow>
            ) : displayExams.length === 0 ? (
              <TableRow><TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No exam schedules found. Create one to begin routine setup.</TableCell></TableRow>
            ) : displayExams.map((exam) => (
              <TableRow key={exam._id}>
                <TableCell className="font-medium">{exam.name}</TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div>{exam.subjectMarks?.length || 0} subject schedule</div>
                    <Badge variant={isRoutineReady(exam) ? "default" : "outline"} className={isRoutineReady(exam) ? "bg-emerald-600" : ""}>{isRoutineReady(exam) ? "Routine ready" : "Incomplete"}</Badge>
                  </div>
                </TableCell>
                <TableCell>{exam.isPublished ? <Badge className="bg-emerald-600">Public</Badge> : <Badge variant="outline">Private</Badge>}</TableCell>
                <TableCell>{exam.type}</TableCell>
                <TableCell>{exam.classId?.name || "Unassigned"}</TableCell>
                <TableCell>{exam.startDate ? formatDate(exam.startDate) : "-"}</TableCell>
                <TableCell>{exam.endDate ? formatDate(exam.endDate) : "-"}</TableCell>
                <TableCell>{exam.approvalRequired ? "Yes" : "No"}</TableCell>
                <TableCell><Badge variant="outline">{exam.status || "scheduled"}</Badge></TableCell>
                {canManage && <TableCell className="text-right"><div className="flex flex-wrap justify-end gap-2"><Link href={`/academic/exams/${exam._id}`}><Button size="sm" variant="outline"><ClipboardList className="mr-2 h-4 w-4" />Progress</Button></Link><Link href={resultEntryHref(exam)}><Button size="sm" variant="outline" disabled={!firstSubjectId(exam)}><FileText className="mr-2 h-4 w-4" />Results</Button></Link><Button size="sm" variant="outline" onClick={() => togglePublicRoutine(exam)} disabled={publishingExamId === exam._id}>{exam.isPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}{exam.isPublished ? "Make private" : "Make public"}</Button><Button size="sm" variant="outline" onClick={() => openEditModal(exam)}><Edit2 className="mr-2 h-4 w-4" />Edit</Button><Button size="sm" variant="destructive" onClick={() => setDeleteTarget(exam)}><Trash2 className="mr-2 h-4 w-4" />Delete</Button></div></TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <form onSubmit={submitForm}>
            <DialogHeader><DialogTitle>{editingExam ? "Edit exam" : "Create exam"}</DialogTitle><DialogDescription>Set the exam window first. Subject routine can be added now or later from Exam Routine page.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-4 md:grid-cols-2">
              <label className="space-y-1 text-sm"><span>Exam name</span><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
              <label className="space-y-1 text-sm"><span>Type</span><select value={form.type} onChange={(e) => updateType(e.target.value as ExamType)} className="h-10 w-full rounded-md border px-3 text-sm"><option value="term">Term</option><option value="half-yearly">Half-yearly</option><option value="annual">Annual</option><option value="midterm">Midterm</option><option value="final">Final</option><option value="quiz">Quiz</option><option value="assignment">Assignment</option><option value="project">Project</option></select></label>
              <label className="space-y-1 text-sm"><span>Class</span><select value={form.classId} onChange={(e) => updateClass(e.target.value)} className="h-10 w-full rounded-md border px-3 text-sm" required><option value="">Select class</option>{classes.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></label>
              <label className="space-y-1 text-sm"><span>Start date</span><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required /></label>
              <label className="space-y-1 text-sm"><span>End date</span><Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required /></label>
              <label className="space-y-1 text-sm"><span>Status</span><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ExamStatus })} className="h-10 w-full rounded-md border px-3 text-sm"><option value="draft">Draft</option><option value="scheduled">Scheduled</option><option value="approved">Approved</option><option value="published">Published</option><option value="completed">Completed</option></select></label>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" checked={form.approvalRequired} disabled={approvalTypes.includes(form.type)} onChange={(e) => setForm({ ...form, approvalRequired: e.target.checked })} />Approval required for term, half-yearly and annual exams</label>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" checked={form.isPublished} disabled={!formRoutineReady} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />Public Exam Routine — save করলে routine Notice Board-এ publish হবে</label>
            </div>
            <div className="mb-4 rounded-lg border bg-muted/40 p-3">
              <div className="mb-2 flex items-center justify-between"><div><h3 className="font-semibold">Exam schedule and marks setup</h3><p className="text-sm text-muted-foreground">Subjects are optional during exam creation. You can complete routine later.</p></div></div>
              <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b text-left"><th className="p-2">Subject</th><th className="p-2">Date</th><th className="p-2">Duration</th><th className="p-2">Total marks</th><th className="p-2">Passing marks</th></tr></thead><tbody>{selectedClassSubjects.length === 0 ? <tr><td colSpan={5} className="p-3 text-muted-foreground">No subjects found for selected class. You can still create the exam and complete routine later.</td></tr> : selectedClassSubjects.map((subject, index) => { const mark = form.subjectMarks[index] || { subjectId: subject._id, date: form.startDate, duration: 120, totalMarks: 100, passingMarks: 33 }; return <tr key={subject._id} className="border-b"><td className="p-2"><div className="font-medium">{subject.name}</div><div className="text-xs text-muted-foreground">{subject.code}</div></td><td className="p-2"><Input type="date" value={mark.date} onChange={(e) => updateSubjectMark(index, { subjectId: subject._id, date: e.target.value })} /></td><td className="p-2"><Input type="number" min={1} value={mark.duration} onChange={(e) => updateSubjectMark(index, { subjectId: subject._id, duration: Number(e.target.value) })} /></td><td className="p-2"><Input type="number" min={1} value={mark.totalMarks} onChange={(e) => updateSubjectMark(index, { subjectId: subject._id, totalMarks: Number(e.target.value) })} /></td><td className="p-2"><Input type="number" min={0} value={mark.passingMarks} onChange={(e) => updateSubjectMark(index, { subjectId: subject._id, passingMarks: Number(e.target.value) })} /></td></tr>; })}</tbody></table></div>
            </div>
            <label className="mb-3 block space-y-1 text-sm"><span>Syllabus</span><textarea value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })} className="min-h-20 w-full rounded-md border p-3 text-sm" /></label>
            <label className="mb-4 block space-y-1 text-sm"><span>Instructions</span><textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="min-h-20 w-full rounded-md border p-3 text-sm" /></label>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : editingExam ? "Update Exam" : "Create Exam"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={() => setDeleteTarget(null)}><DialogContent><DialogHeader><DialogTitle>Delete exam?</DialogTitle><DialogDescription>This will remove the exam schedule. Result entries linked with this exam may be affected.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete} disabled={saving}>{saving ? "Deleting..." : "Delete"}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
