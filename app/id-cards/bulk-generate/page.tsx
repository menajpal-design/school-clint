"use client";

import { useEffect, useState } from "react";
import { Download, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { authManager } from "@/lib/auth";

type OwnerType = "student" | "teacher" | "staff";

const displayName = (person: any) => person?.userId?.name || person?.name || person?.fullName || person?.studentName || person?.teacherName || person?.staffName || "Unnamed person";
const displayId = (person: any) => person?.rollNumber || person?.employeeId || person?.studentId || person?.staffId || person?.username || "-";

export default function BulkGeneratePage() {
  const { user } = useAuth();
  const [ownerType, setOwnerType] = useState<OwnerType>("student");
  const [people, setPeople] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const currentUser = user || authManager.getUser();
  const canBulkGenerate = ["head", "assistant_head", "super_admin", "admin"].includes(String(currentUser?.role || ""));

  const load = async () => {
    if (!canBulkGenerate) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await api.idCards.searchOwners({ type: ownerType, ownerType, search }) as any;
      setPeople(Array.isArray(data.people) ? data.people : []);
      setSelected([]);
      setProgress(0);
    } catch (err: any) {
      setPeople([]);
      setSelected([]);
      setMessage(err?.message || "Failed to load people.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load().catch(() => undefined); }, [ownerType, canBulkGenerate]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((x) => x !== id) : current.length >= 50 ? current : [...current, id]);
  const selectAll = () => setSelected((current) => current.length ? [] : people.map((p) => p._id).filter(Boolean).slice(0, 50));
  const generate = async () => {
    if (!selected.length) return;
    setLoading(true);
    setProgress(20);
    setMessage("Generating cards...");
    try {
      const data = await api.idCards.bulkGenerate({ type: ownerType, ownerType, ids: selected, ownerIds: selected }) as any;
      setProgress(100);
      setMessage(data.message || `Generated ${selected.length} cards`);
    } catch (err: any) {
      setProgress(0);
      setMessage(err?.message || "Bulk generation failed.");
    } finally {
      setLoading(false);
    }
  };
  const downloadSelection = () => {
    const blob = new Blob([JSON.stringify({ ownerType, selected }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "generated-id-cards.json"; a.click();
  };

  if (!canBulkGenerate) {
    return (
      <div className="space-y-5">
        <PageHeader title="Bulk ID Card Generate" description="Only authorized users can generate cards in a batch." icon={Users} />
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700 shadow-sm">
          You do not have access to bulk ID card generation.
        </section>
      </div>
    );
  }

  return <div className="space-y-5">
    <PageHeader title="Bulk ID Card Generate" description="Filter people, select up to 50 and generate cards in a batch." icon={Users} actions={[{ label: "Download JSON", icon: Download, onClick: downloadSelection }]} />
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-5"><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={ownerType} onChange={(e) => setOwnerType(e.target.value as OwnerType)}><option value="student">Student</option><option value="teacher">Teacher</option><option value="staff">Staff</option></select><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or department" /><Button onClick={load} disabled={loading}>{loading ? "Loading..." : "Filter"}</Button><Button variant="outline" onClick={selectAll} disabled={!people.length}>{selected.length ? "Clear" : "Select All"}</Button><Button disabled={loading || selected.length === 0} onClick={generate}>Generate {selected.length}</Button></div><div className="mt-3 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-blue-600" style={{ width: `${progress}%` }} /></div>{message && <p className="mt-2 text-sm text-slate-600">{message}</p>}</section>
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead></TableHead><TableHead>Name</TableHead><TableHead>ID</TableHead><TableHead>Info</TableHead></TableRow></TableHeader><TableBody>{people.length === 0 ? <TableRow><TableCell colSpan={4} className="h-28 text-center text-slate-500">{loading ? "Loading people..." : "No people found."}</TableCell></TableRow> : people.map((p) => <TableRow key={p._id}><TableCell><input type="checkbox" checked={selected.includes(p._id)} onChange={() => toggle(p._id)} /></TableCell><TableCell>{displayName(p)}</TableCell><TableCell>{displayId(p)}</TableCell><TableCell>{p.classId?.name || p.className || p.designation || p.department || ownerType}</TableCell></TableRow>)}</TableBody></Table></section>
  </div>;
}
