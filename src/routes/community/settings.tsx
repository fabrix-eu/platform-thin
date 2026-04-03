import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { getCommunity } from '../../lib/communities';
import {
  getCommunityAdmins,
  addCommunityAdmin,
  removeCommunityAdmin,
  getAdminInvitations,
  cancelAdminInvitation,
  resendAdminInvitation,
} from '../../lib/community-admins';
import type { CommunityAdmin, AdminInvitation } from '../../lib/community-admins';

function AdminAvatar({ admin }: { admin: CommunityAdmin }) {
  const user = admin.user;
  if (user.image_url) {
    return (
      <img
        src={user.image_url}
        alt={user.name}
        className="w-9 h-9 rounded-full object-cover"
      />
    );
  }
  const initials = (user.name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
      {initials}
    </div>
  );
}

function AddAdminModal({
  communitySlug,
  onClose,
  onAdded,
}: {
  communitySlug: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [email, setEmail] = useState('');

  const mutation = useMutation({
    mutationFn: () => addCommunityAdmin(communitySlug, email),
    onSuccess: () => {
      onAdded();
      onClose();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl border border-border w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-gray-900">Add community admin</h3>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-3">
            <p className="text-xs text-gray-500">
              If the user has an account, they'll be added immediately. Otherwise, an invitation email will be sent.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              autoFocus
            />

            {mutation.error && (
              <p className="text-sm text-red-600">
                {(mutation.error as Error).message || 'Failed to add admin'}
              </p>
            )}
          </div>

          <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!email || mutation.isPending}
              className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? 'Adding...' : 'Add admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CommunitySettingsPage() {
  const { communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const communityName = me.data?.accessible_communities?.find(
    (c) => c.slug === communitySlug,
  )?.name;

  const communityQuery = useQuery({
    queryKey: ['community', communitySlug],
    queryFn: () => getCommunity(communitySlug),
  });
  const creatorId = communityQuery.data?.created_by?.id;

  const adminsQuery = useQuery({
    queryKey: ['community_admins', communitySlug],
    queryFn: () => getCommunityAdmins(communitySlug),
  });

  const invitationsQuery = useQuery({
    queryKey: ['admin_invitations', communitySlug],
    queryFn: () => getAdminInvitations(communitySlug),
  });

  const removeMutation = useMutation({
    mutationFn: (adminId: string) => removeCommunityAdmin(communitySlug, adminId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_admins', communitySlug] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => cancelAdminInvitation(communitySlug, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_invitations', communitySlug] });
    },
  });

  const resendMutation = useMutation({
    mutationFn: (invitationId: string) => resendAdminInvitation(communitySlug, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_invitations', communitySlug] });
    },
  });

  const admins = adminsQuery.data ?? [];
  const invitations = invitationsQuery.data ?? [];

  function handleRemove(admin: CommunityAdmin) {
    if (window.confirm(`Remove ${admin.user.name} as admin?`)) {
      removeMutation.mutate(admin.id);
    }
  }

  function handleCancelInvitation(inv: AdminInvitation) {
    if (window.confirm(`Cancel invitation to ${inv.email}?`)) {
      cancelMutation.mutate(inv.id);
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <h2 className="text-lg font-display font-bold text-gray-900">Settings</h2>

      {/* Community info (read-only for now) */}
      <section className="bg-white border border-border rounded-lg p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Community info</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-20 shrink-0">Name</dt>
            <dd className="text-gray-900 font-medium">{communityName ?? communitySlug}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-gray-500 w-20 shrink-0">Slug</dt>
            <dd className="text-gray-500 font-mono text-xs">{communitySlug}</dd>
          </div>
        </dl>
      </section>

      {/* Community admins */}
      <section className="bg-white border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Admins</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Admins can manage members, events, challenges, and community settings.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Add admin
          </button>
        </div>

        {adminsQuery.isLoading && (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-200 rounded-full" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 bg-gray-200 rounded w-32" />
                  <div className="h-2.5 bg-gray-200 rounded w-48" />
                </div>
              </div>
            ))}
          </div>
        )}

        {adminsQuery.error && (
          <p className="text-sm text-red-600">Failed to load admins</p>
        )}

        {admins.length > 0 && (
          <div className="divide-y divide-border">
            {admins.map((admin) => {
              const isCreator = creatorId === admin.user.id;
              const isMe = admin.user.id === me.data?.id;
              return (
                <div key={admin.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <AdminAvatar admin={admin} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 truncate">{admin.user.name}</span>
                      {isCreator && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                          Creator
                        </span>
                      )}
                      {isMe && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{admin.user.email}</p>
                  </div>
                  {!isCreator && !isMe && (
                    <button
                      onClick={() => handleRemove(admin)}
                      disabled={removeMutation.isPending}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                      title="Remove admin"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {removeMutation.error && (
          <p className="text-sm text-red-600 mt-3">
            {(removeMutation.error as Error).message || 'Failed to remove admin'}
          </p>
        )}
      </section>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <section className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pending invitations</h3>
          <div className="divide-y divide-border">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-500">
                    Invited {new Date(inv.created_at).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => resendMutation.mutate(inv.id)}
                    disabled={resendMutation.isPending}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                    title="Resend invitation"
                  >
                    Resend
                  </button>
                  <button
                    onClick={() => handleCancelInvitation(inv)}
                    disabled={cancelMutation.isPending}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    title="Cancel invitation"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Add admin modal */}
      {showAddModal && (
        <AddAdminModal
          communitySlug={communitySlug}
          onClose={() => setShowAddModal(false)}
          onAdded={() => {
            queryClient.invalidateQueries({ queryKey: ['community_admins', communitySlug] });
            queryClient.invalidateQueries({ queryKey: ['admin_invitations', communitySlug] });
          }}
        />
      )}
    </div>
  );
}
