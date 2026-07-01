"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, CheckCircle2, Database, Globe2, Loader2, MessageSquare, Palette, RefreshCw, Save, Settings as SettingsIcon, ShieldCheck, TestTube2 } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { getAppControlSettings, getClosureDaysCount, getHolidaySettings, setAppControlSettings, setHolidaySettings } from "@/lib/utils";

const weekDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekDaysBn: Record<string, string> = { Saturday: "শনিবার", Sunday: "রবিবার", Monday: "সোমবার", Tuesday: "মঙ্গলবার", Wednesday: "বুধবার", Thursday: "বৃহস্পতিবার", Friday: "শুক্রবার" };
const defaultHoliday = { enabled: true, weeklyClosedDays: [] as string[], closureStartDate: "", closureEndDate: "", closureReason: "" };
const defaultColors = { presentColor: "#bbf7d0", absentColor: "#fecaca", leaveColor: "#bae6fd", weekendColor: "#ddd6fe", closureColor: "#fed7aa", lateColor: "#fef3c7", primaryColor: "#2563eb", sidebarColor: "#0f172a", bodyColor: "#f8fafc", cardColor: "#ffffff" };
const defaultSchool = { academicYear: String(new Date().getFullYear()), timezone: "Asia/Dhaka", language: "bn", dateFormat: "dd/MM/yyyy", autoSmsOnAdmission: true, autoSmsOnDue: true, allowStudentDownload: true, allowParentPortal: true };
const dayIndex: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };

