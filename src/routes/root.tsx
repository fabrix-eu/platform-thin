import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '../lib/auth';
import { OrgSwitcher } from '../components/OrgSwitcher';
import { UserMenu } from '../components/UserMenu';

export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
  });

  const authed = !!me.data;

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
        <div className="w-64 flex-shrink-0 px-4 border-r border-border h-full flex items-center">
          {authed && me.data && me.data.organizations.length > 0 ? (
            <OrgSwitcher />
          ) : (
            <Link to="/" className="text-lg font-display font-bold text-primary">
              Fabrix
            </Link>
          )}
        </div>

        {/* Right zone — nav + user menu */}
        <div className="flex-1 flex items-center justify-between px-6">
          {authed ? (
            <>
              <nav className="flex items-center gap-4">
                <Link
                  to="/"
                  activeOptions={{ exact: true }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                  activeProps={{ className: 'text-sm text-gray-900 font-semibold' }}
                >
                  Home
                </Link>
                <Link
                  to="/organizations"
                  className="text-sm text-gray-600 hover:text-gray-900"
                  activeProps={{ className: 'text-sm text-gray-900 font-semibold' }}
                >
                  Directory
                </Link>
                <Link
                  to="/map"
                  className="text-sm text-gray-600 hover:text-gray-900"
                  activeProps={{ className: 'text-sm text-gray-900 font-semibold' }}
                >
                  Map
                </Link>
                <Link
                  to="/communities"
                  className="text-sm text-gray-600 hover:text-gray-900"
                  activeProps={{ className: 'text-sm text-gray-900 font-semibold' }}
                >
                  Communities
                </Link>
              </nav>
              <UserMenu user={me.data} onLogout={handleLogout} />
            </>
          ) : (
            <div />
          )}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
