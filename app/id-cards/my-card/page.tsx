"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from "react";
import { BadgeCheck, RefreshCw } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import ReturnInstructionNotice from "@/components/id-cards/ReturnInstructionNotice";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

function cleanRole(role?: string) {
  const value = String(role || "user").toLowerCase().replace(/[\s-]+/g, "_");
  if (value === "principal") return "head";
  if (value === "assistanthead") return "assistant_head";
  if (value === "guardian" || value === "parent_guardian") return "parent";
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

function isGenericServerError(message?: string) {
  const value = String(message || "").toLowerCase();
  return !value || value === "server error" || value.includes("server connection failed") || value.includes("failed to fetch");
}

export default function MyCardPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [cardResponse, setCardResponse] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [cardLookupFailed, setCardLookupFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const [cardData, profileData, institutionData] = await Promise.allSettled([
        api.idCards.getMine({ skipToast: true }),
        api.auth.profile(),
        api.institution.profile(),
      ]);

      if (cardData.status === "fulfilled") {
        const data: any = cardData.value;
        setCardResponse(data);
        setCardLookupFailed(false);
        if (data?.generated === false || data?.card === null) {
          setInfo(data?.message || "Your ID card is not generated yet. Please contact school office.");
        }
      } else {
        setCardResponse(null);
        setCardLookupFailed(true);
        const message = (cardData.reason as any)?.message || "";
        setError(isGenericServerError(message) ? "" : message);
      }

      if (profileData.status === "fulfilled") setProfile((profileData.value as any).user || profileData.value);
      if (institutionData.status === "fulfilled") setInstitution((institutionData.value as any)?.institution || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const cardRecord = cardResponse?.card || (cardResponse?._id ? cardResponse : null);
  const studentProfile = cardResponse?.student || cardResponse?.studentProfile;
  const responseInstitution = cardResponse?.institution;
  const cardOwner = cardRecord?.ownerId;
  const profileId = String(profile?._id || profile?.id || "");
  const studentUserId = String(studentProfile?.userId?._id || studentProfile?.userId || "");
  const studentId = String(studentProfile?._id || studentProfile?.id || "");
  const cardOwnerId = String(typeof cardOwner === "object" ? cardOwner?._id || cardOwner?.id || "" : cardOwner || "");
  const isStudentCardOwner = Boolean(cardRecord?._id && cardOwnerId && [profileId, studentUserId, studentId].filter(Boolean).includes(cardOwnerId));
  const isOwnCard = Boolean(cardRecord?._id && (isStudentCardOwner || (profileId && cardOwnerId === profileId)));
  const personalCard = isOwnCard ? cardRecord : null;
  const owner = studentProfile?.userId || profile || {};
  const institutionData = responseInstitution || institution || owner?.institution || profile?.institution || {};

  const cardData = useMemo(() => {
    const role = cleanRole(profile?.role || owner?.role || "student");
    const roleProfile = role === "student" ? (studentProfile || profile?.student || profile?.studentId || profile?.studentProfile || {}) : role === "teacher" ? (profile?.teacher || profile?.teacherId || profile?.teacherProfile || {}) : role === "staff" ? (profile?.staff || profile?.staffId || profile?.staffProfile || {}) : {};

    const rollNumber = getNested(personalCard?.rollNumber, cardRecord?.rollNumber, studentProfile?.rollNumber, roleProfile?.rollNumber, owner?.rollNumber, profile?.rollNumber);
    const employeeId = getNested(personalCard?.employeeId, cardRecord?.employeeId, roleProfile?.employeeId, owner?.employeeId, profile?.employeeId);
    const className = getNested(personalCard?.className, cardRecord?.className, studentProfile?.classId?.name, roleProfile?.classId?.name, roleProfile?.className, profile?.classId?.name, profile?.className);
    const sectionName = getNested(personalCard?.sectionName, cardRecord?.sectionName, studentProfile?.sectionId?.name, roleProfile?.sectionId?.name, roleProfile?.sectionName, profile?.sectionId?.name, profile?.sectionName);
    const designation = getNested(personalCard?.designation, cardRecord?.designation, roleProfile?.designation, owner?.designation, roleLabel(role));
    const department = getNested(personalCard?.department, cardRecord?.department, roleProfile?.department, owner?.department, role === "student" ? className : "");
    const stream = role === "student" ? [className, sectionName ? `Section ${sectionName}` : ""].filter(Boolean).join(" · ") : getNested(designation, department, roleLabel(role));
    const idNumber = role === "student" ? getNested(personalCard?.cardNumber, cardRecord?.cardNumber, studentProfile?.idCardNumber, rollNumber, studentProfile?.admissionNumber, owner?._id, "ROLL") : getNested(personalCard?.cardNumber, employeeId, owner?.username, owner?._id, "ID");

    return {
      role,
      rollNumber,
      idNumber,
      stream,
      designation,
      department,
      admissionNumber: getNested(personalCard?.admissionNumber, cardRecord?.admissionNumber, studentProfile?.admissionNumber, roleProfile?.admissionNumber, owner?.admissionNumber),
      registrationNumber: getNested(personalCard?.registrationNumber, cardRecord?.registrationNumber, studentProfile?.registrationNumber, roleProfile?.registrationNumber, owner?.registrationNumber),
      dateOfBirth: getNested(personalCard?.dateOfBirth, cardRecord?.dateOfBirth, studentProfile?.dateOfBirth, roleProfile?.dateOfBirth, owner?.dateOfBirth),
      fatherName: getNested(personalCard?.fatherName, cardRecord?.fatherName, studentProfile?.fatherName, roleProfile?.fatherName, owner?.fatherName, owner?.guardianName),
      motherName: getNested(personalCard?.motherName, cardRecord?.motherName, studentProfile?.motherName, roleProfile?.motherName, owner?.motherName),
    };
  }, [profile, owner, personalCard, cardRecord, studentProfile]);

  const headName = institutionData?.headId?.name || institutionData?.headName || "";
  const status = loading ? "Loading" : personalCard?.status || (info ? "Not Generated" : profile ? "Preview" : "Loading");

  return (
    <div className="space-y-5">
      <PageHeader
        title="My ID Card"
        description="Preview, download, print or email your current ID card. Students do not need to provide a studentId manually."
        icon={BadgeCheck}
        status={<Badge variant="outline" className="capitalize">{status}</Badge>}
        actions={[<Button key="refresh" variant="outline" onClick={() => load().catch(() => undefined)} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>]}
      />
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
      {info && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">{info}</div>}
      {cardLookupFailed && !error && profile && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">Your ID card is not generated yet. Please contact school office.</div>}
      {cardRecord?._id && !isOwnCard && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">This card does not belong to your account, so download is disabled. Please refresh or contact school office.</div>}
      <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-6">
        <div ref={previewRef} className="relative flex justify-start overflow-x-auto md:justify-center">
          <ProfessionalIDCard
            role={cardData.role}
            name={owner.name || profile?.name || "Your Name"}
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
          <ReturnInstructionNotice address={institutionData?.address} phone={institutionData?.phone} email={institutionData?.email} website={institutionData?.website} />
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
