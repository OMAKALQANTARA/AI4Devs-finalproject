import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { getValidAuthToken } from '../utils/auth';

export function AppLayout() {
  const location = useLocation();
  const hasAuthToken = Boolean(getValidAuthToken());
  const isAuthRoute = location.pathname.startsWith('/auth');
  const showBottomNav = hasAuthToken && !isAuthRoute;

  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
