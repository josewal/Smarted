export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  return { valid: true };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
