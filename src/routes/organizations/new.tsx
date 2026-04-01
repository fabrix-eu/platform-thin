import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  submitClaim,
  createOrganization,
  ORG_KINDS,
} from '../../lib/organizations';
import type { OrganizationBasic } from '../../lib/organizations';
import { getInitials } from '../../lib/utils';
import { ApiError } from '../../lib/api';
import {
  StepIndicator,
  OrgSearchStep,
  OrgDetailsStep,
} from '../../components/org-wizard';
import type { OrgData } from '../../components/org-wizard';

type Step = 'search' | 'ownership' | 'details' | 'claim';

// Path A: create → search → ownership → details → POST /organizations
// Path B: claim unclaimed → search → claim → POST /organizations/:id/claims
// Path C: already claimed → search → blocked (handled inline in OrgSearchStep)

const STEPS_CREATE = [
  { key: 'search', label: 'Select' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'details', label: 'Details' },
];

const STEPS_CLAIM = [
  { key: 'search', label: 'Select' },
  { key: 'claim', label: 'Claim' },
];

// ─── Ownership Step ────────────────────────────────────────────────────────

type Ownership = 'owner' | 'reference';

function OwnershipStep({
  onBack,
  onContinue,
}: {
  onBack: () => void;
  onContinue: (ownership: Ownership) => void;
}) {
  const [selected, setSelected] = useState<Ownership | null>(null);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        How are you related to this organization?
      </p>

      <div className="space-y-3">
        <label
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selected === 'owner'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="ownership"
            value="owner"
            checked={selected === 'owner'}
            onChange={() => setSelected('owner')}
            className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
          />
          <div>
            <p className="font-medium text-sm text-gray-900">
              I represent this organization
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              You will be the owner and manage this profile on Fabrix
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
            selected === 'reference'
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="ownership"
            value="reference"
            checked={selected === 'reference'}
            onChange={() => setSelected('reference')}
            className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
          />
          <div>
            <p className="font-medium text-sm text-gray-900">
              Adding for reference
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Add a partner or organization you know about — it won&apos;t be
              linked to your account
            </p>
          </div>
        </label>
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
          type="button"
          onClick={() => selected && onContinue(selected)}
          disabled={!selected}
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

// ─── Claim Step ────────────────────────────────────────────────────────────

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
        const msg =
          err.errors?.base?.[0] ||
          err.errors?.justification?.[0] ||
          err.message;
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
        <svg
          className="h-12 w-12 text-green-500 mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
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
      {/* Org card */}
      <div className="flex items-start gap-4 p-4 rounded-lg border border-gray-200">
        {org.image_url ? (
          <img
            src={org.image_url}
            alt=""
            className="h-14 w-14 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600 shrink-0">
            {getInitials(org.name)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{org.name}</h3>
          <span
            className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${kindInfo.badgeColor}`}
          >
            {kindInfo.label}
          </span>
          {org.address && (
            <p className="text-sm text-gray-500 mt-1">{org.address}</p>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-sm font-medium text-gray-700">
          Request to manage this organization
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Tell us about your role at this company to verify your identity.
        </p>
      </div>

      {/* Justification */}
      <div>
        <label
          htmlFor="justification"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
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
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid || isSubmitting}
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit claim request'}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

const TITLES: Record<Step, string> = {
  search: 'Add your organization',
  ownership: 'Your relationship',
  details: 'Organization details',
  claim: 'Claim this organization',
};

const SUBTITLES: Record<Step, string> = {
  search: 'Search for your company or create a new one',
  ownership: 'How are you related to this organization?',
  details: 'Fill in the details to create this organization',
  claim: 'Request to manage this organization',
};

export function OrganizationNewPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('search');
  const [ownership, setOwnership] = useState<Ownership>('owner');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationBasic | null>(
    null
  );
  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    kind: '',
    address: '',
    country_code: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: OrgData) =>
      createOrganization({
        name: data.name,
        kind: data.kind,
        address: data.address,
        country_code: data.country_code,
        lat: data.lat,
        lon: data.lon,
        claimed: ownership === 'owner',
      }),
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
      if (ownership === 'owner') {
        navigate({ to: '/$orgSlug/dashboard', params: { orgSlug: org.slug } });
      } else {
        navigate({
          to: '/organizations/$id',
          params: { id: org.slug || org.id },
        });
      }
    },
  });

  // Path A: create new
  const handleCreateNew = (query: string) => {
    setSelectedOrg(null);
    setOrgData((prev) => ({ ...prev, name: query }));
    setStep('ownership');
  };

  // Path B: claim existing unclaimed org
  const handleClaimOrg = (org: OrganizationBasic) => {
    setSelectedOrg(org);
    setStep('claim');
  };

  const handleOwnershipContinue = (o: Ownership) => {
    setOwnership(o);
    setStep('details');
  };

  const handleDetailsContinue = (data: OrgData) => {
    setOrgData(data);
    createMutation.mutate(data);
  };

  const isCreatePath = !selectedOrg;
  const steps = isCreatePath ? STEPS_CREATE : STEPS_CLAIM;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-6">
      <Link
        to="/organizations"
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        &larr; Back to list
      </Link>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">{TITLES[step]}</h1>
        <p className="text-gray-500 mt-1 text-sm">{SUBTITLES[step]}</p>
      </div>

      <StepIndicator steps={steps} currentKey={step} />

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {step === 'search' && (
          <OrgSearchStep
            onCreateNew={handleCreateNew}
            onClaimOrg={handleClaimOrg}
          />
        )}
        {step === 'ownership' && (
          <OwnershipStep
            onBack={() => setStep('search')}
            onContinue={handleOwnershipContinue}
          />
        )}
        {step === 'details' && (
          <OrgDetailsStep
            initialData={orgData}
            mode="create"
            onBack={() => setStep('ownership')}
            onContinue={handleDetailsContinue}
            mutation={createMutation}
            submitLabel="Create Organization"
            pendingLabel="Creating..."
            footer={
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  {ownership === 'owner'
                    ? 'You will be the owner of this organization and manage its profile on Fabrix.'
                    : "This organization will be added to the directory but won't be linked to your account."}
                </p>
              </div>
            }
          />
        )}
        {step === 'claim' && selectedOrg && (
          <ClaimStep org={selectedOrg} onBack={() => setStep('search')} />
        )}
      </div>
    </div>
  );
}
