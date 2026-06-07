"use client";

import { useEffect, useMemo, useState } from "react";
import { CreditCard, Download, Receipt, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { api, apiClient } from "@/lib/api";
import { printPremiumFeeReceipt } from "@/lib/premium-fee-receipt";
import { formatCurrency, formatDate } from "@/lib/utils";

export function StudentFeePaymentPanel() {
  const [path, setPath] = useState("");
  const [data, setData] = useState<any>(null);
  const [institutionProfile, setInstitutionProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState("");
  const [printingId, setPrintingId] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true); setError("");
    try {
      const [fees, profile] = await Promise.all([apiClient.get("/finance/my-fees", { skipToast: true }), api.institution.profile().catch(() => null) as Promise<any>]);
      setData(fees);
      setInstitutionProfile(profile?.institution || profile?.profile || null);
    } catch (e: any) { setError(e?.message || "Fee data load failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { setPath(window.location.pathname); }, []);
  useEffect(() => { if (path === "/profile" || path.startsWith("/finance/my-fees")) load().catch(() => undefined); }, [path]);

  const fees = useMemo(() => (data?.myFees || data?.fees || []).filter((f: any) => f.status !== "paid" && Number(f.amount || 0) > 0), [data]);
  const payments = useMemo(() => data?.payments || [], [data]);
  const settings = data?.paymentSettings || {};
  const due = fees.reduce((s: number, f: any) => s + Number(f.amount || 0), 0);
  const studentForPayment = (payment: any) => (data?.children || []).find((c: any) => String(c._id) === String(payment.studentId?._id || payment.studentId)) || payment.studentId;

  const payOnline = async (fee: any) => {
    setPayingId(String(fee._id)); setError("");
    try {
      const res: any = await apiClient.post("/finance/my-fees/pay", { feeId: fee._id, studentId: fee.studentId?._id || fee.studentId, amount: Number(fee.amount || 0) });
      if (res?.redirectUrl) window.location.href = res.redirectUrl;
      else setError("Gateway redirect URL পাওয়া যায়নি।");
    } catch (e: any) { setError(e?.message || "Payment start failed"); }
    finally { setPayingId(""); }
  };
  const downloadReceipt = async (payment: any) => {
    const id = String(payment._id || payment.receiptNumber || Date.now());
    setPrintingId(id);
    try { await printPremiumFeeReceipt(payment, studentForPayment(payment), institutionProfile); }
    finally { setPrintingId(""); }
  };

  if (!(path === "/profile" || path.startsWith("/finance/my-fees"))) return null;
  if (!data && !loading && !error) return null;

  return <div className="mx-auto w-full max-w-[1600px] px-3 md:px-6">
    <section className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-900"><CreditCard className="h-5 w-5" /><h2 className="text-lg font-bold">Student Fee Payment</h2></div>
          <p className="mt-1 text-sm text-emerald-800">মাসিক ও অন্যান্য ফি এখান থেকে দেখা যাবে। School online payment setting চালু থাকলে student/parent online payment করতে পারবে। Teacher/office offline টাকা জমা দিলে সেটিও Payment History-তে যুক্ত হবে এবং premium receipt download করা যাবে।</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>
      {error && <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading ? <div className="mt-4 text-sm text-emerald-800">Loading fee data...</div> : <>
        <div className="mt-4 grid gap-3 md:grid-cols-3"><div className="rounded-lg bg-white p-3"><div className="text-xs uppercase text-muted-foreground">Due</div><div className="text-xl font-bold">{formatCurrency(due)}</div></div><div className="rounded-lg bg-white p-3"><div className="text-xs uppercase text-muted-foreground">Payment History</div><div className="text-xl font-bold">{payments.length}</div></div><div className="rounded-lg bg-white p-3"><div className="text-xs uppercase text-muted-foreground">Online Payment</div><div className="mt-1"><Badge variant="outline" className={settings.onlineEnabled ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-amber-300 bg-amber-100 text-amber-700"}>{settings.onlineEnabled ? "Enabled" : "Disabled by school"}</Badge></div></div></div>
        <div className="mt-4 space-y-2">{fees.length === 0 ? <p className="rounded-lg bg-white p-3 text-sm text-muted-foreground">No due fee found.</p> : fees.slice(0, 8).map((fee: any) => <div key={fee._id} className="flex flex-col gap-3 rounded-lg border bg-white p-3 md:flex-row md:items-center md:justify-between"><div><div className="font-semibold capitalize">{fee.type || "Fee"} {fee.month || ""} {fee.year || ""}</div><div className="text-sm text-muted-foreground">Due: {formatDate(fee.dueDate)} · {formatCurrency(fee.amount || 0)}</div></div><Button onClick={() => payOnline(fee)} disabled={!settings.onlineEnabled || payingId === String(fee._id)}><CreditCard className="mr-2 h-4 w-4" />{payingId === String(fee._id) ? "Opening..." : "Pay Online"}</Button></div>)}</div>
        {payments.length > 0 && <div className="mt-4 rounded-lg border bg-white p-3"><div className="mb-2 flex items-center gap-2 font-semibold"><Receipt className="h-4 w-4" />Latest Payment History</div><div className="grid gap-2 md:grid-cols-2">{payments.slice(0, 4).map((p: any) => <div key={p._id} className="rounded-md border p-3 text-sm"><div className="flex items-start justify-between gap-2"><div><b>{p.receiptNumber || "Receipt"}</b><br />{formatCurrency(p.amount || 0)} · {p.paymentMethod || "cash"} · {formatDate(p.paymentDate || p.createdAt)}</div><Button size="sm" variant="outline" onClick={() => downloadReceipt(p)} disabled={printingId === String(p._id)}><Download className="mr-1 h-3 w-3" />Premium</Button></div></div>)}</div></div>}
      </>}
    </section>
  </div>;
}
