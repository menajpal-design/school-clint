"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, RefreshCw, Save, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const manageRoles = ["head", "assistant_head", "admin", "super_admin"];
const bd = (date?: string) => date ? new Date(date).toLocaleDateString("bn-BD") : "-";
const toInputDate = (date?: string) => date ? new Date(date).toISOString().slice(0, 10) : "";

export default function HolidaysPage() {
  const { user } = useAuth();
  const canManage = manageRoles.includes(user?.role || "");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [holidays, setHolidays] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", titleBn: "", type: "custom", startDate: "", endDate: "", description: "", isSchoolClosed: true });

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiClient.get(`/holidays?year=${year}`) as any;
      setHolidays(data.holidays || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load holiday list.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => undefined); }, [year]);

  const summary = useMemo(() => ({
    total: holidays.length,
    closed: holidays.filter((item) => item.isSchoolClosed).length,
    govt: holidays.filter((item) => item.type === "government").length,
    weekend: holidays.filter((item) => item.type === "weekend").length,
  }), [holidays]);

  const seedBangladesh = async () => {
    setMessage(""); setError("");
    try {
      const res = await apiClient.post('/holidays/seed/bangladesh', { year: Number(year), includeWeekends: true, weeklyDays: [5] }) as any;
      setMessage(res.message || "Bangladesh holiday list added.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to seed Bangladesh holidays."); }
  };

  const saveHoliday = async () => {
    setMessage(""); setError("");
    try {
      if (!form.title || !form.startDate) throw new Error("Title and start date required.");
      await apiClient.post('/holidays', { ...form, endDate: form.endDate || form.startDate, academicYear: year });
      setMessage("Holiday added. এই দিন স্কুল off থাকবে এবং attendance present/absent হবে না।");
      setForm({ title: "", titleBn: "", type: "custom", startDate: "", endDate: "", description: "", isSchoolClosed: true });
      await load();
    } catch (err: any) { setError(err?.message || "Failed to save holiday."); }
  };

  const updateClosed = async (holiday: any, isSchoolClosed: boolean) => {
    setMessage(""); setError("");
    try {
      await apiClient.put(`/holidays/${holiday._id}`, { isSchoolClosed });
      setMessage(isSchoolClosed ? "School closed enabled for this holiday." : "School closed disabled for this date.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to update holiday."); }
  };

  const removeHoliday = async (id: string) => {
    setMessage(""); setError("");
    try {
      await apiClient.delete(`/holidays/${id}`);
      setMessage("Holiday deleted.");
      await load();
    } catch (err: any) { setError(err?.message || "Failed to delete holiday."); }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Holiday List"
        description="বাংলাদেশের নিয়ম অনুযায়ী ছুটির তালিকা। এই তালিকা অনুযায়ী স্কুল off থাকবে, attendance present/absent না হয়ে holiday হিসেবে ধরবে।"
        icon={CalendarDays}
        status={<Badge variant="outline">{summary.total} days</Badge>}
        actions={[
          <Button key="refresh" variant="outline" size="sm" onClick={load}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>,
          canManage && <Button key="seed" size="sm" onClick={seedBangladesh}><Plus className="mr-2 h-4 w-4" />Add Bangladesh Holidays</Button>,
        ].filter(Boolean) as any}
      />

      {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Total Holidays" value={summary.total} />
        <Stat label="School Closed" value={summary.closed} />
        <Stat label="Govt Holidays" value={summary.govt} />
        <Stat label="Weekly Holidays" value={summary.weekend} />
      </section>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">Year</label>
          <input value={year} onChange={(e) => setYear(e.target.value)} className="h-10 w-32 rounded-md border px-3 text-sm" />
          <p className="text-sm text-muted-foreground">ধর্মীয়/চাঁদভিত্তিক ছুটি Head edit করে ঠিক করতে পারবে।</p>
        </div>
      </section>

      {canManage && <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="mb-3 font-semibold">Add Custom Holiday</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input placeholder="Title English" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-10 rounded-md border px-3 text-sm" />
          <input placeholder="Title Bangla" value={form.titleBn} onChange={(e) => setForm({ ...form, titleBn: e.target.value })} className="h-10 rounded-md border px-3 text-sm" />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="h-10 rounded-md border px-3 text-sm"><option value="custom">Custom</option><option value="school">School</option><option value="government">Government</option><option value="religious">Religious</option><option value="weekend">Weekend</option></select>
          <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-10 rounded-md border px-3 text-sm" />
          <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-10 rounded-md border px-3 text-sm" />
          <label className="flex items-center gap-2 rounded-md border px-3 text-sm"><input type="checkbox" checked={form.isSchoolClosed} onChange={(e) => setForm({ ...form, isSchoolClosed: e.target.checked })} /> School closed</label>
        </div>
        <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-3 min-h-20 w-full rounded-md border p-3 text-sm" />
        <Button className="mt-3" onClick={saveHoliday}><Save className="mr-2 h-4 w-4" />Save Holiday</Button>
      </section>}

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Holiday List</h2><Badge variant="outline">{loading ? "Loading" : `${holidays.length} records`}</Badge></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b text-left"><th className="p-2">Date</th><th className="p-2">Holiday</th><th className="p-2">Type</th><th className="p-2">School Status</th><th className="p-2">Action</th></tr></thead>
            <tbody>
              {holidays.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No holidays found. Click “Add Bangladesh Holidays”.</td></tr> : holidays.map((holiday) => <tr key={holiday._id} className="border-b">
                <td className="p-2">{bd(holiday.startDate)}{holiday.endDate && new Date(holiday.startDate).toDateString() !== new Date(holiday.endDate).toDateString() ? ` - ${bd(holiday.endDate)}` : ""}</td>
                <td className="p-2"><div className="font-medium">{holiday.titleBn || holiday.title}</div><div className="text-xs text-muted-foreground">{holiday.title}</div></td>
                <td className="p-2"><Badge variant="outline" className="capitalize">{holiday.type}</Badge></td>
                <td className="p-2"><Badge variant={holiday.isSchoolClosed ? "default" : "outline"}>{holiday.isSchoolClosed ? "School Off" : "Open"}</Badge></td>
                <td className="p-2"><div className="flex gap-2">{canManage && <><Button size="sm" variant="outline" onClick={() => updateClosed(holiday, !holiday.isSchoolClosed)}>{holiday.isSchoolClosed ? "Open" : "Close"}</Button><Button size="sm" variant="destructive" onClick={() => removeHoliday(holiday._id)}><Trash2 className="h-4 w-4" /></Button></>}</div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return <div className="rounded-lg border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}
