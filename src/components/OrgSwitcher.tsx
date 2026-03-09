import { useState, useRef, useEffect } from 'react';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe, type MeOrganization } from '../lib/auth';
import { ORG_KINDS } from '../lib/organizations';

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
        className="h-6 w-6 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
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
    // In Shell A (no org context) → go to dashboard
    return `/${newSlug}/dashboard`;
  }

  // Check if in Shell C (community context)
  const communityMatch = pathname.match(
    new RegExp(`^/${currentSlug}/communities/[^/]+`)
  );
  if (communityMatch) {
    // Don't preserve community (other org may not be in it)
    return `/${newSlug}/communities`;
  }

  // Shell B: preserve the current section
  return pathname.replace(`/${currentSlug}`, `/${newSlug}`);
}

export function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams({ strict: false });
  const router = useRouter();
  const orgSlug = (params as Record<string, string | undefined>).orgSlug;

  const me = useQuery({ queryKey: ['me'], queryFn: getMe });
  const organizations = me.data?.organizations ?? [];

  const currentOrg = orgSlug
    ? organizations.find((o) => o.organization_slug === orgSlug)
    : null;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      >
        {currentOrg ? (
          <>
            <OrgAvatar org={currentOrg} />
            <span className="max-w-[160px] truncate font-medium">
              {currentOrg.organization_name}
            </span>
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
            </svg>
            <span className="font-medium">All organizations</span>
          </>
        )}
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
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
                      <span className={`inline-block text-[10px] px-1.5 py-0 rounded-full ${kind.color}`}>
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
            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
              All organizations
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
