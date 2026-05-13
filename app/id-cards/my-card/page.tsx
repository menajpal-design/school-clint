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
  const [error, setError] = useState("");

  useEffect(() => {
    api.idCards.getMine().then(setCard).catch((err: any) => setError(err?.message || "No card found"));
    api.auth.profile().then((data: any) => setProfile(data.user || data)).catch(() => undefined);
  }, []);

  const owner = card?.ownerId || profile || {};
  const institution = owner?.institution || profile?.institution || {};
  const cardType = owner?.role === "head" ? "head" : owner?.role === "teacher" ? "teacher" : owner?.role === "staff" ? "staff" : card?.ownerType || "student";
  const previewId = card?.cardNumber || owner?.employeeId || owner?.rollNumber || owner?.id || "ID-CARD";
  const previewStream = owner?.classId?.name || owner?.className || owner?.designation || owner?.department || "";
  const headName = institution?.headId?.name || institution?.headName || "Institution Head";

  return (
    <div className="space-y-5">
      <PageHeader title="My ID Card" description="Preview, download, print or email your current ID card." icon={BadgeCheck} status={<Badge variant="outline" className="capitalize">{card?.status || "Unavailable"}</Badge>} />
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div ref={previewRef} className="flex justify-center overflow-x-auto">
          <ProfessionalIDCard
            role={cardType as any}
            name={owner.name || "Your Name"}
            idNumber={previewId}
            institutionName={institution?.name || "Educational Institution"}
            institutionLogo={institution?.logo || institution?.logoUrl}
            institutionSeal={institution?.seal}
            headSignature={institution?.headSignature}
            headName={headName}
            stream={previewStream}
            validityDate={card?.validityEnd || undefined}
            photoUrl={owner?.avatar || profile?.avatar}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-sm text-slate-600">Valid: {card?.validityStart ? formatDate(card.validityStart) : "-"} to {card?.validityEnd ? formatDate(card.validityEnd) : "-"}</div>
          <DownloadButtons targetRef={previewRef} filename={card?.cardNumber || "my-id-card"} cardId={card?._id} />
        </div>
      </section>
    </div>
  );
}
