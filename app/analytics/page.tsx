"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Building2, 
  TrendingUp, 
  Users, 
  CalendarDays, 
  Search, 
  Eye, 
  Clock, 
  User, 
  ArrowLeft, 
  Lock, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Smartphone,
  CheckCircle2,
  CalendarCheck
} from "lucide-react";
import { 
  CartesianGrid, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { normalizeUserRole, isFreeLifetimePlan } from "@/lib/permissions";
import { api } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { PlanLockedFeature } from "@/components/shared/PlanLockedFeature";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isFree = isFreeLifetimePlan(user);
  const rawRole = user?.role || "";
  const normalizedRole = normalizeUserRole(rawRole);
  const isAdmin = ["admin", "super_admin"].includes(normalizedRole || "");
  const isHead = ["head", "assistant_head"].includes(normalizedRole || "");

  if (isFree) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title={t("Visit Analytics")} icon={TrendingUp} />
        <div className="mt-6">
          <PlanLockedFeature
            title="Visit Analytics মডিউলটি লক করা আছে"
            description="আপনার স্কুলের দৈনিক পোর্টাল ভিজিটিং এক্টিভিটি, পিক আওয়ার হিটম্যাপ এবং টপ ভিজিটর ট্র্যাকিং দেখতে দয়া করে সাবস্ক্রিপশন আপডেট করুন।"
            featureName="Visit Analytics"
            fullPage
          />
        </div>
      </div>
    );
  }

  // Common filters
  const [days, setDays] = useState("30");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin Data
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [schoolDetail, setSchoolDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Head Data
  const [headVisits, setHeadVisits] = useState<any>(null);
  const [recentLogins, setRecentLogins] = useState<any[]>([]);
  const [recentTotal, setRecentTotal] = useState(0);
  const [recentPage, setRecentPage] = useState(1);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const data = await api.analytics.schoolsOverview({
          days: Number(days),
          search,
          page,
          limit: 10
        });
        setAdminOverview(data);
      } else if (isHead) {
        const visitsData = await api.analytics.mySchoolVisits({
          days: Number(days),
          role: roleFilter === "all" ? undefined : roleFilter
        });
        setHeadVisits(visitsData);
        
        // Load recent logins
        await loadRecentLogins(1);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load analytics data.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecentLogins = async (pageNum: number) => {
    setLoadingRecent(true);
    try {
      const data = await api.analytics.mySchoolRecentLogins({
        page: pageNum,
        limit: 10,
        role: roleFilter === "all" ? undefined : roleFilter
      });
      setRecentLogins(data.logs || []);
      setRecentTotal(data.total || 0);
      setRecentPage(pageNum);
    } catch (err) {
      console.warn("Failed to load recent logins", err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const loadSchoolDetail = async (schoolId: string) => {
    setSelectedSchoolId(schoolId);
    setLoadingDetail(true);
    try {
      const data = await api.analytics.schoolDetail(schoolId, { days: Number(days) });
      setSchoolDetail(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to load school details.");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, days, search, page, roleFilter, isAdmin, isHead]);

  // Handle head login pagination
  const handleRecentPageChange = (pageNum: number) => {
    loadRecentLogins(pageNum);
  };

  // Render Charts data mapping
  const lineChartData = useMemo(() => {
    const trend = isAdmin 
      ? adminOverview?.dailyTrend 
      : headVisits?.dailyTrend;
    if (!Array.isArray(trend)) return [];
    return trend.map((item: any) => ({
      name: item.date,
      [t("Visits")]: item.visits || item.count || 0
    }));
  }, [adminOverview, headVisits, isAdmin, t]);

  const rolePieData = useMemo(() => {
    const rawBreakdown = isAdmin 
      ? adminOverview?.roleBreakdown 
      : headVisits?.roleBreakdown;
    if (!Array.isArray(rawBreakdown)) return [];
    
    const COLORS = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];
    return rawBreakdown.map((item: any, idx: number) => ({
      name: t(item._id || "Other"),
      value: item.count || item.total || 0,
      color: COLORS[idx % COLORS.length]
    })).filter(item => item.value > 0);
  }, [adminOverview, headVisits, isAdmin, t]);

  const hourlyHeatmapData = useMemo(() => {
    if (!headVisits?.hourlyHeatmap) return [];
    return headVisits.hourlyHeatmap.map((item: any) => ({
      hour: `${String(item.hour).padStart(2, "0")}:00`,
      [t("Visits")]: item.count || 0
    }));
  }, [headVisits, t]);

  // Format Date Helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Block unauthorized
  if (!isAdmin && !isHead) {
    return (
      <div className="flex h-[80vh] w-full flex-col items-center justify-center text-center p-4">
        <div className="rounded-full bg-rose-50 p-4 text-rose-500 mb-4 animate-bounce">
          <Lock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{t("Access Denied")}</h2>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">
          {t("Only Administrators and School Heads are permitted to view the visit analytics dashboard.")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t("Visit Analytics")}
        description={
          isAdmin 
            ? t("Google Analytics-style dashboard tracking login views and active usage across all schools.")
            : t("Real-time login visiting activity, heatmaps, and attendance rates for your school.")
        }
        icon={TrendingUp}
        actions={[
          <div className="flex items-center gap-2" key="filters">
            <Select value={days} onValueChange={(val) => { setDays(val); setPage(1); }}>
              <SelectTrigger className="w-[140px] rounded-xl bg-white border-slate-200">
                <SelectValue placeholder={t("Select range")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t("Last 7 Days")}</SelectItem>
                <SelectItem value="14">{t("Last 14 Days")}</SelectItem>
                <SelectItem value="30">{t("Last 30 Days")}</SelectItem>
                <SelectItem value="90">{t("Last 90 Days")}</SelectItem>
              </SelectContent>
            </Select>
            {isHead && (
              <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val)}>
                <SelectTrigger className="w-[140px] rounded-xl bg-white border-slate-200">
                  <SelectValue placeholder={t("Filter by role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All Roles")}</SelectItem>
                  <SelectItem value="head">{t("Head")}</SelectItem>
                  <SelectItem value="teacher">{t("Teacher")}</SelectItem>
                  <SelectItem value="staff">{t("Staff")}</SelectItem>
                  <SelectItem value="student">{t("Student")}</SelectItem>
                  <SelectItem value="parent">{t("Parent")}</SelectItem>
                </SelectContent>
              </Select>
            )}
            <Button 
              variant="outline" 
              onClick={() => { loadData(); setSelectedSchoolId(null); }}
              className="rounded-xl border-slate-200"
            >
              Refresh
            </Button>
          </div>
        ]}
      />

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="h-96 rounded-2xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500 gap-3">
          <div className="h-8 w-8 animate-spin border-3 border-primary border-t-transparent rounded-full" />
          <span className="text-sm font-semibold tracking-tight">{t("Loading analytics dashboard...")}</span>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* ADMIN OVERVIEW */}
          {/* ========================================================================= */}
          {isAdmin && !selectedSchoolId && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label={t("Total Registered Schools")}
                  value={adminOverview?.summary?.totalSchools ?? 0}
                  icon={Building2}
                  tone="blue"
                />
                <StatCard
                  label={t("Active Schools")}
                  value={adminOverview?.summary?.activeSchools ?? 0}
                  icon={CheckCircle}
                  tone="emerald"
                />
                <StatCard
                  label={t("Total Platform Logins")}
                  value={adminOverview?.summary?.totalLogins ?? 0}
                  icon={Activity}
                  tone="slate"
                />
                <StatCard
                  label={t("Logins Today")}
                  value={adminOverview?.summary?.todayLogins ?? 0}
                  icon={Clock}
                  tone="amber"
                />
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Daily Trend Line Chart */}
                <Card className="md:col-span-2 border-slate-200/80 shadow-md bg-white rounded-2xl">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {t("Platform Login Trend")} ({days} {t("Days")})
                    </CardTitle>
                    <CardDescription>{t("Daily total user login pageviews on Easy School.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 pt-5">
                    {lineChartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-slate-400 text-xs">{t("No trend data found.")}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                          <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                          <Tooltip 
                            contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: "12px", color: "#fff" }}
                            itemStyle={{ color: "#a5b4fc" }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey={t("Visits")} 
                            stroke="#6366f1" 
                            strokeWidth={3} 
                            dot={{ r: 2, strokeWidth: 1, fill: "#fff" }} 
                            activeDot={{ r: 4 }} 
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Role Breakdown Pie Chart */}
                <Card className="md:col-span-1 border-slate-200/80 shadow-md bg-white rounded-2xl">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      {t("User Role Distribution")}
                    </CardTitle>
                    <CardDescription>{t("Active login users categorized by roles today.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 flex flex-col justify-center pt-5">
                    {rolePieData.length === 0 ? (
                      <div className="text-center text-slate-400 text-xs py-10">{t("No logins tracked today.")}</div>
                    ) : (
                      <div className="flex flex-col h-full justify-between items-center">
                        <div className="h-40 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={rolePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={60}
                                paddingAngle={4}
                                dataKey="value"
                              >
                                {rolePieData.map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: "8px", color: "#fff" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-xs mt-2 px-2 overflow-y-auto max-h-20">
                          {rolePieData.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-1.5 truncate">
                              <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-slate-600 truncate">{item.name}</span>
                              <span className="font-semibold text-slate-800 ml-auto">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* School List Table */}
              <Card className="border-slate-200/80 shadow-md bg-white rounded-2xl">
                <CardHeader className="border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">{t("Schools Login Activity")}</CardTitle>
                    <CardDescription>{t("Active schools sorted by recent registration activity.")}</CardDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      placeholder={t("Search school...")}
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                      className="pl-10 rounded-xl bg-slate-50/50 border-slate-200 text-sm w-full"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold">
                          <th className="p-4">{t("School Name")}</th>
                          <th className="p-4">{t("EIIN")}</th>
                          <th className="p-4">{t("Visits (All / Today)")}</th>
                          <th className="p-4">{t("Members (Stu/Tch/Stf)")}</th>
                          <th className="p-4">{t("Plan / Status")}</th>
                          <th className="p-4 text-center">{t("Action")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {adminOverview?.schools?.rows?.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-slate-400">
                              {t("No schools found matching search criteria.")}
                            </td>
                          </tr>
                        ) : (
                          adminOverview?.schools?.rows?.map((school: any) => (
                            <tr key={school._id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-medium text-slate-900">
                                <div>
                                  <div className="font-semibold text-slate-800">{school.name}</div>
                                  <div className="text-xs text-slate-400 mt-0.5">{school.email} • {school.phone}</div>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-slate-600">{school.eiin || "N/A"}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="bg-indigo-50/40 text-indigo-700 border-indigo-100">
                                    {school.visits?.allTime ?? 0}
                                  </Badge>
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/50">
                                    +{school.visits?.today ?? 0}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-4 text-slate-600">
                                {school.members?.students ?? 0} / {school.members?.teachers ?? 0} / {school.members?.staff ?? 0}
                              </td>
                              <td className="p-4">
                                <div>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                    {school.planName}
                                  </span>
                                  <div className="mt-1 flex items-center gap-1">
                                    <span className={`h-2 w-2 rounded-full ${school.isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                                    <span className="text-xs text-slate-400">
                                      {school.isActive ? t("Active") : t("Suspended")}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => loadSchoolDetail(school._id)}
                                  className="rounded-lg hover:border-primary hover:text-primary gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  {t("Details")}
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {adminOverview?.schools?.totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-100">
                      <div className="text-xs text-slate-400">
                        {t("Page")} {page} {t("of")} {adminOverview?.schools?.totalPages}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={page === 1}
                          onClick={() => setPage(p => Math.max(1, p - 1))}
                          className="rounded-lg"
                        >
                          {t("Previous")}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={page === adminOverview?.schools?.totalPages}
                          onClick={() => setPage(p => p + 1)}
                          className="rounded-lg"
                        >
                          {t("Next")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ADMIN: SCHOOL DETAIL SUB-VIEW */}
          {/* ========================================================================= */}
          {isAdmin && selectedSchoolId && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedSchoolId(null)}
                  className="rounded-lg gap-1 text-slate-600 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("Back to list")}
                </Button>
              </div>

              {loadingDetail ? (
                <div className="h-64 flex items-center justify-center">
                  <div className="h-8 w-8 animate-spin border-3 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* School Detail Header */}
                  <Card className="border-slate-200/85 bg-white shadow-md rounded-2xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 mb-1">
                            {schoolDetail?.school?.type?.toUpperCase() || "SCHOOL"}
                          </Badge>
                          <h2 className="text-xl font-bold text-slate-900">{schoolDetail?.school?.name}</h2>
                          <p className="text-xs text-slate-400 mt-0.5">
                            EIIN: {schoolDetail?.school?.eiin || "N/A"} | {schoolDetail?.school?.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {schoolDetail?.school?.billing?.planName || "Free Plan"}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Status: {schoolDetail?.school?.isActive ? t("Active") : t("Suspended")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 p-5">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">{t("All-Time Visits")}</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">{schoolDetail?.summary?.totalVisits ?? 0}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">{t("Today's Visits")}</div>
                        <div className="text-2xl font-bold text-emerald-600 mt-1">+{schoolDetail?.summary?.todayVisits ?? 0}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">{t("Total Members")}</div>
                        <div className="text-2xl font-bold text-slate-800 mt-1">
                          {(schoolDetail?.summary?.members?.students ?? 0) + (schoolDetail?.summary?.members?.teachers ?? 0) + (schoolDetail?.summary?.members?.staff ?? 0)}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xs text-slate-400 font-medium">{t("Registered On")}</div>
                        <div className="text-base font-semibold text-slate-800 mt-2 truncate">
                          {new Date(schoolDetail?.school?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Charts */}
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="md:col-span-2 border-slate-200/80 shadow-md bg-white rounded-2xl">
                      <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800">{t("School Daily Activity")}</CardTitle>
                      </CardHeader>
                      <CardContent className="h-72 pt-5">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                            <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                            <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: "12px", color: "#fff" }} />
                            <Line type="monotone" dataKey={t("Visits")} stroke="#0ea5e9" strokeWidth={3} dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card className="md:col-span-1 border-slate-200/80 shadow-md bg-white rounded-2xl">
                      <CardHeader className="border-b border-slate-100 pb-3">
                        <CardTitle className="text-base font-semibold text-slate-800">{t("Role Breakdown")}</CardTitle>
                      </CardHeader>
                      <CardContent className="h-72 flex flex-col justify-between pt-5">
                        {rolePieData.length === 0 ? (
                          <div className="text-center text-slate-400 text-xs py-10">{t("No logins tracked.")}</div>
                        ) : (
                          <div className="flex flex-col h-full justify-between items-center">
                            <div className="h-40 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={rolePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={60} paddingAngle={4} dataKey="value">
                                    {rolePieData.map((entry: any, idx: number) => (
                                      <Cell key={`cell-${idx}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: "8px", color: "#fff" }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full text-xs mt-2 px-2 overflow-y-auto max-h-20">
                              {rolePieData.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1.5 truncate">
                                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                  <span className="text-slate-600 truncate">{item.name}</span>
                                  <span className="font-semibold text-slate-800 ml-auto">{item.value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity logs */}
                  <Card className="border-slate-200/80 shadow-md bg-white rounded-2xl">
                    <CardHeader className="border-b border-slate-100 pb-3">
                      <CardTitle className="text-base font-bold text-slate-800">{t("Recent Login History")}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                          <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold">
                              <th className="p-4">{t("User")}</th>
                              <th className="p-4">{t("Role")}</th>
                              <th className="p-4">{t("IP Address")}</th>
                              <th className="p-4">{t("Login At")}</th>
                              <th className="p-4">{t("Device Info")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {schoolDetail?.recentLogs?.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-400">
                                  {t("No login activity recorded.")}
                                </td>
                              </tr>
                            ) : (
                              schoolDetail?.recentLogs?.map((log: any) => (
                                <tr key={log._id}>
                                  <td className="p-4 font-semibold text-slate-800">
                                    <div>
                                      <div>{log.name}</div>
                                      <div className="text-xs text-slate-400 font-normal">{log.email || log.username}</div>
                                    </div>
                                  </td>
                                  <td className="p-4">
                                    <Badge variant="outline" className="capitalize">
                                      {t(log.role)}
                                    </Badge>
                                  </td>
                                  <td className="p-4 font-mono text-slate-500 text-xs">{log.ip || "N/A"}</td>
                                  <td className="p-4 text-xs">{formatDate(log.loginAt)}</td>
                                  <td className="p-4 text-xs text-slate-400 max-w-[200px] truncate" title={log.userAgent}>
                                    {log.userAgent || "N/A"}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* HEAD VISITING SYSTEM OVERVIEW */}
          {/* ========================================================================= */}
          {isHead && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  label={t("Total Portal Visits")}
                  value={headVisits?.summary?.totalVisits ?? 0}
                  icon={Eye}
                  tone="blue"
                />
                <StatCard
                  label={t("Visits Today")}
                  value={headVisits?.summary?.todayVisits ?? 0}
                  icon={Clock}
                  tone="amber"
                />
                <StatCard
                  label={t("Present Students Today")}
                  value={headVisits?.summary?.attendanceSummary?.present ?? 0}
                  helper={`${t("Total Marked")}: ${headVisits?.summary?.attendanceSummary?.total ?? 0}`}
                  icon={CalendarCheck}
                  tone="emerald"
                />
                <StatCard
                  label={t("Absent Students Today")}
                  value={headVisits?.summary?.attendanceSummary?.absent ?? 0}
                  icon={AlertCircle}
                  tone="rose"
                />
              </div>

              {/* Charts */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border-slate-200/80 shadow-md bg-white rounded-2xl">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {t("School Visiting Trend")}
                    </CardTitle>
                    <CardDescription>{t("Total login pageviews tracked per day.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 pt-5">
                    {lineChartData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-slate-400 text-xs">{t("No visits tracked yet.")}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                          <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={11} />
                          <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: "12px", color: "#fff" }} />
                          <Line type="monotone" dataKey={t("Visits")} stroke="#10b981" strokeWidth={3} dot={{ r: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                {/* Hourly Heatmap/Bar chart */}
                <Card className="md:col-span-1 border-slate-200/80 shadow-md bg-white rounded-2xl">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      {t("Peak Login Hours")}
                    </CardTitle>
                    <CardDescription>{t("Visits by hour of the day (today).")}</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72 pt-5">
                    {hourlyHeatmapData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-slate-400 text-xs">{t("No activity today.")}</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyHeatmapData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="hour" tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={10} />
                          <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" fontSize={10} />
                          <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: "8px", color: "#fff" }} />
                          <Bar dataKey={t("Visits")} fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Lower Section: Role distribution & Top visitors */}
              <div className="grid gap-6 md:grid-cols-3">
                {/* Role Activity */}
                <Card className="md:col-span-1 border-slate-200/80 shadow-md bg-white rounded-2xl">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-bold text-slate-800">{t("Role Activity Overview")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {headVisits?.roleBreakdown?.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">{t("No data.")}</div>
                      ) : (
                        headVisits?.roleBreakdown?.map((item: any, index: number) => (
                          <div key={index} className="p-4 flex items-center justify-between text-sm">
                            <div>
                              <div className="font-semibold text-slate-800 capitalize">{t(item._id || "Other")}</div>
                              <div className="text-xs text-slate-400 mt-0.5">
                                {t("Last login")}: {item.lastLogin ? new Date(item.lastLogin).toLocaleDateString() : "Never"}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-slate-800">{item.total} {t("visits")}</div>
                              <div className="text-xs text-emerald-600 font-medium">+{item.today} {t("today")}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Visitors */}
                <Card className="md:col-span-2 border-slate-200/80 shadow-md bg-white rounded-2xl">
                  <CardHeader className="border-b border-slate-100 pb-3">
                    <CardTitle className="text-base font-bold text-slate-800">{t("Top Active Visitors")}</CardTitle>
                    <CardDescription>{t("Users with the most page views in last N days.")}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold sticky top-0">
                            <th className="p-3">{t("User Name")}</th>
                            <th className="p-3">{t("Role")}</th>
                            <th className="p-3">{t("Total Logins")}</th>
                            <th className="p-3">{t("Last Active")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {headVisits?.topVisitors?.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400">
                                {t("No visitors tracked.")}
                              </td>
                            </tr>
                          ) : (
                            headVisits?.topVisitors?.map((visitor: any, idx: number) => (
                              <tr key={idx} className="hover:bg-slate-50/30">
                                <td className="p-3 font-semibold text-slate-800">{visitor.name || "N/A"}</td>
                                <td className="p-3">
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {t(visitor.role)}
                                  </Badge>
                                </td>
                                <td className="p-3 font-bold text-slate-700">{visitor.count}</td>
                                <td className="p-3 text-xs text-slate-400">{formatDate(visitor.lastLogin)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Login logs */}
              <Card className="border-slate-200/80 shadow-md bg-white rounded-2xl">
                <CardHeader className="border-b border-slate-100 pb-3">
                  <CardTitle className="text-base font-bold text-slate-800">{t("Recent Login logs")}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 font-semibold">
                          <th className="p-4">{t("User")}</th>
                          <th className="p-4">{t("Role")}</th>
                          <th className="p-4">{t("IP Address")}</th>
                          <th className="p-4">{t("Login At")}</th>
                          <th className="p-4">{t("Device Info")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {loadingRecent ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center">
                              <div className="h-6 w-6 animate-spin border-2 border-primary border-t-transparent rounded-full mx-auto" />
                            </td>
                          </tr>
                        ) : recentLogins.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-slate-400">
                              {t("No recent login logs found.")}
                            </td>
                          </tr>
                        ) : (
                          recentLogins.map((log: any) => (
                            <tr key={log._id}>
                              <td className="p-4 font-semibold text-slate-800">
                                <div>
                                  <div>{log.name}</div>
                                  <div className="text-xs text-slate-400 font-normal">{log.email || log.username}</div>
                                </div>
                              </td>
                              <td className="p-4">
                                <Badge variant="outline" className="capitalize">
                                  {t(log.role)}
                                </Badge>
                              </td>
                              <td className="p-4 font-mono text-slate-500 text-xs">{log.ip || "N/A"}</td>
                              <td className="p-4 text-xs">{formatDate(log.loginAt)}</td>
                              <td className="p-4 text-xs text-slate-400 max-w-[200px] truncate" title={log.userAgent}>
                                {log.userAgent || "N/A"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {recentTotal > 10 && (
                    <div className="flex items-center justify-between p-4 border-t border-slate-100">
                      <div className="text-xs text-slate-400">
                        {t("Page")} {recentPage} {t("of")} {Math.ceil(recentTotal / 10)} ({recentTotal} {t("total")})
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={recentPage === 1}
                          onClick={() => handleRecentPageChange(Math.max(1, recentPage - 1))}
                          className="rounded-lg"
                        >
                          {t("Previous")}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={recentPage >= Math.ceil(recentTotal / 10)}
                          onClick={() => handleRecentPageChange(recentPage + 1)}
                          className="rounded-lg"
                        >
                          {t("Next")}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
