"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { getHolidaySettings } from "@/lib/utils";

const statusClass: Record<string, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-sky-200 bg-sky-50 text-sky-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};
const weekDayName = (date: Date) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][date.getDay()];
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const monthDays = (month: string) => {
  const [year, m] = month.split("-").map(Number);
  const last = new Date(year, m, 0).getDate();
  return Array.from({ length: last }, (_, i) => new Date(year, m - 1, i + 1));
};
const inRange = (date: Date, start: string, end: string) => {
  const key = dateKey(date);
  return key >= String(start).slice(0, 10) && key <= String(end).slice(0, 10);
};

export default function LeaveListPage() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [status, setStatus] = useState("approved");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const holidaySettings = getHolidaySettings();

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [year, m] = month.split("-").map(Number);
      const startDate = `${month}-01`;
      const endDate = new Date(year, m, 0).toISOString().slice(0, 10);
      const params = new URLSearchParams({ startDate, endDate });
      if (status) params.set("status", status);
      const data = await apiClient.get(`/leaves?${params.toString()}`) as any;
      setLeaves(data.leaves || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load leave list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [month, status]);

  const days = useMemo(() => monthDays(month), [month]);
  const approvedLeaves = leaves.filter((leave) => leave.status === "approved");
  const leaveForDay = (date: Date) => approvedLeaves.filter((leave) => inRange(date, leave.startDate, leave.endDate));
  const isWeeklyClosed = (date: Date) => holidaySettings.weeklyClosedDays.includes(weekDayName(date));
  const isSpecialClosed = (date: Date) => holidaySettings.enabled && holidaySettings.closureStartDate && holidaySettings.closureEndDate && inRange(date, holidaySettings.closureStartDate, holidaySettings.closureEndDate);

  return (
    <div className="space-y-5">
      <PageHeader title="Leave List & Calendar" description="Approved leave days, weekly closed days and school closure days are shown with separate colors." icon={CalendarCheck2} status={<Badge variant="outline">{leaves.length} records</Badge>} actions={[<Button key="refresh" variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]} />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="space-y-2"><span className="text-sm font-medium">Month</span><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Status</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="approved">Approved</option><option value="pending">Pending</option><option value="rejected">Rejected</option><option value="">All</option></select></label>
          <div className="flex items-end gap-2 text-xs">
            <span className="rounded bg-sky-100 px-2 py-1 text-sky-800">Leave</span>
            <span className="rounded bg-violet-100 px-2 py-1 text-violet-800">Weekend</span>
            <span className="rounded bg-orange-100 px-2 py-1 text-orange-800">Closed</span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 shadow-sm md:p-5">
        <h2 className="mb-3 text-lg font-semibold">Monthly Calendar</h2>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500 md:gap-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day}>{day}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1 md:gap-2">
          {Array.from({ length: days[0]?.getDay() || 0 }).map((_, index) => <div key={`blank-${index}`} />)}
          {days.map((date) => {
            const dayLeaves = leaveForDay(date);
            const weekly = isWeeklyClosed(date);
            const closed = isSpecialClosed(date);
            const className = dayLeaves.length ? "border-sky-300 bg-sky-100 text-sky-900" : closed ? "border-orange-300 bg-orange-100 text-orange-900" : weekly ? "border-violet-300 bg-violet-100 text-violet-900" : "border-slate-200 bg-white text-slate-800";
            return <div key={dateKey(date)} className={`min-h-20 rounded-lg border p-2 text-xs ${className}`}>
              <div className="font-bold">{date.getDate()}</div>
              {weekly && <div className="mt-1 rounded bg-white/70 px-1">Weekend</div>}
              {closed && <div className="mt-1 rounded bg-white/70 px-1">Closed</div>}
              {dayLeaves.slice(0, 2).map((leave) => <div key={leave._id} className="mt-1 truncate rounded bg-white/80 px-1">{leave.studentId?.userId?.name || "Student"}</div>)}
              {dayLeaves.length > 2 && <div className="mt-1">+{dayLeaves.length - 2} more</div>}
            </div>;
          })}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
        <h2 className="mb-3 text-lg font-semibold">Leave Records</h2>
        {loading ? <p className="py-8 text-center text-muted-foreground">Loading...</p> : leaves.length === 0 ? <p className="py-8 text-center text-muted-foreground">No leave records found.</p> : <div className="grid gap-3">
          {leaves.map((leave) => <div key={leave._id} className="rounded-xl border bg-white p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-semibold">{leave.studentId?.userId?.name || leave.userId?.name || "Student"}</div>
                <div className="text-sm text-muted-foreground">Roll: {leave.studentId?.rollNumber || "-"} · Class: {leave.classId?.name || "-"}</div>
                <div className="mt-1 text-sm">{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()} · {leave.totalDays} day(s)</div>
                <p className="mt-2 text-sm text-slate-700">{leave.reason}</p>
              </div>
              <Badge variant="outline" className={statusClass[leave.status] || ""}>{leave.status}</Badge>
            </div>
          </div>)}
        </div>}
      </section>
    </div>
  );
}
