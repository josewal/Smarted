import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { validatePassword, normalizeEmail } from '../services/auth/validation.js';
import { generateToken, hashToken } from '../services/auth/tokens.js';
import { sendEmail } from '../services/email/sender.js';
import { passwordResetEmail, emailVerificationEmail } from '../services/email/templates.js';
import { authLimiter } from '../middleware/rateLimit.js';
import {
  createPasswordResetToken,
  findValidPasswordResetToken,
  markPasswordResetTokenUsed,
  createEmailVerificationToken,
  findValidEmailVerificationToken,
  markEmailVerified,
  markEmailVerificationTokenUsed,
  updateUserPassword,
  findUserByEmail,
  findUserById,
} from '../db/queries/auth.js';

export const authRoutes = Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Extend session type
declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

// -- Register --

authRoutes.post('/register', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'validation_error', message: 'Email and password required' });
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({ error: 'validation_error', message: passwordCheck.message });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, email_verified, created_at',
      [normalizedEmail, passwordHash, name || null]
    );

    const user = result.rows[0];
    req.session.userId = user.id;

    // Create a default workspace
    await pool.query(
      'INSERT INTO workspaces (user_id, name, description) VALUES ($1, $2, $3)',
      [user.id, 'My Learning', 'Default workspace']
    );

    // Send verification email (fire-and-forget)
    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await createEmailVerificationToken(user.id, tokenHash, expiresAt);
    const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
    const emailContent = emailVerificationEmail(verifyUrl);
    sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });

    res.status(201).json({ data: user });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      res.status(409).json({ error: 'conflict', message: 'Email already registered' });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'server_error', message: 'Registration failed' });
  }
});

// -- Login --

authRoutes.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: 'validation_error', message: 'Email and password required' });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await findUserByEmail(normalizedEmail);
    if (!user) {
      res.status(401).json({ error: 'auth_error', message: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'auth_error', message: 'Invalid email or password' });
      return;
    }

    req.session.userId = user.id;
    res.json({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        email_verified: user.email_verified,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'server_error', message: 'Login failed' });
  }
});

// -- Logout --

authRoutes.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ data: { ok: true } });
  });
});

// -- Get Current User --

authRoutes.get('/me', async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'auth_error', message: 'Not authenticated' });
    return;
  }

  const result = await pool.query(
    'SELECT id, email, name, email_verified, created_at FROM users WHERE id = $1',
    [req.session.userId]
  );
  const user = result.rows[0];
  if (!user) {
    res.status(401).json({ error: 'auth_error', message: 'User not found' });
    return;
  }

  res.json({ data: user });
});

// -- Forgot Password --

authRoutes.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'validation_error', message: 'Email is required' });
      return;
    }

    const normalizedEmail = normalizeEmail(email);
    const user = await findUserByEmail(normalizedEmail);

    // Always return success to prevent email enumeration
    if (user) {
      const token = generateToken();
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await createPasswordResetToken(user.id, tokenHash, expiresAt);
      const resetUrl = `${CLIENT_URL}/reset-password?token=${token}`;
      const emailContent = passwordResetEmail(resetUrl);
      sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });
    }

    res.json({ data: { message: 'If an account with that email exists, a reset link has been sent.' } });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to process request' });
  }
});

// -- Reset Password --

authRoutes.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      res.status(400).json({ error: 'validation_error', message: 'Token and password are required' });
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({ error: 'validation_error', message: passwordCheck.message });
      return;
    }

    const tokenHash = hashToken(token);
    const resetToken = await findValidPasswordResetToken(tokenHash);
    if (!resetToken) {
      res.status(400).json({ error: 'invalid_token', message: 'Invalid or expired reset link. Please request a new one.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await updateUserPassword(resetToken.user_id, passwordHash);
    await markPasswordResetTokenUsed(resetToken.id);

    res.json({ data: { message: 'Password has been reset successfully.' } });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to reset password' });
  }
});

// -- Change Password --

authRoutes.post('/change-password', async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'auth_error', message: 'Not authenticated' });
    return;
  }

  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'validation_error', message: 'Current and new password are required' });
      return;
    }

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      res.status(400).json({ error: 'validation_error', message: passwordCheck.message });
      return;
    }

    const user = await findUserById(req.session.userId);
    if (!user) {
      res.status(401).json({ error: 'auth_error', message: 'User not found' });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'auth_error', message: 'Current password is incorrect' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateUserPassword(user.id, passwordHash);

    res.json({ data: { message: 'Password changed successfully.' } });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to change password' });
  }
});

// -- Verify Email --

authRoutes.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'validation_error', message: 'Token is required' });
      return;
    }

    const tokenHash = hashToken(token);
    const verificationToken = await findValidEmailVerificationToken(tokenHash);
    if (!verificationToken) {
      res.status(400).json({ error: 'invalid_token', message: 'Invalid or expired verification link.' });
      return;
    }

    await markEmailVerified(verificationToken.user_id);
    await markEmailVerificationTokenUsed(verificationToken.id);

    res.json({ data: { message: 'Email verified successfully.' } });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to verify email' });
  }
});

// -- Resend Verification --

authRoutes.post('/resend-verification', authLimiter, async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'auth_error', message: 'Not authenticated' });
    return;
  }

  try {
    const user = await findUserById(req.session.userId);
    if (!user) {
      res.status(401).json({ error: 'auth_error', message: 'User not found' });
      return;
    }

    if (user.email_verified) {
      res.json({ data: { message: 'Email is already verified.' } });
      return;
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await createEmailVerificationToken(user.id, tokenHash, expiresAt);
    const verifyUrl = `${CLIENT_URL}/verify-email?token=${token}`;
    const emailContent = emailVerificationEmail(verifyUrl);
    sendEmail({ to: user.email, subject: emailContent.subject, html: emailContent.html });

    res.json({ data: { message: 'Verification email sent.' } });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ error: 'server_error', message: 'Failed to resend verification email' });
  }
});
