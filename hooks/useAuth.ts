'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types';
import { authManager } from '@/lib/auth';
import { api } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // First check if we have a token and stored user
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) {
          // Try to load user from storage first
          const storedUser = authManager.getUser();
          if (storedUser) {
            setUser(storedUser);
          }
          setIsLoading(false);
          
          // Then sync with server to get latest user info
          try {
            const profileData = await api.auth.profile() as User | { user: User };
            const userData = 'user' in profileData ? profileData.user : profileData;
            setUser(userData);
            authManager.setUser(userData);
          } catch (err) {
            // If profile fetch fails but we have stored user, keep using that
            if (storedUser) {
              setUser(storedUser);
            } else {
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
  if (Array.isArray(role)) {
    return role.includes(user.role);
  }
  return user.role === role;
}

export function useHasPermission(permission: string | string[]) {
  const { user } = useAuth();
  if (!user) return false;
  if (Array.isArray(permission)) {
    return permission.some((p) => user.permissions.includes(p));
  }
  return user.permissions.includes(permission);
}
