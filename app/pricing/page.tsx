"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CreditCard, Database, MessageSquare, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { easySchoolStorageMonthlyPrice, schoolPlans } from "@/lib/plans";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const money = (value: number) => `BDT ${value.toLocaleString()}`;

export default function PricingPage() {
  const [payPlan, setPayPlan] = useState<any>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");

  const amount = payPlan ? (billingCycle === "yearly" ? payPlan.yearlyPrice : payPlan.monthlyPrice) : 0;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">EASY SCHOOL</Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Login</Link></Button>
            <Button asChild size="sm"><Link href="/register">Sign up</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-4">School plans</Badge>
          <h1 className="text-4xl font-semibold tracking-tight">Choose a plan for your school</h1>
          <p className="mt-3 text-slate-600">
            Registration is free. Pick a plan to start signup, then activate the school after payment is received.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {schoolPlans.map((plan) => (
            <Card key={plan.code} className="border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UsersRound className="h-5 w-5 text-slate-700" />
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.studentLimit.toLocaleString()} student limit</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-2xl font-bold">{money(plan.monthlyPrice)}<span className="text-sm font-medium text-slate-500">/mo</span></div>
                  <div className="mt-1 text-sm text-slate-600">{money(plan.yearlyPrice)}/year</div>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> {plan.monthlySmsLimit} SMS/month</div>
                  <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {plan.yearlyDiscountPercent}% yearly discount</div>
                </div>
                <div className="grid gap-2">
                  <Button className="w-full" onClick={() => setPayPlan(plan)}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay Now
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/register?plan=${plan.code}`}>
                      Sign up
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Database className="h-5 w-5" /> Storage charge</CardTitle>
            <CardDescription>EASY SCHOOL storage is optional.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="font-semibold">Use EASY SCHOOL storage</div>
              <div className="mt-1 text-sm text-slate-600">{money(easySchoolStorageMonthlyPrice)} monthly extra charge.</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="font-semibold">Use own MongoDB URI and ImgBB API</div>
              <div className="mt-1 text-sm text-slate-600">No extra storage cost.</div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle>Payment automation documentation</CardTitle>
            <CardDescription>GatewayFlow compatible manual and SMS-sync payment process.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {[
              ["01", "Account Login", "Register or login from the portal."],
              ["02", "Brand Payment", "Send opening/subscription charge to bKash/Nagad and submit TrxID."],
              ["03", "Auto Approval", "Gateway SMS TrxID and submitted TrxID can be matched for approval."],
              ["04", "Android App", "Install the Android app and allow SMS permission for sync."],
              ["05", "SMS Sender", "Add bKash, Nagad, Rocket or required sender rules."],
              ["06", "Payment Verify", "Verify by transaction ID, sender number and amount."],
            ].map(([step, title, text]) => (
              <div key={step} className="rounded-md border p-4">
                <div className="text-xs font-semibold text-slate-500">{step}</div>
                <div className="mt-1 font-semibold">{title}</div>
                <div className="mt-1 text-sm text-slate-600">{text}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!payPlan} onOpenChange={(open) => !open && setPayPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay for {payPlan?.name}</DialogTitle>
            <DialogDescription>Send payment to bKash 0179007328, then continue signup with your TrxID and sender number.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border bg-slate-50 p-4 text-sm">
              <div className="font-medium text-slate-900">Payment cycle</div>
              <Select value={billingCycle} onValueChange={(value) => setBillingCycle(value as "monthly" | "yearly")}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly - {money(payPlan?.monthlyPrice || 0)}</SelectItem>
                  <SelectItem value="yearly">Yearly - {money(payPlan?.yearlyPrice || 0)} ({payPlan?.yearlyDiscountPercent || 0}% discount)</SelectItem>
                </SelectContent>
              </Select>
              <div className="mt-3">
                Payable amount: <span className="font-semibold">{money(amount)}</span>. EASY SCHOOL storage adds {money(easySchoolStorageMonthlyPrice)}/month if selected after signup.
              </div>
            </div>
            <Input value={trxId} onChange={(e) => setTrxId(e.target.value)} placeholder="Transaction ID" />
            <Input value={senderNumber} onChange={(e) => setSenderNumber(e.target.value)} placeholder="Sender number" />
            <Button asChild className="w-full">
              <Link href={`/register?plan=${payPlan?.code || "students_100"}&billingCycle=${billingCycle}&amount=${amount}&trxId=${encodeURIComponent(trxId)}&sender=${encodeURIComponent(senderNumber)}`}>
                Continue Signup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
