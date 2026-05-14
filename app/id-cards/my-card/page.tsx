"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { ProfessionalIDCard } from "@/components/id-cards/ProfessionalIDCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function MyCardPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [institution, setInstitution] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.idCards.getMine().then(setCard).catch((err: any) => setError(err?.message || "No card found"));
    api.auth.profile().then((data: any) => setProfile(data.user || data)).catch(() => undefined);
    api.institution.profile().then((data: any) => setInstitution(data?.institution || null)).catch(() => undefined);
  }, []);

  const cardRecord = card?.card || card;
  const cardOwner = cardRecord?.ownerId;
  const profileId = String(profile?._id || profile?.id || "");
  const cardOwnerId = String(
    typeof cardOwner === "object"
      ? cardOwner?._id || cardOwner?.id || ""
      : cardOwner || ""
  );
  const isOwnCard = Boolean(cardRecord?._id && profileId && cardOwnerId && cardOwnerId === profileId);
  const personalCard = isOwnCard ? cardRecord : null;
  const owner = profile || {};
  const institutionData = institution || owner?.institution || profile?.institution || {};
  const cardType = owner?.role === "head" ? "head" : owner?.role === "teacher" ? "teacher" : owner?.role === "staff" ? "staff" : "student";
  const previewId = personalCard?.cardNumber || owner?.employeeId || owner?.rollNumber || owner?.id || "ID-CARD";
  const previewStream = owner?.classId?.name || owner?.className || owner?.designation || owner?.department || "";
  const headName = institutionData?.headId?.name || institutionData?.headName || "";

  return (
    <div className="space-y-5">
      <PageHeader title="My ID Card" description="Preview, download, print or email your current ID card." icon={BadgeCheck} status={<Badge variant="outline" className="capitalize">{personalCard?.status || "Unavailable"}</Badge>} />
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
      {cardRecord?._id && !isOwnCard && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">Your personal ID card was not found for this account.</div>}
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div ref={previewRef} className="flex justify-center overflow-x-auto">
          <ProfessionalIDCard
            role={cardType as any}
            name={owner.name || "Your Name"}
            idNumber={previewId}
            institutionName={institutionData?.name || "Educational Institution"}
            institutionLogo={institutionData?.logo || institutionData?.logoUrl}
            institutionAddress={institutionData?.address}
            institutionPhone={institutionData?.phone}
            institutionEmail={institutionData?.email}
            institutionWebsite={institutionData?.website}
            institutionSeal={institutionData?.seal}
            headSignature={institutionData?.headSignature}
            headName={headName}
            stream={previewStream}
            validityDate={personalCard?.validityEnd || undefined}
            photoUrl={owner?.avatar || profile?.avatar}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-sm text-slate-600">Valid: {personalCard?.validityStart ? formatDate(personalCard.validityStart) : "-"} to {personalCard?.validityEnd ? formatDate(personalCard.validityEnd) : "-"}</div>
          <DownloadButtons targetRef={previewRef} filename={personalCard?.cardNumber || "my-id-card"} cardId={personalCard?._id} />
        </div>
      </section>
    </div>
  );
}
