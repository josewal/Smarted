import { useAccountSettings } from '../viewmodels/useAccountSettings';
import styles from '../styles/global.module.css';
import type { User } from 'smarted-shared';

interface AccountSettingsProps {
  user: User;
}

export function AccountSettings({ user }: AccountSettingsProps) {
  const {
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    loading, success, error,
    changePassword,
  } = useAccountSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    changePassword();
  };

  return (
    <div className={styles.settingsPage}>
      <h1>Account Settings</h1>

      <div className={styles.settingsSection}>
        <h2>Account Info</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Name:</strong> {user.name || '—'}</p>
        <p><strong>Email verified:</strong> {user.email_verified ? 'Yes' : 'No'}</p>
      </div>

      <div className={styles.settingsSection}>
        <h2>Change Password</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
            />
          </div>
          <div className={styles.formField}>
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              required
              minLength={8}
            />
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              Minimum 8 characters
            </span>
          </div>
          <div className={styles.formField}>
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? '...' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}
