import { useSearch, useNavigate } from '@tanstack/react-router';
import { MessagingLayout } from '../components/MessagingLayout';

export function MessagesPage() {
  const { selected, to, listing } = useSearch({ strict: false }) as {
    selected?: string;
    to?: string;
    listing?: string;
  };
  const navigate = useNavigate();

  return (
    <MessagingLayout
      selectedId={selected}
      newConversationOrgId={to}
      listingId={listing}
      onSelectConversation={(id) => navigate({ to: '/messages', search: { selected: id } })}
    />
  );
}
