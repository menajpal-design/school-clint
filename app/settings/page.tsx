"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarX2, Database, Palette, RefreshCw, Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
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
  mongodbUsedMb: "",
};

const emptyStorageStatus = {
  primaryMongo: { connected: false, status: "unknown", message: "Not checked yet." },
  configuredMongo: { connected: false, status: "unknown", message: "Not checked yet.", usedMb: 0, warning: false, warningAtMb: 475 },
  imageStorage: { provider: 'gridfs', fileCount: 0, totalMb: 0, warning: false, status: 'unknown', message: 'Not checked yet.' },
  mongodbUris: [],
  warningLimits: { mongoMb: 475, gridfsWarningMb: 400 },
  checkedAt: "",
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
  const [storageStatus, setStorageStatus] = useState<any>(emptyStorageStatus);
  const [checkingStorage, setCheckingStorage] = useState(false);
  const [hasMongoUrl, setHasMongoUrl] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  const closureDays = useMemo(() => getClosureDaysCount(holiday.closureStartDate, holiday.closureEndDate), [holiday.closureStartDate, holiday.closureEndDate]);

  const loadStorageStatus = async () => {
    setCheckingStorage(true);
    try {
      const status: any = await apiClient.get("/site-settings/storage-status");
      setStorageStatus({ ...emptyStorageStatus, ...status });
    } catch (err: any) {
      setStorageStatus({ ...emptyStorageStatus, configuredMongo: { connected: false, status: "error", message: err?.message || "Storage status check failed." } });
    } finally {
      setCheckingStorage(false);
    }
  };

  const loadServerSettings = async () => {
    setError("");
    try {
      const [site, controls] = await Promise.all([
        apiClient.get("/site-settings/site-config") as Promise<any>,
        apiClient.get("/site-settings/app-controls") as Promise<any>,
      ]);
      setSiteConfig({ ...emptySiteConfig, ...(site.config || {}), mongodbUrl: "" });
      setHasMongoUrl(Boolean(site.hasMongoUrl));
      if (controls.settings && Object.keys(controls.settings).length) {
        const merged = { ...getAppControlSettings(), ...controls.settings };
        setAppControl(merged);
        setAppControlSettings(merged);
      }
      await loadStorageStatus();
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
    const handler = (e: any) => {
      try {
        const id = e?.detail?.id;
        if (!id) return;
        setSiteConfig((current: any) => ({ ...current, activeMongoId: id }));
        // small timeout to ensure state updated before saving
        setTimeout(() => { saveSiteConfig(); }, 150);
      } catch (err) { /* ignore */ }
    };
    window.addEventListener('make-active-mongo', handler as any);
    return () => window.removeEventListener('make-active-mongo', handler as any);
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
    setSiteConfig({ ...emptySiteConfig, ...(data.config || {}), mongodbUrl: "" });
    setHasMongoUrl(Boolean(data.hasMongoUrl));
    await loadStorageStatus();
  }, "Site config saved.");

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

  const mongoWarning = storageStatus?.configuredMongo?.warning;
  const gridfsWarning = storageStatus?.imageStorage?.warning;

  return (
    <div className="space-y-5 p-3 md:p-6">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><SettingsIcon className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Head Settings</h1>
            <p className="text-sm text-muted-foreground">New MongoDB URI add করলে old URI delete হবে না; history list-এ থাকবে। Images এখন MongoDB GridFS-এ store হচ্ছে।</p>
          </div>
        </div>
        {message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      </div>

      <div className="grid max-w-5xl gap-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Storage Connection Status</CardTitle>
                <CardDescription>MongoDB connected হলে green dot। Images MongoDB GridFS-এ store হচ্ছে — no external API key needed।</CardDescription>
              </div>
              <Button variant="outline" onClick={loadStorageStatus} disabled={checkingStorage}><RefreshCw className={`mr-2 h-4 w-4 ${checkingStorage ? 'animate-spin' : ''}`} />Refresh</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusBox title="Primary Server MongoDB" item={storageStatus.primaryMongo} />
              <StatusBox title="Active MongoDB URI" item={storageStatus.configuredMongo} />
              <GridFSStatusBox item={storageStatus.imageStorage} />
            </div>
            {(mongoWarning || gridfsWarning) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Storage warning</div>
                {mongoWarning && <div className="mt-1">MongoDB data is {storageStatus.configuredMongo.usedMb}MB. Near free limit — add a new MongoDB URI. Old URI will remain listed for old data.</div>}
                {gridfsWarning && <div className="mt-1">GridFS images are {storageStatus.imageStorage?.totalMb}MB. Consider archiving old images.</div>}
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <HistoryList title="MongoDB URI History" items={storageStatus.mongodbUris || siteConfig.mongodbUris || []} type="mongo" warningAt={storageStatus.warningLimits?.mongoMb || 475} />
              <div className="rounded-xl border p-4">
                <div className="mb-3 font-semibold">Image Storage</div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <div className="font-semibold">✅ MongoDB GridFS</div>
                  <div className="mt-1">Files: {storageStatus.imageStorage?.fileCount ?? 0} images</div>
                  <div>Used: {storageStatus.imageStorage?.totalMb ?? 0}MB</div>
                  <div className="mt-2 text-xs">Images serve via <code>/api/images/:id</code></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Last checked: {storageStatus.checkedAt ? new Date(storageStatus.checkedAt).toLocaleString() : 'Not checked yet'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />Add New Storage Config</CardTitle>
            <CardDescription>New URI/key দিলে সেটা active হবে, কিন্তু old URI/key delete হবে না। Old data access history হিসেবে থাকবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="App Base URL" value={siteConfig.appBaseUrl} onChange={(value) => setSiteConfig({ ...siteConfig, appBaseUrl: value })} />
              <TextField label="API Base URL" value={siteConfig.apiBaseUrl} onChange={(value) => setSiteConfig({ ...siteConfig, apiBaseUrl: value })} />
              <TextField label={hasMongoUrl ? "Add new MongoDB URI (old URI will stay listed)" : "MongoDB URI"} type="password" value={siteConfig.mongodbUrl} onChange={(value) => setSiteConfig({ ...siteConfig, mongodbUrl: value })} placeholder="mongodb+srv://..." />
              <CheckField label="Allow personal MongoDB fallback when central storage unavailable" checked={Boolean(siteConfig.allowPersonalMongo)} onChange={(checked) => setSiteConfig({ ...siteConfig, allowPersonalMongo: checked })} />
              <CheckField label="Allow personal storage (alternate flag)" checked={Boolean(siteConfig.allowPersonalStorage)} onChange={(checked) => setSiteConfig({ ...siteConfig, allowPersonalStorage: checked })} />
              <TextField label="MongoDB used MB (optional manual update)" type="number" value={String(siteConfig.mongodbUsedMb || '')} onChange={(value) => setSiteConfig({ ...siteConfig, mongodbUsedMb: value })} placeholder="475" />
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">✅ Images are stored in MongoDB GridFS — no ImgBB API key needed.</div>
            <Button onClick={saveSiteConfig} disabled={saving === "site"}><Save className="mr-2 h-4 w-4" />{saving === "site" ? "Saving..." : "Save / Add storage config"}</Button>
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

function StatusBox({ title, item }: { title: string; item: any }) {
  const ok = Boolean(item?.connected);
  const warning = Boolean(item?.warning);
  return (
    <div className={`rounded-xl border p-4 ${warning ? 'border-amber-300 bg-amber-50' : ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${warning ? 'bg-amber-500' : ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
        <div className={`font-semibold ${warning ? 'text-amber-800' : ok ? 'text-emerald-800' : 'text-red-800'}`}>{title}</div>
      </div>
      <div className={`mt-2 text-xs ${warning ? 'text-amber-700' : ok ? 'text-emerald-700' : 'text-red-700'}`}>{item?.message || (ok ? 'Connected' : 'Not connected')}</div>
      {item?.usedMb !== undefined && <div className="mt-1 text-xs text-muted-foreground">Used: {item.usedMb}MB / warning at {item.warningAtMb || '-'}MB</div>}
      <div className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{item?.status || 'unknown'}</div>
    </div>
  );
}

function GridFSStatusBox({ item }: { item: any }) {
  const warning = Boolean(item?.warning);
  return (
    <div className={`rounded-xl border p-4 ${warning ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${warning ? 'bg-amber-500' : 'bg-blue-500'}`} />
        <div className={`font-semibold ${warning ? 'text-amber-800' : 'text-blue-800'}`}>Image Storage (GridFS)</div>
      </div>
      <div className={`mt-2 text-xs ${warning ? 'text-amber-700' : 'text-blue-700'}`}>{item?.message || 'MongoDB GridFS active'}</div>
      <div className="mt-1 text-xs text-muted-foreground">{item?.fileCount ?? 0} files · {item?.totalMb ?? 0}MB used</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-blue-600">self-hosted · no api key</div>
    </div>
  );
}


function HistoryList({ title, items, type, warningAt }: { title: string; items: any[]; type: 'mongo' | 'imgbb'; warningAt: number }) {
  // Placeholder: will receive makeActive callback via props if needed
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-3 font-semibold">{title}</div>
      <div className="space-y-2">
        {items?.map((item) => (
          <div key={item.id} className={`rounded-lg border p-3 text-sm ${item.warning ? 'border-amber-300 bg-amber-50' : item.isActive ? 'border-emerald-200 bg-emerald-50' : 'bg-muted/30'}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-medium">{item.label || item.id}</div>
              <div className="flex gap-2">
                {item.isActive && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Active</span>}
                {item.warning && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Warning</span>}
              </div>
            </div>
            <div className="mt-1 break-all text-xs text-muted-foreground">{type === 'mongo' ? item.uri : item.apiKey}</div>
            <div className="mt-1 text-xs text-muted-foreground">Used: {Number(item.usedMb || 0)}MB / warning at {warningAt}MB</div>
            <div className="mt-1 text-xs text-muted-foreground">Added: {item.addedAt ? new Date(item.addedAt).toLocaleString() : 'N/A'}</div>
            {item.note && <div className="mt-1 text-xs text-muted-foreground">{item.note}</div>}
            {!item.isActive && type === 'mongo' && (
              <div className="mt-2">
                <button className="rounded bg-primary px-3 py-1 text-xs text-white" onClick={() => window.dispatchEvent(new CustomEvent('make-active-mongo', { detail: { id: item.id } }))}>Make active</button>
              </div>
            )}
          </div>
        ))}
        {!items?.length && <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">No history yet.</div>}
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
