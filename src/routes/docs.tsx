import { useState } from 'react';

const S3_BASE = 'https://mantel-dev.s3.nl-ams.scw.cloud/docs';

type Section =
  | 'getting-started'
  | 'home'
  | 'directory'
  | 'map'
  | 'org-dashboard'
  | 'org-profile'
  | 'org-relations'
  | 'org-assessments'
  | 'org-settings'
  | 'community-overview'
  | 'community-members'
  | 'community-events'
  | 'community-challenges'
  | 'community-matchmaking'
  | 'notifications'
  | 'personal-messages'
  | 'org-messages';

interface NavGroup {
  title: string;
  items: { key: Section; label: string }[];
}

const NAV: NavGroup[] = [
  {
    title: 'Getting started',
    items: [{ key: 'getting-started', label: 'Welcome' }],
  },
  {
    title: 'Explore',
    items: [
      { key: 'home', label: 'Home' },
      { key: 'directory', label: 'Directory' },
      { key: 'map', label: 'Interactive Map' },
      { key: 'notifications', label: 'Notifications' },
      { key: 'personal-messages', label: 'Personal Messages' },
    ],
  },
  {
    title: 'Organization',
    items: [
      { key: 'org-dashboard', label: 'Dashboard' },
      { key: 'org-profile', label: 'Profile' },
      { key: 'org-relations', label: 'Relations' },
      { key: 'org-assessments', label: 'Impact Compass' },
      { key: 'org-settings', label: 'Settings & Members' },
      { key: 'org-messages', label: 'Messages' },
    ],
  },
  {
    title: 'Communities',
    items: [
      { key: 'community-overview', label: 'Overview' },
      { key: 'community-members', label: 'Members' },
      { key: 'community-events', label: 'Events' },
      { key: 'community-challenges', label: 'Challenges' },
      { key: 'community-matchmaking', label: 'Matchmaking' },
    ],
  },
];

// ─── Content ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900 mb-4">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-600 leading-relaxed mb-3">{children}</p>;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
      <p className="text-sm text-primary/90">{children}</p>
    </div>
  );
}

function Feature({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{title}</h3>
      <div className="text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="my-5 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      <img
        src={`${S3_BASE}/${src}`}
        alt={alt}
        className="w-full"
        loading="lazy"
      />
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
      Coming soon
    </div>
  );
}

function GettingStartedContent() {
  return (
    <div>
      <SectionTitle>Welcome to Fabrix</SectionTitle>
      <P>
        Fabrix is a platform for promoting and optimizing circular textile in
        Europe. It connects organizations, facilitators, and researchers to build
        a more sustainable textile ecosystem.
      </P>

      <Feature title="Who is Fabrix for?">
        <ul className="list-disc list-inside space-y-1.5 mt-1">
          <li>
            <strong>Organizations</strong> (SMEs) — designers, producers,
            collectors, recyclers. Find partners, access shared resources, and
            improve your circularity practices.
          </li>
          <li>
            <strong>Facilitators</strong> — city-level managers of the circular
            textile ecosystem. Track organizations, advise, matchmake, and manage
            shared spaces.
          </li>
          <li>
            <strong>Researchers</strong> — use aggregated data to produce
            insights for facilitators and policy makers.
          </li>
        </ul>
      </Feature>

      <Feature title="First steps">
        <ol className="list-decimal list-inside space-y-1.5 mt-1">
          <li>
            <strong>Create an account</strong> and register your organization, or
            claim an existing one from the directory.
          </li>
          <li>
            <strong>Complete your profile</strong> — add your address, type of
            activity, and description so others can find you.
          </li>
          <li>
            <strong>Explore the directory and map</strong> — discover other
            organizations in the circular textile space.
          </li>
          <li>
            <strong>Join a community</strong> — participate in events,
            challenges, and find partners through matchmaking.
          </li>
        </ol>
      </Feature>

      <Feature title="Two ways to navigate">
        <ul className="list-disc list-inside space-y-1.5 mt-1">
          <li>
            <strong>Explorer</strong> — browse the directory, map, and public
            profiles. Available from the sidebar on the left.
          </li>
          <li>
            <strong>Organization view</strong> — manage your own organization.
            Switch between your organizations using the dropdown in the top-left
            corner.
          </li>
        </ul>
      </Feature>
    </div>
  );
}

