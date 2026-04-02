import { BASE } from './api';

export interface Challenge {
  id: string;
  community_id: string;
  organization_id: string | null;
  title: string;
  description: string;
  number_of_winners: number | null;
  start_on: string;
  end_on: string;
  state: string;
  image_url: string | null;
  applications_count: number;
  winners_count: number;
  created_at: string;
  updated_at: string;
}

interface ChallengesResponse {
  data: Challenge[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export async function getCommunityChallenge(
  communityId: string,
  params: { page?: number; per_page?: number } = {},
): Promise<ChallengesResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.per_page) qp.set('per_page', String(params.per_page));

  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/communities/${communityId}/challenges?${qp}`, {
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
