import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization, ORG_KINDS } from '../../lib/organizations';
import { GoogleAddressAutocomplete } from '../../components/GoogleAddressAutocomplete';
import type { AddressData } from '../../components/GoogleAddressAutocomplete';
import { FieldError, FormError } from '../../components/FieldError';

// ─── Section nav ──────────────────────────────────────────────────────────────

type SectionId = 'informations' | 'data' | 'photos' | 'products' | 'services';

const SECTIONS: { id: SectionId; label: string; ready: boolean }[] = [
  { id: 'informations', label: 'Informations', ready: true },
  { id: 'data', label: 'Data', ready: false },
  { id: 'photos', label: 'Photos', ready: false },
  { id: 'products', label: 'Products', ready: false },
  { id: 'services', label: 'Services & Skills', ready: false },
];

// ─── Informations section ─────────────────────────────────────────────────────

function InformationsSection({ orgSlug }: { orgSlug: string }) {
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
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [initialized, setInitialized] = useState(false);

  if (org && !initialized) {
    setName(org.name || '');
    setKind(org.kind || '');
    setDescription(org.description || '');
    setWebsite(org.website || '');
    setEmail(org.email || '');
    setPhone(org.phone || '');
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
        <select
          id="org-kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a type...</option>
          {Object.entries(ORG_KINDS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
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

      {/* Contact info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>

      <div className="sm:w-1/2">
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
  );
}

// ─── Coming soon stub ─────────────────────────────────────────────────────────

function ComingSoonSection({ label }: { label: string }) {
  return (
    <div className="py-12 text-center">
      <div className="text-gray-400 text-sm">{label} — coming soon</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OrgProfilePage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const [activeSection, setActiveSection] = useState<SectionId>('informations');

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your organization profile</p>
        </div>
        {org && (
          <Link
            to="/organizations/$id"
            params={{ id: org.slug || org.id }}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
            View public profile
          </Link>
        )}
      </div>

      {/* Section nav + content */}
      <div className="flex gap-6">
        {/* Sidebar section nav */}
        <nav className="w-48 shrink-0">
          <ul className="space-y-0.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => section.ready && setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : section.ready
                        ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        : 'text-gray-400 cursor-default'
                  }`}
                >
                  {section.label}
                  {!section.ready && (
                    <span className="ml-1.5 text-[10px] text-gray-400">soon</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-border p-6">
            {activeSection === 'informations' && (
              <InformationsSection orgSlug={orgSlug} />
            )}
            {activeSection === 'data' && <ComingSoonSection label="Data" />}
            {activeSection === 'photos' && <ComingSoonSection label="Photos" />}
            {activeSection === 'products' && <ComingSoonSection label="Products" />}
            {activeSection === 'services' && <ComingSoonSection label="Services & Skills" />}
          </div>
        </div>
      </div>
    </div>
  );
}
