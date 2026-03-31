type Tag = 'new' | 'improved' | 'fixed';

const TAG_STYLES: Record<Tag, string> = {
  new: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  improved: 'bg-blue-50 text-blue-700 border-blue-200',
  fixed: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TAG_LABELS: Record<Tag, string> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
};

interface ChangeItem {
  tag: Tag;
  text: string;
}

interface Release {
  date: string;
  title: string;
  items: ChangeItem[];
}

const RELEASES: Release[] = [
  {
    date: 'March 30, 2026',
    title: 'Relations & bug fixes',
    items: [
      {
        tag: 'new',
        text: 'Relations page — view your organization\'s relations on an interactive map centered on your location, with a searchable and paginated list below.',
      },
      {
        tag: 'fixed',
        text: 'Server error messages (e.g. "Invalid email or password") now display correctly instead of generic fallback messages.',
      },
    ],
  },
  {
    date: 'March 26, 2026',
    title: 'Impact Compass assessments',
    items: [
      {
        tag: 'new',
        text: 'Assessment list — see all available assessment forms with radar chart overview and score cards for completed assessments.',
      },
      {
        tag: 'new',
        text: 'Assessment wizard — answer questions one at a time with auto-save, progress indicator, and conditional follow-up questions.',
      },
      {
        tag: 'new',
        text: 'Assessment results — detailed breakdown with score circle, section-by-section analysis, recommendations, and history of past submissions.',
      },
    ],
  },
  {
    date: 'March 25, 2026',
    title: 'Community members',
    items: [
      {
        tag: 'new',
        text: 'Community members directory — browse members with search, list/card view toggle, and pagination.',
      },
      {
        tag: 'new',
        text: 'Member detail page — view a member\'s full profile within the community context, with cover image, description, communities, and related organizations.',
      },
      {
        tag: 'new',
        text: 'Facilitator sidebar — community admins see a sticky sidebar on member detail pages with editable notes, member info, and management actions.',
      },
      {
        tag: 'new',
        text: 'Admin member management — add organizations to the community via search modal, remove members from the detail page.',
      },
      {
        tag: 'improved',
        text: 'Notifications page now uses infinite scroll — pages load automatically as you scroll down.',
      },
    ],
  },
  {
    date: 'March 25, 2026',
    title: 'Notifications',
    items: [
      {
        tag: 'new',
        text: 'Notification bell — see unread count, preview latest notifications in a dropdown, and click to navigate to the relevant page.',
      },
      {
        tag: 'new',
        text: 'Full notifications page — browse all your notifications with mark as read and mark all as read.',
      },
    ],
  },
  {
    date: 'March 25, 2026',
    title: 'Join requests, claims & community browsing',
    items: [
      {
        tag: 'new',
        text: 'Organization join requests — request to join an organization from its profile, owners can accept or decline from settings.',
      },
      {
        tag: 'new',
        text: 'Community join requests — request to join a community, admins can accept or decline from a dedicated management page.',
      },
      {
        tag: 'new',
        text: 'Pending actions on homepage — see all actionable items (join requests to review) in one place.',
      },
      {
        tag: 'new',
        text: 'Claim an organization — unclaimed organizations show a claim button on their public profile.',
      },
      {
        tag: 'new',
        text: 'Browse communities — explore public community pages with description and member count.',
      },
      {
        tag: 'improved',
        text: 'Registration wizard now shows claimed/unclaimed status when searching for organizations.',
      },
    ],
  },
  {
    date: 'March 19, 2026',
    title: 'Admin section & feedback system',
    items: [
      {
        tag: 'new',
        text: 'Admin panel — manage organizations, users, communities, and feedbacks from a dedicated sidebar layout.',
      },
      {
        tag: 'new',
        text: 'Search across all admin lists — filter users by name/email, organizations by name, communities by name, feedbacks by message.',
      },
      {
        tag: 'new',
        text: 'Feedback system — users can submit bug reports, feature requests, and questions. Admins can review all feedbacks.',
      },
    ],
  },
  {
    date: 'March 19, 2026',
    title: 'Organization creation wizard & documentation',
    items: [
      {
        tag: 'new',
        text: 'New organization creation wizard for logged-in users — search, choose ownership (owner or reference), fill details with address autocomplete.',
      },
      {
        tag: 'new',
        text: 'Shared wizard components between registration and organization creation flows for a consistent experience.',
      },
      {
        tag: 'new',
        text: 'Documentation, changelog, and feedback pages accessible from the top navigation.',
      },
      {
        tag: 'improved',
        text: 'Form error messages are now human-readable instead of showing technical error codes.',
      },
    ],
  },
  {
    date: 'March 18, 2026',
    title: 'Navigation improvements',
    items: [
      {
        tag: 'improved',
        text: 'Organization switcher now works as a breadcrumb and adapts to your current context.',
      },
      {
        tag: 'improved',
        text: 'Consistent sidebar menu across all organization pages.',
      },
    ],
  },
  {
    date: 'March 17, 2026',
    title: 'Settings & members management',
    items: [
      {
        tag: 'new',
        text: 'Organization settings page — view members, change roles (owner/member), and remove members.',
      },
      {
        tag: 'new',
        text: 'Invite people to your organization by email with role selection.',
      },
      {
        tag: 'new',
        text: 'Settings sub-navigation with Informations and Members sections.',
      },
      {
        tag: 'new',
        text: 'Register via invitation link — accept an email invitation to join an organization.',
      },
      {
        tag: 'fixed',
        text: 'Authentication now persists correctly on page reload.',
      },
    ],
  },
  {
    date: 'March 16, 2026',
    title: 'Registration & login improvements',
    items: [
      {
        tag: 'new',
        text: 'Registration hub — choose between 3 profile types: organization, facilitator, or basic account.',
      },
      {
        tag: 'new',
        text: 'Show/hide password toggle on the login page.',
      },
      {
        tag: 'improved',
        text: 'Google address autocomplete is now simpler and more reliable.',
      },
      {
        tag: 'improved',
        text: 'Register-with-org flow polished with better UX for claiming existing organizations.',
      },
    ],
  },
  {
    date: 'March 13, 2026',
    title: 'Auth pages & feature previews',
    items: [
      {
        tag: 'new',
        text: 'Forgot password and reset password pages.',
      },
      {
        tag: 'new',
        text: 'Feature introduction cards across the platform — Relations, Impact Compass, Events, Challenges, Matchmaking.',
      },
      {
        tag: 'improved',
        text: 'UI polish across authentication pages.',
      },
    ],
  },
  {
    date: 'March 11, 2026',
    title: 'Register with organization',
    items: [
      {
        tag: 'new',
        text: 'Full registration flow with organization creation — 3-step wizard: search, organization details, account creation.',
      },
      {
        tag: 'new',
        text: 'Google Maps address autocomplete with location verification.',
      },
      {
        tag: 'new',
        text: 'Claim existing unclaimed organizations during registration.',
      },
    ],
  },
  {
    date: 'March 10, 2026',
    title: 'Navigation architecture',
    items: [
      {
        tag: 'new',
        text: 'JWT refresh token flow — sessions stay active without re-login.',
      },
      {
        tag: 'new',
        text: 'Contextual header — adapts between explorer mode and organization mode.',
      },
    ],
  },
  {
    date: 'March 9, 2026',
    title: 'Organization experience',
    items: [
      {
        tag: 'new',
        text: '3-shell navigation — Explorer (browse), Organization (manage), Community (participate).',
      },
      {
        tag: 'new',
        text: 'Organization onboarding flow — search existing orgs, claim, or create new.',
      },
      {
        tag: 'new',
        text: 'Rich organization profile page with cover image, description, communities, and related organizations.',
      },
      {
        tag: 'new',
        text: 'Dedicated interactive map page with organization markers.',
      },
      {
        tag: 'new',
        text: 'Organization switcher dropdown to navigate between your organizations.',
      },
    ],
  },
  {
    date: 'March 8, 2026',
    title: 'Map integration',
    items: [
      {
        tag: 'new',
        text: 'Interactive map with MapLibre GL — color-coded markers by organization type.',
      },
      {
        tag: 'new',
        text: 'Map legend with toggle filters to show/hide organization types.',
      },
    ],
  },
  {
    date: 'March 6, 2026',
    title: 'Platform launch',
    items: [
      {
        tag: 'new',
        text: 'Initial release of platform-thin — the new Fabrix frontend.',
      },
      {
        tag: 'new',
        text: 'Organization directory with search and pagination.',
      },
      {
        tag: 'new',
        text: 'Organization dashboard with stats overview.',
      },
      {
        tag: 'new',
        text: 'Fabrix branding — Archia and IBM Plex Sans fonts, purple theme.',
      },
      {
        tag: 'new',
        text: 'Deployed on GitHub Pages at app.fabrixproject.eu.',
      },
    ],
  },
];

// ─── Components ───────────────────────────────────────────────────────────

function TagBadge({ tag }: { tag: Tag }) {
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${TAG_STYLES[tag]}`}
    >
      {TAG_LABELS[tag]}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export function ChangelogPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Changelog</h1>
        <p className="text-sm text-gray-500 mt-1">
          New features, improvements, and fixes shipped to Fabrix.
        </p>
      </div>

      <div className="space-y-10">
        {RELEASES.map((release) => (
          <article key={release.date} className="relative">
            {/* Date + title */}
            <div className="mb-3">
              <time className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                {release.date}
              </time>
              <h2 className="text-base font-semibold text-gray-900 mt-0.5">
                {release.title}
              </h2>
            </div>

            {/* Items */}
            <ul className="space-y-2.5">
              {release.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    <TagBadge tag={item.tag} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
