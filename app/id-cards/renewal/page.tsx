"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const nearExpiry = (date: string) => new Date(date).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 45;

export default function RenewalPage() {
  const [cards, setCards] = useState<any[]>([]);
  const load = async () => { const data = await api.idCards.getAll() as any[]; setCards(data || []); };
  useEffect(() => { load().catch(() => undefined); }, []);
  const renew = async (id: string, action = "approve") => { await api.idCards.renew(id, { extendYears: 1, action }); await load(); };
  const list = cards.filter((card) => card.status === "pending-renewal" || nearExpiry(card.validityEnd));
  return <div className="space-y-5">
    <PageHeader title="ID Card Renewal" description="Request, approve or reject renewal for student, teacher and staff cards." icon={RefreshCw} />
    <section className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"><Table><TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Card</TableHead><TableHead>Owner</TableHead><TableHead>Type</TableHead><TableHead>Valid Until</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{list.length === 0 ? <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">No renewal cards found.</TableCell></TableRow> : list.map((card) => <TableRow key={card._id}><TableCell>{card.cardNumber}</TableCell><TableCell>{card.ownerId?.name || "-"}</TableCell><TableCell className="capitalize">{card.ownerType}</TableCell><TableCell>{formatDate(card.validityEnd)}</TableCell><TableCell><Badge variant="outline" className="capitalize">{card.status}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => renew(card._id, "request")}>Request Renewal</Button><Button size="sm" onClick={() => renew(card._id, "approve")}>Approve</Button><Button size="sm" variant="destructive" onClick={() => renew(card._id, "reject")}>Reject</Button></div></TableCell></TableRow>)}</TableBody></Table></section>
  </div>;
}
