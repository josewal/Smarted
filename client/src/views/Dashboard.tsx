import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDashboard } from '../viewmodels/useDashboard';
import styles from '../styles/dashboard.module.css';

interface DashboardProps {
  workspaceId: string;
}

export function Dashboard({ workspaceId }: DashboardProps) {
  const { stats, loading, error, fetchStats } = useDashboard(workspaceId);
  const navigate = useNavigate();

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!stats) return null;

  return (
    <div className={styles.dashboard}>
      <h1>Dashboard</h1>

      <div className={styles.statsGrid}>
        <div
          className={`${styles.statCard} ${styles.statCardClickable}`}
          onClick={() => navigate('/study')}
        >
          <div className={styles.statValue}>{stats.cards_due_today}</div>
          <div className={styles.statLabel}>Cards due today</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total_cards}</div>
          <div className={styles.statLabel}>Total cards</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.total_reviews}</div>
          <div className={styles.statLabel}>Total reviews</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats.accuracy_percent}%</div>
          <div className={styles.statLabel}>Accuracy</div>
        </div>

        {stats.leeches_count > 0 && (
          <div className={`${styles.statCard} ${styles.statCardWarning}`}>
            <div className={styles.statValue}>{stats.leeches_count}</div>
            <div className={styles.statLabel}>Leeches</div>
          </div>
        )}
      </div>

      {stats.cards_due_today > 0 && (
        <button className={styles.studyButton} onClick={() => navigate('/study')}>
          Start studying ({stats.cards_due_today} cards due)
        </button>
      )}
    </div>
  );
}
