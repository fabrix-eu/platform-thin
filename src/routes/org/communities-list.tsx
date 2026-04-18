import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';

export function OrgCommunitiesListPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug
  );

  const communities = (userOrg?.communities ?? []).map((c) => ({
    id: c.community_id,
    name: c.community_name,
    slug: c.community_slug,
    image_url: c.community_image_url,
    is_admin: me.data?.accessible_communities?.some(
      (ac) => ac.slug === c.community_slug && ac.is_admin
    ) ?? false,
  }));

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
            const initials = c.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <Link
                key={c.id}
                to="/$orgSlug/communities/$communitySlug"
                params={{ orgSlug, communitySlug: c.slug }}
                className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className="p-4 flex items-center gap-3">
                  {c.image_url ? (
                    <img
                      src={c.image_url}
                      alt={c.name}
                      className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
                      {c.name}
                    </h3>
                  </div>
                  {c.is_admin && (
                    <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex-shrink-0">
                      Admin
                    </span>
                  )}
                  <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No communities yet.</p>
          <Link to="/communities" className="text-sm text-primary hover:underline mt-1 inline-block">
            Browse communities
          </Link>
        </div>
      )}
    </div>
  );
}
