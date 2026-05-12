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

const mockSummary: DashboardSummary = {
  totalStudents: 845,
  totalTeachers: 42,
  totalStaff: 18,
  todayAttendanceCount: 791,
  monthlyFeeCollection: 428500,
  activeNotices: 7,
  idCardsIssued: 904,
};

const mockComposition = [
  { name: "Students", value: 845, color: "#2563eb" },
  { name: "Teachers", value: 42, color: "#059669" },
  { name: "Staff", value: 18, color: "#f59e0b" },
];

const mockAttendance = [
  { name: "Present", value: 791 },
  { name: "Absent", value: 42 },
  { name: "Late", value: 12 },
  { name: "Leave", value: 8 },
];

const mockFeeTrend = [
  { name: "Jan", value: 310000 },
  { name: "Feb", value: 345000 },
  { name: "Mar", value: 382000 },
  { name: "Apr", value: 401000 },
  { name: "May", value: 428500 },
];

const mockNotices: NoticeItem[] = [
  { id: "mock-1", title: "Half-yearly exam routine published", category: "Academic", priority: "high" },
  { id: "mock-2", title: "ID card renewal window opens this week", category: "ID Cards", priority: "medium" },
  { id: "mock-3", title: "Monthly fee collection report is ready", category: "Finance", priority: "normal" },
];

function normalizeSummary(data: any): DashboardSummary {
  return {
    totalStudents: Number(data?.totalStudents ?? mockSummary.totalStudents),
    totalTeachers: Number(data?.totalTeachers ?? mockSummary.totalTeachers),
    totalStaff: Number(data?.totalStaff ?? mockSummary.totalStaff),
    todayAttendanceCount: Number(data?.todayAttendanceCount ?? data?.todayAttendance ?? mockSummary.todayAttendanceCount),
    monthlyFeeCollection: Number(data?.monthlyFeeCollection ?? data?.monthlyFees ?? mockSummary.monthlyFeeCollection),
    activeNotices: Number(data?.activeNotices ?? mockSummary.activeNotices),
    idCardsIssued: Number(data?.idCardsIssued ?? data?.issuedIdCards ?? mockSummary.idCardsIssued),
  };
}

function normalizeComposition(data: any): CompositionPoint[] {
  const source = Array.isArray(data) ? data : Array.isArray(data?.composition) ? data.composition : [];
  if (!source.length) return mockComposition;
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
  if (!source.length) return mockAttendance;
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
  if (!source.length) return mockFeeTrend;
  return source.map((item: any, index: number) => ({
    name: item.name || item.month || item._id || `M${index + 1}`,
    value: Number(item.value || item.total || item.amount || item.collection || 0),
  }));
}

function normalizeNotices(data: any): NoticeItem[] {
  const source = Array.isArray(data) ? data : Array.isArray(data?.notices) ? data.notices : [];
  if (!source.length) return mockNotices;
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
  const [summary, setSummary] = useState<DashboardSummary>(mockSummary);
  const [composition, setComposition] = useState<CompositionPoint[]>(mockComposition);
  const [attendance, setAttendance] = useState<ChartPoint[]>(mockAttendance);
  const [feeTrend, setFeeTrend] = useState<ChartPoint[]>(mockFeeTrend);
  const [notices, setNotices] = useState<NoticeItem[]>(mockNotices);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      setLoading(true);
      setUsingFallback(false);

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
      } catch {
        if (!mounted) return;
        setSummary(mockSummary);
        setComposition(mockComposition);
        setAttendance(mockAttendance);
        setFeeTrend(mockFeeTrend);
        setNotices(mockNotices);
        setUsingFallback(true);
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
    { label: "Total Students", value: summary.totalStudents.toLocaleString(), helper: "Active student records", icon: Users, tone: "blue" as const },
    { label: "Total Teachers", value: summary.totalTeachers.toLocaleString(), helper: "Teaching staff", icon: BookOpen, tone: "emerald" as const },
    { label: "Total Staff", value: summary.totalStaff.toLocaleString(), helper: "Operational staff", icon: ShieldCheck, tone: "slate" as const },
    { label: "Today Attendance", value: summary.todayAttendanceCount.toLocaleString(), helper: "Present today", icon: CalendarCheck, tone: "amber" as const },
    { label: "Monthly Fee Collection", value: money(summary.monthlyFeeCollection), helper: "Collected this month", icon: CreditCard, tone: "emerald" as const },
    { label: "Active Notices", value: summary.activeNotices.toLocaleString(), helper: "Published notices", icon: Bell, tone: "amber" as const },
    { label: "ID Cards Issued", value: summary.idCardsIssued.toLocaleString(), helper: "Total generated cards", icon: BadgeCheck, tone: "blue" as const },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome${user?.name ? `, ${user.name}` : ""}. Role-based overview for ${roleLabel(user?.role as UserRole | undefined)} operations.`}
        icon={ShieldCheck}
        status={usingFallback ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Mock fallback</Badge> : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Live dashboard</Badge>}
        actions={[
          { label: "Mark Attendance", href: "/attendance/mark", icon: CalendarCheck },
          { label: "Generate ID Card", href: "/id-cards/generate", icon: BadgeCheck },
          { label: "Post Notice", href: "/notices", icon: Bell },
        ]}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            helper={stat.helper}
            icon={stat.icon}
            tone={stat.tone}
            loading={loading}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-7">
        <div className="xl:col-span-3">
          <PieChartCard title="Institution Composition" data={composition} />
        </div>
        <div className="xl:col-span-4">
          <BarChartCard title="Attendance Overview" data={attendance} xKey="name" yKey="value" />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-7">
        <div className="xl:col-span-4">
          <LineChartCard title="Monthly Fee Collection Trend" data={feeTrend} xKey="name" yKey="value" />
        </div>
        <Card className="border-slate-200 shadow-sm xl:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Recent Notices</CardTitle>
            <CardDescription>Latest announcements from the institution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {notices.map((notice) => (
              <div key={notice._id || notice.id || notice.title} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{notice.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{notice.category || "General"}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{notice.priority || "normal"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Actions are filtered for the current role and common workflows.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={`${action.label}-${action.href}`} asChild variant="outline" className="h-24 flex-col gap-2 whitespace-normal px-3 text-center">
                <Link href={action.href}>
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-semibold leading-4">{action.label}</span>
                </Link>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
