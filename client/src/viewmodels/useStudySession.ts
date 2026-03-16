import { useState, useCallback } from 'react';
import { api } from '../api/client';
import type { StudyCard, Rating, ReviewResult } from 'smarted-shared';

export function useStudySession(workspaceId: string) {
  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSessionComplete(false);
    setCurrentIndex(0);
    setResults([]);
    try {
      const dueCards = await api.getDueCards(workspaceId);
      setCards(dueCards);
      if (dueCards.length === 0) {
        setSessionComplete(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start session');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const submitReview = useCallback(async (rating: Rating, responseTimeMs?: number) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      const result = await api.submitReview({
        card_id: currentCard.card.id,
        rating,
        response_time_ms: responseTimeMs,
      });
      setResults((prev) => [...prev, result]);

      if (currentIndex + 1 >= cards.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    }
  }, [cards, currentIndex]);

  const currentCard = cards[currentIndex] || null;
  const progress = cards.length > 0 ? { current: currentIndex + 1, total: cards.length } : null;

  return {
    currentCard,
    progress,
    loading,
    sessionComplete,
    results,
    error,
    startSession,
    submitReview,
  };
}
