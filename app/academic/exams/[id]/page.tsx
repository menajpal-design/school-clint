"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, ClipboardList, FileText, Loader2, Plus, RefreshCw, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type SubjectSchedule = { subjectId?: any; date?: string; duration?: number; totalMarks?: number; passingMarks?: number; isCompleted?: boolean; completedAt?: string; resultEntryEnabled?: boolean };
type ExamItem = { _id: string; name: string; type?: string; classId?: any; startDate?: string; endDate?: string; status?: string; isPublished?: boolean; approvalRequired?: boolean; subjectMarks?: SubjectSchedule[] };
type ParticipantRow = { studentId: string; rollNumber: string; studentName: string; section: string; enteredSubjects: number; totalSubjects: number; totalMarks: number; average: number; status: string; missingSubjects: string[] };
const idOf = (value: any) => String(value?._id || value?.id || value || "");
const subjectName = (mark: SubjectSchedule) => mark.subjectId?.name || "Subject";
const subjectCode = (mark: SubjectSchedule) => mark.subjectId?.code ? ` (${mark.subjectId.code})` : "";
const resultStatusWeight: Record<string, number> = { draft: 1, review: 2, approved: 3, published: 4 };
const strongestStatus = (statuses: string[]) => statuses.sort((a, b) => (resultStatusWeight[b] || 0) - (resultStatusWeight[a] || 0))[0] || "not started";

