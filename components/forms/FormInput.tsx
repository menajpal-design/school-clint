"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({ label, error, className, ...props }: FormInputProps) {
  return (
    <label className="space-y-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <Input className={cn(error && "border-red-300 focus-visible:ring-red-500", className)} {...props} />
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}
