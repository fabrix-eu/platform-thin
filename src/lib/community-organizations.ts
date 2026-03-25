import { api } from './api';
import type { Organization } from './organizations';

export interface CommunityOrganization {
  id: string;
  organization_id: string;
  status: string;
  notes: string | null;
  economic_health: string | null;
  environmental_score: string | null;
  specialization: string | null;
  annual_turnover: string | null;
  number_of_employees: number | null;
  growth_rate: string | null;
  needs: Record<string, unknown>;
  added_at: string | null;
  created_at: string;
  updated_at: string;
  organization: Organization;
  added_by: { id: string; name: string; email: string; image_url: string | null } | null;
}

interface CommunityOrganizationsResponse {
  data: CommunityOrganization[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export async function getCommunityOrganizations(
  communityId: string,
  params: { page?: number; per_page?: number; search?: string } = {},
): Promise<CommunityOrganizationsResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.per_page) qp.set('per_page', String(params.per_page));
  if (params.search) qp.set('search', params.search);

  // The api.get unwraps { data } but we need both data and meta
  // So we fetch manually to preserve the full response shape
  const token = localStorage.getItem('access_token');
  const { BASE } = await import('./api');
  const res = await fetch(`${BASE}/communities/${communityId}/community_organizations?${qp}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    return { data: [], meta: { current_page: 1, total_pages: 1, total_count: 0, next_page: null, prev_page: null } };
  }

  return res.json();
}

export async function addCommunityOrganization(
  communityId: string,
  organizationId: string,
): Promise<CommunityOrganization> {
  return api.post(`/communities/${communityId}/community_organizations`, {
    organization_id: organizationId,
  });
}

export async function getCommunityOrganization(
  communityId: string,
  membershipId: string,
): Promise<CommunityOrganization> {
  return api.get(`/communities/${communityId}/community_organizations/${membershipId}`);
}

export async function updateCommunityOrganization(
  communityId: string,
  membershipId: string,
  data: {
    notes?: string | null;
    status?: string;
    economic_health?: string | null;
    environmental_score?: string | null;
    specialization?: string | null;
    annual_turnover?: string | null;
    number_of_employees?: number | null;
    growth_rate?: string | null;
  },
): Promise<CommunityOrganization> {
  return api.patch(`/communities/${communityId}/community_organizations/${membershipId}`, {
    community_organization: data,
  });
}

export async function removeCommunityOrganization(
  communityId: string,
  membershipId: string,
): Promise<void> {
  await api.delete(`/communities/${communityId}/community_organizations/${membershipId}`);
}
