"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { normalizeUserRole } from "@/lib/permissions";
import { api, apiClient } from "@/lib/api";
import { cn, getAppControlSettings, getHolidaySettings } from "@/lib/utils";

type Mode = "month" | "year";
type Status = "present" | "absent" | "late" | "leave" | "";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  person: { id: string; name: string; roll?: string; className?: string; section?: string; userType: "student" | "teacher" | "staff"; dbStudentId?: string; dbUserId?: string; dbClassId?: string; dbSectionId?: string } | null;
  onAttendanceUpdated?: () => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_INDEX: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
const cleanId = (id: string) => String(id || "").replace(/^(student:|user:|teacher:|staff:|user-|student-)/g, "");
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dateOnly = (value: any) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date(value);
};
const monthStart = (year: number, month: number) => `${year}-${String(month + 1).padStart(2, "0")}-01`;
const monthEnd = (year: number, month: number) => iso(new Date(year, month + 1, 0));
const yearStart = (year: number) => `${year}-01-01`;
const yearEnd = (year: number) => `${year}-12-31`;
const validHex = (v: any) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(v || ""));
const hexToRgba = (hex: string, alpha = 0.48) => {
  const raw = String(hex || "").replace("#", "");
  const full = raw.length === 3 ? raw.split("").map((c) => c + c).join("") : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) return "";
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const normalizeWeeklyDays = (apiDays: any) => {
  const api = Array.isArray(apiDays) ? apiDays.map(Number).filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
  if (api.length) return api;
  return (getHolidaySettings().weeklyClosedDays || []).map((day) => DAY_INDEX[day]).filter((d) => Number.isInteger(d));
};
const within = (date: string, start: string, end: string) => date >= start && date <= end;

