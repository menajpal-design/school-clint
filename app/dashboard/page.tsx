"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarCheck,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  Landmark,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { UserRole } from "@/types";

type DashboardSummary = {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  todayAttendanceCount: number;
  monthlyFeeCollection: number;
  activeNotices: number;
  idCardsIssued: number;
};

type ChartPoint = Record<string, string | number>;
type CompositionPoint = { name: string; value: number; color?: string };

type NoticeItem = {
  _id?: string;
  id?: string;
  title: string;
  category?: string;
  priority?: string;
  publishedAt?: string;
  createdAt?: string;
};

const emptySummary: DashboardSummary = {
  totalStudents: 0,
  totalTeachers: 0,
  totalStaff: 0,
  todayAttendanceCount: 0,
  monthlyFeeCollection: 0,
  activeNotices: 0,
  idCardsIssued: 0,
};

const emptyComposition: CompositionPoint[] = [];
const emptyAttendance: ChartPoint[] = [];
const emptyFeeTrend: ChartPoint[] = [];
const emptyNotices: NoticeItem[] = [];

function normalizeSummary(data: any): DashboardSummary {
  return {
    totalStudents: Number(data?.totalStudents ?? 0),
    totalTeachers: Number(data?.totalTeachers ?? 0),
    totalStaff: Number(data?.totalStaff ?? 0),
    todayAttendanceCount: Number(data?.todayAttendanceCount ?? data?.todayAttendance ?? 0),
    monthlyFeeCollection: Number(data?.monthlyFeeCollection ?? data?.monthlyFees ?? 0),
    activeNotices: Number(data?.activeNotices ?? 0),
    idCardsIssued: Number(data?.idCardsIssued ?? data?.issuedIdCards ?? 0),
  };
}

function normalizeComposition(data: any): CompositionPoint[] {
  const source = Array.isArray(data) ? data : Array.isArray(data?.composition) ? data.composition : [];
  if (!source.length) return emptyComposition;
  return source.map((item: any, index: number) => ({
    name: item.name || item._id || item.type || `Group ${index + 1}`,
    value: Number(item.value || item.count || item.total || 0),
  }));
}

function normalizeAttendance(data: any): ChartPoint[] {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.attendance)
      ? data.attendance
      : Array.isArray(data?.attendanceOverview)
        ? data.attendanceOverview
        : [];
  if (!source.length) return emptyAttendance;
  return source.map((item: any, index: number) => ({
    name: item.name || item.status || item._id || item.class || `Item ${index + 1}`,
    value: Number(item.value || item.count || item.present || item.percentage || 0),
  }));
}

function normalizeFeeTrend(data: any): ChartPoint[] {
  const source = Array.isArray(data)
    ? data
    : Array.isArray(data?.feeTrend)
      ? data.feeTrend
      : Array.isArray(data?.fees)
        ? data.fees
        : Array.isArray(data?.charts?.feeTrend)
          ? data.charts.feeTrend
          : [];
  if (!source.length) return emptyFeeTrend;
  return source.map((item: any, index: number) => ({
    name: item.name || item.month || item._id || `M${index + 1}`,
    value: Number(item.value || item.total || item.amount || item.collection || 0),
  }));
}

function normalizeNotices(data: any): NoticeItem[] {
  const source = Array.isArray(data) ? data : Array.isArray(data?.notices) ? data.notices : [];
  if (!source.length) return emptyNotices;
  return source.slice(0, 5).map((item: any) => ({
    _id: item._id,
    id: item.id,
    title: item.title || "Untitled notice",
    category: item.category || "General",
    priority: item.priority || "normal",
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
  }));
}

function money(value: number) {
  return `BDT ${value.toLocaleString()}`;
}

