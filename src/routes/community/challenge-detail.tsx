import { useState } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import {
  getChallengeDetail,
  deleteChallenge,
  updateChallenge,
  createApplication,
  getChallengeApplications,
  acceptApplication,
  rejectApplication,
  selectWinner,
} from '../../lib/community-challenges';
import type { Challenge, ChallengeApplication } from '../../lib/community-challenges';
import { FieldError, FormError } from '../../components/FieldError';

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function stateBadge(state: string) {
  switch (state) {
    case 'draft':
      return <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-600">Draft</span>;
    case 'active':
      return <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700">Active</span>;
    case 'completed':
      return <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-700">Completed</span>;
    case 'cancelled':
      return <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-600">Cancelled</span>;
    default:
      return null;
  }
}

function applicationStatusBadge(status: string) {
  switch (status) {
    case 'pending':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-yellow-100 text-yellow-700">Pending</span>;
    case 'accepted':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Accepted</span>;
    case 'rejected':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Rejected</span>;
    case 'winner':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">Winner</span>;
    default:
      return null;
  }
}

function ApplicationCard({
  application,
  canManage,
  communitySlug,
  challengeId,
}: {
  application: ChallengeApplication;
  canManage: boolean;
  communitySlug: string;
  challengeId: string;
}) {
  const queryClient = useQueryClient();

  const acceptMut = useMutation({
    mutationFn: () => acceptApplication(communitySlug, challengeId, application.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge_applications', communitySlug, challengeId] });
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challengeId] });
    },
  });

  const rejectMut = useMutation({
    mutationFn: () => rejectApplication(communitySlug, challengeId, application.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge_applications', communitySlug, challengeId] });
    },
  });

  const winnerMut = useMutation({
    mutationFn: () => selectWinner(communitySlug, challengeId, application.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge_applications', communitySlug, challengeId] });
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challengeId] });
    },
  });

  const isPending = acceptMut.isPending || rejectMut.isPending || winnerMut.isPending;

  return (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">
              {application.organization?.name || 'Unknown organization'}
            </span>
            {applicationStatusBadge(application.status)}
          </div>
          {application.note && (
            <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{application.note}</p>
          )}
          {application.attachment_url && (
            <a
              href={application.attachment_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              View attachment
            </a>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Submitted {new Date(application.submitted_at).toLocaleDateString('en-GB')}
          </p>
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => acceptMut.mutate()}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 disabled:opacity-50"
              >
                Accept
              </button>
              <button
                onClick={() => rejectMut.mutate()}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
              >
                Reject
              </button>
            </>
          )}
          {application.status === 'accepted' && (
            <button
              onClick={() => winnerMut.mutate()}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
            >
              Select as winner
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ApplyForm({
  challenge,
  communitySlug,
}: {
  challenge: Challenge;
  communitySlug: string;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createApplication(communitySlug, challenge.id, {
        note: note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challenge.id] });
      queryClient.invalidateQueries({ queryKey: ['challenge_applications', communitySlug, challenge.id] });
      setNote('');
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate();
  }

  return (
    <div className="bg-white border border-border rounded-lg p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Apply to this challenge</h3>
      <FormError mutation={mutation} />
      <form onSubmit={handleSubmit} className="space-y-3 mt-2">
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
            Your application note {!challenge.requires_attachment && <span className="text-red-500">*</span>}
          </label>
          <textarea
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Explain why your organization is a good fit..."
          />
          <FieldError mutation={mutation} field="note" />
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? 'Submitting...' : 'Submit application'}
        </button>
      </form>
    </div>
  );
}

export function ChallengeDetailPage() {
  const { orgSlug, communitySlug, challengeId } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
    challengeId: string;
  };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = me.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  const challengeQuery = useQuery({
    queryKey: ['community_challenges', communitySlug, challengeId],
    queryFn: () => getChallengeDetail(communitySlug, challengeId),
  });

  const challenge = challengeQuery.data;

  // Check if current user owns this challenge (via their organizations)
  const isOwner = !!(challenge?.organization_id && me.data?.organizations.some(
    (o) => o.organization_id === challenge.organization_id,
  ));

  const canManage = isAdmin || isOwner;

  // Fetch applications only if user can manage
  const applicationsQuery = useQuery({
    queryKey: ['challenge_applications', communitySlug, challengeId],
    queryFn: () => getChallengeApplications(communitySlug, challengeId, { per_page: 50 }),
    enabled: canManage,
  });

  const applications = applicationsQuery.data?.data ?? [];

  // Check if user already applied
  const myApplication = challenge?.my_application;
  const hasApplied = !!myApplication;

  // Check if user can apply: member of community, not owner, challenge is active
  const myOrgInCommunity = me.data?.organizations.find(
    (o) => o.communities.some((c) => c.community_slug === communitySlug),
  );
  const canApply = challenge?.state === 'active' && !isOwner && !hasApplied && !!myOrgInCommunity;

  // Activate challenge
  const activateMut = useMutation({
    mutationFn: () => updateChallenge(communitySlug, challengeId, { state: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug, challengeId] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteChallenge(communitySlug, challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community_challenges', communitySlug] });
      navigate({
        to: '/$orgSlug/communities/$communitySlug/challenges',
        params: { orgSlug, communitySlug },
      });
    },
  });

  function handleDelete() {
    if (window.confirm('Are you sure you want to delete this challenge? This cannot be undone.')) {
      deleteMut.mutate();
    }
  }

  if (challengeQuery.isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-20" />
          <div className="h-48 bg-gray-200 rounded-xl" />
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (challengeQuery.error || !challenge) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-600">Challenge not found</p>
        <Link
          to="/$orgSlug/communities/$communitySlug/challenges"
          params={{ orgSlug, communitySlug }}
          className="text-sm text-gray-500 hover:text-gray-700 mt-2 inline-block"
        >
          &larr; Back to challenges
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 pb-12">
      {/* Back link */}
      <Link
        to="/$orgSlug/communities/$communitySlug/challenges"
        params={{ orgSlug, communitySlug }}
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Challenges
      </Link>

      {/* Challenge image */}
      {challenge.image_url && (
        <div className="rounded-xl overflow-hidden mb-6">
          <img
            src={challenge.image_url}
            alt={challenge.title}
            className="w-full h-64 object-cover"
          />
        </div>
      )}

      {/* Title + state */}
      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-2xl font-display font-bold text-gray-900">{challenge.title}</h1>
        {stateBadge(challenge.state)}
      </div>

      {/* Dates */}
      {(challenge.start_on || challenge.end_on) && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
          </svg>
          {challenge.start_on && formatDate(challenge.start_on)}
          {challenge.start_on && challenge.end_on && ' — '}
          {challenge.end_on && formatDate(challenge.end_on)}
        </div>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
        {challenge.number_of_winners && (
          <span>{challenge.number_of_winners} winner{challenge.number_of_winners !== 1 ? 's' : ''} max</span>
        )}
        <span>{challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}</span>
        {challenge.requires_attachment && (
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">Attachment required</span>
        )}
      </div>

      {/* Owner org */}
      {challenge.organization && (
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <span>Posted by</span>
          <span className="font-medium text-gray-900">{challenge.organization.name}</span>
        </div>
      )}

      {/* Description */}
      <div className="mb-8">
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {challenge.description}
        </p>
      </div>

      {/* Draft activation banner */}
      {challenge.state === 'draft' && canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-3">
            This challenge is in draft mode and not visible to community members.
          </p>
          <button
            onClick={() => activateMut.mutate()}
            disabled={activateMut.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {activateMut.isPending ? 'Activating...' : 'Activate challenge'}
          </button>
        </div>
      )}

      {/* My application status */}
      {hasApplied && myApplication && (
        <div className="bg-white border border-border rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Your application</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            {applicationStatusBadge(myApplication.status)}
          </div>
          {myApplication.note && (
            <p className="text-sm text-gray-600 mt-2">{myApplication.note}</p>
          )}
        </div>
      )}

      {/* Apply form */}
      {canApply && (
        <div className="mb-6">
          <ApplyForm challenge={challenge} communitySlug={communitySlug} />
        </div>
      )}

      {/* Applications list (for owner/admin) */}
      {canManage && (
        <div className="bg-white border border-border rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Applications ({applications.length})
          </h3>
          {applicationsQuery.isLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg" />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <p className="text-sm text-gray-500">No applications yet.</p>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  canManage={canManage}
                  communitySlug={communitySlug}
                  challengeId={challengeId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Manage actions */}
      {canManage && (
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Manage challenge</h3>
          <div className="flex items-center gap-3">
            <Link
              to="/$orgSlug/communities/$communitySlug/challenges/$challengeId/edit"
              params={{ orgSlug, communitySlug, challengeId }}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Edit challenge
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleteMut.isPending ? 'Deleting...' : 'Delete challenge'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
