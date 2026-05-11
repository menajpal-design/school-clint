"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CreditCard, FileBarChart, Layers, RefreshCw, UserPlus, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function IDCardsIndex() {
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.idCards.stats().then((s) => setStats(s as any)).catch(() => undefined); }, []);
  return (
    <div className="space-y-5">
      <PageHeader
        title="ID Card Dashboard"
        description="Manage issued cards, renewals, templates and downloads."
        icon={BadgeCheck}
        actions={[
          { label: "Generate", href: "/id-cards/generate", icon: UserPlus, active: true },
          { label: "Bulk Generate", href: "/id-cards/bulk-generate", icon: Users },
          { label: "Reports", href: "/id-cards/reports", icon: FileBarChart },
        ]}
      />
      <div className="grid gap-4 md:grid-cols-6">
        <StatCard label="Total Issued" value={stats.totalIssued || stats.total || 0} icon={CreditCard} tone="blue" />
        <StatCard label="Student Cards" value={stats.studentCards || 0} icon={Users} />
        <StatCard label="Teacher Cards" value={stats.teacherCards || 0} icon={Users} tone="emerald" />
        <StatCard label="Staff Cards" value={stats.staffCards || 0} icon={Users} tone="amber" />
        <StatCard label="Expired Cards" value={stats.expiredCards || 0} icon={RefreshCw} tone="rose" />
        <StatCard label="Pending Renewal" value={stats.pendingRenewals || 0} icon={RefreshCw} tone="amber" />
      </div>
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {[
          ["Generate", "/id-cards/generate"],
          ["Bulk Generate", "/id-cards/bulk-generate"],
          ["My Card", "/id-cards/my-card"],
          ["Templates", "/id-cards/templates"],
          ["Renewal", "/id-cards/renewal"],
          ["Reports", "/id-cards/reports"],
        ].map(([label, href]) => <Button key={href} asChild variant="outline" className="h-20"><Link href={href}>{label}</Link></Button>)}
      </section>
    </div>
  );
}
