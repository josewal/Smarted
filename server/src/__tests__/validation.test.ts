import { describe, it, expect } from 'vitest';
import { validatePassword, normalizeEmail } from '../services/auth/validation.js';

describe('validatePassword', () => {
  it('rejects passwords shorter than 8 characters', () => {
    expect(validatePassword('short')).toEqual({ valid: false, message: 'Password must be at least 8 characters long' });
    expect(validatePassword('1234567')).toEqual({ valid: false, message: 'Password must be at least 8 characters long' });
  });

  it('accepts passwords with exactly 8 characters', () => {
    expect(validatePassword('12345678')).toEqual({ valid: true });
  });

  it('accepts passwords longer than 8 characters', () => {
    expect(validatePassword('a-very-long-password-indeed')).toEqual({ valid: true });
  });

  it('rejects empty string', () => {
    expect(validatePassword('')).toEqual({ valid: false, message: 'Password must be at least 8 characters long' });
  });

  it('rejects whitespace-only strings shorter than 8', () => {
    expect(validatePassword('       ')).toEqual({ valid: false, message: 'Password must be at least 8 characters long' });
  });

  it('accepts very long passwords', () => {
    expect(validatePassword('a'.repeat(200))).toEqual({ valid: true });
  });
});

describe('normalizeEmail', () => {
  it('lowercases email', () => {
    expect(normalizeEmail('User@Example.COM')).toBe('user@example.com');
  });

  it('trims whitespace', () => {
    expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
  });

  it('lowercases and trims together', () => {
    expect(normalizeEmail('  User@Example.COM  ')).toBe('user@example.com');
  });
});
