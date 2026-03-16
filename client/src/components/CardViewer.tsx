import { useState } from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/study.module.css';

interface CardViewerProps {
  front: string;
  back: string;
  flipped: boolean;
  onFlip: () => void;
}

export function CardViewer({ front, back, flipped, onFlip }: CardViewerProps) {
  return (
    <div className={styles.cardContainer} onClick={onFlip}>
      <motion.div
        className={styles.card}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className={styles.cardFace}>
          <p>{front}</p>
        </div>
        <div className={`${styles.cardFace} ${styles.cardBack}`}>
          <p>{back}</p>
        </div>
      </motion.div>
      {!flipped && (
        <p className={styles.flipHint}>Click to reveal answer</p>
      )}
    </div>
  );
}
