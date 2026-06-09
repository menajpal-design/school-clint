"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Search, Ticket, UserRound } from "lucide-react";
import { Input } from "@/components/ui/input";
import { downloadElementPdf } from "@/lib/export-utils";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { AdmitCard } from "@/components/id-cards/AdmitCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

type StudentOption = {
  _id: string;
  rollNumber?: string;
  admissionNumber?: string;
  registrationNumber?: string;
  dateOfBirth?: string;
  fatherName?: string;
  motherName?: string;
  guardianName?: string;
  guardianPhone?: string;
  userId?: { name?: string; avatar?: string; dateOfBirth?: string };
  classId?: { _id?: string; name?: string; grade?: string };
  sectionId?: { name?: string };
};

type ExamItem = {
  _id: string;
  name?: string;
  date?: string;
  startDate?: string;
  duration?: number;
  classId?: { _id?: string; name?: string } | string;
  subjectMarks?: Array<{ date?: string; duration?: number; subjectId?: { name?: string; code?: string } }>;
};

const getStudentName = (student?: StudentOption) => student?.userId?.name || "Unnamed student";
const getStudentDob = (student?: StudentOption) => student?.dateOfBirth || student?.userId?.dateOfBirth || "";
const getClassId = (value: ExamItem["classId"]) => !value ? "" : typeof value === "string" ? value : value._id || "";
const formatDate = (value?: string) => { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return value; return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); };
const formatDuration = (minutes?: number) => { const value = Number(minutes || 0); if (!value) return ""; const hours = Math.floor(value / 60); const remaining = value % 60; return remaining ? `${hours}h ${remaining}m` : `${hours}h`; };
const saveBlob = (blob: Blob, filename: string) => { const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); };

