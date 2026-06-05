'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authManager } from '@/lib/auth';
import { api, apiClient } from '@/lib/api';
import { normalizeUserRole } from '@/lib/permissions';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authManager.isDemoMode()) {
          const demoUser = authManager.getUser();
          setUser(demoUser);
          setIsLoading(false);
          return;
        }

        const token = apiClient.getToken();
        if (token) {
          const storedUser = authManager.getUser();
          if (storedUser) {
            setUser(storedUser);
          }
          setIsLoading(false);

          try {
            const profileData = await api.auth.profile() as User | { user: User };
            const userData = 'user' in profileData ? profileData.user : profileData;
            setUser(userData);
            authManager.setUser(userData);
          } catch (err) {
            if (!storedUser) {
              throw err;
            }
          }
          return;
        }

        setIsLoading(false);
      } catch (err) {
        setError((err as any).message || 'Failed to load user');
        setUser(null);
        authManager.clear();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const logout = () => {
    setUser(null);
    authManager.clear();
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
}

export function useHasRole(role: string | string[]) {
  const { user } = useAuth();
  if (!user) return false;
  const canonicalRole = normalizeUserRole(user.role) || user.role;
  if (Array.isArray(role)) {
    return role.some((candidate) => canonicalRole === normalizeUserRole(candidate) || candidate === canonicalRole);
  }
  return canonicalRole === (normalizeUserRole(role) || role);
}

export function useHasPermission(permission: string | string[]) {
  const { user } = useAuth();
  if (!user) return false;
  const normalizedPermissions = (user.permissions || []).flatMap((item) => [item, item.replace(/\./g, ':')]);
  if (Array.isArray(permission)) {
    return permission.some((p) => normalizedPermissions.includes(p));
  }
  return normalizedPermissions.includes(permission);
}
