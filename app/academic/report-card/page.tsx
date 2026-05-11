"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Printer } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type StudentItem = { _id: string; rollNumber: string; userId?: { name: string; avatar?: string }; sectionId?: { _id: string; name: string } };
type ExamItem = { _id: string; name: string; classId?: { _id: string } };
type ReportCard = {
  studentName?: string;
  rollNumber?: string;
  className?: string;
  sectionName?: string;
  examName?: string;
  grade?: string;
  gpa?: number;
  percentage?: number;
  position?: number | null;
  teacherRemarks?: string;
  idCard?: { cardNumber?: string; photoUrl?: string };
  attendanceSummary?: { total: number; present: number; absent: number; late: number; leave: number };
  subjects?: Array<{ name: string; code?: string; marks?: number; grade?: string; gpa?: number; passed?: boolean }>;
};

export default function ReportCardPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [examId, setExamId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [reportCard, setReportCard] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];
  const availableExams = useMemo(() => exams.filter((exam) => !classId || exam.classId?._id === classId), [exams, classId]);

  const loadLookups = async () => {
    setLoading(true);
    setError("");
    try {
      const [classRes, examRes] = await Promise.all([
        api.academic.classes.getAll() as Promise<{ classes: ClassItem[] }>,
        api.academic.exams.getAll() as Promise<{ exams: ExamItem[] }>,
      ]);
      const firstClass = classRes.classes?.[0]?._id || "";
      setClasses(classRes.classes || []);
      setExams(examRes.exams || []);
      setClassId((current) => current || firstClass);
      setExamId((current) => current || examRes.exams?.find((exam) => exam.classId?._id === firstClass)?._id || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load report-card filters");
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!classId) return;
    const data = await api.academic.reportCard.students({ classId, sectionId: sectionId || undefined }) as { students: StudentItem[] };
    setStudents(data.students || []);
    setStudentId((current) => current || data.students?.[0]?._id || "");
  };

  const loadReportCard = async () => {
    if (!studentId) return;
    setError("");
    try {
      const data = await api.academic.reportCard.get({ classId, sectionId: sectionId || undefined, examId: examId || undefined, studentId }) as { reportCard: ReportCard };
      setReportCard(data.reportCard);
    } catch (err: any) {
      setError(err?.message || "Failed to load report card");
      setReportCard(null);
    }
  };

  useEffect(() => { loadLookups(); }, []);
  useEffect(() => { loadStudents().catch(() => setStudents([])); }, [classId, sectionId]);
  useEffect(() => { loadReportCard(); }, [studentId, examId]);

  const downloadPdf = async () => {
    if (!previewRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const jsPDF = (await import("jspdf")).default;
    const canvas = await html2canvas(previewRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, width, height);
    pdf.save(`${reportCard?.studentName || "report-card"}.pdf`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Report Card"
        description="Preview student report cards with marks, GPA, attendance and remarks."
        icon={FileText}
        status={<Badge variant="outline">{reportCard?.grade || "Preview"}</Badge>}
        actions={[
          { label: "Download PDF", icon: Download, onClick: downloadPdf },
          { label: "Print", icon: Printer, onClick: () => window.print() },
        ]}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <Select label="Class" value={classId} onChange={(value) => { setClassId(value); setSectionId(""); setStudentId(""); }}>
            <option value="">Select class</option>
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select label="Section" value={sectionId} onChange={(value) => { setSectionId(value); setStudentId(""); }}>
            <option value="">All sections</option>
            {sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select label="Exam" value={examId} onChange={setExamId}>
            <option value="">All exams</option>
            {availableExams.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select label="Student" value={studentId} onChange={setStudentId}>
            <option value="">Select student</option>
            {students.map((item) => <option key={item._id} value={item._id}>{item.rollNumber} - {item.userId?.name}</option>)}
          </Select>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div ref={previewRef} className="mx-auto max-w-4xl bg-white text-slate-950">
            {!reportCard ? (
              <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">{loading ? "Loading report card..." : "Select filters to preview a report card."}</div>
            ) : (
              <div className="space-y-6 rounded-lg border border-slate-200 p-6">
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5">
                  <div>
                    <p className="text-sm font-medium uppercase text-slate-500">Academic Report Card</p>
                    <h2 className="mt-1 text-2xl font-semibold">{reportCard.studentName}</h2>
                    <p className="mt-1 text-sm text-slate-600">Roll {reportCard.rollNumber} · {reportCard.className} · Section {reportCard.sectionName || "-"}</p>
                    <p className="text-sm text-slate-600">{reportCard.examName}</p>
                  </div>
                  <div className="h-24 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
                    {reportCard.idCard?.photoUrl ? <img src={reportCard.idCard.photoUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-slate-400">ID Photo</div>}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Metric label="Grade" value={reportCard.grade || "N/A"} />
                  <Metric label="GPA" value={reportCard.gpa ?? "N/A"} />
                  <Metric label="Position" value={reportCard.position || "N/A"} />
                  <Metric label="Attendance" value={`${reportCard.attendanceSummary?.present || 0}/${reportCard.attendanceSummary?.total || 0}`} />
                </div>

                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <th className="border border-slate-200 px-3 py-2">Subject</th>
                      <th className="border border-slate-200 px-3 py-2">Marks</th>
                      <th className="border border-slate-200 px-3 py-2">Grade</th>
                      <th className="border border-slate-200 px-3 py-2">GPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(reportCard.subjects || []).map((subject) => (
                      <tr key={`${subject.name}-${subject.code}`}>
                        <td className="border border-slate-200 px-3 py-2">{subject.name}</td>
                        <td className="border border-slate-200 px-3 py-2">{subject.marks ?? "-"}</td>
                        <td className="border border-slate-200 px-3 py-2">{subject.grade || "-"}</td>
                        <td className="border border-slate-200 px-3 py-2">{subject.gpa ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="font-semibold">Attendance Summary</h3>
                    <p className="mt-2 text-sm text-slate-600">Present {reportCard.attendanceSummary?.present || 0}, Absent {reportCard.attendanceSummary?.absent || 0}, Late {reportCard.attendanceSummary?.late || 0}, Leave {reportCard.attendanceSummary?.leave || 0}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="font-semibold">Teacher Remarks</h3>
                    <p className="mt-2 text-sm text-slate-600">{reportCard.teacherRemarks}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 p-3"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}
