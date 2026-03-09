import { useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization } from '../../lib/organizations';

export function OrgProfilePage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const org = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  if (org.isLoading) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  if (!org.data) {
    return <div className="p-6 text-red-600">Organization not found</div>;
  }

  const organization = org.data;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Edit your organization profile</p>
      </div>

      <div className="bg-white rounded-lg border border-border p-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Name</label>
          <p className="text-gray-900">{organization.name}</p>
        </div>
        {organization.description && (
          <div>
            <label className="text-sm font-medium text-gray-700">Description</label>
            <p className="text-gray-600 text-sm">{organization.description}</p>
          </div>
        )}
        {organization.address && (
          <div>
            <label className="text-sm font-medium text-gray-700">Address</label>
            <p className="text-gray-600 text-sm">{organization.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
