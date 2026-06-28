"use client";

import { useEffect, useState, useCallback } from "react";
import { Users, LogIn, Calendar, TrendingUp, Shield, BarChart3, RefreshCw, ChevronLeft, ChevronRight, Search, Building2, Clock } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const ROLES = ["head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff", "student", "parent", "committee_member"];

const ROLE_COLORS: Record<string, string> = {
  head: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  assistant_head: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
  class_teacher: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  subject_teacher: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
  teacher: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
  finance_officer: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  staff: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  student: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  parent: "bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300",
  committee_member: "bg-gray-100 text-gray-800 dark:bg-gray-900/40 dark:text-gray-300",
  admin: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  super_admin: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[role] || "bg-gray-100 text-gray-700"}`}>
      {role.replace(/_/g, " ")}
    </span>
  );
}

function formatTime(date: string) {
  return new Date(date).toLocaleString("en-BD", { timeZone: "Asia/Dhaka", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-BD", { timeZone: "Asia/Dhaka", year: "numeric", month: "short", day: "2-digit" });
}

export default function LoginLogsPage() {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  const [summary, setSummary] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filters
  const [date, setDate] = useState(today);
  const [role, setRole] = useState("all");
  const [institutionId, setInstitutionId] = useState("all");
  const [search, setSearch] = useState("");

  const fetchSummary = useCallback(async () => {
    try {
      const data = await apiClient.get(`/admin/login-logs/summary?date=${date}`) as any;
      setSummary(data);
    } catch { /* silent */ }
  }, [date]);

  const fetchLogs = useCallback(async (p = 1) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: "50" });
      if (date) params.set("date", date);
      if (role && role !== "all") params.set("role", role);
      if (institutionId && institutionId !== "all") params.set("institutionId", institutionId);
      const data = await apiClient.get(`/admin/login-logs?${params}`) as any;
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch { setLogs([]); } finally { setLogsLoading(false); }
  }, [date, role, institutionId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchSummary(), fetchLogs(1)]).finally(() => setLoading(false));
  }, [fetchSummary, fetchLogs]);

  const handleRefresh = () => { fetchSummary(); fetchLogs(1); };

  const filteredLogs = search.trim()
    ? logs.filter(l => [l.name, l.username, l.email, l.role, l.institutionName, l.ip].some(v => String(v || "").toLowerCase().includes(search.toLowerCase())))
    : logs;

  if (!user || !["admin", "super_admin"].includes(user.role)) {
    return <div className="p-8 text-center text-muted-foreground">Access denied. Admin only.</div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Login Logs"
        description="কোন স্কুলে কারা login করছে, কয়টি visitor, role ও সময় — সব এক জায়গায়।"
        icon={LogIn}
        status={<Badge variant="outline">Admin Only</Badge>}
      />

      {/* Top Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">মোট Login</p>
              <p className="text-2xl font-bold">{loading ? "…" : (summary?.totalLogins ?? 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 dark:bg-green-900/30">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">আজকের Login</p>
              <p className="text-2xl font-bold">{loading ? "…" : (summary?.todayLogins ?? 0).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">সক্রিয় স্কুল</p>
              <p className="text-2xl font-bold">{loading ? "…" : (summary?.institutionSummary?.length ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">ফিল্টার করা Log</p>
              <p className="text-2xl font-bold">{total.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      {summary?.roleSummary && summary.roleSummary.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 border-b pb-3">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Role অনুযায়ী মোট Login</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3">
              {summary.roleSummary.map((r: any) => (
                <div key={r._id} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <RoleBadge role={r._id} />
                  <span className="font-semibold text-sm">{r.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-School Summary */}
      {summary?.institutionSummary && summary.institutionSummary.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 border-b pb-3">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">প্রতিষ্ঠান অনুযায়ী Visitor</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-2 text-left font-medium">স্কুলের নাম</th>
                  <th className="pb-2 text-right font-medium">মোট Login</th>
                  <th className="pb-2 text-right font-medium">আজকে</th>
                  <th className="pb-2 text-right font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {summary.institutionSummary.map((inst: any) => (
                  <tr key={inst._id} className="hover:bg-muted/30">
                    <td className="py-2 pr-4 font-medium">{inst.institutionName}</td>
                    <td className="py-2 text-right">{inst.count.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      <Badge variant={inst.todayCount > 0 ? "default" : "secondary"}>{inst.todayCount}</Badge>
                    </td>
                    <td className="py-2 text-right">
                      <Button
                        size="sm" variant="ghost"
                        onClick={() => { setInstitutionId(inst._id); fetchLogs(1); }}
                        className="h-7 text-xs"
                      >
                        দেখুন
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Filters + Log Table */}
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              Login History
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
          <div className="flex flex-wrap gap-3 pt-3">
            <Input
              type="date"
              value={date}
              max={today}
              onChange={e => setDate(e.target.value)}
              className="w-40"
            />
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="সব Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব Role</SelectItem>
                {ROLES.map(r => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="নাম, email, IP দিয়ে খুঁজুন"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-56"
              />
            </div>
            <Button onClick={() => fetchLogs(1)} size="sm">ফিল্টার করুন</Button>
            {(role !== "all" || institutionId !== "all" || date !== today) && (
              <Button variant="ghost" size="sm" onClick={() => { setRole("all"); setInstitutionId("all"); setDate(today); setSearch(""); }}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">লোড হচ্ছে…</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">কোনো login log পাওয়া যায়নি।</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/30">
                  <tr className="border-b text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">নাম</th>
                    <th className="px-4 py-3 text-left font-medium">স্কুল</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">সময়</th>
                    <th className="px-4 py-3 text-left font-medium">IP</th>
                    <th className="px-4 py-3 text-left font-medium">Device</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log: any) => (
                    <tr key={log._id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{log.name}</div>
                        {log.username && <div className="text-xs text-muted-foreground">@{log.username}</div>}
                        {log.email && <div className="text-xs text-muted-foreground">{log.email}</div>}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{log.institutionName || "—"}</td>
                      <td className="px-4 py-3"><RoleBadge role={log.role} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 whitespace-nowrap text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          {formatTime(log.loginAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{log.ip || "—"}</td>
                      <td className="px-4 py-3 max-w-[180px] truncate text-xs text-muted-foreground" title={log.userAgent}>
                        {log.userAgent ? log.userAgent.slice(0, 40) + (log.userAgent.length > 40 ? "…" : "") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">মোট {total.toLocaleString()} টি record, পেজ {page}/{totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => fetchLogs(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => fetchLogs(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
