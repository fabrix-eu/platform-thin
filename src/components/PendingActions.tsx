import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../lib/auth';
import { getPendingActions } from '../lib/pending-actions';

export function PendingActions() {
  const me = useQuery({ queryKey: ['me'], queryFn: getMe });

  const ownedOrgs = (me.data?.organizations ?? [])
    .filter((o) => o.role === 'owner')
    .map((o) => ({ id: o.organization_id, slug: o.organization_slug, name: o.organization_name }));

  const actions = useQuery({
    queryKey: ['pending-actions', ownedOrgs.map((o) => o.id)],
    queryFn: () => getPendingActions(ownedOrgs),
    enabled: !!me.data,
    staleTime: 60_000,
  });

  if (!actions.data || actions.data.total === 0) return null;

  const { pendingClaims, pendingJoinRequests, pendingCommunityJoinRequests, incomingJoinRequests, receivedInvitations } = actions.data;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900 mb-2">
            {actions.data.total === 1 ? '1 pending action' : `${actions.data.total} pending actions`}
          </h3>
          <ul className="space-y-1.5">
            {incomingJoinRequests.map((entry) => (
              <li key={entry.orgSlug}>
                <Link
                  to="/$orgSlug/settings/members"
                  params={{ orgSlug: entry.orgSlug }}
                  className="text-sm text-amber-800 hover:text-amber-950 hover:underline"
                >
                  {entry.requests.length === 1
                    ? `1 person wants to join ${entry.orgName}`
                    : `${entry.requests.length} people want to join ${entry.orgName}`}
                  <span className="ml-1 text-amber-500">&rarr;</span>
                </Link>
              </li>
            ))}
            {receivedInvitations.map((inv) => (
              <li key={inv.id} className="text-sm text-amber-800">
                {inv.invitation_type === 'claim'
                  ? `You're invited to claim ${inv.organization.name}`
                  : `You're invited to join ${inv.organization.name}`}
              </li>
            ))}
            {pendingClaims.map((claim) => (
              <li key={claim.id} className="text-sm text-amber-800">
                Your claim for {claim.organization.name} is pending review
              </li>
            ))}
            {pendingJoinRequests.map((req) => (
              <li key={req.id} className="text-sm text-amber-800">
                Your request to join {req.organization.name} is pending
              </li>
            ))}
            {pendingCommunityJoinRequests.map((req) => (
              <li key={req.id} className="text-sm text-amber-800">
                Your request to join {req.community.name} is pending
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
