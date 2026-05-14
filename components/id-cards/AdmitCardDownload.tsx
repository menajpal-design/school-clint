"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { downloadBlob } from "@/lib/utils";

type StudentOption = {
  _id: string;
  rollNumber?: string;
  admissionNumber?: string;
  registrationNumber?: string;
  fatherName?: string;
  userId?: {
    name?: string;
    avatar?: string;
    dateOfBirth?: string;
  };
  classId?: {
    _id?: string;
    name?: string;
    grade?: string;
  };
  sectionId?: {
    name?: string;
  };
};

type ExamItem = {
  _id: string;
  name?: string;
  date?: string;
  startDate?: string;
  duration?: number;
  classId?: {
    _id?: string;
    name?: string;
  } | string;
  subjectMarks?: Array<{
    date?: string;
    duration?: number;
    subjectId?: {
      name?: string;
      code?: string;
    };
  }>;
};

const getStudentName = (student?: StudentOption) => student?.userId?.name || "Unnamed student";

const getClassId = (value: ExamItem["classId"]) => {
  if (!value) return "";
  return typeof value === "string" ? value : value._id || "";
};

const formatDate = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDuration = (minutes?: number) => {
  const value = Number(minutes || 0);
  if (!value) return "";
  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
};

export function AdmitCardDownload() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [institution, setInstitution] = useState<any>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      api.students.getAll(),
      api.academic.exams.getAll().catch(() => ({ exams: [] })),
      api.institution.profile().catch(() => null),
    ])
      .then(([studentResponse, examResponse, institutionResponse]: any[]) => {
        if (!mounted) return;
        const nextStudents = Array.isArray(studentResponse) ? studentResponse : studentResponse?.students || [];
        setStudents(nextStudents);
        setExams(examResponse?.exams || []);
        setInstitution(institutionResponse?.institution || null);
        setSelectedStudentId((current) => current || nextStudents[0]?._id || "");
      })
      .catch(() => {
        if (mounted) setStudents([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedStudent = useMemo(
    () => students.find((student) => student._id === selectedStudentId),
    [selectedStudentId, students]
  );

  const selectedExam = useMemo(() => {
    const studentClassId = selectedStudent?.classId?._id || "";
    return exams.find((exam) => getClassId(exam.classId) === studentClassId) || exams[0];
  }, [exams, selectedStudent?.classId?._id]);

  const handleDownload = async () => {
    if (!selectedStudent) return;
    setDownloading(true);
    try {
      const fullStudentResponse = await api.students.getById(selectedStudent._id).catch(() => selectedStudent) as any;
      const student = (fullStudentResponse?.student || fullStudentResponse || selectedStudent) as StudentOption;
      const exam = selectedExam;
      const className = student.classId?.name || "";
      const sectionName = student.sectionId?.name ? `-${student.sectionId.name}` : "";
      const rollNumber = student.rollNumber || student.admissionNumber || student.registrationNumber || student._id;
      const examRows = exam?.subjectMarks?.length
        ? exam.subjectMarks.map((item) => ({
            courseCode: item.subjectId?.code || item.subjectId?.name || className,
            examDate: formatDate(item.date),
            examTime: formatDuration(item.duration),
            examCentre: institution?.address || institution?.name || "",
          }))
        : [{
            courseCode: className || "Exam",
            examDate: formatDate(exam?.date || exam?.startDate),
            examTime: formatDuration(exam?.duration),
            examCentre: institution?.address || institution?.name || "",
          }];

      const blob = await api.idCards.renderPdf({
        cardType: "admit-card",
        name: getStudentName(student),
        idNumber: rollNumber,
        enrollmentNumber: rollNumber,
        photoUrl: student.userId?.avatar || "",
        institutionName: institution?.name || "Institution",
        institutionLogo: institution?.logo || institution?.logoUrl || "",
        examName: exam?.name || "Admit Card",
        examDate: exam?.date || exam?.startDate || "",
        examCenter: institution?.address || "",
        centerCode: institution?.eiin || institution?.code || "",
        dateOfBirth: student.userId?.dateOfBirth || "",
        fatherName: student.fatherName || "",
        stream: [className, sectionName].filter(Boolean).join(" "),
        program: [className, sectionName].filter(Boolean).join(" ") || "Student",
        examData: examRows,
      });

      downloadBlob(blob, `admit-card-${rollNumber}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5" />
          Admit Card Download
        </CardTitle>
        <CardDescription>Select a student from the database and download the admit card.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="student">Student</Label>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId} disabled={loading || !students.length}>
            <SelectTrigger id="student">
              <SelectValue placeholder={loading ? "Loading students..." : "Select student"} />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student._id} value={student._id}>
                  {getStudentName(student)}{student.rollNumber ? ` - ${student.rollNumber}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleDownload} disabled={!selectedStudent || downloading} className="w-full sm:w-auto">
          {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download Admit Card
        </Button>
      </CardContent>
    </Card>
  );
}

export default AdmitCardDownload;
