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
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
};

export function StatCard({ label, value, helper, icon: Icon, tone = "slate", loading, className }: StatCardProps) {
  return (
    <Card className={cn("border-slate-200 shadow-sm", className)}>
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold text-slate-950">{loading ? "..." : value}</p>
          {helper && <p className="mt-1 truncate text-xs text-slate-500">{helper}</p>}
        </div>
        {Icon && (
          <div className={cn("rounded-lg p-3", toneClasses[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
