'use client'

import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, hasRole } from '@/lib/permissions'

type Props = {
  roles?: string[]
  permissions?: string[]
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function RoleGuard({ roles, permissions, fallback = null, children }: Props) {
  const { user } = useAuth() as any

  if (!user) return null

  // School head and platform admins bypass permission checks.
  if (['admin', 'super_admin', 'head'].includes(user.role)) return <>{children}</>

  if (roles && roles.length > 0 && hasRole(user, roles as any)) return <>{children}</>

  if (permissions && permissions.length > 0) {
    for (const p of permissions) {
      if (hasPermission(user, p)) return <>{children}</>
    }
  }

  return <>{fallback}</>
}

export default RoleGuard
