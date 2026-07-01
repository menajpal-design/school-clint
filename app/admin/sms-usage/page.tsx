"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, MessageSquare, RefreshCw, Send, XCircle } from "lucide-react";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ResponsiveTable from '@/components/shared/ResponsiveTable';

function currentMonth() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminSmsUsagePage() {
  const [month, setMonth] = useState(currentMonth());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  const triggerPreviousMonthSms = async () => {
    if (!confirm("Are you sure you want to send the previous month's summary SMS to all active paid institutions?")) {
      return;
    }
    setTriggering(true);
    try {
      const res: any = await apiClient.post("/sms/admin/send-previous-month");
      alert(res.message || "Successfully triggered monthly SMS sending!");
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to trigger monthly SMS sending.");
    } finally {
      setTriggering(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await apiClient.get(`/sms/admin/usage?month=${month}`);
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const institutions = Array.isArray(data?.institutions) ? data.institutions : [];
  const summary = data?.summary || {};
  const topInstitutions = useMemo(() => [...institutions].sort((a, b) => Number(b.sentSms || 0) - Number(a.sentSms || 0)).slice(0, 5), [institutions]);

  const stats = [
    { label: "Institutions", value: summary.totalInstitutions || 0, icon: Building2 },
    { label: "Total SMS", value: summary.totalSms || 0, icon: MessageSquare },
    { label: "Sent SMS", value: summary.sentSms || 0, icon: Send },
    { label: "Failed SMS", value: summary.failedSms || 0, icon: XCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin SMS Usage</h1>
            <p className="mt-1 text-sm text-slate-600">কোন প্রতিষ্ঠান কত SMS দিয়েছে, monthly limit কত, remaining কত — সব এক জায়গায়।</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button asChild variant="outline"><Link href="/admin">Back Admin</Link></Button>
            <div className="flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
              <CalendarDays className="h-4 w-4 text-slate-500" />
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="bg-transparent text-sm outline-none"
              />
            </div>
            <Button onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={triggerPreviousMonthSms} disabled={triggering} variant="default" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Send className="mr-2 h-4 w-4" />
              Send Last Month SMS
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{stat.label}</CardTitle>
                  <Icon className="h-5 w-5 text-slate-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{Number(stat.value).toLocaleString()}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <LineChartCard
            title="Monthly SMS Trend"
            data={(data?.trend || []).map((t: any) => ({ name: t.month || t.name || t.date, value: Number(t.sent || t.value || t.count || 0) }))}
          />
          <BarChartCard
            title="Top Institutions (sent)"
            data={topInstitutions.map((s: any) => ({ name: s.name || 'Institution', value: Number(s.sentSms || 0) }))}
          />
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Top SMS Sending Institutions</CardTitle>
            <CardDescription>Selected month-এর সবচেয়ে বেশি SMS ব্যবহার করা প্রতিষ্ঠান।</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {topInstitutions.length === 0 ? <p className="text-sm text-slate-500">No SMS usage found.</p> : topInstitutions.map((school: any) => {
              const percent = school.monthlySmsLimit ? Math.min((Number(school.sentSms || 0) / Number(school.monthlySmsLimit || 1)) * 100, 100) : 0;
              return (
                <div key={school.institutionId} className="rounded-xl border bg-white p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{school.name}</p>
                      <p className="text-sm text-slate-500">{school.address || school.email || "-"}</p>
                    </div>
                    <Badge variant="outline">{Number(school.sentSms || 0)} / {Number(school.monthlySmsLimit || 0)} SMS</Badge>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Institution-wise SMS Details</CardTitle>
            <CardDescription>Admin route থেকে সব প্রতিষ্ঠানের SMS usage দেখা যাবে।</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveTable
              columns={["Institution", "Location", "Limit", "Sent", "Failed", "Pending", "Remaining", "Last SMS", "Status"]}
              rows={institutions.map((school: any) => ([
                <div key="institution"><p className="font-semibold text-slate-900">{school.name}</p><p className="text-xs text-slate-500">{school.email || school.phone || '-'}</p></div>,
                <div key="location" className="max-w-[260px] truncate">{school.address || '-'}</div>,
                Number(school.monthlySmsLimit || 0).toLocaleString(),
                Number(school.sentSms || 0).toLocaleString(),
                Number(school.failedSms || 0).toLocaleString(),
                Number(school.pendingSms || 0).toLocaleString(),
                Number(school.remainingSms || 0).toLocaleString(),
                formatDate(school.lastSentAt),
                <Badge key="status" variant={school.isActive ? 'default' : 'destructive'}>{school.isActive ? 'Active' : 'Inactive'}</Badge>,
              ]))}
              empty="No institutions found"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
