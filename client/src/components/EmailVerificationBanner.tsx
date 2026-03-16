import { useState } from 'react';
import { api } from '../api/client';
import styles from '../styles/global.module.css';

interface EmailVerificationBannerProps {
  onVerified?: () => void;
}

export function EmailVerificationBanner({ onVerified }: EmailVerificationBannerProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await api.resendVerification();
      setMessage('Verification email sent! Check your inbox.');
      onVerified?.();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.banner}>
      <span>
        {message || 'Please verify your email address. Check your inbox for a verification link.'}
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button className={styles.bannerButton} onClick={handleResend} disabled={loading}>
          {loading ? '...' : 'Resend'}
        </button>
        <button className={styles.bannerButton} onClick={() => setDismissed(true)} style={{ textDecoration: 'none', opacity: 0.7 }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
