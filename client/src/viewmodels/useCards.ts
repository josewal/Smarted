import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { Card, CreateCardInput, UpdateCardInput } from 'smarted-shared';

export function useCards(workspaceId: string) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listCards(workspaceId);
      setCards(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const addCard = useCallback(async (input: CreateCardInput) => {
    const card = await api.createCard(input);
    setCards((prev) => [card, ...prev]);
    return card;
  }, []);

  const editCard = useCallback(async (id: string, input: UpdateCardInput) => {
    const updated = await api.updateCard(id, input);
    setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  const removeCard = useCallback(async (id: string) => {
    await api.deleteCard(id);
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const generateFromSource = useCallback(async (sourceId: string, count?: number) => {
    const generated = await api.generateCards(sourceId, workspaceId, count);
    setCards((prev) => [...generated, ...prev]);
    return generated;
  }, [workspaceId]);

  return { cards, loading, error, fetchCards, addCard, editCard, removeCard, generateFromSource };
}
