import { Link, Outlet, useParams, useMatch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';

interface SidebarItem {
  key: string;
  label: string;
  href: string;
}

export function OrgLayout() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug
  );
  const communities = userOrg?.communities ?? [];

  // Active route detection
  const isDashboard = useMatch({ from: '/$orgSlug/dashboard', shouldThrow: false });
  const isProfile = useMatch({ from: '/$orgSlug/profile', shouldThrow: false });
  const isRelations = useMatch({ from: '/$orgSlug/relations', shouldThrow: false });
  const isAssessments = useMatch({ from: '/$orgSlug/assessments', shouldThrow: false });
  const isCommunities = useMatch({ from: '/$orgSlug/communities', shouldThrow: false });
  const isMessages = useMatch({ from: '/$orgSlug/messages', shouldThrow: false });
  const isSettingsMembers = useMatch({ from: '/$orgSlug/settings/members', shouldThrow: false });
  const isSettings = !!isSettingsMembers;

  const navItems: SidebarItem[] = [
    { key: 'dashboard', label: 'Dashboard', href: `/${orgSlug}/dashboard` },
    { key: 'profile', label: 'Profile', href: `/${orgSlug}/profile` },
    { key: 'relations', label: 'Relations', href: `/${orgSlug}/relations` },
    { key: 'assessments', label: 'Assessments', href: `/${orgSlug}/assessments` },
    { key: 'communities', label: 'Communities', href: `/${orgSlug}/communities` },
    { key: 'messages', label: 'Messages', href: `/${orgSlug}/messages` },
  ];

  const activeMap: Record<string, boolean> = {
    dashboard: !!isDashboard,
    profile: !!isProfile,
    relations: !!isRelations,
    assessments: !!isAssessments,
    communities: !!isCommunities,
    messages: !!isMessages,
  };

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-white flex-shrink-0 flex flex-col">
        {/* Main Nav */}
        <nav className="p-2 flex-1">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.key}>
                <Link
                  to={item.href}
                  className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                    activeMap[item.key]
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/$orgSlug/settings/members"
                params={{ orgSlug }}
                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                  isSettings
                    ? 'bg-gray-100 text-gray-900 font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Members
              </Link>
            </li>
          </ul>

          {/* Communities section */}
          {communities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="px-3 mb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Communities
              </div>
              <ul className="space-y-0.5">
                {communities.map((c) => {
                  const initials = c.community_name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <li key={c.community_id}>
                      <Link
                        to="/$orgSlug/communities/$communitySlug"
                        params={{ orgSlug, communitySlug: c.community_slug }}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        activeProps={{ className: 'flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-blue-50 text-blue-700 font-medium' }}
                      >
                        {c.community_image_url ? (
                          <img
                            src={c.community_image_url}
                            alt={c.community_name}
                            className="h-5 w-5 rounded object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[8px] font-semibold flex-shrink-0">
                            {initials}
                          </div>
                        )}
                        <span className="truncate">{c.community_name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </nav>

      </aside>

      {/* Content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
}
