import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getOrgMembers,
  getOrgInvitations,
  inviteMember,
  updateMemberRole,
  removeMember,
  cancelInvitation,
} from '../../lib/organization-members';
import type { OrganizationMember, OrganizationInvitation } from '../../lib/organization-members';
import {
  getJoinRequests,
  acceptJoinRequest,
  declineJoinRequest,
} from '../../lib/join-requests';
import type { JoinRequest } from '../../lib/join-requests';
import { FieldError, FormError } from '../../components/FieldError';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function RoleBadge({ role }: { role: string }) {
  const colors =
    role === 'owner'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${colors}`}>
      {role}
    </span>
  );
}

// --- Members Section ---

function MembersSection({
  orgId,
  isOwner,
  currentUserId,
}: {
  orgId: string;
  isOwner: boolean;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ['organizations', orgId, 'members'],
    queryFn: () => getOrgMembers(orgId),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ orgUserId, role }: { orgUserId: string; role: string }) =>
      updateMemberRole(orgId, orgUserId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (orgUserId: string) => removeMember(orgId, orgUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleRoleChange = (member: OrganizationMember, newRole: string) => {
    if (newRole === member.role) return;
    updateRoleMutation.mutate({ orgUserId: member.id, role: newRole });
  };

  const handleRemove = (member: OrganizationMember) => {
    if (!window.confirm(`Remove ${member.user.name} from this organization?`)) return;
    removeMutation.mutate(member.id);
  };

  if (membersQuery.isLoading) {
    return <p className="text-sm text-gray-500">Loading members...</p>;
  }

  if (membersQuery.error) {
    return <p className="text-sm text-red-600">Failed to load members.</p>;
  }

  const members = membersQuery.data ?? [];
  const ownerCount = members.filter((m) => m.role === 'owner').length;

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Members</h2>

      <FormError mutation={updateRoleMutation} />
      <FormError mutation={removeMutation} />

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {members.map((member) => {
          const isSelf = member.user.id === currentUserId;
          const isLastOwner = member.role === 'owner' && ownerCount <= 1;

          return (
            <div key={member.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {member.user.image_url && (
                  <AvatarImage src={member.user.image_url} alt={member.user.name} />
                )}
                <AvatarFallback className="text-xs">
                  {initials(member.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {member.user.name}
                  {isSelf && <span className="text-gray-400 font-normal"> (you)</span>}
                </p>
                <p className="text-xs text-gray-500 truncate">{member.user.email}</p>
              </div>

              {isOwner ? (
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`Role for ${member.user.name}`}
                    value={member.role}
                    onChange={(e) => handleRoleChange(member, e.target.value)}
                    disabled={isLastOwner || updateRoleMutation.isPending}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                  >
                    <option value="owner">owner</option>
                    <option value="member">member</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => handleRemove(member)}
                    disabled={isLastOwner || removeMutation.isPending}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={`Remove ${member.user.name}`}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <RoleBadge role={member.role} />
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">No members yet.</p>
        )}
      </div>
    </section>
  );
}

// --- Join Requests Section ---

function StatusBadge({ status }: { status: JoinRequest['status'] }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-green-100 text-green-800',
    declined: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${styles[status] || styles.cancelled}`}>
      {status}
    </span>
  );
}

