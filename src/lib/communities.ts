import { api, BASE } from './api';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  organizations_count: number;
  users_count: number;
  center_address: string | null;
  center_lat: number | null;
  center_lon: number | null;
  radius_km: number | null;
  created_at: string;
  updated_at: string;
  is_member?: boolean;
  created_by?: { id: string; name: string; email: string };
}

interface PaginatedResponse {
  data: Community[];
  meta: {
    total_pages: number;
    current_page: number;
    total_count: number;
  };
}

export async function getCommunities(params?: {
  page?: number;
  search?: string;
}): Promise<PaginatedResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.search) qs.set('search', params.search);
  const query = qs.toString();

  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/communities${query ? `?${query}` : ''}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function getCommunity(id: string): Promise<Community> {
  return api.get<Community>(`/communities/${id}`);
}

export async function createCommunity(data: {
  name: string;
  description?: string;
}): Promise<Community> {
  return api.post<Community>('/communities', { community: data });
}
