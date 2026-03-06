import type { UseMutationResult } from '@tanstack/react-query';
import { FieldError, FormError } from './FieldError';
import type { Organization } from '../lib/organizations';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMutation = UseMutationResult<any, Error, any, any>;

interface OrganizationFormProps {
  mutation: AnyMutation;
  defaultValues?: Partial<Organization>;
  submitLabel: string;
  pendingLabel: string;
}

export function OrganizationForm({
  mutation,
  defaultValues,
  submitLabel,
  pendingLabel,
}: OrganizationFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const data: Record<string, unknown> = {};
        for (const [key, value] of fd.entries()) {
          if (value !== '') data[key] = value;
        }
        mutation.mutate(data);
      }}
      className="space-y-4"
    >
      <FormError mutation={mutation} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name || ''}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="name" />
      </div>

      <div>
        <label htmlFor="kind" className="block text-sm font-medium text-gray-700 mb-1">
          Kind
        </label>
        <select
          id="kind"
          name="kind"
          defaultValue={defaultValues?.kind || ''}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select...</option>
          <option value="brand_retailer">Brand / Retailer</option>
          <option value="producer">Producer</option>
          <option value="collector_sorter">Collector / Sorter</option>
          <option value="recycler">Recycler</option>
          <option value="other">Other</option>
        </select>
        <FieldError mutation={mutation} field="kind" />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description || ''}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <FieldError mutation={mutation} field="description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <input
            id="address"
            name="address"
            defaultValue={defaultValues?.address || ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="address" />
        </div>

        <div>
          <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-1">
            Country Code
          </label>
          <input
            id="country_code"
            name="country_code"
            maxLength={2}
            placeholder="FR"
            defaultValue={defaultValues?.country_code || ''}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="country_code" />
        </div>
      </div>

      <div className="pt-4 border-t flex justify-end gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