function JoinRequestsSection({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [decliningId, setDecliningId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');

  const joinRequestsQuery = useQuery({
    queryKey: ['organizations', orgId, 'join-requests'],
    queryFn: () => getJoinRequests(orgId),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptJoinRequest(orgId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      declineJoinRequest(orgId, id, reason),
    onSuccess: () => {
      setDecliningId(null);
      setDeclineReason('');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'join-requests'] });
    },
  });

  const requests = joinRequestsQuery.data ?? [];
  if (requests.length === 0) return null;

  // Pending first, then rest sorted by date
  const sorted = [...requests].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Join Requests</h2>

      <FormError mutation={acceptMutation} />
      <FormError mutation={declineMutation} />

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {sorted.map((req) => (
          <div key={req.id} className="px-4 py-3 space-y-2">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {req.user.image_url && (
                  <AvatarImage src={req.user.image_url} alt={req.user.name} />
                )}
                <AvatarFallback className="text-xs">
                  {initials(req.user.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{req.user.name}</p>
                <p className="text-xs text-gray-500 truncate">{req.user.email}</p>
              </div>

              <StatusBadge status={req.status} />

              <span className="text-xs text-gray-400">
                {new Date(req.created_at).toLocaleDateString()}
              </span>
            </div>

            {req.message && (
              <p className="text-sm text-gray-600 ml-11 line-clamp-2">{req.message}</p>
            )}

            {req.status === 'pending' && (
              <div className="ml-11 flex items-center gap-2">
                {decliningId === req.id ? (
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Reason for declining (optional)"
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
                    />
                    <button
                      onClick={() => declineMutation.mutate({ id: req.id, reason: declineReason })}
                      disabled={declineMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => { setDecliningId(null); setDeclineReason(''); }}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => acceptMutation.mutate(req.id)}
                      disabled={acceptMutation.isPending}
                      className="text-xs font-medium text-green-700 hover:text-green-900 disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => setDecliningId(req.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-800"
                    >
                      Decline
                    </button>
                  </>
                )}
              </div>
            )}

            {req.status === 'declined' && req.decline_reason && (
              <p className="text-xs text-gray-500 ml-11 italic">
                Reason: {req.decline_reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Invitations Section ---

function InvitationsSection({ orgId }: { orgId: string }) {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');

  const invitationsQuery = useQuery({
    queryKey: ['organizations', orgId, 'invitations'],
    queryFn: () => getOrgInvitations(orgId),
  });

  const inviteMutation = useMutation({
    mutationFn: (data: { email: string; role: string }) => inviteMember(orgId, data),
    onSuccess: () => {
      setEmail('');
      setRole('member');
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'invitations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'members'] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => cancelInvitation(orgId, invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgId, 'invitations'] });
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    inviteMutation.mutate({ email: email.trim(), role });
  };

  const handleCancel = (invitation: OrganizationInvitation) => {
    cancelMutation.mutate(invitation.id);
  };

  const invitations = invitationsQuery.data ?? [];

  return (
    <section>
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Invite a member</h2>

      <form onSubmit={handleInvite} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="invite-email" className="sr-only">Email</label>
            <input
              id="invite-email"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            />
            <FieldError mutation={inviteMutation} field="email" />
          </div>

          <div>
            <label htmlFor="invite-role" className="sr-only">Role</label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="member">Member</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={inviteMutation.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {inviteMutation.isPending ? 'Sending...' : 'Invite'}
          </button>
        </div>

        <FormError mutation={inviteMutation} />
      </form>

      {/* Pending invitations list */}
      {invitations.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Pending invitations</h3>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{inv.email}</p>
                  <p className="text-xs text-gray-500">
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>

                <RoleBadge role={inv.role} />

                <button
                  type="button"
                  onClick={() => handleCancel(inv)}
                  disabled={cancelMutation.isPending}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-30"
                  aria-label={`Cancel invitation for ${inv.email}`}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FormError mutation={cancelMutation} />
    </section>
  );
}

// --- Settings Page ---

export function OrgSettingsMembersPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug,
  );

  const orgId = userOrg?.organization_id;
  const isOwner = userOrg?.role === 'owner';
  const currentUserId = me.data?.id ?? '';

  if (!orgId) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-gray-900">Members</h1>
        <p className="text-sm text-gray-500 mt-1">Manage members and invitations</p>
      </div>

      <MembersSection orgId={orgId} isOwner={isOwner} currentUserId={currentUserId} />

      {isOwner && <JoinRequestsSection orgId={orgId} />}

      {isOwner && <InvitationsSection orgId={orgId} />}
    </div>
  );
}
