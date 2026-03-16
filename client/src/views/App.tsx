import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { useAuth } from '../viewmodels/useAuth';
import { Layout } from '../components/Layout';
import { Login } from './Login';
import { Dashboard } from './Dashboard';
import { StudySession } from './StudySession';
import { CardEditor } from './CardEditor';
import { SourceManager } from './SourceManager';
import type { Workspace } from 'smarted-shared';

export function App() {
  const { user, loading, login, register, logout } = useAuth();
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

  if (!user) {
    return <Login onLogin={login} onRegister={register} />;
  }

  if (!workspace) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading workspace...</div>;
  }

  return (
    <BrowserRouter>
      <Layout onLogout={logout}>
        <Routes>
          <Route path="/" element={<Dashboard workspaceId={workspace.id} />} />
          <Route path="/study" element={<StudySession workspaceId={workspace.id} />} />
          <Route path="/cards" element={<CardEditor workspaceId={workspace.id} />} />
          <Route path="/sources" element={<SourceManager workspaceId={workspace.id} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
