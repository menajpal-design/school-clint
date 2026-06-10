"use client";

import React from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  helper?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "slate" | "blue" | "emerald" | "amber" | "rose";
  loading?: boolean;
  className?: string;
}

const toneClasses = {
  slate: "bg-muted text-muted-foreground",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

export function StatCard({ label, value, helper, icon: Icon, tone = "slate", loading, className }: StatCardProps) {
  return (
    <Card className={cn("min-h-[112px] border-border shadow-sm", className)}>
      <CardContent className="flex min-h-[112px] items-center justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="h-5 truncate text-sm font-medium leading-5 text-muted-foreground">{label}</p>
          <div className="mt-2 flex h-9 items-center">
            {loading ? <span className="inline-block h-7 w-16 animate-pulse rounded-md bg-muted" aria-label="Loading" /> : <p className="truncate text-2xl font-semibold leading-9 text-foreground">{value}</p>}
          </div>
          <div className="mt-1 h-4">{helper && <p className="truncate text-xs leading-4 text-muted-foreground">{helper}</p>}</div>
        </div>
        {Icon && (
          <div className={cn("shrink-0 rounded-lg p-3", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
