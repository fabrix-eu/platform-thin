import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '../lib/auth';
import { OrgSwitcher } from '../components/OrgSwitcher';
import { UserMenu } from '../components/UserMenu';
import { NotificationBell } from '../components/NotificationBell';
import { MessageBell } from '../components/MessageBell';
import { useRefreshOnNavigate } from '../lib/notifications';

export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });

  const authed = !!me.data;

  useRefreshOnNavigate();

  const handleLogout = async () => {
    await logout();
    queryClient.setQueryData(['me'], null);
    queryClient.clear();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-white border-b border-border h-14 flex items-center">
        {/* Left zone — aligned with sidebar width */}
        <div className="w-64 flex-shrink-0 px-4 h-full flex items-center">
          {authed && me.data && me.data.organizations.length > 0 ? (
            <OrgSwitcher />
          ) : (
            <Link to="/" className="text-lg font-display font-bold text-primary">
              Fabrix
            </Link>
          )}
        </div>

        {/* Right zone — links + user menu */}
        <div className="flex-1 flex items-center justify-end gap-4 px-6">
          <Link to="/docs" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Docs
          </Link>
          <Link to="/changelog" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Changelog
          </Link>
          {authed && (
            <Link to="/feedback" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Feedback
            </Link>
          )}
          {authed && <MessageBell />}
          {authed && <NotificationBell />}
          {authed && <UserMenu user={me.data} onLogout={handleLogout} />}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
