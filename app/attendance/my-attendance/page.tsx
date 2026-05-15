"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, UserCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

type AttendanceRecord = { _id: string; date: string; status: "present" | "absent" | "late" | "leave"; studentId?: { rollNumber?: string; userId?: { name: string } }; classId?: { name: string }; sectionId?: { name: string } };
const dateKey = (value?: string | Date) => {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const match = String(value).match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return new Date(value).toISOString().slice(0, 10);
};

export default function MyAttendancePage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const isHead = authManager.hasRole("head");

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.attendance.getMine({ month, year }) as { attendance: AttendanceRecord[]; summary: typeof summary };
      setRecords(data.attendance || []);
      setSummary(data.summary || { total: 0, present: 0, absent: 0, late: 0, leave: 0 });
      setMessage("");
    } catch (err: any) {
      setRecords([]);
      setSummary({ total: 0, present: 0, absent: 0, late: 0, leave: 0 });
      setMessage(err?.message || 'Failed to load attendance.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [month, year]);

  const markSelf = async (status: AttendanceRecord["status"] = "present") => {
    setLoading(true);
    setMessage("");
    try {
      const now = new Date();
      const markDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      await api.attendance.markMine({ date: markDate, status });
      setYear(now.getFullYear());
      setMonth(now.getMonth() + 1);
      await load();
      setMessage("Your attendance has been marked.");
    } catch (err: any) {
      setMessage(err?.message || "Failed to mark your attendance.");
    } finally {
      setLoading(false);
    }
  };

  const byDate = useMemo(() => new Map(records.map((item) => [Number(dateKey(item.date).slice(8, 10)), item.status])), [records]);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Attendance"
        description="Monthly attendance summary, calendar view and history."
        icon={UserCheck}
        status={<Badge variant="outline">{month}/{year}</Badge>}
        actions={isHead ? [
          <Button key="mark-present" size="sm" onClick={() => markSelf("present")} disabled={loading}>Mark My Present</Button>,
          <Button key="mark-late" size="sm" variant="outline" onClick={() => markSelf("late")} disabled={loading}>Mark Late</Button>,
        ] : undefined}
      />

      <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-2"><span className="text-sm font-medium text-muted-foreground">Month</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(Date.UTC(2024, index, 1)).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })}</option>)}</select></label>
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
        {message ? (
          <div className="rounded-md border border-border bg-popover p-4 text-sm text-foreground">{message}</div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="text-center text-xs font-semibold text-muted-foreground">{day}</div>)}
            {Array.from({ length: firstWeekday }, (_, index) => <div key={`empty-${index}`} className="min-h-20" />)}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const status = byDate.get(day);
              const classes = ['min-h-20', 'rounded-lg', 'p-2', 'flex', 'flex-col', 'items-start', 'justify-start'];
              if (status === 'present') classes.push('bg-emerald-600', 'text-white');
              else if (status === 'absent') classes.push('bg-rose-100');
              else if (status === 'late') classes.push('bg-amber-100');
              else if (status === 'leave') classes.push('bg-sky-100');
              else classes.push('border', 'border-border');
              return <div key={day} className={classes.join(' ')}><div className="text-sm font-medium">{day}</div>{status && <Badge variant="outline" className="mt-2 capitalize">{status}</Badge>}</div>;
            })}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead>Section</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
          {records.length === 0 ? <TableRow><TableCell colSpan={5} className="h-28 text-center text-slate-500">{loading ? "Loading attendance..." : "No attendance history for this month."}</TableCell></TableRow> : records.map((record) => <TableRow key={record._id}><TableCell>{formatDate(dateKey(record.date))}</TableCell><TableCell>{record.studentId?.userId?.name || record.studentId?.rollNumber || "-"}</TableCell><TableCell>{record.classId?.name || "-"}</TableCell><TableCell>{record.sectionId?.name || "-"}</TableCell><TableCell><Badge variant="outline" className="capitalize">{record.status}</Badge></TableCell></TableRow>)}
        </TableBody></Table>
      </section>
    </div>
  );
}
