"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { IDCardPreview } from "@/components/id-cards/IDCardPreview";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function MyCardPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [card, setCard] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => { api.idCards.getMine().then(setCard).catch((err: any) => setError(err?.message || "No card found")); }, []);
  const owner = card?.ownerId || {};
  return (
    <div className="space-y-5">
      <PageHeader title="My ID Card" description="Preview, download, print or email your current ID card." icon={BadgeCheck} status={<Badge variant="outline" className="capitalize">{card?.status || "Unavailable"}</Badge>} />
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{error}</div>}
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div ref={previewRef}>
          <IDCardPreview type={card?.ownerType || "student"} name={owner.name || "Your Name"} id={card?.cardNumber || "ID-CARD"} qrData={card?.qrCodeData || card?.cardNumber || ""} barcode={card?.barcodeData || card?.cardNumber || ""} />
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <div className="text-sm text-slate-600">Valid: {card?.validityStart ? formatDate(card.validityStart) : "-"} to {card?.validityEnd ? formatDate(card.validityEnd) : "-"}</div>
          <DownloadButtons targetRef={previewRef} filename={card?.cardNumber || "my-id-card"} cardId={card?._id} />
        </div>
      </section>
    </div>
  );
}
