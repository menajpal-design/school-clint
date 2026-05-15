"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ClipboardCheck, Save, Calendar as CalendarIcon } from "lucide-react";

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
import { cn } from "@/lib/utils";
import { authManager } from "@/lib/auth";

type Status = "present" | "absent" | "late" | "leave";
type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Student = { _id: string; rollNumber: string; userId?: { name: string; avatar?: string }; classId?: { _id: string }; sectionId?: { _id: string; name: string }; status?: Status; presentCount?: number; attendanceRecords?: Array<{ date: string; status: Status }> };

const today = () => new Date().toISOString().slice(0, 10);
const dateKey = (value?: string | Date) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return new Date(value).toISOString().slice(0, 10);
};

export default function AttendanceMarkPage() {
  const { addToast } = useToast();
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
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];
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
      const res = await api.attendance.getStudentAttendance(studentId) as { attendance: Array<{ date: string; status: Status }> };
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
    if (!classId) return [] as Student[];
    const usedDate = overrideDate || date;
    const data = await api.attendance.getStudents({ classId, sectionId: sectionId || undefined }) as { students: Student[] };
    const attendance = await api.attendance.getAll({ classId, sectionId: sectionId || undefined, date: usedDate }) as { attendance: any[] };
    const statusByStudent = new Map((attendance.attendance || []).map((item) => [String(item.studentId?._id || item.studentId), item.status]));
    const baseStudents = (data.students || []).map((student) => ({ ...student, status: (statusByStudent.get(student._id) as Status) || "absent" }));

    // Fetch individual student attendance history to compute month present counts
    const [yearStr, monthStr] = usedDate.split('-');
    const month = Number(monthStr);
    const year = Number(yearStr);

    const withCounts = await Promise.all(baseStudents.map(async (student) => {
      try {
        const res = await api.attendance.getStudentAttendance(student._id) as { attendance: Array<{ date: string; status: Status }> };
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
  useEffect(() => { if (classId) loadStudents(); }, [classId, sectionId, date]);

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
                    <div className="truncate">{student.userId?.name} <span className="text-slate-500">({student.rollNumber})</span></div>
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
                    if (!classId) { setMessage('Select a class first.'); return; }
                    const d = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                    try {
                      await api.attendance.mark({ classId, sectionId, date: d, records: students.map(s => ({ studentId: s._id, classId, sectionId: s.sectionId?._id || sectionId, date: d, status: 'present' })) });
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
                    if (!classId) { setMessage('Select a class first.'); return; }
                    const d = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                    try {
                      await api.attendance.mark({ classId, sectionId, date: d, records: students.map(s => ({ studentId: s._id, classId, sectionId: s.sectionId?._id || sectionId, date: d, status: 'absent' })) });
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
                      w.document.write(`<html><head><title>Attendance ${d}</title></head><body><h3>Present on ${d}</h3><ul>${presentList.map(p => `<li>${p.userId?.name} (${p.rollNumber})</li>`).join('')}</ul></body></html>`);
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
                      <div className="truncate text-sm font-medium">{s.userId?.name} <span className="text-slate-500">({s.rollNumber})</span></div>
                      <div className="flex gap-2">
                        {(['present','absent','late','leave'] as Status[]).map((st) => (
                          <Button
                            key={st}
                            size="sm"
                            variant={status === st ? 'default' : 'outline'}
                            onClick={async () => {
                              if (!classId) { setMessage('Select a class first.'); return; }
                              const d = `${calendarViewYear}-${String(calendarSelectedMonth).padStart(2,'0')}-${String(calendarSelectedDay).padStart(2,'0')}`;
                              try {
                                await api.attendance.mark({ classId, sectionId, date: d, records: [{ studentId: s._id, classId, sectionId: s.sectionId?._id || sectionId, date: d, status: st }] });
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

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <DialogTitle>Attendance calendar</DialogTitle>
              <DialogDescription>
                {currentCalendarStudent?.userId?.name} — {currentCalendarStudent?.rollNumber}
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
              <TableHead>Total Present</TableHead>
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
                  <TableCell className="whitespace-nowrap text-sm">{typeof student.presentCount === 'number' ? <div className="flex items-center gap-2"><span className="font-semibold">{student.presentCount}</span><Button type="button" variant="ghost" size="sm" onClick={async () => { setCalendarViewYear(Number(date.split('-')[0])); setCalendarSelectedMonth(Number(date.split('-')[1])); setCalendarSelectedDay(null); await fetchCalendarStudent(student._id); setCalendarOpen(true); }}><CalendarIcon className="h-4 w-4" /></Button></div> : '-'}</TableCell>
                  <TableCell className={cn(isPresentHighlight && "bg-emerald-50")}> <div className="flex flex-wrap gap-2">{(["present","absent","late","leave"] as Status[]).map((status) => <Button key={status} type="button" size="sm" variant={student.status === status ? "default" : "outline"} className={cn("capitalize", isPresentHighlight && status === "present" && "bg-emerald-500 text-white border-emerald-500") } onClick={() => setOne(student._id, status)}>{status}</Button>)}</div></TableCell>
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