export function AttendanceCalendarDialogV5({ isOpen, onClose, person, onAttendanceUpdated }: Props) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const configured = getAppControlSettings();
  const holidaySettings = useMemo(() => getHolidaySettings(), [isOpen]);
  const statusColors: Record<string, string> = {
    present: configured.presentColor || "#bbf7d0",
    absent: configured.absentColor || "#fecaca",
    late: (configured as any).lateColor || "#fef3c7",
    leave: configured.leaveColor || "#bae6fd",
  };

  const [mode, setMode] = useState<Mode>("month");
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [records, setRecords] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [weeklyDays, setWeeklyDays] = useState<number[]>(normalizeWeeklyDays([]));
  const [weeklyColor, setWeeklyColor] = useState(configured.weekendColor || "#ddd6fe");
  const [loading, setLoading] = useState(false);
  const [updatingDate, setUpdatingDate] = useState<string | null>(null);

  const role = normalizeUserRole(user?.role);
  const canMark = Boolean(role && ["admin", "super_admin", "head", "assistant_head", "class_teacher"].includes(role));
  const years = useMemo(() => Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 3 + i), []);
  const selectedStart = mode === "year" ? yearStart(currentYear) : monthStart(currentYear, currentMonth);
  const selectedEnd = mode === "year" ? yearEnd(currentYear) : monthEnd(currentYear, currentMonth);
  const selectedMonthStart = monthStart(currentYear, currentMonth);
  const selectedMonthEnd = monthEnd(currentYear, currentMonth);

  const fetchAttendance = useCallback(async () => {
    if (!person) return;
    setLoading(true);
    try {
      const params = { startDate: yearStart(currentYear), endDate: yearEnd(currentYear) };
      const data: any = person.userType === "student"
        ? await apiClient.get(`/attendance/student/${cleanId(person.dbStudentId || person.id)}`, { params })
        : await apiClient.get(`/attendance/person/${person.userType}/${cleanId(person.dbUserId || person.id)}`, { params });
      setRecords(data?.attendance || []);
      const holidayData: any = await apiClient.get("/holidays", { params: { year: currentYear } });
      setHolidays(holidayData?.holidays || []);
      setWeeklyDays(normalizeWeeklyDays(holidayData?.weeklyDays));
      setWeeklyColor(configured.weekendColor || (validHex(holidayData?.weeklyColor) ? String(holidayData.weeklyColor) : "#ddd6fe"));
    } catch (error: any) {
      addToast({ title: "Error", message: error?.message || "Failed to load attendance history", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [person, currentYear, addToast, configured.weekendColor]);

  useEffect(() => { if (isOpen && person) fetchAttendance(); }, [isOpen, person, fetchAttendance]);

  const recordDate = (rec: any) => rec?.date ? new Date(rec.date).toISOString().slice(0, 10) : "";
  const monthRecords = useMemo(() => records.filter((r) => within(recordDate(r), selectedMonthStart, selectedMonthEnd)), [records, selectedMonthStart, selectedMonthEnd]);
  const yearRecords = useMemo(() => records.filter((r) => within(recordDate(r), yearStart(currentYear), yearEnd(currentYear))), [records, currentYear]);
  const periodRecords = useMemo(() => records.filter((r) => within(recordDate(r), selectedStart, selectedEnd)), [records, selectedStart, selectedEnd]);
  const monthlyPresent = monthRecords.filter((r) => r.status === "present").length;
  const yearlyPresent = yearRecords.filter((r) => r.status === "present").length;

  const recordsMap = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((rec) => { const d = recordDate(rec); if (d) map.set(d, rec.status); });
    return map;
  }, [records]);

  const holidayMap = useMemo(() => {
    const map = new Map<string, any>();
    holidays.forEach((h) => {
      if (h.type === "weekend") return;
      const start = dateOnly(h.startDate);
      const end = dateOnly(h.endDate || h.startDate);
      for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
        const key = iso(d);
        const color = h.type === "weekend"
          ? (configured.weekendColor || weeklyColor)
          : (h.isSchoolClosed ? (configured.closureColor || "#fed7aa") : h.color || configured.closureColor || "#fed7aa");
        map.set(key, { ...h, color });
      }
    });
    if (holidaySettings.enabled && holidaySettings.closureStartDate && holidaySettings.closureEndDate) {
      const start = new Date(holidaySettings.closureStartDate);
      const end = new Date(holidaySettings.closureEndDate);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end) {
        for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
          const key = iso(d);
          map.set(key, {
            title: holidaySettings.closureReason || "School Closed",
            type: "school",
            color: configured.closureColor || "#fed7aa",
            isSchoolClosed: true,
            isEnabled: true
          });
        }
      }
    }
    for (let d = new Date(currentYear, 0, 1); d <= new Date(currentYear, 11, 31); d.setDate(d.getDate() + 1)) {
      const key = iso(d);
      if (weeklyDays.includes(d.getDay())) {
        map.set(key, {
          title: "Weekly Holiday",
          type: "weekend",
          color: configured.weekendColor || weeklyColor,
          isSchoolClosed: true,
          isEnabled: true
        });
      }
    }
    return map;
  }, [holidays, weeklyDays, weeklyColor, currentYear, configured.closureColor, configured.weekendColor, holidaySettings.enabled, holidaySettings.closureStartDate, holidaySettings.closureEndDate, holidaySettings.closureReason]);

  const periodDays = useMemo(() => {
    const a = new Date(selectedStart);
    const b = new Date(selectedEnd);
    const days: string[] = [];
    for (let d = new Date(a.getFullYear(), a.getMonth(), a.getDate()); d <= b; d.setDate(d.getDate() + 1)) days.push(iso(d));
    return days;
  }, [selectedStart, selectedEnd]);

  const summary = useMemo(() => ({
    totalDays: periodDays.length,
    closedDays: periodDays.filter((d) => holidayMap.has(d)).length,
    workingDays: periodDays.filter((d) => !holidayMap.has(d)).length,
    present: periodRecords.filter((r) => r.status === "present").length,
    absent: periodRecords.filter((r) => r.status === "absent").length,
    late: periodRecords.filter((r) => r.status === "late").length,
    leave: periodRecords.filter((r) => r.status === "leave").length,
  }), [periodDays, holidayMap, periodRecords]);

  const styleFor = (holiday: any, status: Status) => {
    const color = holiday?.color || statusColors[status || ""];
    return color ? { backgroundColor: hexToRgba(color, holiday ? 0.56 : 0.48), borderColor: color, boxShadow: `inset 0 0 0 2px ${color}`, color: "#111827" } : undefined;
  };

  const monthCells = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: any[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ date: null, dayNumber: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({ date, dayNumber: day, status: recordsMap.get(date) || "", holiday: holidayMap.get(date) });
    }
    return cells;
  }, [currentMonth, currentYear, recordsMap, holidayMap]);

  const yearMonthSummary = useMemo(() => MONTHS.map((name, index) => {
    const s = monthStart(currentYear, index);
    const e = monthEnd(currentYear, index);
    const dates = periodDays.filter((d) => d >= s && d <= e);
    const rows = records.filter((r) => within(recordDate(r), s, e));
    return { name, index, total: dates.length, working: dates.filter((d) => !holidayMap.has(d)).length, present: rows.filter((r) => r.status === "present").length, absent: rows.filter((r) => r.status === "absent").length, late: rows.filter((r) => r.status === "late").length, leave: rows.filter((r) => r.status === "leave").length };
  }), [currentYear, periodDays, records, holidayMap]);

  const mark = async (dateStr: string, status: Status) => {
    if (!person || !status || holidayMap.has(dateStr)) return;
    setUpdatingDate(dateStr);
    try {
      await api.attendance.mark({ date: dateStr, records: [person.userType === "student" ? { studentId: cleanId(person.dbStudentId || person.id), userType: "student", classId: person.dbClassId, sectionId: person.dbSectionId, date: dateStr, status } : { userId: cleanId(person.dbUserId || person.id), userType: person.userType, date: dateStr, status }] });
      addToast({ title: "Success", message: `Attendance updated for ${dateStr}`, type: "success" });
      await fetchAttendance();
      onAttendanceUpdated?.();
    } catch (error: any) {
      addToast({ title: "Error", message: error?.message || "Failed to update attendance", type: "error" });
    } finally {
      setUpdatingDate(null);
    }
  };

  if (!person) return null;

  return <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent className="max-w-6xl w-[96vw] max-h-[95vh] overflow-y-auto p-6 rounded-xl bg-white text-slate-900"><DialogHeader><div className="flex items-start justify-between gap-4"><div><DialogTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" />Attendance History & Mark Calendar</DialogTitle><DialogDescription>View or mark attendance for: <b>{person.name}</b></DialogDescription></div><div className="grid min-w-[260px] grid-cols-2 gap-2"><div className="rounded-xl border bg-emerald-50 p-3 text-center"><div className="text-[11px] font-bold uppercase text-emerald-700">Monthly Total Present</div><div className="text-3xl font-extrabold text-emerald-900">{monthlyPresent}</div></div><div className="rounded-xl border bg-blue-50 p-3 text-center"><div className="text-[11px] font-bold uppercase text-blue-700">Yearly Total Present</div><div className="text-3xl font-extrabold text-blue-900">{yearlyPresent}</div></div></div></div></DialogHeader><div className="grid gap-3 rounded-lg border bg-slate-50 p-4 text-sm md:grid-cols-5"><div><span className="text-xs uppercase text-slate-400">Mode</span><Select value={mode} onValueChange={(v) => setMode(v as Mode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="month">Monthly</SelectItem><SelectItem value="year">Yearly</SelectItem></SelectContent></Select></div><div><span className="text-xs uppercase text-slate-400">Month</span><Select value={String(currentMonth)} disabled={mode === "year"} onValueChange={(v) => setCurrentMonth(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{MONTHS.map((m, i) => <SelectItem key={m} value={String(i)}>{m}</SelectItem>)}</SelectContent></Select></div><div><span className="text-xs uppercase text-slate-400">Year</span><Select value={String(currentYear)} onValueChange={(v) => setCurrentYear(Number(v))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent></Select></div><div><span className="text-xs uppercase text-slate-400">Roll/ID</span><div className="font-semibold">{person.roll || person.id}</div></div><div><span className="text-xs uppercase text-slate-400">Class/Section</span><div className="font-semibold">{person.className || "-"} {person.section ? `· ${person.section}` : ""}</div></div></div><div className="grid gap-3 md:grid-cols-7">{Object.entries({ "Total days": summary.totalDays, Working: summary.workingDays, Closed: summary.closedDays, Present: summary.present, Absent: summary.absent, Late: summary.late, Leave: summary.leave }).map(([k, v]) => <div key={k} className="rounded-lg border p-3"><div className="text-xs uppercase text-slate-400">{k}</div><div className="text-xl font-bold">{v}</div></div>)}</div>{mode === "year" ? <div className="grid gap-3 md:grid-cols-3">{yearMonthSummary.map((m) => <button key={m.name} className="rounded-lg border p-4 text-left hover:bg-slate-50" onClick={() => { setMode("month"); setCurrentMonth(m.index); }}><div className="font-bold">{m.name}</div><div className="mt-2 grid grid-cols-2 gap-1 text-sm"><span>Total {m.total}</span><span>Work {m.working}</span><span>Present {m.present}</span><span>Absent {m.absent}</span><span>Late {m.late}</span><span>Leave {m.leave}</span></div></button>)}</div> : <><div className="flex items-center justify-between"><Button variant="outline" onClick={() => currentMonth === 0 ? (setCurrentMonth(11), setCurrentYear((y) => y - 1)) : setCurrentMonth((m) => m - 1)}><ChevronLeft className="h-4 w-4" />Prev</Button><div className="text-lg font-bold">{MONTHS[currentMonth]} {currentYear}</div><Button variant="outline" onClick={() => currentMonth === 11 ? (setCurrentMonth(0), setCurrentYear((y) => y + 1)) : setCurrentMonth((m) => m + 1)}>Next<ChevronRight className="h-4 w-4" /></Button></div><div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d}>{d}</div>)}</div><div className="grid grid-cols-7 gap-2">{monthCells.map((cell, index) => <div key={cell.date || index} style={styleFor(cell.holiday, cell.status)} className={cn("min-h-24 rounded-lg border p-2 text-sm", (cell.holiday || cell.status) ? "shadow-sm" : "bg-white")}><div className="mb-1 flex items-center justify-between"><b>{cell.dayNumber || ""}</b>{cell.holiday ? <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-slate-900" style={{ backgroundColor: cell.holiday.color || weeklyColor }}>Off</span> : cell.status ? <span className="rounded px-1.5 py-0.5 text-[10px] font-bold capitalize text-slate-900" style={{ backgroundColor: statusColors[cell.status] }}>{cell.status}</span> : null}</div>{cell.date && (cell.holiday ? <div className="text-xs font-semibold">{cell.holiday.title || "Weekly Holiday"}</div> : canMark ? <Select disabled={updatingDate === cell.date || loading} value={cell.status || "-"} onValueChange={(v) => mark(cell.date, v as Status)}><SelectTrigger className="h-8 bg-white/80"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="-">- Select -</SelectItem><SelectItem value="present">Present</SelectItem><SelectItem value="absent">Absent</SelectItem><SelectItem value="late">Late</SelectItem><SelectItem value="leave">Leave</SelectItem></SelectContent></Select> : <div className="capitalize">{cell.status || "-"}</div>)}</div>)}</div></>}</DialogContent></Dialog>;
}
