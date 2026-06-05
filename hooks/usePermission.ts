import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { hasPermission, hasRole } from '@/lib/permissions'

export function usePermission() {
  const { user } = useAuth() as any

  const can = useMemo(() => {
    return (permission?: string) => {
      if (!permission) return false
      return hasPermission(user, permission)
    }
  }, [user])

  const isRole = useMemo(() => {
    return (roles?: string | string[]) => {
      if (!roles) return false
      return hasRole(user, Array.isArray(roles) ? roles : (roles as any))
    }
  }, [user])

  return { can, isRole }
}

export default usePermission
