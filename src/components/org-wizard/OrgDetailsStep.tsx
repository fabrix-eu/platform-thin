import { useState } from 'react';
import type { UseMutationResult } from '@tanstack/react-query';
import { ORG_KINDS } from '../../lib/organizations';
import {
  GoogleAddressAutocomplete,
  type AddressData,
} from '../GoogleAddressAutocomplete';
import { FormError, FieldError } from '../FieldError';

export interface OrgData {
  name: string;
  kind: string;
  address: string;
  country_code: string;
  lat?: number;
  lon?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMutation = UseMutationResult<any, Error, any, any>;

interface OrgDetailsStepProps {
  initialData: OrgData;
  mode: 'create' | 'claim';
  onBack: () => void;
  onContinue: (data: OrgData) => void;
  mutation?: AnyMutation;
  submitLabel?: string;
  pendingLabel?: string;
  footer?: React.ReactNode;
}

export function OrgDetailsStep({
  initialData,
  mode,
  onBack,
  onContinue,
  mutation,
  submitLabel = 'Continue',
  pendingLabel = 'Creating...',
  footer,
}: OrgDetailsStepProps) {
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

  const isPending = mutation?.isPending ?? false;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'claim' && (
        <p className="text-sm text-gray-500">
          Review the organization details below. You can update them if needed.
        </p>
      )}

      {mutation && <FormError mutation={mutation} />}

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
        {mutation && <FieldError mutation={mutation} field="name" />}
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
        {mutation && <FieldError mutation={mutation} field="kind" />}
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
      {mutation && <FieldError mutation={mutation} field="address" />}
      {mutation && <FieldError mutation={mutation} field="country_code" />}

      {footer && <div className="mt-4">{footer}</div>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isPending}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
