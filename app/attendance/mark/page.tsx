"use client";

import { useEffect, useState } from "react";
import { Camera, ClipboardCheck, Save, Calendar as CalendarIcon } from "lucide-react";

import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { authManager } from "@/lib/auth";

type Status = "present" | "absent" | "late" | "leave";
type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Student = { _id: string; rollNumber: string; userId?: { name: string; avatar?: string }; classId?: { _id: string }; sectionId?: { _id: string; name: string }; status?: Status; presentCount?: number; attendanceRecords?: Array<{ date: string; status: Status }> };

const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceMarkPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
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

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];

  // Check if user is teacher or upper role for enhanced UI
  const isTeacherOrUpperRole = authManager.hasRole(['class_teacher', 'subject_teacher', 'head', 'assistant_head']);

  const loadClasses = async () => {
    const data = await api.academic.classes.getAll() as { classes: ClassItem[] };
    setClasses(data.classes || []);
    setClassId((current) => current || data.classes?.[0]?._id || "");
  };

  const loadStudents = async () => {
    if (!classId) return;
    const data = await api.attendance.getStudents({ classId, sectionId: sectionId || undefined }) as { students: Student[] };
    const attendance = await api.attendance.getAll({ classId, sectionId: sectionId || undefined, date }) as { attendance: any[] };
    const statusByStudent = new Map((attendance.attendance || []).map((item) => [String(item.studentId?._id || item.studentId), item.status]));
    const baseStudents = (data.students || []).map((student) => ({ ...student, status: (statusByStudent.get(student._id) as Status) || "absent" }));

    // Fetch individual student attendance history to compute month present counts
    const [yearStr, monthStr] = date.split('-');
    const month = Number(monthStr);
    const year = Number(yearStr);

    const withCounts = await Promise.all(baseStudents.map(async (student) => {
      try {
        const res = await api.attendance.getStudentAttendance(student._id) as { attendance: Array<{ date: string; status: Status }> };
        const records = (res.attendance || []).map((r) => ({ date: String(r.date).slice(0, 10), status: r.status }));
        const presentCount = records.filter((r) => {
          const d = new Date(r.date);
          return r.status === 'present' && d.getFullYear() === year && d.getMonth() + 1 === month;
        }).length;
        return { ...student, attendanceRecords: records, presentCount } as Student;
      } catch (e) {
        return { ...student, attendanceRecords: [], presentCount: 0 } as Student;
      }
    }));

    setStudents(withCounts);
  };

  useEffect(() => { loadClasses().catch(() => undefined); }, []);
  useEffect(() => { loadStudents().catch(() => setStudents([])); }, [classId, sectionId, date]);

  const setAll = (status: Status) => setStudents((current) => current.map((student) => ({ ...student, status })));
  const setOne = (id: string, status: Status) => setStudents((current) => current.map((student) => student._id === id ? { ...student, status } : student));

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      await api.attendance.mark({
        classId,
        sectionId,
        date,
        records: students.map((student) => ({ studentId: student._id, classId, sectionId: student.sectionId?._id || sectionId, date, status: student.status })),
      });
      setMessage("Attendance saved.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const scan = async (code?: string) => {
    const codeToScan = code || scanCode;
    if (!codeToScan) {
      setMessage("Please enter or scan a card code.");
      return;
    }
    try {
      const data = await api.attendance.scanIdCard({ code: codeToScan }) as { student?: Student };
      if (data.student) {
        setOne(data.student._id, "present");
        setScanOpen(false);
        setScanCode("");
        setMessage(`✓ ${data.student.userId?.name} marked as present.`);
      }
    } catch (err: any) {
      setMessage(err?.message || "Scan failed.");
    }
  };

  function renderMonthCalendar(student: Student, selectedDateStr: string) {
    const [y, m] = selectedDateStr.split('-').map(Number);
    const month = m; const year = y;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    const startWeekday = firstDay.getDay(); // 0..6 (Sun..Sat)
    const daysInMonth = lastDay.getDate();

    const recordsByDay = new Map<number, Status>();
    (student.attendanceRecords || []).forEach((r) => {
      const d = new Date(r.date);
      if (d.getFullYear() === year && d.getMonth() + 1 === month) {
        recordsByDay.set(d.getDate(), r.status);
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

    return (
      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-600">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (day === null) return <div key={di} className="h-10 rounded-md bg-transparent" />;
                const status = recordsByDay.get(day);
                const bg = status === 'present' ? 'bg-emerald-200' : status === 'absent' ? 'bg-rose-200' : status === 'late' ? 'bg-amber-200' : status === 'leave' ? 'bg-sky-200' : 'bg-slate-100';
                const isSelected = calendarSelectedDay === day;
                return (
                  <Button
                    key={di}
                    variant="ghost"
                    size="sm"
                    className={`${bg} h-10 rounded-md flex items-center justify-center text-sm ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    onClick={() => setCalendarSelectedDay(day)}
                  >
                    {day}
                  </Button>
                );
              })}
            </div>
          ))}
        </div>
        {calendarSelectedDay && (
          <div className="mt-4 p-4 border rounded-md bg-slate-50">
            <h4 className="font-semibold">Attendance on {calendarSelectedDay}/{calendarSelectedMonth}/{calendarViewYear}</h4>
            <div className="mt-2 space-y-1">
              {students.map((s) => {
                const record = s.attendanceRecords?.find(r => {
                  const d = new Date(r.date);
                  return d.getFullYear() === calendarViewYear && d.getMonth() + 1 === calendarSelectedMonth && d.getDate() === calendarSelectedDay;
                });
                const status = record?.status || 'No record';
                return (
                  <div key={s._id} className="flex justify-between text-sm">
                    <span>{s.userId?.name} ({s.rollNumber})</span>
                    <Badge variant={status === 'present' ? 'default' : 'secondary'}>{status}</Badge>
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
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Class</span>
            <Select value={classId} onValueChange={(value) => { setClassId(value); setSectionId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>{classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Section</span>
            <Select value={sectionId || "all"} onValueChange={(value) => setSectionId(value === "all" ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All sections</SelectItem>{sections.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent>
            </Select>
          </label>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Date</span><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        </div>
      </section>

      {message && <div className="rounded-lg border border-border bg-popover px-4 py-3 text-sm text-foreground">{message}</div>}

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-700">{students.length} students</div>
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
              <TableHead>Roll</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Month Present</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-slate-500">No students found.</TableCell></TableRow> : students.map((student) => {
              const isPresentHighlight = isTeacherOrUpperRole && student.status === "present";
              return (
                <TableRow 
                  key={student._id} 
                  className={cn(
                    isPresentHighlight && "bg-emerald-50 hover:bg-emerald-100"
                  )}
                >
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}> <div className="h-10 w-10 overflow-hidden rounded-md bg-slate-100">{student.userId?.avatar && <img src={student.userId.avatar} alt="" className="h-full w-full object-cover" />}</div></TableCell>
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}>{student.rollNumber}</TableCell>
                  <TableCell className={cn("font-medium text-slate-950", isPresentHighlight && "bg-emerald-50")}>{student.userId?.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{typeof student.presentCount === 'number' ? <div className="flex items-center gap-2"><span className="font-semibold">{student.presentCount}</span><Button variant="ghost" size="sm" onClick={() => { setCalendarStudent(student); setCalendarOpen(true); setCalendarViewYear(Number(date.split('-')[0])); setCalendarSelectedMonth(Number(date.split('-')[1])); setCalendarSelectedDay(null); }}><CalendarIcon className="h-4 w-4" /></Button></div> : '-'}</TableCell>
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}> <div className="flex flex-wrap gap-2">{(["present","absent","late","leave"] as Status[]).map((status) => <Button key={status} type="button" size="sm" variant={student.status === status ? "default" : "outline"} className={cn("capitalize", isPresentHighlight && status === "present" && "bg-emerald-500 text-white border-emerald-500") } onClick={() => setOne(student._id, status)}>{status}</Button>)}</div></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </section>

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Attendance calendar</h3>
              <p className="text-sm text-slate-600">{calendarStudent?.userId?.name} — {calendarStudent?.rollNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCalendarViewYear(calendarViewYear - 1)}>-</Button>
              <div className="text-sm font-medium">{calendarViewYear}</div>
              <Button variant="outline" size="sm" onClick={() => setCalendarViewYear(calendarViewYear + 1)}>+</Button>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {/* Month selector */}
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 12 }).map((_, idx) => {
                const month = idx + 1;
                const isCurrent = calendarStudent?.attendanceRecords?.some(r => {
                  const d = new Date(r.date);
                  return d.getFullYear() === calendarViewYear && d.getMonth() + 1 === month && r.status === 'present';
                });
                const isSelected = calendarSelectedMonth === month;
                return (
                  <Button key={month} variant={isSelected ? 'secondary' : isCurrent ? 'outline' : 'ghost'} size="sm" onClick={() => { setCalendarSelectedMonth(month); setCalendarSelectedDay(null); }}>
                    {new Date(0, idx).toLocaleString(undefined, { month: 'short' })}
                  </Button>
                );
              })}
            </div>

            {/* Render selected month calendar */}
            {calendarStudent && (
              <div>
                {renderMonthCalendar(calendarStudent, `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2, '0')}`)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
