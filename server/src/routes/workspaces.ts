import { Router } from 'express';
import { pool } from '../db/pool.js';

export const workspaceRoutes = Router();

workspaceRoutes.get('/', async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const result = await pool.query(
      'SELECT * FROM workspaces WHERE user_id = $1 ORDER BY created_at ASC',
      [userId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error('List workspaces error:', err);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});
