import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { searchOrganizations, ORG_KINDS } from '../../lib/organizations';
import type { OrganizationBasic } from '../../lib/organizations';
import { getInitials } from '../../lib/utils';

interface OrgSearchStepProps {
  onCreateNew: (query: string) => void;
  onClaimOrg: (org: OrganizationBasic) => void;
}

export function OrgSearchStep({ onCreateNew, onClaimOrg }: OrgSearchStepProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OrganizationBasic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationBasic | null>(
    null
  );
  const [confirmed, setConfirmed] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    try {
      const orgs = await searchOrganizations(q.trim());
      setResults(orgs);
      setHasSearched(true);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setSelectedOrg(null);
    setConfirmed(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const handleSelectOrg = (org: OrganizationBasic) => {
    setSelectedOrg(org);
    setConfirmed(false);
  };

  const trimmedQuery = query.trim();

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Type your organization name..."
          autoFocus
          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Loading */}
      {isSearching && (
        <p className="text-center text-sm text-gray-400 py-4">Searching...</p>
      )}

      {/* Results list */}
      {!isSearching && hasSearched && !selectedOrg && (
        <div className="space-y-1">
          {/* Create new — always first */}
          {trimmedQuery.length >= 2 && (
            <button
              onClick={() => onCreateNew(trimmedQuery)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-primary">
                  Create &ldquo;{trimmedQuery}&rdquo;
                </p>
                <p className="text-xs text-gray-500">
                  Register a new organization
                </p>
              </div>
            </button>
          )}

          {/* Existing orgs */}
          {results.map((org) => {
            const kindInfo = ORG_KINDS[org.kind] || ORG_KINDS.other;
            return (
              <button
                key={org.id}
                onClick={() => handleSelectOrg(org)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                {org.image_url ? (
                  <img
                    src={org.image_url}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                    {getInitials(org.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{org.name}</p>
                  {org.address && (
                    <p className="text-xs text-gray-500 truncate">
                      {org.address}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${kindInfo.color}`}
                >
                  {kindInfo.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected org panel */}
      {selectedOrg && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4">
          {/* Org info */}
          <div className="flex items-center gap-3">
            {selectedOrg.image_url ? (
              <img
                src={selectedOrg.image_url}
                alt=""
                className="h-12 w-12 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
                {getInitials(selectedOrg.name)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{selectedOrg.name}</p>
              {selectedOrg.address && (
                <p className="text-xs text-gray-500 truncate">
                  {selectedOrg.address}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedOrg(null);
                setConfirmed(false);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {selectedOrg.claimed ? (
            <>
              {/* Claimed — link to profile to request to join */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">
                  This organization is already claimed.
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You can request to join from their profile page.
                </p>
              </div>
              <Link
                to="/organizations/$id"
                params={{ id: selectedOrg.id }}
                className="block w-full text-center bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                View organization profile
              </Link>
              <a
                href="mailto:contact@fabrixproject.eu"
                className="block text-center text-xs text-gray-500 hover:text-gray-700"
              >
                Or contact our team
              </a>
            </>
          ) : (
            <>
              {/* Unclaimed — can claim */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This organization profile exists on Fabrix but is not yet
                  managed by someone.
                </p>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">
                  I confirm that I have the authority to claim this profile
                </span>
              </label>
              <button
                onClick={() => onClaimOrg(selectedOrg)}
                disabled={!confirmed}
                className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                Claim this organization
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
