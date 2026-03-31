import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, deleteOrganization, ORG_KINDS } from '../../lib/organizations';
import type { Organization } from '../../lib/organizations';
import { getMockSections, COVER_IMAGES } from '../../lib/mockOrgData';
import type { MockSection } from '../../lib/mockOrgData';
import { getMe } from '../../lib/auth';
import { createJoinRequest, getMyJoinRequests } from '../../lib/join-requests';
import { FieldError, FormError } from '../../components/FieldError';

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
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

function AdminMenu({
  orgSlug,
  onDelete,
  isDeleting,
}: {
  orgSlug: string;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
            <Link
              to="/$orgSlug/profile"
              params={{ orgSlug }}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Manage profile
            </Link>
            <button
              onClick={() => {
                if (confirm('Delete this organization?')) {
                  onDelete();
                }
                setOpen(false);
              }}
              disabled={isDeleting}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function JoinRequestButton({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');

  const myRequestsQuery = useQuery({
    queryKey: ['my', 'join-requests'],
    queryFn: getMyJoinRequests,
  });

  const mutation = useMutation({
    mutationFn: (msg: string) => createJoinRequest(orgId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my', 'join-requests'] });
      setShowForm(false);
      setMessage('');
    },
  });

  const pendingRequest = myRequestsQuery.data?.find(
    (r) => r.organization.id === orgId && r.status === 'pending',
  );

  if (pendingRequest) {
    return (
      <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
        Request pending
      </span>
    );
  }

  if (mutation.isSuccess) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Request sent! You will be notified once reviewed.
      </p>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Request to join
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-72">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Why do you want to join this organization? (min. 10 characters)"
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
      />
      <FieldError mutation={mutation} field="message" />
      <FormError mutation={mutation} />
      <div className="flex gap-2">
        <button
          onClick={() => mutation.mutate(message)}
          disabled={message.trim().length < 10 || mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Sending...' : 'Send request'}
        </button>
        <button
          onClick={() => { setShowForm(false); setMessage(''); }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function OrganizationShowPage() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });

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

  if (query.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">Organization not found</p>
        <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block">
          ← Back to list
        </Link>
      </div>
    );
  }

  const org = query.data!;
  const me = meQuery.data;
  const isMember = me?.organizations.some((o) => o.organization_id === org.id) ?? false;
  const isLoggedIn = !!me;
  const kindConfig = org.kind ? ORG_KINDS[org.kind] || ORG_KINDS.other : null;
  const coverUrl = org.cover_url || (org.kind && COVER_IMAGES[org.kind]) || COVER_IMAGES.default;
  const sections = getMockSections(org.kind);

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Back link */}
      <div className="px-6 py-4">
        <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to list
        </Link>
      </div>

      {/* Cover + Header */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-48 rounded-t-xl overflow-hidden relative">
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        {/* Profile header below cover */}
        <div className="relative px-6 -mt-10">
          {/* Avatar overlapping cover */}
          <OrgAvatar org={org} size="lg" />

          {/* Name + meta + actions row */}
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
                    · {org.number_of_workers} workers
                  </span>
                )}
                {!org.claimed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Unclaimed
                  </span>
                )}
              </div>
            </div>

            {/* Actions — vertically centered with the name */}
            <div className="flex items-center gap-2 shrink-0 mt-1">
              {!org.claimed && (
                <button className="bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-yellow-600 transition-colors">
                  Claim
                </button>
              )}
              {org.claimed && isLoggedIn && !isMember && (
                <JoinRequestButton orgId={org.id} />
              )}
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
              <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Message
              </button>
              <AdminMenu
                orgSlug={org.slug}
                onDelete={() => deleteMutation.mutate()}
                isDeleting={deleteMutation.isPending}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content sections */}
      <div className="px-6 mt-8 space-y-8">
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

        {/* Photos */}
        {org.organization_photos && org.organization_photos.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {org.organization_photos.map((photo) => (
                <div key={photo.id} className="rounded-lg overflow-hidden aspect-[4/3]">
                  <img
                    src={photo.url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mock sections (Products / Machines / Capacities / Looking for) */}
        {sections.map((section) => (
          <section key={section.title} className="bg-white border border-gray-200 rounded-lg p-6">
            <SectionCards section={section} />
          </section>
        ))}

        {/* Communities */}
        {org.communities && org.communities.length > 0 && (
          <section className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Communities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${relKind.color}`}>
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
    </div>
  );
}
