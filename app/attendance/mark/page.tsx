"use client";

import { useEffect, useState } from "react";
import { Camera, ClipboardCheck, Save } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Status = "present" | "absent" | "late" | "leave";
type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Student = { _id: string; rollNumber: string; userId?: { name: string; avatar?: string }; classId?: { _id: string }; sectionId?: { _id: string; name: string }; status?: Status };

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

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];

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
    setStudents((data.students || []).map((student) => ({ ...student, status: (statusByStudent.get(student._id) as Status) || "present" })));
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

  const scan = async () => {
    try {
      const data = await api.attendance.scanIdCard({ code: scanCode }) as { student?: Student };
      if (data.student) setOne(data.student._id, "present");
      setScanOpen(false);
      setScanCode("");
    } catch (err: any) {
      setMessage(err?.message || "Scan failed.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Marking"
        description="Mark daily class attendance with bulk actions and ID card scan support."
        icon={ClipboardCheck}
        actions={[{ label: "ID Card Scan", icon: Camera, onClick: () => setScanOpen(true) }]}
      />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-3">
          <Select label="Class" value={classId} onChange={(value) => { setClassId(value); setSectionId(""); }}>
            <option value="">Select class</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <Select label="Section" value={sectionId} onChange={setSectionId}>
            <option value="">All sections</option>{sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </Select>
          <label className="space-y-2"><span className="text-sm font-medium text-slate-700">Date</span><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
        </div>
      </section>

      {message && <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 p-4">
          <div className="text-sm font-medium text-slate-700">{students.length} students</div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setAll("present")}>All Present</Button>
            <Button type="button" variant="outline" onClick={() => setAll("absent")}>All Absent</Button>
            <Button type="button" onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Attendance"}</Button>
          </div>
        </div>
        <Table>
          <TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Photo</TableHead><TableHead>Roll</TableHead><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
          <TableBody>
            {students.length === 0 ? <TableRow><TableCell colSpan={4} className="h-32 text-center text-slate-500">No students found.</TableCell></TableRow> : students.map((student) => (
              <TableRow key={student._id}>
                <TableCell><div className="h-10 w-10 overflow-hidden rounded-md bg-slate-100">{student.userId?.avatar && <img src={student.userId.avatar} alt="" className="h-full w-full object-cover" />}</div></TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell className="font-medium text-slate-950">{student.userId?.name}</TableCell>
                <TableCell><div className="flex flex-wrap gap-2">{(["present","absent","late","leave"] as Status[]).map((status) => <Button key={status} type="button" size="sm" variant={student.status === status ? "default" : "outline"} className={cn("capitalize")} onClick={() => setOne(student._id, status)}>{status}</Button>)}</div></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>ID Card Scan</DialogTitle><DialogDescription>Enter scanned card number or QR data. Webcam capture can be attached to this modal when a scanner package is available.</DialogDescription></DialogHeader>
          <Input value={scanCode} onChange={(event) => setScanCode(event.target.value)} placeholder="Scan or enter ID card code" />
          <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">Webcam preview</div>
          <DialogFooter><Button variant="outline" onClick={() => setScanOpen(false)}>Cancel</Button><Button onClick={scan}>Mark Present</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></label>;
}
