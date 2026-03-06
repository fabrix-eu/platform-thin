import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '../../lib/organizations';

export function OrganizationsListPage() {
  const navigate = useNavigate();
  const { search, page } = useSearch({ strict: false }) as { search?: string; page?: number };

  const query = useQuery({
    queryKey: ['organizations', { page, search }],
    queryFn: () => getOrganizations({ page: page || 1, per_page: 20, search }),
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
    navigate({
      to: '/organizations',
      search: { search: q || undefined, page: 1 },
    });
  };

  const meta = query.data?.meta;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <Link
          to="/organizations/new"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          New Organization
        </Link>
      </div>

      {/* Search — URL state */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="search"
          defaultValue={search || ''}
          placeholder="Search organizations..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-200"
        >
          Search
        </button>
      </form>

      {/* List */}
      {query.isLoading && <p className="text-gray-500">Loading...</p>}
      {query.error && <p className="text-red-600">Failed to load organizations</p>}

      {query.data && (
        <>
          <p className="text-sm text-gray-500">{meta?.total_count ?? 0} results</p>

          <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
            {query.data.organizations.map((org) => (
              <Link
                key={org.id}
                to="/organizations/$id"
                params={{ id: org.slug || org.id }}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{org.name}</p>
                  <p className="text-sm text-gray-500">
                    {[org.kind, org.address, org.country_code].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
            {query.data.organizations.length === 0 && (
              <p className="px-4 py-8 text-center text-gray-500">No organizations found</p>
            )}
          </div>

          {/* Pagination — URL state */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {meta.prev_page && (
                <Link
                  to="/organizations"
                  search={{ search, page: meta.prev_page }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-gray-500">
                Page {meta.current_page} of {meta.total_pages}
              </span>
              {meta.next_page && (
                <Link
                  to="/organizations"
                  search={{ search, page: meta.next_page }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Next →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
