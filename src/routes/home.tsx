import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, type MeOrganization } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';

function OrgCard({ org }: { org: MeOrganization }) {
  const kind = org.organization_kind ? ORG_KINDS[org.organization_kind] : null;
  const initials = org.organization_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      to="/$orgSlug"
      params={{ orgSlug: org.organization_slug }}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {org.organization_image_url ? (
            <img
              src={org.organization_image_url}
              alt={org.organization_name}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-gray-900 truncate">
                {org.organization_name}
              </h3>
              <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            {kind && (
              <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full mt-1 ${kind.color}`}>
                {kind.label}
              </span>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              <span>{org.relations_count} relations</span>
              <span>{org.assessments_completed}/{org.assessments_total} assessments</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function HomePage() {
  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  if (me.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (me.error) {
    return <div className="p-6 text-red-600">Failed to load user</div>;
  }

  const user = me.data!;
  const orgs = user.organizations ?? [];

  return (
    <div className="max-w-3xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select an organization to view its dashboard.
        </p>
      </div>

      {orgs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {orgs.map((org) => (
            <OrgCard key={org.organization_id} org={org} />
          ))}
        </div>
      ) : (
        <p className="text-gray-500">You don&apos;t have any organizations yet.</p>
      )}
    </div>
  );
}
