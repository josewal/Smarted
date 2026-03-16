import { describe, it, expect } from 'vitest';
import { generateToken, hashToken } from '../services/auth/tokens.js';

describe('generateToken', () => {
  it('returns a 64-character hex string (32 bytes)', () => {
    const token = generateToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns unique values on successive calls', () => {
    const token1 = generateToken();
    const token2 = generateToken();
    expect(token1).not.toBe(token2);
  });
});

describe('hashToken', () => {
  it('returns consistent SHA-256 hash for same input', () => {
    const token = 'test-token-value';
    const hash1 = hashToken(token);
    const hash2 = hashToken(token);
    expect(hash1).toBe(hash2);
  });

  it('returns a 64-character hex string', () => {
    const hash = hashToken('any-input');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('returns different hash for different input', () => {
    const hash1 = hashToken('input-one');
    const hash2 = hashToken('input-two');
    expect(hash1).not.toBe(hash2);
  });
});
