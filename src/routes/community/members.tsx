import { useState } from 'react';
import { Link, useParams, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import {
  getCommunityOrganizations,
  addCommunityOrganization,
} from '../../lib/community-organizations';
import { getOrganizations } from '../../lib/organizations';

// ── Shared components (same as directory) ────────────────────

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

function OrgCard({ org, linkTo }: { org: Organization; linkTo: string }) {
  const kind = org.kind ? ORG_KINDS[org.kind] || ORG_KINDS.other : null;
  return (
    <Link
      to={linkTo}
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
            </div>
            {org.address && (
              <p className="text-xs text-muted-foreground mt-2 truncate">
                {[org.address, org.country_code].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Add member modal ─────────────────────────────────────────

function AddMemberModal({
  communitySlug,
  onClose,
  onAdded,
}: {
  communitySlug: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Organization | null>(null);

  const searchQuery = useQuery({
    queryKey: ['organizations', 'search-add-member', search],
    queryFn: () => getOrganizations({ page: 1, per_page: 10, search }),
    enabled: search.length >= 2,
  });

  const addMutation = useMutation({
    mutationFn: (orgId: string) => addCommunityOrganization(communitySlug, orgId),
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Add organization to community</h3>
        </div>

        <div className="p-4 space-y-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Search organizations..."
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoFocus
          />

          {search.length >= 2 && !selected && (
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {searchQuery.isLoading && (
                <p className="px-3 py-2 text-sm text-gray-400">Searching...</p>
              )}
              {searchQuery.data?.organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelected(org)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                >
                  <OrgAvatar org={org} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                    <KindBadge kind={org.kind} />
                  </div>
                </button>
              ))}
              {searchQuery.data && searchQuery.data.organizations.length === 0 && (
                <p className="px-3 py-2 text-sm text-gray-400">No organizations found</p>
              )}
            </div>
          )}

          {selected && (
            <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <OrgAvatar org={selected} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{selected.name}</p>
                <KindBadge kind={selected.kind} />
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {addMutation.error && (
            <p className="text-sm text-red-600">
              {(addMutation.error as Error).message || 'Failed to add organization'}
            </p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => selected && addMutation.mutate(selected.id)}
            disabled={!selected || addMutation.isPending}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {addMutation.isPending ? 'Adding...' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function CommunityMembersPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as { orgSlug: string; communitySlug: string };
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { search, page } = useSearch({ strict: false }) as { search?: string; page?: number };

  const [view, setView] = useState<'list' | 'cards'>('list');
  const [showAddModal, setShowAddModal] = useState(false);

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = me.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const query = useQuery({
    queryKey: ['community_organizations', communitySlug, { page, search }],
    queryFn: () => getCommunityOrganizations(communitySlug, { page: page || 1, per_page: 20, search }),
  });

  const meta = query.data?.meta;
  const members = query.data?.data ?? [];

  const goToPage = (params: { search?: string; page?: number }) => {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.page && params.page > 1) sp.set('page', String(params.page));
    const qs = sp.toString();
    navigate({ to: location.pathname + (qs ? `?${qs}` : '') });
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('search') as string) || '';
    goToPage({ search: q || undefined, page: 1 });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <h2 className="text-lg font-display font-bold text-gray-900">Members</h2>

      {/* Search + View toggle + Add */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          name="search"
          defaultValue={search || ''}
          placeholder="Search members..."
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
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
          >
            Add member
          </button>
        )}
      </form>

      {/* Content */}
      {query.isLoading && <p className="text-muted-foreground">Loading...</p>}
      {query.error && <p className="text-destructive">Failed to load members</p>}

      {query.data && (
        <>
          <p className="text-sm text-muted-foreground">{meta?.total_count ?? 0} members</p>

          {view === 'list' && (
            <div className="divide-y divide-border border border-border rounded-lg bg-card">
              {members.map((m) => (
                <Link
                  key={m.id}
                  to="/$orgSlug/communities/$communitySlug/members/$memberId"
                  params={{ orgSlug, communitySlug, memberId: m.id }}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <OrgAvatar org={m.organization} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{m.organization.name}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <KindBadge kind={m.organization.kind} />
                      {m.organization.address && (
                        <span className="text-xs text-muted-foreground truncate">
                          {[m.organization.address, m.organization.country_code].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {m.organization.relations_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {m.organization.relations_count} rel.
                      </span>
                    )}
                    <span className="text-muted-foreground">&rarr;</span>
                  </div>
                </Link>
              ))}
              {members.length === 0 && (
                <p className="px-4 py-8 text-center text-muted-foreground">No members found</p>
              )}
            </div>
          )}

          {view === 'cards' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.map((m) => (
                <OrgCard
                  key={m.id}
                  org={m.organization}
                  linkTo={`/${orgSlug}/communities/${communitySlug}/members/${m.id}`}
                />
              ))}
              {members.length === 0 && (
                <p className="text-center text-muted-foreground col-span-2">No members found</p>
              )}
            </div>
          )}

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {meta.prev_page && (
                <button
                  onClick={() => goToPage({ search, page: meta.prev_page ?? undefined })}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Previous
                </button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {meta.current_page} of {meta.total_pages}
              </span>
              {meta.next_page && (
                <button
                  onClick={() => goToPage({ search, page: meta.next_page ?? undefined })}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Next →
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Add member modal */}
      {showAddModal && (
        <AddMemberModal
          communitySlug={communitySlug}
          onClose={() => setShowAddModal(false)}
          onAdded={() => qc.invalidateQueries({ queryKey: ['community_organizations', communitySlug] })}
        />
      )}
    </div>
  );
}
