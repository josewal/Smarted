import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { SourceMaterial } from 'smarted-shared';

export function useSources(workspaceId: string) {
  const [sources, setSources] = useState<SourceMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSources(workspaceId);
      setSources(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sources');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const addSource = useCallback(async (title: string, type: string, content: string) => {
    const source = await api.createSource(workspaceId, title, type, content);
    setSources((prev) => [source, ...prev]);
    return source;
  }, [workspaceId]);

  const removeSource = useCallback(async (id: string) => {
    await api.deleteSource(id);
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sources, loading, error, fetchSources, addSource, removeSource };
}
