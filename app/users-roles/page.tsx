"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Users, UserCheck, ListChecks } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function UsersRolesPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api.users.getAll().then((data: any) => setUsers(data.users || [])).catch(() => setUsers([]));
  }, []);

  const roleCounts = useMemo(() => 
    users.reduce((acc: Record<string, number>, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}), [users]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Users & Roles"
        description="Review active users, role distribution and role management links."
        icon={Users}
        actions={[
          <Button key="all-users" asChild>
            <Link href="/users-roles/all">
              <Users className="mr-2 h-4 w-4" />
              All Users
            </Link>
          </Button>,
          <Button key="permissions" asChild variant="outline">
            <Link href="/users-roles/permissions">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Permissions Matrix
            </Link>
          </Button>
        ]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Users" value={users.length} icon={Users} tone="blue" />
        <StatCard label="Active Users" value={users.filter((user) => user.isActive !== false).length} icon={UserCheck} tone="emerald" />
        <StatCard label="Roles" value={Object.keys(roleCounts).length} icon={ListChecks} tone="amber" />
      </div>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Role Distribution</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(roleCounts).map(([role, count]) => (
            <div key={role} className="rounded-md border border-border p-4">
              <div className="text-sm capitalize text-muted-foreground">
                {role.replace(/_/g, " ")}
              </div>
              <div className="mt-1 text-2xl font-semibold">{count}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Quick Links</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/users-roles/all">
              <Users className="mr-2 h-4 w-4" />
              All Users
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/users-roles/permissions">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Permissions Matrix
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
