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
