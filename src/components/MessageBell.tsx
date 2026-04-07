import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from '../lib/auth';
import {
  useConversations,
  useUnreadConversationCount,
  getConversationDisplayName,
  type ConversationWithLastMessage,
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

type Tab = 'personal' | 'organization';

export function MessageBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('personal');
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const qc = useQueryClient();
  const me = qc.getQueryData<User>(['me']) ?? null;
  const myUserId = me?.id ?? '';
  const myOrgIds = me?.organizations.map((o) => o.organization_id) ?? [];

  const { data: unreadCount = 0 } = useUnreadConversationCount();
  const { data: allConversations = [], isLoading } = useConversations();

  // Split conversations into personal vs organization
  const personalConversations = allConversations.filter((c) => {
    // Personal = conversations where the user participates as themselves (not via org)
    if (c.initiator.type === 'user' && c.initiator.id === myUserId) return true;
    if (c.recipient?.type === 'user' && c.recipient.id === myUserId) return true;
    return false;
  });

  const orgConversations = allConversations.filter((c) => {
    const participantOrgIds = [
      c.recipient_organization?.id,
      c.initiator.type === 'organization' ? c.initiator.id : null,
    ].filter(Boolean);
    return participantOrgIds.some((id) => myOrgIds.includes(id!));
  });

  const conversations = tab === 'personal' ? personalConversations : orgConversations;

  const personalUnread = personalConversations.filter((c) => c.unread_count > 0).length;
  const orgUnread = orgConversations.filter((c) => c.unread_count > 0).length;

  // Click outside to close
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function getMyOrgForConversation(conv: ConversationWithLastMessage) {
    if (!me) return null;
    // Find which of my orgs is involved in this conversation
    const orgIds = [
      conv.recipient_organization?.id,
      conv.initiator.type === 'organization' ? conv.initiator.id : null,
    ].filter(Boolean);
    return me.organizations.find((o) => orgIds.includes(o.organization_id)) ?? null;
  }

  function handleConversationClick(conv: ConversationWithLastMessage) {
    setOpen(false);
    if (tab === 'personal') {
      navigate({ to: '/messages', search: { selected: conv.id } });
    } else {
      const matchedOrg = getMyOrgForConversation(conv);
      if (matchedOrg) {
        navigate({ to: `/${matchedOrg.organization_slug}/messages` });
      }
    }
  }

  function handleSeeAllPersonal() {
    setOpen(false);
    navigate({ to: '/messages' });
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Messages"
      >
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-lg shadow-lg z-50">
          {/* Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setTab('personal')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                tab === 'personal'
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Personal
              {personalUnread > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {personalUnread}
                </span>
              )}
              {tab === 'personal' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
            <button
              onClick={() => setTab('organization')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors relative ${
                tab === 'organization'
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Organization
              {orgUnread > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
                  {orgUnread}
                </span>
              )}
              {tab === 'organization' && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Conversation list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
            ) : conversations.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No {tab === 'personal' ? 'personal' : 'organization'} messages yet
              </div>
            ) : (
              conversations.slice(0, 8).map((conv) => {
                const displayName = getConversationDisplayName(conv, myUserId, myOrgIds);
                const unread = conv.unread_count > 0;
                const initials = displayName
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();
                const myOrg = tab === 'organization' ? getMyOrgForConversation(conv) : null;

                return (
                  <button
                    key={conv.id}
                    onClick={() => handleConversationClick(conv)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-border last:border-b-0 ${
                      unread ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-sm truncate ${unread ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {displayName}
                        </span>
                        {conv.last_message_at && (
                          <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">
                            {timeAgo(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      {myOrg && (
                        <p className="text-[11px] text-primary/70 truncate">
                          via {myOrg.organization_name}
                        </p>
                      )}
                      {conv.last_message && (
                        <p className={`text-xs truncate mt-0.5 ${unread ? 'text-gray-700' : 'text-gray-400'}`}>
                          {conv.last_message.content}
                        </p>
                      )}
                    </div>

                    {/* Unread dot */}
                    {unread && (
                      <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer — only for personal tab */}
          {tab === 'personal' && (
            <div className="border-t border-border">
              <button
                onClick={handleSeeAllPersonal}
                className="w-full px-4 py-2.5 text-sm text-primary hover:bg-gray-50 transition-colors text-center font-medium"
              >
                See all personal messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
