import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, deleteOrganization } from '../../lib/organizations';

export function OrganizationShowPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['organizations', id],
    queryFn: () => getOrganization(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate({ to: '/organizations' });
    },
  });

  if (query.isLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (query.error) return <div className="p-6 text-red-600">Organization not found</div>;

  const org = query.data!;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Back */}
      <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to list
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
          <p className="text-gray-500 mt-1">
            {[org.kind, org.address, org.country_code].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/organizations/$id/edit"
            params={{ id }}
            className="border border-primary/30 rounded-lg px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5"
          >
            Edit
          </Link>
          <button
            onClick={() => {
              if (confirm('Delete this organization?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="border border-red-300 rounded-lg px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Details */}
      <dl className="grid grid-cols-2 gap-4 bg-white border border-gray-200 rounded-lg p-4">
        {[
          ['Name', org.name],
          ['Kind', org.kind],
          ['Address', org.address],
          ['Country', org.country_code],
          ['Description', org.description],
        ].map(([label, value]) => (
          <div key={label as string}>
            <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
            <dd className="text-sm text-gray-900 mt-0.5">{value || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
