"use client";

import "@/lib/attendance-api-compat";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Calendar, Camera, ClipboardCheck, Download, FileSpreadsheet, FileText, RefreshCw, Save } from "lucide-react";
import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { api } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { getPrintInstitution } from "@/lib/export-utils";
import { cn, downloadFile } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { normalizeUserRole } from "@/lib/permissions";
import { AttendanceCalendarDialog } from "@/components/attendance/AttendanceCalendarDialog";

type Status = "present" | "absent" | "late" | "leave";
type PersonType = "student" | "teacher" | "staff";
type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Person = { _id: string; profileId?: string; personType?: PersonType; rollNumber?: string; employeeId?: string; designation?: string; department?: string; userId?: { _id?: string; name?: string; phone?: string; role?: string }; classId?: { _id: string; name?: string } | string; sectionId?: { _id: string; name?: string } | string; status?: Status };

const today = () => new Date().toISOString().slice(0, 10);
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const personName = (person: Person) => person.userId?.name || "Unnamed";
const personId = (person: Person) => String(person.rollNumber || person.employeeId || person.userId?._id || person._id || "-");
const sectionName = (person: Person) => typeof person.sectionId === "object" ? person.sectionId?.name || "-" : "-";
const classNameOf = (person: Person, selectedClass?: ClassItem) => typeof person.classId === "object" ? person.classId?.name || selectedClass?.name || "-" : selectedClass?.name || "-";
const objId = (value: any) => String(value?._id || value || "");

