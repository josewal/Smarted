export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: 'Reset your Smarted password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>You requested a password reset for your Smarted account.</p>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="display: inline-block; padding: 10px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p style="color: #666; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };
}

export function emailVerificationEmail(verifyUrl: string): { subject: string; html: string } {
  return {
    subject: 'Verify your Smarted email',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify your email</h2>
        <p>Welcome to Smarted! Please verify your email address to enable account recovery.</p>
        <p><a href="${verifyUrl}" style="display: inline-block; padding: 10px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Verify Email</a></p>
        <p style="color: #666; font-size: 13px;">This link expires in 24 hours.</p>
      </div>
    `,
  };
}
