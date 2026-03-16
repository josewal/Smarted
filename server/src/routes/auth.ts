import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';

export const authRoutes = Router();

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

authRoutes.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name || null]
    );

    const user = result.rows[0];
    req.session.userId = user.id;

    // Create a default workspace
    await pool.query(
      'INSERT INTO workspaces (user_id, name, description) VALUES ($1, $2, $3)',
      [user.id, 'My Learning', 'Default workspace']
    );

    res.status(201).json({ data: user });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    req.session.userId = user.id;
    res.json({ data: { id: user.id, email: user.email, name: user.name, created_at: user.created_at } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

authRoutes.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ data: { ok: true } });
  });
});

authRoutes.get('/me', async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const result = await pool.query(
    'SELECT id, email, name, created_at FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = result.rows[0];
  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  res.json({ data: user });
});
