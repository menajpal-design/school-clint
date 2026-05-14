"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, UserCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

type AttendanceRecord = { _id: string; date: string; status: "present" | "absent" | "late" | "leave"; classId?: { name: string }; sectionId?: { name: string } };

export default function MyAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });

  const load = async () => {
    const data = await api.attendance.getMine({ month, year }) as { attendance: AttendanceRecord[]; summary: typeof summary };
    setRecords(data.attendance || []);
    setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0, leave: 0 });
  };

  useEffect(() => { load().catch(() => undefined); }, [month, year]);

  const byDate = useMemo(() => new Map(records.map((item) => [new Date(item.date).getDate(), item.status])), [records]);
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="space-y-5">
      <PageHeader title="My Attendance" description="Monthly attendance summary, calendar view and history." icon={UserCheck} status={<Badge variant="outline">{month}/{year}</Badge>} />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2"><span className="text-sm font-medium text-muted-foreground">Month</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2024, index, 1).toLocaleString("en", { month: "long" })}</option>)}</select></label>
          <label className="space-y-2"><span className="text-sm font-medium text-muted-foreground">Year</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Total" value={summary.total} icon={CalendarDays} />
        <StatCard label="Present" value={summary.present} tone="emerald" />
        <StatCard label="Absent" value={summary.absent} tone="rose" />
        <StatCard label="Late" value={summary.late} tone="amber" />
        <StatCard label="Leave" value={summary.leave} tone="blue" />
      </div>

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1;
            const status = byDate.get(day);
            return <div key={day} className="min-h-20 rounded-lg border border-border p-2"><div className="text-sm font-medium">{day}</div>{status && <Badge variant="outline" className="mt-2 capitalize">{status}</Badge>}</div>;
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Date</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
          {records.length === 0 ? <TableRow><TableCell colSpan={4} className="h-28 text-center text-slate-500">No attendance history for this month.</TableCell></TableRow> : records.map((record) => <TableRow key={record._id}><TableCell>{formatDate(record.date)}</TableCell><TableCell>{record.classId?.name || "-"}</TableCell><TableCell>{record.sectionId?.name || "-"}</TableCell><TableCell><Badge variant="outline" className="capitalize">{record.status}</Badge></TableCell></TableRow>)}
        </TableBody></Table>
      </section>
    </div>
  );
}
