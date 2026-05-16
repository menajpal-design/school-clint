"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Palette, Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AppControlSettings,
  AttendanceSettings,
  HolidaySettings,
  getAppControlSettings,
  getAttendanceSettings,
  getClosureDaysCount,
  getHolidaySettings,
  getPreferredCurrency,
  setAppControlSettings,
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
  const [appControl, setAppControl] = useState<AppControlSettings>(() => getAppControlSettings());
  const [message, setMessage] = useState("");

  useEffect(() => {
    setCurrency(getPreferredCurrency());
    setAttendance(getAttendanceSettings());
    setHoliday(getHolidaySettings());
    setAppControl(getAppControlSettings());
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

  const saveAppControl = () => {
    setAppControlSettings(appControl);
    setMessage("App control settings saved.");
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
            <p className="text-sm text-muted-foreground">Only the Head can control school-wide settings, weekly holidays, routine approval, leave colors, SMS and print preferences.</p>
          </div>
        </div>
        {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
      </div>

      <div className="grid max-w-5xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>School Holiday & Closure Settings</CardTitle>
            <CardDescription>Set weekly closed days and date range for special closure. Leave calendar and attendance calendar can use these rules.</CardDescription>
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
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Approval & Workflow Controls</CardTitle>
            <CardDescription>Control routine approval, leave attendance behavior, SMS monitoring and mobile print/table preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="checkbox" checked={appControl.routineAutoPublishAfterApproval} onChange={(e) => setAppControl({ ...appControl, routineAutoPublishAfterApproval: e.target.checked })} />
                <span className="text-sm font-medium">Auto publish class routine after Head/Assistant approval</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="checkbox" checked={appControl.routinePdfIncludeTeacherName} onChange={(e) => setAppControl({ ...appControl, routinePdfIncludeTeacherName: e.target.checked })} />
                <span className="text-sm font-medium">Show teacher name in routine PDF</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="checkbox" checked={appControl.routineRequireAssistantApproval} onChange={(e) => setAppControl({ ...appControl, routineRequireAssistantApproval: e.target.checked })} />
                <span className="text-sm font-medium">Require assistant review before Head approval</span>
              </label>
              <label className="flex items-center gap-2 rounded-lg border p-3">
                <input type="checkbox" checked={appControl.leaveAutoMarkAttendance} onChange={(e) => setAppControl({ ...appControl, leaveAutoMarkAttendance: e.target.checked })} />
                <span className="text-sm font-medium">Approved leave auto marks attendance as Leave</span>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2"><span className="text-sm font-medium">SMS log retention days</span><input className="h-10 w-full rounded-md border px-3 text-sm" type="number" min={1} value={appControl.smsLogRetentionDays} onChange={(e) => setAppControl({ ...appControl, smsLogRetentionDays: Number(e.target.value) || 30 })} /></label>
              <label className="space-y-2"><span className="text-sm font-medium">SMS usage warning %</span><input className="h-10 w-full rounded-md border px-3 text-sm" type="number" min={1} max={100} value={appControl.smsWarnAtPercent} onChange={(e) => setAppControl({ ...appControl, smsWarnAtPercent: Number(e.target.value) || 80 })} /></label>
              <label className="space-y-2"><span className="text-sm font-medium">ID card default format</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={appControl.idCardDefaultFormat} onChange={(e) => setAppControl({ ...appControl, idCardDefaultFormat: e.target.value as any })}><option value="pdf">PDF</option><option value="png">PNG</option></select></label>
              <label className="space-y-2"><span className="text-sm font-medium">Mobile table mode</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={appControl.mobileTableMode} onChange={(e) => setAppControl({ ...appControl, mobileTableMode: e.target.value as any })}><option value="card">Card</option><option value="scroll">Horizontal scroll</option></select></label>
              <label className="space-y-2"><span className="text-sm font-medium">Mobile print mode</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={appControl.mobilePrintMode} onChange={(e) => setAppControl({ ...appControl, mobilePrintMode: e.target.value as any })}><option value="pdf">PDF download</option><option value="print">System print</option></select></label>
            </div>

            <Button onClick={saveAppControl}><Save className="mr-2 h-4 w-4" />Save workflow controls</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Attendance Calendar Colors</CardTitle>
            <CardDescription>These colors are used by leave list and attendance calendar design.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-5">
              <ColorField label="Present" value={appControl.presentColor} onChange={(value) => setAppControl({ ...appControl, presentColor: value })} />
              <ColorField label="Absent" value={appControl.absentColor} onChange={(value) => setAppControl({ ...appControl, absentColor: value })} />
              <ColorField label="Leave" value={appControl.leaveColor} onChange={(value) => setAppControl({ ...appControl, leaveColor: value })} />
              <ColorField label="Weekend" value={appControl.weekendColor} onChange={(value) => setAppControl({ ...appControl, weekendColor: value })} />
              <ColorField label="School closed" value={appControl.closureColor} onChange={(value) => setAppControl({ ...appControl, closureColor: value })} />
            </div>
            <Button onClick={saveAppControl}><Save className="mr-2 h-4 w-4" />Save colors</Button>
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

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-2 rounded-lg border p-3"><span className="block text-sm font-medium">{label}</span><div className="flex items-center gap-2"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border" /><input className="h-9 min-w-0 flex-1 rounded border px-2 text-xs" value={value} onChange={(e) => onChange(e.target.value)} /></div></label>;
}