"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CreditCard, Edit, KeyRound, UserRound } from "lucide-react";
import { DownloadButtons } from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { imageFileToDataUrl } from "@/lib/imageUpload";
import { findStudentForUser } from "@/lib/student-normalizer";

const cleanRole = (role?: string) => String(role || "user").toLowerCase().replace(/[\s-]+/g, "_").replace("principal", "head").replace("guardian", "parent");
const roleLabel = (role?: string) => cleanRole(role).split("_").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
const valueOf = (...values: any[]) => values.find((v) => v !== undefined && v !== null && String(v).trim() !== "") || "";
const isIdOnly = (v: any) => /^[a-f0-9]{24}$/i.test(String(v || ""));
const dash = (v: any) => v && !isIdOnly(v) ? v : "-";
const fmtDate = (v: any) => { if (!v) return "-"; const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString(); };

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [card, setCard] = useState<any>(null);
  const [cardErr, setCardErr] = useState("");
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    api.auth.profile().then((data: any) => { const next = data.user || data; setUser(next); setName(next.name || ""); setPhone(next.phone || ""); setAvatar(next.avatar || ""); }).catch(() => undefined);
    api.institution.profile().then((data: any) => setInstitution(data?.institution || null)).catch(() => undefined);
    api.idCards.getMine({ skipToast: true }).then((data: any) => setCard(data)).catch((e: any) => setCardErr(e?.message || "No personal ID card record found. A preview card is still available."));
    api.students.getAll({ skipToast: true }).then((data: any) => setStudents(data?.students || [])).catch(() => setStudents([]));
  }, []);

  const role = cleanRole(user?.role);
  const cardRecord = card?.card || card || {};
  const matchedStudent = useMemo(() => findStudentForUser(students, user || {}), [students, user]);
  const roleDetails = user?.roleDetails || {};
  const studentProfile: any = matchedStudent || card?.student || user?.student || (role === "student" ? roleDetails : null) || user?.studentId || user?.studentProfile || {};
  const staffProfile: any = user?.teacher || user?.staff || roleDetails || {};
  const parentProfile: any = user?.parent || user?.guardian || user?.parentProfile || {};
  const isStudentView = role === "student" || role === "parent";
  const profile: any = isStudentView ? studentProfile : staffProfile;
  const institutionData = institution || user?.institution || card?.institution || {};

  const info = {
    className: valueOf(profile.className, profile.classId?.name, cardRecord.className),
    sectionName: valueOf(profile.section, profile.sectionName, profile.sectionId?.name, cardRecord.sectionName),
    rollNumber: valueOf(profile.roll, profile.rollNumber, cardRecord.rollNumber),
    idNumber: valueOf(profile.roll, profile.rollNumber, profile.employeeId, cardRecord.cardNumber, user?.username, user?._id),
    designation: valueOf(profile.designation, roleLabel(role)),
    department: valueOf(profile.department, profile.className),
    admissionNumber: valueOf(profile.admissionNo, profile.admissionNumber, cardRecord.admissionNumber),
    registrationNumber: valueOf(profile.registrationNumber, cardRecord.registrationNumber),
    dateOfBirth: valueOf(profile.dateOfBirth, cardRecord.dateOfBirth),
    fatherName: valueOf(profile.fatherName, cardRecord.fatherName),
    motherName: valueOf(profile.motherName, cardRecord.motherName),
    guardianName: valueOf(profile.guardianName, profile.parentName, parentProfile?.name, cardRecord.guardianName),
    guardianPhone: valueOf(profile.guardianPhone, parentProfile?.phone, cardRecord.guardianPhone),
    address: valueOf(profile.address, user?.address),
    joiningDate: valueOf(profile.joiningDate, user?.joiningDate),
    salary: valueOf(profile.salary, user?.salary),
  };

  const uploadAvatar = async (file?: File) => { if (!file) return; setAvatar(await imageFileToDataUrl(file)); };
  const saveProfile = async () => { const data = await api.auth.updateProfile({ name, phone, avatar }) as any; setUser((current: any) => ({ ...current, ...(data.user || {}), name, phone, avatar })); setEditing(false); };

  return <div className="space-y-5">
    <PageHeader title="My Profile" description="Personal account, contact, institution and ID card information." icon={UserRound} actions={[{ label: "Edit Profile", icon: Edit, href: "/profile" }, { label: "My ID Card", icon: CreditCard, href: "/id-cards/my-card" }, { label: "Change Password", icon: KeyRound, href: "/profile/change-password" }]} />
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <section className="rounded-lg border border-border bg-card p-5 text-center shadow-sm">
        <div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100">{(editing ? avatar : user?.avatar) ? <img src={editing ? avatar : user.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12 text-slate-500" />}</div>
        {editing ? <div className="mt-4 space-y-3 text-left"><input className="h-10 w-full rounded-md border px-3 text-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" /><input className="h-10 w-full rounded-md border px-3 text-sm" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" /><input className="block w-full text-sm" type="file" accept="image/*" onChange={(e) => uploadAvatar(e.target.files?.[0])} /><div className="flex gap-2"><Button type="button" onClick={saveProfile}>Save</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div></div> : <h2 className="mt-4 text-xl font-semibold text-slate-950">{matchedStudent?.name || user?.name || "User"}</h2>}
        <p className="mt-1 text-sm capitalize text-slate-500">{roleLabel(user?.role)}</p>
        <div className="mt-5 grid gap-2"><Button type="button" variant="outline" onClick={() => setEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit Profile</Button><Button asChild><Link href="/id-cards/my-card"><CreditCard className="mr-2 h-4 w-4" />My ID Card</Link></Button><Button asChild variant="outline"><Link href="/profile/change-password"><KeyRound className="mr-2 h-4 w-4" />Change Password</Link></Button></div>
      </section>
      <section className="space-y-5">
        <Panel title="Contact Info"><Info label="Username" value={user?.username} /><Info label="Email" value={user?.email || "Not set"} /><Info label="Phone" value={user?.phone || "Not set"} /><Info label="Role" value={roleLabel(user?.role)} /><Info label="Permissions" value={`${user?.permissions?.length || 0} assigned`} /></Panel>
        <Panel title="Role Details">{isStudentView ? <><Info label="Student Name" value={dash(matchedStudent?.name || user?.name)} /><Info label="Class" value={dash(info.className)} /><Info label="Section" value={dash(info.sectionName)} /><Info label="Roll" value={dash(info.rollNumber)} /><Info label="Admission No" value={dash(info.admissionNumber)} /><Info label="Registration No" value={dash(info.registrationNumber)} /><Info label="Date of Birth" value={fmtDate(info.dateOfBirth)} /><Info label="Father Name" value={dash(info.fatherName)} /><Info label="Mother Name" value={dash(info.motherName)} /><Info label="Guardian Name" value={dash(info.guardianName)} /><Info label="Guardian Phone" value={dash(info.guardianPhone)} /><Info label="ID Card Number" value={dash(matchedStudent?.idCardNumber)} /><Info label="Address" value={dash(info.address)} /></> : <><Info label="ID / Employee ID" value={dash(info.idNumber)} /><Info label="Designation" value={dash(info.designation)} /><Info label="Department" value={dash(info.department)} /><Info label="Joining Date" value={fmtDate(info.joiningDate)} /><Info label="Salary" value={info.salary ? `৳ ${info.salary}` : "-"} /></>}</Panel>
        <Panel title="Institution Info"><Info label="Institution" value={institutionData.name || "Not linked"} /><Info label="Type" value={institutionData.type || "-"} /><Info label="Email" value={institutionData.email || "-"} /><Info label="Phone" value={institutionData.phone || "-"} /><Info label="Address" value={institutionData.address || "-"} /></Panel>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="mb-4 font-semibold text-foreground">ID Card Section</h2>{cardErr && <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{cardErr}</div>}<div ref={previewRef} className="flex justify-center overflow-x-auto"><ProfessionalIDCard role={role} name={matchedStudent?.name || user?.name || "User"} idNumber={dash(info.idNumber)} rollNumber={dash(info.rollNumber)} studentClassName={dash(info.className)} sectionName={dash(info.sectionName)} institutionName={institutionData?.name || "Educational Institution"} institutionLogo={institutionData?.logo || institutionData?.logoUrl} institutionAddress={institutionData?.address} institutionPhone={institutionData?.phone} institutionEmail={institutionData?.email} institutionWebsite={institutionData?.website} institutionSeal={institutionData?.seal} headSignature={institutionData?.headSignature} designation={dash(info.designation)} department={dash(info.department)} photoUrl={user?.avatar || avatar} dateOfBirth={info.dateOfBirth} fatherName={dash(info.fatherName)} motherName={dash(info.motherName)} guardianName={dash(info.guardianName)} guardianPhone={dash(info.guardianPhone)} admissionNumber={dash(info.admissionNumber)} registrationNumber={dash(info.registrationNumber)} /></div><div className="mt-4 flex justify-center"><DownloadButtons targetRef={previewRef} filename={`${role || "user"}-${info.idNumber || user?.username || "profile"}`} /></div></div>
      </section>
    </div>
  </div>;
}

function Panel({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold text-foreground">{title}</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{children}</div></div>; }
function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-md border border-slate-200 p-4"><div className="text-xs font-medium uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-medium text-slate-950">{value || "-"}</div></div>; }
