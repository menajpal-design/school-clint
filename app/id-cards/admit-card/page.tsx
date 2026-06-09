"use client";

import { BadgeCheck, Download, FileCheck2, Search, ShieldCheck } from "lucide-react";

import { AdmitCardDownload } from "@/components/id-cards/AdmitCardDownload";
import { PageHeader } from "@/components/shared/PageHeader";

const features = [
  { title: "Student database", text: "Search by name, roll, class or date of birth.", icon: Search },
  { title: "Professional PDF", text: "Fixed admit-card layout for clean download and print.", icon: Download },
  { title: "Verification ready", text: "QR, photo, exam, parent and institution details included.", icon: ShieldCheck },
];

export default function AdmitCardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Admit Card Management"
        description="Generate professional exam admit cards from student and exam records. Designed for office use, PDF download and print."
        icon={BadgeCheck}
        status={<span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"><FileCheck2 className="mr-1.5 h-3.5 w-3.5" /> Official Format</span>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        {features.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-white">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-slate-950">{item.title}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          );
        })}
      </section>

      <AdmitCardDownload />
    </div>
  );
}
