import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../lib/auth';
import {
  useConversations,
  useConversation,
  useSendMessage,
  useMarkAsRead,
  getConversationDisplayName,
  type ConversationWithLastMessage,
  type Message,
} from '../lib/conversations';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}

interface MessagingLayoutProps {
  /** Filter conversations to only show org-related ones */
  orgId?: string;
  /** When replying as an org member, send as this org */
  replyAsOrgId?: string;
  /** Pre-select a conversation by id */
  selectedId?: string;
}

export function MessagingLayout({ orgId, replyAsOrgId, selectedId }: MessagingLayoutProps) {
  const [activeId, setActiveId] = useState<string | null>(selectedId ?? null);
  const queryClient = useQueryClient();

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const myUserId = me.data?.id ?? '';
  const myOrgIds = me.data?.organizations.map((o) => o.organization_id) ?? [];

  const { data: allConversations = [], isLoading } = useConversations();

  // Filter conversations based on context
  const conversations = orgId
    ? allConversations.filter((c) => {
        const participantOrgIds = [
          c.recipient_organization?.id,
          c.initiator.type === 'organization' ? c.initiator.id : null,
        ].filter(Boolean);
        return participantOrgIds.includes(orgId);
      })
    : allConversations.filter((c) => {
        // Personal messages: user is direct participant (not via org)
        if (c.initiator.type === 'user' && c.initiator.id === myUserId) return true;
        if (c.recipient?.type === 'user' && c.recipient.id === myUserId) return true;
        return false;
      });

  // Auto-select first conversation
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [activeId, conversations]);

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-white flex flex-col flex-shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-gray-900">
            {orgId ? 'Organization messages' : 'Messages'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-400">Loading...</div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <ConversationRow
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeId}
                myUserId={myUserId}
                myOrgIds={myOrgIds}
                onClick={() => setActiveId(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Message area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeId ? (
          <ConversationView
            conversationId={activeId}
            myUserId={myUserId}
            replyAsOrgId={replyAsOrgId}
            queryClient={queryClient}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}

// ── Conversation row in sidebar ─────────────────────────────

function ConversationRow({
  conversation,
  isActive,
  myUserId,
  myOrgIds,
  onClick,
}: {
  conversation: ConversationWithLastMessage;
  isActive: boolean;
  myUserId: string;
  myOrgIds: string[];
  onClick: () => void;
}) {
  const displayName = getConversationDisplayName(conversation, myUserId, myOrgIds);
  const lastMsg = conversation.last_message;
  const unread = conversation.unread_count > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border transition-colors ${
        isActive ? 'bg-primary/5' : 'hover:bg-gray-50'
      }`}
    >
      {/* Avatar placeholder */}
      <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
        {displayName
          .split(/\s+/)
          .slice(0, 2)
          .map((w) => w[0])
          .join('')
          .toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
            {displayName}
          </span>
          {conversation.last_message_at && (
            <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
              {timeAgo(conversation.last_message_at)}
            </span>
          )}
        </div>
        {lastMsg && (
          <p className={`text-xs truncate mt-0.5 ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
            {lastMsg.content}
          </p>
        )}
      </div>

      {unread && (
        <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-3" />
      )}
    </button>
  );
}

// ── Conversation messages view ──────────────────────────────

function ConversationView({
  conversationId,
  myUserId,
  replyAsOrgId,
  queryClient,
}: {
  conversationId: string;
  myUserId: string;
  replyAsOrgId?: string;
  queryClient: ReturnType<typeof useQueryClient>;
}) {
  const { data: conversation, isLoading } = useConversation(conversationId);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mark as read when opening conversation
  useEffect(() => {
    if (conversation && conversation.unread_count > 0) {
      markAsRead.mutate(conversationId);
    }
  }, [conversationId, conversation?.unread_count]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages?.length]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    sendMessage.mutate(
      { conversationId, content: text, authorOrganizationId: replyAsOrgId },
      {
        onSuccess: () => {
          setInput('');
          textareaRef.current?.focus();
        },
      },
    );
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-400">Loading...</div>;
  }

  if (!conversation) return null;

  const myOrgIds = queryClient.getQueryData<{ organizations: { organization_id: string }[] }>(['me'])
    ?.organizations.map((o) => o.organization_id) ?? [];

  const otherName = getConversationDisplayName(conversation, myUserId, myOrgIds);

  return (
    <>
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center">
        <h3 className="text-sm font-semibold text-gray-900">{otherName}</h3>
        {conversation.recipient?.type === 'organization' && (
          <span className="ml-2 text-xs text-gray-400">Organization</span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {conversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.author.user.id === myUserId} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-3 border-t border-border">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
}

// ── Message bubble ──────────────────────────────────────────

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  const authorLabel = message.author.organization
    ? `${message.author.user.name} · ${message.author.organization.name}`
    : message.author.user.name;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
        <div className={`text-xs mb-1 ${isOwn ? 'text-right' : 'text-left'} text-gray-400`}>
          {authorLabel}
        </div>
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            isOwn
              ? 'bg-primary text-primary-foreground'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <div className={`text-[11px] mt-1 ${isOwn ? 'text-right' : 'text-left'} text-gray-400`}>
          {timeAgo(message.created_at)}
        </div>
      </div>
    </div>
  );
}
