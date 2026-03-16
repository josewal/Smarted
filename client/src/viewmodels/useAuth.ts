import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import type { User } from 'smarted-shared';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.login(email, password) as User;
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const u = await api.register(email, password, name) as User;
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const u = await api.me();
      setUser(u);
    } catch {
      // ignore
    }
  }, []);

  return { user, loading, login, register, logout, refreshUser };
}
