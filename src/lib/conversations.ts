import { api, BASE } from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAuthenticated } from './auth';

// ── Types ────────────────────────────────────────────────────

export interface MessageAuthor {
  user: { id: string; name: string };
  organization: { id: string; name: string; slug: string } | null;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  author: MessageAuthor;
}

export interface ConversationParticipant {
  type: 'user' | 'organization';
  id: string;
  name: string;
  slug?: string;
}

export interface Conversation {
  id: string;
  initiator_type: 'user' | 'organization';
  initiator: ConversationParticipant;
  recipient: ConversationParticipant | null;
  recipient_organization: { id: string; name: string; slug: string } | null;
  last_message_at: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationWithLastMessage extends Conversation {
  last_message: Message | null;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

// ── API functions ────────────────────────────────────────────

export async function getConversations(): Promise<ConversationWithLastMessage[]> {
  return api.get<ConversationWithLastMessage[]>('/conversations');
}

export async function getConversation(id: string): Promise<ConversationWithMessages> {
  return api.get<ConversationWithMessages>(`/conversations/${id}`);
}

export async function createConversation(params: {
  recipient_organization_id?: string;
  recipient_user_id?: string;
  initiator_organization_id?: string;
  content: string;
}): Promise<ConversationWithMessages> {
  const { content, ...conversationParams } = params;
  return api.post<ConversationWithMessages>('/conversations', {
    conversation: conversationParams,
    message: { content },
  });
}

export async function sendMessage(
  conversationId: string,
  content: string,
  authorOrganizationId?: string,
): Promise<Message> {
  return api.post<Message>(`/conversations/${conversationId}/messages`, {
    message: {
      content,
      ...(authorOrganizationId ? { author_organization_id: authorOrganizationId } : {}),
    },
  });
}

export async function markConversationAsRead(id: string): Promise<void> {
  await api.patch(`/conversations/${id}/read`, {});
}

export async function getUnreadConversationCount(): Promise<number> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/conversations/unread_count`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return 0;
  const json = await res.json();
  return json.data?.unread_count ?? 0;
}

// ── Query keys ──────────────────────────────────────────────

export const conversationKeys = {
  list: ['conversations'] as const,
  detail: (id: string) => ['conversations', id] as const,
  unreadCount: ['conversations', 'unread_count'] as const,
};

// ── Hooks ───────────────────────────────────────────────────

export function useConversations() {
  return useQuery({
    queryKey: conversationKeys.list,
    queryFn: getConversations,
    enabled: isAuthenticated(),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: conversationKeys.detail(id!),
    queryFn: () => getConversation(id!),
    enabled: !!id && isAuthenticated(),
  });
}

export function useUnreadConversationCount() {
  return useQuery({
    queryKey: conversationKeys.unreadCount,
    queryFn: getUnreadConversationCount,
    enabled: isAuthenticated(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content, authorOrganizationId }: {
      conversationId: string;
      content: string;
      authorOrganizationId?: string;
    }) => sendMessage(conversationId, content, authorOrganizationId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: conversationKeys.detail(vars.conversationId) });
      qc.invalidateQueries({ queryKey: conversationKeys.list });
    },
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createConversation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.list });
      qc.invalidateQueries({ queryKey: conversationKeys.unreadCount });
    },
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markConversationAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: conversationKeys.list });
      qc.invalidateQueries({ queryKey: conversationKeys.unreadCount });
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Get the display name for the "other side" of a conversation from the
 * perspective of a given user (by id).
 */
export function getConversationDisplayName(
  conv: Conversation,
  myUserId: string,
  myOrgIds: string[],
): string {
  // If I'm the initiator, show the recipient
  if (conv.initiator.type === 'user' && conv.initiator.id === myUserId) {
    return conv.recipient?.name ?? 'Unknown';
  }
  if (conv.initiator.type === 'organization' && myOrgIds.includes(conv.initiator.id)) {
    return conv.recipient?.name ?? 'Unknown';
  }
  // Otherwise show the initiator
  return conv.initiator.name;
}
