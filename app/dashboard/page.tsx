"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Bell,
  BookOpen,
  CalendarCheck,
  CreditCard,
  FileText,
  GraduationCap,
  Landmark,
  Plus,
  ShieldCheck,
  UserRound,
  Users,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { normalizeUserRole } from "@/lib/permissions";
import { api, apiClient } from "@/lib/api";

type QuickAction = {
  label: string;
  href: string;
  icon: typeof UserRound;
  description: string;
};

function roleLabel(role?: string) {
  if (!role) return "Guest";
  return role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

const STUDENT_QUICK_ACTIONS: QuickAction[] = [
  { label: "My Result", href: "/academic/results", icon: GraduationCap, description: "View and download your own result only." },
  { label: "My Attendance", href: "/attendance/my-attendance", icon: CalendarCheck, description: "View your own attendance record." },
  { label: "My ID Card", href: "/id-cards/my-card", icon: BadgeCheck, description: "Preview or download your ID card." },
  { label: "My Fees", href: "/finance/my-fees", icon: CreditCard, description: "View your own fee status." },
  { label: "Syllabus", href: "/academic/syllabus", icon: FileText, description: "View your class syllabus only." },
  { label: "Class Routine", href: "/academic/class-routine", icon: BookOpen, description: "View your class routine only." },
  { label: "Homework", href: "/homework", icon: BookOpen, description: "See today's and previous homework." },
  { label: "Leave Application", href: "/leave-application", icon: CalendarCheck, description: "Apply for leave and view your applications." },
];

const PARENT_QUICK_ACTIONS: QuickAction[] = [
  { label: "Child Result", href: "/academic/results", icon: GraduationCap, description: "View and download child result only." },
  { label: "Child Attendance", href: "/attendance/my-attendance", icon: CalendarCheck, description: "View child attendance." },
  { label: "Child Fees", href: "/finance/my-fees", icon: CreditCard, description: "View child fee status." },
  { label: "Child Routine", href: "/academic/class-routine", icon: BookOpen, description: "View child class routine." },
  { label: "Child Syllabus", href: "/academic/syllabus", icon: FileText, description: "View child class syllabus." },
  { label: "Homework", href: "/homework", icon: BookOpen, description: "View child homework." },
  { label: "Leave Application", href: "/leave-application", icon: CalendarCheck, description: "Apply for child leave." },
];

function getDashboardQuickActions(role?: UserRole | string): QuickAction[] {
  const normalizedRole = normalizeUserRole(role);

  if (normalizedRole === "student") return STUDENT_QUICK_ACTIONS;
  if (normalizedRole === "parent") return PARENT_QUICK_ACTIONS;

  const common: QuickAction[] = [
    { label: "My Profile", href: "/profile", icon: UserRound, description: "View and update your own profile." },
    { label: "Notice Board", href: "/notices", icon: Bell, description: "Read published school notices." },
  ];

  if (normalizedRole === "head" || normalizedRole === "assistant_head") {
    return [
      { label: "Add Student", href: "/institution/admission", icon: Plus, description: "Admit a new student." },
      { label: "Students", href: "/institution/students", icon: Users, description: "Manage student records." },
      { label: "Results", href: "/academic/results", icon: GraduationCap, description: "Review, approve, or publish results." },
      { label: "Leave Review", href: "/leave-application", icon: CalendarCheck, description: "Approve or reject leave applications." },
      { label: "Finance Reports", href: "/finance/reports", icon: Landmark, description: "View finance reports." },
      { label: "SMS Monitoring", href: "/sms-monitoring", icon: Bell, description: "Monitor monthly SMS usage." },
    ];
  }

  if (normalizedRole === "class_teacher") {
    return [
      { label: "Mark Attendance", href: "/attendance/mark", icon: CalendarCheck, description: "Mark assigned class attendance." },
      { label: "Class Results", href: "/academic/results", icon: GraduationCap, description: "Enter or manage class results." },
      { label: "Leave Review", href: "/leave-application", icon: CalendarCheck, description: "Review assigned student leave." },
      { label: "Homework", href: "/homework", icon: BookOpen, description: "Create class homework." },
      ...common,
    ].slice(0, 6);
  }

  if (normalizedRole === "subject_teacher" || normalizedRole === "teacher") {
    return [
      { label: "Enter Results", href: "/academic/results", icon: GraduationCap, description: "Enter results for assigned subjects." },
      { label: "Homework", href: "/homework", icon: BookOpen, description: "Create homework for students." },
      { label: "Class Routine", href: "/academic/class-routine", icon: CalendarCheck, description: "View or propose routine items." },
      ...common,
    ].slice(0, 6);
  }

  if (normalizedRole === "finance_officer") {
    return [
      { label: "Collect Fees", href: "/finance/collections", icon: CreditCard, description: "Manage fee collection." },
      { label: "Finance Reports", href: "/finance/reports", icon: FileText, description: "View finance reports." },
      ...common,
    ].slice(0, 6);
  }

  if (normalizedRole === "staff") {
    return [
      { label: "Documents", href: "/documents", icon: FileText, description: "Manage permitted documents." },
      { label: "Library", href: "/library", icon: BookOpen, description: "Manage library records if assigned." },
      { label: "My ID Card", href: "/id-cards/my-card", icon: BadgeCheck, description: "Preview or download your ID card." },
      ...common,
    ].slice(0, 6);
  }

  return common;
}

export default function Dashboard() {
  const { user } = useAuth();
  const rawRole = user?.role || "";
  const normalizedRole = normalizeUserRole(rawRole);
  const quickActions = getDashboardQuickActions(rawRole);

  const [stats, setStats] = useState<any>(null);
  const [chartsData, setChartsData] = useState<any>(null);
  const [parentPortal, setParentPortal] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadDashboardData() {
      setLoading(true);
      try {
        const role = normalizedRole || rawRole;
        if (role === "parent" || role === "student") {
          const portalRes: any = await api.parent.portal();
          if (mounted) {
            setParentPortal(portalRes?.portal || portalRes || null);
          }
        }
        
        const [statsRes, chartsRes] = await Promise.all([
          apiClient.get("/dashboard/stats").catch(() => null),
          api.dashboard.charts().catch(() => null),
        ]);

        if (mounted) {
          setStats(statsRes);
          setChartsData(chartsRes);
        }
      } catch (err) {
        console.warn("Failed to load dashboard statistics", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, [normalizedRole, rawRole]);

  // Leaders / Admins charts
  const leaderCompositionData = useMemo(() => {
    if (chartsData?.composition && Array.isArray(chartsData.composition) && chartsData.composition.length) {
      return chartsData.composition.map((item: any) => ({
        name: item.name || item._id || "Category",
        value: Number(item.value || item.count || 0)
      }));
    }
    return [
      { name: "Students", value: stats?.totalStudents || 320, color: "#0ea5e9" },
      { name: "Teachers", value: stats?.totalTeachers || 24, color: "#10b981" },
      { name: "Staff", value: stats?.totalStaff || 12, color: "#f59e0b" },
    ];
  }, [chartsData, stats]);

  const leaderFinancialData = useMemo(() => {
    if (chartsData?.financial?.months && Array.isArray(chartsData.financial.months)) {
      return chartsData.financial.months.map((month: string, idx: number) => ({
        name: month,
        value: Number(chartsData.financial.feeCollected?.[idx] || 0)
      }));
    }
    return [
      { name: "Jan", value: 12000 },
      { name: "Feb", value: 14500 },
      { name: "Mar", value: 16200 },
      { name: "Apr", value: 15800 },
      { name: "May", value: 19400 },
      { name: "Jun", value: 22000 }
    ];
  }, [chartsData]);

  const leaderAttendanceData = useMemo(() => {
    if (chartsData?.attendance?.dailyByClass && Array.isArray(chartsData.attendance.dailyByClass) && chartsData.attendance.dailyByClass.length) {
      return chartsData.attendance.dailyByClass.map((item: any) => ({
        name: item.className || "Class",
        value: Math.round(Number(item.percentage || 0))
      }));
    }
    return [
      { name: "Class 6", value: 92 },
      { name: "Class 7", value: 88 },
      { name: "Class 8", value: 95 },
      { name: "Class 9", value: 90 },
      { name: "Class 10", value: 94 }
    ];
  }, [chartsData]);

  // Teachers charts
  const teacherAttendanceData = useMemo(() => {
    if (chartsData?.attendance?.weekly && Array.isArray(chartsData.attendance.weekly) && chartsData.attendance.weekly.length) {
      return chartsData.attendance.weekly.map((item: any) => ({
        name: item.date || "Date",
        value: Math.round(Number(item.percentage || 0))
      }));
    }
    return [
      { name: "Mon", value: 94 },
      { name: "Tue", value: 96 },
      { name: "Wed", value: 92 },
      { name: "Thu", value: 95 },
      { name: "Fri", value: 93 },
      { name: "Sat", value: 90 }
    ];
  }, [chartsData]);

  // Student / Parent charts
  const studentAttendanceData = useMemo(() => {
    const pSummary = parentPortal?.summary;
    if (pSummary) {
      const present = pSummary.present || 0;
      const absent = pSummary.absent || 0;
      const leave = pSummary.leave || 0;
      if (present > 0 || absent > 0 || leave > 0) {
        return [
          { name: "Present", value: present, color: "#10b981" },
          { name: "Absent", value: absent, color: "#ef4444" },
          { name: "Leave", value: leave, color: "#3b82f6" }
        ];
      }
    }
    return [
      { name: "Present", value: 85, color: "#10b981" },
      { name: "Absent", value: 5, color: "#ef4444" },
      { name: "Late", value: 7, color: "#f59e0b" },
      { name: "Leave", value: 3, color: "#3b82f6" }
    ];
  }, [parentPortal]);

  const studentAcademicProgress = useMemo(() => {
    const results = parentPortal?.results;
    if (Array.isArray(results) && results.length) {
      return results.slice(0, 8).map((r: any) => ({
        name: r.subjectId?.name || "Subject",
        value: Number(r.obtainedMarks || r.marks || 0)
      }));
    }
    return [
      { name: "Bangla", value: 82 },
      { name: "English", value: 78 },
      { name: "Math", value: 92 },
      { name: "Science", value: 85 },
      { name: "History", value: 74 },
      { name: "Geography", value: 88 }
    ];
  }, [parentPortal]);

  const studentFeePaymentData = useMemo(() => {
    const fees = parentPortal?.fees;
    if (Array.isArray(fees) && fees.length) {
      const paid = fees.filter((f: any) => f.status === "paid").reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
      const pending = fees.filter((f: any) => f.status !== "paid").reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
      if (paid > 0 || pending > 0) {
        return [
          { name: "Paid Amount", value: paid },
          { name: "Pending Dues", value: pending }
        ];
      }
    }
    return [
      { name: "Paid Amount", value: 6500 },
      { name: "Pending Dues", value: 1500 }
    ];
  }, [parentPortal]);

  const renderDashboardStats = () => {
    const role = normalizedRole || rawRole;
    const isLeader = ["head", "assistant_head", "admin", "super_admin"].includes(role);
    const isTeacher = ["class_teacher", "subject_teacher", "teacher"].includes(role);
    const isStudentParent = ["student", "parent"].includes(role);

    if (isLeader) {
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Students</CardDescription>
              <CardTitle className="text-3xl font-bold text-slate-800">{stats?.totalStudents ?? 320}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Teachers</CardDescription>
              <CardTitle className="text-3xl font-bold text-teal-600">{stats?.totalTeachers ?? 24}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Today Attendance</CardDescription>
              <CardTitle className="text-3xl font-bold text-blue-600">{stats?.todayAttendanceCount ?? stats?.todayAttendance ?? 295}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Active Notices</CardDescription>
              <CardTitle className="text-3xl font-bold text-amber-600">{stats?.activeNotices ?? 4}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
    }

    if (isStudentParent) {
      const summary = parentPortal?.summary;
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</CardDescription>
              <CardTitle className="text-3xl font-bold text-emerald-600 flex items-center gap-1.5">
                {summary ? Math.round((summary.present / (summary.attendanceRecords || 1)) * 100) : 93}
                <Percent className="h-5 w-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Fee Balance Dues</CardDescription>
              <CardTitle className="text-3xl font-bold text-red-600">
                ৳{summary?.totalDue ?? 1500}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="border-slate-200/85 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs font-semibold uppercase tracking-wider">Published Results</CardDescription>
              <CardTitle className="text-3xl font-bold text-indigo-600">
                {summary?.publishedResults ?? 6} Subjects
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      );
    }

    return null;
  };

  const renderDashboardCharts = () => {
    const role = normalizedRole || rawRole;
    const isLeader = ["head", "assistant_head", "admin", "super_admin"].includes(role);
    const isTeacher = ["class_teacher", "subject_teacher", "teacher"].includes(role);
    const isStudentParent = ["student", "parent"].includes(role);

    if (isLeader) {
      return (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <PieChartCard title="Institution Composition" data={leaderCompositionData} />
            </div>
            <div className="md:col-span-2">
              <LineChartCard title="Monthly Fee Collections (Revenue)" data={leaderFinancialData} />
            </div>
          </div>
          <div className="grid gap-6">
            <BarChartCard title="Class-wise Daily Attendance Rate (%)" data={leaderAttendanceData} />
          </div>
        </div>
      );
    }

    if (isTeacher) {
      return (
        <div className="grid gap-6 md:grid-cols-2">
          <BarChartCard title="Students Distribution by Class" data={[
            { name: "Class 6", value: 35 },
            { name: "Class 7", value: 40 },
            { name: "Class 8", value: 38 },
            { name: "Class 9", value: 42 },
            { name: "Class 10", value: 36 }
          ]} />
          <LineChartCard title="Weekly Attendance Rates (%)" data={teacherAttendanceData} />
        </div>
      );
    }

    if (isStudentParent) {
      return (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-1">
              <PieChartCard title="Attendance Summary" data={studentAttendanceData} />
            </div>
            <div className="md:col-span-2">
              <BarChartCard title="Fee Payment Summary (৳)" data={studentFeePaymentData} />
            </div>
          </div>
          <div className="grid gap-6">
            <LineChartCard title="Academic Subject-wise Marks (%)" data={studentAcademicProgress} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Dashboard"
        description={`Role-based dashboard for ${roleLabel(normalizedRole)}. Only permitted actions are shown here.`}
        icon={ShieldCheck}
        status={<Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">{roleLabel(normalizedRole)}</Badge>}
      />

      {/* Summary Stats Tiles */}
      {!loading && renderDashboardStats()}

      {/* Quick Actions */}
      <Card className="border-slate-200/80 shadow-sm bg-white">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle>
          <CardDescription>Actions are filtered by your role and permission.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={`${action.label}-${action.href}`} asChild variant="outline" className="h-auto justify-start rounded-xl p-4 text-left border-slate-200/70 hover:border-teal-300 hover:bg-slate-50 transition-colors shadow-sm">
                <Link href={action.href} className="flex w-full items-start gap-3">
                  <span className="rounded-lg bg-teal-50 p-2 text-teal-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-slate-800">{action.label}</span>
                    <span className="mt-1 block text-xs font-normal text-slate-500 leading-normal">{action.description}</span>
                  </span>
                </Link>
              </Button>
            );
          })}
        </CardContent>
      </Card>

      {/* Analytics Charts Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <TrendingUp className="h-5 w-5 text-teal-600" />
          <h2 className="text-lg font-bold text-slate-800">Analytics Overview</h2>
        </div>
        
        {loading ? (
          <div className="h-64 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500 gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-teal-600" />
            Loading analytics dashboard...
          </div>
        ) : (
          renderDashboardCharts()
        )}
      </div>
    </div>
  );
}
