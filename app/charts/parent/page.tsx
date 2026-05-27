"use client";

import { useEffect, useState } from "react";
import { BarChartCard } from "@/components/charts/BarChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { AttendanceChart } from "@/components/charts/AttendanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ParentChartsPage() {
  const [feeTrend, setFeeTrend] = useState<any[]>([]);
  const [attendanceOverview, setAttendanceOverview] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [finance] = await Promise.all([api.finance.dashboard()]);
        if (!mounted) return;
        setFeeTrend(Array.isArray(finance?.feeTrend) ? finance.feeTrend : finance?.fees || []);
      } catch (err) {
        if (!mounted) return;
        setFeeTrend([]);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Parent Charts</h2>
          <p className="text-sm text-muted-foreground">Child attendance and fee overview</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Child Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceChart />
              </CardContent>
            </Card>
          </div>

          <LineChartCard title="Fee Trend (Institution)" data={feeTrend} xKey="name" yKey="value" />
        </div>
      </div>
    </div>
  );
}
