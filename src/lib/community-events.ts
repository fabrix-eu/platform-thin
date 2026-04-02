import { BASE } from './api';

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  happens_at: string;
  address: string;
  lon: number | null;
  lat: number | null;
  online: boolean;
  online_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface CommunityEventsResponse {
  data: CommunityEvent[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export async function getCommunityEvents(
  communityId: string,
  params: { page?: number; per_page?: number } = {},
): Promise<CommunityEventsResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.per_page) qp.set('per_page', String(params.per_page));

  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/communities/${communityId}/community_events?${qp}`, {
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
