"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Download, Printer, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api, apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";

type ExamRoutine = {
  _id?: string;
  id?: string;
  name: string;
  type?: string;
  classId?: any;
  sectionId?: any;
  startDate?: string;
  endDate?: string;
  status?: string;
  isPublished?: boolean;
  subjectMarks?: any[];
  instructions?: string;
  syllabus?: string;
};

const manageRoles = ["head", "assistant_head", "admin", "super_admin", "subject_teacher"];
const dayName = (date?: string) => {
  if (!date) return "-";
  try { return new Date(date).toLocaleDateString("bn-BD", { weekday: "long" }); } catch { return "-"; }
};
const bnDate = (date?: string) => {
  if (!date) return "-";
  try { return new Date(date).toLocaleDateString("bn-BD"); } catch { return formatDate(date); }
};
const minutesText = (mins?: number) => mins ? `${Math.floor(mins / 60)} ঘন্টা ${mins % 60 ? `${mins % 60} মিনিট` : ""}`.trim() : "-";

export default function ExamRoutinePage() {
  const { user } = useAuth();
  const canManage = manageRoles.includes(user?.role || "");
  const printRef = useRef<HTMLDivElement | null>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<ExamRoutine[]>([]);
  const [classId, setClassId] = useState("");
  const [examId, setExamId] = useState("");
  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedExam = useMemo(() => exams.find((exam: any) => String(exam._id || exam.id) === String(examId)) || exams[0], [exams, examId]);
  const selectedClass = classes.find((item) => item._id === classId) || selectedExam?.classId;
  const routineRows = useMemo(() => {
    const rows = (selectedExam?.subjectMarks || []).map((item: any) => ({
      date: item.date,
      day: dayName(item.date),
      subject: item.subjectId?.name || item.subjectName || "-",
      code: item.subjectId?.code || item.subjectCode || "",
      duration: item.duration,
      totalMarks: item.totalMarks,
      passingMarks: item.passingMarks,
    }));
    return rows.sort((a: any, b: any) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  }, [selectedExam]);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      if (canManage) {
        const [classRes, examRes, profileRes] = await Promise.all([
          api.academic.classes.getAll() as Promise<any>,
          api.academic.exams.getAll() as Promise<any>,
          api.institution.profile().catch(() => null) as Promise<any>,
        ]);
        const nextClasses = classRes.classes || [];
        const nextExams = examRes.exams || [];
        setClasses(nextClasses);
        setExams(nextExams);
        setInstitution(profileRes?.institution || profileRes?.profile || null);
        setClassId((current) => current || nextClasses[0]?._id || "");
        setExamId((current) => current || nextExams[0]?._id || "");
      } else {
        const params = new URLSearchParams();
        if ((user as any)?.institutionId) params.set("institutionId", String((user as any).institutionId));
        if (classId) params.set("classId", classId);
        const data = await apiClient.get(`/academic/public/exam-routines?${params.toString()}`) as any;
        const nextExams = data.routines || [];
        setInstitution(data.institution || null);
        setExams(nextExams.map((item: any) => ({ ...item, _id: item.id, isPublished: true })));
        setExamId((current) => current || nextExams[0]?.id || "");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load exam routine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [canManage]);

  const publishRoutine = async (publish: boolean) => {
    if (!selectedExam) return;
    setError("");
    setMessage("");
    try {
      const id = selectedExam._id || selectedExam.id;
      await apiClient.patch(`/academic/exams/${id}/public-routine`, { isPublished: publish });
      setMessage(publish ? "Exam routine published for students/parents." : "Exam routine unpublished.");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to update exam routine publish status.");
    }
  };

  const printRoutine = () => window.print();
  const downloadPdf = () => window.print();

  return (
    <div className="space-y-5">
      <style jsx global>{`
        @media print {
          body * { visibility: hidden !important; }
          #exam-routine-print, #exam-routine-print * { visibility: visible !important; }
          #exam-routine-print { position: absolute; left: 0; top: 0; width: 100%; padding: 18px; background: #fff; color: #000; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 12mm; }
        }
      `}</style>

      <PageHeader
        title="Exam Routine"
        description="Class Routine-এর নিচে exam routine route. Exam Management-এ তৈরি exam-এর subject/date routine এখানেই publish এবং print হবে।"
        icon={CalendarDays}
        status={<Badge variant="outline">{routineRows.length} subjects</Badge>}
        actions={[
          <Button key="refresh" size="sm" variant="outline" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
          <Button key="print" size="sm" variant="outline" onClick={printRoutine}><Printer className="mr-2 h-4 w-4" />Print</Button>,
          <Button key="pdf" size="sm" variant="outline" onClick={downloadPdf}><Download className="mr-2 h-4 w-4" />PDF</Button>,
          canManage && selectedExam && <Button key="publish" size="sm" onClick={() => publishRoutine(!selectedExam.isPublished)}><CheckCircle2 className="mr-2 h-4 w-4" />{selectedExam.isPublished ? "Unpublish" : "Publish Routine"}</Button>,
        ].filter(Boolean) as any}
      />

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="no-print rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          {canManage && <label className="space-y-2"><span className="text-sm font-medium">Class</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={classId} onChange={(e) => setClassId(e.target.value)}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>}
          <label className="space-y-2 md:col-span-2"><span className="text-sm font-medium">Exam</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={examId} onChange={(e) => setExamId(e.target.value)}>{exams.filter((exam: any) => !classId || String(exam.classId?._id || exam.classId) === String(classId)).map((exam: any) => <option key={exam._id || exam.id} value={exam._id || exam.id}>{exam.name} {exam.classId?.name ? `- ${exam.classId.name}` : exam.className ? `- ${exam.className}` : ""}</option>)}</select></label>
        </div>
      </section>

      <div ref={printRef} id="exam-routine-print" className="mx-auto max-w-4xl rounded-lg border bg-white p-6 text-black shadow-sm">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b-2 border-black pb-3">
          <div className="text-left text-sm leading-tight">
            <h2 className="text-lg font-bold">{institution?.name || "প্রতিষ্ঠানের নাম"}</h2>
            <p>{institution?.address || "প্রতিষ্ঠানের ঠিকানা"}</p>
            <p>EIIN: {institution?.eiin || "-"}</p>
            <p>E-mail: {institution?.email || "-"}</p>
            <p>{institution?.website || ""}</p>
          </div>
          <div className="flex h-16 w-20 items-center justify-center border text-xs font-bold">LOGO</div>
          <div className="text-right text-sm leading-tight">
            <h2 className="text-lg font-bold uppercase">{institution?.name || "SCHOOL NAME"}</h2>
            <p>{institution?.address || "Address"}</p>
            <p>EIIN: {institution?.eiin || "-"}</p>
            <p>E-mail: {institution?.email || "-"}</p>
            <p>{institution?.website || ""}</p>
          </div>
        </div>

        <div className="mt-4 flex justify-between text-sm">
          <p>সূত্র:</p>
          <p>তারিখ: {bnDate(new Date().toISOString())}</p>
        </div>

        <div className="mt-2 text-center">
          <h1 className="text-xl font-bold underline">{selectedExam?.name || "পরীক্ষার রুটিন"}</h1>
          <p className="text-sm">{selectedClass?.name || selectedExam?.classId?.name || selectedExam?.className || "Class"} {selectedExam?.type ? `• ${selectedExam.type}` : ""}</p>
        </div>

        <table className="mt-5 w-full border-collapse text-center text-sm">
          <thead>
            <tr>
              <th className="border border-black p-2">তারিখ ও বার</th>
              <th className="border border-black p-2">বিষয়</th>
              <th className="border border-black p-2">বিষয় কোড</th>
              <th className="border border-black p-2">সময়</th>
              <th className="border border-black p-2">পূর্ণমান</th>
              <th className="border border-black p-2">পাস নম্বর</th>
            </tr>
          </thead>
          <tbody>
            {routineRows.length === 0 ? <tr><td className="border border-black p-6" colSpan={6}>No exam routine found. Exam Management-এ subject/date add করুন।</td></tr> : routineRows.map((row: any, index: number) => <tr key={index}>
              <td className="border border-black p-2">{bnDate(row.date)}<br />{row.day}</td>
              <td className="border border-black p-2 font-medium">{row.subject}</td>
              <td className="border border-black p-2">{row.code || "-"}</td>
              <td className="border border-black p-2">{minutesText(row.duration)}</td>
              <td className="border border-black p-2">{row.totalMarks || "-"}</td>
              <td className="border border-black p-2">{row.passingMarks || "-"}</td>
            </tr>)}
          </tbody>
        </table>

        {(selectedExam?.instructions || selectedExam?.syllabus) && <div className="mt-4 rounded border border-black p-3 text-sm">
          {selectedExam?.instructions && <p><strong>নির্দেশনা:</strong> {selectedExam.instructions}</p>}
          {selectedExam?.syllabus && <p><strong>সিলেবাস:</strong> {selectedExam.syllabus}</p>}
        </div>}

        <div className="mt-16 flex justify-end">
          <div className="text-center text-sm">
            <div className="mb-2 h-16 w-36 rounded-full border border-dashed border-black text-xs leading-[4rem]">Seal / Signature</div>
            <div className="border-t border-black px-4 pt-1 font-semibold">প্রধান শিক্ষকের স্বাক্ষর</div>
          </div>
        </div>
      </div>
    </div>
  );
}
