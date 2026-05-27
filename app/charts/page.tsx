"use client";

import { useEffect, useState } from "react";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ChartsPage() {
  const [chartsData, setChartsData] = useState<any>(null);
  const [composition, setComposition] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const [charts, comp] = await Promise.all([api.dashboard.charts(), api.dashboard.composition()]);
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

  const attendance = Array.isArray(chartsData?.attendance) ? chartsData.attendance : chartsData ? chartsData : [];
  const feeTrend = Array.isArray(chartsData?.feeTrend) ? chartsData.feeTrend : (chartsData?.feeTrend || chartsData?.fees || []);

  return (
    <div className="p-4 md:p-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-1">
          <PieChartCard title="Institution Composition" data={composition} />
        </div>

        <div>
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle>Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceChart />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <LineChartCard title="Fee Trend" data={feeTrend} xKey="name" yKey="value" />
        </div>

        <div className="md:col-span-2 lg:col-span-3">
          <BarChartCard title="Attendance Overview" data={attendance} xKey="name" yKey="value" />
        </div>
      </div>
    </div>
  );
}
