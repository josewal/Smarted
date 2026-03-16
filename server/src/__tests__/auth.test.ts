import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import supertest from 'supertest';
import { app } from '../index.js';
import { pool } from '../db/pool.js';

// These tests require a running PostgreSQL database with the schema applied.
// Set DATABASE_URL to a test database before running.

const request = supertest(app);
let agent: ReturnType<typeof supertest.agent>;

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'testpassword123';

beforeAll(async () => {
  // Run migration if needed - tables should exist
  agent = supertest.agent(app);
});

afterAll(async () => {
  // Clean up test user
  await pool.query('DELETE FROM users WHERE email = $1', [testEmail]).catch(() => {});
  await pool.end();
});

describe('POST /api/auth/register', () => {
  it('creates a new user with valid data', async () => {
    const res = await agent
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword, name: 'Test User' });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.email_verified).toBe(false);
  });

  it('rejects short passwords', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ email: 'short@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('8 characters');
  });

  it('rejects duplicate emails', async () => {
    const res = await request
      .post('/api/auth/register')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    const loginAgent = supertest.agent(app);
    const res = await loginAgent
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.email_verified).toBe(false);
  });

  it('returns generic error for wrong password', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('returns same generic error for non-existent email', async () => {
    const res = await request
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'anything123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('POST /api/auth/forgot-password', () => {
  it('always returns 200 regardless of email existence', async () => {
    const res1 = await request
      .post('/api/auth/forgot-password')
      .send({ email: testEmail });

    expect(res1.status).toBe(200);
    expect(res1.body.data.message).toContain('reset link');

    const res2 = await request
      .post('/api/auth/forgot-password')
      .send({ email: 'nonexistent@example.com' });

    expect(res2.status).toBe(200);
    expect(res2.body.data.message).toContain('reset link');
  });
});

describe('POST /api/auth/reset-password', () => {
  it('returns 400 for invalid token', async () => {
    const res = await request
      .post('/api/auth/reset-password')
      .send({ token: 'invalid-token', password: 'newpassword123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid or expired');
  });
});

describe('POST /api/auth/change-password', () => {
  it('requires authentication', async () => {
    const res = await request
      .post('/api/auth/change-password')
      .send({ currentPassword: testPassword, newPassword: 'newpassword123' });

    expect(res.status).toBe(401);
  });

  it('rejects wrong current password', async () => {
    const res = await agent
      .post('/api/auth/change-password')
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('incorrect');
  });
});

describe('POST /api/auth/verify-email', () => {
  it('returns 400 for invalid token', async () => {
    const res = await request
      .post('/api/auth/verify-email')
      .send({ token: 'invalid-token' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns user data when authenticated', async () => {
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data).toHaveProperty('email_verified');
  });

  it('returns 401 when not authenticated', async () => {
    const res = await request.get('/api/auth/me');

    expect(res.status).toBe(401);
  });
});
