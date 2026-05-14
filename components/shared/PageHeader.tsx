"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: React.ReactNode;
  actions?: React.ReactNode[];
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, status, actions = [], className }: PageHeaderProps) {
  return (
    <section className={cn("rounded-lg border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
              {status}
            </div>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <React.Fragment key={index}>
                {action}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
