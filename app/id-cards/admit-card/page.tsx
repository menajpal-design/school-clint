"use client";

import { BadgeCheck } from "lucide-react";

import { AdmitCardDownload } from "@/components/id-cards/AdmitCardDownload";
import { PageHeader } from "@/components/shared/PageHeader";

export default function AdmitCardPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Admit Card"
        description="Select a student from the database and download the admit card."
        icon={BadgeCheck}
      />
      <AdmitCardDownload />
    </div>
  );
}
