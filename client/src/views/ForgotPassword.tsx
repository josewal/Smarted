import { useForgotPassword } from '../viewmodels/usePasswordReset';
import styles from '../styles/global.module.css';

export function ForgotPassword() {
  const { email, setEmail, loading, success, error, submit } = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1>Reset Password</h1>
        <p className={styles.loginSubtitle}>Enter your email to receive a reset link</p>

        {success ? (
          <div className={styles.success}>
            If an account with that email exists, a reset link has been sent. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formField}>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? '...' : 'Send reset link'}
            </button>
          </form>
        )}

        <a href="/login" className={styles.switchButton} style={{ display: 'inline-block', marginTop: '16px' }}>
          Back to login
        </a>
      </div>
    </div>
  );
}
