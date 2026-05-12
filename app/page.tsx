"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, BookOpenCheck, CreditCard, Loader2, ShieldCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authManager } from "@/lib/auth";

const features = [
  {
    title: "Academic Control",
    description: "Classes, subjects, exams, results and report cards in one clean workflow.",
    icon: BookOpenCheck,
  },
  {
    title: "Attendance & ID Cards",
    description: "Track daily attendance and connect every student, teacher and staff member with secure ID cards.",
    icon: BadgeCheck,
  },
  {
    title: "Finance & Reports",
    description: "Manage fees, salary, collections, due reports and receipts with role-aware access.",
    icon: CreditCard,
  },
];

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (authManager.isAuthenticated()) {
      router.replace("/dashboard");
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-7 w-7 animate-spin text-slate-700" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              D
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">DRMS</p>
              <p className="mt-1 text-xs text-slate-500">School/Madrasah Management</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/downloads">Download App</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Role-based school operations
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            DRMS School/Madrasah Management System
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600">
            A professional dashboard for academics, attendance, finance, ID cards, documents, notices, parents and staff operations.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/login">
                Login to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/register">Register institution</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/downloads">Download Android app</Link>
            </Button>
          </div>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersRound className="h-5 w-5 text-blue-600" />
              Live Module Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">{feature.title}</h2>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
