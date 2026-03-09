import { Link, Outlet, useParams, useMatch } from '@tanstack/react-router';

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

  const basePath = `/${orgSlug}/communities/${communitySlug}`;

  const tabs: TabItem[] = [
    { key: 'overview', label: 'Overview', path: basePath },
    { key: 'members', label: 'Members', path: `${basePath}/members` },
    { key: 'events', label: 'Events', path: `${basePath}/events` },
    { key: 'challenges', label: 'Challenges', path: `${basePath}/challenges` },
    { key: 'matchmaking', label: 'Matchmaking', path: `${basePath}/matchmaking` },
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
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link
              to="/$orgSlug"
              params={{ orgSlug }}
              className="hover:text-gray-700"
            >
              {orgSlug}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{communitySlug}</span>
          </div>
          <h1 className="text-xl font-display font-bold text-gray-900">
            {communitySlug}
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