function HomeContent() {
  return (
    <div>
      <SectionTitle>Home</SectionTitle>
      <P>
        The home page adapts to whether you are signed in or not.
      </P>

      <Screenshot src="fabrix-home.png" alt="Fabrix home page" />

      <Feature title="Not signed in">
        You see a landing page inviting you to create an account or sign in.
        This is the entry point for new users discovering Fabrix.
      </Feature>

      <Feature title="Signed in">
        You see your communities, pending actions, and all the organizations
        linked to your account displayed as cards. Each card shows the
        organization name, type, number of relations, assessment progress, and
        communities joined. Click on any card to jump straight into that
        organization&apos;s dashboard.
      </Feature>

      <Feature title="Pending actions">
        The home page highlights any actions waiting for your attention — join
        requests to review, pending invitations, and more.
      </Feature>

      <Tip>
        If you don&apos;t have any organization yet, you&apos;ll see a prompt to
        add one — either by creating a new organization or claiming an existing
        one from the directory.
      </Tip>
    </div>
  );
}

function DirectoryContent() {
  return (
    <div>
      <SectionTitle>Directory</SectionTitle>
      <P>
        The directory is the central place to discover all organizations
        registered on Fabrix. It is accessible from the Explorer sidebar.
      </P>

      <Screenshot src="fabrix-directory.png" alt="Organization directory" />

      <Feature title="Search">
        Use the search bar at the top to find organizations by name. Results
        update as you type.
      </Feature>

      <Feature title="List and card views">
        Toggle between a compact list view and a visual card view using the
        icons next to the search bar. Both views show the organization name,
        type badge, address, and number of relations.
      </Feature>

      <Feature title="Pagination">
        Results are paginated (20 per page). Use the Previous / Next buttons at
        the bottom to browse through all organizations.
      </Feature>

      <Feature title="Organization profiles">
        Click on any organization to view its public profile. From there you can
        see their description, location, communities, related organizations, and
        contact information.
      </Feature>

      <Feature title="Add an organization">
        Click the &ldquo;New Organization&rdquo; button to start the creation
        wizard. You can either create a brand new organization or claim an
        existing unclaimed one.
      </Feature>
    </div>
  );
}

function MapContent() {
  return (
    <div>
      <SectionTitle>Interactive Map</SectionTitle>
      <P>
        The map gives you a geographic view of the entire Fabrix ecosystem. Every
        organization with a location is displayed as a colored marker.
      </P>

      <Feature title="Color-coded markers">
        Each organization type has a different color. Use the legend on the map
        to identify which color corresponds to which type (producers, recyclers,
        brands, etc.).
      </Feature>

      <Feature title="Filtering">
        Use the legend to toggle organization types on and off. This helps you
        focus on the types of organizations you are looking for.
      </Feature>

      <Feature title="Navigation">
        Zoom in and out, pan the map, and click on markers to see organization
        details.
      </Feature>
    </div>
  );
}

function NotificationsContent() {
  return (
    <div>
      <SectionTitle>Notifications</SectionTitle>
      <P>
        Stay informed about activity related to your organizations and
        communities.
      </P>

      <Screenshot src="fabrix-notifications.png" alt="Notifications page" />

      <Feature title="Notification bell">
        The bell icon in the top-right corner shows your unread count. Click it
        to preview the latest notifications without leaving your current page.
      </Feature>

      <Feature title="Full notifications page">
        Browse all your notifications in one place. Mark individual notifications
        as read, or use &ldquo;Mark all as read&rdquo; to clear everything.
      </Feature>

      <Feature title="Types of notifications">
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Join requests for your organization or community</li>
          <li>New community events and challenges</li>
          <li>Application status updates on challenges</li>
          <li>New members joining your community</li>
        </ul>
      </Feature>
    </div>
  );
}