export default function SettingsFullClient() {
  return <RoleGuard roles={["head"]} fallback={<div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 shadow-sm">শুধুমাত্র প্রধান শিক্ষকই স্কুলের সেটিংস পরিবর্তন করতে পারবেন।</div>}><HeadSettings /></RoleGuard>;
}

function HeadSettings() {
  const [holiday, setHoliday] = useState<any>(defaultHoliday);
  const [colors, setColors] = useState<any>(defaultColors);
  const [school, setSchool] = useState<any>(defaultSchool);
  const [smsKey, setSmsKey] = useState("");
  const [smsUrl, setSmsUrl] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsKeySet, setSmsKeySet] = useState(false);
  const [smsUrlSet, setSmsUrlSet] = useState(false);
  const [smsDiagnostic, setSmsDiagnostic] = useState<any>(null);
  const [testPhone, setTestPhone] = useState("");
  const [smsTestResult, setSmsTestResult] = useState("");
  const [mongoUrl, setMongoUrl] = useState("");
  const [mongoLabel, setMongoLabel] = useState("");
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const closureDays = useMemo(() => getClosureDaysCount(holiday.closureStartDate, holiday.closureEndDate), [holiday.closureStartDate, holiday.closureEndDate]);
  const connected = Boolean(storageStatus?.configuredMongo?.connected);

  useEffect(() => {
    try { const h: any = getHolidaySettings() || {}; setHoliday({ ...defaultHoliday, ...h, enabled: h.enabled ?? true, weeklyClosedDays: Array.isArray(h.weeklyClosedDays) ? h.weeklyClosedDays : [] }); } catch {}
    apiClient.get("/site-settings/holiday-settings", { skipToast: true }).then((data: any) => {
      if (data?.settings) setHoliday({ ...defaultHoliday, ...data.settings, enabled: data.settings.enabled ?? true, weeklyClosedDays: Array.isArray(data.settings.weeklyClosedDays) ? data.settings.weeklyClosedDays : [] });
    }).catch(() => undefined);
    try { const controls: any = { ...defaultColors, ...getAppControlSettings() }; setColors(controls); setSchool({ ...defaultSchool, ...(controls.school || {}) }); } catch {}
    apiClient.get("/site-settings/app-controls", { skipToast: true }).then((data: any) => { if (data?.settings) { const merged = { ...defaultColors, ...getAppControlSettings(), ...data.settings }; setColors(merged); setSchool({ ...defaultSchool, ...(merged.school || {}) }); setAppControlSettings(merged as any); } }).catch(() => undefined);
    apiClient.get("/institution/sms-settings", { skipToast: true }).then((data: any) => { setSmsKeySet(Boolean(data?.smsApiKeySet)); setSmsUrlSet(Boolean(data?.smsApiUrl)); setSmsEnabled(data?.smsEnabled ?? true); }).catch(() => undefined);
    loadStorageStatus();
  }, []);

  const loadStorageStatus = async () => { try { const data: any = await apiClient.get("/site-settings/storage-status", { skipToast: true }); setStorageStatus(data); } catch (err: any) { setStorageStatus({ error: err?.message || "Storage status load failed" }); } };
  const runSave = async (key: string, fn: () => Promise<void> | void, ok: string) => { setSaving(key); setMessage(""); setError(""); try { await fn(); setMessage(ok); } catch (err: any) { setError(err?.message || "সংরক্ষণ করা যায়নি।"); } finally { setSaving(""); } };
  const saveHoliday = () => runSave("holiday", async () => {
    const weeklyDays = (holiday.weeklyClosedDays || []).map((day: string) => dayIndex[day]).filter((n: number) => Number.isInteger(n));
    const payload = { ...holiday, weeklyDays, weeklyClosedDays: holiday.weeklyClosedDays || [] };
    setHolidaySettings(payload);
    await apiClient.put("/site-settings/holiday-settings", payload);
    await apiClient.post("/holidays/seed/bangladesh", { year: Number(school.academicYear || new Date().getFullYear()), weeklyDays, weeklyColor: colors.weekendColor || "#ddd6fe", includeWeekends: true });
  }, "ছুটি ও বন্ধের সেটিংস server/database-এ সংরক্ষণ করা হয়েছে। Attendance calendar refresh করলে ঠিক দেখাবে।");
  const saveColors = () => runSave("colors", async () => { const payload = { ...colors, school }; setAppControlSettings(payload as any); await apiClient.put("/site-settings/app-controls", payload); }, "UI color এবং school control settings সংরক্ষণ করা হয়েছে।");
  const saveSms = () => runSave("sms", async () => { const payload: any = { smsEnabled }; if (smsKey.trim()) payload.smsApiKey = smsKey.trim(); if (smsUrl.trim()) payload.smsApiUrl = smsUrl.trim(); await apiClient.post("/institution/sms-settings", payload); if (smsKey.trim()) setSmsKeySet(true); if (smsUrl.trim()) setSmsUrlSet(true); setSmsKey(""); setSmsUrl(""); }, "এসএমএস সেটিংস সংরক্ষণ করা হয়েছে।");
  const saveMongo = () => runSave("mongo", async () => { if (!mongoUrl.trim()) throw new Error("MongoDB URI দিন"); await apiClient.put("/site-settings/site-config", { mongodbUrl: mongoUrl.trim(), mongodbLabel: mongoLabel.trim() || "School MongoDB", allowPersonalMongo: true, allowPersonalStorage: true }); setMongoUrl(""); setMongoLabel(""); await loadStorageStatus(); }, "MongoDB সেটিংস সংরক্ষণ করা হয়েছে।");
  const diagnostic = async () => { setSmsDiagnostic({ verdict: "Running diagnostic..." }); try { const result: any = await apiClient.get("/institution/sms-diagnostic"); setSmsDiagnostic(result.diagnosis || result); } catch (err: any) { setSmsDiagnostic({ verdict: `Error: ${err?.message}` }); } };
  const testSms = async () => { if (!testPhone) return; setSmsTestResult("পাঠানো হচ্ছে..."); try { const result: any = await apiClient.post("/institution/sms-test", { phone: testPhone }); setSmsTestResult(result.sent ? "✅ এসএমএস সফলভাবে পাঠানো হয়েছে" : "❌ এসএমএস পাঠানো যায়নি"); } catch (err: any) { setSmsTestResult(`❌ Error: ${err?.message}`); } };
  const toggleDay = (day: string) => setHoliday((current: any) => ({ ...current, weeklyClosedDays: (current.weeklyClosedDays || []).includes(day) ? current.weeklyClosedDays.filter((item: string) => item !== day) : [...(current.weeklyClosedDays || []), day] }));

  return <div className="space-y-6 p-4 md:p-6">
    <div className="overflow-hidden rounded-3xl border bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-900 p-6 text-white shadow-sm"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><div className="rounded-2xl bg-white/10 p-3"><SettingsIcon className="h-7 w-7" /></div><div><h1 className="text-3xl font-bold tracking-tight md:text-4xl">School Settings</h1><p className="mt-2 max-w-3xl text-sm text-blue-100">ছুটি, storage, SMS, UI color, academic year, parent/student portal এবং school control settings এক জায়গায় সুন্দরভাবে manage করুন।</p></div></div><Badge className="w-fit bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-500">Head Control Panel</Badge></div>{(message || error) && <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${message ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-50" : "border-red-300/40 bg-red-400/15 text-red-50"}`}>{message || error}</div>}</div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><StatCard title="Storage" value={connected ? "Connected" : "Not Connected"} tone={connected ? "success" : "warning"} /><StatCard title="SMS" value={smsEnabled ? "Enabled" : "Disabled"} tone={smsEnabled ? "success" : "danger"} /><StatCard title="Weekly Off" value={(holiday.weeklyClosedDays || []).length ? `${(holiday.weeklyClosedDays || []).length} days` : "Not set"} tone="info" /><StatCard title="Academic Year" value={school.academicYear || "Not set"} tone="info" /></div>
    <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]"><Card className="border-blue-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-blue-600" />MongoDB Storage Setup</CardTitle><CardDescription>Personal MongoDB URI save করুন। URI masked থাকবে, শুধু connection/history status দেখা যাবে।</CardDescription></CardHeader><CardContent className="space-y-4"><div className={`rounded-2xl border p-4 text-sm ${connected ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}><div className="flex items-center gap-2 font-semibold">{connected ? <CheckCircle2 className="h-4 w-4" /> : <Database className="h-4 w-4" />}{connected ? "Active MongoDB connected" : "Active MongoDB not connected / not set"}</div><div className="mt-1">{storageStatus?.configuredMongo?.message || storageStatus?.error || "Status not checked"}</div>{Array.isArray(storageStatus?.mongodbUris) && storageStatus.mongodbUris.length > 0 && <div className="mt-3 space-y-2">{storageStatus.mongodbUris.map((m: any) => <div key={m.id} className="rounded-xl border bg-white/70 px-3 py-2 text-xs"><b>{m.isActive ? "Active" : "Saved"}</b> · {m.label} · {m.uri} · {m.usedMb || 0}MB</div>)}</div>}</div><div className="grid gap-3 md:grid-cols-[1fr_2fr]"><input className="h-11 rounded-xl border px-3 text-sm" value={mongoLabel} onChange={(e) => setMongoLabel(e.target.value)} placeholder="Label: School MongoDB" /><input type="password" className="h-11 rounded-xl border px-3 text-sm" value={mongoUrl} onChange={(e) => setMongoUrl(e.target.value)} placeholder="New MongoDB URI paste করুন" /></div><div className="flex flex-wrap gap-3"><Button onClick={saveMongo} disabled={saving === "mongo"}>{saving === "mongo" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save MongoDB</Button><Button variant="outline" onClick={loadStorageStatus}><RefreshCw className="mr-2 h-4 w-4" />Refresh Status</Button></div></CardContent></Card><Card className="border-indigo-100 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Globe2 className="h-5 w-5 text-indigo-600" />General School Controls</CardTitle><CardDescription>Academic year, timezone, language এবং portal control settings।</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><TextField label="Academic Year" value={school.academicYear} onChange={(value) => setSchool({ ...school, academicYear: value })} /><TextField label="Timezone" value={school.timezone} onChange={(value) => setSchool({ ...school, timezone: value })} /><SelectField label="Default Language" value={school.language} onChange={(value) => setSchool({ ...school, language: value })} options={[["bn","Bangla"],["en","English"]]} /><SelectField label="Date Format" value={school.dateFormat} onChange={(value) => setSchool({ ...school, dateFormat: value })} options={[["dd/MM/yyyy","DD/MM/YYYY"],["MM/dd/yyyy","MM/DD/YYYY"],["yyyy-MM-dd","YYYY-MM-DD"]]} /></div><div className="grid gap-3 sm:grid-cols-2"><CheckField label="Admission SMS auto send" checked={Boolean(school.autoSmsOnAdmission)} onChange={(v) => setSchool({ ...school, autoSmsOnAdmission: v })} /><CheckField label="Due fee SMS reminder" checked={Boolean(school.autoSmsOnDue)} onChange={(v) => setSchool({ ...school, autoSmsOnDue: v })} /><CheckField label="Student download allow" checked={Boolean(school.allowStudentDownload)} onChange={(v) => setSchool({ ...school, allowStudentDownload: v })} /><CheckField label="Parent portal allow" checked={Boolean(school.allowParentPortal)} onChange={(v) => setSchool({ ...school, allowParentPortal: v })} /></div><Button onClick={saveColors} disabled={saving === "colors"}>{saving === "colors" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save General Controls</Button></CardContent></Card></div>
    <div className="grid gap-6 xl:grid-cols-[.95fr_1.05fr]"><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><CalendarX2 className="h-5 w-5 text-orange-600" />Holiday & Closure Settings</CardTitle><CardDescription>সাপ্তাহিক ছুটি এবং বিশেষ বন্ধের সময়সীমা database/server-এ save হবে।</CardDescription></CardHeader><CardContent className="space-y-5"><CheckField label="ছুটি/বন্ধের নিয়মাবলী চালু করুন" checked={Boolean(holiday.enabled)} onChange={(checked) => setHoliday({ ...holiday, enabled: checked })} /><div><div className="mb-2 text-sm font-semibold">সাপ্তাহিক ছুটির দিনসমূহ</div><div className="grid gap-2 sm:grid-cols-2">{weekDays.map((day) => <label key={day} className={`flex items-center gap-2 rounded-xl border p-3 text-sm transition ${(holiday.weeklyClosedDays || []).includes(day) ? "border-blue-300 bg-blue-50 text-blue-900" : "border-border bg-card"}`}><input type="checkbox" checked={(holiday.weeklyClosedDays || []).includes(day)} onChange={() => toggleDay(day)} /><span>{weekDaysBn[day] || day}</span></label>)}</div></div><div className="grid gap-4 md:grid-cols-2"><TextField label="বন্ধের শুরুর তারিখ" type="date" value={holiday.closureStartDate || ""} onChange={(value) => setHoliday({ ...holiday, closureStartDate: value })} /><TextField label="বন্ধের শেষের তারিখ" type="date" value={holiday.closureEndDate || ""} onChange={(value) => setHoliday({ ...holiday, closureEndDate: value })} /></div><label className="block space-y-2"><span className="text-sm font-medium">বন্ধের কারণ</span><textarea className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm" value={holiday.closureReason || ""} onChange={(e) => setHoliday({ ...holiday, closureReason: e.target.value })} /></label><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">মোট বন্ধের মেয়াদ: <strong>{closureDays}</strong> দিন। সাপ্তাহিক ছুটি: <strong>{(holiday.weeklyClosedDays || []).map((d: string) => weekDaysBn[d] || d).join(", ") || "কোনোটিই নয়"}</strong></div><Button onClick={saveHoliday} disabled={saving === "holiday"}>{saving === "holiday" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Holiday Settings</Button></CardContent></Card><Card className="shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5 text-purple-600" />UI & Attendance Colors</CardTitle><CardDescription>Site color mixer এবং attendance calendar-এর রঙ control করুন।</CardDescription></CardHeader><CardContent className="space-y-5"><div><div className="mb-2 text-sm font-semibold">Site Theme</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><ColorField label="Primary" value={colors.primaryColor} onChange={(value) => setColors({ ...colors, primaryColor: value })} /><ColorField label="Sidebar" value={colors.sidebarColor} onChange={(value) => setColors({ ...colors, sidebarColor: value })} /><ColorField label="Body" value={colors.bodyColor} onChange={(value) => setColors({ ...colors, bodyColor: value })} /><ColorField label="Card" value={colors.cardColor} onChange={(value) => setColors({ ...colors, cardColor: value })} /></div></div><div><div className="mb-2 text-sm font-semibold">Attendance Calendar</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><ColorField label="উপস্থিত" value={colors.presentColor} onChange={(value) => setColors({ ...colors, presentColor: value })} /><ColorField label="অনুপস্থিত" value={colors.absentColor} onChange={(value) => setColors({ ...colors, absentColor: value })} /><ColorField label="ছুটি" value={colors.leaveColor} onChange={(value) => setColors({ ...colors, leaveColor: value })} /><ColorField label="সাপ্তাহিক ছুটি" value={colors.weekendColor} onChange={(value) => setColors({ ...colors, weekendColor: value })} /><ColorField label="বিদ্যালয় বন্ধ" value={colors.closureColor} onChange={(value) => setColors({ ...colors, closureColor: value })} /><ColorField label="Late" value={colors.lateColor} onChange={(value) => setColors({ ...colors, lateColor: value })} /></div></div><Button onClick={saveColors} disabled={saving === "colors"}>{saving === "colors" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save Colors</Button></CardContent></Card></div>
    <Card className="border-emerald-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-emerald-600" />
          SMS Configuration
        </CardTitle>
        <CardDescription>
          এসএমএস service চালু/বন্ধ এবং টেস্ট এসএমএস।
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3">
          <StatusBox good={smsEnabled} text={smsEnabled ? "SMS enabled" : "SMS disabled"} />
        </div>
        <div className="hidden">
          <PasswordField label="SMS API URL" value={smsUrl} onChange={setSmsUrl} placeholder={smsUrlSet ? "নতুন URL দিলে আগের URL replace হবে" : "SMS API URL paste করুন"} />
          <PasswordField label="SMS API Key" value={smsKey} onChange={setSmsKey} placeholder={smsKeySet ? "নতুন key দিলে আগের key replace হবে" : "SMS API key paste করুন"} />
        </div>
        <CheckField label="এসএমএস চালু করুন" checked={smsEnabled} onChange={setSmsEnabled} />
        <div className="flex flex-wrap gap-3">
          <Button onClick={saveSms} disabled={saving === "sms"}>
            {saving === "sms" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save SMS Settings
          </Button>
        </div>
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="mb-2 text-sm font-semibold">Test SMS</div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input type="tel" className="h-11 flex-1 rounded-xl border border-input bg-background px-3 text-sm" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            <Button variant="outline" onClick={testSms} disabled={!testPhone}>
              <TestTube2 className="mr-2 h-4 w-4" />
              Send Test
            </Button>
          </div>
          {smsTestResult && <div className="mt-2 text-sm font-medium">{smsTestResult}</div>}
        </div>
      </CardContent>
    </Card>
  </div>;
}

function StatCard({ title, value, tone }: { title: string; value: string; tone: "success" | "warning" | "danger" | "info" }) { const cls = tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : tone === "danger" ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"; return <Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-medium uppercase text-muted-foreground">{title}</p><p className={`mt-2 inline-flex rounded-full border px-3 py-1 text-sm font-bold ${cls}`}>{value}</p></CardContent></Card>; }
function StatusBox({ good, text }: { good: boolean; text: string }) { return <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${good ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>{good ? "✅" : "❌"} {text}</div>; }
function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="space-y-2"><span className="text-sm font-medium">{label}</span><input className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>; }
function PasswordField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) { return <label className="space-y-2"><span className="text-sm font-medium">{label}</span><input type="password" className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} /></label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) { return <label className="space-y-2"><span className="text-sm font-medium">{label}</span><select className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm" value={value || ""} onChange={(e) => onChange(e.target.value)}>{options.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center gap-2 rounded-xl border bg-card p-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="text-sm font-medium">{label}</span></label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-2 rounded-2xl border bg-card p-3"><span className="block text-sm font-medium">{label}</span><div className="flex items-center gap-2"><input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-10 w-12 rounded border" /><input className="h-10 min-w-0 flex-1 rounded-xl border px-2 text-xs" value={value || ""} onChange={(e) => onChange(e.target.value)} /></div></label>; }
