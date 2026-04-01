import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import {
  getCommunityOrganization,
  updateCommunityOrganization,
  removeCommunityOrganization,
} from '../../lib/community-organizations';
import type { CommunityOrganization } from '../../lib/community-organizations';
import { getMockSections, COVER_IMAGES } from '../../lib/mockOrgData';
import type { MockSection } from '../../lib/mockOrgData';

// ── Reused components from org profile ───────────────────────

function OrgAvatar({ org, size = 'lg' }: { org: Organization; size?: 'sm' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-10 h-10 text-sm';

  if (org.image_url) {
    return (
      <img
        src={org.image_url}
        alt={org.name}
        className={`${sizeClass} rounded-full object-cover bg-white shadow-lg border-4 border-white`}
      />
    );
  }

  const initials = (org.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className={`${sizeClass} rounded-full bg-white text-primary flex items-center justify-center font-bold shadow-lg border-4 border-white`}>
      {initials}
    </div>
  );
}

function KindBadge({ kind }: { kind: string | null }) {
  if (!kind) return null;
  const config = ORG_KINDS[kind] || ORG_KINDS.other;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.badgeColor}`}>
      {config.label}
    </span>
  );
}

function SectionCards({ section }: { section: MockSection }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <span>{section.icon}</span>
        {section.title}
      </h3>
      {section.title === 'Looking for' ? (
        <div className="flex flex-wrap gap-2">
          {section.items.map((item) => (
            <div
              key={item.title}
              className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-3 flex-1 min-w-[200px]"
            >
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {section.items.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {item.image && (
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900">{item.title}</p>
                <p className="text-xs text-gray-500 mt-1">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Facilitator sidebar ──────────────────────────────────────

function FacilitatorSidebar({
  membership,
  communitySlug,
}: {
  membership: CommunityOrganization;
  communitySlug: string;
}) {
  const qc = useQueryClient();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(membership.notes || '');
  const [confirmRemove, setConfirmRemove] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateCommunityOrganization>[2]) =>
      updateCommunityOrganization(communitySlug, membership.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community_organization', communitySlug, membership.id] });
      setEditingNotes(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => removeCommunityOrganization(communitySlug, membership.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community_organizations', communitySlug] });
      window.history.back();
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          Facilitator panel
        </h3>

        {/* Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Notes</label>
            {!editingNotes && (
              <button
                onClick={() => { setNotes(membership.notes || ''); setEditingNotes(true); }}
                className="text-xs text-primary hover:text-primary/80"
              >
                Edit
              </button>
            )}
          </div>
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Private notes about this member..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateMutation.mutate({ notes: notes || null })}
                  disabled={updateMutation.isPending}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingNotes(false)}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {membership.notes || <span className="text-gray-400 italic">No notes yet</span>}
            </p>
          )}
        </div>
      </div>

      {/* Member info card */}
      <div className="bg-white border border-border rounded-lg p-4 space-y-3">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member info</h4>

        {membership.added_by && (
          <div>
            <p className="text-xs text-gray-400">Added by</p>
            <p className="text-sm text-gray-700">{membership.added_by.name}</p>
          </div>
        )}

        {membership.added_at && (
          <div>
            <p className="text-xs text-gray-400">Member since</p>
            <p className="text-sm text-gray-700">
              {new Date(membership.added_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        )}

        {membership.specialization && (
          <div>
            <p className="text-xs text-gray-400">Specialization</p>
            <p className="text-sm text-gray-700">{membership.specialization}</p>
          </div>
        )}

        {membership.number_of_employees != null && (
          <div>
            <p className="text-xs text-gray-400">Employees</p>
            <p className="text-sm text-gray-700">{membership.number_of_employees}</p>
          </div>
        )}

        {membership.economic_health && (
          <div>
            <p className="text-xs text-gray-400">Economic health</p>
            <p className="text-sm text-gray-700">{membership.economic_health}</p>
          </div>
        )}

        {membership.environmental_score && (
          <div>
            <p className="text-xs text-gray-400">Environmental score</p>
            <p className="text-sm text-gray-700">{membership.environmental_score}</p>
          </div>
        )}

        {membership.annual_turnover && (
          <div>
            <p className="text-xs text-gray-400">Annual turnover</p>
            <p className="text-sm text-gray-700">{membership.annual_turnover}</p>
          </div>
        )}

        {membership.growth_rate && (
          <div>
            <p className="text-xs text-gray-400">Growth rate</p>
            <p className="text-sm text-gray-700">{membership.growth_rate}</p>
          </div>
        )}
      </div>

      {/* Remove member */}
      <div className="bg-white border border-red-200 rounded-lg p-4">
        {!confirmRemove ? (
          <button
            onClick={() => setConfirmRemove(true)}
            className="w-full text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Remove from community
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-red-600">
              Remove <strong>{membership.organization.name}</strong> from this community?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {removeMutation.isPending ? 'Removing...' : 'Confirm remove'}
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────

export function CommunityMemberDetailPage() {
  const { orgSlug, communitySlug, memberId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    memberId: string;
  };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = meQuery.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const query = useQuery({
    queryKey: ['community_organization', communitySlug, memberId],
    queryFn: () => getCommunityOrganization(communitySlug, memberId),
  });

  if (query.isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <p className="text-red-600">Member not found</p>
        <Link
          to="/$orgSlug/communities/$communitySlug/members"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to members
        </Link>
      </div>
    );
  }

  const membership = query.data!;
  const org = membership.organization;
  const kindConfig = org.kind ? ORG_KINDS[org.kind] || ORG_KINDS.other : null;
  const coverUrl = org.cover_url || (org.kind && COVER_IMAGES[org.kind]) || COVER_IMAGES.default;
  const sections = getMockSections(org.kind);

  return (
    <div className="max-w-5xl mx-auto pb-12">
      {/* Back link */}
      <div className="px-6 py-4">
        <Link
          to="/$orgSlug/communities/$communitySlug/members"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to members
        </Link>
      </div>

      {/* Cover + Header */}
      <div className="relative">
        <div className="h-48 rounded-t-xl overflow-hidden relative">
          <img src={coverUrl} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="relative px-6 -mt-10">
          <OrgAvatar org={org} size="lg" />

          <div className="flex items-start justify-between mt-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{org.name}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {kindConfig && <KindBadge kind={org.kind} />}
                {org.address && (
                  <span className="text-sm text-gray-500">
                    {[org.address, org.country_code].filter(Boolean).join(', ')}
                  </span>
                )}
                {org.number_of_workers && (
                  <span className="text-sm text-gray-500">
                    &middot; {org.number_of_workers} workers
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 mt-1">
              {org.email ? (
                <a
                  href={`mailto:${org.email}`}
                  className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Contact
                </a>
              ) : (
                <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors">
                  Contact
                </button>
              )}
              <Link
                to="/organizations/$id"
                params={{ id: org.slug || org.id }}
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                View full profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content: profile + sidebar */}
      <div className="px-6 mt-8 flex gap-6">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* About */}
          {org.description && (
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{org.description}</p>
              <div className="flex flex-wrap gap-4 mt-4">
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                    </svg>
                    Website
                  </a>
                )}
                {org.email && (
                  <a
                    href={`mailto:${org.email}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                    {org.email}
                  </a>
                )}
                {org.phone && (
                  <a
                    href={`tel:${org.phone}`}
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                    {org.phone}
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Mock sections */}
          {sections.map((section) => (
            <section key={section.title} className="bg-white border border-gray-200 rounded-lg p-6">
              <SectionCards section={section} />
            </section>
          ))}

          {/* Communities */}
          {org.communities && org.communities.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Communities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {org.communities.map((community) => (
                  <div
                    key={community.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200"
                  >
                    {community.image_url ? (
                      <img
                        src={community.image_url}
                        alt={community.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {community.name[0]}
                      </div>
                    )}
                    <span className="text-sm font-medium text-gray-900 truncate">{community.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Organizations */}
          {org.related_organizations && org.related_organizations.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Organizations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {org.related_organizations.map((rel) => {
                  const relKind = rel.kind ? ORG_KINDS[rel.kind] || ORG_KINDS.other : null;
                  return (
                    <Link
                      key={rel.id}
                      to="/organizations/$id"
                      params={{ id: rel.slug || rel.id }}
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      {rel.image_url ? (
                        <img
                          src={rel.image_url}
                          alt={rel.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                          {(rel.name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{rel.name}</p>
                        {relKind && (
                          <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${relKind.badgeColor}`}>
                            {relKind.label}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Facilitator sidebar — only for community admins */}
        {isAdmin && (
          <div className="w-72 shrink-0">
            <div className="sticky top-6">
              <FacilitatorSidebar
                membership={membership}
                communitySlug={communitySlug}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