function PersonalMessagesContent() {
  return (
    <div>
      <SectionTitle>Personal Messages</SectionTitle>
      <P>
        Personal messages let you have private, one-on-one conversations with
        other users on Fabrix — outside of any organization context.
      </P>

      <Feature title="Accessing your personal messages">
        Click the envelope icon in the top navigation bar. A dropdown appears
        with two tabs: <strong>Personal</strong> and <strong>Organization</strong>.
        The Personal tab shows your direct user-to-user conversations. Click
        &ldquo;See all personal messages&rdquo; to open the full messaging page,
        or click any conversation to jump directly into it.
      </Feature>

      <Feature title="Messages page">
        The personal messages page is accessible from the Explorer sidebar under
        &ldquo;Messages&rdquo;. It displays a conversation list on the left and
        the selected conversation on the right.
        <ul className="list-disc list-inside mt-1.5 space-y-1">
          <li>
            <strong>Conversation list</strong> — shows the name of the other
            person, a preview of the last message, and a timestamp. Unread
            conversations are highlighted with a dot.
          </li>
          <li>
            <strong>Conversation view</strong> — displays the full message
            history. Your messages appear on the right (purple), the other
            person&apos;s on the left (gray).
          </li>
        </ul>
      </Feature>

      <Feature title="Sending a message">
        Type your message in the input area at the bottom of the conversation
        and press <strong>Enter</strong> to send (or click the Send button).
        Use <strong>Shift + Enter</strong> to insert a new line without sending.
      </Feature>

      <Feature title="Unread badge">
        The envelope icon in the navigation bar shows a red badge with the total
        number of unread conversations (personal + organization). Inside the
        dropdown, each tab shows its own unread count so you can quickly see
        where new messages are.
      </Feature>

      <Tip>
        Personal messages are separate from organization messages. If you need
        to contact an organization (not a specific person), use the organization
        messaging feature instead.
      </Tip>
    </div>
  );
}

function OrgMessagesContent() {
  return (
    <div>
      <SectionTitle>Organization Messages</SectionTitle>
      <P>
        Organization messages allow users to contact an organization directly.
        All members of the organization can see and reply to these conversations
        on behalf of the organization.
      </P>

      <Feature title="How it works">
        When someone contacts your organization, a conversation is created
        between that user and your organization. Every member of the
        organization has access to the conversation and can reply. Replies are
        sent as the organization, not as the individual member.
      </Feature>

      <Feature title="Accessing organization messages">
        There are two ways to access your organization&apos;s messages:
        <ul className="list-disc list-inside mt-1.5 space-y-1">
          <li>
            Click the envelope icon in the navigation bar and select the
            <strong> Organization</strong> tab. Click a conversation or
            &ldquo;See all organization messages&rdquo;.
          </li>
          <li>
            From your organization sidebar, click <strong>Messages</strong>.
            This opens the full organization messaging page.
          </li>
        </ul>
      </Feature>

      <Feature title="Organization messages page">
        The layout is the same as personal messages: a conversation list on the
        left and the selected conversation on the right. The difference is that
        only conversations involving your organization are shown, and your
        replies are sent as the organization.
      </Feature>

      <Feature title="Contacting an organization">
        To start a conversation with an organization, visit their public profile
        in the directory and click the <strong>Message</strong> button. This
        opens a conversation in your personal messages inbox, addressed to
        that organization.
      </Feature>

      <Feature title="Notifications">
        When a new message is received in an organization conversation, all
        members of the organization are notified. Click the notification to
        jump directly to the conversation.
      </Feature>

      <Tip>
        Organization messages are ideal for business inquiries, partnership
        requests, or any communication that should be visible to the whole team
        — not just one person.
      </Tip>
    </div>
  );
}

