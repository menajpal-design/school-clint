"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, Database, Palette, Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
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

const emptySiteConfig = {
  siteName: "Easy School",
  appBaseUrl: "https://easyschool.live",
  apiBaseUrl: "https://school-server-b264c1a1fac6.herokuapp.com/api",
  mongodbUrl: "",
  imgbbApiKey: "",
  imgbbUploadUrl: "https://api.imgbb.com/1/upload",
};

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
  const [siteConfig, setSiteConfig] = useState<any>(emptySiteConfig);
  const [hasMongoUrl, setHasMongoUrl] = useState(false);
  const [hasImgbbKey, setHasImgbbKey] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const closureDays = useMemo(() => getClosureDaysCount(holiday.closureStartDate, holiday.closureEndDate), [holiday.closureStartDate, holiday.closureEndDate]);

  const loadServerSettings = async () => {
    setError("");
    try {
      const [site, controls] = await Promise.all([
        apiClient.get("/site-settings/site-config") as Promise<any>,
        apiClient.get("/site-settings/app-controls") as Promise<any>,
      ]);
      setSiteConfig({ ...emptySiteConfig, ...(site.config || {}) });
      setHasMongoUrl(Boolean(site.hasMongoUrl));
      setHasImgbbKey(Boolean(site.hasImgbbKey));
      if (controls.settings && Object.keys(controls.settings).length) {
        const merged = { ...getAppControlSettings(), ...controls.settings };
        setAppControl(merged);
        setAppControlSettings(merged);
      }
    } catch (err: any) {
      setError(err?.message || "Server settings could not be loaded. Local fallback is showing.");
    }
  };

  useEffect(() => {
    setCurrency(getPreferredCurrency());
    setAttendance(getAttendanceSettings());
    setHoliday(getHolidaySettings());
    setAppControl(getAppControlSettings());
    loadServerSettings();
  }, []);

  const runSave = async (key: string, fn: () => Promise<void> | void, ok: string) => {
    setSaving(key);
    setMessage("");
    setError("");
    try {
      await fn();
      setMessage(ok);
    } catch (err: any) {
      setError(err?.message || "Save failed.");
    } finally {
      setSaving("");
    }
  };

  const saveSiteConfig = () => runSave("site", async () => {
    const data: any = await apiClient.put("/site-settings/site-config", siteConfig);
    setSiteConfig({ ...emptySiteConfig, ...(data.config || {}) });
    setHasMongoUrl(Boolean(data.hasMongoUrl));
    setHasImgbbKey(Boolean(data.hasImgbbKey));
  }, "Site config saved to MongoDB.");

  const saveCurrency = () => runSave("currency", () => setPreferredCurrency(currency), "Currency preference saved.");
  const saveAttendance = () => runSave("attendance", () => setAttendanceSettings(attendance), "Attendance settings saved.");
  const saveHoliday = () => runSave("holiday", () => setHolidaySettings(holiday), "Holiday and closure settings saved.");
  const saveAppControl = () => runSave("controls", async () => {
    setAppControlSettings(appControl);
    await apiClient.put("/site-settings/app-controls", appControl);
  }, "App control settings saved to MongoDB.");

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
            <p className="text-sm text-muted-foreground">Site config saves in MongoDB, not only browser storage.</p>
          </div>
        </div>
        {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      <div className="grid max-w-5xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Site Run Config</CardTitle>
            <CardDescription>MongoDB URL and ImgBB key are saved in server MongoDB site settings. These are not school/institution profile data.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Site Name" value={siteConfig.siteName} onChange={(value) => setSiteConfig({ ...siteConfig, siteName: value })} />
              <TextField label="App Base URL" value={siteConfig.appBaseUrl} onChange={(value) => setSiteConfig({ ...siteConfig, appBaseUrl: value })} />
              <TextField label="API Base URL" value={siteConfig.apiBaseUrl} onChange={(value) => setSiteConfig({ ...siteConfig, apiBaseUrl: value })} />
              <TextField label="ImgBB Upload URL" value={siteConfig.imgbbUploadUrl} onChange={(value) => setSiteConfig({ ...siteConfig, imgbbUploadUrl: value })} />
              <TextField label={hasMongoUrl ? "MongoDB URL saved — enter new value to replace" : "MongoDB URL"} type="password" value={siteConfig.mongodbUrl} onChange={(value) => setSiteConfig({ ...siteConfig, mongodbUrl: value })} placeholder={hasMongoUrl ? "********" : "mongodb+srv://..."} />
              <TextField label={hasImgbbKey ? "ImgBB API Key saved — enter new value to replace" : "ImgBB API Key"} type="password" value={siteConfig.imgbbApiKey} onChange={(value) => setSiteConfig({ ...siteConfig, imgbbApiKey: value })} placeholder={hasImgbbKey ? "********" : "ImgBB key"} />
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">For security, saved MongoDB URL and ImgBB key are masked after reload.</div>
            <Button onClick={saveSiteConfig} disabled={saving === "site"}><Save className="mr-2 h-4 w-4" />{saving === "site" ? "Saving..." : "Save site config to MongoDB"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>School Holiday & Closure Settings</CardTitle><CardDescription>Set weekly closed days and date range for special closure.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <label className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={holiday.enabled} onChange={(e) => setHoliday({ ...holiday, enabled: e.target.checked })} /><span className="text-sm font-medium">Enable holiday/closure rules</span></label>
            <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarX2 className="h-4 w-4" /> Weekly Closed Days</div><div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">{weekDays.map((day) => <label key={day} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${holiday.weeklyClosedDays.includes(day) ? "border-primary bg-primary/5" : "border-border"}`}><input type="checkbox" checked={holiday.weeklyClosedDays.includes(day)} onChange={() => toggleWeeklyDay(day)} /><span>{day}</span></label>)}</div></div>
            <div className="grid gap-4 md:grid-cols-2"><TextField label="Closure Start Date" type="date" value={holiday.closureStartDate} onChange={(value) => setHoliday({ ...holiday, closureStartDate: value })} /><TextField label="Closure End Date" type="date" value={holiday.closureEndDate} onChange={(value) => setHoliday({ ...holiday, closureEndDate: value })} /></div>
            <label className="block space-y-2"><span className="text-sm font-medium">Closure Reason</span><textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={holiday.closureReason} onChange={(e) => setHoliday({ ...holiday, closureReason: e.target.value })} /></label>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">Total closure period: <strong>{closureDays}</strong> day(s). Weekly closed days: <strong>{holiday.weeklyClosedDays.join(", ") || "None"}</strong></div>
            <Button onClick={saveHoliday} disabled={saving === "holiday"}><Save className="mr-2 h-4 w-4" />{saving === "holiday" ? "Saving..." : "Save holiday settings"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Approval & Workflow Controls</CardTitle><CardDescription>These controls save to MongoDB and also cache locally.</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <CheckField label="Auto publish class routine after approval" checked={appControl.routineAutoPublishAfterApproval} onChange={(checked) => setAppControl({ ...appControl, routineAutoPublishAfterApproval: checked })} />
              <CheckField label="Show teacher name in routine PDF" checked={appControl.routinePdfIncludeTeacherName} onChange={(checked) => setAppControl({ ...appControl, routinePdfIncludeTeacherName: checked })} />
              <CheckField label="Require assistant review before Head approval" checked={appControl.routineRequireAssistantApproval} onChange={(checked) => setAppControl({ ...appControl, routineRequireAssistantApproval: checked })} />
              <CheckField label="Approved leave auto marks attendance as Leave" checked={appControl.leaveAutoMarkAttendance} onChange={(checked) => setAppControl({ ...appControl, leaveAutoMarkAttendance: checked })} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="SMS log retention days" type="number" value={String(appControl.smsLogRetentionDays)} onChange={(value) => setAppControl({ ...appControl, smsLogRetentionDays: Number(value) || 30 })} />
              <TextField label="SMS usage warning %" type="number" value={String(appControl.smsWarnAtPercent)} onChange={(value) => setAppControl({ ...appControl, smsWarnAtPercent: Number(value) || 80 })} />
              <label className="space-y-2"><span className="text-sm font-medium">Mobile print mode</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={appControl.mobilePrintMode} onChange={(e) => setAppControl({ ...appControl, mobilePrintMode: e.target.value as any })}><option value="pdf">PDF download</option><option value="print">System print</option></select></label>
            </div>
            <Button onClick={saveAppControl} disabled={saving === "controls"}><Save className="mr-2 h-4 w-4" />{saving === "controls" ? "Saving..." : "Save workflow controls"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Attendance Calendar Colors</CardTitle><CardDescription>Used by leave list and attendance calendar design.</CardDescription></CardHeader>
          <CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-5"><ColorField label="Present" value={appControl.presentColor} onChange={(value) => setAppControl({ ...appControl, presentColor: value })} /><ColorField label="Absent" value={appControl.absentColor} onChange={(value) => setAppControl({ ...appControl, absentColor: value })} /><ColorField label="Leave" value={appControl.leaveColor} onChange={(value) => setAppControl({ ...appControl, leaveColor: value })} /><ColorField label="Weekend" value={appControl.weekendColor} onChange={(value) => setAppControl({ ...appControl, weekendColor: value })} /><ColorField label="Closed" value={appControl.closureColor} onChange={(value) => setAppControl({ ...appControl, closureColor: value })} /></div><Button onClick={saveAppControl} disabled={saving === "controls"}>Save colors</Button></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Currency</CardTitle><CardDescription>Choose display currency for finance pages.</CardDescription></CardHeader>
          <CardContent><div className="flex flex-col gap-3 sm:flex-row"><CheckRadio label="BDT (৳)" checked={currency === 'BDT'} onChange={() => setCurrency('BDT')} /><CheckRadio label="USD ($)" checked={currency === 'USD'} onChange={() => setCurrency('USD')} /></div><div className="mt-4"><Button onClick={saveCurrency} disabled={saving === "currency"}>Save preference</Button></div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Attendance</CardTitle><CardDescription>Preferences for attendance reports and exports.</CardDescription></CardHeader>
          <CardContent className="space-y-4"><label className="block text-sm font-medium">Default Type<select className="mt-1 w-full rounded border p-2 md:w-auto" value={attendance.defaultType} onChange={(e) => setAttendance({ ...attendance, defaultType: e.target.value as any })}><option value="student">Student</option><option value="teacher">Teacher</option><option value="staff">Staff</option><option value="all">All</option></select></label><CheckField label="Treat Head/Assistant as Teacher in reports" checked={attendance.includeHeadAsTeacher} onChange={(checked) => setAttendance({ ...attendance, includeHeadAsTeacher: checked })} /><Button onClick={saveAttendance} disabled={saving === "attendance"}>Save attendance settings</Button></CardContent>
        </Card>
      </div>
    </div>
  );
}

function TextField({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="space-y-2"><span className="text-sm font-medium">{label}</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type={type} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></label>;
}

function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="text-sm font-medium">{label}</span></label>;
}

function CheckRadio({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return <label className="flex items-center gap-2 rounded-lg border p-3"><input type="radio" checked={checked} onChange={onChange} /><span>{label}</span></label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="space-y-2 rounded-lg border p-3"><span className="block text-sm font-medium">{label}</span><div className="flex items-center gap-2"><input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border" /><input className="h-9 min-w-0 flex-1 rounded border px-2 text-xs" value={value} onChange={(e) => onChange(e.target.value)} /></div></label>;
}
