import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getCommunities } from '../lib/communities';
import { getMe } from '../lib/auth';

export function CommunitiesPage() {
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['communities', { search }],
    queryFn: () => getCommunities({ search: search || undefined }),
  });

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const communities = query.data?.data ?? [];
  const canCreate = meQuery.data?.role === 'facilitator' || meQuery.data?.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Communities</h1>
          <p className="text-sm text-gray-500 mt-1">
            Discover communities and request to join with your organization.
          </p>
        </div>
        {canCreate && (
          <Link
            to="/communities/new"
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
          >
            Create community
          </Link>
        )}
      </div>

      <input
        type="text"
        placeholder="Search communities..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
      />

      {query.isLoading && (
        <div className="text-gray-500 text-sm">Loading...</div>
      )}

      {communities.length === 0 && !query.isLoading && (
        <p className="text-sm text-gray-500">No communities found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {communities.map((c) => {
          const initials = c.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <Link
              key={c.id}
              to="/communities/$id"
              params={{ id: c.slug || c.id }}
              className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.organizations_count} {c.organizations_count === 1 ? 'organization' : 'organizations'}
                    </p>
                  </div>
                  {c.is_member && (
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      Member
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{c.description}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
