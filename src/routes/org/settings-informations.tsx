import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization } from '../../lib/organizations';
import { GoogleAddressAutocomplete } from '../../components/GoogleAddressAutocomplete';
import type { AddressData } from '../../components/GoogleAddressAutocomplete';
import { FieldError, FormError } from '../../components/FieldError';
import { KindSelect } from '../../components/KindSelect';

export function OrgSettingsInformationsPage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const queryClient = useQueryClient();

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;

  const [name, setName] = useState('');
  const [kind, setKind] = useState('');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [numberOfWorkers, setNumberOfWorkers] = useState('');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize form values once org data is loaded
  if (org && !initialized) {
    setName(org.name || '');
    setKind(org.kind || '');
    setDescription(org.description || '');
    setWebsite(org.website || '');
    setEmail(org.email || '');
    setPhone(org.phone || '');
    setNumberOfWorkers(org.number_of_workers != null ? String(org.number_of_workers) : '');
    if (org.address && org.lat && org.lon) {
      setAddressData({
        address: org.address,
        lat: org.lat,
        lon: org.lon,
        country_code: org.country_code || '',
      });
    }
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateOrganization(orgSlug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Record<string, unknown> = {
      name,
      kind: kind || null,
      description: description || null,
      website: website || null,
      email: email || null,
      phone: phone || null,
      number_of_workers: numberOfWorkers ? Number(numberOfWorkers) : null,
    };

    if (addressData) {
      data.address = addressData.address;
      data.lat = addressData.lat;
      data.lon = addressData.lon;
      data.country_code = addressData.country_code;
    }

    mutation.mutate(data);
  };

  if (!org) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Informations</h1>
        <p className="text-sm text-gray-500 mt-1">Edit your organization details</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormError mutation={mutation} />

        {mutation.isSuccess && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
            Organization updated successfully.
          </p>
        )}

        {/* Name */}
        <div>
          <label htmlFor="org-name" className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="org-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="name" />
        </div>

        {/* Kind */}
        <div>
          <label htmlFor="org-kind" className="block text-sm font-medium text-gray-700">
            Organization type
          </label>
          <KindSelect value={kind} onChange={setKind} />
          <FieldError mutation={mutation} field="kind" />
        </div>

        {/* Address */}
        <div>
          <GoogleAddressAutocomplete
            onSelect={(data) => setAddressData(data)}
            initialLocation={addressData}
          />
          <FieldError mutation={mutation} field="address" />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="org-description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="org-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="description" />
        </div>

        {/* Website */}
        <div>
          <label htmlFor="org-website" className="block text-sm font-medium text-gray-700">
            Website
          </label>
          <input
            id="org-website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://"
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="website" />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="org-email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="org-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="email" />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="org-phone" className="block text-sm font-medium text-gray-700">
            Phone
          </label>
          <input
            id="org-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="phone" />
        </div>

        {/* Number of workers */}
        <div>
          <label htmlFor="org-workers" className="block text-sm font-medium text-gray-700">
            Number of workers
          </label>
          <input
            id="org-workers"
            type="number"
            min="0"
            value={numberOfWorkers}
            onChange={(e) => setNumberOfWorkers(e.target.value)}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="number_of_workers" />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
