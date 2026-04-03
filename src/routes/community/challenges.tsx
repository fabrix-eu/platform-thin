import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../../lib/auth';
import { getCommunityChallenge } from '../../lib/community-challenges';
import type { Challenge } from '../../lib/community-challenges';

type Tab = 'active' | 'completed' | 'draft';

function stateBadge(state: string) {
  switch (state) {
    case 'draft':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">Draft</span>;
    case 'active':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-green-100 text-green-700">Active</span>;
    case 'completed':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">Completed</span>;
    case 'cancelled':
      return <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium bg-red-100 text-red-600">Cancelled</span>;
    default:
      return null;
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ChallengeCard({
  challenge,
  orgSlug,
  communitySlug,
}: {
  challenge: Challenge;
  orgSlug: string;
  communitySlug: string;
}) {
  return (
    <Link
      to="/$orgSlug/communities/$communitySlug/challenges/$challengeId"
      params={{ orgSlug, communitySlug, challengeId: challenge.id }}
      className="flex items-start gap-4 bg-white border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      {challenge.image_url ? (
        <img
          src={challenge.image_url}
          alt={challenge.title}
          className="w-16 h-16 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{challenge.title}</h3>
          {stateBadge(challenge.state)}
        </div>
        {(challenge.start_on || challenge.end_on) && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
            {challenge.start_on && formatDate(challenge.start_on)}
            {challenge.start_on && challenge.end_on && ' — '}
            {challenge.end_on && formatDate(challenge.end_on)}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">
          {challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}
          {challenge.winners_count > 0 && ` · ${challenge.winners_count} winner${challenge.winners_count !== 1 ? 's' : ''}`}
        </p>
      </div>
    </Link>
  );
}

export function CommunityChallengesListPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };

  const [tab, setTab] = useState<Tab>('active');

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const isAdmin = me.data?.accessible_communities?.some(
    (c) => c.slug === communitySlug && c.is_admin,
  ) ?? false;

  // Any community member can create challenges
  const isMember = me.data?.organizations.some(
    (o) => o.communities.some((c) => c.community_slug === communitySlug),
  ) ?? false;
  const canCreate = isAdmin || isMember;

  const challengesQuery = useQuery({
    queryKey: ['community_challenges', communitySlug],
    queryFn: () => getCommunityChallenge(communitySlug, { per_page: 50 }),
  });

  const allChallenges = challengesQuery.data?.data ?? [];

  const active = allChallenges.filter((c) => c.state === 'active');
  const completed = allChallenges.filter((c) => c.state === 'completed' || c.state === 'cancelled');
  const draft = allChallenges.filter((c) => c.state === 'draft');

  // Only show draft tab for users who might have drafts (admins/members)
  const showDraftTab = canCreate && draft.length > 0;

  const displayed = tab === 'active' ? active : tab === 'completed' ? completed : draft;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-display font-bold text-gray-900">Challenges</h2>
        {canCreate && (
          <Link
            to="/$orgSlug/communities/$communitySlug/challenges/new"
            params={{ orgSlug, communitySlug }}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Create challenge
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        <button
          onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'active'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab('completed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed ({completed.length})
        </button>
        {showDraftTab && (
          <button
            onClick={() => setTab('draft')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'draft'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Draft ({draft.length})
          </button>
        )}
      </div>

      {/* Content */}
      {challengesQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-white border border-border rounded-lg p-4 flex gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="bg-white rounded-lg border border-border p-8 text-center space-y-3">
          <div className="flex justify-center text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 0 1-2.27.308 6.023 6.023 0 0 1-2.27-.308" />
            </svg>
          </div>
          <h3 className="font-display font-semibold text-gray-900">
            {tab === 'active' ? 'No active challenges' : tab === 'completed' ? 'No completed challenges' : 'No draft challenges'}
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            {tab === 'active'
              ? 'There are no active challenges in this community yet.'
              : tab === 'completed'
                ? 'There are no completed challenges in this community.'
                : 'You have no draft challenges.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              orgSlug={orgSlug}
              communitySlug={communitySlug}
            />
          ))}
        </div>
      )}
    </div>
  );
}
