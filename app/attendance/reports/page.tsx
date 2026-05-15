"use client";

import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { Download, FileBarChart } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { getPrintInstitution, makeQrDataUrl } from "@/lib/export-utils";
import { downloadFile, formatDate } from "@/lib/utils";

type ClassItem = { _id: string; name: string; sections?: Array<{ _id: string; name: string; isActive?: boolean }> };
type Person = { _id: string; rollNumber?: string; userId?: { name: string } };
type RecordItem = { _id: string; date: string; status: string; userType?: string; userId?: { name?: string; role?: string }; studentId?: { rollNumber?: string; userId?: { name: string } }; classId?: { name: string }; sectionId?: { name: string } };

const firstDay = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);
const dateKey = (value?: string | Date) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return new Date(value).toISOString().slice(0, 10);
};

export default function AttendanceReportsPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [personId, setPersonId] = useState("");
  const [personType, setPersonType] = useState<"student" | "teacher">("student");
  const [startDate, setStartDate] = useState(firstDay());
  const [endDate, setEndDate] = useState(today());
  const [reports, setReports] = useState<RecordItem[]>([]);
  const [comparison, setComparison] = useState<any[]>([]);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedClass = classes.find((item) => item._id === classId);
  const sections = selectedClass?.sections?.filter((item) => item.isActive !== false) || [];

  const loadLookups = async () => {
    const classRes = await api.academic.classes.getAll() as { classes: ClassItem[] };
    setClasses(classRes.classes || []);
  };

  const loadPeople = async () => {
    const data = await api.attendance.getPeople({ personType, classId: personType === "student" ? classId || undefined : undefined, sectionId: personType === "student" ? sectionId || undefined : undefined }) as { people: Person[] };
    setPeople(data.people || []);
  };

  const loadReports = async () => {
    setLoading(true);
    setMessage("");
    try {
      const data = await api.attendance.getReports({
        startDate,
        endDate,
        classId: personType === "student" ? classId || undefined : undefined,
        sectionId: personType === "student" ? sectionId || undefined : undefined,
        personId: personId || undefined,
        personType,
        userType: personType === "teacher" ? "teacher" : undefined,
      }) as any;
      setReports(data.reports || []);
      setComparison(data.comparison || []);
      setTrend(data.trend || []);
    } catch (err: any) {
      setReports([]);
      setComparison([]);
      setTrend([]);
      setMessage(err?.message || "Failed to load attendance reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadLookups().catch(() => undefined); }, []);
  useEffect(() => { loadPeople().catch(() => setPeople([])); }, [personType, classId, sectionId]);
  useEffect(() => { loadReports().catch(() => undefined); }, [startDate, endDate, classId, sectionId, personId, personType]);

  const reportRows = reports.map((item) => ({
    date: formatDate(dateKey(item.date)),
    name: item.studentId?.userId?.name || item.userId?.name || "-",
    roll: item.studentId?.rollNumber || (item.userType === "teacher" ? "Teacher" : "-"),
    className: item.classId?.name || (item.userType === "teacher" ? "Teachers" : "-"),
    section: item.sectionId?.name || item.userId?.role || "-",
    status: item.status || "-",
  }));
  const summary = {
    total: reports.length,
    present: reports.filter((item) => item.status === "present").length,
    absent: reports.filter((item) => item.status === "absent").length,
    late: reports.filter((item) => item.status === "late").length,
    leave: reports.filter((item) => item.status === "leave").length,
  };

  const fileSuffix = `${startDate}_to_${endDate}`;

  const csvCell = (value: string) => `"${String(value).replace(/"/g, '""')}"`;

  const exportExcel = () => {
    const headers = ["Date", "Name", "Roll", "Class", "Section", "Status"];
    const rows = reportRows.map((row) => [row.date, row.name, row.roll, row.className, row.section, row.status]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    downloadFile(`\uFEFF${csv}`, `attendance-report-${fileSuffix}.csv`, "text/csv;charset=utf-8");
  };

  const exportPdf = async () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const institution = getPrintInstitution();
    const qrDataUrl = await makeQrDataUrl(JSON.stringify({
      title: "Attendance Report",
      institution: institution.name,
      startDate,
      endDate,
      records: reportRows.length,
      generatedAt: new Date().toISOString(),
    }), 96);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const columns = [
      { label: "Date", width: 86 },
      { label: "Name", width: 190 },
      { label: "Roll", width: 80 },
      { label: "Class", width: 135 },
      { label: "Section", width: 85 },
      { label: "Status", width: 90 },
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
      if (institution.address) doc.text(institution.address, margin, 40);
      doc.text(`Attendance Report | Period: ${startDate} to ${endDate} | Records: ${reportRows.length}`, margin, institution.address ? 56 : 44);
      doc.addImage(qrDataUrl, "PNG", pageWidth - margin - 54, 14, 48, 48);
      doc.setFontSize(7);
      doc.text("Scan to verify", pageWidth - margin - 30, 68, { align: "center" });
    };

    const drawTableHeader = (y: number) => {
      let x = margin;
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 24, "F");
      doc.setTextColor(51, 65, 85);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      columns.forEach((column) => {
        doc.text(column.label, x + 6, y + 16);
        x += column.width;
      });
    };

    const addPage = () => {
      doc.addPage();
      drawHeader();
      drawTableHeader(88);
      return 116;
    };

    drawHeader();
    drawTableHeader(88);

    let y = 116;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const rows = reportRows.length > 0 ? reportRows : [{ date: "-", name: "No records found", roll: "-", className: "-", section: "-", status: "-" }];
    rows.forEach((row, index) => {
      if (y > pageHeight - 48) {
        y = addPage();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 14, pageWidth - margin * 2, 24, "F");
      }

      const values = [row.date, row.name, row.roll, row.className, row.section, row.status];
      let x = margin;
      doc.setTextColor(15, 23, 42);
      values.forEach((value, columnIndex) => {
        const text = doc.splitTextToSize(String(value), columns[columnIndex].width - 12)[0] || "";
        doc.text(text, x + 6, y);
        x += columns[columnIndex].width;
      });
      y += 24;
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - margin, pageHeight - 18, { align: "right" });
    }

    doc.save(`attendance-report-${fileSuffix}.pdf`);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Reports"
        description="Analyze attendance by date, class, section and person."
        icon={FileBarChart}
        actions={[
          <Button key="export-excel" variant="outline" size="sm" onClick={exportExcel} className="flex items-center gap-2"><Download className="h-4 w-4" />Export Excel</Button>,
          <Button key="export-pdf" variant="outline" size="sm" onClick={exportPdf} className="flex items-center gap-2"><Download className="h-4 w-4" />Export PDF</Button>,
        ]}
      />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <Field label="Start"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
          <Field label="End"><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></Field>
          <Select label="Type" value={personType} onChange={(value) => { setPersonType(value as "student" | "teacher"); setPersonId(""); }}><option value="student">Students</option><option value="teacher">Teachers</option></Select>
          {personType === "student" && <Select label="Class" value={classId} onChange={(value) => { setClassId(value); setSectionId(""); setPersonId(""); }}><option value="">All classes</option>{classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>}
          {personType === "student" && <Select label="Section" value={sectionId} onChange={(value) => { setSectionId(value); setPersonId(""); }}><option value="">All sections</option>{sections.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</Select>}
          <Select label={personType === "teacher" ? "Teacher" : "Student"} value={personId} onChange={setPersonId}><option value="">All {personType === "teacher" ? "teachers" : "students"}</option>{people.map((item) => <option key={item._id} value={item._id}>{item.rollNumber ? `${item.rollNumber} - ` : ""}{item.userId?.name}</option>)}</Select>
        </div>
      </section>

      {message && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div>}

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={summary.total} loading={loading} />
        <StatCard label="Present" value={summary.present} tone="emerald" loading={loading} />
        <StatCard label="Absent" value={summary.absent} tone="rose" loading={loading} />
        <StatCard label="Late" value={summary.late} tone="amber" loading={loading} />
        <StatCard label="Leave" value={summary.leave} tone="blue" loading={loading} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <BarChartCard title="Attendance comparison" data={comparison.map((item) => ({ name: item.name || "Class", value: item.percentage || 0 }))} />
        <LineChartCard title="Attendance trend" data={trend.map((item) => ({ name: item.date, value: item.percentage || 0 }))} />
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Date</TableHead><TableHead>Name</TableHead><TableHead>Roll</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
          {reportRows.length === 0 ? <TableRow><TableCell colSpan={6} className="h-32 text-center text-slate-500">{loading ? "Loading reports..." : "No records found."}</TableCell></TableRow> : reportRows.map((item, index) => <TableRow key={`${item.date}-${item.roll}-${index}`}><TableCell>{item.date}</TableCell><TableCell>{item.name}</TableCell><TableCell>{item.roll}</TableCell><TableCell>{item.className}</TableCell><TableCell>{item.section}</TableCell><TableCell><Badge variant="outline" className="capitalize">{item.status}</Badge></TableCell></TableRow>)}
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
