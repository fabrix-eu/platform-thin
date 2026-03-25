import { Link, Outlet, useParams, useMatch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';

interface TabItem {
  key: string;
  label: string;
  path: string;
}

export function CommunityLayout() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin
  ) ?? false;

  const basePath = `/${orgSlug}/communities/${communitySlug}`;

  const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', path: basePath },
    { key: 'members', label: 'Members', path: `${basePath}/members` },
    { key: 'events', label: 'Events', path: `${basePath}/events` },
    { key: 'challenges', label: 'Challenges', path: `${basePath}/challenges` },
    { key: 'matchmaking', label: 'Matchmaking', path: `${basePath}/matchmaking` },
    ...(isAdmin ? [{ key: 'join-requests', label: 'Join Requests', path: `${basePath}/join-requests` }] : []),
  ];

  // Detect active tab from URL
  const isIndex = useMatch({
    from: '/$orgSlug/communities/$communitySlug/',
    shouldThrow: false,
  });

  function isActive(tab: TabItem) {
    if (tab.key === 'overview') return !!isIndex;
    return location.pathname.startsWith(tab.path);
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-57px)]">
      {/* Community header with tabs */}
      <div className="border-b border-border bg-white">
        <div className="px-6 py-4">
          <h1 className="text-xl font-display font-bold text-gray-900">
            {meQuery.data?.accessible_communities?.find((c) => c.slug === communitySlug)?.name ?? communitySlug}
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              to={tab.path}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive(tab)
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50/50">
        <Outlet />
      </div>
    </div>
  );
}
