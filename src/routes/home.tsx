import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, isAuthenticated, type MeOrganization, type AccessibleCommunity } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';
import { PendingActions } from '../components/PendingActions';

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
      to="/$orgSlug/dashboard"
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
              <span>{org.communities.length} communities</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function CommunityCard({ community, orgSlug }: { community: AccessibleCommunity; orgSlug?: string }) {
  const initials = community.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const linkProps = orgSlug
    ? { to: '/$orgSlug/communities/$communitySlug' as const, params: { orgSlug, communitySlug: community.slug } }
    : { to: '/communities' as const, params: {} };

  return (
    <Link
      {...linkProps}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="p-4 flex items-center gap-3">
        {community.image_url ? (
          <img
            src={community.image_url}
            alt={community.name}
            className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-semibold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">
            {community.name}
          </h3>
        </div>
        <span className="text-xs font-medium bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full flex-shrink-0">
          Admin
        </span>
        <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
    </Link>
  );
}

function LandingPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 mt-24 text-center">
      <h1 className="text-4xl font-display font-bold text-gray-900 mb-4">
        Circular textile starts here
      </h1>
      <p className="text-lg text-gray-500 mb-8">
        Fabrix connects organizations, facilitators and researchers building a sustainable textile ecosystem in Europe.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link
          to="/register"
          className="inline-flex items-center px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Create an account
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export function HomePage() {
  const authed = isAuthenticated();
  const me = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: authed,
  });

  if (!authed) {
    return <LandingPage />;
  }

  if (me.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (me.error) {
    return <div className="p-6 text-red-600">Failed to load user</div>;
  }

  const user = me.data!;
  const orgs = user.organizations ?? [];
  const adminCommunities = (user.accessible_communities ?? []).filter((c) => c.is_admin);
  const firstOrgSlug = orgs[0]?.organization_slug;
  const isViewer = orgs.length === 0 && adminCommunities.length === 0;

  return (
    <div className="max-w-3xl mx-auto p-6 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">
          Welcome, {user.name}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isViewer
            ? 'Explore the directory and map to discover organizations.'
            : 'Select an organization to view its dashboard.'}
        </p>
      </div>

      <PendingActions />

      {adminCommunities.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-display font-semibold text-gray-900">Your communities</h2>
          <p className="text-sm text-gray-500 mt-1 mb-3">Communities you manage as a facilitator</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {adminCommunities.map((c) => (
              <CommunityCard key={c.id} community={c} orgSlug={firstOrgSlug} />
            ))}
          </div>
        </div>
      )}

      {orgs.length > 0 ? (
        <div>
          {adminCommunities.length > 0 && (
            <>
              <h2 className="text-lg font-display font-semibold text-gray-900">Your organizations</h2>
              <p className="text-sm text-gray-500 mt-1 mb-3">Organizations you are a member of</p>
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgs.map((org) => (
              <OrgCard key={org.organization_id} org={org} />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border p-8 text-center">
          <div className="max-w-sm mx-auto">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <h3 className="font-display font-semibold text-gray-900 mb-2">
              Add your organization
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Search for your organization in our directory or create a new one to get started.
            </p>
            <Link
              to="/organizations/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Organization
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
