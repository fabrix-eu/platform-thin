import { api, BASE } from './api';

export interface Challenge {
  id: string;
  community_id: string;
  organization_id: string | null;
  title: string;
  description: string;
  number_of_winners: number | null;
  start_on: string | null;
  end_on: string | null;
  state: 'draft' | 'active' | 'completed' | 'cancelled';
  image_url: string | null;
  image_key: string | null;
  requires_attachment: boolean;
  applications_count: number;
  winners_count: number;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    image_url: string | null;
  } | null;
  my_application?: ChallengeApplication | null;
}

export interface ChallengeApplication {
  id: string;
  challenge_id: string;
  organization_id: string;
  note: string | null;
  attachment_url: string | null;
  attachment_key: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'winner';
  submitted_at: string;
  reviewed_at: string | null;
  won_at: string | null;
  created_at: string;
  updated_at: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    kind: string;
    image_url: string | null;
  };
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

interface ApplicationsResponse {
  data: ChallengeApplication[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

// ── Challenges ──────────────────────────────────────────────

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

export async function getChallengeDetail(
  communityId: string,
  challengeId: string,
): Promise<Challenge> {
  return api.get<Challenge>(`/communities/${communityId}/challenges/${challengeId}`);
}

export async function createChallenge(
  communityId: string,
  data: {
    title: string;
    description: string;
    number_of_winners?: number;
    start_on?: string;
    end_on?: string;
    state?: string;
    organization_id?: string;
    requires_attachment?: boolean;
    image_url?: string;
    image_key?: string;
  },
): Promise<Challenge> {
  return api.post<Challenge>(`/communities/${communityId}/challenges`, {
    challenge: data,
  });
}

export async function updateChallenge(
  communityId: string,
  challengeId: string,
  data: Partial<{
    title: string;
    description: string;
    number_of_winners: number;
    start_on: string;
    end_on: string;
    state: string;
    organization_id: string;
    requires_attachment: boolean;
    image_url: string;
    image_key: string;
  }>,
): Promise<Challenge> {
  return api.patch<Challenge>(`/communities/${communityId}/challenges/${challengeId}`, {
    challenge: data,
  });
}

export async function deleteChallenge(
  communityId: string,
  challengeId: string,
): Promise<void> {
  return api.delete(`/communities/${communityId}/challenges/${challengeId}`);
}

// ── Applications ────────────────────────────────────────────

export async function getChallengeApplications(
  communityId: string,
  challengeId: string,
  params: { page?: number; per_page?: number } = {},
): Promise<ApplicationsResponse> {
  const qp = new URLSearchParams();
  if (params.page) qp.set('page', String(params.page));
  if (params.per_page) qp.set('per_page', String(params.per_page));

  const token = localStorage.getItem('access_token');
  const res = await fetch(
    `${BASE}/communities/${communityId}/challenges/${challengeId}/applications?${qp}`,
    {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!res.ok) {
    return { data: [], meta: { current_page: 1, total_pages: 1, total_count: 0, next_page: null, prev_page: null } };
  }

  return res.json();
}

export async function createApplication(
  communityId: string,
  challengeId: string,
  data: { note?: string; attachment_url?: string; attachment_key?: string },
): Promise<ChallengeApplication> {
  return api.post<ChallengeApplication>(
    `/communities/${communityId}/challenges/${challengeId}/applications`,
    { challenge_application: data },
  );
}

export async function acceptApplication(
  communityId: string,
  challengeId: string,
  applicationId: string,
): Promise<ChallengeApplication> {
  return api.patch<ChallengeApplication>(
    `/communities/${communityId}/challenges/${challengeId}/applications/${applicationId}/accept`,
    {},
  );
}

export async function rejectApplication(
  communityId: string,
  challengeId: string,
  applicationId: string,
): Promise<ChallengeApplication> {
  return api.patch<ChallengeApplication>(
    `/communities/${communityId}/challenges/${challengeId}/applications/${applicationId}/reject`,
    {},
  );
}

export async function selectWinner(
  communityId: string,
  challengeId: string,
  applicationId: string,
): Promise<ChallengeApplication> {
  return api.patch<ChallengeApplication>(
    `/communities/${communityId}/challenges/${challengeId}/applications/${applicationId}/select_winner`,
    {},
  );
}

export async function withdrawApplication(
  communityId: string,
  challengeId: string,
  applicationId: string,
): Promise<void> {
  return api.delete(
    `/communities/${communityId}/challenges/${challengeId}/applications/${applicationId}`,
  );
}
