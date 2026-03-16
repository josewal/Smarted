import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudySession } from '../viewmodels/useStudySession';
import { CardViewer } from '../components/CardViewer';
import { RatingButtons } from '../components/RatingButtons';
import type { Rating } from 'smarted-shared';
import styles from '../styles/study.module.css';

interface StudySessionProps {
  workspaceId: string;
}

export function StudySession({ workspaceId }: StudySessionProps) {
  const {
    currentCard,
    progress,
    loading,
    sessionComplete,
    results,
    error,
    startSession,
    submitReview,
  } = useStudySession(workspaceId);

  const [flipped, setFlipped] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => { startSession(); }, [startSession]);

  useEffect(() => {
    if (currentCard) {
      setFlipped(false);
      startTimeRef.current = Date.now();
    }
  }, [currentCard]);

  const handleRate = (rating: Rating) => {
    const responseTimeMs = Date.now() - startTimeRef.current;
    submitReview(rating, responseTimeMs);
  };

  if (loading) return <div className={styles.loading}>Loading study session...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  if (sessionComplete) {
    const leeches = results.filter((r) => r.is_leech);
    const totalCorrect = results.filter((r) => {
      // We don't store the rating in results, but we can check if it was a leech
      return !r.is_leech;
    }).length;

    return (
      <div className={styles.sessionComplete}>
        <h1>Session complete</h1>
        <p>Reviewed {results.length} cards</p>
        {leeches.length > 0 && (
          <div className={styles.leechWarning}>
            {leeches.length} card{leeches.length > 1 ? 's' : ''} flagged as leeches
            (struggling with these — consider breaking them down)
          </div>
        )}
        <button className={styles.restartButton} onClick={startSession}>
          Study again
        </button>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className={styles.noCards}>
        <h1>No cards due</h1>
        <p>All caught up! Come back later or add more cards.</p>
      </div>
    );
  }

  return (
    <div className={styles.session}>
      {progress && (
        <div className={styles.progress}>
          {progress.current} / {progress.total}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentCard.card.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
        >
          <CardViewer
            front={currentCard.card.front}
            back={currentCard.card.back}
            flipped={flipped}
            onFlip={() => setFlipped(true)}
          />
        </motion.div>
      </AnimatePresence>

      {flipped && <RatingButtons onRate={handleRate} />}
    </div>
  );
}
