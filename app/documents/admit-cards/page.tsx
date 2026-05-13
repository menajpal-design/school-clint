"use client";

import { useRef } from "react";
import { Ticket } from "lucide-react";

import { GenerateIDCardForm } from "@/components/id-cards/GenerateIDCardForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdmitCardsPage() {
  const previewRef = useRef<HTMLDivElement | null>(null);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Generate Admit Card"
        description="Create and download exam admit cards for students. Customize details, add QR codes, and export as PDF or PNG."
        icon={Ticket}
      />
      
      <div ref={previewRef}>
        <GenerateIDCardForm defaultCardType="admit-card" />
      </div>
    </div>
  );
}
