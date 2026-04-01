import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganizations, ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';

function OrgAvatar({ org }: { org: Organization }) {
  if (org.image_url) {
    return (
      <img
        src={org.image_url}
        alt={org.name}
        className="w-10 h-10 rounded-full object-cover bg-gray-100"
      />
    );
  }

  const initials = org.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
      {initials}
    </div>
  );
}

function KindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;
  const config = ORG_KINDS[kind] || ORG_KINDS.other;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.badgeColor}`}>
      {config.label}
    </span>
  );
}

function OrgCard({ org }: { org: Organization }) {
  const kind = org.kind ? ORG_KINDS[org.kind] || ORG_KINDS.other : null;

  return (
    <Link
      to="/organizations/$id"
      params={{ id: org.slug || org.id }}
      className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <OrgAvatar org={org} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-sm text-gray-900 truncate">
                {org.name}
              </h3>
              <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mt-1">
              {kind && (
                <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${kind.badgeColor}`}>
                  {kind.label}
                </span>
              )}
              {!org.claimed && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 uppercase tracking-wide">
                  Unclaimed
                </span>
              )}
            </div>
            {org.address && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {[org.address, org.country_code].filter(Boolean).join(', ')}
              </p>
            )}
            {org.relations_count > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{org.relations_count} relations</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

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

  const [view, setView] = useState<'list' | 'cards'>('list');
  const meta = query.data?.meta;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">Directory</h1>

      {/* Search + View toggle + Add */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="search"
          defaultValue={search || ''}
          placeholder="Search organizations..."
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary/80"
        >
          Search
        </button>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="List view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView('cards')}
            className={`px-3 py-2 text-sm border-l border-border ${view === 'cards' ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50'}`}
            title="Cards view"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
          </button>
        </div>
        <Link
          to="/organizations/new"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
        >
          New Organization
        </Link>
      </form>

      {/* Content */}
      {query.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {query.error && <p className="text-destructive">Failed to load organizations</p>}

      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} results</p>

          {view === 'list' && (
            <div className="divide-y divide-border border border-border rounded-lg bg-card">
              {query.data.organizations.map((org) => (
                <Link
                  key={org.id}
                  to="/organizations/$id"
                  params={{ id: org.slug || org.id }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <OrgAvatar org={org} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{org.name}</p>
                      {!org.claimed && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-100 text-yellow-800 uppercase tracking-wide">
                          Unclaimed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <KindBadge kind={org.kind} />
                      {org.address && (
                        <span className="text-xs text-muted-foreground truncate">
                          {[org.address, org.country_code].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {org.relations_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {org.relations_count} rel.
                      </span>
                    )}
                    <span className="text-muted-foreground">→</span>
                  </div>
                </Link>
              ))}
              {query.data.organizations.length === 0 && (
                <p className="px-4 py-8 text-center text-muted-foreground">No organizations found</p>
              )}
            </div>
          )}

          {view === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {query.data.organizations.map((org) => (
                <OrgCard key={org.id} org={org} />
              ))}
              {query.data.organizations.length === 0 && (
                <p className="text-center text-muted-foreground col-span-2">No organizations found</p>
              )}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {meta.prev_page && (
                <Link
                  to="/organizations"
                  search={{ search, page: meta.prev_page }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.total_pages}
              </span>
              {meta.next_page && (
                <Link
                  to="/organizations"
                  search={{ search, page: meta.next_page }}
                  className="text-sm text-muted-foreground hover:text-foreground"
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
