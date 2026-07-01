"use client";

import { useEffect, useState, useMemo } from "react";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { isFreeLifetimePlan } from "@/lib/permissions";
import { PlanLockedFeature } from "@/components/shared/PlanLockedFeature";

export default function ChartsPage() {
  const { user } = useAuth();
  const isFree = isFreeLifetimePlan(user);
  const [chartsData, setChartsData] = useState<any>(null);
  const [composition, setComposition] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [charts, comp] = await Promise.all([
          api.dashboard.charts().catch(() => null),
          api.dashboard.composition().catch(() => null)
        ]);
        if (!mounted) return;
        setChartsData(charts);
        setComposition(Array.isArray(comp) ? comp : []);
      } catch (err) {
        if (!mounted) return;
        setChartsData(null);
        setComposition([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const compData = useMemo(() => {
    if (composition && composition.length) {
      return composition.map((item: any) => ({
        name: item.name || item._id || "Category",
        value: Number(item.value || item.count || 0)
      }));
    }
    return [
      { name: "Students", value: 320, color: "#0ea5e9" },
      { name: "Teachers", value: 24, color: "#10b981" },
      { name: "Staff", value: 12, color: "#f59e0b" },
    ];
  }, [composition]);

  const feeTrendData = useMemo(() => {
    if (chartsData?.financial?.months && Array.isArray(chartsData.financial.months) && chartsData.financial.months.length) {
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

  const attendanceData = useMemo(() => {
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

  if (isFree) {
    return (
      <div className="p-4 md:p-6">
        <PlanLockedFeature
          title="Charts এবং Visual Analytics লক করা আছে"
          description="স্টুডেন্টদের দৈনিক ট্রেন্ড এবং রিপোর্ট চার্ট দেখতে দয়া করে paid সাবস্ক্রিপশন চালু করুন।"
          featureName="Analytics Charts"
          fullPage
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Detailed visual statistics and reports for your school</p>
        </div>
      </div>

      {loading ? (
        <div className="h-64 rounded-xl border border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-500 gap-2">
          <div className="h-6 w-6 animate-spin border-2 border-teal-500 border-t-transparent rounded-full" />
          Loading charts data...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-1">
            <PieChartCard title="Institution Composition" data={compData} />
          </div>

          <div>
            <Card className="border-border bg-card shadow-lg shadow-slate-900/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-foreground">Attendance Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceChart />
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <LineChartCard title="Fee Trend (Revenue)" data={feeTrendData} xKey="name" yKey="value" />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <BarChartCard title="Class-wise Attendance Rate (%)" data={attendanceData} xKey="name" yKey="value" />
          </div>
        </div>
      )}
    </div>
  );
}
