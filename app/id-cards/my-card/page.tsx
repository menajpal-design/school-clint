"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import ReturnInstructionNotice from "@/components/id-cards/ReturnInstructionNotice";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { api, apiClient } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { normalizeUserRole } from "@/lib/permissions";

function cleanRole(role?: string) { const value = String(role || "user").toLowerCase().replace(/\s+/g, "_"); if (value === "principal") return "head"; if (value === "assistant-head" || value === "assistanthead") return "assistant_head"; return value; }
function roleLabel(role?: string) { const value = cleanRole(role); if (value === "head") return "Head / Principal"; if (value === "assistant_head") return "Assistant Head"; if (value === "super_admin") return "Super Admin"; return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function getNested(...values: any[]) { return values.find((value) => value !== undefined && value !== null && value !== "") || ""; }
function idOf(value: any) { return String(value?._id || value?.id || value || ""); }
function isGenericServerError(message?: string) { const value = String(message || "").toLowerCase(); return !value || value === "server error" || value.includes("server connection failed") || value.includes("failed to fetch"); }

export default function MyCardPage() {
  const { user } = useAuth();
  const normalizedRole = useMemo(() => normalizeUserRole(user?.role), [user?.role]);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [error, setError] = useState("");
  const [cardLookupFailed, setCardLookupFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (normalizedRole === "parent") {
      apiClient.get("/parent/portal").then((res: any) => { const kids = res.portal?.children || []; setChildren(kids); if (kids.length > 0) setSelectedChildId(kids[0]._id || kids[0].id || ""); }).catch((err) => setError(err?.message || "Failed to load parent children"));
    }
  }, [normalizedRole]);
  useEffect(() => { api.institution.profile().then((data: any) => setInstitution(data?.institution || null)).catch(() => undefined); }, []);
  useEffect(() => {
    if (!user) return;
    setLoading(true); setError("");
    const loadCardAndProfile = async () => {
      try {
        if (normalizedRole === "parent") {
          if (!selectedChildId) { setLoading(false); return; }
          const cardData: any = await apiClient.get(`/id-cards/child/${selectedChildId}/card`);
          setCard(cardData); setCardLookupFailed(false);
          setProfile(cardData.student?.userId ? { ...cardData.student.userId, student: cardData.student, role: "student" } : { name: cardData.student?.name || "Student", student: cardData.student, role: "student" });
        } else {
          const cardData: any = await api.idCards.getMine({ skipToast: true });
          setCard(cardData); setCardLookupFailed(Boolean(cardData?.profileMissing));
          const profileData: any = await api.auth.profile();
          setProfile({ ...(profileData.user || profileData), ...(cardData?.student ? { student: cardData.student } : {}) });
          if (cardData?.message) setError(cardData.message);
        }
      } catch (err: any) { setCard(null); setCardLookupFailed(true); const message = err?.message || ""; setError(isGenericServerError(message) ? "" : message); }
      finally { setLoading(false); }
    };
    loadCardAndProfile();
  }, [user, normalizedRole, selectedChildId]);

  const cardRecord = card?.card || card;
  const cardOwner = cardRecord?.ownerId;
  const owner = profile || {};
  const studentProfile = owner?.student || owner?.studentId || owner?.studentProfile || {};
  const teacherProfile = owner?.teacher || owner?.teacherId || owner?.teacherProfile || {};
  const staffProfile = owner?.staff || owner?.staffId || owner?.staffProfile || {};
  const parentProfile = owner?.parent || owner?.guardian || owner?.parentProfile || {};
  const profileOwnerIds = [idOf(profile?._id), idOf(profile?.id), idOf(studentProfile), idOf(studentProfile?._id), idOf(studentProfile?.id), idOf(studentProfile?.userId), idOf(teacherProfile), idOf(teacherProfile?._id), idOf(teacherProfile?.id), idOf(teacherProfile?.userId), idOf(staffProfile), idOf(staffProfile?._id), idOf(staffProfile?.id), idOf(staffProfile?.userId), idOf(parentProfile), idOf(parentProfile?._id), idOf(parentProfile?.id), idOf(parentProfile?.userId)].filter(Boolean);
  const cardOwnerId = idOf(cardOwner);
  const isOwnCard = Boolean(cardRecord?._id && cardOwnerId && profileOwnerIds.includes(cardOwnerId));
  const personalCard = isOwnCard ? cardRecord : null;
  const institutionData = institution || owner?.institution || profile?.institution || card?.institution || {};
  const cardData = useMemo(() => {
    const role = cleanRole(owner?.role);
    const roleProfile = role === "student" ? studentProfile : role === "teacher" ? teacherProfile : role === "staff" ? staffProfile : role === "parent" || role === "guardian" ? parentProfile : {};
    const className = getNested(personalCard?.className, cardRecord?.className, roleProfile?.classId?.name, roleProfile?.className, owner?.classId?.name, owner?.className, owner?.student?.classId?.name, owner?.studentId?.classId?.name);
    const sectionName = getNested(personalCard?.sectionName, cardRecord?.sectionName, roleProfile?.sectionId?.name, roleProfile?.sectionName, owner?.sectionId?.name, owner?.sectionName, owner?.student?.sectionId?.name, owner?.studentId?.sectionId?.name);
    const rollNumber = getNested(personalCard?.rollNumber, cardRecord?.rollNumber, roleProfile?.rollNumber, owner?.rollNumber, owner?.student?.rollNumber, owner?.studentId?.rollNumber);
    const employeeId = getNested(personalCard?.employeeId, cardRecord?.employeeId, roleProfile?.employeeId, owner?.employeeId, owner?.teacher?.employeeId, owner?.staff?.employeeId);
    const designation = getNested(personalCard?.designation, cardRecord?.designation, roleProfile?.designation, owner?.designation, roleLabel(role));
    const department = getNested(personalCard?.department, cardRecord?.department, roleProfile?.department, owner?.department, role === "student" ? className : "");
    const stream = role === "student" ? [className, sectionName ? `Section ${sectionName}` : ""].filter(Boolean).join(" · ") : getNested(designation, department, roleLabel(role));
    const idNumber = role === "student" ? getNested(personalCard?.cardNumber, cardRecord?.cardNumber, rollNumber, roleProfile?.admissionNumber, owner?.admissionNumber, owner?._id, "ROLL") : getNested(personalCard?.cardNumber, cardRecord?.cardNumber, employeeId, owner?.username, owner?._id, "ID");
    return { role, className, sectionName, rollNumber, idNumber, stream, designation, department, admissionNumber: getNested(personalCard?.admissionNumber, cardRecord?.admissionNumber, roleProfile?.admissionNumber, owner?.admissionNumber), registrationNumber: getNested(personalCard?.registrationNumber, cardRecord?.registrationNumber, roleProfile?.registrationNumber, owner?.registrationNumber), dateOfBirth: getNested(personalCard?.dateOfBirth, cardRecord?.dateOfBirth, roleProfile?.dateOfBirth, owner?.dateOfBirth), fatherName: getNested(personalCard?.fatherName, cardRecord?.fatherName, roleProfile?.fatherName, owner?.fatherName), motherName: getNested(personalCard?.motherName, cardRecord?.motherName, roleProfile?.motherName, owner?.motherName), guardianName: getNested(personalCard?.guardianName, cardRecord?.guardianName, roleProfile?.guardianName, owner?.guardianName), guardianPhone: getNested(personalCard?.guardianPhone, cardRecord?.guardianPhone, roleProfile?.guardianPhone, owner?.guardianPhone) };
  }, [owner, personalCard, cardRecord, studentProfile, teacherProfile, staffProfile, parentProfile]);

  const headName = institutionData?.headId?.name || institutionData?.headName || "";
  const status = personalCard?.status || (profile ? "Preview" : "Loading");
  return <div className="space-y-5"><PageHeader title="My ID Card" description="Preview, download, print or email your current ID card." icon={BadgeCheck} status={<Badge variant="outline" className="capitalize">{status}</Badge>} />{normalizedRole === "parent" && children.length > 0 && <section className="rounded-lg border bg-card p-4 shadow-sm"><div className="max-w-xs"><label className="space-y-2"><span className="text-sm font-medium text-slate-800">Select Child</span><select className="h-10 w-full rounded-md border px-3 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary" value={selectedChildId} onChange={(e) => setSelectedChildId(e.target.value)}>{children.map((item) => <option key={item._id} value={item._id}>{item.userId?.name || `Roll: ${item.rollNumber}`} ({item.classId?.name || "N/A"})</option>)}</select></label></div></section>}{error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}{cardLookupFailed && !error && profile && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">No saved personal ID card was found. A downloadable role-based preview is shown instead.</div>}{cardRecord?._id && !isOwnCard && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">The card returned by the server did not match this account or linked profile. Showing role-based preview.</div>}{loading ? <div className="rounded-lg border border-border bg-card p-10 text-sm text-muted-foreground">Loading ID Card...</div> : <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-6"><div ref={previewRef} className="relative flex justify-center overflow-x-auto"><ProfessionalIDCard role={cardData.role} name={owner.name || "Your Name"} idNumber={cardData.idNumber} rollNumber={cardData.rollNumber} studentClassName={cardData.className} sectionName={cardData.sectionName} institutionName={institutionData?.name || "Educational Institution"} institutionLogo={institutionData?.logo || institutionData?.logoUrl} institutionAddress={institutionData?.address} institutionPhone={institutionData?.phone} institutionEmail={institutionData?.email} institutionWebsite={institutionData?.website} institutionSeal={institutionData?.seal} headSignature={institutionData?.headSignature} headName={headName} stream={cardData.stream} designation={cardData.designation} department={cardData.department} validityDate={personalCard?.validityEnd || undefined} photoUrl={owner?.avatar || profile?.avatar} dateOfBirth={cardData.dateOfBirth} fatherName={cardData.fatherName} motherName={cardData.motherName} guardianName={cardData.guardianName} guardianPhone={cardData.guardianPhone} admissionNumber={cardData.admissionNumber} registrationNumber={cardData.registrationNumber} /><ReturnInstructionNotice address={institutionData?.address} phone={institutionData?.phone} email={institutionData?.email} website={institutionData?.website} /></div><div className="mt-4 flex flex-col gap-3"><div className="text-sm text-slate-600">Role: {roleLabel(cardData.role)} · {cardData.role === "student" ? `Roll: ${cardData.rollNumber || "-"} · Class: ${cardData.className || "-"} ${cardData.sectionName ? `· Section: ${cardData.sectionName}` : ""}` : `ID: ${cardData.idNumber || "-"}`}</div><div className="text-sm text-slate-600">Valid: {personalCard?.validityStart ? formatDate(personalCard.validityStart) : "-"} to {personalCard?.validityEnd ? formatDate(personalCard.validityEnd) : "-"}</div><DownloadButtons targetRef={previewRef} filename={personalCard?.cardNumber || `id-${profile?._id || profile?.id || 'me'}`} cardId={personalCard?._id} /></div></section>}</div>;
}
