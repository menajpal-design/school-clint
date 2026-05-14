"use client";

import React from "react";
import { RefreshCw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchFilterBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onRefresh?: () => void;
  children?: React.ReactNode;
}

export function SearchFilterBar({ value, onChange, placeholder = "Search records", onRefresh, children }: SearchFilterBarProps) {
  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
      {children}
      {onRefresh && (
        <Button variant="outline" size="icon" onClick={onRefresh} title="Refresh records">
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
