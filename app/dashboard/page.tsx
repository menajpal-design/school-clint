"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import * as Icons from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardQuickActions, normalizeUserRole } from "@/lib/permissions";

const iconMap: Record<string, any> = {
  BadgeCheck: Icons.BadgeCheck,
  Bell: Icons.Bell,
  BookOpen: Icons.BookOpen,
  CalendarCheck: Icons.CalendarCheck,
  CreditCard: Icons.CreditCard,
  FileText: Icons.FileText,
  GraduationCap: Icons.GraduationCap,
  Landmark: Icons.Landmark,
  Plus: Icons.Plus,
  ShieldCheck: Icons.ShieldCheck,
  UserRound: Icons.UserRound,
  Users: Icons.Users,
};

function roleLabel(role?: string) {
  if (!role) return "Guest";
  return role.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function Dashboard() {
  const { user } = useAuth();
  const normalizedRole = normalizeUserRole(user?.role);
  const quickActions = getDashboardQuickActions(user?.role);
  const HeaderIcon = Icons.ShieldCheck;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Role-based dashboard for ${roleLabel(normalizedRole)}. Only permitted actions are shown here.`}
        icon={HeaderIcon}
        status={<Badge variant="outline">{roleLabel(normalizedRole)}</Badge>}
      />

      {(normalizedRole === "student" || normalizedRole === "parent") && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-sm text-blue-800">
            Student/Parent accounts are view-only for academic data. They cannot add students, enter or publish results, mark attendance, or access SMS monitoring.
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Actions are filtered from the central permission matrix.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {quickActions.map((action) => {
            const Icon = iconMap[action.icon] || Icons.UserRound;
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
