import { pool } from '../pool.js';
import type { PasswordResetToken, EmailVerificationToken, User } from 'smarted-shared';

// -- Password Reset Tokens --

export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<PasswordResetToken> {
  const result = await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

export async function findValidPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
  const result = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL',
    [tokenHash]
  );
  return result.rows[0] || null;
}

export async function markPasswordResetTokenUsed(tokenId: string): Promise<void> {
  await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);
}

// -- Email Verification Tokens --

export async function createEmailVerificationToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<EmailVerificationToken> {
  const result = await pool.query(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3) RETURNING *',
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

export async function findValidEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null> {
  const result = await pool.query(
    'SELECT * FROM email_verification_tokens WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL',
    [tokenHash]
  );
  return result.rows[0] || null;
}

export async function markEmailVerified(userId: string): Promise<void> {
  await pool.query('UPDATE users SET email_verified = true WHERE id = $1', [userId]);
}

export async function markEmailVerificationTokenUsed(tokenId: string): Promise<void> {
  await pool.query('UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1', [tokenId]);
}

// -- User Queries --

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, userId]);
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

export async function findUserById(userId: string): Promise<(User & { password_hash: string }) | null> {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
  return result.rows[0] || null;
}
