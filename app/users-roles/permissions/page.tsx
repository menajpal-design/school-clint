"use client";

import { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";

const operations = ["dashboard", "academic", "attendance", "finance", "documents", "id_cards", "notices", "users", "settings"];
const defaultRoles = ["head", "assistant_head", "class_teacher", "subject_teacher", "finance_officer", "staff", "student", "parent", "committee_member"];

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
    const dynamic = Object.keys(matrix);
    return dynamic.length ? dynamic : defaultRoles;
  }, [matrix]);

  const canEdit = profile?.role === "head";
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
      {!canEdit && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Only Head users can update permissions.</div>}
      <section className="overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[980px] text-sm">
          <thead><tr className="border-b bg-slate-50"><th className="px-4 py-3 text-left font-semibold text-slate-600">Operation</th>{roles.map((role) => <th key={role} className="px-4 py-3 text-center font-semibold capitalize text-slate-600">{role.replace(/_/g, " ")}</th>)}</tr></thead>
          <tbody>
            {operations.map((operation) => (
              <tr key={operation} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium capitalize text-slate-950">{operation.replace(/_/g, " ")}</td>
                {roles.map((role) => (
                  <td key={`${role}-${operation}`} className="px-4 py-3 text-center">
                    <Checkbox checked={(matrix[role] || []).includes(operation)} disabled={!canEdit} onCheckedChange={(checked) => toggle(role, operation, checked === true)} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {canEdit && <Button onClick={save}>Save Permissions</Button>}
    </div>
  );
}