export default function ExamSubjectProgressPage() {
  const params = useParams();
  const router = useRouter();
  const examId = String(params?.id || "");
  const [exam, setExam] = useState<ExamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [participants, setParticipants] = useState<ParticipantRow[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError("");
    try {
      const data: any = await apiClient.get(`/academic/exams/${examId}`);
      const nextExam = data?.exam || null;
      setExam(nextExam);
      void loadParticipants(nextExam);
    } catch (err: any) {
      setError(err?.message || "Failed to load exam details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExam(); }, [examId]);

  const schedules = useMemo(() => Array.isArray(exam?.subjectMarks) ? exam!.subjectMarks : [], [exam]);
  const completedCount = schedules.filter((item) => item.isCompleted || item.resultEntryEnabled).length;
  const classId = idOf(exam?.classId);
  const totalParticipants = participants.length;
  const startedCount = participants.filter((item) => item.enteredSubjects > 0).length;
  const fullyEnteredCount = participants.filter((item) => item.totalSubjects > 0 && item.enteredSubjects >= item.totalSubjects).length;

  const loadParticipants = async (nextExam: ExamItem | null = exam) => {
    const nextClassId = idOf(nextExam?.classId);
    const marks = Array.isArray(nextExam?.subjectMarks) ? nextExam!.subjectMarks : [];
    if (!nextClassId) { setParticipants([]); return; }
    setParticipantsLoading(true);
    try {
      const scheduledSubjects = marks.map((mark) => ({ id: idOf(mark.subjectId), name: subjectName(mark) })).filter((item) => item.id);
      if (!scheduledSubjects.length) {
        const data = await api.academic.reportCard.students({ classId: nextClassId }) as any;
        setParticipants((data.students || []).map((student: any) => ({ studentId: student._id, rollNumber: student.rollNumber || "-", studentName: student.userId?.name || "Student", section: student.sectionId?.name || "-", enteredSubjects: 0, totalSubjects: 0, totalMarks: 0, average: 0, status: "routine pending", missingSubjects: [] })));
        return;
      }
      const subjectEntries = await Promise.all(scheduledSubjects.map(async (subject) => {
        try {
          const data = await api.academic.results.getEntry({ classId: nextClassId, examId, subjectId: subject.id }) as any;
          return { subject, rows: data.rows || [] };
        } catch {
          return { subject, rows: [] };
        }
      }));
      const byStudent = new Map<string, ParticipantRow & { statuses: string[] }>();
      subjectEntries.forEach(({ subject, rows }) => {
        rows.forEach((row: any) => {
          const studentId = idOf(row.studentId);
          if (!studentId) return;
          const current = byStudent.get(studentId) || { studentId, rollNumber: row.rollNumber || "-", studentName: row.studentName || "Student", section: row.section || "-", enteredSubjects: 0, totalSubjects: scheduledSubjects.length, totalMarks: 0, average: 0, status: "not started", missingSubjects: [] as string[], statuses: [] as string[] };
          const hasMark = row.marksObtained !== "" && row.marksObtained !== undefined && row.marksObtained !== null;
          if (hasMark) {
            current.enteredSubjects += 1;
            current.totalMarks += Number(row.marksObtained || 0);
            current.statuses.push(row.workflowStatus || "draft");
          } else {
            current.missingSubjects.push(subject.name);
          }
          byStudent.set(studentId, current);
        });
      });
      setParticipants(Array.from(byStudent.values()).map((student) => ({
        ...student,
        average: student.enteredSubjects ? Math.round(student.totalMarks / student.enteredSubjects) : 0,
        status: student.enteredSubjects === 0 ? "not started" : student.enteredSubjects < student.totalSubjects ? "partial" : strongestStatus(student.statuses),
      })).sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber), undefined, { numeric: true })));
    } finally {
      setParticipantsLoading(false);
    }
  };

  const completeSubject = async (mark: SubjectSchedule, complete = true) => {
    const subjectId = idOf(mark.subjectId);
    if (!subjectId) return setError("Subject id missing.");
    setSavingKey(subjectId);
    setError("");
    setSuccess("");
    try {
      const data: any = await apiClient.patch(`/academic/exams/${examId}/subjects/${subjectId}/complete`, { complete });
      const nextExam = data?.exam || exam;
      setExam(nextExam);
      void loadParticipants(nextExam);
      setSuccess(complete ? "Subject exam completed. Result entry is now enabled." : "Subject completion removed.");
    } catch (err: any) {
      setError(err?.message || "Failed to update subject completion.");
    } finally {
      setSavingKey("");
    }
  };

  const resultHref = (mark: SubjectSchedule, openAdd = true) => `/academic/results?classId=${classId}&examId=${examId}&subjectId=${idOf(mark.subjectId)}${openAdd ? "&openAdd=1" : ""}`;
  const reportCardHref = `/academic/report-card?classId=${classId}&examId=${examId}`;

  if (loading) return <div className="flex h-56 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!exam) return <div className="space-y-4 p-4 md:p-6"><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Exam not found."}</div></div>;

  return <div className="space-y-6 p-4 md:p-6">
    <PageHeader title="Exam Subject Progress" description="Subject-wise exam complete করুন, তারপর result add/entry করুন।" icon={ClipboardList} actions={[<Link key="back" href="/academic/exam-management"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Exam Management</Button></Link>, <Button key="refresh" variant="outline" size="sm" onClick={loadExam}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]} status={<Badge className={completedCount === schedules.length && schedules.length ? "bg-emerald-600" : ""} variant={completedCount ? "default" : "outline"}>{completedCount}/{schedules.length} completed</Badge>} />

    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Exam</p><p className="mt-1 font-bold">{exam.name}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Class</p><p className="mt-1 font-bold">{exam.classId?.name || "-"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Date</p><p className="mt-1 font-bold">{exam.startDate ? formatDate(exam.startDate) : "-"} → {exam.endDate ? formatDate(exam.endDate) : "-"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Status</p><p className="mt-1 font-bold capitalize">{exam.status || "scheduled"}</p></CardContent></Card>
    </div>


    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Students in class</p><p className="mt-1 text-2xl font-bold">{totalParticipants}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Result started</p><p className="mt-1 text-2xl font-bold">{startedCount}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">All subjects entered</p><p className="mt-1 text-2xl font-bold">{fullyEnteredCount}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Result workflow</p><div className="mt-2 flex flex-wrap gap-2"><Link href={resultHref(schedules[0] || {}, false)}><Button size="sm" variant="outline"><Users className="mr-1 h-3 w-3" />Entry</Button></Link><Link href={reportCardHref}><Button size="sm" variant="outline"><FileText className="mr-1 h-3 w-3" />Report</Button></Link></div></CardContent></Card>
    </div>

    <Card className="shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5" />Subject-wise Exam Completion</CardTitle><CardDescription>Exam শেষ হলে subject complete করুন। Complete করার পর Add Result button active হবে।</CardDescription></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Date</TableHead><TableHead>Duration</TableHead><TableHead>Total</TableHead><TableHead>Passing</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {schedules.length === 0 ? <TableRow><TableCell colSpan={7} className="h-28 text-center text-muted-foreground">No subject schedule found. Edit exam and add subjects first.</TableCell></TableRow> : schedules.map((mark) => {
              const sid = idOf(mark.subjectId);
              const completed = Boolean(mark.isCompleted || mark.resultEntryEnabled);
              return <TableRow key={sid || subjectName(mark)}>
                <TableCell><div className="font-semibold">{subjectName(mark)}{subjectCode(mark)}</div></TableCell>
                <TableCell>{mark.date ? formatDate(mark.date) : "-"}</TableCell>
                <TableCell>{mark.duration || 0} min</TableCell>
                <TableCell>{mark.totalMarks || 0}</TableCell>
                <TableCell>{mark.passingMarks || 0}</TableCell>
                <TableCell>{completed ? <Badge className="bg-emerald-600"><CheckCircle2 className="mr-1 h-3 w-3" />Completed</Badge> : <Badge variant="outline">Pending</Badge>}</TableCell>
                <TableCell><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant={completed ? "outline" : "default"} disabled={savingKey === sid} onClick={() => completeSubject(mark, !completed)}>{savingKey === sid && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}{completed ? "Undo Complete" : "Exam Complete"}</Button><Link href={resultHref(mark)}><Button size="sm" variant="outline" disabled={!completed}><Plus className="mr-1 h-3 w-3" />Add Result</Button></Link></div></TableCell>
              </TableRow>;
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <Card className="shadow-sm">
      <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Exam Participants & Result Progress</CardTitle><CardDescription>এই class-এর কে কে exam/result workflow-এ আছে, কার কোন subject marks বাকি, আর result status এক জায়গায় দেখুন।</CardDescription></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Roll</TableHead><TableHead>Student</TableHead><TableHead>Section</TableHead><TableHead>Entered</TableHead><TableHead>Total marks</TableHead><TableHead>Average</TableHead><TableHead>Status</TableHead><TableHead>Missing subjects</TableHead></TableRow></TableHeader>
          <TableBody>
            {participantsLoading ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-muted-foreground">Loading participants...</TableCell></TableRow> : participants.length === 0 ? <TableRow><TableCell colSpan={8} className="h-28 text-center text-muted-foreground">No students/result rows found for this exam class.</TableCell></TableRow> : participants.map((student) => (
              <TableRow key={student.studentId}>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell className="font-semibold">{student.studentName}</TableCell>
                <TableCell>{student.section || "-"}</TableCell>
                <TableCell>{student.enteredSubjects}/{student.totalSubjects}</TableCell>
                <TableCell>{student.totalMarks}</TableCell>
                <TableCell>{student.average}</TableCell>
                <TableCell><Badge variant="outline" className={student.status === "published" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : student.status === "approved" ? "border-blue-200 bg-blue-50 text-blue-700" : student.status === "partial" ? "border-amber-200 bg-amber-50 text-amber-700" : ""}>{student.status}</Badge></TableCell>
                <TableCell className="max-w-[260px] truncate" title={student.missingSubjects.join(", ")}>{student.missingSubjects.length ? student.missingSubjects.join(", ") : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>;
}
