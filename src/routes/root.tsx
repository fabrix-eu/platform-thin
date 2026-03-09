import { Link, Outlet, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe, logout } from '../lib/auth';
import { OrgSwitcher } from '../components/OrgSwitcher';

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
      <header className="bg-white border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-lg font-display font-bold text-primary">
            Fabrix Platform
          </Link>
          {authed && (
            <>
              <div className="h-5 w-px bg-border" />
              <OrgSwitcher />
            </>
          )}
        </div>
        {authed && (
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
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Logout
            </button>
          </nav>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
