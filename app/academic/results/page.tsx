"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  RefreshCw,
  Save,
  Send,
  Upload,
  Users,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

type WorkflowStatus = "draft" | "review" | "approved" | "published";

type SectionItem = {
  _id: string;
  name: string;
  isActive?: boolean;
};

type ClassItem = {
  _id: string;
  name: string;
  sections?: SectionItem[];
};

type SubjectItem = {
  _id: string;
  name: string;
  code: string;
  classId?: { _id: string; name: string };
};

type ExamItem = {
  _id: string;
  name: string;
  type: string;
  classId?: { _id: string; name: string };
  subjectMarks?: Array<{
    subjectId?: { _id: string; name: string; code: string };
    totalMarks?: number;
    passingMarks?: number;
  }>;
};

type StudentOption = {
  _id: string;
  rollNumber: string;
  userId?: { name?: string; email?: string };
  sectionId?: { _id?: string; name?: string };
};

type ResultRow = {
  studentId: string;
  resultId?: string;
  rollNumber: string;
  studentName: string;
  section: string;
  marksObtained?: number | "";
  grade?: string;
  remarks?: string;
  workflowStatus: WorkflowStatus;
};

type MarksSetup = {
  totalMarks: number;
  passingMarks: number;
};

type AddResultForm = {
  classId: string;
  sectionId: string;
  examId: string;
  subjectId: string;
  studentId: string;
  marksObtained: string;
  remarks: string;
};

const defaultMarksSetup: MarksSetup = { totalMarks: 100, passingMarks: 33 };

const emptyAddForm: AddResultForm = {
  classId: "",
  sectionId: "",
  examId: "",
  subjectId: "",
  studentId: "",
  marksObtained: "",
  remarks: "",
};

