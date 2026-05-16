"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Building2, CalendarDays, MessageSquareText, RefreshCw, Send, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
    { label: "Total SMS", value: summary.totalSms || 0, icon: MessageSquareText },
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
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="py-3">Institution</th>
                  <th>Location</th>
                  <th>Limit</th>
                  <th>Sent</th>
                  <th>Failed</th>
                  <th>Pending</th>
                  <th>Remaining</th>
                  <th>Last SMS</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {institutions.map((school: any) => (
                  <tr key={school.institutionId} className="border-b last:border-0">
                    <td className="py-3">
                      <p className="font-semibold text-slate-900">{school.name}</p>
                      <p className="text-xs text-slate-500">{school.email || school.phone || "-"}</p>
                    </td>
                    <td className="max-w-[260px] truncate">{school.address || "-"}</td>
                    <td>{Number(school.monthlySmsLimit || 0).toLocaleString()}</td>
                    <td>{Number(school.sentSms || 0).toLocaleString()}</td>
                    <td>{Number(school.failedSms || 0).toLocaleString()}</td>
                    <td>{Number(school.pendingSms || 0).toLocaleString()}</td>
                    <td>{Number(school.remainingSms || 0).toLocaleString()}</td>
                    <td>{formatDate(school.lastSentAt)}</td>
                    <td><Badge variant={school.isActive ? "default" : "destructive"}>{school.isActive ? "Active" : "Inactive"}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