function OrgDashboardContent() {
  return (
    <div>
      <SectionTitle>Dashboard</SectionTitle>
      <P>
        The dashboard is your organization&apos;s home page. It gives you a
        quick overview of your activity on Fabrix.
      </P>

      <Screenshot src="fabrix-dashboard.png" alt="Organization dashboard" />

      <Feature title="Overview cards">
        Three cards summarize your organization&apos;s engagement:
        <ul className="list-disc list-inside mt-1.5 space-y-1">
          <li>
            <strong>Relations</strong> — how many organizations you are connected
            to in your supply chain network.
          </li>
          <li>
            <strong>Assessments</strong> — how many sustainability assessments
            you have completed out of the total available.
          </li>
          <li>
            <strong>Communities</strong> — how many communities your organization
            is part of.
          </li>
        </ul>
      </Feature>

      <Feature title="Community shortcuts">
        Your communities are listed in the sidebar for quick access. Click any
        community to jump directly into it.
      </Feature>

      <Tip>
        Use the dropdown in the top-left corner to switch between your
        organizations at any time.
      </Tip>
    </div>
  );
}

function OrgProfileContent() {
  return (
    <div>
      <SectionTitle>Profile</SectionTitle>
      <P>
        Your organization&apos;s profile is what other users see when they
        discover you in the directory or on the map.
      </P>

      <Screenshot src="fabrix-profile.png" alt="Organization profile editing" />

      <Feature title="Multi-section management">
        The profile is organized into sections:
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li><strong>Informations</strong> — name, type, address, description, contact</li>
          <li><strong>Data</strong> — number of employees, annual turnover</li>
          <li><strong>Photos</strong> — image gallery with upload to cloud storage</li>
          <li><strong>Products</strong> — your product catalog</li>
          <li><strong>Services & Skills</strong> — what you offer</li>
        </ul>
      </Feature>

      <Feature title="Address verification">
        Your address is verified with Google Maps autocomplete. The selected
        location determines your position on the interactive map.
      </Feature>

      <Feature title="Public profile">
        Click &ldquo;View public profile&rdquo; to see how other users see your
        organization — with cover image, description, communities, and related
        organizations.
      </Feature>

      <Tip>
        A complete profile makes it easier for other organizations and
        facilitators to find and connect with you.
      </Tip>
    </div>
  );
}

function OrgRelationsContent() {
  return (
    <div>
      <SectionTitle>Relations</SectionTitle>
      <P>
        Relations represent your supply chain connections — the organizations you
        work with as partners, suppliers, or clients.
      </P>

      <Feature title="Interactive map">
        Your relations are displayed on a map centered on your organization&apos;s
        location. See where your partners are located at a glance.
      </Feature>

      <Feature title="Searchable list">
        Below the map, browse all your relations in a searchable, paginated list.
        See each partner&apos;s name, type, and location.
      </Feature>

      <Feature title="For facilitators">
        Track connections between organizations in your territory. Monitor how
        the local supply chain network is growing and identify gaps.
      </Feature>
    </div>
  );
}

function OrgAssessmentsContent() {
  return (
    <div>
      <SectionTitle>Impact Compass</SectionTitle>
      <P>
        The Impact Compass is Fabrix&apos;s assessment system. It helps you
        evaluate and improve your circularity, eco-design, and social
        responsibility practices.
      </P>

      <Screenshot src="fabrix-assessments.png" alt="Impact Compass assessments" />

      <Feature title="Assessment overview">
        See all available assessment forms at a glance, with a radar chart
        showing your overall scores across all dimensions. Completed assessments
        display score cards with your results.
      </Feature>

      <Feature title="Assessment wizard">
        Answer questions one at a time in a guided wizard. Your progress is
        saved automatically so you can pause and come back later. Some questions
        have conditional follow-ups based on your answers.
      </Feature>

      <Feature title="Results and history">
        After completing an assessment, view a detailed breakdown with score
        circles, section-by-section analysis, and recommendations. You can also
        see your history of past submissions to track your progress over time.
      </Feature>

      <Tip>
        Completing all assessments gives you a comprehensive view of your
        circularity practices and helps facilitators understand how to support you.
      </Tip>
    </div>
  );
}

