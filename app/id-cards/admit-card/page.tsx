"use client";

import { BadgeCheck } from "lucide-react";

import { GenerateIDCardForm } from "@/components/id-cards/GenerateIDCardForm";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdmitCardPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admit Card"
        description="Create an English admit card with student photo, exam details, download buttons and mandatory QR code."
        icon={BadgeCheck}
      />
      <GenerateIDCardForm defaultCardType="admit-card" />
    </div>
  );
}
