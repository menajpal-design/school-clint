"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { BadgeCheck, Bell, BookOpen, CalendarCheck, CreditCard, FileText, GraduationCap, Landmark, Plus, ShieldCheck, UserRound, Users, TrendingUp, Percent, CheckCircle2, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { PlanLockedFeature } from "@/components/shared/PlanLockedFeature";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";
import { canAccessPath, isFreeLifetimePlan, isPlanLockedForUser, normalizeUserRole } from "@/lib/permissions";
import { api, apiClient } from "@/lib/api";

type QuickAction = { label: string; href: string; icon: typeof UserRound; description: string; locked?: boolean; };
function roleLabel(role?: string) { if (!role) return "Guest"; return role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }

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
  const common: QuickAction[] = [{ label: "My Profile", href: "/profile", icon: UserRound, description: "View and update your own profile." }, { label: "Notice Board", href: "/notices", icon: Bell, description: "Read published school notices." }];
  if (normalizedRole === "head" || normalizedRole === "assistant_head") return [{ label: "Add Student", href: "/institution/admission", icon: Plus, description: "Admit a new student." }, { label: "Students", href: "/institution/students", icon: Users, description: "Manage student records." }, { label: "Results", href: "/academic/results", icon: GraduationCap, description: "Review, approve, or publish results." }, { label: "Leave Review", href: "/leave-application", icon: CalendarCheck, description: "Approve or reject leave applications." }, { label: "Finance Reports", href: "/finance/reports", icon: Landmark, description: "View finance reports." }, { label: "SMS Monitoring", href: "/sms-monitoring", icon: Bell, description: "Monitor monthly SMS usage." }];
  if (normalizedRole === "class_teacher") return [{ label: "Mark Attendance", href: "/attendance/mark", icon: CalendarCheck, description: "Mark assigned class attendance." }, { label: "Class Results", href: "/academic/results", icon: GraduationCap, description: "Enter or manage class results." }, { label: "Leave Review", href: "/leave-application", icon: CalendarCheck, description: "Review assigned student leave." }, { label: "Homework", href: "/homework", icon: BookOpen, description: "Create class homework." }, ...common].slice(0, 6);
  if (normalizedRole === "subject_teacher" || normalizedRole === "teacher") return [{ label: "Enter Results", href: "/academic/results", icon: GraduationCap, description: "Enter results for assigned subjects." }, { label: "Homework", href: "/homework", icon: BookOpen, description: "Create homework for students." }, { label: "Class Routine", href: "/academic/class-routine", icon: CalendarCheck, description: "View or propose routine items." }, ...common].slice(0, 6);
  if (normalizedRole === "finance_officer") return [{ label: "Collect Fees", href: "/finance/collections", icon: CreditCard, description: "Manage fee collection." }, { label: "Finance Reports", href: "/finance/reports", icon: FileText, description: "View finance reports." }, ...common].slice(0, 6);
  if (normalizedRole === "staff") return [{ label: "Documents", href: "/documents", icon: FileText, description: "Manage permitted documents." }, { label: "Library", href: "/library", icon: BookOpen, description: "Manage library records if assigned." }, { label: "My ID Card", href: "/id-cards/my-card", icon: BadgeCheck, description: "Preview or download your ID card." }, ...common].slice(0, 6);
  return common;
}

