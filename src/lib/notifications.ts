import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { api, BASE } from './api';
import { isAuthenticated, type User } from './auth';

// ── Types ────────────────────────────────────────────────────

export interface Notification {
  id: string;
  notification_type: string;
  scope: string;
  read: boolean;
  read_at: string | null;
  created_at: string;
  message: string;
  metadata: Record<string, string>;
  actor: {
    id: string;
    name: string;
    image_url: string | null;
  } | null;
  notifiable: {
    id: string;
    type: string;
  };
}

// ── API functions ────────────────────────────────────────────

async function getUnreadCount(): Promise<number> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/notifications/unread_count`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.count ?? 0;
}

async function getNotifications(page = 1, perPage = 10): Promise<Notification[]> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/notifications?page=${page}&per_page=${perPage}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.notifications ?? [];
}

async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notifications/${id}/mark_as_read`, {});
}

async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/mark_all_as_read', {});
}

// ── Query keys ───────────────────────────────────────────────

export const notificationKeys = {
  unreadCount: ['notifications', 'unread_count'] as const,
  list: ['notifications'] as const,
};

// ── Hooks ────────────────────────────────────────────────────

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadCount,
    enabled: isAuthenticated(),
    refetchOnWindowFocus: true,
    staleTime: 0, // always refetch on window focus
  });
}

export function useNotifications(perPage = 10) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => getNotifications(1, perPage),
    enabled: isAuthenticated(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      qc.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      qc.invalidateQueries({ queryKey: notificationKeys.list });
    },
  });
}

// ── URL resolver ─────────────────────────────────────────────

/**
 * Returns the URL to navigate to when clicking a notification.
 * Uses metadata + the user's me data to resolve org/community slugs.
 */
export function getNotificationUrl(n: Notification, me: User | null): string | null {
  const m = n.metadata;

  // Helper: find the orgSlug from the user's orgs that gives access to a community
  function orgSlugForCommunity(communitySlug: string): string | null {
    if (!me) return null;
    for (const org of me.organizations) {
      if (org.communities.some((c) => c.community_slug === communitySlug)) {
        return org.organization_slug;
      }
    }
    // Fallback: user might be community admin without org membership
    return me.organizations[0]?.organization_slug ?? null;
  }

  // Helper: find the orgSlug from an organization_id
  function orgSlugForId(orgId: string): string | null {
    if (!me) return null;
    return me.organizations.find((o) => o.organization_id === orgId)?.organization_slug ?? null;
  }

  switch (n.notification_type) {
    // ── Organization join requests ──
    case 'join_request_received': {
      const slug = orgSlugForId(m.organization_id);
      return slug ? `/${slug}/settings/members` : null;
    }
    case 'join_request_accepted':
    case 'join_request_declined':
      return m.organization_id ? `/organizations/${m.organization_id}` : null;

    // ── Community join requests ──
    case 'community_join_request_received': {
      const orgSlug = orgSlugForCommunity(m.community_slug);
      return orgSlug && m.community_slug
        ? `/${orgSlug}/communities/${m.community_slug}/join-requests`
        : null;
    }
    case 'community_join_request_accepted':
    case 'community_join_request_declined': {
      const orgSlug = orgSlugForCommunity(m.community_slug);
      return orgSlug && m.community_slug
        ? `/${orgSlug}/communities/${m.community_slug}`
        : null;
    }

    // ── Organization invitations ──
    case 'organization_invitation_accepted':
    case 'organization_member_joined': {
      const slug = orgSlugForId(m.organization_id);
      return slug ? `/${slug}/settings/members` : null;
    }

    // ── Organization claimed ──
    case 'organization_claimed':
      return '/my/organization_claims';

    // ── Community invitations ──
    case 'community_invitation_received':
      return '/my/invitations';
    case 'community_invitation_accepted': {
      const orgSlug = orgSlugForCommunity(m.community_slug);
      return orgSlug && m.community_slug
        ? `/${orgSlug}/communities/${m.community_slug}`
        : null;
    }

    // ── Community events / challenges ──
    case 'event_created': {
      const orgSlug = orgSlugForCommunity(m.community_slug);
      return orgSlug && m.community_slug
        ? `/${orgSlug}/communities/${m.community_slug}/events`
        : null;
    }
    case 'challenge_created':
    case 'challenge_application_received':
    case 'challenge_application_accepted':
    case 'challenge_application_rejected':
    case 'challenge_winner_selected':
    case 'challenge_completed': {
      const orgSlug = orgSlugForCommunity(m.community_slug);
      return orgSlug && m.community_slug
        ? `/${orgSlug}/communities/${m.community_slug}/challenges`
        : null;
    }

    // ── Community membership ──
    case 'community_organization_created':
    case 'organization_added_to_community':
    case 'organization_joined_community': {
      const orgSlug = orgSlugForCommunity(m.community_slug);
      return orgSlug && m.community_slug
        ? `/${orgSlug}/communities/${m.community_slug}/members`
        : null;
    }

    // ── Nearby org ──
    case 'nearby_organization_created':
      return n.notifiable?.id ? `/organizations/${n.notifiable.id}` : null;

    // ── Messages ──
    case 'message_received':
      return m.conversation_id ? `/messages?selected=${m.conversation_id}` : '/messages';

    default:
      return null;
  }
}

/** Invalidate unread count on every route navigation */
export function useRefreshOnNavigate() {
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    return router.subscribe('onLoad', () => {
      if (isAuthenticated()) {
        qc.invalidateQueries({ queryKey: notificationKeys.unreadCount });
      }
    });
  }, [router, qc]);
}