export default function ResultsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [marksSetup, setMarksSetup] = useState<MarksSetup>(defaultMarksSetup);
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("draft");
  const [missingMarks, setMissingMarks] = useState(0);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examId, setExamId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmAction, setConfirmAction] = useState<null | "review" | "assistant" | "head" | "publish">(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddResultForm>(emptyAddForm);
  const [addStudents, setAddStudents] = useState<StudentOption[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  const selectedClass = classes.find((item) => item._id === classId);
  const availableSections = selectedClass?.sections?.filter((section) => section.isActive !== false) || [];
  const availableSubjects = useMemo(
    () => subjects.filter((subject) => !classId || subject.classId?._id === classId),
    [subjects, classId]
  );
  const availableExams = useMemo(
    () => exams.filter((exam) => !classId || exam.classId?._id === classId),
    [exams, classId]
  );
  const readyForEntry = Boolean(classId && examId && subjectId);

  const addSelectedClass = classes.find((item) => item._id === addForm.classId);
  const addSections = addSelectedClass?.sections?.filter((section) => section.isActive !== false) || [];
  const addSubjects = subjects.filter((subject) => !addForm.classId || subject.classId?._id === addForm.classId);
  const addExams = exams.filter((exam) => !addForm.classId || exam.classId?._id === addForm.classId);

  const loadLookups = async () => {
    setLoading(true);
    setError("");
    try {
      const [classResponse, subjectResponse, examResponse] = await Promise.all([
        api.academic.classes.getAll() as Promise<{ classes: ClassItem[] }>,
        api.academic.subjects.getAll() as Promise<{ subjects: SubjectItem[] }>,
        api.academic.exams.getAll() as Promise<{ exams: ExamItem[] }>,
      ]);
      const nextClasses = classResponse.classes || [];
      const nextSubjects = subjectResponse.subjects || [];
      const nextExams = examResponse.exams || [];
      setClasses(nextClasses);
      setSubjects(nextSubjects);
      setExams(nextExams);

      const firstClass = nextClasses[0]?._id || "";
      const firstExam = nextExams.find((exam) => exam.classId?._id === firstClass)?._id || nextExams[0]?._id || "";
      const firstSubject = nextSubjects.find((subject) => subject.classId?._id === firstClass)?._id || nextSubjects[0]?._id || "";
      setClassId((current) => current || firstClass);
      setExamId((current) => current || firstExam);
      setSubjectId((current) => current || firstSubject);
    } catch (err: any) {
      setError(err?.message || "Failed to load result filters");
    } finally {
      setLoading(false);
    }
  };

  const loadRows = async () => {
    if (!classId || !examId || !subjectId) {
      setRows([]);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.academic.results.getEntry({
        classId,
        sectionId: sectionId || undefined,
        examId,
        subjectId,
      }) as { rows: ResultRow[]; marksSetup?: MarksSetup; workflowStatus?: WorkflowStatus; missingMarks?: number };

      setRows((data.rows || []).map((row) => ({ ...row, marksObtained: row.marksObtained ?? "" })));
      setMarksSetup(data.marksSetup || defaultMarksSetup);
      setWorkflowStatus(data.workflowStatus || "draft");
      setMissingMarks(data.missingMarks || 0);
    } catch (err: any) {
      setError(err?.message || "Failed to load marks entry table");
    } finally {
      setLoading(false);
    }
  };

  const loadAddStudents = async (form: AddResultForm = addForm) => {
    if (!form.classId) {
      setAddStudents([]);
      return;
    }
    setAddLoading(true);
    try {
      const data = await api.academic.reportCard.students({
        classId: form.classId,
        sectionId: form.sectionId || undefined,
      }) as { students: StudentOption[] };
      setAddStudents(data.students || []);
    } catch {
      setAddStudents([]);
    } finally {
      setAddLoading(false);
    }
  };

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadRows();
  }, [classId, sectionId, examId, subjectId]);

  useEffect(() => {
    if (addOpen) loadAddStudents(addForm);
  }, [addOpen, addForm.classId, addForm.sectionId]);

  const updateClass = (nextClassId: string) => {
    setClassId(nextClassId);
    setSectionId("");
    const nextExam = exams.find((exam) => exam.classId?._id === nextClassId)?._id || "";
    const nextSubject = subjects.find((subject) => subject.classId?._id === nextClassId)?._id || "";
    setExamId(nextExam);
    setSubjectId(nextSubject);
  };

  const openAddDialog = () => {
    const nextClassId = classId || classes[0]?._id || "";
    const nextExamId = examId || exams.find((exam) => exam.classId?._id === nextClassId)?._id || exams[0]?._id || "";
    const nextSubjectId = subjectId || subjects.find((subject) => subject.classId?._id === nextClassId)?._id || subjects[0]?._id || "";
    const nextForm = {
      classId: nextClassId,
      sectionId: sectionId || "",
      examId: nextExamId,
      subjectId: nextSubjectId,
      studentId: "",
      marksObtained: "",
      remarks: "",
    };
    setAddForm(nextForm);
    setAddStudents([]);
    setAddOpen(true);
  };

  const updateAddForm = (key: keyof AddResultForm, value: string) => {
    setAddForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "classId") {
        next.sectionId = "";
        next.studentId = "";
        next.examId = exams.find((exam) => exam.classId?._id === value)?._id || "";
        next.subjectId = subjects.find((subject) => subject.classId?._id === value)?._id || "";
      }
      if (key === "sectionId") next.studentId = "";
      return next;
    });
  };

  const updateMark = (studentId: string, value: Partial<ResultRow>) => {
    setRows((current) => current.map((row) => (row.studentId === studentId ? { ...row, ...value } : row)));
  };

  const saveDraft = async () => {
    if (!readyForEntry) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const data = await api.academic.results.saveDraft({
        classId,
        sectionId: sectionId || undefined,
        examId,
        subjectId,
        rows,
      }) as { rows: ResultRow[]; workflowStatus?: WorkflowStatus; missingMarks?: number; marksSetup?: MarksSetup };
      setRows((data.rows || []).map((row) => ({ ...row, marksObtained: row.marksObtained ?? "" })));
      setWorkflowStatus(data.workflowStatus || "draft");
      setMissingMarks(data.missingMarks || 0);
      setMarksSetup(data.marksSetup || marksSetup);
      setSuccess("Draft saved successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const saveSingleResult = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (!addForm.classId || !addForm.examId || !addForm.subjectId || !addForm.studentId || addForm.marksObtained === "") {
        setError("Please select class, exam, subject, student and marks.");
        return;
      }

      const selectedStudent = addStudents.find((student) => student._id === addForm.studentId);
      await api.academic.results.saveDraft({
        classId: addForm.classId,
        sectionId: addForm.sectionId || undefined,
        examId: addForm.examId,
        subjectId: addForm.subjectId,
        rows: [{
          studentId: addForm.studentId,
          rollNumber: selectedStudent?.rollNumber || "",
          studentName: selectedStudent?.userId?.name || "Student",
          section: selectedStudent?.sectionId?.name || "",
          marksObtained: Number(addForm.marksObtained),
          remarks: addForm.remarks,
          workflowStatus: "draft",
        }],
      });

      setClassId(addForm.classId);
      setSectionId(addForm.sectionId);
      setExamId(addForm.examId);
      setSubjectId(addForm.subjectId);
      setAddOpen(false);
      setSuccess("Result added successfully.");
      await loadRows();
    } catch (err: any) {
      setError(err?.message || "Failed to add result");
    } finally {
      setSaving(false);
    }
  };

  const runWorkflowAction = async () => {
    if (!confirmAction || !readyForEntry) return;
    setSaving(true);
    setError("");
    setSuccess("");
    const payload = { classId, sectionId: sectionId || undefined, examId, subjectId };

    try {
      if (confirmAction === "review") await api.academic.results.submitReview(payload);
      if (confirmAction === "assistant") await api.academic.results.assistantApprove(payload);
      if (confirmAction === "head") await api.academic.results.headApprove(payload);
      if (confirmAction === "publish") await api.academic.results.publish(payload);
      setSuccess(actionSuccess(confirmAction));
      setConfirmAction(null);
      await loadRows();
    } catch (err: any) {
      setError(err?.message || "Workflow action failed");
    } finally {
      setSaving(false);
    }
  };

  const localMissingMarks = rows.filter((row) => row.marksObtained === "" || row.marksObtained === undefined || row.marksObtained === null).length;
  const filledMarks = rows.length - localMissingMarks;
  const passCount = rows.filter((row) => typeof row.marksObtained === "number" && row.marksObtained >= marksSetup.passingMarks).length;
  const failCount = rows.filter((row) => typeof row.marksObtained === "number" && row.marksObtained < marksSetup.passingMarks).length;
  const averageMarks = filledMarks
    ? Math.round(rows.reduce((sum, row) => sum + (typeof row.marksObtained === "number" ? row.marksObtained : 0), 0) / filledMarks)
    : 0;
  const publishBlocked = localMissingMarks > 0 || missingMarks > 0 || workflowStatus !== "approved";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Result Management"
        description="Enter marks, add individual results, manage approval workflow and publish verified results."
        icon={ClipboardCheck}
        status={<WorkflowBadge status={workflowStatus} />}
        actions={[
          <Button key="add" size="sm" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Result
          </Button>,
          <Button key="refresh" variant="outline" size="sm" onClick={loadRows}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>,
        ]}
      />

      <section className="grid gap-3 md:grid-cols-4">
        <MetricCard title="Students" value={rows.length} helper="Loaded for selected filters" icon={Users} />
        <MetricCard title="Filled Marks" value={filledMarks} helper={`Missing ${localMissingMarks}`} icon={Save} />
        <MetricCard title="Pass / Fail" value={`${passCount}/${failCount}`} helper={`Pass mark ${marksSetup.passingMarks}`} icon={CheckCircle2} />
        <MetricCard title="Average" value={averageMarks} helper={`Out of ${marksSetup.totalMarks}`} icon={ClipboardCheck} />
      </section>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Filter label="Class" value={classId} onChange={updateClass}>
            <option value="">Select class</option>
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
          <Filter label="Section" value={sectionId} onChange={setSectionId}>
            <option value="">All sections</option>
            {availableSections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
          <Filter label="Exam" value={examId} onChange={setExamId}>
            <option value="">Select exam</option>
            {availableExams.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
          <Filter label="Subject" value={subjectId} onChange={setSubjectId}>
            <option value="">Select subject</option>
            {availableSubjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Filter>
        </div>
      </section>

      {error && <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" />{error}</div>}
      {success && <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Marks entry table</h2>
            <p className="mt-1 text-sm text-slate-500">
              Total marks {marksSetup.totalMarks}, passing marks {marksSetup.passingMarks}. Missing marks: {localMissingMarks}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={!readyForEntry || saving} onClick={saveDraft}>
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button type="button" variant="outline" disabled={!readyForEntry || saving || rows.length === 0} onClick={() => setConfirmAction("review")}>
              <Send className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
            <Button type="button" variant="outline" disabled={!readyForEntry || saving || workflowStatus === "draft"} onClick={() => setConfirmAction("assistant")}>
              Assistant Approval
            </Button>
            <Button type="button" variant="outline" disabled={!readyForEntry || saving || workflowStatus === "draft"} onClick={() => setConfirmAction("head")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Head Approval
            </Button>
            <Button type="button" disabled={!readyForEntry || saving || publishBlocked} onClick={() => setConfirmAction("publish")}>
              <Upload className="mr-2 h-4 w-4" />
              Publish Result
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Roll</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">Loading result rows...</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-slate-500">Select filters or click Add Result to enter marks.</TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.studentId}>
                    <TableCell>{row.rollNumber}</TableCell>
                    <TableCell className="font-medium text-slate-950">{row.studentName}</TableCell>
                    <TableCell>{row.section || "-"}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={marksSetup.totalMarks}
                        value={row.marksObtained}
                        onChange={(event) => updateMark(row.studentId, { marksObtained: event.target.value === "" ? "" : Number(event.target.value) })}
                        className="w-28"
                      />
                    </TableCell>
                    <TableCell>{row.grade || "-"}</TableCell>
                    <TableCell>
                      <Input
                        value={row.remarks || ""}
                        onChange={(event) => updateMark(row.studentId, { remarks: event.target.value })}
                        placeholder="Optional"
                      />
                    </TableCell>
                    <TableCell><WorkflowBadge status={row.workflowStatus || workflowStatus} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Result</DialogTitle>
            <DialogDescription>Select class, exam, subject and student, then enter marks. This saves as draft and can be approved later.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Filter label="Class" value={addForm.classId} onChange={(value) => updateAddForm("classId", value)}>
              <option value="">Select class</option>
              {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Filter>
            <Filter label="Section" value={addForm.sectionId} onChange={(value) => updateAddForm("sectionId", value)}>
              <option value="">All sections</option>
              {addSections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Filter>
            <Filter label="Exam" value={addForm.examId} onChange={(value) => updateAddForm("examId", value)}>
              <option value="">Select exam</option>
              {addExams.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Filter>
            <Filter label="Subject" value={addForm.subjectId} onChange={(value) => updateAddForm("subjectId", value)}>
              <option value="">Select subject</option>
              {addSubjects.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </Filter>
            <Filter label={addLoading ? "Student loading..." : "Student"} value={addForm.studentId} onChange={(value) => updateAddForm("studentId", value)}>
              <option value="">Select student</option>
              {addStudents.map((student) => <option key={student._id} value={student._id}>{student.rollNumber} - {student.userId?.name || "Student"}</option>)}
            </Filter>
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Marks</span>
              <Input
                type="number"
                min={0}
                max={marksSetup.totalMarks}
                value={addForm.marksObtained}
                onChange={(event) => updateAddForm("marksObtained", event.target.value)}
                placeholder={`Out of ${marksSetup.totalMarks}`}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Remarks</span>
              <Input value={addForm.remarks} onChange={(event) => updateAddForm("remarks", event.target.value)} placeholder="Optional remarks" />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="button" disabled={saving || !addForm.classId || !addForm.examId || !addForm.subjectId || !addForm.studentId || addForm.marksObtained === ""} onClick={saveSingleResult}>
              {saving ? "Saving..." : "Save Result"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(confirmAction)} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionTitle(confirmAction)}</DialogTitle>
            <DialogDescription>{actionDescription(confirmAction, localMissingMarks)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button type="button" disabled={saving || (confirmAction === "publish" && publishBlocked)} onClick={runWorkflowAction}>
              {saving ? "Working..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Filter({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function MetricCard({ title, value, helper, icon: Icon }: { title: string; value: string | number; helper: string; icon: any }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function WorkflowBadge({ status }: { status: WorkflowStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", statusClass(status))}>
      {status === "review" ? "Review" : status}
    </Badge>
  );
}

function statusClass(status: WorkflowStatus) {
  if (status === "published") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "approved") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "review") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-slate-200 bg-slate-50 text-slate-600";
}

function actionTitle(action: null | "review" | "assistant" | "head" | "publish") {
  if (action === "review") return "Submit for review?";
  if (action === "assistant") return "Assistant Head approval?";
  if (action === "head") return "Head approval?";
  if (action === "publish") return "Publish result?";
  return "Confirm action";
}

function actionDescription(action: null | "review" | "assistant" | "head" | "publish", missingMarks: number) {
  if (action === "publish" && missingMarks > 0) return `Publishing is blocked because ${missingMarks} required marks are missing.`;
  if (action === "publish") return "Published results will be visible in result workflows.";
  if (action === "review") return "This moves saved marks from Draft to Review.";
  if (action === "assistant") return "This records Assistant Head review approval.";
  if (action === "head") return "This records Head approval and unlocks publishing.";
  return "Please confirm this workflow change.";
}

function actionSuccess(action: "review" | "assistant" | "head" | "publish") {
  if (action === "review") return "Results submitted for review.";
  if (action === "assistant") return "Assistant approval saved.";
  if (action === "head") return "Head approval saved.";
  return "Results published successfully.";
}