export default function Dashboard() {
  const { user } = useAuth();
  const rawRole = user?.role || "";
  const normalizedRole = normalizeUserRole(rawRole);
  const canUseAnalytics = !isFreeLifetimePlan(user);
  const quickActions = useMemo(
    () => getDashboardQuickActions(rawRole)
      .filter((action) => canAccessPath(user, action.href))
      .map((action) => ({ ...action, locked: isPlanLockedForUser(user, action.href) })),
    [rawRole, user]
  );
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
          if (mounted) setParentPortal(portalRes?.portal || portalRes || null);
        }
        const [statsRes, chartsRes] = await Promise.all([
          apiClient.get("/dashboard/stats").catch(() => null),
          canUseAnalytics ? api.dashboard.charts().catch(() => null) : Promise.resolve(null)
        ]);
        if (mounted) { setStats(statsRes); setChartsData(chartsRes); }
      } catch (err) { console.warn("Failed to load dashboard statistics", err); }
      finally { if (mounted) setLoading(false); }
    }
    loadDashboardData();
    return () => { mounted = false; };
  }, [canUseAnalytics, normalizedRole, rawRole]);

  const leaderCompositionData = useMemo(() => {
    if (chartsData?.composition && Array.isArray(chartsData.composition) && chartsData.composition.length) return chartsData.composition.map((item: any) => ({ name: item.name || item._id || "Category", value: Number(item.value || item.count || 0) }));
    return [{ name: "Students", value: stats?.totalStudents || 0 }, { name: "Teachers", value: stats?.totalTeachers || 0 }, { name: "Staff", value: stats?.totalStaff || 0 }];
  }, [chartsData, stats]);
  const leaderFinancialData = useMemo(() => chartsData?.financial?.months && Array.isArray(chartsData.financial.months) ? chartsData.financial.months.map((month: string, idx: number) => ({ name: month, value: Number(chartsData.financial.feeCollected?.[idx] || 0) })) : [], [chartsData]);
  const leaderAttendanceData = useMemo(() => {
    const rows = chartsData?.attendance?.dailyByClass;
    if (!Array.isArray(rows)) return [];
    return rows.map((item: any) => ({ name: item.className || item.name || "Unassigned", value: Math.max(0, Math.min(100, Math.round(Number(item.percentage || item.rate || 0)))) })).filter((item: any) => item.name && Number.isFinite(item.value));
  }, [chartsData]);
  const teacherAttendanceData = useMemo(() => chartsData?.attendance?.weekly && Array.isArray(chartsData.attendance.weekly) ? chartsData.attendance.weekly.map((item: any) => ({ name: item.date || "Date", value: Math.round(Number(item.percentage || 0)) })) : [], [chartsData]);
  const studentAttendanceData = useMemo(() => {
    const pSummary = parentPortal?.summary;
    if (pSummary) {
      const present = pSummary.present || 0, absent = pSummary.absent || 0, leave = pSummary.leave || 0;
      if (present > 0 || absent > 0 || leave > 0) return [{ name: "Present", value: present }, { name: "Absent", value: absent }, { name: "Leave", value: leave }];
    }
    return [];
  }, [parentPortal]);
  const studentAcademicProgress = useMemo(() => Array.isArray(parentPortal?.results) && parentPortal.results.length ? parentPortal.results.slice(0, 8).map((r: any) => ({ name: r.subjectId?.name || "Subject", value: Number(r.obtainedMarks || r.marks || 0) })) : [], [parentPortal]);
  const studentFeePaymentData = useMemo(() => {
    const fees = parentPortal?.fees;
    if (Array.isArray(fees) && fees.length) {
      const paid = fees.filter((f: any) => f.status === "paid").reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
      const pending = fees.filter((f: any) => f.status !== "paid").reduce((sum: number, f: any) => sum + Number(f.amount || 0), 0);
      return [{ name: "Paid Amount", value: paid }, { name: "Pending Dues", value: pending }];
    }
    return [];
  }, [parentPortal]);

  const renderDashboardStats = () => {
    const role = normalizedRole || rawRole;
    const isLeader = ["head", "assistant_head", "admin", "super_admin"].includes(role);
    const isStudentParent = ["student", "parent"].includes(role);
    if (isLeader) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Students</CardDescription><CardTitle className="text-3xl font-bold text-slate-800">{stats?.totalStudents ?? 0}</CardTitle></CardHeader></Card><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Total Teachers</CardDescription><CardTitle className="text-3xl font-bold text-teal-600">{stats?.totalTeachers ?? 0}</CardTitle></CardHeader></Card><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Today Attendance</CardDescription><CardTitle className="text-3xl font-bold text-blue-600">{stats?.todayAttendanceCount ?? stats?.todayAttendance ?? 0}</CardTitle></CardHeader></Card><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Active Notices</CardDescription><CardTitle className="text-3xl font-bold text-amber-600">{stats?.activeNotices ?? 0}</CardTitle></CardHeader></Card></div>;
    if (isStudentParent) { const summary = parentPortal?.summary; return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Attendance Rate</CardDescription><CardTitle className="text-3xl font-bold text-emerald-600 flex items-center gap-1.5">{summary ? Math.round((summary.present / (summary.attendanceRecords || 1)) * 100) : 0}<Percent className="h-5 w-5 text-emerald-500" /></CardTitle></CardHeader></Card><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Fee Balance Dues</CardDescription><CardTitle className="text-3xl font-bold text-red-600">৳{summary?.totalDue ?? 0}</CardTitle></CardHeader></Card><Card className="border-slate-200/85 bg-white shadow-sm"><CardHeader className="pb-2"><CardDescription className="text-xs font-semibold uppercase tracking-wider">Published Results</CardDescription><CardTitle className="text-3xl font-bold text-indigo-600">{summary?.publishedResults ?? 0} Subjects</CardTitle></CardHeader></Card></div>; }
    return null;
  };

  const EmptyChart = ({ message }: { message: string }) => <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{message}</div>;
  const renderDashboardCharts = () => {
    const role = normalizedRole || rawRole;
    const isLeader = ["head", "assistant_head", "admin", "super_admin"].includes(role);
    const isTeacher = ["class_teacher", "subject_teacher", "teacher"].includes(role);
    const isStudentParent = ["student", "parent"].includes(role);
    if (isLeader) return <div className="space-y-6"><div className="grid gap-6 md:grid-cols-3"><div className="md:col-span-1"><PieChartCard title="Institution Composition" data={leaderCompositionData} /></div><div className="md:col-span-2">{leaderFinancialData.length ? <LineChartCard title="Monthly Fee Collections (Revenue)" data={leaderFinancialData} /> : <EmptyChart message="No fee collection data found." />}</div></div><div className="grid gap-6">{leaderAttendanceData.length ? <BarChartCard title="Class-wise Daily Attendance Rate (%)" data={leaderAttendanceData} /> : <EmptyChart message="No class attendance data found for today. Mark attendance first to see dynamic rates." />}</div></div>;
    if (isTeacher) return <div className="grid gap-6 md:grid-cols-2"><EmptyChart message="Students distribution will appear after class data is available." />{teacherAttendanceData.length ? <LineChartCard title="Weekly Attendance Rates (%)" data={teacherAttendanceData} /> : <EmptyChart message="No weekly attendance data found." />}</div>;
    if (isStudentParent) return <div className="space-y-6"><div className="grid gap-6 md:grid-cols-3"><div className="md:col-span-1">{studentAttendanceData.length ? <PieChartCard title="Attendance Summary" data={studentAttendanceData} /> : <EmptyChart message="No attendance summary found." />}</div><div className="md:col-span-2">{studentFeePaymentData.length ? <BarChartCard title="Fee Payment Summary (৳)" data={studentFeePaymentData} /> : <EmptyChart message="No fee payment data found." />}</div></div><div className="grid gap-6">{studentAcademicProgress.length ? <LineChartCard title="Academic Subject-wise Marks (%)" data={studentAcademicProgress} /> : <EmptyChart message="No published marks found." />}</div></div>;
    return null;
  };

  return <div className="space-y-6 p-4 md:p-6"><PageHeader title="Dashboard" description={`Role-based dashboard for ${roleLabel(normalizedRole)}. Only permitted actions are shown here.`} icon={ShieldCheck} status={<Badge variant="outline" className="border-teal-200 bg-teal-50 text-teal-700">{roleLabel(normalizedRole)}</Badge>} />{!loading && renderDashboardStats()}<Card className="border-slate-200/80 shadow-sm bg-white"><CardHeader className="pb-3 border-b border-slate-100"><CardTitle className="text-base font-semibold text-slate-800">Quick Actions</CardTitle><CardDescription>Actions are filtered by your role and permission.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pt-5">{quickActions.map((action) => { const Icon = action.icon; return <Button key={`${action.label}-${action.href}`} asChild variant="outline" className={`h-auto justify-start rounded-xl p-4 text-left border-slate-200/70 hover:border-teal-300 hover:bg-slate-50 transition-colors shadow-sm ${action.locked ? "border-amber-200 bg-amber-50/40" : ""}`}><Link href={action.href} className="flex w-full items-start gap-3"><span className={`rounded-lg p-2 ${action.locked ? "bg-amber-100 text-amber-700" : "bg-teal-50 text-teal-600"}`}><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className={`block font-semibold text-slate-800 ${action.locked ? "blur-[1px]" : ""}`}>{action.label}</span><span className="mt-1 block text-xs font-normal text-slate-500 leading-normal">{action.locked ? "এই action paid package-এ চালু হবে। আপডেট করলে ব্যবহার করতে পারবেন।" : action.description}</span></span>{action.locked && <Badge variant="outline" className="border-amber-300 bg-white text-amber-700">Upgrade</Badge>}</Link></Button>; })}</CardContent></Card><div className="space-y-4"><div className="flex items-center gap-2 border-b border-slate-200 pb-2"><TrendingUp className="h-5 w-5 text-teal-600" /><h2 className="text-lg font-bold text-slate-800">Analytics Overview</h2></div>{canUseAnalytics ? (loading ? <div className="h-64 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500 gap-2"><RefreshCw className="h-6 w-6 animate-spin text-teal-600" />Loading analytics dashboard...</div> : renderDashboardCharts()) : <PlanLockedFeature featureName="Analytics Overview" description="Dashboard analytics, charts, profile charts এবং visit analytics paid subscription ছাড়া চালু হবে না। প্যাকেজ আপডেট করলে এই অংশের সব chart দেখা যাবে।" />}</div></div>;
}
