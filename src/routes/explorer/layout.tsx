import { Link, Outlet } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';

const navItems = [
  { label: 'Home', to: '/' as const, exact: true },
  { label: 'Directory', to: '/organizations' as const, exact: false },
  { label: 'Map', to: '/map' as const, exact: false },
  { label: 'Communities', to: '/communities' as const, exact: false },
  { label: 'Messages', to: '/messages' as const, exact: false },
  { label: 'Data', to: '/data' as const, exact: false },
];

export function ExplorerLayout() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe, retry: false });

  if (!me.data) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      <aside className="w-64 border-r border-border bg-white flex-shrink-0">
        <nav className="p-2">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="block px-3 py-2 text-sm rounded-md transition-colors text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  activeProps={{
                    className:
                      'block px-3 py-2 text-sm rounded-md transition-colors bg-gray-100 text-gray-900 font-medium',
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
