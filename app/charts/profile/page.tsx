"use client";

import { useEffect, useState } from "react";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { LineChartCard } from "@/components/charts/LineChartCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ProfileChartsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [p, c] = await Promise.all([api.institution.profile(), api.dashboard.charts()]);
        if (!mounted) return;
        setProfile(p?.institution || p);
        setCharts(c);
      } catch (err) {
        if (!mounted) return;
        setProfile(null);
        setCharts(null);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const composition = Array.isArray(charts?.composition) ? charts.composition : charts || [];
  const feeTrend = Array.isArray(charts?.feeTrend) ? charts.feeTrend : charts?.fees || [];

  return (
    <div className="p-4 md:p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Institution Profile Charts</h2>
          <p className="text-sm text-muted-foreground">Charts derived from your institution data</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <PieChartCard title="Composition" data={composition} />
          <LineChartCard title="Fee Trend" data={feeTrend} xKey="name" yKey="value" />
        </div>
      </div>
    </div>
  );
}
