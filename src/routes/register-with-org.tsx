import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { OrganizationBasic } from '../lib/organizations';
import { FormError, FieldError } from '../components/FieldError';
import {
  StepIndicator,
  OrgSearchStep,
  OrgDetailsStep,
} from '../components/org-wizard';
import type { OrgData } from '../components/org-wizard';

type Step = 'search' | 'org' | 'account';
type Mode = 'create' | 'claim';

const STEPS = [
  { key: 'search', label: 'Select' },
  { key: 'org', label: 'Information' },
  { key: 'account', label: 'Profile' },
];

// ─── Step 3: Account (local — specific to registration) ───────────────────

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

// ─── Main page ───────────────────────────────────────────────────────────

const TITLES: Record<Step, string> = {
  search: 'What is the name of your organization?',
  org: 'Add information',
  account: 'Create an organization profile',
};

const SUBTITLES: Record<Step, string> = {
  search: 'Select an entity, or create a new one, to register it to Fabrix',
  org: 'Add information about your organization',
  account: 'Create your account to finish',
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

      <StepIndicator steps={STEPS} currentKey={step} />

      {/* Content card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {step === 'search' && (
          <OrgSearchStep
            onCreateNew={handleCreateNew}
            onClaimOrg={handleClaimOrg}
          />
        )}
        {step === 'org' && (
          <OrgDetailsStep
            initialData={orgData}
            mode={mode}
            onBack={() => setStep('search')}
            onContinue={(data) => {
              setOrgData(data);
              setStep('account');
            }}
            footer={
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Next, you will create your personal account to manage this
                  organization on Fabrix.
                </p>
              </div>
            }
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
      <p className="mt-2 text-center text-sm text-gray-500">
        <Link to="/register" className="text-primary hover:underline">
          Choose another registration type
        </Link>
      </p>
    </div>
  );
}
