import { pool } from '../pool.js';
import type { CardSchedule } from 'smarted-shared';

export async function getScheduleForCard(cardId: string, userId: string): Promise<CardSchedule | null> {
  const result = await pool.query(
    'SELECT * FROM card_schedules WHERE card_id = $1 AND user_id = $2',
    [cardId, userId]
  );
  return result.rows[0] || null;
}

export async function getDueCards(userId: string, workspaceId: string, limit = 50): Promise<CardSchedule[]> {
  const result = await pool.query(
    `SELECT cs.* FROM card_schedules cs
     JOIN cards c ON c.id = cs.card_id
     WHERE cs.user_id = $1 AND c.workspace_id = $2 AND cs.due_date <= now()
     ORDER BY cs.due_date ASC
     LIMIT $3`,
    [userId, workspaceId, limit]
  );
  return result.rows;
}

export async function createSchedule(cardId: string, userId: string): Promise<CardSchedule> {
  const result = await pool.query(
    `INSERT INTO card_schedules (card_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (card_id, user_id) DO NOTHING
     RETURNING *`,
    [cardId, userId]
  );
  // If already exists, fetch it
  if (result.rows.length === 0) {
    return (await getScheduleForCard(cardId, userId))!;
  }
  return result.rows[0];
}

export async function updateSchedule(
  cardId: string,
  userId: string,
  update: {
    stability: number;
    difficulty: number;
    state: string;
    due_date: string;
    lapses: number;
    reps: number;
    last_review: string;
  }
): Promise<CardSchedule> {
  const result = await pool.query(
    `UPDATE card_schedules
     SET stability = $3, difficulty = $4, state = $5,
         due_date = $6, lapses = $7, reps = $8, last_review = $9
     WHERE card_id = $1 AND user_id = $2
     RETURNING *`,
    [
      cardId, userId,
      update.stability, update.difficulty, update.state,
      update.due_date, update.lapses, update.reps, update.last_review,
    ]
  );
  return result.rows[0];
}

export async function getLeeches(userId: string, workspaceId: string, threshold = 5): Promise<CardSchedule[]> {
  const result = await pool.query(
    `SELECT cs.* FROM card_schedules cs
     JOIN cards c ON c.id = cs.card_id
     WHERE cs.user_id = $1 AND c.workspace_id = $2 AND cs.lapses >= $3
     ORDER BY cs.lapses DESC`,
    [userId, workspaceId, threshold]
  );
  return result.rows;
}
