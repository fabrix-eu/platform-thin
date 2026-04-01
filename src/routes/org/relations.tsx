import { useState, useMemo } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getOrganization, ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import { OrganizationsMap } from '../../components/OrganizationsMap';
import { FeatureIntro } from '../../components/FeatureIntro';

const PER_PAGE = 12;

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

export function OrgRelationsPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'cards'>('list');

  const org = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const organization = org.data;
  const relatedOrgs = organization?.related_organizations ?? [];

  const filtered = useMemo(() => {
    if (!search) return relatedOrgs;
    const q = search.toLowerCase();
    return relatedOrgs.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q) ||
        o.kind?.toLowerCase().includes(q)
    );
  }, [relatedOrgs, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const mapOrgs = useMemo(() => {
    if (!organization) return [];
    return [organization, ...relatedOrgs];
  }, [organization, relatedOrgs]);

  if (org.isLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (org.error || !organization) return <div className="p-6 text-red-600">Organization not found</div>;

  if (relatedOrgs.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Relations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your supply chain connections</p>
        </div>
        <FeatureIntro
          icon={
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          }
          title="Build your supply chain"
          description="Connect with partners, suppliers, and clients to build your circular textile supply chain."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Relations</h1>
        <p className="text-sm text-gray-500 mt-1">
          {relatedOrgs.length} connected organization{relatedOrgs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border">
        <OrganizationsMap organizations={mapOrgs} height="400px" selectedKinds={[]} />
      </div>

      {/* Search + View toggle */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search relations..."
          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
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
      </div>

      <p className="text-sm text-muted-foreground">{filtered.length} results</p>

      {/* List view */}
      {view === 'list' && (
        <div className="divide-y divide-border border border-border rounded-lg bg-card">
          {paginated.map((rel) => (
            <Link
              key={rel.id}
              to="/organizations/$id"
              params={{ id: rel.slug || rel.id }}
              className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <OrgAvatar org={rel} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{rel.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <KindBadge kind={rel.kind} />
                  {rel.address && (
                    <span className="text-xs text-muted-foreground truncate">
                      {[rel.address, rel.country_code].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-muted-foreground">→</span>
            </Link>
          ))}
          {paginated.length === 0 && (
            <p className="px-4 py-8 text-center text-muted-foreground">No relations found</p>
          )}
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paginated.map((rel) => {
            const kind = rel.kind ? ORG_KINDS[rel.kind] || ORG_KINDS.other : null;
            return (
              <Link
                key={rel.id}
                to="/organizations/$id"
                params={{ id: rel.slug || rel.id }}
                className="block bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group"
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <OrgAvatar org={rel} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-display font-semibold text-sm text-gray-900 truncate">
                          {rel.name}
                        </h3>
                        <svg className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                      {kind && (
                        <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full mt-1 ${kind.badgeColor}`}>
                          {kind.label}
                        </span>
                      )}
                      {rel.address && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {[rel.address, rel.country_code].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          {paginated.length === 0 && (
            <p className="text-center text-muted-foreground col-span-2">No relations found</p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          {page > 1 && (
            <button
              onClick={() => setPage(page - 1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Previous
            </button>
          )}
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <button
              onClick={() => setPage(page + 1)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Next →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
