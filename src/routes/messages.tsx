import { useSearch } from '@tanstack/react-router';
import { MessagingLayout } from '../components/MessagingLayout';

export function MessagesPage() {
  const { selected } = useSearch({ strict: false }) as { selected?: string };

  return <MessagingLayout selectedId={selected} />;
}
