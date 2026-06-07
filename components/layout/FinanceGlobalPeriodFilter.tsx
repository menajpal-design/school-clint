"use client";

import { useEffect, useState } from "react";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date();

export function FinanceGlobalPeriodFilter() {
  const [path, setPath] = useState("");
  const [mode, setMode] = useState("monthly");
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

  useEffect(() => {
    setPath(window.location.pathname);
    try {
      const saved = JSON.parse(localStorage.getItem("financePeriodFilter") || "{}");
      if (saved.mode) setMode(saved.mode);
      if (saved.month) setMonth(saved.month);
      if (saved.year) setYear(saved.year);
      if (saved.startDate) setStartDate(saved.startDate);
      if (saved.endDate) setEndDate(saved.endDate);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("financePeriodFilter", JSON.stringify({ mode, month, year, startDate, endDate })); } catch {}
  }, [mode, month, year, startDate, endDate]);

  if (!path.startsWith("/finance")) return null;

  return <div className="mx-auto mt-20 w-full max-w-[1600px] px-3 md:px-6">
    <section className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
      <div className="mb-3 font-semibold text-blue-950">Finance Period Filter</div>
      <div className="grid gap-3 md:grid-cols-6">
        <label className="space-y-1"><span className="text-xs font-bold uppercase text-blue-900">Type</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={mode} onChange={(e) => setMode(e.target.value)}><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="custom">Selected Date</option></select></label>
        <label className="space-y-1"><span className="text-xs font-bold uppercase text-blue-900">Month</span><select disabled={mode !== "monthly"} className="h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{months.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}</select></label>
        <label className="space-y-1"><span className="text-xs font-bold uppercase text-blue-900">Year</span><input className="h-10 w-full rounded-md border px-3 text-sm" type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        <label className="space-y-1"><span className="text-xs font-bold uppercase text-blue-900">Start Date</span><input disabled={mode !== "custom"} className="h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></label>
        <label className="space-y-1"><span className="text-xs font-bold uppercase text-blue-900">End Date</span><input disabled={mode !== "custom"} className="h-10 w-full rounded-md border px-3 text-sm disabled:opacity-50" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></label>
        <div className="flex items-end"><button className="h-10 w-full rounded-md bg-blue-700 px-4 text-sm font-bold text-white" onClick={() => window.location.reload()}>Apply</button></div>
      </div>
    </section>
  </div>;
}
