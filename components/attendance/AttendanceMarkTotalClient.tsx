"use client";

import "@/lib/attendance-api-compat";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calendar, ClipboardCheck, Loader2, Printer, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { api, apiClient } from "@/lib/api";
import { AttendanceCalendarDialogV5 as AttendanceCalendarDialog } from "@/components/attendance/AttendanceCalendarDialogV5";

type Status = "present" | "absent" | "late" | "leave" | "";
type PersonType = "student" | "teacher" | "staff";
type Person = { _id: string; rollNumber?: string; employeeId?: string; userId?: any; classId?: any; sectionId?: any; status?: Status; totalPresent?: number; userType?: PersonType; designation?: string; subject?: string };

const today = () => new Date().toISOString().slice(0, 10);
const idOf = (v: any) => String(v?._id || v || "");
const userIdOf = (p: Person) => idOf(p.userId) || idOf(p._id);
const nameOf = (p: Person) => p.userId?.name || p.userId?.username || p.userId?.fullName || p.userId?.email || "Unnamed";
const monthRange = (date: string) => { const d = new Date(date); const y = d.getFullYear(); const m = d.getMonth(); return { startDate: `${y}-${String(m + 1).padStart(2, "0")}-01`, endDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}` }; };
const monthName = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const normalizeClasses = (data: any) => Array.isArray(data) ? data : Array.isArray(data?.classes) ? data.classes : Array.isArray(data?.items) ? data.items : [];
const normalizePeople = (data: any) => Array.isArray(data) ? data : Array.isArray(data?.people) ? data.people : Array.isArray(data?.students) ? data.students : Array.isArray(data?.teachers) ? data.teachers : Array.isArray(data?.staff) ? data.staff : [];
const normalizeAttendance = (data: any) => Array.isArray(data) ? data : Array.isArray(data?.attendance) ? data.attendance : Array.isArray(data?.records) ? data.records : [];

export default function AttendanceMarkTotalClient() {
  const { addToast } = useToast();
  const [personType, setPersonType] = useState<PersonType>("student");
  const [classes, setClasses] = useState<any[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [classId, setClassId] = useState("");
  const [lockedClassId, setLockedClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [loading, setLoading] = useState(false);
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set());
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [holidayInfo, setHolidayInfo] = useState<any>(null);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const selectedClass = classes.find((c) => String(c._id) === String(classId));
  const sections = selectedClass?.sections?.filter((s: any) => s.isActive !== false) || [];
  const toast = (title: string, message: string, type: any = "success") => addToast({ title, message, type, duration: 4000 });
  const isClosed = Boolean(holidayInfo?.isHoliday || holidayInfo?.holiday?.isSchoolClosed);

  const checkHoliday = useCallback(async () => {
    if (!date) return setHolidayInfo(null);
    setHolidayLoading(true);
    try {
      const data: any = await apiClient.get("/holidays/check", { params: { date }, skipToast: true });
      setHolidayInfo(data || null);
    } catch {
      setHolidayInfo(null);
    } finally {
      setHolidayLoading(false);
    }
  }, [date]);

  const loadClasses = useCallback(async () => {
    try {
      const data: any = await api.academic.classes.getAll();
      const rows = normalizeClasses(data);
      setClasses(rows);
      setClassId((old) => old || rows[0]?._id || "");
    } catch (e: any) {
      setClasses([]);
      toast("Class load failed", e?.message || "Failed to load classes", "error");
    }
  }, []);

  const loadPeople = useCallback(async () => {
    if (personType === "student" && !classId) { setPeople([]); return; }
    setLoading(true);
    try {
      const params: any = { personType };
      if (personType === "student") { params.classId = classId; if (sectionId) params.sectionId = sectionId; }
      const roster: any = await api.attendance.getPeople(params);
      const rows = normalizePeople(roster);
      const effectiveClassId = roster?.lockedClassId || classId;
      if (personType === "student" && roster?.lockedClassId && roster.lockedClassId !== classId) { setLockedClassId(roster.lockedClassId); setClassId(roster.lockedClassId); }
      const dayParams: any = { date, userType: personType };
      const monthParams: any = { ...monthRange(date), userType: personType };
      if (personType === "student") { dayParams.classId = effectiveClassId; monthParams.classId = effectiveClassId; if (sectionId) { dayParams.sectionId = sectionId; monthParams.sectionId = sectionId; } }
      const dayData: any = await api.attendance.getAll(dayParams);
      const monthData: any = await api.attendance.getAll(monthParams);
      const dayRows = normalizeAttendance(dayData);
      const monthRows = normalizeAttendance(monthData);
      const dayMap = new Map(dayRows.map((a: any) => [personType === "student" ? String(a.studentId?._id || a.studentId) : String(a.userId?._id || a.userId || a.employeeId), a.status]));
      const totalMap = new Map<string, number>();
      monthRows.forEach((a: any) => { if (a.status === "present") { const key = personType === "student" ? String(a.studentId?._id || a.studentId) : String(a.userId?._id || a.userId || a.employeeId); totalMap.set(key, (totalMap.get(key) || 0) + 1); } });
      setPeople(rows.map((p: Person) => {
        const key = personType === "student" ? idOf(p._id) : userIdOf(p);
        return { ...p, userType: personType, status: (dayMap.get(key) as Status) || "", totalPresent: totalMap.get(key) || 0 };
      }));
    } catch (e: any) { toast("Attendance load failed", e?.message || "Failed to load attendance", "error"); setPeople([]); }
    finally { setLoading(false); }
  }, [personType, classId, sectionId, date]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { checkHoliday(); }, [checkHoliday]);
  useEffect(() => { loadPeople(); }, [loadPeople]);

  const saveOne = useCallback(async (person: Person, status: Exclude<Status, "">, previousStatus: Status) => {
    const rowId = String(person._id);
    setSavingIds((current) => new Set(current).add(rowId));
    try {
      const effectiveClassId = lockedClassId || classId;
      const record = personType === "student"
        ? { studentId: person._id, userType: "student", classId: idOf(person.classId) || effectiveClassId, sectionId: idOf(person.sectionId) || sectionId || undefined, date, status }
        : { employeeId: person._id, userId: userIdOf(person), userType: personType, employeeType: personType, date, status };
      await api.attendance.mark({ classId: personType === "student" ? effectiveClassId : undefined, sectionId: personType === "student" ? (sectionId || undefined) : undefined, date, records: [record] });
      await loadPeople();
      toast("Attendance saved", `${nameOf(person)} marked ${status}.`);
    } catch (e: any) {
      setPeople((rows) => rows.map((p) => p._id === person._id ? { ...p, status: previousStatus } : p));
      toast("Attendance failed", e?.message || "Failed to save attendance", "error");
    } finally {
      setSavingIds((current) => { const next = new Set(current); next.delete(rowId); return next; });
    }
  }, [personType, lockedClassId, classId, sectionId, date, loadPeople]);

  const setOne = (person: Person, status: Status) => {
    if (isClosed) return toast("School closed", "এই তারিখে স্কুল বন্ধ, attendance mark করা যাবে না।", "warning");
    const previousStatus = person.status || "";
    setPeople((rows) => rows.map((p) => p._id === person._id ? { ...p, status } : p));
    if (status) void saveOne(person, status, previousStatus);
  };

  const selectedRows = useMemo(() => people.filter((p) => Boolean(p.status)), [people]);

  const save = async () => {
    if (isClosed) return toast("School closed", "এই তারিখে weekly holiday/holiday আছে। Attendance save করা যাবে না।", "warning");
    if (!selectedRows.length) return toast("No status selected", "কমপক্ষে একজনের status select করুন।", "warning");
    setSaving(true);
    try {
      const effectiveClassId = lockedClassId || classId;
      const records = selectedRows.map((p) => personType === "student" ? { studentId: p._id, userType: "student", classId: idOf(p.classId) || effectiveClassId, sectionId: idOf(p.sectionId) || sectionId || undefined, date, status: p.status || "absent" } : { employeeId: p._id, userId: userIdOf(p), userType: personType, employeeType: personType, date, status: p.status || "absent" });
      await api.attendance.mark({ classId: personType === "student" ? effectiveClassId : undefined, sectionId: personType === "student" ? (sectionId || undefined) : undefined, date, records });
      await loadPeople();
      toast("Attendance saved", `${personType === "student" ? "Student" : personType === "teacher" ? "Teacher" : "Staff"} attendance saved successfully.`);
    } catch (e: any) { toast("Attendance failed", e?.message || "Failed to save attendance", "error"); }
    finally { setSaving(false); }
  };

  const printPerson = (p: Person) => {
    const title = personType === "student" ? "Student" : personType === "teacher" ? "Teacher" : "Staff";
    const html = `<!doctype html><html><head><title>Attendance Details</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111827}.header{text-align:center;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:22px}h1{margin:0;font-size:24px}.sub{font-size:13px;color:#4b5563;margin-top:6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.box{border:1px solid #d1d5db;border-radius:10px;padding:12px}.label{font-size:11px;text-transform:uppercase;color:#6b7280}.value{font-size:18px;font-weight:700;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:22px}td,th{border:1px solid #d1d5db;padding:10px;text-align:left}th{background:#f3f4f6}.status{text-transform:capitalize;font-weight:700}@media print{button{display:none}body{padding:14px}.box{break-inside:avoid}}</style></head><body><div class="header"><h1>${title} Attendance Details Report</h1><div class="sub">Month: ${monthName(date)} · Date: ${date}</div></div><div class="grid"><div class="box"><div class="label">Name</div><div class="value">${nameOf(p)}</div></div><div class="box"><div class="label">ID/Roll</div><div class="value">${personType === "student" ? (p.rollNumber || "-") : (p.employeeId || p._id || "-")}</div></div><div class="box"><div class="label">Type</div><div class="value">${title}</div></div><div class="box"><div class="label">Designation/Class</div><div class="value">${personType === "student" ? (p.classId?.name || selectedClass?.name || "-") : (p.designation || p.subject || "-")}</div></div><div class="box"><div class="label">Monthly Total Present</div><div class="value">${p.totalPresent || 0} days</div></div><div class="box"><div class="label">Selected Date Status</div><div class="value status">${p.status || "not selected"}</div></div></div><table><tbody><tr><th>Record ID</th><td>${p._id}</td></tr><tr><th>Generated At</th><td>${new Date().toLocaleString()}</td></tr></tbody></table><script>window.onload=function(){window.print();}</script></body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return toast("Popup blocked", "Please allow popup to print attendance details.", "warning");
    win.document.open(); win.document.write(html); win.document.close();
  };

  const label = personType === "student" ? "Students" : personType === "teacher" ? "Teachers" : "Staff";
  return <div className="space-y-5 p-4 md:p-6">
    <PageHeader title="Mark Attendance" description="Mark student, teacher and staff attendance." icon={ClipboardCheck} />
    {isClosed && <div className="flex items-start gap-3 rounded-2xl border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900"><AlertTriangle className="mt-0.5 h-5 w-5" /><div><b>School closed on this date.</b><div>{holidayInfo?.holiday?.title || holidayInfo?.holiday?.titleBn || "Weekly Holiday"}. Attendance marking is disabled for this date.</div></div></div>}
    <section className="rounded-2xl border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-5"><Select value={personType} onValueChange={(v) => { setPersonType(v as PersonType); setPeople([]); setLockedClassId(""); }}><SelectTrigger><SelectValue placeholder="Person Type" /></SelectTrigger><SelectContent><SelectItem value="student">Students</SelectItem><SelectItem value="teacher">Teachers</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select>{personType === "student" && <><Select value={classId || "none"} onValueChange={(v) => v !== "none" && !lockedClassId && setClassId(v)} disabled={Boolean(lockedClassId)}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent><SelectItem value="none" disabled>Select Class</SelectItem>{classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name || c.grade || "Class"}</SelectItem>)}</SelectContent></Select><Select value={sectionId || "all"} onValueChange={(v) => setSectionId(v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map((s: any) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent></Select></>}<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /><Button onClick={() => { checkHoliday(); loadPeople(); }} variant="outline" disabled={loading || holidayLoading}>{loading || holidayLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button></div>{lockedClassId && personType === "student" && <p className="mt-2 text-xs font-semibold text-amber-700">Class Teacher mode: only your assigned class can be marked.</p>}</section>
    <section className="rounded-2xl border bg-card p-4 shadow-sm"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div className="text-sm text-muted-foreground">{label} - Total = selected month present days. Status button auto-saves instantly. Marked rows: {selectedRows.length}</div></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>{personType === "student" ? "Roll" : "ID"}</TableHead><TableHead>Name</TableHead><TableHead>{personType === "student" ? "Class" : "Type"}</TableHead><TableHead>{personType === "student" ? "Section" : "Designation"}</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>History</TableHead><TableHead>Print</TableHead></TableRow></TableHeader><TableBody>{people.map((p) => <TableRow key={p._id}><TableCell>{personType === "student" ? (p.rollNumber || "-") : (p.employeeId || p._id?.slice?.(-6) || "-")}</TableCell><TableCell>{nameOf(p)}</TableCell><TableCell>{personType === "student" ? (p.classId?.name || selectedClass?.name || "-") : label.slice(0, -1)}</TableCell><TableCell>{personType === "student" ? (p.sectionId?.name || "-") : (p.designation || p.subject || "-")}</TableCell><TableCell><b>{p.totalPresent || 0}</b></TableCell><TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant={!p.status ? "default" : "outline"} disabled={isClosed} onClick={() => setOne(p, "")}>-</Button>{(["present", "absent", "late", "leave"] as Status[]).filter(Boolean).map((s) => <Button key={s} size="sm" variant={p.status === s ? "default" : "outline"} disabled={isClosed} onClick={() => setOne(p, s)}>{s}</Button>)}</div></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => setSelected({ id: personType === "student" ? p._id : userIdOf(p), name: nameOf(p), roll: personType === "student" ? p.rollNumber : p.employeeId, className: personType === "student" ? (p.classId?.name || selectedClass?.name) : label.slice(0, -1), section: personType === "student" ? p.sectionId?.name : p.designation, userType: personType, dbStudentId: personType === "student" ? p._id : undefined, dbUserId: personType !== "student" ? userIdOf(p) : undefined, dbClassId: personType === "student" ? (idOf(p.classId) || classId) : undefined, dbSectionId: personType === "student" ? (idOf(p.sectionId) || sectionId) : undefined })}><Calendar className="mr-2 h-4 w-4" />Calendar</Button></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => printPerson(p)}><Printer className="mr-2 h-4 w-4" />Print</Button></TableCell></TableRow>)}</TableBody></Table></div>{!people.length && <div className="py-10 text-center text-sm text-muted-foreground">{loading ? "Loading..." : `No ${label.toLowerCase()} found.`}</div>}</section>
    <AttendanceCalendarDialog isOpen={!!selected} person={selected} onClose={() => setSelected(null)} onAttendanceUpdated={loadPeople} />
  </div>;
}
