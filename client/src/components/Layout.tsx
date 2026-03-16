import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import styles from '../styles/global.module.css';

interface LayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  return (
    <div className={styles.layout}>
      <nav className={styles.nav}>
        <div className={styles.navBrand}>Smarted</div>
        <div className={styles.navLinks}>
          <NavLink to="/" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            Dashboard
          </NavLink>
          <NavLink to="/study" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            Study
          </NavLink>
          <NavLink to="/cards" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            Cards
          </NavLink>
          <NavLink to="/sources" className={({ isActive }) => isActive ? styles.navLinkActive : styles.navLink}>
            Sources
          </NavLink>
        </div>
        {onLogout && (
          <button className={styles.logoutButton} onClick={onLogout}>
            Log out
          </button>
        )}
      </nav>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
