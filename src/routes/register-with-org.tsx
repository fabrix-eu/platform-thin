import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { searchOrganizations, ORG_KINDS } from '../lib/organizations';
import type { OrganizationBasic } from '../lib/organizations';
import { FormError, FieldError } from '../components/FieldError';
import {
  GoogleAddressAutocomplete,
  type AddressData,
} from '../components/GoogleAddressAutocomplete';

type Step = 'search' | 'org' | 'account';

// 'create' = new org, 'claim' = existing unclaimed org
type Mode = 'create' | 'claim';

interface OrgData {
  name: string;
  kind: string;
  address: string;
  country_code: string;
  lat?: number;
  lon?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Step indicator ──────────────────────────────────────────────────────────

const STEPS: { key: Step; label: string }[] = [
  { key: 'search', label: 'Select' },
  { key: 'org', label: 'Information' },
  { key: 'account', label: 'Profile' },
];

function StepIndicator({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium ${
              i <= currentIndex
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${
              i <= currentIndex ? 'text-gray-900 font-medium' : 'text-gray-400'
            }`}
          >
            {s.label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`w-8 h-px ${
                i < currentIndex ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Search & Select ────────────────────────────────────────────────

function SearchStep({
  onCreateNew,
  onClaimOrg,
}: {
  onCreateNew: (query: string) => void;
  onClaimOrg: (org: OrganizationBasic) => void;
}) {
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
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedOrg.claimed ? (
            <>
              {/* Claimed — blocked */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-800">
                  This organization profile is already claimed by someone.
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Ask your colleagues to invite you or contact our team.
                </p>
              </div>
              <a
                href="mailto:contact@fabrixproject.eu"
                className="block w-full text-center bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
              >
                Contact Fabrix team
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

// ─── Step 2: Organization details ────────────────────────────────────────────

function OrgStep({
  initialData,
  mode,
  onBack,
  onContinue,
}: {
  initialData: OrgData;
  mode: Mode;
  onBack: () => void;
  onContinue: (data: OrgData) => void;
}) {
  const [name, setName] = useState(initialData.name);
  const [kind, setKind] = useState(initialData.kind);
  const [addressData, setAddressData] = useState<AddressData | null>(
    initialData.address
      ? {
          address: initialData.address,
          lat: initialData.lat ?? 0,
          lon: initialData.lon ?? 0,
          country_code: initialData.country_code,
        }
      : null
  );

  const hasValidLocation =
    addressData != null &&
    addressData.address.length > 0 &&
    typeof addressData.lat === 'number' &&
    typeof addressData.lon === 'number';
  const [showAddressError, setShowAddressError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidLocation) {
      setShowAddressError(true);
      return;
    }
    onContinue({
      name,
      kind,
      address: addressData?.address ?? '',
      country_code: addressData?.country_code ?? '',
      lat: addressData?.lat,
      lon: addressData?.lon,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'claim' && (
        <p className="text-sm text-gray-500">
          Review the organization details below. You can update them if needed.
        </p>
      )}

      <div>
        <label
          htmlFor="org-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organization name
        </label>
        <input
          id="org-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div>
        <label
          htmlFor="org-kind"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Organization type
        </label>
        <select
          id="org-kind"
          required
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-white"
        >
          <option value="">Select a type...</option>
          {Object.entries(ORG_KINDS).map(([key, info]) => (
            <option key={key} value={key}>
              {info.label}
            </option>
          ))}
        </select>
      </div>

      <GoogleAddressAutocomplete
        onSelect={(data) => {
          setAddressData(data);
          setShowAddressError(false);
        }}
        initialAddress={initialData.address}
        initialLocation={addressData}
      />
      {showAddressError && !hasValidLocation && (
        <p className="text-sm text-red-600 mt-1">
          Please select an address from the suggestions to set the location.
        </p>
      )}

      <div className="bg-gray-50 rounded-lg p-3 mt-4">
        <p className="text-sm text-gray-600">
          Next, you will create your personal account to manage this
          organization on Fabrix.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          Continue
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Account ─────────────────────────────────────────────────────────

function AccountStep({
  orgData,
  claimedOrgId,
  mode,
  onBack,
}: {
  orgData: OrgData;
  claimedOrgId: string | null;
  mode: Mode;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (formData: FormData) => {
      const userPayload = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        password_confirmation: formData.get('password_confirmation'),
      };

      if (mode === 'claim' && claimedOrgId) {
        return api.post('/registrations/with_claim', {
          user: userPayload,
          organization_id: claimedOrgId,
        });
      }

      return api.post('/registrations/with_organization', {
        user: userPayload,
        organization: {
          name: orgData.name,
          kind: orgData.kind,
          address: orgData.address,
          country_code: orgData.country_code,
          lat: orgData.lat,
          lon: orgData.lon,
        },
      });
    },
    onSuccess: () => {
      navigate({ to: '/verify-instructions' });
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(new FormData(e.currentTarget));
      }}
      className="space-y-4"
    >
      <p className="text-sm text-gray-500">
        Create your account to {mode === 'claim' ? 'claim' : 'register'}{' '}
        <strong>{orgData.name}</strong> on Fabrix.
      </p>

      <FormError mutation={mutation} />

      <div>
        <label
          htmlFor="user-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Your name
        </label>
        <input
          id="user-name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="name" />
      </div>

      <div>
        <label
          htmlFor="user-email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email
        </label>
        <input
          id="user-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="email" />
      </div>

      <div>
        <label
          htmlFor="user-password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password
        </label>
        <input
          id="user-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="password" />
      </div>

      <div>
        <label
          htmlFor="user-password-confirmation"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Confirm password
        </label>
        <input
          id="user-password-confirmation"
          name="password_confirmation"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="password_confirmation" />
      </div>

      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          After creating your account, we will send you a verification email.
          Please check your inbox to confirm your email address and activate
          your account.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={mutation.isPending}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </div>
    </form>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

const SUBTITLES: Record<Step, string> = {
  search: 'Select an entity, or create a new one, to register it to Fabrix',
  org: 'Add information about your organization',
  account: 'Create your account to finish',
};

const TITLES: Record<Step, string> = {
  search: 'What is the name of your organization?',
  org: 'Add information',
  account: 'Create an organization profile',
};

export function RegisterWithOrgPage() {
  const [step, setStep] = useState<Step>('search');
  const [mode, setMode] = useState<Mode>('create');
  const [claimedOrgId, setClaimedOrgId] = useState<string | null>(null);
  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    kind: '',
    address: '',
    country_code: '',
  });

  const handleCreateNew = (query: string) => {
    setMode('create');
    setClaimedOrgId(null);
    setOrgData((prev) => ({ ...prev, name: query }));
    setStep('org');
  };

  const handleClaimOrg = (org: OrganizationBasic) => {
    setMode('claim');
    setClaimedOrgId(org.id);
    setOrgData({
      name: org.name,
      kind: org.kind || '',
      address: org.address || '',
      country_code: '',
      lat: org.lat,
      lon: org.lon,
    });
    setStep('org');
  };

  return (
    <div className="max-w-lg mx-auto p-6 mt-12 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{TITLES[step]}</h1>
        <p className="text-gray-500 mt-1 text-sm">{SUBTITLES[step]}</p>
      </div>

      <StepIndicator current={step} />

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {step === 'search' && (
          <SearchStep
            onCreateNew={handleCreateNew}
            onClaimOrg={handleClaimOrg}
          />
        )}
        {step === 'org' && (
          <OrgStep
            initialData={orgData}
            mode={mode}
            onBack={() => setStep('search')}
            onContinue={(data) => {
              setOrgData(data);
              setStep('account');
            }}
          />
        )}
        {step === 'account' && (
          <AccountStep
            orgData={orgData}
            claimedOrgId={claimedOrgId}
            mode={mode}
            onBack={() => setStep('org')}
          />
        )}
      </div>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
