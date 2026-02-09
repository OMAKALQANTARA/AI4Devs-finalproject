import type { ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { AppLayout } from './components/AppLayout';
import { AuthPage } from './pages/AuthPage';
import { ChatsPage } from './pages/ChatsPage';
import { ContactsPage } from './pages/ContactsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { ProfilePage } from './pages/ProfilePage';
import { ChatPage } from './pages/ChatPage';
import { getValidAuthToken } from './utils/auth';

function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation();
  const hasAuthToken = Boolean(getValidAuthToken());

  if (!hasAuthToken) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default function App() {
  const hasAuthToken = Boolean(getValidAuthToken());

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route
          index
          element={<Navigate to={hasAuthToken ? '/chats' : '/auth'} replace />}
        />
        <Route
          path="/auth"
          element={hasAuthToken ? <Navigate to="/chats" replace /> : <AuthPage />}
        />
        <Route
          path="/chats"
          element={
            <RequireAuth>
              <ChatsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/contacts"
          element={
            <RequireAuth>
              <ContactsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/discover"
          element={
            <RequireAuth>
              <DiscoverPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:chatId?"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
      </Route>
    </Routes>
  );
}
