"use client";

import React from "react";

import { useAuth } from "@/hooks/useAuth";
import { hasPermission, hasRole } from "@/lib/permissions";
import { UserRole } from "@/types";

interface PermissionGuardProps {
  roles?: UserRole[] | UserRole;
  permission?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ roles, permission, fallback = null, children }: PermissionGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (roles && !hasRole(user, roles)) return <>{fallback}</>;
  if (permission && !hasPermission(user, permission)) return <>{fallback}</>;
  return <>{children}</>;
}
