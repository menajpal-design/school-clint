"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function decodePayload(data: string | null) {
  if (!data) return null;
  try { return JSON.parse(decodeURIComponent(escape(atob(data)))); }
  catch {
    try { return JSON.parse(atob(data)); } catch { return null; }
  }
}

export default function FeeReceiptVerifyPage() {
  const params = useSearchParams();
  const payload = useMemo(() => decodePayload(params.get("data")), [params]);
  const valid = payload?.type === "premium_fee_receipt" && payload?.receiptNumber;

  return <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck className="h-9 w-9" /></div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Fee Receipt Verification</h1>
        <p className="mt-2 text-sm text-slate-600">QR code থেকে receipt data verify করা হচ্ছে।</p>
      </div>
      {!valid ? <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center"><XCircle className="mx-auto h-12 w-12 text-red-600" /><h2 className="mt-3 text-xl font-semibold text-red-800">Invalid Receipt QR</h2><p className="mt-2 text-sm text-red-700">এই QR code EasySchool premium fee receipt হিসেবে verify করা যায়নি।</p></CardContent></Card> : <Card className="overflow-hidden border-emerald-200 shadow-xl"><div className="bg-gradient-to-r from-emerald-800 to-amber-500 p-5 text-white"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] opacity-80">Verified Receipt</p><h2 className="text-2xl font-bold">{payload.institution || "EASY SCHOOL"}</h2></div><Badge className="w-fit bg-white text-emerald-800 hover:bg-white"><CheckCircle2 className="mr-1 h-4 w-4" />Verified</Badge></div></div><CardContent className="space-y-4 p-5"><div className="grid gap-3 md:grid-cols-2"><Info label="Receipt No" value={payload.receiptNumber} /><Info label="Student" value={payload.student} /><Info label="Roll" value={payload.roll} /><Info label="Class" value={payload.className} /><Info label="Section" value={payload.section} /><Info label="Amount" value={formatCurrency(payload.amount || 0)} /><Info label="Payment Method" value={payload.method || "Cash"} /><Info label="Payment Date" value={formatDate(payload.paymentDate)} /></div><div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><FileText className="mr-2 inline h-4 w-4" />Receipt QR data matched the EasySchool premium fee receipt format. For official dispute resolution, match this receipt number with school finance records.</div></CardContent></Card>}
    </div>
  </main>;
}
function Info({ label, value }: { label: string; value: any }) { return <div className="rounded-lg border bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-900">{value || "-"}</p></div>; }
