"use client";

import "@/lib/attendance-api-compat";
import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import { Camera, ClipboardCheck, Download, FileSpreadsheet, FileText, RefreshCw, Save } from "lucide-react";

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

type Status = "present" | "absent" | "late" | "leave";
type PersonType = "student" | "teacher" | "staff";
type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Person = {
  _id: string;
  profileId?: string;
  personType?: PersonType;
  rollNumber?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  userId?: { _id?: string; name?: string; phone?: string; role?: string };
  classId?: { _id: string; name?: string } | string;
  sectionId?: { _id: string; name?: string } | string;
  status?: Status;
};

const today = () => new Date().toISOString().slice(0, 10);
const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
const personName = (person: Person) => person.userId?.name || "Unnamed";
const personId = (person: Person) => String(person.rollNumber || person.employeeId || person.userId?._id || person._id || "-");
const sectionName = (person: Person) => typeof person.sectionId === "object" ? person.sectionId?.name || "-" : "-";
const classNameOf = (person: Person, selectedClass?: ClassItem) => typeof person.classId === "object" ? person.classId?.name || selectedClass?.name || "-" : selectedClass?.name || "-";

export default function AttendanceMarkPage() {
  const { addToast } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [personType, setPersonType] = useState<PersonType>("student");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanCode, setScanCode] = useState("");
  const [message, setMessage] = useState("");

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((section) => section.isActive !== false) || [];
  const canManageTeachers = authManager.hasRole(["head", "assistant_head", "admin", "super_admin"]);
  const activePeopleLabel = personType === "teacher" ? "teachers" : personType === "staff" ? "staff" : "students";
  const idLabel = personType === "student" ? "Roll" : "Employee ID";
  const groupLabel = personType === "student" ? "Class" : "Department";
  const subGroupLabel = personType === "student" ? "Section" : "Designation";

  const statusCounts = useMemo(() => ({
    present: people.filter((p) => p.status === "present").length,
    absent: people.filter((p) => p.status === "absent").length,
    late: people.filter((p) => p.status === "late").length,
    leave: people.filter((p) => p.status === "leave").length,
  }), [people]);

  const notify = (title: string, description: string, type: "success" | "error" | "info" | "warning" = "success") => addToast({ title, message: description, type, duration: 4000 });

  const loadClasses = useCallback(async () => {
    try {
      const data = await api.academic.classes.getAll() as { classes: ClassItem[] };
      const nextClasses = data.classes || [];
      setClasses(nextClasses);
      setClassId((current) => current || nextClasses[0]?._id || "");
    } catch (error: any) {
      setMessage(error?.message || "Failed to load classes.");
    }
  }, []);

  const loadPeople = useCallback(async () => {
    if (personType === "student" && !classId) return;
    setLoading(true);
    setMessage("");
    try {
      const roster = await api.attendance.getPeople({
        personType,
        classId: personType === "student" ? classId : undefined,
        sectionId: personType === "student" ? sectionId || undefined : undefined,
      }) as { people: Person[] };
      const attendance = await api.attendance.getAll({
        classId: personType === "student" ? classId : undefined,
        sectionId: personType === "student" ? sectionId || undefined : undefined,
        userType: personType === "student" ? undefined : personType,
        date,
      }) as { attendance: any[] };
      const statusMap = new Map((attendance.attendance || []).map((item: any) => [String(personType === "student" ? item.studentId?._id || item.studentId : item.userId?._id || item.userId), item.status]));
      const nextPeople = (roster.people || []).map((person) => ({ ...person, personType, status: (statusMap.get(String(person._id)) as Status) || "absent" }));
      setPeople(nextPeople);
      if (!nextPeople.length) setMessage(`No ${activePeopleLabel} loaded. Please check roster/class or add ${activePeopleLabel}.`);
    } catch (error: any) {
      const text = error?.message || `Failed to load ${activePeopleLabel}.`;
      setMessage(text);
      notify("Attendance load failed", text, "error");
    } finally {
      setLoading(false);
    }
  }, [classId, date, personType, sectionId]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { loadPeople(); }, [loadPeople]);

  const setAll = (status: Status) => setPeople((current) => current.map((person) => ({ ...person, status })));
  const setOne = (id: string, status: Status) => setPeople((current) => current.map((person) => person._id === id ? { ...person, status } : person));

  const save = async () => {
    if (!people.length) return notify("No roster", "No people loaded to save attendance.", "warning");
    setSaving(true);
    setMessage("");
    try {
      await api.attendance.mark({
        classId: personType === "student" ? classId : undefined,
        sectionId: personType === "student" ? sectionId || undefined : undefined,
        date,
        records: people.map((person) => personType === "student"
          ? { studentId: person._id, userType: "student", classId, sectionId: typeof person.sectionId === "object" ? person.sectionId?._id : sectionId, date, status: person.status || "absent" }
          : { userId: person.userId?._id || person._id, userType: personType, date, status: person.status || "absent" }),
      });
      await loadPeople();
      setMessage("Attendance saved successfully.");
      notify("Attendance saved", "Attendance records saved successfully.", "success");
    } catch (error: any) {
      const text = error?.message || "Failed to save attendance.";
      setMessage(text);
      notify("Attendance failed", text, "error");
    } finally {
      setSaving(false);
    }
  };

  const scan = async (code?: string) => {
    const value = code || scanCode;
    if (!value) return notify("Scan required", "Please enter or scan a card code.", "warning");
    try {
      const data = await api.attendance.scanIdCard({ code: value }) as { student?: Person; teacher?: Person; staff?: Person };
      const found = data.student || data.teacher || data.staff;
      if (!found) return notify("Not found", "No matching ID card found.", "warning");
      setOne(found._id, "present");
      setScanOpen(false);
      setScanCode("");
      setMessage(`${personName(found)} marked present.`);
      notify("Marked present", `${personName(found)} marked present.`, "success");
    } catch (error: any) {
      const text = error?.message || "Scan failed.";
      setMessage(text);
      notify("Scan failed", text, "error");
    }
  };

  const exportCsv = () => {
    const rows = [[idLabel, "Name", "Type", groupLabel, subGroupLabel, "Date", "Status"], ...people.map((person) => [personId(person), personName(person), personType, personType === "student" ? classNameOf(person, selectedClass) : person.department || "-", personType === "student" ? sectionName(person) : person.designation || "-", date, person.status || "absent"] )];
    downloadFile(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`, `attendance-${personType}-${date}.csv`, "text/csv;charset=utf-8");
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const institution = getPrintInstitution();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const columns = [idLabel, "Name", groupLabel, subGroupLabel, "Status"];
    const widths = [92, 222, 150, 150, 88];

    const drawHeader = () => {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 74, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(institution.name || "EASY SCHOOL", margin, 24);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (institution.address) doc.text(institution.address, margin, 40);
      doc.text(`${activePeopleLabel.toUpperCase()} ATTENDANCE | ${date} | RECORDS: ${people.length}`, margin, institution.address ? 56 : 44);
      doc.setFillColor(14, 116, 144);
      doc.roundedRect(pageWidth - margin - 128, 18, 92, 28, 8, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ATTENDANCE PDF", pageWidth - margin - 82, 36, { align: "center" });
    };

    const drawTableHeader = (y: number) => {
      let x = margin;
      doc.setFillColor(226, 232, 240);
      doc.rect(margin, y, pageWidth - margin * 2, 24, "F");
      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      columns.forEach((column, index) => {
        doc.text(column, x + 6, y + 16);
        x += widths[index];
      });
    };

    const addPage = () => {
      doc.addPage();
      drawHeader();
      drawTableHeader(90);
      return 118;
    };

    drawHeader();
    drawTableHeader(90);

    let y = 118;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const cols = [idLabel, "Name", groupLabel, subGroupLabel, "Status"];
    people.forEach((person) => {
      if (y > pageHeight - 44) { y = addPage(); }
      if (((y - 118) / 20) % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(margin, y - 14, pageWidth - margin * 2, 22, "F"); }
      const values = [personId(person), personName(person), personType === "student" ? classNameOf(person, selectedClass) : person.department || "-", personType === "student" ? sectionName(person) : person.designation || "-", person.status || "absent"];
      let tx = 36;
      values.forEach((val, index) => {
        const cell = String(val).slice(0, 32);
        doc.setTextColor(index === 4 && val === "present" ? 22 : 15, index === 4 && val === "present" ? 163 : 23, index === 4 && val === "present" ? 74 : 42);
        doc.text(cell, tx + 6, y);
        tx += widths[index];
      });
      y += 20;
    });
    const pages = doc.getNumberOfPages();
    for (let page = 1; page <= pages; page += 1) {
      doc.setPage(page);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Page ${page} of ${pages}`, pageWidth - margin, pageHeight - 16, { align: "right" });
    }
    doc.save(`attendance-${personType}-${date}.pdf`);
  };

  return <div className="space-y-5">
    <PageHeader
      title="Mark Attendance"
      description="Select student, teacher or staff roster and mark attendance."
      icon={ClipboardCheck}
      status={<Badge variant="outline">{people.length} {activePeopleLabel}</Badge>}
      actions={[
        <Button key="refresh" variant="outline" size="sm" onClick={loadPeople} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
        <Button key="scan" variant="outline" size="sm" onClick={() => setScanOpen(true)}><Camera className="mr-2 h-4 w-4" />Scan ID</Button>,
        <Button key="csv" variant="outline" size="sm" onClick={exportCsv}><FileSpreadsheet className="mr-2 h-4 w-4" />CSV</Button>,
        <Button key="pdf" variant="outline" size="sm" onClick={exportPdf}><FileText className="mr-2 h-4 w-4" />PDF</Button>,
        <Button key="save" size="sm" onClick={save} disabled={saving || !people.length}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save"}</Button>,
      ]}
    />

    {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{message}</div>}

    <section className="grid gap-3 rounded-lg border bg-card p-4 shadow-sm md:grid-cols-4">
      <label className="space-y-2"><span className="text-sm font-medium">Roster</span><Select value={personType} onValueChange={(value: PersonType) => setPersonType(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="student">Students</SelectItem>{canManageTeachers && <SelectItem value="teacher">Teachers</SelectItem>}{canManageTeachers && <SelectItem value="staff">Staff</SelectItem>}</SelectContent></Select></label>
      {personType === "student" && <label className="space-y-2"><span className="text-sm font-medium">Class</span><Select value={classId || undefined} onValueChange={setClassId}><SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classes.map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent></Select></label>}
      {personType === "student" && <label className="space-y-2"><span className="text-sm font-medium">Section</span><Select value={sectionId || "all"} onValueChange={(value) => setSectionId(value === "all" ? "" : value)}><SelectTrigger><SelectValue placeholder="All sections" /></SelectTrigger><SelectContent><SelectItem value="all">All sections</SelectItem>{sections.map((section) => <SelectItem key={section._id} value={section._id}>{section.name}</SelectItem>)}</SelectContent></Select></label>}
      <label className="space-y-2"><span className="text-sm font-medium">Date</span><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
    </section>

    <section className="flex flex-wrap gap-2 rounded-lg border bg-card p-4 shadow-sm">
      <Button variant="outline" onClick={() => setAll("present")}>All Present</Button>
      <Button variant="outline" onClick={() => setAll("absent")}>All Absent</Button>
      <Button variant="outline" onClick={() => setAll("late")}>All Late</Button>
      <Button variant="outline" onClick={() => setAll("leave")}>All Leave</Button>
      <span className="ml-auto text-sm text-muted-foreground">Present {statusCounts.present} • Absent {statusCounts.absent} • Late {statusCounts.late} • Leave {statusCounts.leave}</span>
    </section>

    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader><TableRow><TableHead>{idLabel}</TableHead><TableHead>Name</TableHead><TableHead>{groupLabel}</TableHead><TableHead>{subGroupLabel}</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">Loading {activePeopleLabel}...</TableCell></TableRow> : people.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">No {activePeopleLabel} loaded. Check roster/class and refresh.</TableCell></TableRow> : people.map((person) => <TableRow key={person._id}>
            <TableCell>{personId(person)}</TableCell>
            <TableCell className="font-medium">{personName(person)}</TableCell>
            <TableCell>{personType === "student" ? classNameOf(person, selectedClass) : person.department || "-"}</TableCell>
            <TableCell>{personType === "student" ? sectionName(person) : person.designation || "-"}</TableCell>
            <TableCell><div className="flex flex-wrap gap-2">{(["present", "absent", "late", "leave"] as Status[]).map((status) => <Button key={status} size="sm" variant={person.status === status ? "default" : "outline"} className={cn("capitalize", status === "present" && person.status === status && "bg-emerald-600 hover:bg-emerald-700", status === "absent" && person.status === status && "bg-rose-600 hover:bg-rose-700", status === "late" && person.status === status && "bg-amber-500 hover:bg-amber-600", status === "leave" && person.status === status && "bg-sky-600 hover:bg-sky-700")} onClick={() => setOne(person._id, status)}>{status}</Button>)}</div></TableCell>
          </TableRow>)}
        </TableBody>
      </Table>
    </section>

    <Dialog open={scanOpen} onOpenChange={setScanOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Scan ID card</DialogTitle><DialogDescription>Scan a QR/barcode or enter the card code manually.</DialogDescription></DialogHeader>
        <WebcamScanner onScan={(code) => scan(code)} enabled={scanOpen} />
        <div className="flex gap-2"><Input value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Card code" /><Button onClick={() => scan()}>Mark</Button></div>
      </DialogContent>
    </Dialog>
  </div>;
}
