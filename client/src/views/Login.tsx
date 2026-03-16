import { useState } from 'react';
import { useSearchParams } from 'react-router';
import styles from '../styles/global.module.css';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<unknown>;
  onRegister: (email: string, password: string, name?: string) => Promise<unknown>;
}

export function Login({ onLogin, onRegister }: LoginProps) {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionExpired = searchParams.get('expired') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(email, password, name || undefined);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <h1>Smarted</h1>
        <p className={styles.loginSubtitle}>AI-powered spaced repetition</p>

        {sessionExpired && (
          <div className={styles.info}>Your session has expired. Please log in again.</div>
        )}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <div className={styles.formField}>
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}
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
          <div className={styles.formField}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={isRegister ? 8 : undefined}
            />
            {isRegister && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Minimum 8 characters
              </span>
            )}
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? '...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        {!isRegister && (
          <a href="/forgot-password" style={{ display: 'block', marginTop: '12px', fontSize: '13px', color: 'var(--color-primary)' }}>
            Forgot password?
          </a>
        )}

        <button
          className={styles.switchButton}
          onClick={() => { setIsRegister(!isRegister); setError(null); }}
        >
          {isRegister ? 'Already have an account? Log in' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
