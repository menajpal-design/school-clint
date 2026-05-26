"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import ResponsiveTable from '@/components/shared/ResponsiveTable';
import { api } from "@/lib/api";

const operations = ["dashboard", "academic", "attendance", "finance", "documents", "id_cards", "notices", "users", "settings"];
const platformRoles = ["admin", "super_admin"];
const allRoles = ["admin", "super_admin", "head", "assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff", "student", "parent", "committee_member"];
const schoolManagedRoles = ["assistant_head", "class_teacher", "subject_teacher", "teacher", "finance_officer", "staff", "student", "parent", "committee_member"];

export default function PermissionsPage() {
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    Promise.allSettled([api.users.permissions(), api.auth.profile()]).then(([permissionsResult, profileResult]) => {
      if (permissionsResult.status === "fulfilled") setMatrix((permissionsResult.value as any).matrix || {});
      if (profileResult.status === "fulfilled") setProfile((profileResult.value as any).user);
    });
  }, []);

  const roles = useMemo(() => {
    const allowed = platformRoles.includes(profile?.role) ? allRoles : schoolManagedRoles;
    const dynamic = Object.keys(matrix).filter((role) => allowed.includes(role));
    return dynamic.length ? dynamic : allowed;
  }, [matrix, profile?.role]);

  const canEdit = ["admin", "super_admin", "head"].includes(profile?.role);
  const toggle = (role: string, operation: string, checked: boolean) => {
    setMatrix((current) => {
      const set = new Set(current[role] || []);
      checked ? set.add(operation) : set.delete(operation);
      return { ...current, [role]: [...set] };
    });
  };

  const save = async () => {
    await api.users.updatePermissions(matrix);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Permissions Matrix" description="Manage role access across core school operations." icon={ShieldCheck} actions={canEdit ? [{ label: "Save Permissions", onClick: save, icon: ShieldCheck }] : []} />
      {!canEdit && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Only Head or Admin users can update permissions.</div>}
      <section className="overflow-auto rounded-lg border border-border bg-card shadow-sm p-4">
        <ResponsiveTable
          columns={['Operation', ...roles.map((r) => r.replace(/_/g, ' '))]}
            rows={operations.map((operation) => ([
            <div key="operation" className="font-medium capitalize">{operation.replace(/_/g, ' ')}</div>,
            ...roles.map((role) => (
              <div key={role} className="flex items-center justify-center">
                <Checkbox checked={(matrix[role] || []).includes(operation)} disabled={!canEdit} onCheckedChange={(checked) => toggle(role, operation, checked === true)} />
              </div>
            )),
          ]))}
          empty="No operations"
        />
      </section>
      {canEdit && <Button onClick={save}>Save Permissions</Button>}
    </div>
  );
}
