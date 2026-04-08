import { useSearch } from '@tanstack/react-router';
import { MessagingLayout } from '../components/MessagingLayout';

export function MessagesPage() {
  const { selected, to } = useSearch({ strict: false }) as { selected?: string; to?: string };

  return <MessagingLayout selectedId={selected} newConversationOrgId={to} />;
}
