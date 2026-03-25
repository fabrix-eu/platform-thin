import { api } from './api';

export interface CommunityJoinRequest {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  community: { id: string; name: string; slug: string };
  organization: { id: string; name: string; slug: string };
  user: { id: string; name: string; email: string; image_url: string | null };
}

export async function createCommunityJoinRequest(
  communityId: string,
  organizationId: string,
  message: string,
): Promise<CommunityJoinRequest> {
  return api.post<CommunityJoinRequest>(
    `/communities/${communityId}/join_requests`,
    { community_join_request: { organization_id: organizationId, message } },
  );
}

export async function getCommunityJoinRequests(
  communityId: string,
): Promise<CommunityJoinRequest[]> {
  return api.get<CommunityJoinRequest[]>(
    `/communities/${communityId}/join_requests`,
  );
}

export async function acceptCommunityJoinRequest(
  communityId: string,
  joinRequestId: string,
): Promise<CommunityJoinRequest> {
  return api.post<CommunityJoinRequest>(
    `/communities/${communityId}/join_requests/${joinRequestId}/accept`,
    {},
  );
}

export async function declineCommunityJoinRequest(
  communityId: string,
  joinRequestId: string,
  reason: string,
): Promise<CommunityJoinRequest> {
  return api.post<CommunityJoinRequest>(
    `/communities/${communityId}/join_requests/${joinRequestId}/decline`,
    { decline_reason: reason },
  );
}

export async function cancelCommunityJoinRequest(
  joinRequestId: string,
): Promise<void> {
  await api.delete(`/community_join_requests/${joinRequestId}/cancel`);
}

export async function getMyCommunityJoinRequests(): Promise<
  CommunityJoinRequest[]
> {
  return api.get<CommunityJoinRequest[]>('/my/community_join_requests');
}
