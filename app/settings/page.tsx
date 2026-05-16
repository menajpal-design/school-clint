"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Save, Settings as SettingsIcon } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AttendanceSettings,
  HolidaySettings,
  getAttendanceSettings,
  getClosureDaysCount,
  getHolidaySettings,
  getPreferredCurrency,
  setAttendanceSettings,
  setHolidaySettings,
  setPreferredCurrency,
} from "@/lib/utils";

const weekDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function SettingsPage() {
  return (
    <RoleGuard
      roles={["head"]}
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Only Head role can access school settings.</div>}
    >
      <HeadSettings />
    </RoleGuard>
  );
}

function HeadSettings() {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(() => getPreferredCurrency());
  const [attendance, setAttendance] = useState<AttendanceSettings>(() => getAttendanceSettings());
  const [holiday, setHoliday] = useState<HolidaySettings>(() => getHolidaySettings());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCurrency(getPreferredCurrency());
    setAttendance(getAttendanceSettings());
    setHoliday(getHolidaySettings());
  }, []);

  const closureDays = useMemo(() => getClosureDaysCount(holiday.closureStartDate, holiday.closureEndDate), [holiday.closureStartDate, holiday.closureEndDate]);

  const saveCurrency = () => {
    setPreferredCurrency(currency);
    setMessage("Currency preference saved.");
  };

  const saveAttendance = () => {
    setAttendanceSettings(attendance);
    setMessage("Attendance settings saved.");
  };

  const saveHoliday = () => {
    setHolidaySettings(holiday);
    setMessage("Holiday and closure settings saved.");
  };

  const toggleWeeklyDay = (day: string) => {
    setHoliday((current) => ({
      ...current,
      weeklyClosedDays: current.weeklyClosedDays.includes(day)
        ? current.weeklyClosedDays.filter((item) => item !== day)
        : [...current.weeklyClosedDays, day],
    }));
  };

  return (
    <div className="space-y-5 p-3 md:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><SettingsIcon className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Head Settings</h1>
            <p className="text-sm text-muted-foreground">Only the Head can control school-wide settings, weekly holidays and closure periods.</p>
          </div>
        </div>
        {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      </div>

      <div className="grid max-w-5xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Holiday & Closure Settings</CardTitle>
            <CardDescription>Set weekly closed days and date range for special closure. These settings are saved for the school app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <label className="flex items-center gap-2 rounded-lg border p-3">
              <input type="checkbox" checked={holiday.enabled} onChange={(e) => setHoliday({ ...holiday, enabled: e.target.checked })} />
              <span className="text-sm font-medium">Enable holiday/closure rules</span>
            </label>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarX2 className="h-4 w-4" /> Weekly Closed Days</div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                {weekDays.map((day) => (
                  <label key={day} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${holiday.weeklyClosedDays.includes(day) ? "border-primary bg-primary/5" : "border-border"}`}>
                    <input type="checkbox" checked={holiday.weeklyClosedDays.includes(day)} onChange={() => toggleWeeklyDay(day)} />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Closure Start Date</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={holiday.closureStartDate} onChange={(e) => setHoliday({ ...holiday, closureStartDate: e.target.value })} />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Closure End Date</span>
                <input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type="date" value={holiday.closureEndDate} onChange={(e) => setHoliday({ ...holiday, closureEndDate: e.target.value })} />
              </label>
            </div>

            <label className="space-y-2 block">
              <span className="text-sm font-medium">Closure Reason</span>
              <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={holiday.closureReason} onChange={(e) => setHoliday({ ...holiday, closureReason: e.target.value })} placeholder="Example: Eid vacation, emergency closure, public holiday..." />
            </label>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Total closure period: <strong>{closureDays}</strong> day{closureDays === 1 ? "" : "s"}. Weekly closed days: <strong>{holiday.weeklyClosedDays.join(", ") || "None"}</strong>
            </div>

            <Button onClick={saveHoliday} className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4" />Save holiday settings</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Choose display currency for finance pages. Default is Bangladeshi Taka (৳).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="radio" name="currency" value="BDT" checked={currency === 'BDT'} onChange={() => setCurrency('BDT')} />
                <span>BDT (৳)</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="radio" name="currency" value="USD" checked={currency === 'USD'} onChange={() => setCurrency('USD')} />
                <span>USD ($)</span>
              </label>
            </div>
            <div className="mt-4"><Button onClick={saveCurrency}>Save preference</Button></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance</CardTitle>
            <CardDescription>Preferences for attendance reports and exports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Default Type</label>
                <select className="mt-1 w-full rounded border p-2 md:w-auto" value={attendance.defaultType} onChange={(e) => setAttendance({ ...attendance, defaultType: e.target.value as any })}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="all">All</option>
                </select>
              </div>

              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="checkbox" checked={attendance.includeHeadAsTeacher} onChange={(e) => setAttendance({ ...attendance, includeHeadAsTeacher: e.target.checked })} />
                <span className="text-sm">Treat Head/Assistant as Teacher in reports</span>
              </label>

              <div>
                <label className="block text-sm font-medium">Default Date Range</label>
                <select className="mt-1 w-full rounded border p-2 md:w-auto" value={attendance.defaultDateRange} onChange={(e) => setAttendance({ ...attendance, defaultDateRange: e.target.value as any })}>
                  <option value="month">This Month</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Export Defaults</label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-4">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={attendance.exportCsv} onChange={(e) => setAttendance({ ...attendance, exportCsv: e.target.checked })} /> <span>CSV</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={attendance.exportPdf} onChange={(e) => setAttendance({ ...attendance, exportPdf: e.target.checked })} /> <span>PDF</span></label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Print Columns</label>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {['Name', 'Roll', 'Class', 'Section', 'Total', 'Present', 'Absent', 'Late', 'Leave'].map((col) => (
                    <label key={col} className="flex items-center gap-2 rounded border p-2">
                      <input type="checkbox" checked={attendance.printColumns.includes(col)} onChange={(e) => {
                        const next = e.target.checked ? [...attendance.printColumns, col] : attendance.printColumns.filter((c) => c !== col);
                        setAttendance({ ...attendance, printColumns: next });
                      }} />
                      <span className="text-sm">{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button onClick={saveAttendance}>Save attendance settings</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}