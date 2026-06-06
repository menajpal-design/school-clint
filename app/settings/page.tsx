"use client";

export const dynamic = 'force-dynamic';
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarX2, Database, MessageSquare, Palette, RefreshCw, Save, Settings as SettingsIcon, ShieldCheck, TestTube2 } from "lucide-react";
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
const weekDaysBn: Record<string, string> = {
  Saturday: "শনিবার",
  Sunday: "রবিবার",
  Monday: "সোমবার",
  Tuesday: "মঙ্গলবার",
  Wednesday: "বুধবার",
  Thursday: "বৃহস্পতিবার",
  Friday: "শুক্রবার"
};

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
      fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">শুধুমাত্র প্রধান শিক্ষকই স্কুলের সেটিংস পরিবর্তন করতে পারবেন।</div>}
    >
      <div className="space-y-6">
        <HeadSettings />
      </div>
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
  // SMS Settings
  const [smsKey, setSmsKey] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsApiUrl, setSmsApiUrl] = useState("https://anoncify.xyz/api/sms");
  const [smsKeySet, setSmsKeySet] = useState(false);
  const [smsDiagnostic, setSmsDiagnostic] = useState<any>(null);
  const [testPhone, setTestPhone] = useState("");
  const [smsTestResult, setSmsTestResult] = useState("");

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
      const [site, controls, smsSettings] = await Promise.all([
        apiClient.get("/site-settings/site-config") as Promise<any>,
        apiClient.get("/site-settings/app-controls") as Promise<any>,
        apiClient.get("/institution/sms-settings").catch(() => null) as Promise<any>,
      ]);
      setSiteConfig({ ...emptySiteConfig, ...(site.config || {}), mongodbUrl: "" });
      setHasMongoUrl(Boolean(site.hasMongoUrl));
      if (controls.settings && Object.keys(controls.settings).length) {
        const merged = { ...getAppControlSettings(), ...controls.settings };
        setAppControl(merged);
        setAppControlSettings(merged);
      }
      if (smsSettings) {
        setSmsKeySet(Boolean(smsSettings.smsApiKeySet));
        setSmsEnabled(smsSettings.smsEnabled ?? true);
        setSmsApiUrl(smsSettings.smsApiUrl || "https://anoncify.xyz/api/sms");
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

  const saveSmsSettings = () => runSave("sms", async () => {
    const payload: any = { smsEnabled, smsApiUrl };
    if (smsKey.trim()) payload.smsApiKey = smsKey.trim();
    await apiClient.post("/institution/sms-settings", payload);
    setSmsKeySet(true);
    setSmsKey("");
  }, "SMS settings saved. SMS should now work.");

  const runSmsDiagnostic = async () => {
    try {
      const result: any = await apiClient.get("/institution/sms-diagnostic");
      setSmsDiagnostic(result.diagnosis);
    } catch (err: any) {
      setSmsDiagnostic({ verdict: `Error: ${err?.message}` });
    }
  };

  const sendSmsTest = async () => {
    if (!testPhone) return;
    setSmsTestResult("Sending...");
    try {
      const result: any = await apiClient.post("/institution/sms-test", { phone: testPhone });
      setSmsTestResult(result.message || (result.sent ? "✅ SMS sent!" : "❌ SMS failed"));
    } catch (err: any) {
      setSmsTestResult(`❌ Error: ${err?.message}`);
    }
  };

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
            <h1 className="text-2xl font-bold md:text-3xl">প্রধান শিক্ষক সেটিংস</h1>
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
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />স্টোরেজ সংযোগের অবস্থা (Storage Connection Status)</CardTitle>
                <CardDescription>মঙ্গোডিবি (MongoDB) সংযুক্ত হলে সবুজ বিন্দু দেখাবে। ছবিগুলো মঙ্গোডিবি গ্রিডএফএস (GridFS)-এ সংরক্ষিত হচ্ছে — কোনো এক্সটার্নাল এপিআই কি প্রয়োজন নেই।</CardDescription>
              </div>
              <Button variant="outline" onClick={loadStorageStatus} disabled={checkingStorage}><RefreshCw className={`mr-2 h-4 w-4 ${checkingStorage ? 'animate-spin' : ''}`} />রিফ্রেশ করুন</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <StatusBox title="প্রধান সার্ভার মঙ্গোডিবি" item={storageStatus.primaryMongo} />
              <StatusBox title="সক্রিয় মঙ্গোডিবি ইউআরআই" item={storageStatus.configuredMongo} />
              <GridFSStatusBox item={storageStatus.imageStorage} />
            </div>
            {(mongoWarning || gridfsWarning) && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> স্টোরেজ সতর্কতা</div>
                {mongoWarning && <div className="mt-1">মঙ্গোডিবি ডাটা {storageStatus.configuredMongo.usedMb}MB ব্যবহার করেছে। এটি ফ্রি লিমিটের কাছাকাছি — অনুগ্রহ করে একটি নতুন মঙ্গোডিবি ইউআরআই (MongoDB URI) যোগ করুন। পুরনো ডাটার জন্য পুরনো ইউআরআইটি তালিকায় থেকে যাবে।</div>}
                {gridfsWarning && <div className="mt-1">গ্রিডএফএস ছবিগুলো {storageStatus.imageStorage?.totalMb}MB ব্যবহার করেছে। পুরনো ছবিগুলো আরকাইভ করার কথা বিবেচনা করুন।</div>}
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <HistoryList title="মঙ্গোডিবি ইউআরআই-এর ইতিহাস (MongoDB URI History)" items={storageStatus.mongodbUris || siteConfig.mongodbUris || []} type="mongo" warningAt={storageStatus.warningLimits?.mongoMb || 475} />
              <div className="rounded-xl border p-4">
                <div className="mb-3 font-semibold">ইমেজ স্টোরেজ</div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  <div className="font-semibold">✅ মঙ্গোডিবি গ্রিডএফএস (GridFS)</div>
                  <div className="mt-1">মোট ফাইল: {storageStatus.imageStorage?.fileCount ?? 0} টি ছবি</div>
                  <div>ব্যবহৃত: {storageStatus.imageStorage?.totalMb ?? 0}MB</div>
                  <div className="mt-2 text-xs">ছবিগুলো <code>/api/images/:id</code> এর মাধ্যমে লোড করা হবে</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">সর্বশেষ যাচাই করা হয়েছে: {storageStatus.checkedAt ? new Date(storageStatus.checkedAt).toLocaleString('bn-BD') : 'এখনো যাচাই করা হয়নি'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />নতুন স্টোরেজ কনফিগারেশন যোগ করুন</CardTitle>
            <CardDescription>New URI/key দিলে সেটা active হবে, কিন্তু old URI/key delete হবে না। Old data access history হিসেবে থাকবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="অ্যাপ বেস ইউআরএল (App Base URL)" value={siteConfig.appBaseUrl} onChange={(value) => setSiteConfig({ ...siteConfig, appBaseUrl: value })} />
              <TextField label="এপিআই বেস ইউআরএল (API Base URL)" value={siteConfig.apiBaseUrl} onChange={(value) => setSiteConfig({ ...siteConfig, apiBaseUrl: value })} />
              <TextField label={hasMongoUrl ? "নতুন মঙ্গোডিবি ইউআরআই যোগ করুন (পুরনো ইউআরআই তালিকায় থাকবে)" : "মঙ্গোডিবি ইউআরআই (MongoDB URI)"} type="password" value={siteConfig.mongodbUrl} onChange={(value) => setSiteConfig({ ...siteConfig, mongodbUrl: value })} placeholder="mongodb+srv://..." />
              <CheckField label="সেন্ট্রাল স্টোরেজ অনুপলব্ধ হলে ব্যক্তিগত মঙ্গোডিবি ফলব্যাক ব্যবহারের অনুমতি দিন" checked={Boolean(siteConfig.allowPersonalMongo)} onChange={(checked) => setSiteConfig({ ...siteConfig, allowPersonalMongo: checked })} />
              <CheckField label="ব্যক্তিগত স্টোরেজ ব্যবহারের অনুমতি দিন (বিকল্প ফ্ল্যাগ)" checked={Boolean(siteConfig.allowPersonalStorage)} onChange={(checked) => setSiteConfig({ ...siteConfig, allowPersonalStorage: checked })} />
              <TextField label="ব্যবহৃত মঙ্গোডিবি এমবি (MongoDB Used MB - ঐচ্ছিক ম্যানুয়াল আপডেট)" type="number" value={String(siteConfig.mongodbUsedMb || '')} onChange={(value) => setSiteConfig({ ...siteConfig, mongodbUsedMb: value })} placeholder="475" />
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">✅ ছবিগুলো মঙ্গোডিবি গ্রিডএফএস (GridFS)-এ সংরক্ষিত হচ্ছে — কোনো ImgBB API কি প্রয়োজন নেই।</div>
            <Button onClick={saveSiteConfig} disabled={saving === "site"}><Save className="mr-2 h-4 w-4" />{saving === "site" ? "সংরক্ষণ করা হচ্ছে..." : "সংরক্ষণ করুন / স্টোরেজ কনফিগারেশন যোগ করুন"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>বিদ্যালয়ের ছুটি ও বন্ধের সেটিংস (School Holiday & Closure Settings)</CardTitle><CardDescription>সাপ্তাহিক ছুটির দিন এবং বিশেষ বন্ধের সময়সীমা নির্ধারণ করুন।</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <label className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={holiday.enabled} onChange={(e) => setHoliday({ ...holiday, enabled: e.target.checked })} /><span className="text-sm font-medium">ছুটি/বন্ধের নিয়মাবলী চালু করুন</span></label>
            <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarX2 className="h-4 w-4" /> সাপ্তাহিক ছুটির দিনসমূহ</div><div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">{weekDays.map((day) => <label key={day} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${holiday.weeklyClosedDays.includes(day) ? "border-primary bg-primary/5" : "border-border"}`}><input type="checkbox" checked={holiday.weeklyClosedDays.includes(day)} onChange={() => toggleWeeklyDay(day)} /><span>{weekDaysBn[day] || day}</span></label>)}</div></div>
            <div className="grid gap-4 md:grid-cols-2"><TextField label="বন্ধের শুরুর তারিখ (Closure Start Date)" type="date" value={holiday.closureStartDate} onChange={(value) => setHoliday({ ...holiday, closureStartDate: value })} /><TextField label="বন্ধের শেষের তারিখ (Closure End Date)" type="date" value={holiday.closureEndDate} onChange={(value) => setHoliday({ ...holiday, closureEndDate: value })} /></div>
            <label className="block space-y-2"><span className="text-sm font-medium">বন্ধের কারণ (Closure Reason)</span><textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={holiday.closureReason} onChange={(e) => setHoliday({ ...holiday, closureReason: e.target.value })} /></label>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">মোট বন্ধের মেয়াদ: <strong>{closureDays}</strong> দিন। সাপ্তাহিক ছুটির দিনসমূহ: <strong>{holiday.weeklyClosedDays.map(d => weekDaysBn[d] || d).join(", ") || "কোনোটিই নয়"}</strong></div>
            <Button onClick={saveHoliday} disabled={saving === "holiday"}><Save className="mr-2 h-4 w-4" />{saving === "holiday" ? "সংরক্ষণ করা হচ্ছে..." : "ছুটির সেটিংস সংরক্ষণ করুন"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />অনুমোদন ও কাজের ধারা নিয়ন্ত্রণ (Approval & Workflow Controls)</CardTitle><CardDescription>এই নিয়ন্ত্রণগুলো মঙ্গোডিবি-তে সংরক্ষিত হবে এবং লোকাল ক্যাশেও জমা থাকবে।</CardDescription></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <CheckField label="অনুমোদনের পর ক্লাস রুটিন স্বয়ংক্রিয়ভাবে প্রকাশ করুন" checked={appControl.routineAutoPublishAfterApproval} onChange={(checked) => setAppControl({ ...appControl, routineAutoPublishAfterApproval: checked })} />
              <CheckField label="রুটিন পিডিএফ-এ শিক্ষকের নাম দেখান" checked={appControl.routinePdfIncludeTeacherName} onChange={(checked) => setAppControl({ ...appControl, routinePdfIncludeTeacherName: checked })} />
              <CheckField label="প্রধান শিক্ষকের অনুমোদনের আগে সহকারী শিক্ষকের পর্যালোচনা আবশ্যক" checked={appControl.routineRequireAssistantApproval} onChange={(checked) => setAppControl({ ...appControl, routineRequireAssistantApproval: checked })} />
              <CheckField label="অনুমোদিত ছুটি স্বয়ংক্রিয়ভাবে উপস্থিতিতে ছুটি (Leave) হিসেবে চিহ্নিত হবে" checked={appControl.leaveAutoMarkAttendance} onChange={(checked) => setAppControl({ ...appControl, leaveAutoMarkAttendance: checked })} />
              <CheckField label="ফলাফল খোঁজার পৃষ্ঠায় 'Half Yearly/Half Terminal' পরীক্ষা নিষ্ক্রিয় করুন (Disable Half Yearly Exam)" checked={appControl.disableHalfTerminalExam} onChange={(checked) => setAppControl({ ...appControl, disableHalfTerminalExam: checked })} />
              <CheckField label="ফলাফল খোঁজার পৃষ্ঠায় 'Final Exam' পরীক্ষা নিষ্ক্রিয় করুন (Disable Final Exam)" checked={appControl.disableFinalExam} onChange={(checked) => setAppControl({ ...appControl, disableFinalExam: checked })} />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="এসএমএস লগ সংরক্ষণের মেয়াদ (দিন)" type="number" value={String(appControl.smsLogRetentionDays)} onChange={(value) => setAppControl({ ...appControl, smsLogRetentionDays: Number(value) || 30 })} />
              <TextField label="এসএমএস ব্যবহারের সতর্কতা সীমা %" type="number" value={String(appControl.smsWarnAtPercent)} onChange={(value) => setAppControl({ ...appControl, smsWarnAtPercent: Number(value) || 80 })} />
              <label className="space-y-2"><span className="text-sm font-medium">মোবাইল প্রিন্ট মোড</span><select className="h-10 w-full rounded-md border px-3 text-sm" value={appControl.mobilePrintMode} onChange={(e) => setAppControl({ ...appControl, mobilePrintMode: e.target.value as any })}><option value="pdf">পিডিএফ ডাউনলোড</option><option value="print">সিস্টেম প্রিন্ট</option></select></label>
            </div>
            <Button onClick={saveAppControl} disabled={saving === "controls"}><Save className="mr-2 h-4 w-4" />{saving === "controls" ? "সংরক্ষণ করা হচ্ছে..." : "অনুমোদন নিয়ন্ত্রণগুলো সংরক্ষণ করুন"}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />উপস্থিতি ক্যালেন্ডারের রঙসমূহ (Attendance Calendar Colors)</CardTitle><CardDescription>ছুটির তালিকা এবং উপস্থিতি ক্যালেন্ডার ডিজাইনে ব্যবহৃত হবে।</CardDescription></CardHeader>
          <CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-5"><ColorField label="উপস্থিত" value={appControl.presentColor} onChange={(value) => setAppControl({ ...appControl, presentColor: value })} /><ColorField label="অনুপস্থিত" value={appControl.absentColor} onChange={(value) => setAppControl({ ...appControl, absentColor: value })} /><ColorField label="ছুটি" value={appControl.leaveColor} onChange={(value) => setAppControl({ ...appControl, leaveColor: value })} /><ColorField label="সাপ্তাহিক ছুটি (Weekend)" value={appControl.weekendColor} onChange={(value) => setAppControl({ ...appControl, weekendColor: value })} /><ColorField label="বিদ্যালয় বন্ধ (Closed)" value={appControl.closureColor} onChange={(value) => setAppControl({ ...appControl, closureColor: value })} /></div><Button onClick={saveAppControl} disabled={saving === "controls"}>রঙসমূহ সংরক্ষণ করুন</Button></CardContent>
        </Card>

        <Card className="border-2 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-emerald-600" />SMS Configuration (Anoncify)</CardTitle>
            <CardDescription>আপনার anoncify.xyz API key এখানে সেট করুন। সার্ভারের .env ফাইল না বদলে, এখান থেকেই key সেভ হবে।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {smsKeySet ? "✅ SMS API key সেট আছে — SMS পাঠানো সম্ভব" : "❌ SMS API key সেট নেই — key দিলে SMS কাজ করবে"}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Anoncify এপিআই কি {smsKeySet && <span className="text-xs text-emerald-600">(ইতিমধ্যে সেট করা আছে — পরিবর্তন করতে নতুন কি দিন)</span>}</span>
                <input
                  type="password"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={smsKey}
                  onChange={(e) => setSmsKey(e.target.value)}
                  placeholder={smsKeySet ? "বিদ্যমান কি পরিবর্তনের জন্য নতুন কি দিন" : "আপনার Anoncify এপিআই কি এখানে পেস্ট করুন"}
                />
              </label>
              <TextField label="এসএমএস এপিআই ইউআরএল (SMS API URL)" value={smsApiUrl} onChange={setSmsApiUrl} placeholder="https://anoncify.xyz/api/sms" />
            </div>
            <CheckField label="এসএমএস চালু করুন" checked={smsEnabled} onChange={setSmsEnabled} />
            <div className="flex flex-wrap gap-3">
              <Button onClick={saveSmsSettings} disabled={saving === "sms"}>
                <Save className="mr-2 h-4 w-4" />{saving === "sms" ? "সংরক্ষণ করা হচ্ছে..." : "এসএমএস সেটিংস সংরক্ষণ করুন"}
              </Button>
              <Button variant="outline" onClick={runSmsDiagnostic}>
                <ShieldCheck className="mr-2 h-4 w-4" />ডায়াগনস্টিক রান করুন
              </Button>
            </div>
            {smsDiagnostic && (
              <div className={`rounded-lg border p-4 text-sm ${
                String(smsDiagnostic.verdict).startsWith("✅") ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
              }`}>
                <div className="font-semibold">{smsDiagnostic.verdict}</div>
                <div className="mt-1 text-xs">Key source: {smsDiagnostic.keySource} | Provider: {smsDiagnostic.provider}</div>
                {smsDiagnostic.recentFailures?.length > 0 && (
                  <div className="mt-2">
                    <div className="font-medium">Recent failures:</div>
                    {smsDiagnostic.recentFailures.map((f: string, i: number) => <div key={i} className="text-xs">• {f}</div>)}
                  </div>
                )}
                {smsDiagnostic.fix && <div className="mt-2 font-medium text-orange-700">Fix: {smsDiagnostic.fix}</div>}
              </div>
            )}
            <div className="border-t pt-4">
              <div className="mb-2 text-sm font-medium">টেস্ট এসএমএস (কি সেট করার পর টেস্ট করুন)</div>
              <div className="flex gap-3">
                <input
                  type="tel"
                  className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                <Button variant="outline" onClick={sendSmsTest} disabled={!testPhone}>
                  <TestTube2 className="mr-2 h-4 w-4" />টেস্ট পাঠান
                </Button>
              </div>
              {smsTestResult && <div className="mt-2 text-sm font-medium">{smsTestResult}</div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>মুদ্রা (Currency)</CardTitle><CardDescription>অর্থসংক্রান্ত পৃষ্ঠাগুলোর জন্য প্রদর্শিত মুদ্রা নির্বাচন করুন।</CardDescription></CardHeader>
          <CardContent><div className="flex flex-col gap-3 sm:flex-row"><CheckRadio label="BDT (৳)" checked={currency === 'BDT'} onChange={() => setCurrency('BDT')} /><CheckRadio label="USD ($)" checked={currency === 'USD'} onChange={() => setCurrency('USD')} /></div><div className="mt-4"><Button onClick={saveCurrency} disabled={saving === "currency"}>পছন্দ সংরক্ষণ করুন</Button></div></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>উপস্থিতি (Attendance)</CardTitle><CardDescription>উপস্থিতি রিপোর্ট এবং ডাউনলোডের জন্য পছন্দসমূহ।</CardDescription></CardHeader>
          <CardContent className="space-y-4"><label className="block text-sm font-medium">ডিফল্ট ধরণ<select className="mt-1 w-full rounded border p-2 md:w-auto" value={attendance.defaultType} onChange={(e) => setAttendance({ ...attendance, defaultType: e.target.value as any })}><option value="student">শিক্ষার্থী</option><option value="teacher">শিক্ষক</option><option value="staff">কর্মচারী</option><option value="all">সবাই</option></select></label><CheckField label="রিপোর্টে প্রধান শিক্ষক/সহকারী শিক্ষককে শিক্ষক হিসেবে গণ্য করুন" checked={attendance.includeHeadAsTeacher} onChange={(checked) => setAttendance({ ...attendance, includeHeadAsTeacher: checked })} /><Button onClick={saveAttendance} disabled={saving === "attendance"}>উপস্থিতি সেটিংস সংরক্ষণ করুন</Button></CardContent>
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
      <div className={`mt-2 text-xs ${warning ? 'text-amber-700' : ok ? 'text-emerald-700' : 'text-red-700'}`}>{item?.message || (ok ? 'সংযুক্ত (Connected)' : 'সংযুক্ত নয় (Not connected)')}</div>
      {item?.usedMb !== undefined && <div className="mt-1 text-xs text-muted-foreground">ব্যবহৃত: {item.usedMb}MB / সতর্কতা সীমা {item.warningAtMb || '-'}MB</div>}
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
        <div className={`font-semibold ${warning ? 'text-amber-800' : 'text-blue-800'}`}>ইমেজ স্টোরেজ (GridFS)</div>
      </div>
      <div className={`mt-2 text-xs ${warning ? 'text-amber-700' : 'text-blue-700'}`}>{item?.message || 'মঙ্গোডিবি গ্রিডএফএস সক্রিয় আছে'}</div>
      <div className="mt-1 text-xs text-muted-foreground">{item?.fileCount ?? 0} টি ফাইল · {item?.totalMb ?? 0}MB ব্যবহৃত</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-blue-600">সেলফ-হোস্টেড · কোনো এপিআই কি লাগবে না</div>
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
                {item.isActive && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">সক্রিয় (Active)</span>}
                {item.warning && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">সতর্কতা (Warning)</span>}
              </div>
            </div>
            <div className="mt-1 break-all text-xs text-muted-foreground">{type === 'mongo' ? item.uri : item.apiKey}</div>
            <div className="mt-1 text-xs text-muted-foreground">ব্যবহৃত: {Number(item.usedMb || 0)}MB / সতর্কতা সীমা {warningAt}MB</div>
            <div className="mt-1 text-xs text-muted-foreground">যোগ করা হয়েছে: {item.addedAt ? new Date(item.addedAt).toLocaleString('bn-BD') : 'N/A'}</div>
            {item.note && <div className="mt-1 text-xs text-muted-foreground">{item.note}</div>}
            {!item.isActive && type === 'mongo' && (
              <div className="mt-2">
                <button className="rounded bg-primary px-3 py-1 text-xs text-white" onClick={() => window.dispatchEvent(new CustomEvent('make-active-mongo', { detail: { id: item.id } }))}>সক্রিয় করুন</button>
              </div>
            )}
          </div>
        ))}
        {!items?.length && <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">এখনো কোনো ইতিহাস নেই।</div>}
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
