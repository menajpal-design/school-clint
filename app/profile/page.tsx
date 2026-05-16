"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { CreditCard, Edit, KeyRound, UserRound } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

function cleanRole(role?: string) {
  const value = String(role || "user").toLowerCase().replace(/\s+/g, "_");
  if (value === "principal") return "head";
  if (value === "assistant-head" || value === "assistanthead") return "assistant_head";
  return value;
}

function roleLabel(role?: string) {
  const value = cleanRole(role);
  if (value === "head") return "Head / Principal";
  if (value === "assistant_head") return "Assistant Head";
  if (value === "super_admin") return "Super Admin";
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function getNested(...values: any[]) {
  return values.find((value) => value !== undefined && value !== null && value !== "") || "";
}

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [cardErr, setCardErr] = useState("");

  useEffect(() => {
    api.auth.profile().then((data: any) => {
      const next = data.user || data;
      setUser(next);
      setName(next.name || "");
      setPhone(next.phone || "");
      setAvatar(next.avatar || "");
    }).catch(() => undefined);
    api.institution.profile().then((data: any) => setInstitution(data?.institution || null)).catch(() => undefined);
    api.idCards.getMine().then((c: any) => setCard(c)).catch((e: any) => setCardErr(e?.message || "No personal ID card record found. A preview card is still available."));
  }, []);

  const cardRecord = card?.card || card;
  const cardOwner = cardRecord?.ownerId;
  const userId = String(user?._id || user?.id || "");
  const cardOwnerId = String(typeof cardOwner === "object" ? cardOwner?._id || cardOwner?.id || "" : cardOwner || "");
  const isOwnCard = Boolean(cardRecord?._id && userId && cardOwnerId && cardOwnerId === userId);
  const personalCard = isOwnCard ? cardRecord : null;
  const owner = user || {};
  const institutionData = institution || owner?.institution || {};

  const cardData = useMemo(() => {
    const role = cleanRole(owner?.role);
    const studentProfile = owner?.student || owner?.studentId || owner?.studentProfile || {};
    const teacherProfile = owner?.teacher || owner?.teacherId || owner?.teacherProfile || {};
    const staffProfile = owner?.staff || owner?.staffId || owner?.staffProfile || {};
    const parentProfile = owner?.parent || owner?.guardian || owner?.parentProfile || {};
    const roleProfile = role === "student" ? studentProfile : role === "teacher" ? teacherProfile : role === "staff" ? staffProfile : role === "parent" || role === "guardian" ? parentProfile : {};

    const rollNumber = getNested(
      personalCard?.rollNumber,
      cardRecord?.rollNumber,
      roleProfile?.rollNumber,
      owner?.rollNumber,
      owner?.student?.rollNumber,
      owner?.studentId?.rollNumber
    );

    const employeeId = getNested(
      personalCard?.employeeId,
      cardRecord?.employeeId,
      roleProfile?.employeeId,
      owner?.employeeId,
      owner?.teacher?.employeeId,
      owner?.staff?.employeeId
    );

    const className = getNested(
      personalCard?.className,
      cardRecord?.className,
      roleProfile?.classId?.name,
      roleProfile?.className,
      owner?.classId?.name,
      owner?.className,
      owner?.student?.classId?.name,
      owner?.studentId?.classId?.name
    );

    const sectionName = getNested(
      personalCard?.sectionName,
      cardRecord?.sectionName,
      roleProfile?.sectionId?.name,
      roleProfile?.sectionName,
      owner?.sectionId?.name,
      owner?.sectionName,
      owner?.student?.sectionId?.name,
      owner?.studentId?.sectionId?.name
    );

    const designation = getNested(personalCard?.designation, cardRecord?.designation, roleProfile?.designation, owner?.designation, roleLabel(role));
    const department = getNested(personalCard?.department, cardRecord?.department, roleProfile?.department, owner?.department, role === "student" ? className : "");
    const stream = role === "student" ? [className, sectionName ? `Section ${sectionName}` : ""].filter(Boolean).join(" · ") : getNested(designation, department, roleLabel(role));

    const idNumber = role === "student"
      ? getNested(personalCard?.cardNumber, rollNumber, owner?.admissionNumber, owner?._id, "ROLL")
      : getNested(personalCard?.cardNumber, employeeId, owner?.username, owner?._id, "ID");

    return {
      role,
      rollNumber,
      idNumber,
      stream,
      designation,
      department,
      admissionNumber: getNested(personalCard?.admissionNumber, cardRecord?.admissionNumber, roleProfile?.admissionNumber, owner?.admissionNumber),
      registrationNumber: getNested(personalCard?.registrationNumber, cardRecord?.registrationNumber, roleProfile?.registrationNumber, owner?.registrationNumber),
      dateOfBirth: getNested(personalCard?.dateOfBirth, cardRecord?.dateOfBirth, roleProfile?.dateOfBirth, owner?.dateOfBirth),
      fatherName: getNested(personalCard?.fatherName, cardRecord?.fatherName, roleProfile?.fatherName, owner?.fatherName, owner?.guardianName),
      motherName: getNested(personalCard?.motherName, cardRecord?.motherName, roleProfile?.motherName, owner?.motherName),
    };
  }, [owner, personalCard, cardRecord]);

  const headName = institutionData?.headId?.name || institutionData?.headName || "";

  const uploadAvatar = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    const data = await api.auth.updateProfile({ name, phone, avatar }) as any;
    setUser((current: any) => ({ ...current, ...(data.user || {}), name, phone, avatar }));
    setEditing(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader title="My Profile" description="Personal account, contact, institution and ID card information." icon={UserRound} actions={[{ label: "Edit Profile", icon: Edit, href: "/profile" }, { label: "My ID Card", icon: CreditCard, href: "/id-cards/my-card" }, { label: "Change Password", icon: KeyRound, href: "/profile/change-password" }]} />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
          <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100">
            {(editing ? avatar : user?.avatar) ? <img src={editing ? avatar : user.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12 text-slate-500" />}
          </div>
          {editing ? <div className="mt-4 space-y-3 text-left"><input className="h-10 w-full rounded-md border px-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /><input className="h-10 w-full rounded-md border px-3 text-sm" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" /><label className="block"><span className="text-sm font-medium text-slate-700">Profile image</span><input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} /></label><div className="flex gap-2"><Button type="button" onClick={saveProfile}>Save</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div></div> : <h2 className="mt-4 text-xl font-semibold text-slate-950">{user?.name || "User"}</h2>}
          <p className="mt-1 text-sm capitalize text-slate-500">{roleLabel(user?.role)}</p>
          <div className="mt-5 grid gap-2"><Button type="button" variant="outline" onClick={() => setEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit Profile</Button><Button asChild><Link href="/id-cards/my-card"><CreditCard className="mr-2 h-4 w-4" />My ID Card</Link></Button><Button asChild variant="outline"><Link href="/profile/change-password"><KeyRound className="mr-2 h-4 w-4" />Change Password</Link></Button></div>
        </section>

        <section className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold text-foreground">Contact Info</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><Info label="Email" value={user?.email} /><Info label="Phone" value={user?.phone || "Not set"} /><Info label="Role" value={roleLabel(user?.role)} /><Info label="Permissions" value={`${user?.permissions?.length || 0} assigned`} /></div></div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold text-foreground">Institution Info</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><Info label="Institution" value={institutionData.name || "Not linked"} /><Info label="Type" value={institutionData.type || "-"} /><Info label="Email" value={institutionData.email || "-"} /><Info label="Phone" value={institutionData.phone || "-"} /></div></div>
          <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="mb-4 font-semibold text-foreground">ID Card Section</h2>{cardErr && <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{cardErr}</div>}{cardRecord?._id && !isOwnCard && <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Your personal ID card was not found for this account. Showing role-based preview.</div>}
            <div ref={previewRef} className="overflow-x-auto">
              <ProfessionalIDCard role={cardData.role} name={user?.name || "User"} idNumber={cardData.idNumber} rollNumber={cardData.rollNumber} institutionName={institutionData?.name || "Educational Institution"} institutionLogo={institutionData?.logo || institutionData?.logoUrl} institutionAddress={institutionData?.address} institutionPhone={institutionData?.phone} institutionEmail={institutionData?.email} institutionWebsite={institutionData?.website} institutionSeal={institutionData?.seal} headSignature={institutionData?.headSignature} headName={headName} stream={cardData.stream} designation={cardData.designation} department={cardData.department} validityDate={personalCard?.validityEnd || undefined} photoUrl={user?.avatar} dateOfBirth={cardData.dateOfBirth} fatherName={cardData.fatherName} motherName={cardData.motherName} admissionNumber={cardData.admissionNumber} registrationNumber={cardData.registrationNumber} />
            </div>
            <div className="mt-3"><DownloadButtons targetRef={previewRef} filename={personalCard?.cardNumber || `id-${user?._id || user?.id || 'me'}`} cardId={personalCard?._id} /></div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-md border border-slate-200 p-4"><div className="text-xs font-medium uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-medium capitalize text-slate-950">{value || "-"}</div></div>;
}