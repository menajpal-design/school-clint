"use client";

import "@/lib/attendance-api-compat";
import { useCallback, useEffect, useState } from "react";
import { Calendar, ClipboardCheck, Printer, RefreshCw, Save } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";
import { AttendanceCalendarDialogV5 as AttendanceCalendarDialog } from "@/components/attendance/AttendanceCalendarDialogV5";

type Status = "present" | "absent" | "late" | "leave";
type PersonType = "student" | "teacher" | "staff";
type Person = { _id: string; rollNumber?: string; employeeId?: string; userId?: any; classId?: any; sectionId?: any; status?: Status; totalPresent?: number; userType?: PersonType; designation?: string; subject?: string };

const today = () => new Date().toISOString().slice(0, 10);
const idOf = (v: any) => String(v?._id || v || "");
const userIdOf = (p: Person) => idOf(p.userId) || idOf(p._id);
const nameOf = (p: Person) => p.userId?.name || p.userId?.username || "Unnamed";
const monthRange = (date: string) => { const d = new Date(date); const y = d.getFullYear(); const m = d.getMonth(); return { startDate: `${y}-${String(m + 1).padStart(2, "0")}-01`, endDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}` }; };
const monthName = (date: string) => new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const selectedClass = classes.find((c) => c._id === classId);
  const sections = selectedClass?.sections?.filter((s: any) => s.isActive !== false) || [];
  const toast = (title: string, message: string, type: any = "success") => addToast({ title, message, type, duration: 4000 });

  const loadClasses = useCallback(async () => {
    const data: any = await api.academic.classes.getAll();
    const rows = data.classes || [];
    setClasses(rows);
    setClassId((old) => old || rows[0]?._id || "");
  }, []);

  const loadPeople = useCallback(async () => {
    if (personType === "student" && !classId) return;
    setLoading(true);
    try {
      const params: any = { personType };
      if (personType === "student") { params.classId = classId; if (sectionId) params.sectionId = sectionId; }
      const roster: any = await api.attendance.getPeople(params);
      const effectiveClassId = roster.lockedClassId || classId;
      if (personType === "student" && roster.lockedClassId && roster.lockedClassId !== classId) { setLockedClassId(roster.lockedClassId); setClassId(roster.lockedClassId); }
      const dayParams: any = { date, userType: personType };
      const monthParams: any = { ...monthRange(date), userType: personType };
      if (personType === "student") { dayParams.classId = effectiveClassId; monthParams.classId = effectiveClassId; if (sectionId) { dayParams.sectionId = sectionId; monthParams.sectionId = sectionId; } }
      const dayData: any = await api.attendance.getAll(dayParams);
      const monthData: any = await api.attendance.getAll(monthParams);
      const dayMap = new Map((dayData.attendance || []).map((a: any) => [personType === "student" ? String(a.studentId?._id || a.studentId) : String(a.userId?._id || a.userId), a.status]));
      const totalMap = new Map<string, number>();
      (monthData.attendance || []).forEach((a: any) => { if (a.status === "present") { const key = personType === "student" ? String(a.studentId?._id || a.studentId) : String(a.userId?._id || a.userId); totalMap.set(key, (totalMap.get(key) || 0) + 1); } });
      setPeople((roster.people || []).map((p: Person) => {
        const key = personType === "student" ? idOf(p._id) : userIdOf(p);
        return { ...p, userType: personType, status: (dayMap.get(key) as Status) || "absent", totalPresent: totalMap.get(key) || 0 };
      }));
    } catch (e: any) { toast("Attendance load failed", e?.message || "Failed to load attendance", "error"); }
    finally { setLoading(false); }
  }, [personType, classId, sectionId, date]);

  useEffect(() => { loadClasses().catch((e) => toast("Class load failed", e?.message || "Failed", "error")); }, [loadClasses]);
  useEffect(() => { loadPeople(); }, [loadPeople]);
  const setOne = (id: string, status: Status) => setPeople((rows) => rows.map((p) => p._id === id ? { ...p, status } : p));

  const save = async () => {
    setSaving(true);
    try {
      const effectiveClassId = lockedClassId || classId;
      const records = people.map((p) => personType === "student" ? { studentId: p._id, userType: "student", classId: idOf(p.classId) || effectiveClassId, sectionId: idOf(p.sectionId) || sectionId || undefined, date, status: p.status || "absent" } : { employeeId: p._id, userId: userIdOf(p), userType: personType, employeeType: personType, date, status: p.status || "absent" });
      await api.attendance.mark({ classId: personType === "student" ? effectiveClassId : undefined, sectionId: personType === "student" ? (sectionId || undefined) : undefined, date, records });
      await loadPeople();
      toast("Attendance saved", `${personType === "student" ? "Student" : personType === "teacher" ? "Teacher" : "Staff"} attendance saved successfully.`);
    } catch (e: any) { toast("Attendance failed", e?.message || "Failed to save attendance", "error"); }
    finally { setSaving(false); }
  };

  const printPerson = (p: Person) => {
    const title = personType === "student" ? "Student" : personType === "teacher" ? "Teacher" : "Staff";
    const html = `<!doctype html><html><head><title>Attendance Details</title><style>body{font-family:Arial,sans-serif;padding:28px;color:#111827}.header{text-align:center;border-bottom:2px solid #111827;padding-bottom:12px;margin-bottom:22px}h1{margin:0;font-size:24px}.sub{font-size:13px;color:#4b5563;margin-top:6px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}.box{border:1px solid #d1d5db;border-radius:10px;padding:12px}.label{font-size:11px;text-transform:uppercase;color:#6b7280}.value{font-size:18px;font-weight:700;margin-top:4px}table{width:100%;border-collapse:collapse;margin-top:22px}td,th{border:1px solid #d1d5db;padding:10px;text-align:left}th{background:#f3f4f6}.status{text-transform:capitalize;font-weight:700}@media print{button{display:none}body{padding:14px}.box{break-inside:avoid}}</style></head><body><div class="header"><h1>${title} Attendance Details Report</h1><div class="sub">Month: ${monthName(date)} · Date: ${date}</div></div><div class="grid"><div class="box"><div class="label">Name</div><div class="value">${nameOf(p)}</div></div><div class="box"><div class="label">ID/Roll</div><div class="value">${personType === "student" ? (p.rollNumber || "-") : (p.employeeId || p._id || "-")}</div></div><div class="box"><div class="label">Type</div><div class="value">${title}</div></div><div class="box"><div class="label">Designation/Class</div><div class="value">${personType === "student" ? (p.classId?.name || selectedClass?.name || "-") : (p.designation || p.subject || "-")}</div></div><div class="box"><div class="label">Monthly Total Present</div><div class="value">${p.totalPresent || 0} days</div></div><div class="box"><div class="label">Selected Date Status</div><div class="value status">${p.status || "absent"}</div></div></div><table><tbody><tr><th>Record ID</th><td>${p._id}</td></tr><tr><th>Generated At</th><td>${new Date().toLocaleString()}</td></tr></tbody></table><script>window.onload=function(){window.print();}</script></body></html>`;
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) return toast("Popup blocked", "Please allow popup to print attendance details.", "warning");
    win.document.open(); win.document.write(html); win.document.close();
  };

  const label = personType === "student" ? "Students" : personType === "teacher" ? "Teachers" : "Staff";
  return <div className="space-y-5">
    <PageHeader title="Mark Attendance" description="Mark student, teacher and staff attendance." icon={ClipboardCheck} />
    <section className="rounded-lg border bg-card p-4"><div className="grid gap-3 md:grid-cols-5"><Select value={personType} onValueChange={(v) => { setPersonType(v as PersonType); setPeople([]); setLockedClassId(""); }}><SelectTrigger><SelectValue placeholder="Person Type" /></SelectTrigger><SelectContent><SelectItem value="student">Students</SelectItem><SelectItem value="teacher">Teachers</SelectItem><SelectItem value="staff">Staff</SelectItem></SelectContent></Select>{personType === "student" && <><Select value={classId} onValueChange={(v) => !lockedClassId && setClassId(v)} disabled={Boolean(lockedClassId)}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map((c) => <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>)}</SelectContent></Select><Select value={sectionId || "all"} onValueChange={(v) => setSectionId(v === "all" ? "" : v)}><SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map((s: any) => <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>)}</SelectContent></Select></>}<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /><Button onClick={loadPeople} variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>{lockedClassId && personType === "student" && <p className="mt-2 text-xs font-semibold text-amber-700">Class Teacher mode: only your assigned class can be marked.</p>}</section>
    <section className="rounded-lg border bg-card p-4"><div className="mb-4 flex justify-between"><div className="text-sm text-muted-foreground">{label} — Total = selected month present days</div><Button onClick={save} disabled={saving || loading || !people.length}><Save className="mr-2 h-4 w-4" />Save</Button></div><Table><TableHeader><TableRow><TableHead>{personType === "student" ? "Roll" : "ID"}</TableHead><TableHead>Name</TableHead><TableHead>{personType === "student" ? "Class" : "Type"}</TableHead><TableHead>{personType === "student" ? "Section" : "Designation"}</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead>History</TableHead><TableHead>Print</TableHead></TableRow></TableHeader><TableBody>{people.map((p) => <TableRow key={p._id}><TableCell>{personType === "student" ? (p.rollNumber || "-") : (p.employeeId || p._id?.slice?.(-6) || "-")}</TableCell><TableCell>{nameOf(p)}</TableCell><TableCell>{personType === "student" ? (p.classId?.name || selectedClass?.name || "-") : label.slice(0, -1)}</TableCell><TableCell>{personType === "student" ? (p.sectionId?.name || "-") : (p.designation || p.subject || "-")}</TableCell><TableCell><b>{p.totalPresent || 0}</b></TableCell><TableCell><div className="flex flex-wrap gap-2">{(["present", "absent", "late", "leave"] as Status[]).map((s) => <Button key={s} size="sm" variant={p.status === s ? "default" : "outline"} onClick={() => setOne(p._id, s)}>{s}</Button>)}</div></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => setSelected({ id: personType === "student" ? p._id : userIdOf(p), name: nameOf(p), roll: personType === "student" ? p.rollNumber : p.employeeId, className: personType === "student" ? (p.classId?.name || selectedClass?.name) : label.slice(0, -1), section: personType === "student" ? p.sectionId?.name : p.designation, userType: personType, dbStudentId: personType === "student" ? p._id : undefined, dbUserId: personType !== "student" ? userIdOf(p) : undefined, dbClassId: personType === "student" ? (idOf(p.classId) || classId) : undefined, dbSectionId: personType === "student" ? (idOf(p.sectionId) || sectionId) : undefined })}><Calendar className="mr-2 h-4 w-4" />Calendar</Button></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => printPerson(p)}><Printer className="mr-2 h-4 w-4" />Print</Button></TableCell></TableRow>)}</TableBody></Table>{!people.length && <div className="py-10 text-center text-sm text-muted-foreground">{loading ? "Loading..." : `No ${label.toLowerCase()} found.`}</div>}</section>
    <AttendanceCalendarDialog isOpen={!!selected} person={selected} onClose={() => setSelected(null)} onAttendanceUpdated={loadPeople} />
  </div>;
}
