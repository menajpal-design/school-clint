"use client";

import { useEffect, useRef, useState } from "react";
import { BadgeCheck, Download, Search } from "lucide-react";

import DownloadButtons from "@/components/id-cards/DownloadButtons";
import { IDCardPreview } from "@/components/id-cards/IDCardPreview";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

type OwnerType = "student" | "teacher" | "staff";

export default function GeneratePage() {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [ownerType, setOwnerType] = useState<OwnerType>("student");
  const [search, setSearch] = useState("");
  const [people, setPeople] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [options, setOptions] = useState({ logo: true, watermark: true, qr: true, barcode: true });

  const load = async () => {
    const data = await api.idCards.searchOwners({ type: ownerType, search }) as any;
    setPeople(data.people || []);
  };
  useEffect(() => { load().catch(() => undefined); }, [ownerType]);

  const generate = async () => {
    if (!selected) return;
    const data = await api.idCards.generate({ ownerType, ownerId: selected._id, options }) as any;
    setCard(data.card);
  };

  const previewName = card?.ownerId?.name || selected?.userId?.name || "Select person";
  const previewId = card?.cardNumber || selected?.rollNumber || selected?.employeeId || "ID";

  return (
    <div className="space-y-5">
      <PageHeader title="Generate ID Card" description="Select a person, customize card options, preview and generate." icon={BadgeCheck} />
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <section className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <Step title="1. Card type"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={ownerType} onChange={(e) => { setOwnerType(e.target.value as OwnerType); setSelected(null); setCard(null); }}><option value="student">Student</option><option value="teacher">Teacher</option><option value="staff">Staff</option></select></Step>
          <Step title="2. Search person"><div className="flex gap-2"><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, roll or ID" /><Button onClick={load}><Search className="h-4 w-4" /></Button></div><div className="mt-2 max-h-56 space-y-2 overflow-auto">{people.map((p) => <button key={p._id} onClick={() => { setSelected(p); setCard(null); }} className="w-full rounded-md border border-slate-200 p-2 text-left text-sm hover:bg-slate-50">{p.userId?.name}<div className="text-xs text-slate-500">{p.rollNumber || p.employeeId}</div></button>)}</div></Step>
          <Step title="3. Template options"><div className="grid grid-cols-2 gap-2">{Object.entries(options).map(([key, value]) => <label key={key} className="flex items-center gap-2 text-sm capitalize"><input type="checkbox" checked={value} onChange={(e) => setOptions({ ...options, [key]: e.target.checked })} />{key}</label>)}</div></Step>
          <Button className="w-full" disabled={!selected} onClick={generate}>Generate Card</Button>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 font-semibold">4. Preview card</div>
          <div ref={previewRef}><IDCardPreview type={ownerType} name={previewName} id={previewId} qrData={options.qr ? previewId : ""} barcode={options.barcode ? previewId : ""} /></div>
          <div className="mt-4"><DownloadButtons targetRef={previewRef} filename={`id-${previewId}`} cardId={card?._id} /></div>
        </section>
      </div>
    </div>
  );
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h2 className="mb-2 text-sm font-semibold text-slate-950">{title}</h2>{children}</div>;
}
