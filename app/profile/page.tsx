"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { CreditCard, Edit, KeyRound, UserRound } from "lucide-react";

import { DownloadButtons } from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { findStudentForUser } from "@/lib/student-normalizer";

function cleanRole(role?: string) { const value = String(role || "user").toLowerCase().replace(/\s+/g, "_"); if (value === "principal") return "head"; if (value === "assistant-head" || value === "assistanthead") return "assistant_head"; if (value === "guardian") return "parent"; return value; }
function roleLabel(role?: string) { const value = cleanRole(role); if (value === "head") return "Head / Principal"; if (value === "assistant_head") return "Assistant Head"; if (value === "super_admin") return "Super Admin"; if (value === "finance_officer") return "Finance Officer"; return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function getNested(...values: any[]) { return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") || ""; }
function fmtDate(value: any) { if (!value) return "-"; const d = new Date(value); return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString(); }
const isObjectIdLike = (value: any) => /^[a-f0-9]{24}$/i.test(String(value || ""));
function displayOrDash(value: any) { return value && !isObjectIdLike(value) ? value : "-"; }

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [cardErr, setCardErr] = useState("");

  useEffect(() => {
    api.auth.profile().then((data: any) => { const next = data.user || data; setUser(next); setName(next.name || ""); setPhone(next.phone || ""); setAvatar(next.avatar || ""); }).catch(() => undefined);
    api.institution.profile().then((data: any) => setInstitution(data?.institution || null)).catch(() => undefined);
    api.idCards.getMine({ skipToast: true }).then((c: any) => setCard(c)).catch((e: any) => setCardErr(e?.message || "No personal ID card record found. A preview card is still available."));
    api.students.getAll({ skipToast: true }).then((data: any) => setStudents(data?.students || [])).catch(() => setStudents([]));
  }, []);

  const cardRecord = card?.card || card;
  const cardOwner = cardRecord?.ownerId;
  const userId = String(user?._id || user?.id || "");
  const cardOwnerId = String(typeof cardOwner === "object" ? cardOwner?._id || cardOwner?.id || "" : cardOwner || "");
  const owner = user || {};
  const role = cleanRole(owner?.role);
  const roleDetails = owner?.roleDetails || {};
  const matchedStudent = useMemo(() => findStudentForUser(students, owner), [students, owner]);
  const studentProfile = matchedStudent || card?.student || owner?.student || (role === "student" ? roleDetails : null) || owner?.studentId || owner?.studentProfile || {};
  const teacherProfile = owner?.teacher || (["teacher", "class_teacher", "subject_teacher", "head", "assistant_head"].includes(role) ? roleDetails : null) || owner?.teacherId || owner?.teacherProfile || {};
  const staffProfile = owner?.staff || (["staff", "finance_officer", "librarian"].includes(role) ? roleDetails : null) || owner?.staffId || owner?.staffProfile || {};
  const parentProfile = owner?.parent || (role === "parent" ? roleDetails : null) || owner?.guardian || owner?.parentProfile || {};
  const linkedOwnerIds = [userId, String((studentProfile as any)?._id || (studentProfile as any)?.id || (studentProfile as any)?.studentId || ''), String((studentProfile as any)?.userId?._id || (studentProfile as any)?.userId || ''), String(teacherProfile?._id || ''), String(teacherProfile?.userId || ''), String(staffProfile?._id || ''), String(staffProfile?.userId || '')].filter(Boolean);
  const isOwnCard = Boolean(cardRecord?._id && cardOwnerId && linkedOwnerIds.includes(cardOwnerId));
  const personalCard = isOwnCard ? cardRecord : null;
  const institutionData = institution || owner?.institution || card?.institution || {};

  const cardData = useMemo(() => {
    const roleProfile = role === "student" || role === "parent" ? studentProfile : ["teacher", "class_teacher", "subject_teacher", "head", "assistant_head"].includes(role) ? teacherProfile : ["staff", "finance_officer", "librarian"].includes(role) ? staffProfile : {};
    const className = getNested((roleProfile as any)?.className, (roleProfile as any)?.classId?.name, owner?.classId?.name, owner?.className, owner?.student?.classId?.name, owner?.studentId?.classId?.name, personalCard?.className, cardRecord?.className);
    const sectionName = getNested((roleProfile as any)?.section, (roleProfile as any)?.sectionName, (roleProfile as any)?.sectionId?.name, owner?.sectionId?.name, owner?.sectionName, owner?.student?.sectionId?.name, owner?.studentId?.sectionId?.name, personalCard?.sectionName, cardRecord?.sectionName);
    const rollNumber = getNested((roleProfile as any)?.roll, (roleProfile as any)?.rollNumber, owner?.rollNumber, owner?.student?.rollNumber, owner?.studentId?.rollNumber, personalCard?.rollNumber, cardRecord?.rollNumber);
    const employeeId = getNested((roleProfile as any)?.employeeId, owner?.employeeId, owner?.teacher?.employeeId, owner?.staff?.employeeId, personalCard?.employeeId, cardRecord?.employeeId);
    const designation = getNested((roleProfile as any)?.designation, owner?.designation, personalCard?.designation, cardRecord?.designation, roleLabel(role));
    const department = getNested((roleProfile as any)?.department, owner?.department, personalCard?.department, cardRecord?.department, role === "student" || role === "parent" ? className : "");
    const stream = role === "student" || role === "parent" ? [className, sectionName ? `Section ${sectionName}` : ""].filter(Boolean).join(" · ") : getNested(designation, department, roleLabel(role));
    const studentIdNumber = getNested(rollNumber, (roleProfile as any)?.admissionNo, (roleProfile as any)?.admissionNumber, (roleProfile as any)?.registrationNumber, owner?.admissionNumber, personalCard?.cardNumber, cardRecord?.cardNumber);
    const idNumber = role === "student" || role === "parent" ? (studentIdNumber || "-") : getNested(employeeId, personalCard?.cardNumber, cardRecord?.cardNumber, owner?.username, owner?._id, "ID");
    return { role, roleProfile, className, sectionName, rollNumber, idNumber, stream, designation, department, admissionNumber: getNested((roleProfile as any)?.admissionNo, (roleProfile as any)?.admissionNumber, owner?.admissionNumber, personalCard?.admissionNumber, cardRecord?.admissionNumber), registrationNumber: getNested((roleProfile as any)?.registrationNumber, owner?.registrationNumber, personalCard?.registrationNumber, cardRecord?.registrationNumber), dateOfBirth: getNested((roleProfile as any)?.dateOfBirth, owner?.dateOfBirth, personalCard?.dateOfBirth, cardRecord?.dateOfBirth), fatherName: getNested((roleProfile as any)?.fatherName, owner?.fatherName, personalCard?.fatherName, cardRecord?.fatherName), motherName: getNested((roleProfile as any)?.motherName, owner?.motherName, personalCard?.motherName, cardRecord?.motherName), guardianName: getNested((roleProfile as any)?.guardianName, (roleProfile as any)?.parentName, parentProfile?.name, owner?.guardianName, personalCard?.guardianName, cardRecord?.guardianName), guardianPhone: getNested((roleProfile as any)?.guardianPhone, parentProfile?.phone, owner?.guardianPhone, personalCard?.guardianPhone, cardRecord?.guardianPhone), phone: getNested((roleProfile as any)?.phone, owner?.phone), bloodGroup: getNested((roleProfile as any)?.bloodGroup, owner?.bloodGroup), address: getNested((roleProfile as any)?.address, owner?.address), joiningDate: getNested((roleProfile as any)?.joiningDate, owner?.joiningDate), salary: getNested((roleProfile as any)?.salary, owner?.salary) };
  }, [role, owner, studentProfile, teacherProfile, staffProfile, parentProfile, personalCard, cardRecord]);

  const hasStudentDetails = !(cardData.role === "student" || cardData.role === "parent") || Boolean(cardData.className || cardData.sectionName || cardData.rollNumber || cardData.guardianPhone || cardData.fatherName || cardData.motherName);
  const uploadAvatar = (file?: File) => { if (!file) return; const reader = new FileReader(); reader.onload = () => setAvatar(String(reader.result)); reader.readAsDataURL(file); };
  const saveProfile = async () => { const data = await api.auth.updateProfile({ name, phone, avatar }) as any; setUser((current: any) => ({ ...current, ...(data.user || {}), name, phone, avatar })); setEditing(false); };

  return <div className="space-y-5"><PageHeader title="My Profile" description="Personal account, contact, institution and ID card information." icon={UserRound} actions={[{ label: "Edit Profile", icon: Edit, href: "/profile" }, { label: "My ID Card", icon: CreditCard, href: "/id-cards/my-card" }, { label: "Change Password", icon: KeyRound, href: "/profile/change-password" }]} />
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]"><section className="rounded-lg border border-border bg-card p-5 text-center shadow-sm"><div className="mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-slate-100">{(editing ? avatar : user?.avatar) ? <img src={editing ? avatar : user.avatar} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12 text-slate-500" />}</div>{editing ? <div className="mt-4 space-y-3 text-left"><input className="h-10 w-full rounded-md border px-3 text-sm" value={name} onChange={(event) => setName(event.target.value)} placeholder="Full name" /><input className="h-10 w-full rounded-md border px-3 text-sm" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" /><label className="block"><span className="text-sm font-medium text-slate-700">Profile image</span><input className="mt-2 block w-full text-sm" type="file" accept="image/*" onChange={(event) => uploadAvatar(event.target.files?.[0])} /></label><div className="flex gap-2"><Button type="button" onClick={saveProfile}>Save</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div></div> : <h2 className="mt-4 text-xl font-semibold text-slate-950">{matchedStudent?.name || user?.name || "User"}</h2>}<p className="mt-1 text-sm capitalize text-slate-500">{roleLabel(user?.role)}</p><div className="mt-5 grid gap-2"><Button type="button" variant="outline" onClick={() => setEditing(true)}><Edit className="mr-2 h-4 w-4" />Edit Profile</Button><Button asChild><Link href="/id-cards/my-card"><CreditCard className="mr-2 h-4 w-4" />My ID Card</Link></Button><Button asChild variant="outline"><Link href="/profile/change-password"><KeyRound className="mr-2 h-4 w-4" />Change Password</Link></Button></div></section>
      <section className="space-y-5"><div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold text-foreground">Contact Info</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><Info label="Username" value={user?.username} /><Info label="Email" value={user?.email || "Not set"} /><Info label="Phone" value={user?.phone || cardData.phone || "Not set"} /><Info label="Role" value={roleLabel(user?.role)} /><Info label="Permissions" value={`${user?.permissions?.length || 0} assigned`} /></div></div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold text-foreground">Role Details</h2>{(cardData.role === "student" || cardData.role === "parent") && !hasStudentDetails && <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Student record is not linked with this login yet, so class/guardian details are unavailable. Please sync this login user with the student record.</div>}<div className="mt-4 grid gap-3 md:grid-cols-2">{cardData.role === "student" || cardData.role === "parent" ? <><Info label="Student Name" value={displayOrDash(matchedStudent?.name || user?.name)} /><Info label="Class" value={displayOrDash(cardData.className)} /><Info label="Section" value={displayOrDash(cardData.sectionName)} /><Info label="Roll" value={displayOrDash(cardData.rollNumber)} /><Info label="Admission No" value={displayOrDash(cardData.admissionNumber)} /><Info label="Registration No" value={displayOrDash(cardData.registrationNumber)} /><Info label="Date of Birth" value={fmtDate(cardData.dateOfBirth)} /><Info label="Blood Group" value={displayOrDash(cardData.bloodGroup)} /><Info label="Father Name" value={displayOrDash(cardData.fatherName)} /><Info label="Mother Name" value={displayOrDash(cardData.motherName)} /><Info label="Guardian Name" value={displayOrDash(cardData.guardianName)} /><Info label="Guardian Phone" value={displayOrDash(cardData.guardianPhone)} /><Info label="ID Card Number" value={displayOrDash(matchedStudent?.idCardNumber)} /><Info label="Address" value={displayOrDash(cardData.address)} /></> : <><Info label="ID / Employee ID" value={displayOrDash(cardData.idNumber)} /><Info label="Designation" value={displayOrDash(cardData.designation)} /><Info label="Department" value={displayOrDash(cardData.department)} /><Info label="Joining Date" value={fmtDate(cardData.joiningDate)} /><Info label="Salary" value={cardData.salary ? `৳ ${cardData.salary}` : '-'} /></>}</div></div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="font-semibold text-foreground">Institution Info</h2><div className="mt-4 grid gap-3 md:grid-cols-2"><Info label="Institution" value={institutionData.name || "Not linked"} /><Info label="Type" value={institutionData.type || "-"} /><Info label="Email" value={institutionData.email || "-"} /><Info label="Phone" value={institutionData.phone || "-"} /><Info label="Address" value={institutionData.address || "-"} /></div></div>
        <div className="rounded-lg border border-border bg-card p-5 shadow-sm"><h2 className="mb-4 font-semibold text-foreground">ID Card Section</h2>{cardErr && <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{cardErr}</div>}<div ref={previewRef} className="flex justify-center overflow-x-auto"><ProfessionalIDCard role={cardData.role} name={matchedStudent?.name || user?.name || "User"} idNumber={displayOrDash(cardData.idNumber)} rollNumber={displayOrDash(cardData.rollNumber)} studentClassName={displayOrDash(cardData.className)} sectionName={displayOrDash(cardData.sectionName)} institutionName={institutionData?.name || "Educational Institution"} institutionLogo={institutionData?.logo || institutionData?.logoUrl} institutionAddress={institutionData?.address} institutionPhone={institutionData?.phone} institutionEmail={institutionData?.email} institutionWebsite={institutionData?.website} institutionSeal={institutionData?.seal} headSignature={institutionData?.headSignature} designation={displayOrDash(cardData.designation)} department={displayOrDash(cardData.department)} photoUrl={user?.avatar || avatar} bloodGroup={displayOrDash(cardData.bloodGroup)} /></div><div className="mt-4 flex justify-center"><DownloadButtons targetRef={previewRef} filename={`${cardData.role || 'user'}-${cardData.idNumber || user?.username || 'profile'}`} /></div></div>
      </section></div>
  </div>;
}

function Info({ label, value }: { label: string; value: ReactNode }) { return <div className="rounded-md border border-slate-200 p-4"><div className="text-xs font-medium uppercase text-slate-500">{label}</div><div className="mt-1 text-sm font-medium text-slate-950">{value || "-"}</div></div>; }
