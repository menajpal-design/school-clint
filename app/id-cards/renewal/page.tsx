"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/utils";

const toast = (title: string, message: string, type: "success" | "error" | "info" = "success") => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("app-toast", { detail: { title, message, type, duration: 4500 } }));
};

const toArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.cards)) return data.cards;
  if (Array.isArray(data?.idCards)) return data.idCards;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const getOwnerName = (card: any) => card?.ownerId?.name || card?.owner?.name || card?.student?.name || card?.teacher?.name || card?.staff?.name || card?.name || "-";
const getCardId = (card: any) => String(card?._id || card?.id || card?.cardId || "");
const getValidUntil = (card: any) => card?.validityEnd || card?.validUntil || card?.expiresAt || card?.expiryDate || card?.updatedAt || card?.createdAt || "";
const getStatus = (card: any) => String(card?.status || "active");
const nearExpiry = (date?: string) => {
  if (!date) return false;
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return false;
  return time - Date.now() < 1000 * 60 * 60 * 24 * 45;
};

export default function RenewalPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.idCards.getAll({ includeRenewal: true });
      setCards(toArray(data));
    } catch (err: any) {
      setCards([]);
      setError(err?.message || "ID card renewal list load failed.");
      toast("Load failed", err?.message || "ID card renewal list load failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const renew = async (id: string, action = "approve") => {
    if (!id) return toast("Invalid card", "Card id missing.", "error");
    setSavingId(`${id}-${action}`);
    try {
      await api.idCards.renew(id, { extendYears: 1, action });
      toast("Renewal updated", `Renewal ${action} completed.`, "success");
      await load();
    } catch (err: any) {
      toast("Renewal failed", err?.message || "Could not update renewal.", "error");
    } finally {
      setSavingId("");
    }
  };

  const list = useMemo(() => cards.filter((card) => {
    const status = getStatus(card);
    return status === "pending-renewal" || status === "renewal-requested" || nearExpiry(getValidUntil(card));
  }), [cards]);

  return <div className="space-y-5 p-4 md:p-6">
    <PageHeader title="ID Card Renewal" description="Request, approve or reject renewal for student, teacher and staff cards." icon={RefreshCw} />

    <div className="grid gap-4 md:grid-cols-3">
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Cards</p><p className="text-2xl font-bold">{cards.length}</p></CardContent></Card>
      <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Renewal / Near Expiry</p><p className="text-2xl font-bold">{list.length}</p></CardContent></Card>
      <Card><CardContent className="p-4"><Button variant="outline" onClick={load} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Refresh</Button></CardContent></Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Renewal Cards</CardTitle>
        <CardDescription>{error ? error : "Cards expiring within 45 days or pending renewal will appear here."}</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow className="bg-muted hover:bg-muted"><TableHead>Card</TableHead><TableHead>Owner</TableHead><TableHead>Type</TableHead><TableHead>Valid Until</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading renewal cards...</TableCell></TableRow> : list.length === 0 ? <TableRow><TableCell colSpan={6} className="h-28 text-center text-muted-foreground">No renewal cards found.</TableCell></TableRow> : list.map((card) => {
              const id = getCardId(card);
              const validUntil = getValidUntil(card);
              const status = getStatus(card);
              return <TableRow key={id || card.cardNumber || Math.random()}><TableCell>{card.cardNumber || card.idCardNumber || "-"}</TableCell><TableCell>{getOwnerName(card)}</TableCell><TableCell className="capitalize">{card.ownerType || card.type || card.role || "-"}</TableCell><TableCell>{validUntil ? formatDate(validUntil) : "-"}</TableCell><TableCell><Badge variant="outline" className="capitalize">{status.replace(/-/g, " ")}</Badge></TableCell><TableCell><div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" disabled={!id || Boolean(savingId)} onClick={() => renew(id, "request")}>{savingId === `${id}-request` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Request</Button><Button size="sm" disabled={!id || Boolean(savingId)} onClick={() => renew(id, "approve")}>{savingId === `${id}-approve` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Approve</Button><Button size="sm" variant="destructive" disabled={!id || Boolean(savingId)} onClick={() => renew(id, "reject")}>{savingId === `${id}-reject` && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}Reject</Button></div></TableCell></TableRow>;
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>;
}
