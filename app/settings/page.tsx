"use client";

import { BadgeCheck, Bell, DatabaseBackup, LockKeyhole, Settings, SlidersHorizontal } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const sections = [
  { title: "General", icon: Settings, fields: ["Institution display name", "Academic year"] },
  { title: "Notification", icon: Bell, switches: ["Email notices", "SMS alerts", "Parent reminders"] },
  { title: "ID Card", icon: BadgeCheck, switches: ["Auto generate cards", "Renewal reminders"], fields: ["Default validity months"] },
  { title: "Security", icon: LockKeyhole, switches: ["Require strong passwords", "Session timeout alerts"] },
  { title: "Backup", icon: DatabaseBackup, switches: ["Automatic backup", "Backup notifications"], fields: ["Backup location"] },
];

export default function SettingsPage() {
  return (
    <div className="space-y-5 bg-gray-50 text-slate-950">
      <PageHeader title="Settings" description="Configure general, notification, ID card, security and backup preferences." icon={SlidersHorizontal} />
      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700"><Icon className="h-5 w-5" /></div>
                <h2 className="font-semibold text-slate-950">{section.title}</h2>
              </div>
              <div className="mt-5 space-y-4">
                {section.fields?.map((field) => <div key={field}><Label className="mb-2 block">{field}</Label><Input placeholder={field} /></div>)}
                {section.title === "General" && <div><Label className="mb-2 block">Default notice footer</Label><Textarea placeholder="School notice footer" /></div>}
                {section.switches?.map((item) => <div key={item} className="flex items-center justify-between rounded-md border border-slate-200 p-3"><span className="text-sm font-medium">{item}</span><Switch /></div>)}
              </div>
              <div className="mt-5"><Button size="sm">Save {section.title}</Button></div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
