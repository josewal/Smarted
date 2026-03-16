import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { DashboardStats } from 'smarted-shared';

export function useDashboard(workspaceId: string) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats(workspaceId);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  return { stats, loading, error, fetchStats };
}
