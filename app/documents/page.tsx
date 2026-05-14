"use client";

import { Ticket } from "lucide-react";

import { AdmitCardDownload } from "@/components/id-cards/AdmitCardDownload";
import { PageHeader } from "@/components/shared/PageHeader";

export default function DocumentsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Generate Admit Card"
        description="Select a student from the database and download the admit card."
        icon={Ticket}
      />

      <AdmitCardDownload />
    </div>
  );
}
