import { User } from '@/types';
import { apiClient } from './api';

class AuthManager {
  private user: User | null = null;

  setUser(user: User) {
    this.user = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (this.user) return this.user;
    
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          this.user = JSON.parse(stored);
          return this.user;
        }
      } catch (e) {
        // Invalid JSON in storage
      }
    }
    return null;
  }

  isAuthenticated(): boolean {
    const user = this.getUser();
    const token = apiClient.getToken();
    return !!user && !!token;
  }

  hasRole(role: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  }

  hasPermission(permission: string | string[]): boolean {
    const user = this.getUser();
    if (!user) return false;
    if (Array.isArray(permission)) {
      return permission.some((p) => user?.permissions.includes(p));
    }
    return user.permissions.includes(permission);
  }

  clear() {
    this.user = null;
    apiClient.clearToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  }
}

export const authManager = new AuthManager();

// Hydrate from localStorage on startup
export function hydrateAuth() {
  const token = apiClient.getToken();
  const user = authManager.getUser();
  return !!(token && user);
}