export default function AttendanceMarkPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  useEffect(() => { const role = normalizeUserRole(user?.role); if (!authLoading && user && (role === 'student' || role === 'parent')) router.replace('/attendance/my-attendance'); }, [user, authLoading, router]);
  const { addToast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [personType, setPersonType] = useState<PersonType>("student");
  const [classId, setClassId] = useState("");
  const [lockedClassId, setLockedClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [message, setMessage] = useState("");
  const [selectedCalendarPerson, setSelectedCalendarPerson] = useState<any | null>(null);
  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((section) => section.isActive !== false) || [];
  const canManageTeachers = authManager.hasRole(["head", "assistant_head", "admin", "super_admin"]);
  const activePeopleLabel = personType === "teacher" ? "teachers" : personType === "staff" ? "staff" : "students";
  const idLabel = personType === "student" ? "Roll" : "Employee ID";
  const groupLabel = personType === "student" ? "Class" : "Department";
  const subGroupLabel = personType === "student" ? "Section" : "Designation";
  const statusCounts = useMemo(() => ({ present: people.filter((p) => p.status === "present").length, absent: people.filter((p) => p.status === "absent").length, late: people.filter((p) => p.status === "late").length, leave: people.filter((p) => p.status === "leave").length }), [people]);
  const notify = (title: string, description: string, type: "success" | "error" | "info" | "warning" = "success") => addToast({ title, message: description, type, duration: 4000 });

  const loadClasses = useCallback(async () => {
    try {
      const data = await api.academic.classes.getAll() as { classes: ClassItem[] };
      const nextClasses = data.classes || [];
      setClasses(nextClasses);
      setClassId((current) => current || nextClasses[0]?._id || "");
    } catch (error: any) { setMessage(error?.message || "Failed to load classes."); }
  }, []);

  const loadPeople = useCallback(async () => {
    if (personType === "student" && !classId) return;
    setLoading(true); setMessage("");
    try {
      const roster = await api.attendance.getPeople({ personType, classId: personType === "student" ? classId : undefined, sectionId: personType === "student" ? sectionId || undefined : undefined }) as { people: Person[]; lockedClassId?: string };
      const effectiveClassId = personType === "student" ? (roster.lockedClassId || classId) : classId;
      if (personType === "student" && roster.lockedClassId && roster.lockedClassId !== classId) { setLockedClassId(roster.lockedClassId); setClassId(roster.lockedClassId); }
      const attendance = await api.attendance.getAll({ classId: personType === "student" ? effectiveClassId : undefined, sectionId: personType === "student" ? sectionId || undefined : undefined, userType: personType === "student" ? undefined : personType, date }) as { attendance: any[] };
      const statusMap = new Map((attendance.attendance || []).map((item: any) => [String(personType === "student" ? item.studentId?._id || item.studentId : item.userId?._id || item.userId), item.status]));
      const nextPeople = (roster.people || []).map((person) => ({ ...person, personType, status: (statusMap.get(String(objId(person._id))) as Status) || "absent" }));
      setPeople(nextPeople);
      if (!nextPeople.length) setMessage(`No ${activePeopleLabel} loaded. Please check roster/class or add ${activePeopleLabel}.`);
    } catch (error: any) { const text = error?.message || `Failed to load ${activePeopleLabel}.`; setMessage(text); notify("Attendance load failed", text, "error"); }
    finally { setLoading(false); }
  }, [classId, date, personType, sectionId]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadPeople(); }, [loadPeople]);
  const setAll = (status: Status) => setPeople((current) => current.map((person) => ({ ...person, status })));
  const setOne = (id: string, status: Status) => setPeople((current) => current.map((person) => person._id === id ? { ...person, status } : person));
  const save = async () => {
    if (!people.length) return notify("No roster", "No people loaded to save attendance.", "warning");
    const effectiveClassId = lockedClassId || classId;
    setSaving(true); setMessage("");
    try {
      await api.attendance.mark({ classId: personType === "student" ? effectiveClassId : undefined, sectionId: personType === "student" ? sectionId || undefined : undefined, date, records: people.map((person) => personType === "student" ? { studentId: person._id, userType: "student", classId: objId(person.classId) || effectiveClassId, sectionId: objId(person.sectionId) || sectionId || undefined, date, status: person.status || "absent" } : { userId: person.userId?._id || person._id, userType: personType, date, status: person.status || "absent" }) });
      await loadPeople(); setMessage("Attendance saved successfully."); notify("Attendance saved", "Attendance records saved successfully.", "success");
    } catch (error: any) { const text = error?.message || "Failed to save attendance."; setMessage(text); notify("Attendance failed", text, "error"); }
    finally { setSaving(false); }
  };
  const scan = async (code?: string) => { const value = code || scanCode; if (!value) return notify("Scan required", "Please enter or scan a card code.", "warning"); try { const data = await api.attendance.scanIdCard({ code: value }) as { student?: Person; teacher?: Person; staff?: Person }; const found = data.student || data.teacher || data.staff; if (!found) return notify("Not found", "No matching ID card found.", "warning"); setOne(found._id, "present"); setScanOpen(false); setScanCode(""); setMessage(`${personName(found)} marked present.`); notify("Marked present", `${personName(found)} marked present.`, "success"); } catch (error: any) { const text = error?.message || "Scan failed."; setMessage(text); notify("Scan failed", text, "error"); } };
  const exportCsv = () => { const rows = [[idLabel, "Name", "Type", groupLabel, subGroupLabel, "Date", "Status"], ...people.map((person) => [personId(person), personName(person), personType, personType === "student" ? classNameOf(person, selectedClass) : person.department || "-", personType === "student" ? sectionName(person) : person.designation || "-", date, person.status || "absent"] )]; downloadFile(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`, `attendance-${personType}-${date}.csv`, "text/csv;charset=utf-8"); };
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" }); const institution = getPrintInstitution(); const pageWidth = doc.internal.pageSize.getWidth(); const pageHeight = doc.internal.pageSize.getHeight(); const margin = 36; const columns = [idLabel, "Name", groupLabel, subGroupLabel, "Status"]; const widths = [92, 222, 150, 150, 88];
    const drawHeader = () => { doc.setFillColor(15, 23, 42); doc.rect(0, 0, pageWidth, 74, "F"); doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text(institution.name || "EASY SCHOOL", margin, 24); doc.setFont("helvetica", "normal"); doc.setFontSize(10); if (institution.address) doc.text(institution.address, margin, 40); doc.text(`${activePeopleLabel.toUpperCase()} ATTENDANCE | ${date} | RECORDS: ${people.length}`, margin, institution.address ? 56 : 44); };
    const drawTableHeader = (y: number) => { let x = margin; doc.setFillColor(226, 232, 240); doc.rect(margin, y, pageWidth - margin * 2, 24, "F"); doc.setTextColor(15, 23, 42); doc.setFont("helvetica", "bold"); doc.setFontSize(9); columns.forEach((column, index) => { doc.text(column, x + 6, y + 16); x += widths[index]; }); };
    const addPage = () => { doc.addPage(); drawHeader(); drawTableHeader(90); return 118; };
    drawHeader(); drawTableHeader(90); let y = 118; doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    people.forEach((person) => { if (y > pageHeight - 44) y = addPage(); const values = [personId(person), personName(person), personType === "student" ? classNameOf(person, selectedClass) : person.department || "-", personType === "student" ? sectionName(person) : person.designation || "-", person.status || "absent"]; let tx = 36; values.forEach((val, index) => { doc.setTextColor(index === 4 && val === "present" ? 22 : 15, index === 4 && val === "present" ? 163 : 23, index === 4 && val === "present" ? 74 : 42); doc.text(String(val).slice(0, 32), tx + 6, y); tx += widths[index]; }); y += 20; });
    doc.save(`attendance-${personType}-${date}.pdf`);
  };
  return <div className="space-y-5"><PageHeader title="Mark Attendance" description="Mark student, teacher and staff attendance." icon={ClipboardCheck} /><section className="rounded-lg border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-5"><Select value={personType} onValueChange={(value) => { setPersonType(value as PersonType); setPeople([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Students</SelectItem>{canManageTeachers && <SelectItem value="teacher">Teachers</SelectItem>}{canManageTeachers && <SelectItem value="staff">Staff</SelectItem>}</SelectContent></Select>{personType === "student" && <Select value={classId} onValueChange={(value) => { if (!lockedClassId) setClassId(value); }} disabled={Boolean(lockedClassId)}><SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger><SelectContent>{classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent></Select>}{personType === "student" && <Select value={sectionId || "all"} onValueChange={(value) => setSectionId(value === "all" ? "" : value)}><SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger><SelectContent><SelectItem value="all">All Sections</SelectItem>{sections.map((section) => <SelectItem key={section._id} value={section._id}>{section.name}</SelectItem>)}</SelectContent></Select>}<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /><Button onClick={loadPeople} variant="outline"><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>{lockedClassId && <p className="mt-2 text-xs font-semibold text-amber-700">Class Teacher mode: only your assigned class can be marked.</p>}{message && <p className="mt-3 text-sm text-muted-foreground">{message}</p>}</section><section className="grid gap-3 md:grid-cols-4">{(["present", "absent", "late", "leave"] as Status[]).map((status) => <div key={status} className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">{status}</div><div className="text-2xl font-bold">{statusCounts[status]}</div></div>)}</section><section className="rounded-lg border bg-card p-4 shadow-sm"><div className="mb-4 flex flex-wrap gap-2"><Button onClick={() => setAll("present")} variant="outline">All Present</Button><Button onClick={() => setAll("absent")} variant="outline">All Absent</Button><Button onClick={() => setAll("leave")} variant="outline">All Leave</Button><Button onClick={() => setScanOpen(true)} variant="outline"><Camera className="mr-2 h-4 w-4" />Scan</Button><Button onClick={exportCsv} variant="outline"><FileSpreadsheet className="mr-2 h-4 w-4" />CSV</Button><Button onClick={exportPdf} variant="outline"><FileText className="mr-2 h-4 w-4" />PDF</Button><Button onClick={save} disabled={saving || loading} className="ml-auto"><Save className="mr-2 h-4 w-4" />Save</Button></div><Table><TableHeader><TableRow><TableHead>{idLabel}</TableHead><TableHead>Name</TableHead><TableHead>{groupLabel}</TableHead><TableHead>{subGroupLabel}</TableHead><TableHead>Status</TableHead><TableHead>History</TableHead></TableRow></TableHeader><TableBody>{people.map((person) => <TableRow key={person._id}><TableCell>{personId(person)}</TableCell><TableCell>{personName(person)}</TableCell><TableCell>{personType === "student" ? classNameOf(person, selectedClass) : person.department || "-"}</TableCell><TableCell>{personType === "student" ? sectionName(person) : person.designation || "-"}</TableCell><TableCell><div className="flex flex-wrap gap-2">{(["present", "absent", "late", "leave"] as Status[]).map((status) => <Button key={status} size="sm" variant={person.status === status ? "default" : "outline"} className={cn("capitalize", person.status === status && status === "present" && "bg-emerald-600 hover:bg-emerald-700")} onClick={() => setOne(person._id, status)}>{status}</Button>)}</div></TableCell><TableCell><Button size="sm" variant="outline" onClick={() => setSelectedCalendarPerson({ id: person._id, name: personName(person), roll: person.rollNumber || person.employeeId || "-", className: classNameOf(person, selectedClass), section: personType === "student" ? sectionName(person) : person.designation || "-", userType: personType, dbStudentId: personType === "student" ? person._id : undefined, dbUserId: personType !== "student" ? (person.userId?._id || person._id) : undefined, dbClassId: personType === "student" ? (typeof person.classId === "object" ? person.classId?._id : person.classId) : undefined, dbSectionId: personType === "student" ? (typeof person.sectionId === "object" ? person.sectionId?._id : person.sectionId) : undefined })} className="flex items-center gap-1.5 bg-white hover:bg-slate-50 border-slate-200"><Calendar className="h-4 w-4 text-indigo-600" />Calendar</Button></TableCell></TableRow>)}</TableBody></Table>{!people.length && <div className="py-10 text-center text-sm text-muted-foreground">{loading ? "Loading..." : `No ${activePeopleLabel} loaded.`}</div>}</section><Dialog open={scanOpen} onOpenChange={setScanOpen}><DialogContent><DialogHeader><DialogTitle>Scan ID card</DialogTitle><DialogDescription>Scan QR/barcode or type card number.</DialogDescription></DialogHeader><WebcamScanner onScan={(value) => scan(value)} /><Input value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Card number" /><Button onClick={() => scan()}><Camera className="mr-2 h-4 w-4" />Mark Present</Button></DialogContent></Dialog><AttendanceCalendarDialog isOpen={selectedCalendarPerson !== null} onClose={() => setSelectedCalendarPerson(null)} person={selectedCalendarPerson} onAttendanceUpdated={loadPeople} /></div>;
}
