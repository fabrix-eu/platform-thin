import { useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { MessagingLayout } from '../../components/MessagingLayout';

export function OrgMessagesPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const { selected, to, listing } = useSearch({ strict: false }) as {
    selected?: string;
    to?: string;
    listing?: string;
  };
  const navigate = useNavigate();
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const userOrg = me.data?.organizations.find(
    (o) => o.organization_slug === orgSlug,
  );

  if (!userOrg) return null;

  return (
    <MessagingLayout
      orgId={userOrg.organization_id}
      replyAsOrgId={userOrg.organization_id}
      selectedId={selected}
      newConversationOrgId={to}
      listingId={listing}
      onSelectConversation={(id) =>
        navigate({ to: '/$orgSlug/messages', params: { orgSlug }, search: { selected: id } })
      }
    />
  );
}