function OrgSettingsContent() {
  return (
    <div>
      <SectionTitle>Settings & Members</SectionTitle>
      <P>
        Manage who has access to your organization on Fabrix.
      </P>

      <Screenshot src="fabrix-settings.png" alt="Organization settings and members" />

      <Feature title="Members">
        View all members of your organization with their name, email, and role.
        There are two roles:
        <ul className="list-disc list-inside mt-1.5 space-y-1">
          <li>
            <strong>Owner</strong> — full access. Can manage members, edit the
            profile, and change settings.
          </li>
          <li>
            <strong>Member</strong> — can view and participate, but cannot manage
            other members.
          </li>
        </ul>
      </Feature>

      <Feature title="Join requests">
        When someone requests to join your organization, you can review and
        accept or decline from this page.
      </Feature>

      <Feature title="Invite people">
        Owners can invite new members by email. Choose the role (Member or Owner)
        when sending the invitation. Pending invitations are displayed and can be
        cancelled before they are accepted.
      </Feature>

      <Feature title="Change roles">
        Owners can promote a member to owner, or change an owner to member. The
        platform will prevent you from removing the last owner.
      </Feature>
    </div>
  );
}

function CommunityOverviewContent() {
  return (
    <div>
      <SectionTitle>Community Overview</SectionTitle>
      <P>
        A community is a group of organizations, managed by facilitators, who
        share a common goal — usually around a geographic area or a thematic
        focus in circular textile.
      </P>

      <Screenshot src="fabrix-communities.png" alt="Communities explorer" />

      <Feature title="What communities offer">
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>A shared space to discover and connect with other members</li>
          <li>An interactive map of all community members</li>
          <li>Events organized by facilitators (workshops, meetups, webinars)</li>
          <li>Challenges to find partners and drive innovation</li>
          <li>Discussion spaces for community conversations</li>
          <li>Matchmaking to connect with the right organizations</li>
        </ul>
      </Feature>

      <Feature title="Community overview page">
        When you enter a community, you see an overview with a map of all
        members, recent events, active challenges, and the latest discussions —
        everything at a glance.
      </Feature>

      <Feature title="Accessing a community">
        Communities are always accessed through your organization. Use the
        &ldquo;Communities&rdquo; section in your organization sidebar to see
        which communities you belong to, then click to enter.
      </Feature>

      <Feature title="Browse and join">
        Explore public communities from the Communities page in the Explorer.
        Request to join a community — admins will review your request.
      </Feature>
    </div>
  );
}

function CommunityMembersContent() {
  return (
    <div>
      <SectionTitle>Community Members</SectionTitle>
      <P>
        Browse all organizations that are part of this community.
      </P>

      <Screenshot src="fabrix-community-members.png" alt="Community members directory" />

      <Feature title="Member directory">
        Search and browse all community members. Toggle between list and card
        views, and use pagination to navigate through large communities.
      </Feature>

      <Feature title="Member detail">
        Click on any member to view their full profile within the community
        context — cover image, description, communities, and related
        organizations.
      </Feature>

      <Feature title="For facilitators">
        Community admins see a sticky sidebar on member detail pages with
        editable notes, member info, and management actions. Add organizations
        to the community via a search modal, or remove members from their
        detail page.
      </Feature>
    </div>
  );
}

