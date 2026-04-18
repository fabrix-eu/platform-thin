import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, searchOrganizations, ORG_KINDS } from '../../lib/organizations';
import type { OrganizationBasic } from '../../lib/organizations';
import { createRelation, deleteRelation, RELATION_TYPES } from '../../lib/relations';
import type { Relation } from '../../lib/relations';
import { OrganizationsMap } from '../../components/OrganizationsMap';
import type { MapRelationLine } from '../../components/OrganizationsMap';
import { RelationLegend } from '../../components/RelationLegend';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';

const PER_PAGE = 12;

function OrgAvatar({ org }: { org: { name: string; image_url: string | null } }) {
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

function RelationTypeBadge({ type }: { type: string }) {
  const config = RELATION_TYPES[type];
  if (!config) return null;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
      {config.label}
    </span>
  );
}

// ── Add relation modal ──────────────────────────────────────────

function AddRelationModal({
  organizationId,
  orgSlug,
  onClose,
}: {
  organizationId: string;
  orgSlug: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrganizationBasic | null>(null);
  const [relationType, setRelationType] = useState('');
  const [description, setDescription] = useState('');

  const searchQuery = useQuery({
    queryKey: ['organizations', 'search-add-relation', search],
    queryFn: () => searchOrganizations(search),
    enabled: search.length >= 2,
  });

  // Filter out the current org from search results
  const results = searchQuery.data?.filter((o) => o.id !== organizationId) ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      createRelation({
        from_organization_id: organizationId,
        to_organization_id: selected!.id,
        relation_type: relationType,
        description: description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Add relation</h3>
        </div>

        <div className="p-4 space-y-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Organization</label>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Search organizations..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />
          </div>

          {/* Search results dropdown */}
          {search.length >= 2 && !selected && (
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {searchQuery.isLoading && (
                <p className="px-3 py-2 text-sm text-gray-400">Searching...</p>
              )}
              {results.map((org) => (
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
              {searchQuery.data && results.length === 0 && (
                <div className="px-3 py-2">
                  <p className="text-sm text-gray-400">No organizations found</p>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate({ to: '/organizations/new' });
                    }}
                    className="mt-1 text-sm text-primary hover:text-primary/80 font-medium"
                  >
                    + Create &ldquo;{search}&rdquo; as a new organization
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected org */}
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

          {/* Relation type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Relation type</label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {Object.entries(RELATION_TYPES).map(([key, { label, description: desc }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRelationType(key)}
                  className={`w-full text-left px-3 py-2 transition-colors ${relationType === key ? 'bg-primary/8' : 'hover:bg-gray-50'
                    }`}
                >
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe this relation..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Error */}
          {mutation.error && (
            <p className="text-sm text-red-600">
              {(mutation.error as Error).message || 'Failed to create relation'}
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
            onClick={() => mutation.mutate()}
            disabled={!selected || !relationType || mutation.isPending}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Adding...' : 'Add relation'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helper: find the Relation object for a related org ──────────

function findRelation(relations: Relation[], orgId: string, relatedOrgId: string): Relation | undefined {
  return relations.find(
    (r) =>
      (r.from_organization_id === orgId && r.to_organization_id === relatedOrgId) ||
      (r.to_organization_id === orgId && r.from_organization_id === relatedOrgId)
  );
}

// ── Main page ───────────────────────────────────────────────────

export function OrgRelationsPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'cards'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const relationsInfo = useFeatureInfo('relations');

  const org = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const organization = org.data;
  const relatedOrgs = organization?.related_organizations ?? [];
  const relations = (organization?.relations ?? []) as Relation[];

  const removeMutation = useMutation({
    mutationFn: (relationId: string) => deleteRelation(relationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
    },
  });

  const handleRemove = (relatedOrgId: string, relatedOrgName: string) => {
    if (!organization) return;
    const relation = findRelation(relations, organization.id, relatedOrgId);
    if (!relation) return;
    if (!window.confirm(`Remove relation with ${relatedOrgName}?`)) return;
    removeMutation.mutate(relation.id);
  };

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

  const mapRelationLines = useMemo((): MapRelationLine[] => {
    if (!organization || !organization.lon || !organization.lat) return [];
    return relations
      .map((rel) => {
        const otherId = rel.from_organization_id === organization.id ? rel.to_organization_id : rel.from_organization_id;
        const other = relatedOrgs.find((o) => o.id === otherId);
        if (!other?.lon || !other?.lat) return null;
        const color = RELATION_TYPES[rel.relation_type]?.hex ?? '#6B7280';
        return { from: [organization.lon!, organization.lat!] as [number, number], to: [other.lon, other.lat] as [number, number], color };
      })
      .filter((l): l is MapRelationLine => l !== null);
  }, [organization, relations, relatedOrgs]);

  if (org.isLoading) return <div className="p-6 text-gray-500">Loading...</div>;
  if (org.error || !organization) return <div className="p-6 text-red-600">Organization not found</div>;

  if (relatedOrgs.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-gray-900">Relations</h1>
            <FeatureInfoTrigger info={relationsInfo} />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add relation
          </button>
        </div>
        <FeatureIntro
          info={relationsInfo}
          title="Map your supply chain"
          description="Add your suppliers, customers, and partners to visualize your network. Public relations increase your visibility — visitors browsing a partner's profile will discover you too."
        />
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No relations yet. Add your first partner to get started.</p>
        </div>
        {showAddModal && (
          <AddRelationModal
            organizationId={organization.id}
            orgSlug={orgSlug}
            onClose={() => setShowAddModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-gray-900">Relations</h1>
            <FeatureInfoTrigger info={relationsInfo} />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {relatedOrgs.length} connected organization{relatedOrgs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add relation
        </button>
      </div>

      <FeatureIntro
        info={relationsInfo}
        title="Map your supply chain"
        description="Add your suppliers, customers, and partners to visualize your network. Public relations increase your visibility — visitors browsing a partner's profile will discover you too."
      />

      {/* Map */}
      <div className="rounded-lg overflow-hidden border border-border relative">
        <OrganizationsMap
          organizations={mapOrgs}
          height="400px"
          selectedKinds={[]}
          relations={mapRelationLines}
          highlightOrgId={organization.id}
        />
        <RelationLegend />
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
          {paginated.map((rel) => {
            const relation = findRelation(relations, organization.id, rel.id);
            return (
              <div key={rel.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors">
                <Link
                  to="/organizations/$id"
                  params={{ id: rel.slug || rel.id }}
                  className="flex items-center gap-4 flex-1 min-w-0"
                >
                  <OrgAvatar org={rel} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{rel.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <KindBadge kind={rel.kind} />
                      {relation && <RelationTypeBadge type={relation.relation_type} />}
                      {rel.address && (
                        <span className="text-xs text-muted-foreground truncate">
                          {[rel.address, rel.country_code].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(rel.id, rel.name)}
                  disabled={removeMutation.isPending}
                  className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
                  title="Remove relation"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
            );
          })}
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
            const relation = findRelation(relations, organization.id, rel.id);
            return (
              <div
                key={rel.id}
                className="bg-white rounded-lg border border-border hover:border-gray-300 hover:shadow-md transition-all group relative"
              >
                <Link
                  to="/organizations/$id"
                  params={{ id: rel.slug || rel.id }}
                  className="block p-4"
                >
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
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {kind && (
                          <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${kind.badgeColor}`}>
                            {kind.label}
                          </span>
                        )}
                        {relation && <RelationTypeBadge type={relation.relation_type} />}
                      </div>
                      {rel.address && (
                        <p className="text-xs text-muted-foreground mt-2 truncate">
                          {[rel.address, rel.country_code].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => handleRemove(rel.id, rel.name)}
                  disabled={removeMutation.isPending}
                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                  title="Remove relation"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </button>
              </div>
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
              &larr; Previous
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
              Next &rarr;
            </button>
          )}
        </div>
      )}

      {showAddModal && (
        <AddRelationModal
          organizationId={organization.id}
          orgSlug={orgSlug}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
