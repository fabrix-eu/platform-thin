import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';

export function OrgCommunitiesListPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug
  );

  const communities = userOrg?.communities ?? [];

  if (me.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Communities</h1>
        <p className="text-sm text-gray-500 mt-1">
          {communities.length} {communities.length === 1 ? 'community' : 'communities'} joined
        </p>
      </div>

      {communities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {communities.map((c) => {
            const initials = c.community_name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={c.community_id}
                to="/$orgSlug/communities/$communitySlug"
                params={{ orgSlug, communitySlug: c.community_slug }}
                className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className="p-4 flex items-center gap-3">
                  {c.community_image_url ? (
                    <img
                      src={c.community_image_url}
                      alt={c.community_name}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
                      {c.community_name}
                    </h3>
                  </div>
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <p className="text-gray-500 mb-4">You haven't joined any communities yet.</p>
          <Link
            to="/communities"
            className="text-sm text-primary hover:underline"
          >
            Discover communities
          </Link>
        </div>
      )}
    </div>
  );
}
