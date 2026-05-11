"use client";

import { useState } from "react";
import { Layers } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const baseTemplates = [
  { id: "student", name: "Student", gradient: "from-blue-600 to-white", color: "#2563eb" },
  { id: "teacher", name: "Teacher", gradient: "from-emerald-600 to-white", color: "#059669" },
  { id: "staff", name: "Staff", gradient: "from-orange-500 to-white", color: "#f97316" },
];

export default function TemplatesPage() {
  const [selected, setSelected] = useState("student");
  const [radius, setRadius] = useState(10);
  const [fontSize, setFontSize] = useState(13);
  return <div className="space-y-5">
    <PageHeader title="ID Card Templates" description="Preview templates, select a default and adjust basic style settings." icon={Layers} status={<Badge variant="outline">Local templates</Badge>} />
    <section className="grid gap-4 md:grid-cols-3">{baseTemplates.map((tpl) => <Card key={tpl.id} className={selected === tpl.id ? "border-blue-500" : "border-slate-200"}><CardContent className="p-4"><div className={`h-40 rounded-lg bg-gradient-to-br ${tpl.gradient} p-4 shadow-inner`} style={{ borderRadius: radius }}><div className="text-sm font-semibold" style={{ fontSize }}>{tpl.name} ID Card</div><div className="mt-8 h-12 w-12 rounded bg-white/70" /><div className="mt-3 text-xs">Name · ID · Validity</div></div><div className="mt-3 flex items-center justify-between"><span className="font-medium">{tpl.name}</span><Button size="sm" variant={selected === tpl.id ? "default" : "outline"} onClick={() => setSelected(tpl.id)}>Select Default</Button></div></CardContent></Card>)}</section>
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><h2 className="font-semibold">Basic style settings</h2><div className="mt-3 grid gap-3 md:grid-cols-2"><label className="space-y-2"><span className="text-sm text-slate-700">Corner radius</span><Input type="number" value={radius} onChange={(e) => setRadius(Number(e.target.value))} /></label><label className="space-y-2"><span className="text-sm text-slate-700">Font size</span><Input type="number" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} /></label></div></section>
  </div>;
}
