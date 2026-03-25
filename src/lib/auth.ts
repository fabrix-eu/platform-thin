import { api } from './api';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface MeOrganization {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_kind: string;
  organization_image_url: string | null;
  organization_registration_step: number;
  onboarding_complete: boolean;
  role: 'owner' | 'admin' | 'member';
  relations_count: number;
  assessments_completed: number;
  assessments_total: number;
  communities: {
    community_id: string;
    community_name: string;
    community_slug: string;
    community_image_url: string | null;
  }[];
}

export interface AccessibleCommunity {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  is_admin: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  image_url: string | null;
  organizations: MeOrganization[];
  accessible_communities: AccessibleCommunity[];
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const tokens = await api.post<AuthTokens>('/auth_tokens', { email, password });
  localStorage.setItem('access_token', tokens.access_token);
  localStorage.setItem('refresh_token', tokens.refresh_token);
  return tokens;
}

export async function logout(): Promise<void> {
  try {
    await api.delete('/auth_tokens');
  } catch {
    // ignore
  }
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getMe(): Promise<User> {
  return api.get<User>('/me');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('access_token');
}
