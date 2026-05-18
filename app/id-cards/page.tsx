"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CreditCard, FileBarChart, Layers, RefreshCw, UserPlus, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function IDCardsIndex() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({});
  useEffect(() => { api.idCards.stats().then((s: any) => setStats(s)).catch(() => undefined); }, []);
  const canManageCards = ["head", "assistant_head", "staff"].includes(String(user?.role || ""));
  const canViewAdminCards = ["head", "assistant_head"].includes(String(user?.role || ""));
  const headerActions = canManageCards
    ? [
        { label: "Generate", href: "/id-cards/generate", icon: UserPlus, active: true },
        ...(canViewAdminCards ? [{ label: "Bulk Generate", href: "/id-cards/bulk-generate", icon: Users }] : []),
        ...(canViewAdminCards ? [{ label: "Reports", href: "/id-cards/reports", icon: FileBarChart }] : []),
      ]
    : [{ label: "My Card", href: "/id-cards/my-card", icon: CreditCard, active: true }];
  const quickLinks = canManageCards
    ? [
        ["Generate", "/id-cards/generate"],
        ["Admit Card", "/id-cards/admit-card"],
        ...(canViewAdminCards ? [["Bulk Generate", "/id-cards/bulk-generate"], ["Templates", "/id-cards/templates"], ["Renewal", "/id-cards/renewal"], ["Reports", "/id-cards/reports"]] : []),
        ["My Card", "/id-cards/my-card"],
      ]
    : [["My Card", "/id-cards/my-card"]];

  return (
    <div className="space-y-5">
      <PageHeader
        title="ID Card Dashboard"
        description="Manage issued cards, renewals, templates and downloads."
        icon={BadgeCheck}
        actions={headerActions}
      />
      {canManageCards && <div className="grid gap-4 md:grid-cols-6">
        <StatCard label="Total Issued" value={stats.totalIssued || stats.total || 0} icon={CreditCard} tone="blue" />
        <StatCard label="Student Cards" value={stats.studentCards || 0} icon={Users} />
        {canViewAdminCards && <StatCard label="Teacher Cards" value={stats.teacherCards || 0} icon={Users} tone="emerald" />}
        {canViewAdminCards && <StatCard label="Staff Cards" value={stats.staffCards || 0} icon={Users} tone="amber" />}
        <StatCard label="Expired Cards" value={stats.expiredCards || 0} icon={RefreshCw} tone="rose" />
        <StatCard label="Pending Renewal" value={stats.pendingRenewals || 0} icon={RefreshCw} tone="amber" />
      </div>}
      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {quickLinks.map(([label, href]) => <Button key={href} asChild variant="outline" className="h-20"><Link href={href}>{label}</Link></Button>)}
      </section>
    </div>
  );
}
