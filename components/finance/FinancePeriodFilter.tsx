"use client";

import { useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

export type FinancePeriodMode = "monthly" | "yearly" | "custom";
export type FinancePeriodState = {
  mode: FinancePeriodMode;
  month: number;
  year: number;
  startDate: string;
  endDate: string;
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => d.toISOString().slice(0, 10);

export function defaultFinancePeriod(): FinancePeriodState {
  const now = new Date();
  return {
    mode: "monthly",
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    startDate: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: iso(now),
  };
}

export function getFinancePeriodRange(period: FinancePeriodState) {
  if (period.mode === "yearly") return { startDate: `${period.year}-01-01`, endDate: `${period.year}-12-31`, label: `${period.year}` };
  if (period.mode === "custom") return { startDate: period.startDate, endDate: period.endDate, label: `${period.startDate} to ${period.endDate}` };
  const start = `${period.year}-${pad(period.month)}-01`;
  const end = iso(new Date(period.year, period.month, 0));
  return { startDate: start, endDate: end, label: `${monthNames[period.month - 1]} ${period.year}` };
}

export function isWithinFinancePeriod(dateValue: any, period: FinancePeriodState) {
  if (!dateValue) return true;
  const range = getFinancePeriodRange(period);
  const time = new Date(dateValue).getTime();
  const start = new Date(`${range.startDate}T00:00:00`).getTime();
  const end = new Date(`${range.endDate}T23:59:59`).getTime();
  if (Number.isNaN(time)) return true;
  return time >= start && time <= end;
}

export function FinancePeriodFilter({ period, onChange, onApply, className = "" }: { period: FinancePeriodState; onChange: (next: FinancePeriodState) => void; onApply?: () => void; className?: string }) {
  const range = useMemo(() => getFinancePeriodRange(period), [period]);
  const update = (patch: Partial<FinancePeriodState>) => onChange({ ...period, ...patch });
  return <section className={`rounded-lg border border-border bg-card p-4 shadow-sm ${className}`}>
    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><CalendarDays className="h-4 w-4" /> Finance Period Filter</div>
    <div className="grid gap-3 md:grid-cols-5">
      <label className="space-y-2"><span className="text-sm font-medium">Type</span><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={period.mode} onChange={(e) => update({ mode: e.target.value as FinancePeriodMode })}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Selected Date</option></select></label>
      <label className="space-y-2"><span className="text-sm font-medium">Month</span><select disabled={period.mode !== "monthly"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50" value={period.month} onChange={(e) => update({ month: Number(e.target.value) })}>{monthNames.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
      <label className="space-y-2"><span className="text-sm font-medium">Year</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="number" value={period.year} onChange={(e) => update({ year: Number(e.target.value || new Date().getFullYear()) })} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">Start Date</span><input disabled={period.mode !== "custom"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50" type="date" value={period.startDate} onChange={(e) => update({ startDate: e.target.value })} /></label>
      <label className="space-y-2"><span className="text-sm font-medium">End Date</span><input disabled={period.mode !== "custom"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50" type="date" value={period.endDate} onChange={(e) => update({ endDate: e.target.value })} /></label>
    </div>
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Active period: <b>{range.label}</b> ({range.startDate} to {range.endDate})</p>{onApply && <Button variant="outline" onClick={onApply}>Apply Filter</Button>}</div>
  </section>;
}
