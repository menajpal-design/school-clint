"use client";

import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Camera, ClipboardCheck, Download, FileSpreadsheet, FileText, Save, Calendar as CalendarIcon } from "lucide-react";

import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";
import { downloadFile, cn } from "@/lib/utils";
import { authManager } from "@/lib/auth";
import { getPrintInstitution, makeQrDataUrl } from "@/lib/export-utils";

type Status = "present" | "absent" | "late" | "leave";
type PersonType = "student" | "teacher";
type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Student = { _id: string; profileId?: string; personType?: PersonType; rollNumber?: string; employeeId?: string; designation?: string; department?: string; userId?: { _id?: string; name: string; avatar?: string; role?: string }; classId?: { _id: string }; sectionId?: { _id: string; name: string }; status?: Status; presentCount?: number; attendanceRecords?: Array<{ date: string; status: Status }> };

const today = () => new Date().toISOString().slice(0, 10);
const dateKey = (value?: string | Date) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return new Date(value).toISOString().slice(0, 10);
};
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const summarizeRecords = (records: Array<{ status: Status }> = []) => ({
  total: records.length,
  present: records.filter((record) => record.status === "present").length,
  absent: records.filter((record) => record.status === "absent").length,
  late: records.filter((record) => record.status === "late").length,
  leave: records.filter((record) => record.status === "leave").length,
});

