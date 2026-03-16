import { pool } from '../pool.js';
import type { ReviewLog } from 'smarted-shared';

export async function createReviewLog(
  cardId: string,
  userId: string,
  rating: number,
  responseTimeMs?: number,
  scheduledDays?: number,
  actualDays?: number
): Promise<ReviewLog> {
  const result = await pool.query(
    `INSERT INTO review_logs (card_id, user_id, rating, response_time_ms, scheduled_days, actual_days)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [cardId, userId, rating, responseTimeMs || null, scheduledDays || null, actualDays || null]
  );
  return result.rows[0];
}

export async function getReviewsByCard(cardId: string, userId: string): Promise<ReviewLog[]> {
  const result = await pool.query(
    'SELECT * FROM review_logs WHERE card_id = $1 AND user_id = $2 ORDER BY reviewed_at DESC',
    [cardId, userId]
  );
  return result.rows;
}

export async function getReviewStats(userId: string, workspaceId: string) {
  const result = await pool.query(
    `SELECT
       COUNT(*) as total_reviews,
       COUNT(*) FILTER (WHERE rating >= 3) as correct_reviews,
       COUNT(DISTINCT card_id) as cards_reviewed
     FROM review_logs rl
     JOIN cards c ON c.id = rl.card_id
     WHERE rl.user_id = $1 AND c.workspace_id = $2`,
    [userId, workspaceId]
  );
  return result.rows[0];
}
