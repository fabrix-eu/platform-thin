import { api } from './api';

export interface CommunityAdmin {
  id: string;
  role: 'admin' | 'member';
  active: boolean;
  created_at: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    verified: boolean;
    image_url: string | null;
  };
}

export async function getCommunityAdmins(
  communityId: string,
): Promise<CommunityAdmin[]> {
  return api.get(`/communities/${communityId}/community_admins?per_page=50`);
}

export async function addCommunityAdmin(
  communityId: string,
  email: string,
): Promise<CommunityAdmin> {
  return api.post(`/communities/${communityId}/community_admins`, { email });
}

export async function removeCommunityAdmin(
  communityId: string,
  adminId: string,
): Promise<void> {
  await api.delete(`/communities/${communityId}/community_admins/${adminId}`);
}

export interface AdminInvitation {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  invited_by: { id: string; name: string; email: string };
}

export async function getAdminInvitations(
  communityId: string,
): Promise<AdminInvitation[]> {
  return api.get(`/communities/${communityId}/admin_invitations`);
}

export async function cancelAdminInvitation(
  communityId: string,
  invitationId: string,
): Promise<void> {
  await api.delete(`/communities/${communityId}/admin_invitations/${invitationId}`);
}

export async function resendAdminInvitation(
  communityId: string,
  invitationId: string,
): Promise<AdminInvitation> {
  return api.post(`/communities/${communityId}/admin_invitations/${invitationId}/resend`, {});
}