export function AdmitCardDownload() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let mounted = true;
    Promise.all([api.students.getAll(), api.academic.exams.getAll().catch(() => ({ exams: [] })), api.institution.profile().catch(() => null)])
      .then(([studentResponse, examResponse, institutionResponse]: any[]) => {
        if (!mounted) return;
        const nextStudents = Array.isArray(studentResponse) ? studentResponse : studentResponse?.students || [];
        setStudents(nextStudents);
        setExams(examResponse?.exams || []);
        setInstitution(institutionResponse?.institution || null);
        setSelectedStudentId((current) => current || nextStudents[0]?._id || "");
      })
      .catch(() => { if (mounted) setStudents([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const selectedStudent = useMemo(() => students.find((student) => student._id === selectedStudentId), [selectedStudentId, students]);
  const selectedExam = useMemo(() => { const studentClassId = selectedStudent?.classId?._id || ""; return exams.find((exam) => getClassId(exam.classId) === studentClassId) || exams[0]; }, [exams, selectedStudent?.classId?._id]);
  const filteredStudents = useMemo(() => {
    if (!filter) return students;
    const q = filter.toLowerCase();
    return students.filter((s) => {
      const name = s.userId?.name || "";
      const roll = s.rollNumber || s.admissionNumber || s.registrationNumber || "";
      const className = s.classId && typeof s.classId === 'object' ? s.classId.name || "" : "";
      const dob = getStudentDob(s);
      return [name, roll, className, dob, s.fatherName, s.motherName].some((v) => String(v || "").toLowerCase().includes(q));
    });
  }, [students, filter]);

  const previewClassName = selectedStudent?.classId?.name || "";
  const previewSectionName = selectedStudent?.sectionId?.name ? `Section ${selectedStudent.sectionId.name}` : "";
  const previewRollNumber = selectedStudent?.rollNumber || selectedStudent?.admissionNumber || selectedStudent?.registrationNumber || selectedStudent?._id || "";
  const previewDateOfBirth = getStudentDob(selectedStudent);
  const previewExamRows = useMemo(() => {
    if (!selectedExam) return [{ courseCode: previewClassName || "Exam", examDate: "", examTime: "", examCentre: institution?.address || institution?.name || "" }];
    if (selectedExam.subjectMarks?.length) return selectedExam.subjectMarks.map((item) => ({ courseCode: item.subjectId?.code || item.subjectId?.name || previewClassName, examDate: formatDate(item.date), examTime: formatDuration(item.duration), examCentre: institution?.address || institution?.name || "" }));
    return [{ courseCode: previewClassName || "Exam", examDate: formatDate(selectedExam.date || selectedExam.startDate), examTime: formatDuration(selectedExam.duration), examCentre: institution?.address || institution?.name || "" }];
  }, [selectedExam, previewClassName, institution?.address, institution?.name]);

  const buildServerPayload = () => ({
    student: {
      _id: selectedStudent?._id,
      name: getStudentName(selectedStudent),
      rollNumber: previewRollNumber,
      className: [previewClassName, previewSectionName].filter(Boolean).join(" • "),
      stream: [previewClassName, previewSectionName].filter(Boolean).join(" • "),
      dateOfBirth: previewDateOfBirth,
      fatherName: selectedStudent?.fatherName || "",
      motherName: selectedStudent?.motherName || "",
      guardianName: selectedStudent?.guardianName || "",
      guardianPhone: selectedStudent?.guardianPhone || "",
      photoUrl: selectedStudent?.userId?.avatar || "",
    },
    institution: {
      name: institution?.name || "Institution",
      logo: institution?.logo || institution?.logoUrl || "",
      address: institution?.address || "",
      phone: institution?.phone || "",
      email: institution?.email || "",
      seal: institution?.seal || "",
      headSignature: institution?.headSignature || "",
      headName: institution?.headId?.name || institution?.headName || "",
      code: institution?.eiin || institution?.code || "",
    },
    exam: {
      name: selectedExam?.name || "Admit Card",
      date: selectedExam?.date || selectedExam?.startDate || "",
      startDate: selectedExam?.startDate || selectedExam?.date || "",
      duration: selectedExam?.duration || "",
      center: institution?.address || "",
      centerCode: institution?.eiin || institution?.code || "",
    },
    examRows: previewExamRows,
    qrData: JSON.stringify({ type: "admit-card", studentId: selectedStudent?._id, roll: previewRollNumber, examId: selectedExam?._id, institution: institution?.name || "Institution" }),
  });

  const handleDownload = async () => {
    if (!selectedStudent) return;
    setDownloading(true);
    const rollNumber = selectedStudent.rollNumber || selectedStudent.admissionNumber || selectedStudent.registrationNumber || selectedStudent._id;
    try {
      const blob = await api.idCards.admitCardPdf(buildServerPayload());
      if (blob && blob.size > 0) {
        saveBlob(blob, `admit-card-${rollNumber}.pdf`);
        return;
      }
      throw new Error("Empty server PDF");
    } catch (_) {
      await downloadElementPdf(previewRef.current, `admit-card-${rollNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 text-white">
        <CardTitle className="flex items-center gap-2 text-xl"><Ticket className="h-5 w-5" />Professional Admit Card Generator</CardTitle>
        <CardDescription className="text-slate-200">Select a student, review exam details and download an official admit card.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 p-4 md:p-6">
        <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="admit-search" className="flex items-center gap-2"><Search className="h-4 w-4" />Search student</Label>
            <Input id="admit-search" placeholder={loading ? "Loading students..." : "Search name, class, roll, DOB, father or mother"} value={filter} onChange={(e) => setFilter((e.target as HTMLInputElement).value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="student" className="flex items-center gap-2"><UserRound className="h-4 w-4" />Student</Label>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={loading || !students.length}>
              <SelectTrigger id="student"><SelectValue placeholder={loading ? "Loading students..." : "Select student"} /></SelectTrigger>
              <SelectContent>{filteredStudents.map((student) => <SelectItem key={student._id} value={student._id}>{getStudentName(student)}{student.rollNumber ? ` - Roll ${student.rollNumber}` : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button onClick={handleDownload} disabled={!selectedStudent || downloading} className="w-full lg:w-auto">
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Server PDF
          </Button>
        </div>

        {selectedStudent && (
          <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm md:grid-cols-4">
            <Info label="Student" value={getStudentName(selectedStudent)} />
            <Info label="Roll" value={previewRollNumber} />
            <Info label="Class" value={[previewClassName, previewSectionName].filter(Boolean).join(" • ")} />
            <Info label="Exam" value={selectedExam?.name || "Admit Card"} />
          </div>
        )}

        <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-base font-bold text-slate-950">Preview admit card</div>
              <p className="text-sm text-slate-500">Top download uses server-rendered PDF. Preview buttons remain available as fallback.</p>
            </div>
            <DownloadButtons targetRef={previewRef} filename={`admit-card-${previewRollNumber || "student"}`} printTitle="Print Admit Card" emailSubject={`Admit Card - ${getStudentName(selectedStudent)}`} />
          </div>
          <div className="overflow-x-auto rounded-xl bg-slate-100 p-3">
            <div className="min-w-max">
              <AdmitCard ref={previewRef} name={getStudentName(selectedStudent)} rollNumber={previewRollNumber} photoUrl={selectedStudent?.userId?.avatar || ""} institutionName={institution?.name || "Institution"} institutionLogo={institution?.logo || institution?.logoUrl || ""} institutionAddress={institution?.address || ""} institutionPhone={institution?.phone || ""} institutionEmail={institution?.email || ""} institutionSeal={institution?.seal || ""} headSignature={institution?.headSignature || ""} examName={selectedExam?.name || "Admit Card"} examDate={selectedExam?.date || selectedExam?.startDate || ""} examCenter={institution?.address || ""} centerCode={institution?.eiin || institution?.code || ""} headName={institution?.headId?.name || institution?.headName || ""} dateOfBirth={previewDateOfBirth} fatherName={selectedStudent?.fatherName || ""} motherName={selectedStudent?.motherName || ""} stream={[previewClassName, previewSectionName].filter(Boolean).join(" • ")} examData={previewExamRows} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value || "-"}</p></div>;
}

export default AdmitCardDownload;
