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
        <div className="w-64 flex-shrink-0 px-4 h-full flex items-center">
          {authed && me.data && me.data.organizations.length > 0 ? (
            <OrgSwitcher />
          ) : (
            <Link to="/" className="text-lg font-display font-bold text-primary">
              Fabrix
            </Link>
          )}
        </div>

        {/* Right zone — user menu */}
        <div className="flex-1 flex items-center justify-end px-6">
          {authed && <UserMenu user={me.data} onLogout={handleLogout} />}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
