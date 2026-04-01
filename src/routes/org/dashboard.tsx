import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization, ORG_KINDS } from '../../lib/organizations';
import { getMe } from '../../lib/auth';

export function OrgDashboardPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const org = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug
  );

  if (org.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (org.error || !org.data) {
    return <div className="p-6 text-red-600">Organization not found</div>;
  }

  const organization = org.data;
  const kind = organization.kind ? ORG_KINDS[organization.kind] : null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-gray-900">
            {organization.name}
          </h1>
          {kind && (
            <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${kind.badgeColor}`}>
              {kind.label}
            </span>
          )}
        </div>
        {organization.description && (
          <p className="mt-2 text-gray-600 text-sm">{organization.description}</p>
        )}
        {organization.address && (
          <p className="mt-1 text-xs text-gray-400">{organization.address}</p>
        )}
      </div>

      {/* Stats */}
      {userOrg && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-sm text-gray-500 mb-1">Relations</div>
            <div className="text-2xl font-display font-bold">{userOrg.relations_count}</div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-sm text-gray-500 mb-1">Assessments</div>
            <div className="text-2xl font-display font-bold">
              {userOrg.assessments_completed}
              <span className="text-sm font-normal text-gray-400">
                /{userOrg.assessments_total}
              </span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-border p-4">
            <div className="text-sm text-gray-500 mb-1">Communities</div>
            <div className="text-2xl font-display font-bold">{userOrg.communities.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}
