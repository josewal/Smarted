import { pool } from '../pool.js';
import type { SourceMaterial } from 'smarted-shared';

export async function getSourcesByWorkspace(workspaceId: string): Promise<SourceMaterial[]> {
  const result = await pool.query(
    'SELECT * FROM source_materials WHERE workspace_id = $1 ORDER BY created_at DESC',
    [workspaceId]
  );
  return result.rows;
}

export async function getSourceById(id: string): Promise<SourceMaterial | null> {
  const result = await pool.query('SELECT * FROM source_materials WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function createSource(
  workspaceId: string,
  title: string,
  type: string,
  rawText: string | null
): Promise<SourceMaterial> {
  const result = await pool.query(
    `INSERT INTO source_materials (workspace_id, title, type, raw_text)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [workspaceId, title, type, rawText]
  );
  return result.rows[0];
}

export async function deleteSource(id: string): Promise<boolean> {
  const result = await pool.query('DELETE FROM source_materials WHERE id = $1', [id]);
  return (result.rowCount ?? 0) > 0;
}
