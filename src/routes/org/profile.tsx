import { useState, useRef } from 'react';
import { Link, useParams, useSearch, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganization, updateOrganization } from '../../lib/organizations';
import { getOrganizationPhotos, createOrganizationPhoto, deleteOrganizationPhoto } from '../../lib/organization-photos';
import {
  useListings,
  useDeleteListing,
  LISTING_TYPES,
  LISTING_CATEGORIES,
  LISTING_SUBCATEGORIES,
} from '../../lib/listings';
import type { Listing } from '../../lib/listings';
import { uploadFile } from '../../lib/uploads';
import { GoogleAddressAutocomplete } from '../../components/GoogleAddressAutocomplete';
import type { AddressData } from '../../components/GoogleAddressAutocomplete';
import { FieldError, FormError } from '../../components/FieldError';
import { KindSelect } from '../../components/KindSelect';
import { useFeatureInfo, FeatureIntro, FeatureInfoTrigger } from '../../components/FeatureIntro';

// ─── Section nav ──────────────────────────────────────────────────────────────

type SectionId = 'informations' | 'data' | 'photos' | 'services' | 'materials' | 'products' | 'capacities';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'informations', label: 'Informations' },
  { id: 'data', label: 'Data' },
  { id: 'photos', label: 'Photos' },
  { id: 'services', label: 'Services' },
  { id: 'materials', label: 'Materials' },
  { id: 'products', label: 'Products' },
  { id: 'capacities', label: 'Capacities' },
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
        <label className="block text-sm font-medium text-gray-700">
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

// ─── Data section ─────────────────────────────────────────────────────────────

function DataSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const org = orgQuery.data;

  const [numberOfWorkers, setNumberOfWorkers] = useState('');
  const [turnover, setTurnover] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (org && !initialized) {
    setNumberOfWorkers(org.number_of_workers != null ? String(org.number_of_workers) : '');
    setTurnover(org.turnover != null ? String(org.turnover) : '');
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
    mutation.mutate({
      number_of_workers: numberOfWorkers ? Number(numberOfWorkers) : null,
      turnover: turnover ? Number(turnover) : null,
    });
  };

  if (!org) {
    return <div className="p-6 text-gray-500">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormError mutation={mutation} />

      {mutation.isSuccess && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          Data updated successfully.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="org-workers" className="block text-sm font-medium text-gray-700">
            Number of employees
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

        <div>
          <label htmlFor="org-turnover" className="block text-sm font-medium text-gray-700">
            Annual turnover
          </label>
          <div className="relative mt-1">
            <input
              id="org-turnover"
              type="number"
              min="0"
              value={turnover}
              onChange={(e) => setTurnover(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
          </div>
          <FieldError mutation={mutation} field="turnover" />
        </div>
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

// ─── Photos section ───────────────────────────────────────────────────────────

function PhotosSection({ orgSlug }: { orgSlug: string }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const photosInfo = useFeatureInfo('profile-photos');

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const photosQuery = useQuery({
    queryKey: ['organizations', orgSlug, 'photos'],
    queryFn: () => getOrganizationPhotos(orgQuery.data!.id),
    enabled: !!orgQuery.data,
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: string) => deleteOrganizationPhoto(orgQuery.data!.id, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !orgQuery.data) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const url = await uploadFile(file, 'Organization', orgQuery.data.id);
        await createOrganizationPhoto(orgQuery.data.id, { url });
      }
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug, 'photos'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', orgSlug] });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const photos = photosQuery.data ?? orgQuery.data?.organization_photos ?? [];

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</p>
          <FeatureInfoTrigger info={photosInfo} />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {uploading ? (
            'Uploading...'
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add photos
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <FeatureIntro
        info={photosInfo}
        title="Showcase your workspace"
        description="Add photos of your facilities, equipment, and work to make your profile stand out. Organizations with photos feel more authentic and are more likely to attract partners."
      />

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No photos yet. Add photos to showcase your organization.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group rounded-lg overflow-hidden aspect-[4/3]">
              <img
                src={photo.url}
                alt={photo.caption || ''}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this photo?')) deleteMutation.mutate(photo.id);
                }}
                disabled={deleteMutation.isPending}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              {photo.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                  <p className="text-xs text-white truncate">{photo.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Listings section ─────────────────────────────────────────────────────────

function ListingMiniCard({ listing, onDelete, fromUrl }: { listing: Listing; onDelete: (id: string) => void; fromUrl: string }) {
  const categoryConfig = LISTING_CATEGORIES[listing.category];
  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-border rounded-lg group">
      {listing.thumbnail_url ? (
        <img src={listing.thumbnail_url} alt="" className="w-16 h-16 rounded-md object-cover shrink-0" />
      ) : (
        <div className="w-16 h-16 rounded-md bg-gray-50 flex items-center justify-center shrink-0">
          <svg className="h-6 w-6 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {categoryConfig && (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${categoryConfig.badgeColor}`}>
              {categoryConfig.label}
            </span>
          )}
          {listing.subcategory && LISTING_SUBCATEGORIES[listing.category]?.[listing.subcategory] && (
            <span className="text-[10px] text-gray-500">
              {LISTING_SUBCATEGORIES[listing.category][listing.subcategory].label}
            </span>
          )}
          {listing.status === 'closed' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
              Closed
            </span>
          )}
        </div>
        <h4 className="text-sm font-medium text-gray-900 truncate">{listing.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{listing.description}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link
          to="/marketplace/$id/edit"
          params={{ id: listing.id }}
          search={{ from: fromUrl }}
          className="p-1.5 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
          </svg>
        </Link>
        <button
          onClick={() => { if (confirm('Delete this listing?')) onDelete(listing.id); }}
          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );
}

const LISTING_INFO: Record<string, { title: string; description: string }> = {
  service: {
    title: 'Highlight the services you provide',
    description: 'List consulting, training, design, or other services your organization offers. This helps potential partners understand how you can work with them.',
  },
  material: {
    title: 'List your available materials',
    description: 'Share the raw fibers, fabrics, yarns, or recycled textiles you have available. This helps potential buyers find exactly what they need.',
  },
  product: {
    title: 'Showcase your finished products',
    description: 'Present the products you manufacture or sell. A visible catalog helps buyers discover your offerings and reach out.',
  },
  capacity: {
    title: 'Share your production capacity',
    description: 'Let others know about available machines, workspace, or workforce. This enables matchmaking with organizations looking for manufacturing partners.',
  },
};

function ListingsSection({ orgSlug, listingType, sectionId }: { orgSlug: string; listingType: string; sectionId: SectionId }) {
  const queryClient = useQueryClient();
  const listingInfo = useFeatureInfo(`profile-${sectionId}`);

  const orgQuery = useQuery({
    queryKey: ['organizations', orgSlug],
    queryFn: () => getOrganization(orgSlug),
  });

  const orgId = orgQuery.data?.id;

  const listingsQuery = useListings({
    by_organization: orgId,
    by_type: listingType,
    per_page: 50,
  });

  const deleteMutation = useDeleteListing();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['listings'] });
      },
    });
  };

  const listings = listingsQuery.data?.data ?? [];
  const typeConfig = LISTING_TYPES[listingType];
  const infoContent = LISTING_INFO[listingType];

  if (!orgId) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500">
            {listingsQuery.isLoading ? 'Loading...' : `${listings.length} listing${listings.length !== 1 ? 's' : ''}`}
          </p>
          <FeatureInfoTrigger info={listingInfo} />
        </div>
        <Link
          to="/marketplace/new"
          search={{ type: listingType, from: `/${orgSlug}/profile?section=${sectionId}` }}
          className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add {typeConfig?.label?.toLowerCase() ?? listingType}
        </Link>
      </div>

      {infoContent && (
        <FeatureIntro
          info={listingInfo}
          title={infoContent.title}
          description={infoContent.description}
        />
      )}

      {listings.length === 0 && !listingsQuery.isLoading ? (
        <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-lg">
          <svg className="mx-auto w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
          </svg>
          <p className="text-sm text-gray-400 mt-2">No {typeConfig?.label?.toLowerCase() ?? listingType} listings yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {listings.map((listing) => (
            <ListingMiniCard key={listing.id} listing={listing} onDelete={handleDelete} fromUrl={`/${orgSlug}/profile?section=${sectionId}`} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OrgProfilePage() {
  const { orgSlug } = useParams({ strict: false }) as { orgSlug: string };
  const { section } = useSearch({ strict: false }) as { section?: SectionId };
  const navigate = useNavigate();
  const activeSection: SectionId = section || 'informations';

  const setActiveSection = (id: SectionId) => {
    navigate({
      to: '/$orgSlug/profile',
      params: { orgSlug },
      search: id === 'informations' ? {} : { section: id },
    });
  };

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
            search={{ from: 'profile' }}
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
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-gray-100 text-gray-900 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {section.label}
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
            {activeSection === 'data' && <DataSection orgSlug={orgSlug} />}
            {activeSection === 'photos' && <PhotosSection orgSlug={orgSlug} />}
            {activeSection === 'services' && <ListingsSection orgSlug={orgSlug} listingType="service" sectionId="services" />}
            {activeSection === 'materials' && <ListingsSection orgSlug={orgSlug} listingType="material" sectionId="materials" />}
            {activeSection === 'products' && <ListingsSection orgSlug={orgSlug} listingType="product" sectionId="products" />}
            {activeSection === 'capacities' && <ListingsSection orgSlug={orgSlug} listingType="capacity" sectionId="capacities" />}
          </div>
        </div>
      </div>
    </div>
  );
}
