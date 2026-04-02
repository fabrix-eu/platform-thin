import { BASE } from './api';

export interface RecentPost {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    image_url: string | null;
    role: string;
    organization: { id: string; name: string } | null;
  };
  likes_count: number;
  comments_count: number;
  liked: boolean;
  space: {
    id: string;
    name: string;
    icon: string;
  };
}

export async function getRecentPosts(communityId: string): Promise<RecentPost[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/communities/${communityId}/recent_posts`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) return [];

  const json = await res.json();
  return json.data ?? [];
}
