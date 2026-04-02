'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUser, setUser, setToken, clearToken, authApi } from '@/lib/api';

interface AuthContextValue {
  user: any;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = getUser();
    if (u) setUserState(u);
    setLoading(false);
  }, []);

  async function login(loginStr: string, password: string) {
    const res = await authApi.login(loginStr, password);
    setToken(res.access_token);
    setUser(res.user);
    setUserState(res.user);
  }

  function logout() {
    clearToken();
    setUserState(null);
    window.location.href = '/login';
  }

  function hasRole(role: string): boolean {
    if (!user?.roles) return false;
    return user.roles.includes(role) || user.roles.includes('admin');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