function roleLabel(role?: UserRole) {
  if (!role) return "Guest";
  return role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getQuickActions(role?: UserRole) {
  const common = [
    { label: "My Profile", href: "/profile", icon: UserRound },
    { label: "Notice Board", href: "/notices", icon: Bell },
  ];

  const byRole: Partial<Record<UserRole, typeof common>> = {
    head: [
      { label: "Add Student", href: "/institution/admission", icon: Plus },
      { label: "Generate ID Card", href: "/id-cards/generate", icon: Download },
      { label: "Finance Reports", href: "/finance/reports", icon: Landmark },
      { label: "Manage Users", href: "/users-roles/all", icon: ShieldCheck },
    ],
    assistant_head: [
      { label: "Academic", href: "/academic", icon: BookOpen },
      { label: "Generate ID Card", href: "/id-cards/generate", icon: Download },
      { label: "Attendance Reports", href: "/attendance/reports", icon: CalendarCheck },
    ],
    class_teacher: [
      { label: "Mark Attendance", href: "/attendance/mark", icon: CalendarCheck },
      { label: "Class Results", href: "/academic/results", icon: GraduationCap },
      { label: "Student ID Cards", href: "/id-cards/generate", icon: Download },
    ],
    subject_teacher: [
      { label: "Enter Results", href: "/academic/results", icon: GraduationCap },
      { label: "Subjects", href: "/academic/subjects", icon: BookOpen },
    ],
    finance_officer: [
      { label: "Collect Fees", href: "/finance/collections", icon: CreditCard },
      { label: "Finance Reports", href: "/finance/reports", icon: FileText },
    ],
    student: [
      { label: "My Attendance", href: "/attendance/my-attendance", icon: CalendarCheck },
      { label: "My Fees", href: "/finance/my-fees", icon: CreditCard },
      { label: "Admit Card", href: "/documents/admit-cards", icon: Download },
      { label: "My ID Card", href: "/id-cards/my-card", icon: BadgeCheck },
    ],
    parent: [
      { label: "Parent Portal", href: "/parent-portal", icon: Users },
      { label: "My Fees", href: "/finance/my-fees", icon: CreditCard },
      { label: "Notices", href: "/notices", icon: Bell },
    ],
    staff: [
      { label: "Documents", href: "/documents", icon: FileText },
      { label: "My ID Card", href: "/id-cards/my-card", icon: BadgeCheck },
    ],
  };

  return [...(role ? byRole[role] || [] : []), ...common].slice(0, 6);
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary);
  const [composition, setComposition] = useState<CompositionPoint[]>(emptyComposition);
  const [attendance, setAttendance] = useState<ChartPoint[]>(emptyAttendance);
  const [feeTrend, setFeeTrend] = useState<ChartPoint[]>(emptyFeeTrend);
  const [notices, setNotices] = useState<NoticeItem[]>(emptyNotices);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'loading' | 'live' | 'empty'>('loading');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setDataSource('loading');

      try {
        const [summaryData, chartsData, compositionData, noticesData] = await Promise.all([
          api.dashboard.summary(),
          api.dashboard.charts(),
          api.dashboard.composition(),
          api.dashboard.recentNotices(),
        ]);

        if (!mounted) return;
        setSummary(normalizeSummary(summaryData));
        setComposition(normalizeComposition(compositionData));
        setAttendance(normalizeAttendance(chartsData));
        setFeeTrend(normalizeFeeTrend(chartsData));
        setNotices(normalizeNotices(noticesData));
        setDataSource('live');
      } catch {
        if (!mounted) return;
        setSummary(emptySummary);
        setComposition(emptyComposition);
        setAttendance(emptyAttendance);
        setFeeTrend(emptyFeeTrend);
        setNotices(emptyNotices);
        setDataSource('empty');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const quickActions = useMemo(() => getQuickActions(user?.role), [user?.role]);

  const stats = [
    { label: "Total Students", value: summary.totalStudents.toLocaleString(), helper: "Active student records", icon: Users, href: "/institution/admission" },
    { label: "Total Teachers", value: summary.totalTeachers.toLocaleString(), helper: "Teaching staff", icon: BookOpen, href: "/institution/teachers" },
    { label: "Total Staff", value: summary.totalStaff.toLocaleString(), helper: "Operational staff", icon: ShieldCheck, href: "/institution/staff" },
    { label: "Today Attendance", value: summary.todayAttendanceCount.toLocaleString(), helper: "Present today", icon: CalendarCheck, href: "/attendance/reports" },
    { label: "Monthly Fee Collection", value: money(summary.monthlyFeeCollection), helper: "Collected this month", icon: CreditCard, href: "/finance/reports" },
    { label: "Active Notices", value: summary.activeNotices.toLocaleString(), helper: "Published notices", icon: Bell, href: "/notices" },
    { label: "ID Cards Issued", value: summary.idCardsIssued.toLocaleString(), helper: "Total generated cards", icon: BadgeCheck, href: "/id-cards/reports" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <ShieldCheck className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-lg text-slate-600">Welcome{user?.name ? `, ${user.name}` : ""}. Role-based overview for {roleLabel(user?.role as UserRole | undefined)} operations.</p>
          <div className="mt-4 flex justify-center">
            <Badge
              variant="outline"
              className={`px-4 py-2 ${dataSource === 'live' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : dataSource === 'empty' ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-blue-200 bg-blue-50 text-blue-700'}`}
            >
              {dataSource === 'live' ? 'Live dashboard' : dataSource === 'empty' ? 'No live data yet' : 'Loading live data'}
            </Badge>
          </div>
        </div>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => {
            const colors = [
              'from-blue-500 to-blue-600',
              'from-emerald-500 to-emerald-600',
              'from-slate-500 to-slate-600',
              'from-amber-500 to-amber-600',
              'from-emerald-500 to-green-600',
              'from-amber-500 to-orange-600',
              'from-blue-500 to-indigo-600'
            ];
            return (
              <Link
                key={stat.label}
                href={stat.href}
                className="block rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
              <Card className={`relative overflow-hidden border-2 border-slate-200 bg-gradient-to-br ${colors[index % colors.length].replace('500', '50').replace('600', '100')} shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-300 hover:shadow-2xl`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${colors[index % colors.length]} opacity-10`}></div>
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                      <p className="text-2xl font-bold text-slate-900">{loading ? '...' : stat.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{stat.helper}</p>
                    </div>
                    <div className={`rounded-xl bg-gradient-to-r ${colors[index % colors.length]} p-3 text-white shadow-lg`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-7">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl xl:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Institution Composition</CardTitle>
              <CardDescription className="text-slate-600">Distribution of students, teachers, and staff</CardDescription>
            </CardHeader>
            <CardContent>
              <PieChartCard title="Institution Composition" data={composition} />
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl xl:col-span-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Attendance Overview</CardTitle>
              <CardDescription className="text-slate-600">Today's attendance statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChartCard title="Attendance Overview" data={attendance} xKey="name" yKey="value" />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-7">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl xl:col-span-4">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Monthly Fee Collection Trend</CardTitle>
              <CardDescription className="text-slate-600">Fee collection over the past months</CardDescription>
            </CardHeader>
            <CardContent>
              <LineChartCard title="Monthly Fee Collection Trend" data={feeTrend} xKey="name" yKey="value" />
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 shadow-xl xl:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-bold text-slate-900">Recent Notices</CardTitle>
              <CardDescription className="text-slate-600">Latest announcements from the institution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {notices.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-popover/60 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur-sm">
                  No recent notices are available from the live system yet.
                </div>
              ) : (
                notices.map((notice) => (
                  <div key={notice._id || notice.id || notice.title} className="rounded-lg border border-border bg-popover/60 p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{notice.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{notice.category || "General"}</p>
                      </div>
                      <Badge variant="outline" className={`capitalize ${notice.priority === 'high' ? 'border-red-200 bg-red-50 text-red-700' : notice.priority === 'medium' ? 'border-yellow-200 bg-yellow-50 text-yellow-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
                        {notice.priority || "normal"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">Quick Actions</CardTitle>
            <CardDescription className="text-slate-600">Actions are filtered for the current role and common workflows</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const colors = [
                'from-blue-500 to-blue-600',
                'from-green-500 to-green-600',
                'from-purple-500 to-purple-600',
                'from-orange-500 to-orange-600',
                'from-red-500 to-red-600',
                'from-indigo-500 to-indigo-600'
              ];
              return (
                <Button
                  key={`${action.label}-${action.href}`}
                  asChild
                  className={`h-24 flex-col gap-3 whitespace-normal px-4 text-center bg-gradient-to-r ${colors[index % colors.length]} hover:opacity-90 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105`}
                >
                  <Link href={action.href}>
                    <Icon className="h-6 w-6" />
                    <span className="text-sm font-semibold leading-4">{action.label}</span>
                  </Link>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
