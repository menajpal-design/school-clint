"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { getPreferredCurrency, setPreferredCurrency } from "@/lib/utils";

export default function SettingsPage() {
  const [currency, setCurrency] = useState<'BDT' | 'USD'>(() => getPreferredCurrency());
  useEffect(() => setCurrency(getPreferredCurrency()), []);

  const save = () => {
    setPreferredCurrency(currency);
    // small feedback could be added later
  };

  return (
    <div className="p-6">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Personalize application preferences.</p>
      </div>

      <div className="mt-6 grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
            <CardDescription>Choose display currency for finance pages. Default is Bangladeshi Taka (৳).</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="currency" value="BDT" checked={currency === 'BDT'} onChange={() => setCurrency('BDT')} />
                <span>BDT (৳)</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="currency" value="USD" checked={currency === 'USD'} onChange={() => setCurrency('USD')} />
                <span>USD ($)</span>
              </label>
            </div>
            <div className="mt-4">
              <Button onClick={save}>Save preference</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    title: "General",
    icon: Settings,
    color: "bg-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    fields: ["Institution display name", "Academic year"],
    description: "Basic institution settings and preferences"
  },
  {
    title: "Notification",
    icon: Bell,
    color: "bg-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    switches: ["Email notices", "SMS alerts", "Parent reminders"],
    description: "Configure notification preferences"
  },
  {
    title: "ID Card",
    icon: BadgeCheck,
    color: "bg-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    switches: ["Auto generate cards", "Renewal reminders"],
    fields: ["Default validity months"],
    description: "ID card generation and renewal settings"
  },
  {
    title: "Security",
    icon: LockKeyhole,
    color: "bg-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    switches: ["Require strong passwords", "Session timeout alerts"],
    description: "Security and authentication settings"
  },
  {
    title: "Backup",
    icon: DatabaseBackup,
    color: "bg-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    switches: ["Automatic backup", "Backup notifications"],
    fields: ["Backup location"],
    description: "Data backup and recovery settings"
  },
];

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <SlidersHorizontal className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Settings</h1>
          <p className="mt-2 text-lg text-slate-600">Configure your institution's preferences and system settings</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className={`group relative overflow-hidden border-2 ${section.borderColor} ${section.bgColor} shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105`}>
                <div className={`absolute inset-0 ${section.color} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <CardHeader className="relative pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-xl ${section.color} p-3 text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900">{section.title}</CardTitle>
                      <CardDescription className="text-slate-600">{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="relative space-y-6">
                  {section.fields?.map((field) => (
                    <div key={field} className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">{field}</Label>
                      <Input
                        placeholder={`Enter ${field.toLowerCase()}`}
                        className="border-border bg-card/80 backdrop-blur-sm focus:border-primary focus:ring-primary"
                      />
                    </div>
                  ))}
                  {section.title === "General" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-muted-foreground\">Default notice footer</Label>
                      <Textarea
                        placeholder="School notice footer"
                        className="border-border bg-card/80 backdrop-blur-sm focus:border-primary focus:ring-primary\"
                        rows={3}
                      />
                    </div>
                  )}
                  {section.switches?.map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-lg border border-border bg-card/60 p-4 shadow-sm backdrop-blur-sm transition-colors hover:bg-card/80">
                      <span className="text-sm font-medium text-slate-800">{item}</span>
                      <Switch className="data-[state=checked]:bg-blue-600" />
                    </div>
                  ))}
                  <Button
                    size="sm"
                    className={`w-full bg-gradient-to-r ${section.color} hover:opacity-90 text-white shadow-lg transition-all duration-300 hover:shadow-xl`}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save {section.title}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Badge variant="secondary" className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 text-sm font-medium">
            <Palette className="mr-2 h-4 w-4" />
            Professional Settings Management
          </Badge>
        </div>
      </div>
    </div>
  );
}
