"use client";

import Link from "next/link";
import { ArrowRight, Database, MessageSquare, ShieldCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { easySchoolStorageMonthlyPrice, schoolPlans } from "@/lib/plans";

const money = (value: number) => `BDT ${value.toLocaleString()}`;

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="font-semibold">Easy School</Link>
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
                <Button asChild className="w-full">
                  <Link href={`/register?plan=${plan.code}`}>
                    Sign up
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><Database className="h-5 w-5" /> Storage charge</CardTitle>
            <CardDescription>Easy School storage is optional.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md border p-4">
              <div className="font-semibold">Use Easy School storage</div>
              <div className="mt-1 text-sm text-slate-600">{money(easySchoolStorageMonthlyPrice)} monthly extra charge.</div>
            </div>
            <div className="rounded-md border p-4">
              <div className="font-semibold">Use own MongoDB URI and ImgBB API</div>
              <div className="mt-1 text-sm text-slate-600">No extra storage cost.</div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
