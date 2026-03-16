import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from '../viewmodels/useAuth';
import { Layout } from '../components/Layout';
import { EmailVerificationBanner } from '../components/EmailVerificationBanner';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { StudySession } from './StudySession';
import { CardEditor } from './CardEditor';
import { SourceManager } from './SourceManager';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { AccountSettings } from './AccountSettings';
import type { Workspace } from 'smarted-shared';

export function App() {
  const { user, loading, login, register, logout, refreshUser } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!user) {
      setWorkspace(null);
      return;
    }

    fetch('/api/workspaces', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setWorkspace(json.data[0]);
        }
      })
      .catch(() => {});
  }, [user]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/forgot-password" element={user ? <Navigate to="/" replace /> : <ForgotPassword />} />
        <Route path="/reset-password" element={user ? <Navigate to="/" replace /> : <ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmailRedirect />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login onLogin={login} onRegister={register} />}
        />

        {/* Protected routes */}
        <Route
          path="*"
          element={
            !user ? (
              <Login onLogin={login} onRegister={register} />
            ) : !workspace ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading workspace...</div>
            ) : (
              <Layout onLogout={logout}>
                {!user.email_verified && <EmailVerificationBanner onVerified={refreshUser} />}
                <Routes>
                  <Route path="/" element={<Dashboard workspaceId={workspace.id} />} />
                  <Route path="/study" element={<StudySession workspaceId={workspace.id} />} />
                  <Route path="/cards" element={<CardEditor workspaceId={workspace.id} />} />
                  <Route path="/sources" element={<SourceManager workspaceId={workspace.id} />} />
                  <Route path="/settings" element={<AccountSettings user={user} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function VerifyEmailRedirect() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    import('../api/client').then(({ api }) => {
      api.verifyEmail(token)
        .then(() => {
          setStatus('success');
          setMessage('Email verified successfully! You can close this page.');
        })
        .catch((err) => {
          setStatus('error');
          setMessage(err instanceof Error ? err.message : 'Verification failed.');
        });
    });
  }, [token]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '16px' }}>
      {status === 'loading' && <p>Verifying your email...</p>}
      {status === 'success' && <><p style={{ color: '#166534' }}>{message}</p><a href="/">Go to Dashboard</a></>}
      {status === 'error' && <><p style={{ color: '#dc2626' }}>{message}</p><a href="/">Go to Dashboard</a></>}
    </div>
  );
}
