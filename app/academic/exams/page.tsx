"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarClock, Edit2, Plus, RefreshCw, Trash2 } from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { cn, formatDate } from "@/lib/utils";

type ClassOption = {
  _id: string;
  name: string;
  grade?: string;
};

type SubjectOption = {
  _id: string;
  name: string;
  code: string;
  classId?: ClassOption;
};

type SubjectMark = {
  subjectId: string;
  date: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
};

type ExamItem = {
  _id: string;
  name: string;
  type: ExamType;
  classId?: ClassOption;
  startDate?: string;
  endDate?: string;
  subjectMarks?: Array<{
    subjectId?: SubjectOption;
    date?: string;
    duration?: number;
    totalMarks?: number;
    passingMarks?: number;
  }>;
  approvalRequired?: boolean;
  status?: ExamStatus;
};

type ExamType = "term" | "half-yearly" | "annual" | "midterm" | "final" | "quiz" | "assignment" | "project";
type ExamStatus = "draft" | "scheduled" | "approved" | "published" | "completed";

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
  subjectMarks: SubjectMark[];
};

const approvalTypes: ExamType[] = ["term", "half-yearly", "annual"];

const today = () => new Date().toISOString().slice(0, 10);

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
  subjectMarks: [],
});

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExamItem | null>(null);
  const [form, setForm] = useState<ExamForm>(emptyForm);

  const selectedClassSubjects = useMemo(
    () => subjects.filter((subject) => subject.classId?._id === form.classId),
    [subjects, form.classId]
  );

  const scheduledExams = useMemo(
    () => exams.filter((exam) => exam.status === "scheduled" || exam.status === "approved").length,
    [exams]
  );

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [examResponse, classResponse, subjectResponse] = await Promise.all([
        api.academic.exams.getAll() as Promise<{ exams: ExamItem[] }>,
        api.academic.classes.getAll() as Promise<{ classes: ClassOption[] }>,
        api.academic.subjects.getAll() as Promise<{ subjects: SubjectOption[] }>,
      ]);
      setExams(examResponse.exams || []);
      setClasses(classResponse.classes || []);
      setSubjects(subjectResponse.subjects || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load exam data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const buildMarksForClass = (classId: string, existing: SubjectMark[] = []) => {
    const existingBySubject = new Map(existing.map((item) => [item.subjectId, item]));
    return subjects
      .filter((subject) => subject.classId?._id === classId)
      .map((subject, index) => ({
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
    setEditingExam(null);
    setForm(nextForm);
    setFormOpen(true);
  };

  const openEditModal = (exam: ExamItem) => {
    const classId = exam.classId?._id || "";
    const mappedMarks = (exam.subjectMarks || [])
      .filter((item) => item.subjectId?._id)
      .map((item) => ({
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
      syllabus: "",
      instructions: "",
      subjectMarks: mappedMarks.length ? mappedMarks : buildMarksForClass(classId),
    });
    setFormOpen(true);
  };

  const updateForm = (nextForm: ExamForm) => {
    setForm(nextForm);
  };

  const updateClass = (classId: string) => {
    setForm((current) => ({
      ...current,
      classId,
      subjectMarks: subjects
        .filter((subject) => subject.classId?._id === classId)
        .map((subject) => ({
          subjectId: subject._id,
          date: current.startDate || today(),
          duration: 120,
          totalMarks: 100,
          passingMarks: 33,
        })),
    }));
  };

  const updateType = (type: ExamType) => {
    setForm((current) => ({
      ...current,
      type,
      approvalRequired: approvalTypes.includes(type) ? current.approvalRequired : false,
    }));
  };

  const updateSubjectMark = (index: number, value: Partial<SubjectMark>) => {
    setForm((current) => ({
      ...current,
      subjectMarks: current.subjectMarks.map((mark, markIndex) =>
        markIndex === index ? { ...mark, ...value } : mark
      ),
    }));
  };

  const submitForm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editingExam) {
        await api.academic.exams.update(editingExam._id, form);
      } else {
        await api.academic.exams.create(form);
      }
      setFormOpen(false);
      await loadData();
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
    try {
      await api.academic.exams.delete(deleteTarget._id);
      setDeleteTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to delete exam");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Exam Management"
        description="Create exam schedules, configure subject-wise marks and manage approval workflow."
        icon={CalendarClock}
        status={
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            {scheduledExams} scheduled
          </Badge>
        }
        actions={[
          <Button key="refresh" variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>,
          <Button key="create-exam" size="sm" onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>,
        ]}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Exam name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>End date</TableHead>
              <TableHead>Approval required</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  Loading exams...
                </TableCell>
              </TableRow>
            ) : exams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                  No exams found.
                </TableCell>
              </TableRow>
            ) : (
              exams.map((exam) => (
                <TableRow key={exam._id}>
                  <TableCell>
                    <div className="font-medium text-slate-950">{exam.name}</div>
                    <div className="text-xs text-slate-500">{exam.subjectMarks?.length || 0} subject schedule</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {exam.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{exam.classId?.name || "Unassigned"}</TableCell>
                  <TableCell>{exam.startDate ? formatDate(exam.startDate) : "Not set"}</TableCell>
                  <TableCell>{exam.endDate ? formatDate(exam.endDate) : "Not set"}</TableCell>
                  <TableCell>{exam.approvalRequired ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={statusClass(exam.status || "scheduled")}>
                      {exam.status || "scheduled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="icon" title="Edit exam" onClick={() => openEditModal(exam)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="destructive" size="icon" title="Delete exam" onClick={() => setDeleteTarget(exam)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <ExamFormDialog
        open={formOpen}
        editing={Boolean(editingExam)}
        form={form}
        classes={classes}
        selectedClassSubjects={selectedClassSubjects}
        saving={saving}
        onOpenChange={setFormOpen}
        onSubmit={submitForm}
        onFormChange={updateForm}
        onClassChange={updateClass}
        onTypeChange={updateType}
        onUpdateSubjectMark={updateSubjectMark}
      />

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete exam?</DialogTitle>
            <DialogDescription>
              This will remove {deleteTarget?.name}. Exams with submitted results cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={saving} onClick={confirmDelete}>
              {saving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExamFormDialog({
  open,
  editing,
  form,
  classes,
  selectedClassSubjects,
  saving,
  onOpenChange,
  onSubmit,
  onFormChange,
  onClassChange,
  onTypeChange,
  onUpdateSubjectMark,
}: {
  open: boolean;
  editing: boolean;
  form: ExamForm;
  classes: ClassOption[];
  selectedClassSubjects: SubjectOption[];
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFormChange: (form: ExamForm) => void;
  onClassChange: (classId: string) => void;
  onTypeChange: (type: ExamType) => void;
  onUpdateSubjectMark: (index: number, value: Partial<SubjectMark>) => void;
}) {
  const approvalToggleEnabled = approvalTypes.includes(form.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit exam" : "Create exam"}</DialogTitle>
          <DialogDescription>
            Set the exam window, approval requirement and subject-wise marks schedule.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Exam name">
              <Input value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
            </Field>
            <Field label="Type">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.type}
                onChange={(event) => onTypeChange(event.target.value as ExamType)}
              >
                <option value="term">Term</option>
                <option value="half-yearly">Half-yearly</option>
                <option value="annual">Annual</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final</option>
                <option value="quiz">Quiz</option>
                <option value="assignment">Assignment</option>
                <option value="project">Project</option>
              </select>
            </Field>
            <Field label="Class">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.classId}
                onChange={(event) => onClassChange(event.target.value)}
                required
              >
                <option value="">Select class</option>
                {classes.map((classItem) => (
                  <option key={classItem._id} value={classItem._id}>
                    {classItem.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(event) => onFormChange({ ...form, startDate: event.target.value })} required />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(event) => onFormChange({ ...form, endDate: event.target.value })} required />
            </Field>
            <Field label="Status">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.status}
                onChange={(event) => onFormChange({ ...form, status: event.target.value as ExamStatus })}
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="approved">Approved</option>
                <option value="published">Published</option>
                <option value="completed">Completed</option>
              </select>
            </Field>
          </div>

          <label className={cn("flex items-center gap-3 rounded-lg border border-slate-200 p-3", !approvalToggleEnabled && "opacity-60")}>
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.approvalRequired}
              disabled={!approvalToggleEnabled}
              onChange={(event) => onFormChange({ ...form, approvalRequired: event.target.checked })}
            />
            <span className="text-sm font-medium text-slate-800">Approval required for term, half-yearly and annual exams</span>
          </label>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">Exam schedule and marks setup</h3>
              <p className="mt-1 text-sm text-slate-500">Subjects are loaded from the selected class.</p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Subject</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Total marks</TableHead>
                    <TableHead>Passing marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.subjectMarks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                        Select a class with assigned subjects.
                      </TableCell>
                    </TableRow>
                  ) : (
                    form.subjectMarks.map((mark, index) => {
                      const subject = selectedClassSubjects.find((item) => item._id === mark.subjectId);
                      return (
                        <TableRow key={mark.subjectId}>
                          <TableCell>
                            <div className="font-medium text-slate-950">{subject?.name || "Subject"}</div>
                            <div className="text-xs text-slate-500">{subject?.code}</div>
                          </TableCell>
                          <TableCell>
                            <Input type="date" value={mark.date} onChange={(event) => onUpdateSubjectMark(index, { date: event.target.value })} required />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} value={mark.duration} onChange={(event) => onUpdateSubjectMark(index, { duration: Number(event.target.value) })} required />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} value={mark.totalMarks} onChange={(event) => onUpdateSubjectMark(index, { totalMarks: Number(event.target.value) })} required />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} value={mark.passingMarks} onChange={(event) => onUpdateSubjectMark(index, { passingMarks: Number(event.target.value) })} required />
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Syllabus">
              <Input value={form.syllabus} onChange={(event) => onFormChange({ ...form, syllabus: event.target.value })} />
            </Field>
            <Field label="Instructions">
              <Input value={form.instructions} onChange={(event) => onFormChange({ ...form, instructions: event.target.value })} />
            </Field>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || form.subjectMarks.length === 0}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function statusClass(status: ExamStatus) {
  if (status === "approved" || status === "published" || status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 capitalize";
  }

  if (status === "draft") {
    return "border-slate-200 bg-slate-50 text-slate-600 capitalize";
  }

  return "border-amber-200 bg-amber-50 text-amber-700 capitalize";
}
