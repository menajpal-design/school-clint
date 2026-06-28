"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Building2, CalendarDays, Eye, RefreshCw, Search, Users } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlanLockedFeature } from "@/components/shared/PlanLockedFeature";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, isPlanRestrictedApiError } from "@/lib/api";
import { normalizeUserRole } from "@/lib/permissions";

const number = (value: any) => Number(value || 0).toLocaleString();
const shortDate = (value: any) => value ? new Date(value).toLocaleString() : "-";

function StatCard({ label, value, icon: Icon }: { label: string; value: any; icon: any }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <span className="rounded-2xl bg-teal-50 p-3 text-teal-600"><Icon className="h-6 w-6" /></span>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const role = normalizeUserRole(user?.role) || user?.role;
  const isPlatformAdmin = role === "admin" || role === "super_admin";
  const canView = isPlatformAdmin || role === "head" || role === "assistant_head";
  const [days, setDays] = useState("30");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [planLocked, setPlanLocked] = useState(false);

  const load = async () => {
    if (!canView) return;
    setLoading(true);
    setError("");
    setPlanLocked(false);
    try {
      const params = new URLSearchParams({ days });
      if (isPlatformAdmin) {
        if (search.trim()) params.set("search", search.trim());
        params.set("limit", "100");
        const res = await apiClient.get(`/analytics/schools-overview?${params.toString()}`, { skipToast: true });
        setData(res);
      } else {
        if (roleFilter) params.set("role", roleFilter);
        const res = await apiClient.get(`/analytics/my-school/visits?${params.toString()}`, { skipToast: true });
        setData(res);
      }
    } catch (err: any) {
      if (isPlanRestrictedApiError(err)) setPlanLocked(true);
      else setError(err?.message || "Failed to load analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [canView, days, isPlatformAdmin]);

  const trend = useMemo(() => (data?.dailyTrend || []).map((item: any) => ({
    name: item.date?.slice(5) || item.date,
    value: Number(item.visits || item.count || 0),
  })), [data]);

  const roleData = useMemo(() => (data?.roleBreakdown || data?.roleTotals || []).map((item: any) => ({
    name: item._id || "Unknown",
    value: Number(item.count || item.total || 0),
  })), [data]);

  const hourlyData = useMemo(() => (data?.hourlyHeatmap || []).map((item: any) => ({
    name: `${String(item.hour).padStart(2, "0")}:00`,
    value: Number(item.count || 0),
  })), [data]);

  if (!canView) {
    return <div className="p-6"><Card><CardContent className="p-8 text-center text-sm text-slate-600">Only platform admin and school head roles can view visit analytics.</CardContent></Card></div>;
  }

  const summary = data?.summary || {};
  const schools = data?.schools?.rows || [];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Visit Analytics"
        description={isPlatformAdmin ? "Google Analytics style total views and school-wise visits." : "Your school visiting system, page views, roles and visitor trend."}
        icon={BarChart3}
        status={<Badge variant="outline">{isPlatformAdmin ? "All schools" : "My school"}</Badge>}
        actions={[
          <select key="days" className="h-9 rounded-md border bg-background px-3 text-sm" value={days} onChange={(e) => setDays(e.target.value)}>
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>,
          <Button key="refresh" size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>,
        ]}
      />

      {planLocked && (
        <PlanLockedFeature
          fullPage
          featureName="Visit Analytics"
          description="Visit Analytics, dashboard charts এবং profile charts Free Lifetime প্যাকেজে চালু নয়। Paid package active করলে এই analytics report দেখা যাবে।"
        />
      )}

      {!planLocked && error && <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {!planLocked ? (isPlatformAdmin ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Views" value={number(summary.totalViews)} icon={Eye} />
            <StatCard label="Today Views" value={number(summary.todayViews)} icon={CalendarDays} />
            <StatCard label="Total Schools" value={number(summary.totalSchools)} icon={Building2} />
            <StatCard label="Total Logins" value={number(summary.totalLogins)} icon={Users} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <LineChartCard title={`Page Views Trend (${days} days)`} data={trend} />
            <PieChartCard title="Today Views by Role" data={roleData} />
          </div>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>School-wise Views</CardTitle>
                <CardDescription>Total and today page views for every school.</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input className="w-72 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search school..." />
                </div>
                <Button variant="outline" onClick={load}>Search</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500"><th className="p-3">School</th><th className="p-3">Plan</th><th className="p-3">Status</th><th className="p-3">Today</th><th className="p-3">Last {days} days</th><th className="p-3">Total Views</th><th className="p-3">Logins</th><th className="p-3">Members</th></tr></thead>
                <tbody>{schools.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">{loading ? "Loading..." : "No schools found."}</td></tr> : schools.map((school: any) => <tr key={school._id} className="border-b"><td className="p-3"><div className="font-semibold text-slate-900">{school.name}</div><div className="text-xs text-slate-500">{school.email || school.phone || "-"}</div></td><td className="p-3">{school.planName || "-"}</td><td className="p-3"><Badge variant={school.isActive ? "default" : "secondary"}>{school.isActive ? "Active" : "Inactive"}</Badge></td><td className="p-3 font-semibold">{number(school.visits?.today)}</td><td className="p-3">{number(school.visits?.lastNDays)}</td><td className="p-3">{number(school.visits?.allTime)}</td><td className="p-3">{number(school.visits?.logins)}</td><td className="p-3 text-xs text-slate-600">S {number(school.members?.students)} · T {number(school.members?.teachers)} · Staff {number(school.members?.staff)}</td></tr>)}</tbody>
              </table>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total Views" value={number(summary.totalVisits)} icon={Eye} />
            <StatCard label="Today Views" value={number(summary.todayVisits)} icon={CalendarDays} />
            <StatCard label="Total Logins" value={number(summary.totalLogins)} icon={Users} />
            <StatCard label="Attendance Today" value={number(summary.attendanceSummary?.total)} icon={Building2} />
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
            <span className="text-sm font-semibold text-slate-700">Role filter</span>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              <option value="head">Head</option>
              <option value="assistant_head">Assistant Head</option>
              <option value="teacher">Teacher</option>
              <option value="class_teacher">Class Teacher</option>
              <option value="student">Student</option>
              <option value="parent">Parent</option>
            </select>
            <Button size="sm" variant="outline" onClick={load}>Apply</Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <LineChartCard title={`Daily Page Views (${days} days)`} data={trend} />
            <PieChartCard title="Views by Role" data={roleData} />
          </div>
          <BarChartCard title="Today Hourly Views" data={hourlyData} />

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader><CardTitle>Top Visitors</CardTitle><CardDescription>Most page views in selected period.</CardDescription></CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead><tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500"><th className="p-3">Name</th><th className="p-3">Role</th><th className="p-3">Views</th><th className="p-3">Last View</th></tr></thead>
                <tbody>{(data?.topVisitors || []).length === 0 ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">{loading ? "Loading..." : "No visitor data yet."}</td></tr> : data.topVisitors.map((item: any) => <tr key={String(item._id)} className="border-b"><td className="p-3 font-semibold">{item.name || "Unknown"}</td><td className="p-3 capitalize">{String(item.role || "-").replace(/_/g, " ")}</td><td className="p-3">{number(item.count)}</td><td className="p-3">{shortDate(item.lastView)}</td></tr>)}</tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )) : null}
    </div>
  );
}
