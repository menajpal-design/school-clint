"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2, MessageSquare, Palette, Save, Settings as SettingsIcon, ShieldCheck, TestTube2 } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { getAppControlSettings, getClosureDaysCount, getHolidaySettings, setAppControlSettings, setHolidaySettings } from "@/lib/utils";

const weekDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const weekDaysBn: Record<string, string> = { Saturday: "শনিবার", Sunday: "রবিবার", Monday: "সোমবার", Tuesday: "মঙ্গলবার", Wednesday: "বুধবার", Thursday: "বৃহস্পতিবার", Friday: "শুক্রবার" };
const defaultHoliday = { enabled: true, weeklyClosedDays: [] as string[], closureStartDate: "", closureEndDate: "", closureReason: "" };
const defaultColors = { presentColor: "#bbf7d0", absentColor: "#fecaca", leaveColor: "#bae6fd", weekendColor: "#ddd6fe", closureColor: "#fed7aa", lateColor: "#fef3c7" };

export default function SettingsPage() {
  return <RoleGuard roles={["head"]} fallback={<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">শুধুমাত্র প্রধান শিক্ষকই স্কুলের সেটিংস পরিবর্তন করতে পারবেন।</div>}><HeadSettings /></RoleGuard>;
}

function HeadSettings() {
  const [holiday, setHoliday] = useState<any>(defaultHoliday);
  const [colors, setColors] = useState<any>(defaultColors);
  const [smsKey, setSmsKey] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [smsKeySet, setSmsKeySet] = useState(false);
  const [smsDiagnostic, setSmsDiagnostic] = useState<any>(null);
  const [testPhone, setTestPhone] = useState("");
  const [smsTestResult, setSmsTestResult] = useState("");
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const closureDays = useMemo(() => getClosureDaysCount(holiday.closureStartDate, holiday.closureEndDate), [holiday.closureStartDate, holiday.closureEndDate]);

  useEffect(() => {
    try {
      const savedHoliday: any = getHolidaySettings() || {};
      setHoliday({
        ...defaultHoliday,
        ...savedHoliday,
        enabled: savedHoliday.enabled ?? true,
        weeklyClosedDays: Array.isArray(savedHoliday.weeklyClosedDays) ? savedHoliday.weeklyClosedDays : [],
        closureStartDate: savedHoliday.closureStartDate || "",
        closureEndDate: savedHoliday.closureEndDate || "",
        closureReason: savedHoliday.closureReason || "",
      });
    } catch {}
    try { setColors({ ...defaultColors, ...getAppControlSettings() }); } catch {}
    apiClient.get("/site-settings/app-controls", { skipToast: true }).then((data: any) => {
      if (data?.settings) {
        const merged = { ...defaultColors, ...getAppControlSettings(), ...data.settings };
        setColors(merged);
        setAppControlSettings(merged as any);
      }
    }).catch(() => undefined);
    apiClient.get("/institution/sms-settings", { skipToast: true }).then((data: any) => {
      setSmsKeySet(Boolean(data?.smsApiKeySet));
      setSmsEnabled(data?.smsEnabled ?? true);
    }).catch(() => undefined);
  }, []);

  const runSave = async (key: string, fn: () => Promise<void> | void, ok: string) => {
    setSaving(key); setMessage(""); setError("");
    try { await fn(); setMessage(ok); }
    catch (err: any) { setError(err?.message || "সংরক্ষণ করা যায়নি।"); }
    finally { setSaving(""); }
  };
  const saveHoliday = () => runSave("holiday", () => setHolidaySettings(holiday), "ছুটির সেটিংস সংরক্ষণ করা হয়েছে।");
  const saveColors = () => runSave("colors", async () => { setAppControlSettings(colors); await apiClient.put("/site-settings/app-controls", colors); }, "রঙসমূহ সংরক্ষণ করা হয়েছে।");
  const saveSms = () => runSave("sms", async () => { const payload: any = { smsEnabled }; if (smsKey.trim()) payload.smsApiKey = smsKey.trim(); await apiClient.post("/institution/sms-settings", payload); setSmsKeySet(true); setSmsKey(""); }, "এসএমএস সেটিংস সংরক্ষণ করা হয়েছে।");
  const diagnostic = async () => { try { const result: any = await apiClient.get("/institution/sms-diagnostic"); setSmsDiagnostic(result.diagnosis || result); } catch (err: any) { setSmsDiagnostic({ verdict: `Error: ${err?.message}` }); } };
  const testSms = async () => { if (!testPhone) return; setSmsTestResult("পাঠানো হচ্ছে..."); try { const result: any = await apiClient.post("/institution/sms-test", { phone: testPhone }); setSmsTestResult(result.sent ? "✅ এসএমএস সফলভাবে পাঠানো হয়েছে" : "❌ এসএমএস পাঠানো যায়নি"); } catch (err: any) { setSmsTestResult(`❌ Error: ${err?.message}`); } };
  const toggleDay = (day: string) => setHoliday((current: any) => ({ ...current, weeklyClosedDays: (current.weeklyClosedDays || []).includes(day) ? current.weeklyClosedDays.filter((item: string) => item !== day) : [...(current.weeklyClosedDays || []), day] }));

  return <div className="space-y-5 p-3 md:p-6">
    <div className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-3 text-primary"><SettingsIcon className="h-6 w-6" /></div><div><h1 className="text-2xl font-bold md:text-3xl">প্রধান শিক্ষক সেটিংস</h1><p className="text-sm text-muted-foreground">ছুটি, উপস্থিতি ক্যালেন্ডারের রঙ এবং এসএমএস সেটিংস নিয়ন্ত্রণ করুন।</p></div></div>{message && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}{error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}</div>

    <Card><CardHeader><CardTitle>বিদ্যালয়ের ছুটি ও বন্ধের সেটিংস</CardTitle><CardDescription>সাপ্তাহিক ছুটির দিন এবং বিশেষ বন্ধের সময়সীমা নির্ধারণ করুন।</CardDescription></CardHeader><CardContent className="space-y-5"><label className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={Boolean(holiday.enabled)} onChange={(e) => setHoliday({ ...holiday, enabled: e.target.checked })} /><span className="text-sm font-medium">ছুটি/বন্ধের নিয়মাবলী চালু করুন</span></label><div><div className="mb-2 flex items-center gap-2 text-sm font-semibold"><CalendarX2 className="h-4 w-4" /> সাপ্তাহিক ছুটির দিনসমূহ</div><div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">{weekDays.map((day) => <label key={day} className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${(holiday.weeklyClosedDays || []).includes(day) ? "border-primary bg-primary/5" : "border-border"}`}><input type="checkbox" checked={(holiday.weeklyClosedDays || []).includes(day)} onChange={() => toggleDay(day)} /><span>{weekDaysBn[day] || day}</span></label>)}</div></div><div className="grid gap-4 md:grid-cols-2"><TextField label="বন্ধের শুরুর তারিখ" type="date" value={holiday.closureStartDate || ""} onChange={(value) => setHoliday({ ...holiday, closureStartDate: value })} /><TextField label="বন্ধের শেষের তারিখ" type="date" value={holiday.closureEndDate || ""} onChange={(value) => setHoliday({ ...holiday, closureEndDate: value })} /></div><label className="block space-y-2"><span className="text-sm font-medium">বন্ধের কারণ</span><textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={holiday.closureReason || ""} onChange={(e) => setHoliday({ ...holiday, closureReason: e.target.value })} /></label><div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">মোট বন্ধের মেয়াদ: <strong>{closureDays}</strong> দিন। সাপ্তাহিক ছুটি: <strong>{(holiday.weeklyClosedDays || []).map((d: string) => weekDaysBn[d] || d).join(", ") || "কোনোটিই নয়"}</strong></div><Button onClick={saveHoliday} disabled={saving === "holiday"}><Save className="mr-2 h-4 w-4" />{saving === "holiday" ? "সংরক্ষণ করা হচ্ছে..." : "ছুটির সেটিংস সংরক্ষণ করুন"}</Button></CardContent></Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />উপস্থিতি ক্যালেন্ডারের রঙসমূহ</CardTitle><CardDescription>এই রঙগুলো উপস্থিতি ক্যালেন্ডারে সরাসরি ব্যবহৃত হবে।</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-5"><ColorField label="উপস্থিত" value={colors.presentColor} onChange={(value) => setColors({ ...colors, presentColor: value })} /><ColorField label="অনুপস্থিত" value={colors.absentColor} onChange={(value) => setColors({ ...colors, absentColor: value })} /><ColorField label="ছুটি" value={colors.leaveColor} onChange={(value) => setColors({ ...colors, leaveColor: value })} /><ColorField label="সাপ্তাহিক ছুটি" value={colors.weekendColor} onChange={(value) => setColors({ ...colors, weekendColor: value })} /><ColorField label="বিদ্যালয় বন্ধ" value={colors.closureColor} onChange={(value) => setColors({ ...colors, closureColor: value })} /></div><Button onClick={saveColors} disabled={saving === "colors"}>রঙসমূহ সংরক্ষণ করুন</Button></CardContent></Card>

    <Card className="border-2 border-emerald-200"><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-emerald-600" />এসএমএস কনফিগারেশন</CardTitle><CardDescription>এখান থেকে এসএমএস সেবা চালু/বন্ধ এবং এপিআই কী সংরক্ষণ করুন।</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{smsKeySet ? "✅ এসএমএস এপিআই কী সেট আছে" : "❌ এসএমএস এপিআই কী সেট নেই"}</div><label className="space-y-2 block"><span className="text-sm font-medium">এসএমএস এপিআই কী {smsKeySet && <span className="text-xs text-emerald-600">(পরিবর্তন করতে নতুন কী দিন)</span>}</span><input type="password" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={smsKey} onChange={(e) => setSmsKey(e.target.value)} placeholder={smsKeySet ? "বিদ্যমান কী পরিবর্তনের জন্য নতুন কী দিন" : "এসএমএস এপিআই কী এখানে পেস্ট করুন"} /></label><CheckField label="এসএমএস চালু করুন" checked={smsEnabled} onChange={setSmsEnabled} /><div className="flex flex-wrap gap-3"><Button onClick={saveSms} disabled={saving === "sms"}><Save className="mr-2 h-4 w-4" />{saving === "sms" ? "সংরক্ষণ করা হচ্ছে..." : "এসএমএস সেটিংস সংরক্ষণ করুন"}</Button><Button variant="outline" onClick={diagnostic}><ShieldCheck className="mr-2 h-4 w-4" />ডায়াগনস্টিক রান করুন</Button></div>{smsDiagnostic && <div className="rounded-lg border p-4 text-sm"><div className="font-semibold">{smsDiagnostic.verdict || "Diagnostic complete"}</div>{smsDiagnostic.fix && <div className="mt-2 font-medium text-orange-700">সমাধান: {smsDiagnostic.fix}</div>}</div>}<div className="border-t pt-4"><div className="mb-2 text-sm font-medium">টেস্ট এসএমএস</div><div className="flex gap-3"><input type="tel" className="h-10 flex-1 rounded-md border border-input bg-background px-3 text-sm" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="01XXXXXXXXX" /><Button variant="outline" onClick={testSms} disabled={!testPhone}><TestTube2 className="mr-2 h-4 w-4" />টেস্ট পাঠান</Button></div>{smsTestResult && <div className="mt-2 text-sm font-medium">{smsTestResult}</div>}</div></CardContent></Card>
  </div>;
}

function TextField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label className="space-y-2"><span className="text-sm font-medium">{label}</span><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>; }
function CheckField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) { return <label className="flex items-center gap-2 rounded-lg border p-3"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><span className="text-sm font-medium">{label}</span></label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="space-y-2 rounded-lg border p-3"><span className="block text-sm font-medium">{label}</span><div className="flex items-center gap-2"><input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded border" /><input className="h-9 min-w-0 flex-1 rounded border px-2 text-xs" value={value || ""} onChange={(e) => onChange(e.target.value)} /></div></label>; }
