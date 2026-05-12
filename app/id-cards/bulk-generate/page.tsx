"use client";

import { useEffect, useState } from "react";
import { Download, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";

type OwnerType = "student" | "teacher" | "staff";

export default function BulkGeneratePage() {
  const [ownerType, setOwnerType] = useState<OwnerType>("student");
  const [people, setPeople] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const load = async () => { const data = await api.idCards.searchOwners({ type: ownerType, search }) as any; setPeople(data.people || []); setSelected([]); };
  useEffect(() => { load().catch(() => undefined); }, [ownerType]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : current.length >= 50 ? current : [...current, id]);
  const generate = async () => {
    setProgress(20);
    const data = await api.idCards.bulkGenerate({ type: ownerType, ids: selected }) as any;
    setProgress(100);
    setMessage(data.message || `Generated ${selected.length} cards`);
  };
  const downloadSelection = () => {
    const blob = new Blob([JSON.stringify({ ownerType, selected }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "generated-id-cards.json"; a.click();
  };

  return <div className="space-y-5">
    <PageHeader title="Bulk ID Card Generate" description="Filter people, select up to 50 and generate cards in a batch." icon={Users} actions={[{ label: "Download JSON", icon: Download, onClick: downloadSelection }]} />
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-4"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={ownerType} onChange={(e) => setOwnerType(e.target.value as OwnerType)}><option value="student">Student</option><option value="teacher">Teacher</option><option value="staff">Staff</option></select><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or department" /><Button onClick={load}>Filter</Button><Button disabled={selected.length === 0} onClick={generate}>Generate {selected.length}</Button></div><div className="mt-3 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-600" style={{ width: `${progress}%` }} /></div>{message && <p className="mt-2 text-sm text-slate-600">{message}</p>}</section>
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead></TableHead><TableHead>Name</TableHead><TableHead>ID</TableHead><TableHead>Info</TableHead></TableRow></TableHeader><TableBody>{people.map((p) => <TableRow key={p._id}><TableCell><input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} /></TableCell><TableCell>{p.userId?.name}</TableCell><TableCell>{p.rollNumber || p.employeeId}</TableCell><TableCell>{p.classId?.name || p.department || ownerType}</TableCell></TableRow>)}</TableBody></Table></section>
  </div>;
}
