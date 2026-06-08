"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, CreditCard, MessageSquare } from "lucide-react";
import { api } from "@/lib/api";
import { calculatePlanDue, getPlanByCode } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

const getDateValue = (billing: any) => billing?.subscriptionExpiresAt || billing?.planExpiry || billing?.expiresAt || billing?.validUntil || billing?.billingPeriodEnd || billing?.smsChargePeriodEnd || billing?.smsPeriodEnd;
const daysBetween = (value: any) => {
  if (!value) return null;
  const end = new Date(value).getTime();
  if (!Number.isFinite(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / 86400000));
};
const fmt = (value: any) => value ? new Date(value).toLocaleDateString("bn-BD", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

export default function BillingValidityPanel() {
  const [institution, setInstitution] = useState<any>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.institution.profile({ skipToast: true })
      .then((data: any) => setInstitution(data?.institution || null))
      .catch(() => setFailed(true));
  }, []);

  const info = useMemo(() => {
    const billing = institution?.billing || {};
    const plan = getPlanByCode(billing.planCode || "students_100");
    const expiry = getDateValue(billing);
    const remainingDays = daysBetween(expiry);
    const cycle = billing.billingCycle === "yearly" ? "yearly" : "monthly";
    const due = calculatePlanDue(billing.planCode || "students_100", cycle, billing.useEasySchoolStorage !== false);
    const smsChargeAmount = Number(billing.smsChargeAmount || 0);
    const paid = Number(billing.receivedAmount || 0);
    const paidDays = Number(billing.paidDays || (cycle === "yearly" ? 365 : 30));
    const total = Number(billing.monthlyBillAmount || billing.dueAmount || 0) || Number(due.total || 0) + smsChargeAmount;
    return { billing, plan, expiry, remainingDays, cycle, due, paid, paidDays, total };
  }, [institution]);

  if (failed || !institution) return null;

  return <section className="mx-auto max-w-4xl px-4 pt-4 sm:px-8">
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800"><CalendarClock className="h-4 w-4" /> কতদিন চলবে</div>
        <div className="mt-2 text-2xl font-bold text-emerald-900">{info.remainingDays === null ? "N/A" : `${info.remainingDays} দিন`}</div>
        <div className="mt-1 text-xs text-emerald-700">শেষ হবে: {fmt(info.expiry)}</div>
      </div>
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-blue-800"><CreditCard className="h-4 w-4" /> এই পেমেন্টে</div>
        <div className="mt-2 text-2xl font-bold text-blue-900">{formatCurrency(info.paid || info.total || 0)}</div>
        <div className="mt-1 text-xs text-blue-700">{info.cycle === "yearly" ? "বার্ষিক" : "মাসিক"} · প্রায় {info.paidDays} দিন · {info.plan?.name}</div>
      </div>
      <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-purple-800"><MessageSquare className="h-4 w-4" /> SMS কিনুন</div>
        <div className="mt-2 text-sm font-semibold text-purple-900">Billing popup system দিয়ে SMS recharge করা যাবে।</div>
        <Link href="/sms-monitoring" className="mt-2 inline-flex text-xs font-bold text-purple-700 underline">SMS Monitoring / Recharge খুলুন</Link>
      </div>
    </div>
  </section>;
}
