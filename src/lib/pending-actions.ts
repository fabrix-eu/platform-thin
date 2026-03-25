import { api } from './api';

// --- Types matching backend blueprints ---

interface PendingClaim {
  id: string;
  status: string;
  justification: string;
  organization: { id: string; name: string; slug: string };
}

interface PendingJoinRequest {
  id: string;
  status: string;
  message: string;
  organization: { id: string; name: string; slug: string };
}

interface PendingCommunityJoinRequest {
  id: string;
  status: string;
  message: string;
  community: { id: string; name: string; slug: string };
  organization: { id: string; name: string; slug: string };
}

interface IncomingJoinRequest {
  id: string;
  status: string;
  message: string;
  user: { id: string; name: string; email: string };
}

interface ReceivedInvitation {
  id: string;
  email: string;
  role: string;
  invitation_type: string;
  expired: boolean;
  organization: { id: string; name: string };
  invited_by: { id: string; name: string };
}

// --- Aggregated pending actions ---

export interface PendingActions {
  /** Claims you submitted, waiting for admin approval */
  pendingClaims: PendingClaim[];
  /** Join requests you submitted to orgs, waiting for owner */
  pendingJoinRequests: PendingJoinRequest[];
  /** Community join requests you submitted, waiting for admin */
  pendingCommunityJoinRequests: PendingCommunityJoinRequest[];
  /** Join requests on your orgs that need your approval (you're owner) */
  incomingJoinRequests: { orgSlug: string; orgName: string; requests: IncomingJoinRequest[] }[];
  /** Invitations you received */
  receivedInvitations: ReceivedInvitation[];
  /** Total count of items needing attention */
  total: number;
}

export async function getPendingActions(ownedOrgs: { id: string; slug: string; name: string }[]): Promise<PendingActions> {
  const [claims, joinRequests, communityJoinRequests, invitations, ...orgJoinRequests] = await Promise.all([
    api.get<PendingClaim[]>('/my/organization_claims'),
    api.get<PendingJoinRequest[]>('/my/join_requests'),
    api.get<PendingCommunityJoinRequest[]>('/my/community_join_requests'),
    api.get<ReceivedInvitation[]>('/my/invitations'),
    ...ownedOrgs.map((org) =>
      api.get<IncomingJoinRequest[]>(`/organizations/${org.id}/join_requests`)
    ),
  ]);

  const pendingClaims = claims.filter((c) => c.status === 'pending');
  const pendingJoinRequests = joinRequests.filter((j) => j.status === 'pending');
  const pendingCommunityJoinRequests = communityJoinRequests.filter((j) => j.status === 'pending');
  const receivedInvitations = invitations.filter((i) => !i.expired);

  const incomingJoinRequests = ownedOrgs
    .map((org, i) => ({
      orgSlug: org.slug,
      orgName: org.name,
      requests: (orgJoinRequests[i] as IncomingJoinRequest[]).filter((r) => r.status === 'pending'),
    }))
    .filter((entry) => entry.requests.length > 0);

  const total =
    pendingClaims.length +
    pendingJoinRequests.length +
    pendingCommunityJoinRequests.length +
    receivedInvitations.length +
    incomingJoinRequests.reduce((sum, e) => sum + e.requests.length, 0);

  return { pendingClaims, pendingJoinRequests, pendingCommunityJoinRequests, incomingJoinRequests, receivedInvitations, total };
}
