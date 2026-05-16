"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

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

export default function MyCardPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.idCards.getMine().then(setCard).catch((err: any) => setError(err?.message || "No personal ID card record found. Showing role-based preview."));
    api.auth.profile().then((data: any) => setProfile(data.user || data)).catch(() => undefined);
    api.institution.profile().then((data: any) => setInstitution(data?.institution || null)).catch(() => undefined);
  }, []);

  const cardRecord = card?.card || card;
  const cardOwner = cardRecord?.ownerId;
  const profileId = String(profile?._id || profile?.id || "");
  const cardOwnerId = String(typeof cardOwner === "object" ? cardOwner?._id || cardOwner?.id || "" : cardOwner || "");
  const isOwnCard = Boolean(cardRecord?._id && profileId && cardOwnerId && cardOwnerId === profileId);
  const personalCard = isOwnCard ? cardRecord : null;
  const owner = profile || {};
  const institutionData = institution || owner?.institution || profile?.institution || {};

  const cardData = useMemo(() => {
    const role = cleanRole(owner?.role);
    const studentProfile = owner?.student || owner?.studentId || owner?.studentProfile || {};
    const teacherProfile = owner?.teacher || owner?.teacherId || owner?.teacherProfile || {};
    const staffProfile = owner?.staff || owner?.staffId || owner?.staffProfile || {};
    const parentProfile = owner?.parent || owner?.guardian || owner?.parentProfile || {};
    const roleProfile = role === "student" ? studentProfile : role === "teacher" ? teacherProfile : role === "staff" ? staffProfile : role === "parent" || role === "guardian" ? parentProfile : {};

    const rollNumber = getNested(personalCard?.rollNumber, cardRecord?.rollNumber, roleProfile?.rollNumber, owner?.rollNumber, owner?.student?.rollNumber, owner?.studentId?.rollNumber);
    const employeeId = getNested(personalCard?.employeeId, cardRecord?.employeeId, roleProfile?.employeeId, owner?.employeeId, owner?.teacher?.employeeId, owner?.staff?.employeeId);
    const className = getNested(personalCard?.className, cardRecord?.className, roleProfile?.classId?.name, roleProfile?.className, owner?.classId?.name, owner?.className, owner?.student?.classId?.name, owner?.studentId?.classId?.name);
    const sectionName = getNested(personalCard?.sectionName, cardRecord?.sectionName, roleProfile?.sectionId?.name, roleProfile?.sectionName, owner?.sectionId?.name, owner?.sectionName, owner?.student?.sectionId?.name, owner?.studentId?.sectionId?.name);
    const designation = getNested(personalCard?.designation, cardRecord?.designation, roleProfile?.designation, owner?.designation, roleLabel(role));
    const department = getNested(personalCard?.department, cardRecord?.department, roleProfile?.department, owner?.department, role === "student" ? className : "");
    const stream = role === "student" ? [className, sectionName ? `Section ${sectionName}` : ""].filter(Boolean).join(" · ") : getNested(designation, department, roleLabel(role));
    const idNumber = role === "student" ? getNested(personalCard?.cardNumber, rollNumber, owner?.admissionNumber, owner?._id, "ROLL") : getNested(personalCard?.cardNumber, employeeId, owner?.username, owner?._id, "ID");

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
  const status = personalCard?.status || (profile ? "Preview" : "Loading");

  return (
    <div className="space-y-5">
      <PageHeader title="My ID Card" description="Preview, download, print or email your current ID card." icon={BadgeCheck} status={<Badge variant="outline" className="capitalize">{status}</Badge>} />
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
      {cardRecord?._id && !isOwnCard && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Your personal ID card was not found for this account. Showing role-based preview.</div>}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
        <div ref={previewRef} className="flex justify-start overflow-x-auto md:justify-center">
          <ProfessionalIDCard
            role={cardData.role}
            name={owner.name || "Your Name"}
            idNumber={cardData.idNumber}
            rollNumber={cardData.rollNumber}
            institutionName={institutionData?.name || "Educational Institution"}
            institutionLogo={institutionData?.logo || institutionData?.logoUrl}
            institutionAddress={institutionData?.address}
            institutionPhone={institutionData?.phone}
            institutionEmail={institutionData?.email}
            institutionWebsite={institutionData?.website}
            institutionSeal={institutionData?.seal}
            headSignature={institutionData?.headSignature}
            headName={headName}
            stream={cardData.stream}
            designation={cardData.designation}
            department={cardData.department}
            validityDate={personalCard?.validityEnd || undefined}
            photoUrl={owner?.avatar || profile?.avatar}
            dateOfBirth={cardData.dateOfBirth}
            fatherName={cardData.fatherName}
            motherName={cardData.motherName}
            admissionNumber={cardData.admissionNumber}
            registrationNumber={cardData.registrationNumber}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-sm text-slate-600">Role: {roleLabel(cardData.role)} · {cardData.role === "student" ? `Roll: ${cardData.rollNumber || "-"}` : `ID: ${cardData.idNumber || "-"}`}</div>
          <div className="text-sm text-slate-600">Valid: {personalCard?.validityStart ? formatDate(personalCard.validityStart) : "-"} to {personalCard?.validityEnd ? formatDate(personalCard.validityEnd) : "-"}</div>
          <DownloadButtons targetRef={previewRef} filename={personalCard?.cardNumber || `id-${profile?._id || profile?.id || 'me'}`} cardId={personalCard?._id} />
        </div>
      </section>
    </div>
  );
}