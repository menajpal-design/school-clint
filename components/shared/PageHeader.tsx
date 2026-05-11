"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageHeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  active?: boolean;
};

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: React.ReactNode;
  actions?: PageHeaderAction[];
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, status, actions = [], className }: PageHeaderProps) {
  return (
    <section className={cn("rounded-lg border border-slate-200 bg-white p-5 shadow-sm", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
              {status}
            </div>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              const content = (
                <>
                  {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
                  {action.label}
                </>
              );

              if (action.href) {
                return (
                  <Button key={`${action.label}-${action.href}`} asChild variant={action.active ? "default" : "outline"} size="sm">
                    <Link href={action.href}>{content}</Link>
                  </Button>
                );
              }

              return (
                <Button key={action.label} type="button" variant={action.active ? "default" : "outline"} size="sm" onClick={action.onClick}>
                  {content}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