export default function AttendanceMarkPage() {
  const { addToast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [personType, setPersonType] = useState<PersonType>("student");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [message, setMessage] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarStudent, setCalendarStudent] = useState<Student | null>(null);
  const [calendarViewYear, setCalendarViewYear] = useState<number>(new Date().getFullYear());
  const [calendarSelectedMonth, setCalendarSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [calendarSelectedDay, setCalendarSelectedDay] = useState<number | null>(null);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];
  const canManageTeachers = authManager.hasRole(['head', 'assistant_head']);
  const activePeopleLabel = personType === "teacher" ? "teachers" : "students";
  const currentCalendarStudent = useMemo(() => {
    if (!calendarStudent) return null;
    const matchingStudent = students.find((student) => student._id === calendarStudent._id);
    if (!matchingStudent) return calendarStudent;
    return {
      ...matchingStudent,
      attendanceRecords: calendarStudent.attendanceRecords || matchingStudent.attendanceRecords,
      presentCount: calendarStudent.presentCount ?? matchingStudent.presentCount,
    };
  }, [students, calendarStudent]);

  // Check if user is teacher or upper role for enhanced UI
  const isTeacherOrUpperRole = authManager.hasRole(['class_teacher', 'subject_teacher', 'head', 'assistant_head']);

  const notify = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    addToast({ title, message, type, duration: 3500 });
  };

  // Fetch and set fresh attendance history for a student into calendarStudent
  const fetchCalendarStudent = async (studentId: string) => {
    try {
      const res = personType === "teacher"
        ? await api.attendance.getPersonAttendance("teacher", studentId) as { attendance: Array<{ date: string; status: Status }> }
        : await api.attendance.getStudentAttendance(studentId) as { attendance: Array<{ date: string; status: Status }> };
      const records = (res.attendance || []).map((r) => ({ date: dateKey(r.date), status: r.status }));
      const stu = students.find(s => s._id === studentId) || { _id: studentId } as Student;
      const presentCount = records.filter((r) => r.status === 'present').length;
      const enriched = { ...stu, attendanceRecords: records, presentCount } as Student;
      setStudents((current) => current.map((student) => student._id === studentId ? { ...student, attendanceRecords: records, presentCount } : student));
      setCalendarStudent(enriched);
      return enriched;
    } catch (e) {
      const stu = students.find(s => s._id === studentId) || { _id: studentId } as Student;
      const enriched = { ...stu, attendanceRecords: [], presentCount: 0 } as Student;
      setCalendarStudent(enriched);
      return enriched;
    }
  };


  const loadClasses = async () => {
    const data = await api.academic.classes.getAll() as { classes: ClassItem[] };
    setClasses(data.classes || []);
    setClassId((current) => current || data.classes?.[0]?._id || "");
  };

  const loadStudents = async (overrideDate?: string) => {
    if (personType === "student" && !classId) return [] as Student[];
    const usedDate = overrideDate || date;
    const data = await api.attendance.getPeople({ personType, classId: personType === "student" ? classId : undefined, sectionId: personType === "student" ? sectionId || undefined : undefined }) as { people: Student[] };
    const attendance = await api.attendance.getAll({
      classId: personType === "student" ? classId : undefined,
      sectionId: personType === "student" ? sectionId || undefined : undefined,
      userType: personType === "teacher" ? "teacher" : undefined,
      date: usedDate,
    }) as { attendance: any[] };
    const statusByStudent = new Map((attendance.attendance || []).map((item) => [String(personType === "teacher" ? item.userId?._id || item.userId : item.studentId?._id || item.studentId), item.status]));
    const baseStudents = (data.people || []).map((student) => ({ ...student, personType, status: (statusByStudent.get(student._id) as Status) || "absent" }));

    // Fetch individual student attendance history to compute month present counts
    const [yearStr, monthStr] = usedDate.split('-');
    const month = Number(monthStr);
    const year = Number(yearStr);

    const withCounts = await Promise.all(baseStudents.map(async (student) => {
      try {
        const res = personType === "teacher"
          ? await api.attendance.getPersonAttendance("teacher", student._id) as { attendance: Array<{ date: string; status: Status }> }
          : await api.attendance.getStudentAttendance(student._id) as { attendance: Array<{ date: string; status: Status }> };
        const records = (res.attendance || []).map((r) => ({ date: dateKey(r.date), status: r.status }));
        const presentCount = records.filter((r) => r.status === 'present').length;
        return { ...student, attendanceRecords: records, presentCount } as Student;
      } catch (e) {
        return { ...student, attendanceRecords: [], presentCount: 0 } as Student;
      }
    }));

    setStudents(withCounts);
    return withCounts;
  };

  useEffect(() => { loadClasses().catch(() => undefined); }, []);
  useEffect(() => { if (personType === "teacher" || classId) loadStudents(); }, [personType, classId, sectionId, date]);

  const setAll = (status: Status) => setStudents((current) => current.map((student) => ({ ...student, status })));
  const setOne = (id: string, status: Status) => setStudents((current) => current.map((student) => student._id === id ? { ...student, status } : student));

  const className = selectedClass?.name || "Selected class";
  const rosterName = personType === "teacher" ? "Teachers" : className;
  const idLabel = personType === "teacher" ? "Employee ID" : "Roll";
  const groupLabel = personType === "teacher" ? "Department" : "Class";
  const subGroupLabel = personType === "teacher" ? "Designation" : "Section";
  const personIdValue = (student: Student) => student.rollNumber || student.employeeId || "-";
  const groupValue = (student: Student) => personType === "teacher" ? student.department || "-" : className;
  const subGroupValue = (student: Student) => personType === "teacher" ? student.designation || "-" : student.sectionId?.name || (sectionId ? sections.find((section) => section._id === sectionId)?.name : "All sections") || "-";

  const exportClassExcel = () => {
    const headers = [idLabel, "Name", "Type", groupLabel, subGroupLabel, "Selected Date", "Date Status", "Total", "Present", "Absent", "Late", "Leave"];
    const rows = students.map((student) => {
      const summary = summarizeRecords(student.attendanceRecords);
      return [
        personIdValue(student),
        student.userId?.name || "-",
        personType,
        groupValue(student),
        subGroupValue(student),
        date,
        student.status || "-",
        summary.total,
        summary.present,
        summary.absent,
        summary.late,
        summary.leave,
      ];
    });
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadFile(`\uFEFF${csv}`, `attendance-${rosterName.replace(/\s+/g, "-").toLowerCase()}-${date}.csv`, "text/csv;charset=utf-8");
  };

  const exportClassPdf = async () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const institution = getPrintInstitution();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const qrDataUrl = await makeQrDataUrl(JSON.stringify({ title: "Attendance", rosterName, personType, date, records: students.length, generatedAt: new Date().toISOString() }), 96);
    const columns = [
      { label: idLabel, width: 70 },
      { label: "Name", width: 170 },
      { label: subGroupLabel, width: 90 },
      { label: "Date Status", width: 88 },
      { label: "Total", width: 58 },
      { label: "Present", width: 65 },
      { label: "Absent", width: 65 },
      { label: "Late", width: 58 },
      { label: "Leave", width: 58 },
    ];

    const drawHeader = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 72, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(institution.name, margin, 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`${personType === "teacher" ? "Teacher" : "Student"} Attendance | ${rosterName} | ${date} | Records: ${students.length}`, margin, 44);
      if (institution.address) doc.text(institution.address, margin, 58);
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 54, 14, 48, 48);
    };

    const drawTableHeader = (y: number) => {
      let x = margin;
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 24, "F");
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      columns.forEach((column) => {
        doc.text(column.label, x + 5, y + 16);
        x += column.width;
      });
    };

    drawHeader();
    drawTableHeader(88);
    let y = 116;
    const rows = students.length ? students : [{ _id: "empty", rollNumber: "-", userId: { name: "No records found" }, status: undefined, attendanceRecords: [] } as Student];
    rows.forEach((student, index) => {
      if (y > pageHeight - 44) {
        doc.addPage();
        drawHeader();
        drawTableHeader(88);
        y = 116;
      }
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 14, pageWidth - margin * 2, 24, "F");
      }
      const summary = summarizeRecords(student.attendanceRecords);
      const values = [
        personIdValue(student),
        student.userId?.name || "-",
        subGroupValue(student),
        student.status || "-",
        summary.total,
        summary.present,
        summary.absent,
        summary.late,
        summary.leave,
      ];
      let x = margin;
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      values.forEach((value, columnIndex) => {
        const text = doc.splitTextToSize(String(value), columns[columnIndex].width - 10)[0] || "";
        doc.text(text, x + 5, y);
        x += columns[columnIndex].width;
      });
      y += 24;
    });
    doc.save(`attendance-${rosterName.replace(/\s+/g, "-").toLowerCase()}-${date}.pdf`);
  };

  const exportStudentExcel = (student: Student) => {
    const headers = ["Date", "Status", idLabel, "Name", "Type", groupLabel, subGroupLabel];
    const rows = (student.attendanceRecords || []).map((record) => [record.date, record.status, personIdValue(student), student.userId?.name || "-", personType, groupValue(student), subGroupValue(student)]);
    const csv = [headers, ...(rows.length ? rows : [["-", "No records", personIdValue(student), student.userId?.name || "-", personType, groupValue(student), subGroupValue(student)]])].map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadFile(`\uFEFF${csv}`, `attendance-${student.rollNumber || student._id}-${student.userId?.name || "student"}.csv`, "text/csv;charset=utf-8");
  };

  const exportStudentPdf = async (student: Student) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const institution = getPrintInstitution();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 42;
    const summary = summarizeRecords(student.attendanceRecords);
    const qrDataUrl = await makeQrDataUrl(JSON.stringify({ title: "Attendance", personType, personId: student._id, name: student.userId?.name, generatedAt: new Date().toISOString() }), 96);

    const drawHeader = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 86, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(institution.name, margin, 26);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Attendance Calendar | ${student.userId?.name || "-"} | ${idLabel}: ${personIdValue(student)}`, margin, 48);
      doc.text(`${groupLabel}: ${groupValue(student)} | ${subGroupLabel}: ${subGroupValue(student)}`, margin, 66);
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 54, 16, 48, 48);
    };

    drawHeader();
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total ${summary.total}`, margin, 116);
    doc.text(`Present ${summary.present}`, margin + 90, 116);
    doc.text(`Absent ${summary.absent}`, margin + 190, 116);
    doc.text(`Late ${summary.late}`, margin + 290, 116);
    doc.text(`Leave ${summary.leave}`, margin + 380, 116);

    let y = 148;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 16, pageWidth - margin * 2, 24, "F");
    doc.text("Date", margin + 8, y);
    doc.text("Status", margin + 160, y);
    y += 28;
    doc.setFont("helvetica", "normal");
    const records = student.attendanceRecords?.length ? student.attendanceRecords : [{ date: "-", status: "No records" as Status }];
    records.forEach((record, index) => {
      if (y > pageHeight - 42) {
        doc.addPage();
        drawHeader();
        y = 116;
      }
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 15, pageWidth - margin * 2, 24, "F");
      }
      doc.setTextColor(15, 23, 42);
      doc.text(record.date, margin + 8, y);
      doc.text(record.status, margin + 160, y);
      y += 24;
    });
    doc.save(`attendance-${student.rollNumber || student._id}-${student.userId?.name || "student"}.pdf`);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.attendance.mark({
        classId,
        sectionId,
        date,
        records: students.map((student) => personType === "teacher"
          ? ({ userId: student._id, userType: "teacher", date, status: student.status })
          : ({ studentId: student._id, userType: "student", classId, sectionId: student.sectionId?._id || sectionId, date, status: student.status })),
      });
      await loadStudents(date);
      setMessage("Attendance saved.");
      notify("Attendance saved", "Present counts and calendar updated.", "success");
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to save attendance.";
      setMessage(errorMessage);
      notify("Attendance failed", errorMessage, "error");
    } finally {
      setSaving(false);
    }
  };

  const scan = async (code?: string) => {
    const codeToScan = code || scanCode;
    if (!codeToScan) {
      setMessage("Please enter or scan a card code.");
      notify("Scan required", "Please enter or scan a card code.", "warning");
      return;
    }
    try {
      const data = await api.attendance.scanIdCard({ code: codeToScan }) as { student?: Student };
      if (data.student) {
        setOne(data.student._id, "present");
        setScanOpen(false);
        setScanCode("");
        setMessage(`✓ ${data.student.userId?.name} marked as present.`);
        await loadStudents(date);
        notify("Marked present", `${data.student.userId?.name} is marked present.`, "success");
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Scan failed.";
      setMessage(errorMessage);
      notify("Scan failed", errorMessage, "error");
    }
  };

  function renderMonthCalendar(student: Student, selectedDateStr: string) {
    const [y, m] = selectedDateStr.split('-').map(Number);
    const month = m; const year = y;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = lastDay.getDate();
    const monthKey = selectedDateStr.slice(0, 7);

    const recordsByDay = new Map<number, Status>();
    (student.attendanceRecords || []).forEach((r) => {
      if (r.date.slice(0, 7) === monthKey) {
        const day = Number(r.date.slice(8, 10));
        recordsByDay.set(day, r.status);
      }
    });

    const weeks: Array<Array<number | null>> = [];
    let currentWeek: Array<number | null> = Array(startWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
    }
    if (currentWeek.length) {
      while (currentWeek.length < 7) currentWeek.push(null);
      weeks.push(currentWeek);
    }

    // Render true month grid (weeks as rows)
    return (
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-600">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="mt-2 min-h-[19rem]">
          <div className="grid grid-cols-7 gap-2">
            {weeks.map((week, wi) => (
              week.map((day, di) => {
                if (day === null) return <div key={`${wi}-${di}`} className="h-10 rounded-md bg-transparent" />;
                const status = recordsByDay.get(day);
                const isSelected = calendarSelectedDay === day;
                const classes = [
                  'h-10', 'rounded-md', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-medium', 'relative', 'transition', 'duration-150', 'ease-in-out', 'cursor-pointer'
                ];
                if (isSelected) classes.push('ring-2', 'ring-blue-500');
                if (status === 'present') classes.push('bg-emerald-600', 'text-white');
                else if (status === 'absent') classes.push('bg-rose-200', 'text-slate-800');
                else if (status === 'late') classes.push('bg-amber-200', 'text-slate-800');
                else if (status === 'leave') classes.push('bg-sky-200', 'text-slate-800');
                else classes.push('bg-white', 'text-slate-800', 'border', 'border-transparent', 'hover:border-slate-200');

                return (
                  <button
                    key={`${wi}-${di}`}
                    onClick={() => setCalendarSelectedDay(day)}
                    onMouseEnter={() => setHoverDay(day)}
                    onMouseLeave={() => setHoverDay((d) => d === day ? null : d)}
                    className={classes.join(' ')}
                    title={`Day ${day}`}
                  >
                    {day}
                  </button>
                );
              })
            ))}
          </div>
        </div>

        {/* Hover preview box for teachers: show who is present on hover */}
        {hoverDay && isTeacherOrUpperRole && (
          <div className="mt-2 p-2 bg-white border rounded shadow-sm text-sm">
            <div className="font-medium">Present on {hoverDay}/{calendarSelectedMonth}/{calendarViewYear}</div>
            <div className="mt-2 max-h-40 overflow-auto">
              {students.filter((student) => student.attendanceRecords?.some((record) => record.status === 'present' && record.date.slice(0, 7) === `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2, '0')}` && Number(record.date.slice(8, 10)) === hoverDay)).length > 0 ? (
                students.filter((student) => student.attendanceRecords?.some((record) => record.status === 'present' && record.date.slice(0, 7) === `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2, '0')}` && Number(record.date.slice(8, 10)) === hoverDay)).map((student) => (
                  <div key={student._id} className="flex items-center justify-between py-1">
                    <div className="truncate">{student.userId?.name} <span className="text-slate-500">({personIdValue(student)})</span></div>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">No present records</div>
              )}
            </div>
          </div>
        )}

        {calendarSelectedDay && (
          <div className="mt-4 p-4 border rounded-md bg-slate-50">
            <h4 className="font-semibold">Attendance on {calendarSelectedDay}/{calendarSelectedMonth}/{calendarViewYear}</h4>
            <div className="mt-2 space-y-1">
              {/* Teacher actions */}
              {isTeacherOrUpperRole && (
                <div className="flex gap-2 mb-2">
                  <Button size="sm" onClick={async () => {
                    if (personType === "student" && !classId) { setMessage('Select a class first.'); return; }
                    const d = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                    try {
                      await api.attendance.mark({ classId, sectionId, date: d, records: students.map(s => personType === "teacher" ? ({ userId: s._id, userType: "teacher", date: d, status: 'present' }) : ({ studentId: s._id, userType: "student", classId, sectionId: s.sectionId?._id || sectionId, date: d, status: 'present' })) });
                      setDate(d);
                      await loadStudents(d);
                      {
                        const targetId = calendarStudent?._id;
                        if (targetId) await fetchCalendarStudent(targetId);
                      }
                      setMessage('Marked all present for the day.');
                      notify('Marked all present', `${calendarSelectedDay}/${calendarSelectedMonth}/${calendarViewYear} updated successfully.`, 'success');
                    } catch (e:any) { setMessage(e?.message || 'Failed to mark.'); }
                  }}>Mark All Present</Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    if (personType === "student" && !classId) { setMessage('Select a class first.'); return; }
                    const d = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                    try {
                      await api.attendance.mark({ classId, sectionId, date: d, records: students.map(s => personType === "teacher" ? ({ userId: s._id, userType: "teacher", date: d, status: 'absent' }) : ({ studentId: s._id, userType: "student", classId, sectionId: s.sectionId?._id || sectionId, date: d, status: 'absent' })) });
                      setDate(d);
                      await loadStudents(d);
                      {
                        const targetId = calendarStudent?._id;
                        if (targetId) await fetchCalendarStudent(targetId);
                      }
                      setMessage('Marked all absent for the day.');
                      notify('Marked all absent', `${calendarSelectedDay}/${calendarSelectedMonth}/${calendarViewYear} updated successfully.`, 'success');
                    } catch (e:any) { setMessage(e?.message || 'Failed to mark.'); }
                  }}>Mark All Absent</Button>
                  <Button size="sm" variant="ghost" onClick={() => {
                    // print present list
                    const d = `${calendarSelectedDay}/${calendarSelectedMonth}/${calendarViewYear}`;
                    const selectedDayKey = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                    const presentList = students.filter(s => s.attendanceRecords?.some(r => r.date === selectedDayKey && r.status === 'present'));
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.write(`<html><head><title>Attendance ${d}</title></head><body><h3>Present on ${d}</h3><ul>${presentList.map(p => `<li>${p.userId?.name} (${personIdValue(p)})</li>`).join('')}</ul></body></html>`);
                      w.document.close();
                      w.print();
                    }
                  }}>Print</Button>
                </div>
              )}
              {students.map((s) => {
                const record = s.attendanceRecords?.find(r => r.date === `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`);
                const status: Status | 'No record' = (record?.status as Status) || 'No record';
                return (
                  <div key={s._id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="truncate text-sm font-medium">{s.userId?.name} <span className="text-slate-500">({personIdValue(s)})</span></div>
                      <div className="flex gap-2">
                        {(['present','absent','late','leave'] as Status[]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={status === st ? 'default' : 'outline'}
                            onClick={async () => {
                              if (personType === "student" && !classId) { setMessage('Select a class first.'); return; }
                              const d = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                              try {
                                await api.attendance.mark({ classId, sectionId, date: d, records: [personType === "teacher" ? { userId: s._id, userType: "teacher", date: d, status: st } : { studentId: s._id, userType: "student", classId, sectionId: s.sectionId?._id || sectionId, date: d, status: st }] });
                                setDate(d);
                                await loadStudents(d);
                                await fetchCalendarStudent(s._id);
                                setMessage(`Marked ${s.userId?.name} as ${st}.`);
                              } catch (e:any) { setMessage(e?.message || 'Failed to update attendance.'); }
                            }}
                          >
                            {st}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500">{record ? `Status: ${status}` : 'No record'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Marking"
        description="Mark daily class attendance with bulk actions and ID card scan support."
        icon={ClipboardCheck}
        actions={[
          <Button key="id-card-scan" variant="outline" size="sm" onClick={() => setScanOpen(true)}>
            <Camera className="mr-2 h-4 w-4" />
            ID Card Scan
          </Button>,
          <Button key="export-class-excel" variant="outline" size="sm" onClick={exportClassExcel} disabled={!students.length}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel
          </Button>,
          <Button key="export-class-pdf" variant="outline" size="sm" onClick={exportClassPdf} disabled={!students.length}>
            <FileText className="mr-2 h-4 w-4" />
            PDF
          </Button>,
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {canManageTeachers && (
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Attendance For</span>
              <Select value={personType} onValueChange={(value) => { setPersonType(value as PersonType); setSectionId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                </SelectContent>
              </Select>
            </label>
          )}
          {personType === "student" && <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Class</span>
            <Select value={classId} onValueChange={(value) => { setClassId(value); setSectionId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>}
          {personType === "student" && <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Section</span>
            <Select value={sectionId || "all"} onValueChange={(value) => setSectionId(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All sections</SelectItem>{sections.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>}
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Date</span><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        </div>
      </section>

      {message && <div className="rounded-lg border border-border bg-popover px-4 py-3 text-sm text-foreground">{message}</div>}

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <DialogTitle>Attendance calendar</DialogTitle>
              <DialogDescription>
                {currentCalendarStudent ? `${currentCalendarStudent.userId?.name || "-"} - ${personIdValue(currentCalendarStudent)}` : "Attendance calendar"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCalendarViewYear(calendarViewYear - 1)}>-</Button>
              <div className="text-sm font-medium">{calendarViewYear}</div>
              <Button variant="outline" size="sm" onClick={() => setCalendarViewYear(calendarViewYear + 1)}>+</Button>
            </div>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {/* Month selector */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, idx) => {
                const month = idx + 1;
                const isCurrent = currentCalendarStudent?.attendanceRecords?.some(r => r.date.slice(0, 7) === `${calendarViewYear}-${String(month).padStart(2, '0')}` && r.status === 'present');
                const isSelected = calendarSelectedMonth === month;
                return (
                  <Button key={month} variant={isSelected ? 'secondary' : isCurrent ? 'outline' : 'ghost'} size="sm" onClick={() => { setCalendarSelectedMonth(month); setCalendarSelectedDay(null); }}>
                    {new Date(0, idx).toLocaleString(undefined, { month: 'short' })}
                  </Button>
                );
              })}
            </div>

            {/* Render selected month calendar */}
            {currentCalendarStudent && (
              <div>
                {renderMonthCalendar(currentCalendarStudent, `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2, '0')}`)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-700">{students.length} {activePeopleLabel}</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setAll("present")}>All Present</Button>
            <Button type="button" variant="outline" onClick={() => setAll("absent")}>All Absent</Button>
            <Button type="button" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Attendance"}</Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead>Photo</TableHead>
              <TableHead>{idLabel}</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Total Present</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">No {activePeopleLabel} found.</TableCell></TableRow> : students.map((student) => {
              const isPresentHighlight = isTeacherOrUpperRole && student.status === "present";
              return (
                <TableRow 
                  key={student._id} 
                  className={cn(
                    isPresentHighlight && "bg-emerald-50 hover:bg-emerald-100"
                  )}
                >
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}> <div className="h-10 w-10 overflow-hidden rounded-md bg-slate-100">{student.userId?.avatar && <img src={student.userId.avatar} alt="" className="h-full w-full object-cover" />}</div></TableCell>
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}>{personIdValue(student)}</TableCell>
                  <TableCell className={cn("font-medium text-slate-950", isPresentHighlight && "bg-emerald-50")}>{student.userId?.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{typeof student.presentCount === 'number' ? <div className="flex items-center gap-2"><span className="font-semibold">{student.presentCount}</span><Button type="button" variant="ghost" size="sm" onClick={async () => { setCalendarViewYear(Number(date.split('-')[0])); setCalendarSelectedMonth(Number(date.split('-')[1])); setCalendarSelectedDay(null); await fetchCalendarStudent(student._id); setCalendarOpen(true); }}><CalendarIcon className="h-4 w-4" /></Button></div> : '-'}</TableCell>
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}> <div className="flex flex-wrap gap-2">{(["present","absent","late","leave"] as Status[]).map((status) => <Button key={status} type="button" size="sm" variant={student.status === status ? "default" : "outline"} className={cn("capitalize", isPresentHighlight && status === "present" && "bg-emerald-500 text-white border-emerald-500") } onClick={() => setOne(student._id, status)}>{status}</Button>)}</div></TableCell>
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => exportStudentExcel(student)}><FileSpreadsheet className="h-4 w-4" /></Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => exportStudentPdf(student)}><Download className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>ID Card Scan</DialogTitle><DialogDescription>Use your device camera to scan ID card QR codes, or enter the code manually.</DialogDescription></DialogHeader>
          <WebcamScanner enabled={scanOpen} onScan={(code) => {
            setScanCode(code);
            scan(code);
          }} />
          <div className="mt-4 space-y-2 border-t pt-4">
            <label className="text-sm font-medium text-slate-700">Manual Entry</label>
            <Input value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Or paste ID card code here" />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setScanOpen(false)}>Cancel</Button><Button onClick={() => scan()}>Mark Present</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
