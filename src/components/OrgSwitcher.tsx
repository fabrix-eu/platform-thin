import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, type MeOrganization } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';
import { getPendingActions } from '../lib/pending-actions';

function OrgAvatar({ org }: { org: MeOrganization }) {
  const initials = org.organization_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (org.organization_image_url) {
    return (
      <img
        src={org.organization_image_url}
        alt={org.organization_name}
        className="h-5 w-5 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-semibold">
      {initials}
    </div>
  );
}

/**
 * Compute the destination when switching org, based on current context:
 * - Shell A: go to /$newSlug/dashboard
 * - Shell B (/$orgSlug/profile): preserve section → /$newSlug/profile
 * - Shell C (/$orgSlug/communities/$c/...): don't preserve community → /$newSlug/communities
 */
function getOrgSwitchPath(
  currentSlug: string | undefined,
  newSlug: string,
  pathname: string
): string {
  if (!currentSlug) {
    return `/${newSlug}/dashboard`;
  }

  const communityMatch = pathname.match(
    new RegExp(`^/${currentSlug}/communities/[^/]+`)
  );
  if (communityMatch) {
    return `/${newSlug}/communities`;
  }

  return pathname.replace(`/${currentSlug}`, `/${newSlug}`);
}

const HomeIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

const ChevronDown = () => (
  <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
);

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const params = useParams({ strict: false });
  const router = useRouter();
  const orgSlug = (params as Record<string, string | undefined>).orgSlug;

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const organizations = me.data?.organizations ?? [];

  const ownedOrgs = organizations
    .filter((o) => o.role === 'owner')
    .map((o) => ({ id: o.organization_id, slug: o.organization_slug, name: o.organization_name }));

  const pendingActions = useQuery({
    queryKey: ['pending-actions', ownedOrgs.map((o) => o.id)],
    queryFn: () => getPendingActions(ownedOrgs),
    enabled: !!me.data,
    staleTime: 60_000,
  });

  const hasPendingActions = (pendingActions.data?.total ?? 0) > 0;

  const currentOrg = orgSlug
    ? organizations.find((o) => o.organization_slug === orgSlug)
    : null;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (organizations.length === 0) return null;

  const handleOrgClick = (org: MeOrganization) => {
    setOpen(false);
    const pathname = router.state.location.pathname;
    const dest = getOrgSwitchPath(orgSlug, org.organization_slug, pathname);
    router.navigate({ to: dest });
  };

  return (
    <nav className="flex items-center gap-0 text-sm min-w-0">
      {/* Home link */}
      <Link
        to="/"
        className="relative flex items-center text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-md hover:bg-gray-100"
        title="Explorer"
      >
        <HomeIcon />
        {hasPendingActions && (
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-white" />
        )}
      </Link>

      {/* Separator */}
      <span className="text-gray-300 mx-1.5 select-none">/</span>

      {/* Org switcher dropdown */}
      <div ref={dropdownRef} className="relative min-w-0">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-gray-100 transition-colors min-w-0"
        >
          {currentOrg ? (
            <>
              <OrgAvatar org={currentOrg} />
              <span className="max-w-[120px] truncate font-medium text-gray-700">
                {currentOrg.organization_name}
              </span>
            </>
          ) : (
            <span className="text-gray-400 italic truncate">
              Select an organization
            </span>
          )}
          <ChevronDown />
        </button>

        {open && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-lg shadow-lg z-50 py-1">
            <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
              Organizations
            </div>
            <div className="max-h-64 overflow-y-auto">
              {organizations.map((org) => {
                const kind = org.organization_kind ? ORG_KINDS[org.organization_kind] : null;
                return (
                  <button
                    key={org.organization_id}
                    type="button"
                    onClick={() => handleOrgClick(org)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-gray-50 transition-colors text-left ${
                      org.organization_slug === orgSlug ? 'bg-gray-50 font-medium' : 'text-gray-700'
                    }`}
                  >
                    <OrgAvatar org={org} />
                    <div className="flex-1 min-w-0">
                      <div className="truncate">{org.organization_name}</div>
                      {kind && (
                        <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${kind.badgeColor}`}>
                          {kind.label}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="border-t border-border mt-1 pt-1">
              <Link
                to="/organizations/new"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Organization
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
