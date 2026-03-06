import { Link, Outlet, useParams, useMatch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization, ORG_KINDS } from '../../lib/organizations';

interface SidebarItem {
  label: string;
  href: string;
  disabled?: boolean;
}

function OrgAvatar({ name, imageUrl }: { name: string; imageUrl: string | null }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
      {initials}
    </div>
  );
}

export function OrgLayout() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const org = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  // Check if we're on the index route (exact match /$orgSlug)
  const isIndex = useMatch({ from: '/$orgSlug/', shouldThrow: false });

  const navItems: SidebarItem[] = [
    { label: 'Overview', href: `/${orgSlug}` },
    { label: 'Profile', href: `/${orgSlug}/profile`, disabled: true },
    { label: 'Relations', href: `/${orgSlug}/relations`, disabled: true },
    { label: 'Assessments', href: `/${orgSlug}/assessments`, disabled: true },
    { label: 'Settings', href: `/${orgSlug}/settings`, disabled: true },
  ];

  const kind = org.data?.kind ? ORG_KINDS[org.data.kind] : null;

  return (
    <div className="flex min-h-[calc(100vh-57px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex-shrink-0">
        {/* Org header */}
        <div className="p-4 border-b border-border">
          {org.isLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mt-1" />
              </div>
            </div>
          ) : org.data ? (
            <div className="flex items-center gap-3">
              <OrgAvatar name={org.data.name} imageUrl={org.data.image_url} />
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-semibold text-sm truncate">
                  {org.data.name}
                </h3>
                {kind && (
                  <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full mt-0.5 ${kind.color}`}>
                    {kind.label}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Nav */}
        <nav className="p-2">
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.label === 'Overview' ? !!isIndex : false;

              if (item.disabled) {
                return (
                  <li key={item.label}>
                    <span className="flex items-center justify-between px-3 py-2 text-sm text-gray-400 rounded-md cursor-not-allowed">
                      {item.label}
                      <span className="text-[10px] text-gray-300">Soon</span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
