import { api } from './api';

// --- Types (matching backend JoinRequestBlueprint) ---

export interface JoinRequest {
  id: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  message: string;
  decline_reason: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  organization: { id: string; name: string; slug: string };
  user: { id: string; name: string; email: string; image_url: string | null };
}

// --- API functions ---

export async function getJoinRequests(orgId: string): Promise<JoinRequest[]> {
  return api.get<JoinRequest[]>(`/organizations/${orgId}/join_requests`);
}

export async function createJoinRequest(
  orgId: string,
  message: string,
): Promise<JoinRequest> {
  return api.post<JoinRequest>(`/organizations/${orgId}/join_requests`, {
    join_request: { message },
  });
}

export async function acceptJoinRequest(
  orgId: string,
  joinRequestId: string,
): Promise<JoinRequest> {
  return api.post<JoinRequest>(
    `/organizations/${orgId}/join_requests/${joinRequestId}/accept`,
    {},
  );
}

export async function declineJoinRequest(
  orgId: string,
  joinRequestId: string,
  reason: string,
): Promise<JoinRequest> {
  return api.post<JoinRequest>(
    `/organizations/${orgId}/join_requests/${joinRequestId}/decline`,
    { join_request: { decline_reason: reason } },
  );
}

export async function cancelJoinRequest(joinRequestId: string): Promise<void> {
  await api.delete(`/join_requests/${joinRequestId}/cancel`);
}

export async function getMyJoinRequests(): Promise<JoinRequest[]> {
  return api.get<JoinRequest[]>('/my/join_requests');
}
