"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActionDescriptor = {
  label?: string;
  icon?: React.ComponentType<{ className?: string }> | React.ComponentType<any>;
  href?: string;
  onClick?: () => void;
  active?: boolean;
};

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: React.ReactNode;
  actions?: Array<React.ReactNode | ActionDescriptor>;
  className?: string;
}

export function PageHeader({ title, description, icon: Icon, status, actions = [], className }: PageHeaderProps) {
  const renderAction = (action: React.ReactNode | ActionDescriptor, index: number) => {
    if (React.isValidElement(action)) return <React.Fragment key={index}>{action}</React.Fragment>;
    if (typeof action === "object" && action !== null) {
      const act = action as ActionDescriptor;
      const IconComp = act.icon as React.ComponentType<{ className?: string }> | undefined;
      const content = (
        <>
          {IconComp && <IconComp className="h-4 w-4" />}
          {act.label}
        </>
      );

      if (act.href) {
        return (
          <Link key={index} href={act.href} className="no-underline">
            <Button variant={act.active ? "default" : "outline"} size="sm" className="flex items-center gap-2 rounded-xl">{content}</Button>
          </Link>
        );
      }

      return (
        <Button key={index} variant={act.active ? "default" : "outline"} size="sm" onClick={act.onClick} className="flex items-center gap-2 rounded-xl">
          {content}
        </Button>
      );
    }
    return <React.Fragment key={index}>{action}</React.Fragment>;
  };

  return (
    <section className={cn("page-gradient-card overflow-hidden rounded-2xl p-5", className)}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{title}</h1>
              {status}
            </div>
            {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>}
          </div>
        </div>
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => renderAction(action, index))}
          </div>
        )}
      </div>
    </section>
  );
}