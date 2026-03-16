import type { Rating } from 'smarted-shared';
import styles from '../styles/study.module.css';

interface RatingButtonsProps {
  onRate: (rating: Rating) => void;
  disabled?: boolean;
}

const ratings: { value: Rating; label: string; color: string }[] = [
  { value: 1, label: 'Again', color: 'var(--color-again)' },
  { value: 2, label: 'Hard', color: 'var(--color-hard)' },
  { value: 3, label: 'Good', color: 'var(--color-good)' },
  { value: 4, label: 'Easy', color: 'var(--color-easy)' },
];

export function RatingButtons({ onRate, disabled }: RatingButtonsProps) {
  return (
    <div className={styles.ratingButtons}>
      {ratings.map((r) => (
        <button
          key={r.value}
          className={styles.ratingButton}
          style={{ '--btn-color': r.color } as React.CSSProperties}
          onClick={() => onRate(r.value)}
          disabled={disabled}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
