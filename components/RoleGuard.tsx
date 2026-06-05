'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, hasRole, normalizeUserRole } from '@/lib/permissions'

type Props = {
  roles?: string[]
  permissions?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGuard({ roles, permissions, fallback = null, children }: Props) {
  const { user } = useAuth() as any

  if (!user) return null

  const canonicalRole = normalizeUserRole(user.role) || user.role

  // School leaders and platform admins bypass permission checks.
  if (['admin', 'super_admin', 'head', 'assistant_head'].includes(canonicalRole)) return <>{children}</>

  if (roles && roles.length > 0 && hasRole(user, roles as any)) return <>{children}</>

  if (permissions && permissions.length > 0) {
    for (const p of permissions) {
      if (hasPermission(user, p)) return <>{children}</>
    }
  }

  return <>{fallback}</>
}

export default RoleGuard
