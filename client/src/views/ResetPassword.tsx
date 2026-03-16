import { useSearchParams } from 'react-router';
import { useResetPassword } from '../viewmodels/usePasswordReset';
import styles from '../styles/global.module.css';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { password, setPassword, confirmPassword, setConfirmPassword, loading, success, error, submit } = useResetPassword(token);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  if (!token) {
    return (
      <div className={styles.loginPage}>
        <div className={styles.loginCard}>
          <h1>Invalid Link</h1>
          <p>This reset link is invalid. Please request a new one.</p>
          <a href="/forgot-password" className={styles.switchButton} style={{ display: 'inline-block', marginTop: '16px' }}>
            Request new reset link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1>Set New Password</h1>
        <p className={styles.loginSubtitle}>Enter your new password</p>

        {success ? (
          <>
            <div className={styles.success}>Password has been reset successfully!</div>
            <a href="/login" className={styles.switchButton} style={{ display: 'inline-block', marginTop: '16px' }}>
              Go to login
            </a>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formField}>
              <label>New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                required
                minLength={8}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Minimum 8 characters
              </span>
            </div>
            <div className={styles.formField}>
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? '...' : 'Reset password'}
            </button>
          </form>
        )}

        {!success && (
          <a href="/forgot-password" className={styles.switchButton} style={{ display: 'inline-block', marginTop: '16px' }}>
            Request new reset link
          </a>
        )}
      </div>
    </div>
  );
}
