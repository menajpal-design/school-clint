"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PlanLockedFeatureProps = {
  title?: string;
  description?: string;
  featureName?: string;
  className?: string;
  fullPage?: boolean;
  children?: ReactNode;
};

const previewBars = [72, 46, 88, 58, 64, 38, 78];

export function PlanLockedFeature({
  title,
  description,
  featureName = "এই ফিচার",
  className,
  fullPage = false,
  children,
}: PlanLockedFeatureProps) {
  const hasPreview = Boolean(children);

  return (
    <Card className={cn("overflow-hidden border-amber-200 bg-amber-50/60 shadow-sm", fullPage && "min-h-[58vh]", className)}>
      <CardContent className={cn("relative p-0", fullPage && "min-h-[58vh]")}>
        <div className={cn("pointer-events-none select-none blur-[3px] opacity-55", hasPreview ? "max-h-[70vh] overflow-hidden" : "p-5")}>
          {hasPreview ? (
            <div aria-hidden="true">{children}</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-white p-4">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="mt-4 h-8 w-20 rounded bg-slate-300" />
                  <div className="mt-3 h-2 w-full rounded bg-slate-100" />
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="h-3 w-28 rounded bg-slate-200" />
                  <div className="mt-4 h-8 w-16 rounded bg-slate-300" />
                  <div className="mt-3 h-2 w-4/5 rounded bg-slate-100" />
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <div className="h-3 w-20 rounded bg-slate-200" />
                  <div className="mt-4 h-8 w-24 rounded bg-slate-300" />
                  <div className="mt-3 h-2 w-3/4 rounded bg-slate-100" />
                </div>
              </div>
              <div className="mt-5 rounded-xl border bg-white p-4">
                <div className="flex h-44 items-end gap-3">
                  {previewBars.map((height, index) => (
                    <div key={index} className="flex flex-1 items-end rounded-t bg-teal-100">
                      <div className="w-full rounded-t bg-teal-400" style={{ height: `${height}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-white/55 p-4 backdrop-blur-[1px]">
          <div className="max-w-lg rounded-2xl border border-amber-200 bg-white/95 p-6 text-center shadow-lg">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              {title || `${featureName} আপনার বর্তমান প্যাকেজে নেই`}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description ||
                "এই অংশটি preview হিসেবে হাল্কা ঘোলা দেখানো হচ্ছে। পুরো ফিচার ব্যবহার করতে paid subscription active করতে হবে।"}
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/billing" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  প্যাকেজ আপডেট করুন
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">প্ল্যান দেখুন</Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
