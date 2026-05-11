"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Edit, KeyRound, UserRound } from "lucide-react";

import { IDCardPreview } from "@/components/id-cards/IDCardPreview";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    api.auth.profile().then((data: any) => setUser(data.user || data)).catch(() => undefined);
  }, []);

  const institution = user?.institution || {};

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Profile"
        description="Personal account, contact, institution and ID card information."
        icon={UserRound}
        actions={[
          { label: "Edit Profile", icon: Edit, href: "/profile" },
          { label: "My ID Card", icon: CreditCard, href: "/id-cards/my-card" },
          { label: "Change Password", icon: KeyRound, href: "/profile/change-password" },
        ]}
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100">
            {user?.avatar ? <img src={user.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12 text-slate-500" />}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">{user?.name || "User"}</h2>
          <p className="mt-1 text-sm capitalize text-slate-500">{String(user?.role || "").replace(/_/g, " ")}</p>
          <div className="mt-5 grid gap-2">
            <Button asChild><Link href="/id-cards/my-card"><CreditCard className="mr-2 h-4 w-4" />My ID Card</Link></Button>
            <Button asChild variant="outline"><Link href="/profile/change-password"><KeyRound className="mr-2 h-4 w-4" />Change Password</Link></Button>
          </div>
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Contact Info</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="Email" value={user?.email} />
              <Info label="Phone" value={user?.phone || "Not set"} />
              <Info label="Role" value={String(user?.role || "-").replace(/_/g, " ")} />
              <Info label="Permissions" value={`${user?.permissions?.length || 0} assigned`} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Institution Info</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Info label="Institution" value={institution.name || "Not linked"} />
              <Info label="Type" value={institution.type || "-"} />
              <Info label="Email" value={institution.email || "-"} />
              <Info label="Phone" value={institution.phone || "-"} />
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-950">ID Card Section</h2>
            <IDCardPreview type={user?.role === "staff" ? "staff" : user?.role?.includes("teacher") ? "teacher" : "student"} name={user?.name || "User"} id={user?.id || "ID"} qrData={user?.id || ""} barcode={user?.id || ""} />
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-md border border-slate-200 p-4"><div className="text-xs font-medium uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-medium capitalize text-slate-950">{value || "-"}</div></div>;
}
