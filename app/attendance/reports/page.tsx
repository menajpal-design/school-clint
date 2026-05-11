"use client";

import { useEffect, useState } from "react";
import { Download, FileBarChart } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Person = { _id: string; rollNumber?: string; userId?: { name: string } };
type RecordItem = { _id: string; date: string; status: string; studentId?: { rollNumber?: string; userId?: { name: string } }; classId?: { name: string }; sectionId?: { name: string } };

const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export default function AttendanceReportsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [personId, setPersonId] = useState("");
  const [startDate, setStartDate] = useState(firstDay());
  const [endDate, setEndDate] = useState(today());
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];

  const loadLookups = async () => {
    const classRes = await api.academic.classes.getAll() as { classes: ClassItem[] };
    setClasses(classRes.classes || []);
  };

  const loadPeople = async () => {
    const data = await api.attendance.getStudents({ classId: classId || undefined, sectionId: sectionId || undefined }) as { students: Person[] };
    setPeople(data.students || []);
  };

  const loadReports = async () => {
    const data = await api.attendance.getReports({ startDate, endDate, classId: classId || undefined, sectionId: sectionId || undefined, personId: personId || undefined }) as any;
    setReports(data.reports || []);
    setComparison(data.comparison || []);
    setTrend(data.trend || []);
  };

  useEffect(() => { loadLookups().catch(() => undefined); }, []);
  useEffect(() => { loadPeople().catch(() => setPeople([])); }, [classId, sectionId]);
  useEffect(() => { loadReports().catch(() => undefined); }, [startDate, endDate, classId, sectionId, personId]);

  const exportCsv = () => {
    const rows = [["Date","Name","Roll","Class","Section","Status"], ...reports.map((item) => [formatDate(item.date), item.studentId?.userId?.name || "", item.studentId?.rollNumber || "", item.classId?.name || "", item.sectionId?.name || "", item.status])];
    const blob = new Blob([rows.map((row) => row.join(",")).join("\n")], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "attendance-report.csv";
    link.click();
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance Reports" description="Analyze attendance by date, class, section and person." icon={FileBarChart} actions={[{ label: "Export Excel", icon: Download, onClick: exportCsv }, { label: "Export PDF", icon: Download, onClick: () => window.print() }]} />

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Start"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="End"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          <Select label="Class" value={classId} onChange={(value) => { setClassId(value); setSectionId(""); setPersonId(""); }}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
          <Select label="Section" value={sectionId} onChange={(value) => { setSectionId(value); setPersonId(""); }}><option value="">All sections</option>{sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>
          <Select label="Student/Staff" value={personId} onChange={setPersonId}><option value="">All people</option>{people.map((item) => <option key={item._id} value={item._id}>{item.rollNumber ? `${item.rollNumber} - ` : ""}{item.userId?.name}</option>)}</Select>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <BarChartCard title="Attendance comparison" data={comparison.map((item) => ({ name: item.name || "Class", value: item.percentage || 0 }))} />
        <LineChartCard title="Attendance trend" data={trend.map((item) => ({ name: item.date, value: item.percentage || 0 }))} />
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Roll</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
          {reports.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">No records found.</TableCell></TableRow> : reports.map((item) => <TableRow key={item._id}><TableCell>{formatDate(item.date)}</TableCell><TableCell>{item.studentId?.userId?.name || "-"}</TableCell><TableCell>{item.studentId?.rollNumber || "-"}</TableCell><TableCell>{item.classId?.name || "-"}</TableCell><TableCell>{item.sectionId?.name || "-"}</TableCell><TableCell className="capitalize">{item.status}</TableCell></TableRow>)}
        </TableBody></Table>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="space-y-2"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>;
}

function Select({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return <Field label={label}><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)}>{children}</select></Field>;
}
