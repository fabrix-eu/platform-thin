import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchOrganizations,
  submitClaim,
  createOrganization,
  ORG_KINDS,
} from '../../lib/organizations';
import type { OrganizationBasic } from '../../lib/organizations';
import { OrganizationForm } from '../../components/OrganizationForm';
import { ApiError } from '../../lib/api';

type Step = 'search' | 'claim' | 'create';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Step 1: Search ─────────────────────────────────────────────────────────

function SearchStep({
  onSelectOrg,
  onCreateNew,
}: {
  onSelectOrg: (org: OrganizationBasic) => void;
  onCreateNew: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OrganizationBasic[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="space-y-5">
      {/* Search input */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by company name..."
          autoFocus
          className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Loading */}
      {isSearching && (
        <p className="text-center text-sm text-gray-400 py-6">Searching...</p>
      )}

      {/* Results */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-1">
          {results.map((org) => {
            const kindInfo = ORG_KINDS[org.kind] || ORG_KINDS.other;
            return (
              <button
                key={org.id}
                onClick={() => onSelectOrg(org)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Avatar */}
                {org.image_url ? (
                  <img src={org.image_url} alt="" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                    {getInitials(org.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{org.name}</p>
                  {org.address && (
                    <p className="text-xs text-gray-500 truncate">{org.address}</p>
                  )}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${kindInfo.color}`}>
                  {kindInfo.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!isSearching && hasSearched && results.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          No organizations found for &ldquo;{query}&rdquo;
        </p>
      )}

      {/* Create new CTA */}
      <div className="border-t pt-4">
        <p className="text-sm text-gray-500 mb-3">Can&apos;t find your company?</p>
        <button
          onClick={onCreateNew}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create a new organization
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Claim ──────────────────────────────────────────────────────────

function ClaimStep({
  org,
  onBack,
}: {
  org: OrganizationBasic;
  onBack: () => void;
}) {
  const navigate = useNavigate();
  const [justification, setJustification] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const kindInfo = ORG_KINDS[org.kind] || ORG_KINDS.other;
  const isValid = justification.trim().length >= 20;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitClaim(org.id, justification.trim());
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: '/organizations/$id', params: { id: org.id } });
      }, 2000);
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = err.errors?.base?.[0] || err.errors?.justification?.[0] || err.message;
        setError(msg);
      } else {
        setError('Failed to submit claim. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10">
        <svg className="h-12 w-12 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="text-lg font-semibold mb-2">Claim submitted!</h3>
        <p className="text-sm text-gray-500">
          Your request has been sent. You will be notified once it is reviewed.
        </p>
        <p className="text-xs text-gray-400 mt-2">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        ← Back to search
      </button>

      {/* Org card */}
      <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
        {org.image_url ? (
          <img src={org.image_url} alt="" className="h-14 w-14 rounded-full object-cover flex-shrink-0" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 flex-shrink-0">
            {getInitials(org.name)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{org.name}</h3>
          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${kindInfo.color}`}>
            {kindInfo.label}
          </span>
          {org.address && (
            <p className="text-sm text-gray-500 mt-1">{org.address}</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700">Request to manage this organization</p>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your role at this company to verify your identity.
        </p>
      </div>

      {/* Justification */}
      <div>
        <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
          Justification
        </label>
        <textarea
          id="justification"
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          placeholder="Explain your connection to this organization (min. 20 characters)..."
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="text-xs text-gray-400 text-right mt-1">
          {justification.trim().length} / 20 min
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isValid || isSubmitting}
        className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Submitting...' : 'Submit claim request'}
      </button>
    </div>
  );
}

// ─── Step 3: Create ─────────────────────────────────────────────────────────

function CreateStep({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      createOrganization({ ...data, owner_email: '' }),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      navigate({ to: '/organizations/$id', params: { id: org.slug || org.id } });
    },
  });

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
        ← Back to search
      </button>
      <OrganizationForm
        mutation={mutation}
        submitLabel="Create Organization"
        pendingLabel="Creating..."
      />
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export function OrganizationNewPage() {
  const [step, setStep] = useState<Step>('search');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationBasic | null>(null);

  const handleSelectOrg = (org: OrganizationBasic) => {
    setSelectedOrg(org);
    setStep('claim');
  };

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <Link to="/organizations" className="text-sm text-gray-500 hover:text-gray-700">
        ← Back to list
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Add your organization</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {step === 'search' && 'Search for your company to get started'}
          {step === 'claim' && 'Request to manage this organization'}
          {step === 'create' && 'Create a new organization'}
        </p>
      </div>

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {step === 'search' && (
          <SearchStep
            onSelectOrg={handleSelectOrg}
            onCreateNew={() => setStep('create')}
          />
        )}
        {step === 'claim' && selectedOrg && (
          <ClaimStep org={selectedOrg} onBack={() => setStep('search')} />
        )}
        {step === 'create' && (
          <CreateStep onBack={() => setStep('search')} />
        )}
      </div>
    </div>
  );
}
