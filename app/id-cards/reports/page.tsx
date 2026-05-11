"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, Download, RefreshCw } from "lucide-react";

import { LineChartCard } from "@/components/charts/LineChartCard";
import { PieChartCard } from "@/components/charts/PieChartCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { api } from "@/lib/api";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.idCards.stats().then((s) => setStats(s as any)).catch(() => undefined); }, []);
  const pie = (stats.byType || []).map((item: any) => ({ name: item._id || "unknown", value: item.count || 0 }));
  return <div className="space-y-5">
    <PageHeader title="ID Card Reports" description="Track issued cards, downloads, expiries and renewal requests." icon={BadgeCheck} />
    <div className="grid gap-4 md:grid-cols-4"><StatCard label="Issued Cards" value={stats.totalIssued || stats.total || 0} icon={BadgeCheck} /><StatCard label="Downloads" value={stats.downloads || 0} icon={Download} tone="blue" /><StatCard label="Expired" value={stats.expiredCards || 0} icon={RefreshCw} tone="rose" /><StatCard label="Renewal Requests" value={stats.pendingRenewals || 0} icon={RefreshCw} tone="amber" /></div>
    <div className="grid gap-5 xl:grid-cols-2"><PieChartCard title="Card type distribution" data={pie} /><LineChartCard title="Monthly downloads" data={stats.monthlyDownloads || []} /></div>
  </div>;
}