function CommunityEventsContent() {
  return (
    <div>
      <SectionTitle>Events</SectionTitle>
      <P>
        Community events bring members together — workshops, meetups, webinars,
        and more.
      </P>

      <Screenshot src="fabrix-community-events.png" alt="Community events" />

      <Feature title="Event list">
        Browse upcoming and past events. Each event card shows the title, date,
        time, and location (or &ldquo;Online&rdquo; for virtual events).
      </Feature>

      <Feature title="RSVP">
        Respond to events with Going, Maybe, or Not Going. See the list of
        participants who have RSVP&apos;d.
      </Feature>

      <Feature title="Event management">
        Community admins can create, edit, and delete events. Set the title,
        description, date, location, and optionally upload an image.
      </Feature>
    </div>
  );
}

function CommunityChallengesContent() {
  return (
    <div>
      <SectionTitle>Challenges</SectionTitle>
      <P>
        Challenges are calls for participation where any community member can
        post a challenge, review applications, and select winners.
      </P>

      <Screenshot src="fabrix-community-challenges.png" alt="Community challenges" />

      <Feature title="Browse challenges">
        See all active and completed challenges in your community. Each
        challenge card shows the title, status, end date, and number of
        applications received.
      </Feature>

      <Feature title="Create a challenge">
        Any community member can create a challenge. Set the title, description,
        number of winners, dates, and optionally upload an image. Challenges
        start as a draft and can be activated when ready.
      </Feature>

      <Feature title="Apply to challenges">
        Browse active challenges and submit your application with a note
        explaining why your organization is a good fit. Optionally attach a
        file if the challenge requires it.
      </Feature>

      <Feature title="Review applications">
        Challenge owners and community admins can review applications — accept,
        reject, or select winners. When all winner spots are filled, the
        challenge is automatically completed.
      </Feature>

      <Tip>
        Challenges are a great way to find partners for specific needs. Whether
        you&apos;re looking for a recycling partner, a design collaborator, or a
        supply chain connection — post a challenge and let the community respond.
      </Tip>
    </div>
  );
}

function CommunityMatchmakingContent() {
  return (
    <div>
      <SectionTitle>Matchmaking</SectionTitle>
      <P>
        Matchmaking helps you find the right partners based on your profile,
        capabilities, and needs.
      </P>

      <Feature title="For organizations">
        Get matched with organizations that complement your activity. Whether you
        are looking for a supplier, a recycler, or a design partner — Fabrix
        helps you find the right fit.
      </Feature>

      <Feature title="For facilitators">
        Facilitate connections between organizations in your community. Help them
        find matches they might not have discovered on their own.
      </Feature>

      <ComingSoon />
    </div>
  );
}

const CONTENT: Record<Section, () => React.ReactNode> = {
  'getting-started': GettingStartedContent,
  home: HomeContent,
  directory: DirectoryContent,
  map: MapContent,
  notifications: NotificationsContent,
  'personal-messages': PersonalMessagesContent,
  'org-messages': OrgMessagesContent,
  'org-dashboard': OrgDashboardContent,
  'org-profile': OrgProfileContent,
  'org-relations': OrgRelationsContent,
  'org-assessments': OrgAssessmentsContent,
  'org-settings': OrgSettingsContent,
  'community-overview': CommunityOverviewContent,
  'community-members': CommunityMembersContent,
  'community-events': CommunityEventsContent,
  'community-challenges': CommunityChallengesContent,
  'community-matchmaking': CommunityMatchmakingContent,
};

// ─── Page ─────────────────────────────────────────────────────────────────

export function DocsPage() {
  const [active, setActive] = useState<Section>('getting-started');
  const Content = CONTENT[active];

  return (
    <div className="flex min-h-[calc(100vh-56px)]">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-white flex-shrink-0 overflow-y-auto">
        <nav className="p-3 space-y-4">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <button
                      onClick={() => setActive(item.key)}
                      className={`w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                        active === item.key
                          ? 'bg-gray-100 text-gray-900 font-medium'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <Content />
        </div>
      </div>
    </div>
  );
}
