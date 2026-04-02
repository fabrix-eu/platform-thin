import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getCommunityOrganizations } from '../../lib/community-organizations';
import { getCommunityEvents } from '../../lib/community-events';
import { getCommunityChallenge } from '../../lib/community-challenges';
import { getRecentPosts } from '../../lib/community-spaces';
import { ORG_KINDS } from '../../lib/organizations';
import { OrganizationsMap } from '../../components/OrganizationsMap';
import { MapLegend } from '../../components/MapLegend';

const ALL_KINDS = Object.keys(ORG_KINDS);

export function CommunityOverviewPage() {
  const { orgSlug, communitySlug } = useParams({ strict: false }) as {
    orgSlug: string;
    communitySlug: string;
  };

  const [selectedKinds, setSelectedKinds] = useState<string[]>(ALL_KINDS);

  // Fetch all community members for the map
  const membersQuery = useQuery({
    queryKey: ['community_organizations', communitySlug, { page: 1, per_page: 200 }],
    queryFn: () => getCommunityOrganizations(communitySlug, { page: 1, per_page: 200 }),
  });

  // Fetch latest events (3)
  const eventsQuery = useQuery({
    queryKey: ['community_events', communitySlug, { per_page: 3 }],
    queryFn: () => getCommunityEvents(communitySlug, { per_page: 3 }),
  });

  // Fetch latest challenges (3)
  const challengesQuery = useQuery({
    queryKey: ['community_challenges', communitySlug, { per_page: 3 }],
    queryFn: () => getCommunityChallenge(communitySlug, { per_page: 3 }),
  });

  // Fetch recent posts across all spaces (5)
  const postsQuery = useQuery({
    queryKey: ['community_recent_posts', communitySlug],
    queryFn: () => getRecentPosts(communitySlug),
  });

  const communityOrgs = membersQuery.data?.data ?? [];
  const organizations = communityOrgs.map((co) => co.organization);

  // Build lookup: org.id → membership.id (for member detail links)
  const membershipByOrgId = new Map(
    communityOrgs.map((co) => [co.organization.id, co.id]),
  );

  const basePath = `/${orgSlug}/communities/${communitySlug}`;

  const linkBuilder = (org: { id: string; slug: string }) => {
    const membershipId = membershipByOrgId.get(org.id);
    return membershipId
      ? `${basePath}/members/${membershipId}`
      : `/organizations/${org.slug || org.id}`;
  };

  const events = eventsQuery.data?.data ?? [];
  const challenges = challengesQuery.data?.data ?? [];
  const posts = postsQuery.data ?? [];

  return (
    <div className="flex gap-6 p-6 min-h-0">
      {/* Left: Map */}
      <div className="flex-1 min-w-0">
        <div className="relative rounded-lg overflow-hidden border border-gray-200">
          <OrganizationsMap
            organizations={organizations}
            height="calc(100vh - 200px)"
            selectedKinds={selectedKinds}
            linkBuilder={linkBuilder}
          />
          <MapLegend
            selectedKinds={selectedKinds}
            onKindsChange={setSelectedKinds}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {organizations.length} member{organizations.length !== 1 ? 's' : ''} in this community
        </p>
      </div>

      {/* Right: Sidebar */}
      <div className="w-80 flex-shrink-0 space-y-6">
        {/* Events */}
        <SidebarSection
          title="Events"
          linkTo={`${basePath}/events`}
          empty={events.length === 0}
          emptyText="No events yet"
        >
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </SidebarSection>

        {/* Challenges */}
        <SidebarSection
          title="Challenges"
          linkTo={`${basePath}/challenges`}
          empty={challenges.length === 0}
          emptyText="No challenges yet"
        >
          {challenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </SidebarSection>

        {/* Discussions */}
        <SidebarSection
          title="Discussions"
          empty={posts.length === 0}
          emptyText="No discussions yet"
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </SidebarSection>
      </div>
    </div>
  );
}

// --- Sidebar section wrapper ---

function SidebarSection({
  title,
  linkTo,
  empty,
  emptyText,
  children,
}: {
  title: string;
  linkTo?: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {linkTo && (
          <Link to={linkTo} className="text-xs text-primary hover:underline">
            View all
          </Link>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {empty ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">{emptyText}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// --- Event card ---

function EventCard({ event }: { event: { title: string; happens_at: string; address: string; online: boolean } }) {
  const date = new Date(event.happens_at);
  const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const formattedTime = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-md bg-primary/10 text-primary flex flex-col items-center justify-center text-[10px] font-semibold leading-tight">
          <span>{date.toLocaleDateString('en-GB', { day: 'numeric' })}</span>
          <span className="uppercase">{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
          <p className="text-xs text-gray-500">
            {formattedDate} at {formattedTime}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {event.online ? 'Online' : event.address}
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Challenge card ---

function ChallengeCard({ challenge }: { challenge: { title: string; state: string; end_on: string; applications_count: number } }) {
  const stateColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    draft: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 truncate">{challenge.title}</p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${stateColors[challenge.state] ?? 'bg-gray-100 text-gray-600'}`}>
          {challenge.state}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
        <span>Ends {new Date(challenge.end_on).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <span>{challenge.applications_count} application{challenge.applications_count !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// --- Post card ---

function PostCard({ post }: { post: { title: string; author: { name: string }; space: { name: string }; created_at: string; likes_count: number; comments_count: number } }) {
  const timeAgo = getTimeAgo(post.created_at);

  return (
    <div className="px-4 py-3">
      <p className="text-sm font-medium text-gray-900 truncate">{post.title}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <span className="text-xs text-gray-400">{post.author.name}</span>
        <span className="text-xs text-gray-300">in</span>
        <span className="text-xs font-medium text-gray-500">{post.space.name}</span>
      </div>
      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
        <span>{timeAgo}</span>
        {post.likes_count > 0 && <span>{post.likes_count} like{post.likes_count !== 1 ? 's' : ''}</span>}
        {post.comments_count > 0 && <span>{post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}</span>}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
