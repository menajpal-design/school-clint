"use client";

import { Ticket } from "lucide-react";

import { AdmitCardDownload } from "@/components/id-cards/AdmitCardDownload";
import { PageHeader } from "@/components/shared/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { isFreeLifetimePlan } from "@/lib/permissions";
import { PlanLockedFeature } from "@/components/shared/PlanLockedFeature";

export default function AdmitCardsPage() {
  const { user } = useAuth();
  const isFree = isFreeLifetimePlan(user);

  if (isFree) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title="Generate Admit Card" icon={Ticket} />
        <div className="mt-6">
          <PlanLockedFeature
            title="Admit Card মডিউলটি লক করা আছে"
            description="স্টুডেন্টদের জন্য অ্যাডমিট কার্ড ডিজাইন, ওয়ান-ক্লিক জেনারেশন এবং প্রিন্ট ফিচার ব্যবহার করতে দয়া করে সাবস্ক্রিপশন আপডেট করুন।"
            featureName="Admit Card Feature"
            fullPage
          />
        </div>
      </div>
    );
  }

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
