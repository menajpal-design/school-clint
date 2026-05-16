"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPreferredCurrency, setPreferredCurrency, getAttendanceSettings, setAttendanceSettings, AttendanceSettings } from "@/lib/utils";

export default function SettingsPage() {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(() => getPreferredCurrency());
  useEffect(() => setCurrency(getPreferredCurrency()), []);

  const [attendance, setAttendance] = useState<AttendanceSettings>(() => getAttendanceSettings());

  const save = () => {
    setPreferredCurrency(currency);
    // small feedback could be added later
  };

  const saveAttendance = () => {
    setAttendanceSettings(attendance);
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize application preferences.</p>
      </div>

      <div className="mt-6 grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Choose display currency for finance pages. Default is Bangladeshi Taka (৳).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="currency" value="BDT" checked={currency === 'BDT'} onChange={() => setCurrency('BDT')} />
                <span>BDT (৳)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="currency" value="USD" checked={currency === 'USD'} onChange={() => setCurrency('USD')} />
                <span>USD ($)</span>
              </label>
            </div>
            <div className="mt-4">
              <Button onClick={save}>Save preference</Button>
            </div>
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
                <select className="mt-1 rounded border p-2" value={attendance.defaultType} onChange={(e) => setAttendance({ ...attendance, defaultType: e.target.value as any })}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="staff">Staff</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={attendance.includeHeadAsTeacher} onChange={(e) => setAttendance({ ...attendance, includeHeadAsTeacher: e.target.checked })} />
                  <span className="text-sm">Treat Head/Assistant as Teacher in reports</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium">Default Date Range</label>
                <select className="mt-1 rounded border p-2" value={attendance.defaultDateRange} onChange={(e) => setAttendance({ ...attendance, defaultDateRange: e.target.value as any })}>
                  <option value="month">This Month</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Export Defaults</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={attendance.exportCsv} onChange={(e) => setAttendance({ ...attendance, exportCsv: e.target.checked })} /> <span>CSV</span></label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={attendance.exportPdf} onChange={(e) => setAttendance({ ...attendance, exportPdf: e.target.checked })} /> <span>PDF</span></label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Print Columns</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {['Name', 'Roll', 'Class', 'Section', 'Total', 'Present', 'Absent', 'Late', 'Leave'].map((col) => (
                    <label key={col} className="flex items-center gap-2">
                      <input type="checkbox" checked={attendance.printColumns.includes(col)} onChange={(e) => {
                        const next = e.target.checked ? [...attendance.printColumns, col] : attendance.printColumns.filter((c) => c !== col);
                        setAttendance({ ...attendance, printColumns: next });
                      }} />
                      <span className="text-sm">{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <Button onClick={saveAttendance}>Save attendance settings</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
