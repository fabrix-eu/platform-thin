import { api } from './api';

// ── Types ────────────────────────────────────────────────────

export interface UpdateMePayload {
  name?: string;
  email?: string;
  image_url?: string | null;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}

export interface NotificationPreference {
  notification_type: string;
  enabled: boolean;
  in_app: boolean;
  email: boolean;
  mandatory: boolean;
}

// ── Friendly labels for notification types ───────────────────

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  community_organization_created: 'Organization joined community',
  organization_added_to_community: 'Your organization added to community',
  event_created: 'New event created',
  nearby_organization_created: 'Nearby organization registered',
  challenge_created: 'New challenge created',
  challenge_application_received: 'Challenge application received',
  challenge_application_accepted: 'Challenge application accepted',
  challenge_application_rejected: 'Challenge application rejected',
  challenge_winner_selected: 'Challenge winner selected',
  challenge_completed: 'Challenge completed',
  community_invitation_received: 'Community invitation received',
  community_invitation_accepted: 'Community invitation accepted',
  organization_invitation_accepted: 'Organization invitation accepted',
  organization_member_joined: 'New member joined organization',
  organization_claimed: 'Organization claimed',
  organization_joined_community: 'Organization joined your community',
  join_request_received: 'Join request received',
  join_request_accepted: 'Join request accepted',
  join_request_declined: 'Join request declined',
  community_join_request_received: 'Community join request received',
  community_join_request_accepted: 'Community join request accepted',
  community_join_request_declined: 'Community join request declined',
};

// ── API functions ────────────────────────────────────────────

export async function updateMe(data: UpdateMePayload): Promise<void> {
  await api.patch('/me', { user: data });
}

export async function deleteMe(): Promise<void> {
  await api.delete('/me');
}

export async function getNotificationPreferences(): Promise<NotificationPreference[]> {
  return api.get<NotificationPreference[]>('/notification_preferences');
}

export async function updateNotificationPreference(
  data: Pick<NotificationPreference, 'notification_type' | 'enabled' | 'in_app' | 'email'>,
): Promise<NotificationPreference> {
  return api.patch<NotificationPreference>('/notification_preferences/update', {
    notification_preference: data,
  });
}
