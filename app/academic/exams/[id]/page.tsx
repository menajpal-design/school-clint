"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, ClipboardList, Loader2, Plus, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type SubjectSchedule = { subjectId?: any; date?: string; duration?: number; totalMarks?: number; passingMarks?: number; isCompleted?: boolean; completedAt?: string; resultEntryEnabled?: boolean };
type ExamItem = { _id: string; name: string; type?: string; classId?: any; startDate?: string; endDate?: string; status?: string; isPublished?: boolean; approvalRequired?: boolean; subjectMarks?: SubjectSchedule[] };
const idOf = (value: any) => String(value?._id || value?.id || value || "");
const subjectName = (mark: SubjectSchedule) => mark.subjectId?.name || "Subject";
const subjectCode = (mark: SubjectSchedule) => mark.subjectId?.code ? ` (${mark.subjectId.code})` : "";

export default function ExamSubjectProgressPage() {
  const params = useParams();
  const router = useRouter();
  const examId = String(params?.id || "");
  const [exam, setExam] = useState<ExamItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadExam = async () => {
    if (!examId) return;
    setLoading(true);
    setError("");
    try {
      const data: any = await apiClient.get(`/academic/exams/${examId}`);
      setExam(data?.exam || null);
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

  const completeSubject = async (mark: SubjectSchedule, complete = true) => {
    const subjectId = idOf(mark.subjectId);
    if (!subjectId) return setError("Subject id missing.");
    setSavingKey(subjectId);
    setError("");
    setSuccess("");
    try {
      const data: any = await apiClient.patch(`/academic/exams/${examId}/subjects/${subjectId}/complete`, { complete });
      setExam(data?.exam || exam);
      setSuccess(complete ? "Subject exam completed. Result entry is now enabled." : "Subject completion removed.");
    } catch (err: any) {
      setError(err?.message || "Failed to update subject completion.");
    } finally {
      setSavingKey("");
    }
  };

  const resultHref = (mark: SubjectSchedule) => `/academic/results?classId=${classId}&examId=${examId}&subjectId=${idOf(mark.subjectId)}&openAdd=1`;

  if (loading) return <div className="flex h-56 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!exam) return <div className="space-y-4 p-4 md:p-6"><Button variant="outline" onClick={() => router.back()}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Exam not found."}</div></div>;

  return <div className="space-y-6 p-4 md:p-6">
    <PageHeader title="Exam Subject Progress" description="Subject-wise exam complete করুন, তারপর result add/entry করুন।" icon={ClipboardList} actions={[<Link key="back" href="/academic/exams"><Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Exams</Button></Link>, <Button key="refresh" variant="outline" size="sm" onClick={loadExam}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]} status={<Badge className={completedCount === schedules.length && schedules.length ? "bg-emerald-600" : ""} variant={completedCount ? "default" : "outline"}>{completedCount}/{schedules.length} completed</Badge>} />

    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{success}</div>}

    <div className="grid gap-4 md:grid-cols-4">
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Exam</p><p className="mt-1 font-bold">{exam.name}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Class</p><p className="mt-1 font-bold">{exam.classId?.name || "-"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Date</p><p className="mt-1 font-bold">{exam.startDate ? formatDate(exam.startDate) : "-"} → {exam.endDate ? formatDate(exam.endDate) : "-"}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs uppercase text-muted-foreground">Status</p><p className="mt-1 font-bold capitalize">{exam.status || "scheduled"}</p></CardContent></Card>
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
  </div>;
}
