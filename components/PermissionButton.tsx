'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, hasRole } from '@/lib/permissions'

type Props = React.ComponentProps<typeof Button> & {
  permission?: string
  roles?: string[]
  hideIfUnauthorized?: boolean
}

export function PermissionButton({ permission, roles, hideIfUnauthorized = true, children, ...rest }: Props) {
  const { user } = useAuth() as any

  const allowed = React.useMemo(() => {
    if (!user) return false
    if (user.role === 'head') return true
    if (roles && roles.length > 0 && hasRole(user, roles as any)) return true
    if (permission && hasPermission(user, permission)) return true
    return false
  }, [user, permission, roles])

  if (!allowed) {
    if (hideIfUnauthorized) return null
    return <Button disabled {...rest}>{children}</Button>
  }

  return <Button {...rest}>{children}</Button>
}

export default PermissionButton
