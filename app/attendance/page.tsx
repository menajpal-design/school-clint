"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ClipboardCheck, FileBarChart, UserCheck, Users } from "lucide-react";

import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type Overview = {
  today?: { total: number; present: number; absent: number; late: number; leave: number };
  classWise?: Array<{ className: string; present: number; absent: number; late: number; total: number; percentage: number }>;
  trend?: Array<{ date: string; percentage: number; present: number; total: number }>;
};

export default function AttendancePage() {
  const [data, setData] = useState<Overview>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const overview = await api.dashboard.attendanceOverview() as Overview;
        setData(overview || {});
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = data.today || { total: 0, present: 0, absent: 0, late: 0, leave: 0 };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Attendance Overview"
        description="Track today attendance, class-wise presence and weekly trend."
        icon={Users}
        actions={[
          { label: "Mark Attendance", href: "/attendance/mark", icon: ClipboardCheck, active: true },
          { label: "My Attendance", href: "/attendance/my-attendance", icon: UserCheck },
          { label: "Reports", href: "/attendance/reports", icon: FileBarChart },
        ]}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Today total" value={today.total} icon={Users} loading={loading} />
        <StatCard label="Present" value={today.present} icon={UserCheck} tone="emerald" loading={loading} />
        <StatCard label="Absent" value={today.absent} icon={BarChart3} tone="rose" loading={loading} />
        <StatCard label="Late" value={today.late} icon={BarChart3} tone="amber" loading={loading} />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <BarChartCard title="Class-wise attendance" data={(data.classWise || []).map((item) => ({ name: item.className || "Class", value: item.percentage || 0 }))} />
        <LineChartCard title="Attendance trend" data={(data.trend || []).map((item) => ({ name: item.date, value: item.percentage || 0 }))} />
      </div>

      <section className="grid gap-3 md:grid-cols-3">
        <Button asChild variant="outline" className="h-20 justify-start px-5"><Link href="/attendance/mark">Mark Attendance</Link></Button>
        <Button asChild variant="outline" className="h-20 justify-start px-5"><Link href="/attendance/my-attendance">My Attendance</Link></Button>
        <Button asChild variant="outline" className="h-20 justify-start px-5"><Link href="/attendance/reports">Attendance Reports</Link></Button>
      </section>
    </div>
  );
}
