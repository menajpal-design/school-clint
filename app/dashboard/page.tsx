"use client";

export const dynamic = "force-dynamic";

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
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types";

type QuickAction = {
  label: string;
  href: string;
  icon: typeof UserRound;
  description: string;
};

function roleLabel(role?: UserRole) {
  if (!role) return "Guest";
  return role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getQuickActions(role?: UserRole): QuickAction[] {
  const common: QuickAction[] = [
    { label: "My Profile", href: "/profile", icon: UserRound, description: "View and update your own profile." },
    { label: "Notice Board", href: "/notices", icon: Bell, description: "Read published school notices." },
  ];

  if (role === "student") {
    return [
      { label: "My Result", href: "/academic/results", icon: GraduationCap, description: "View your own published results only." },
      { label: "My Attendance", href: "/attendance/my-attendance", icon: CalendarCheck, description: "View your own attendance record." },
      { label: "Syllabus", href: "/academic/syllabus", icon: FileText, description: "View your class syllabus only." },
      { label: "Class Routine", href: "/academic/class-routine", icon: BookOpen, description: "View your class routine only." },
      { label: "Homework", href: "/homework", icon: BookOpen, description: "See today&apos;s assigned homework." },
      { label: "My ID Card", href: "/id-cards/my-card", icon: BadgeCheck, description: "Preview or download your ID card." },
    ];
  }

  if (role === "parent") {
    return [
      { label: "Parent Portal", href: "/parent-portal", icon: Users, description: "View child information." },
      { label: "Child Result", href: "/academic/results", icon: GraduationCap, description: "View child published results only." },
      { label: "Child Attendance", href: "/attendance/my-attendance", icon: CalendarCheck, description: "View child attendance." },
      { label: "Leave Application", href: "/leave-application", icon: CalendarCheck, description: "Apply for child leave." },
      { label: "Homework", href: "/homework", icon: BookOpen, description: "View child homework." },
      { label: "Notice Board", href: "/notices", icon: Bell, description: "Read published notices." },
    ];
  }

  if (role === "head" || role === "assistant_head") {
    return [
      { label: "Add Student", href: "/institution/admission", icon: Plus, description: "Admit a new student." },
      { label: "Students", href: "/institution/students", icon: Users, description: "Manage student records." },
      { label: "Results", href: "/academic/results", icon: GraduationCap, description: "Review, approve, or publish results." },
      { label: "Leave Review", href: "/leave-application", icon: CalendarCheck, description: "Approve or reject leave applications." },
      { label: "Finance Reports", href: "/finance/reports", icon: Landmark, description: "View finance reports." },
      { label: "SMS Monitoring", href: "/sms-monitoring", icon: Bell, description: "Monitor monthly SMS usage." },
    ];
  }

  if (role === "class_teacher") {
    return [
      { label: "Mark Attendance", href: "/attendance/mark", icon: CalendarCheck, description: "Mark assigned class attendance." },
      { label: "Class Results", href: "/academic/results", icon: GraduationCap, description: "Enter or manage class results." },
      { label: "Leave Review", href: "/leave-application", icon: CalendarCheck, description: "Review assigned student leave." },
      { label: "Homework", href: "/homework", icon: BookOpen, description: "Create class homework." },
      ...common,
    ].slice(0, 6);
  }

  if (role === "subject_teacher" || role === "teacher") {
    return [
      { label: "Enter Results", href: "/academic/results", icon: GraduationCap, description: "Enter results for assigned subjects." },
      { label: "Homework", href: "/homework", icon: BookOpen, description: "Create homework for students." },
      { label: "Class Routine", href: "/academic/class-routine", icon: CalendarCheck, description: "View or propose routine items." },
      ...common,
    ].slice(0, 6);
  }

  if (role === "finance_officer") {
    return [
      { label: "Collect Fees", href: "/finance/collections", icon: CreditCard, description: "Manage fee collection." },
      { label: "Finance Reports", href: "/finance/reports", icon: FileText, description: "View finance reports." },
      ...common,
    ].slice(0, 6);
  }

  if (role === "staff") {
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
  const quickActions = getQuickActions(user?.role as UserRole | undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Role-based dashboard for ${roleLabel(user?.role as UserRole | undefined)}. Only permitted actions are shown here.`}
        icon={ShieldCheck}
        status={<Badge variant="outline">{roleLabel(user?.role as UserRole | undefined)}</Badge>}
      />

      {(user?.role === "student" || user?.role === "parent") && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-800">
            Student/Parent accounts are view-only for academic data. They cannot add students, enter results, publish results, mark attendance, or access SMS monitoring.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Actions are filtered by your role and permission.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={`${action.label}-${action.href}`} asChild variant="outline" className="h-auto justify-start rounded-xl p-4 text-left">
                <Link href={action.href} className="flex w-full items-start gap-3">
                  <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{action.label}</span>
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">{action.description}</span>
                  </span>
                </Link>
              </Button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
