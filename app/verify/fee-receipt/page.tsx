"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Camera, CheckCircle2, FileText, ShieldCheck, XCircle } from "lucide-react";
import { WebcamScanner } from "@/components/id-cards/WebcamScanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { findStudentForPayment } from "@/lib/student-normalizer";
import { formatCurrency, formatDate } from "@/lib/utils";

function decodePayload(data: string | null) {
  if (!data) return null;
  try { return JSON.parse(decodeURIComponent(escape(atob(data)))); }
  catch {
    try { return JSON.parse(atob(data)); }
    catch { try { return JSON.parse(data); } catch { return null; } }
  }
}
function dataFromScan(code: string) {
  const text = String(code || "").trim();
  if (!text) return "";
  try { const url = new URL(text); return url.searchParams.get("data") || text; }
  catch { const match = text.match(/[?&]data=([^&]+)/); return match?.[1] ? decodeURIComponent(match[1]) : text; }
}
const isMissing = (value: any) => !value || ["-", "student", "unnamed student"].includes(String(value).trim().toLowerCase());

export default function FeeReceiptVerifyPage() {
  const params = useSearchParams();
  const [scannedData, setScannedData] = useState("");
  const [scannerOpen, setScannerOpen] = useState(!params.get("data"));
  const [students, setStudents] = useState<any[]>([]);
  const [hydrateTried, setHydrateTried] = useState(false);
  const verifyData = scannedData || params.get("data") || "";
  const payload = useMemo(() => decodePayload(verifyData), [verifyData]);
  const valid = payload?.type === "premium_fee_receipt" && payload?.receiptNumber;
  const matchedStudent = useMemo(() => valid ? findStudentForPayment(students, payload) : null, [students, payload, valid]);
  const hydrated = matchedStudent ? { ...payload, student: matchedStudent.name || payload.student, roll: matchedStudent.roll || payload.roll, className: matchedStudent.className || payload.className, section: matchedStudent.section || payload.section } : payload;
  const missingStudentInfo = Boolean(valid && (isMissing(hydrated?.student) || isMissing(hydrated?.roll) || isMissing(hydrated?.className) || isMissing(hydrated?.section)));

  useEffect(() => {
    if (!valid) return;
    api.students.getAll({ skipToast: true }).then((data: any) => setStudents(data?.students || [])).catch(() => undefined).finally(() => setHydrateTried(true));
  }, [valid, verifyData]);

  const handleScan = (code: string) => { const data = dataFromScan(code); setScannedData(data); setScannerOpen(false); };

  return <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50 p-4 md:p-8">
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><ShieldCheck className="h-9 w-9" /></div>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">Fee Receipt Verification</h1>
        <p className="mt-2 text-sm text-slate-600">Scan the QR code or paste receipt QR data.</p>
        <Button className="mt-4" onClick={() => setScannerOpen((open) => !open)}><Camera className="mr-2 h-4 w-4" />{scannerOpen ? "Close Camera" : "Open Camera Scanner"}</Button>
      </div>
      {scannerOpen && <Card className="border-blue-200"><CardContent className="p-4"><WebcamScanner enabled={scannerOpen} onScan={handleScan} /></CardContent></Card>}
      {!verifyData ? <Card><CardContent className="p-6 text-center text-sm text-slate-600">Scan a QR code to verify the receipt.</CardContent></Card> : !valid ? <Card className="border-red-200 bg-red-50"><CardContent className="p-6 text-center"><XCircle className="mx-auto h-12 w-12 text-red-600" /><h2 className="mt-3 text-xl font-semibold text-red-800">Invalid Receipt QR</h2><p className="mt-2 text-sm text-red-700">This QR code is not a valid EasySchool premium fee receipt.</p></CardContent></Card> : <Card className="overflow-hidden border-emerald-200 shadow-xl"><div className="bg-gradient-to-r from-emerald-800 to-amber-500 p-5 text-white"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.22em] opacity-80">Verified Receipt</p><h2 className="text-2xl font-bold">{hydrated.institution || "EASY SCHOOL"}</h2></div><Badge className="w-fit bg-white text-emerald-800 hover:bg-white"><CheckCircle2 className="mr-1 h-4 w-4" />Verified</Badge></div></div><CardContent className="space-y-4 p-5"><div className="grid gap-3 md:grid-cols-2"><Info label="Receipt No" value={hydrated.receiptNumber} /><Info label="Student" value={hydrated.student} /><Info label="Roll" value={hydrated.roll} /><Info label="Class" value={hydrated.className} /><Info label="Section" value={hydrated.section} /><Info label="Amount" value={formatCurrency(hydrated.amount || 0)} /><Info label="Payment Method" value={hydrated.method || "Cash"} /><Info label="Payment Date" value={formatDate(hydrated.paymentDate)} /></div>{missingStudentInfo && hydrateTried && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Student information not found. Generate a new receipt so student data can be filled from /institution/students.</div>}<div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><FileText className="mr-2 inline h-4 w-4" />Receipt QR data matched the EasySchool premium fee receipt format. For official dispute resolution, match this receipt number with school finance records.</div></CardContent></Card>}
    </div>
  </main>;
}
function Info({ label, value }: { label: string; value: any }) { return <div className="rounded-lg border bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-900">{value || "-"}</p></div>; }
