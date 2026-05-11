"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarClock,
  FileText,
  GraduationCap,
  LayoutList,
} from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api";

type AcademicSummary = {
  classes: any[];
  subjects: any[];
  exams: any[];
  results: any[];
};

const mockAcademic: AcademicSummary = {
  classes: [
    { name: "Class Six", section: "A", students: 48, status: "active" },
    { name: "Class Seven", section: "B", students: 44, status: "active" },
    { name: "Class Eight", section: "A", students: 51, status: "active" },
  ],
  subjects: [
    { name: "Mathematics", code: "MATH", type: "core" },
    { name: "English", code: "ENG", type: "core" },
    { name: "Science", code: "SCI", type: "core" },
    { name: "ICT", code: "ICT", type: "optional" },
  ],
  exams: [
    { name: "Weekly Test", type: "weekly", status: "upcoming" },
    { name: "Half-yearly Exam", type: "term", status: "scheduled" },
  ],
  results: [
    { exam: "Weekly Test", status: "draft" },
    { exam: "Monthly Test", status: "review" },
    { exam: "Class Test", status: "published" },
  ],
};

const quickLinks = [
  {
    title: "Classes",
    description: "Manage classes, sections, shifts and class teachers.",
    href: "/academic/classes",
    icon: GraduationCap,
    tone: "bg-blue-50 text-blue-700",
  },
  {
    title: "Subjects",
    description: "Assign subjects to classes and teachers.",
    href: "/academic/subjects",
    icon: BookOpen,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Exams",
    description: "Create exam routines, types and schedules.",
    href: "/academic/exams",
    icon: CalendarClock,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    title: "Results",
    description: "Enter marks, approve workflow and publish results.",
    href: "/academic/results",
    icon: BarChart3,
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Report Cards",
    description: "Preview, print and download student report cards.",
    href: "/academic/report-card",
    icon: FileText,
    tone: "bg-slate-100 text-slate-700",
  },
];

function normalizeAcademic(data: any): AcademicSummary {
  return {
    classes: Array.isArray(data?.classes) ? data.classes : mockAcademic.classes,
    subjects: Array.isArray(data?.subjects) ? data.subjects : mockAcademic.subjects,
    exams: Array.isArray(data?.exams) ? data.exams : mockAcademic.exams,
    results: Array.isArray(data?.results) ? data.results : mockAcademic.results,
  };
}

function getStatusCount(items: any[], status: string) {
  return items.filter((item) => String(item?.status || "").toLowerCase() === status).length;
}

export default function AcademicPage() {
  const [summary, setSummary] = useState<AcademicSummary>(mockAcademic);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadAcademic() {
      setLoading(true);
      setUsingFallback(false);

      try {
        const data = await apiClient.get("/academic");
        if (!mounted) return;
        setSummary(normalizeAcademic(data));
      } catch {
        if (!mounted) return;
        setSummary(mockAcademic);
        setUsingFallback(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAcademic();

    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => [
    {
      label: "Classes",
      value: summary.classes.length.toLocaleString(),
      helper: "Active class structure",
      icon: GraduationCap,
      tone: "blue" as const,
    },
    {
      label: "Subjects",
      value: summary.subjects.length.toLocaleString(),
      helper: "Assigned curriculum",
      icon: BookOpen,
      tone: "emerald" as const,
    },
    {
      label: "Exams",
      value: summary.exams.length.toLocaleString(),
      helper: "Upcoming and scheduled",
      icon: CalendarClock,
      tone: "amber" as const,
    },
    {
      label: "Results",
      value: summary.results.length.toLocaleString(),
      helper: `${getStatusCount(summary.results, "published")} published`,
      icon: BarChart3,
      tone: "rose" as const,
    },
  ], [summary]);

  const recentActivity = [
    ...summary.exams.slice(0, 2).map((exam) => ({
      title: exam.name || "Exam schedule",
      meta: exam.type || "Exam",
      status: exam.status || "scheduled",
    })),
    ...summary.results.slice(0, 3).map((result) => ({
      title: result.exam || result.examId?.name || "Result workflow",
      meta: "Result",
      status: result.status || "draft",
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <PageHeader
        title="Academic Overview"
        description="Manage classes, subjects, exams, results and report card workflows from one academic control center."
        icon={LayoutList}
        status={usingFallback ? <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">Mock fallback</Badge> : <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Live academic data</Badge>}
        actions={[
          { label: "Classes", href: "/academic/classes", icon: GraduationCap },
          { label: "Subjects", href: "/academic/subjects", icon: BookOpen },
          { label: "Exams", href: "/academic/exams", icon: CalendarClock },
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

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Card key={link.href} className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${link.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{link.title}</CardTitle>
                <CardDescription className="leading-6">{link.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={link.href}>
                    Open
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Academic Summary</CardTitle>
            <CardDescription>Current class and subject setup snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {summary.classes.slice(0, 4).map((classItem, index) => (
              <div key={classItem._id || classItem.id || index} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{classItem.name || `Class ${index + 1}`}</p>
                    <p className="mt-1 text-xs text-slate-500">Section {classItem.section || classItem.sections?.[0] || "N/A"}</p>
                  </div>
                  <Badge variant="outline">{classItem.status || "active"}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent Academic Activity</CardTitle>
            <CardDescription>Exam and result workflow updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.map((item, index) => (
              <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.meta}</p>
                  </div>
                  <Badge variant="outline" className="capitalize">{item.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
