import { pool } from '../pool.js';
import type { Card, CreateCardInput, UpdateCardInput } from 'smarted-shared';

export async function getCardsByWorkspace(workspaceId: string): Promise<Card[]> {
  const result = await pool.query(
    'SELECT * FROM cards WHERE workspace_id = $1 ORDER BY created_at DESC',
    [workspaceId]
  );
  return result.rows;
}

export async function getCardById(id: string): Promise<Card | null> {
  const result = await pool.query('SELECT * FROM cards WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createCard(input: CreateCardInput): Promise<Card> {
  const result = await pool.query(
    `INSERT INTO cards (workspace_id, front, back, card_type, origin, source_material_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      input.workspace_id,
      input.front,
      input.back,
      input.card_type || 'basic',
      input.origin || 'user',
      input.source_material_id || null,
    ]
  );
  return result.rows[0];
}

export async function updateCard(id: string, input: UpdateCardInput): Promise<Card | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (input.front !== undefined) {
    fields.push(`front = $${paramIndex++}`);
    values.push(input.front);
  }
  if (input.back !== undefined) {
    fields.push(`back = $${paramIndex++}`);
    values.push(input.back);
  }
  if (input.card_type !== undefined) {
    fields.push(`card_type = $${paramIndex++}`);
    values.push(input.card_type);
  }

  if (fields.length === 0) return getCardById(id);

  fields.push(`updated_at = now()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE cards SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
    values
  );
  return result.rows[0] || null;
}

export async function deleteCard(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM cards WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
