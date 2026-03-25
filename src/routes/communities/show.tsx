import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommunity } from '../../lib/communities';
import { getMe } from '../../lib/auth';
import {
  createCommunityJoinRequest,
  getMyCommunityJoinRequests,
} from '../../lib/community-join-requests';
import { FieldError, FormError } from '../../components/FieldError';

function CommunityJoinRequestButton({ communityId }: { communityId: string }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState('');

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const myOrgs = meQuery.data?.organizations ?? [];

  const myRequestsQuery = useQuery({
    queryKey: ['my', 'community-join-requests'],
    queryFn: getMyCommunityJoinRequests,
  });

  const mutation = useMutation({
    mutationFn: ({ orgId, msg }: { orgId: string; msg: string }) =>
      createCommunityJoinRequest(communityId, orgId, msg),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['my', 'community-join-requests'],
      });
      setShowForm(false);
      setMessage('');
      setSelectedOrgId('');
    },
  });

  // Check if any of the user's orgs already has a pending request for this community
  const pendingRequest = myRequestsQuery.data?.find(
    (r) =>
      r.community.id === communityId &&
      r.status === 'pending',
  );

  // Show success message after submitting (before pendingRequest check,
  // since the invalidated query would find the new request immediately)
  if (mutation.isSuccess) {
    return (
      <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
        Request sent! You will be notified once reviewed.
      </p>
    );
  }

  if (pendingRequest) {
    return (
      <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-amber-100 text-amber-800">
        Request pending
      </span>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => {
          // Pre-select the first org if only one
          if (myOrgs.length === 1) {
            setSelectedOrgId(myOrgs[0].organization_id);
          }
          setShowForm(true);
        }}
        className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Request to join
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-80">
      {myOrgs.length > 1 && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select organization
          </label>
          <select
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none"
          >
            <option value="">Choose an organization...</option>
            {myOrgs.map((o) => (
              <option key={o.organization_id} value={o.organization_id}>
                {o.organization_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Why should your organization join this community? (min. 10 characters)"
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
      />
      <FieldError mutation={mutation} field="message" />
      <FieldError mutation={mutation} field="organization" />
      <FieldError mutation={mutation} field="user" />
      <FormError mutation={mutation} />

      <div className="flex gap-2">
        <button
          onClick={() =>
            mutation.mutate({ orgId: selectedOrgId, msg: message })
          }
          disabled={
            !selectedOrgId ||
            message.trim().length < 10 ||
            mutation.isPending
          }
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Sending...' : 'Send request'}
        </button>
        <button
          onClick={() => {
            setShowForm(false);
            setMessage('');
            setSelectedOrgId('');
          }}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function CommunityShowPage() {
  const { id } = useParams({ strict: false }) as { id: string };

  const meQuery = useQuery({ queryKey: ['me'], queryFn: getMe });
  const query = useQuery({
    queryKey: ['communities', id],
    queryFn: () => getCommunity(id),
  });

  if (query.isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (query.error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <p className="text-red-600">Community not found</p>
        <Link
          to="/communities"
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to communities
        </Link>
      </div>
    );
  }

  const community = query.data!;
  const me = meQuery.data;
  const isLoggedIn = !!me;

  // Check if any of the user's orgs is already a member of this community
  const isMember = me?.organizations.some((o) =>
    o.communities.some((c) => c.community_id === community.id),
  ) ?? false;

  const initials = community.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="px-6 py-4">
        <Link
          to="/communities"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          &larr; Back to communities
        </Link>
      </div>

      <div className="px-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900">
                {community.name}
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>
                  {community.organizations_count}{' '}
                  {community.organizations_count === 1
                    ? 'organization'
                    : 'organizations'}
                </span>
                {community.center_address && (
                  <span>&middot; {community.center_address}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 mt-1">
            {isMember && (
              <span className="text-xs font-medium bg-green-100 text-green-800 px-2.5 py-1 rounded-full">
                Member
              </span>
            )}
            {isLoggedIn && !isMember && (
              <CommunityJoinRequestButton communityId={community.id} />
            )}
          </div>
        </div>

        {community.description && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {community.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
