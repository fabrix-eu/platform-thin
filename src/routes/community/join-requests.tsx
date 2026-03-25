import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCommunityJoinRequests,
  acceptCommunityJoinRequest,
  declineCommunityJoinRequest,
} from '../../lib/community-join-requests';
import { getCommunity } from '../../lib/communities';

function DeclineModal({
  onConfirm,
  onCancel,
  isPending,
}: {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Decline request</h3>
        <p className="text-sm text-gray-500 mb-4">
          Please provide a reason for declining this request.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for declining..."
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none"
        />
        <div className="flex gap-2 mt-4 justify-end">
          <button
            onClick={onCancel}
            className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || isPending}
            className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {isPending ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function CommunityJoinRequestsPage() {
  const { communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };
  const queryClient = useQueryClient();
  const [decliningId, setDecliningId] = useState<string | null>(null);

  // Fetch community to get its UUID
  const communityQuery = useQuery({
    queryKey: ['communities', communitySlug],
    queryFn: () => getCommunity(communitySlug),
  });
  const communityId = communityQuery.data?.id;

  const requestsQuery = useQuery({
    queryKey: ['communities', communityId, 'join-requests'],
    queryFn: () => getCommunityJoinRequests(communityId!),
    enabled: !!communityId,
  });

  const acceptMutation = useMutation({
    mutationFn: (requestId: string) =>
      acceptCommunityJoinRequest(communityId!, requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'join-requests'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      declineCommunityJoinRequest(communityId!, requestId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communities', communityId, 'join-requests'] });
      setDecliningId(null);
    },
  });

  const requests = requestsQuery.data ?? [];
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const pastRequests = requests.filter((r) => r.status !== 'pending');

  if (communityQuery.isLoading || requestsQuery.isLoading) {
    return <div className="p-6 text-gray-500 text-sm">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-lg font-display font-bold text-gray-900">Join Requests</h2>
        <p className="text-sm text-gray-500 mt-1">
          Review requests from organizations wanting to join the community.
        </p>
      </div>

      {/* Pending requests */}
      {pendingRequests.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">
            Pending ({pendingRequests.length})
          </h3>
          {pendingRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">
                    {req.organization.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Requested by {req.user.name} &middot;{' '}
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Pending
                </span>
              </div>

              {req.message && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-line">
                  {req.message}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => acceptMutation.mutate(req.id)}
                  disabled={acceptMutation.isPending}
                  className="bg-green-600 text-white rounded-lg px-4 py-1.5 text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {acceptMutation.isPending ? 'Accepting...' : 'Accept'}
                </button>
                <button
                  onClick={() => setDecliningId(req.id)}
                  className="border border-gray-300 rounded-lg px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No pending requests.</p>
      )}

      {/* Past requests */}
      {pastRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">History</h3>
          {pastRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-gray-900">
                    {req.organization.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {req.user.name} &middot;{' '}
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    req.status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : req.status === 'declined'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </span>
              </div>
              {req.decline_reason && (
                <p className="text-xs text-red-600 mt-2">
                  Reason: {req.decline_reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decline modal */}
      {decliningId && (
        <DeclineModal
          onConfirm={(reason) =>
            declineMutation.mutate({ requestId: decliningId, reason })
          }
          onCancel={() => setDecliningId(null)}
          isPending={declineMutation.isPending}
        />
      )}
    </div>
  );
}
