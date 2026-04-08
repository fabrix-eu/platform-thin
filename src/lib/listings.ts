import { api, BASE } from './api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ── Types ────────────────────────────────────────────────────

export const LISTING_TYPES: Record<string, { label: string }> = {
  offer: { label: 'Offer' },
  demand: { label: 'Demand' },
};

export const LISTING_CATEGORIES: Record<string, { label: string; badgeColor: string }> = {
  raw_materials: { label: 'Raw Materials', badgeColor: 'bg-emerald-100 text-emerald-800' },
  recycled_materials: { label: 'Recycled Materials', badgeColor: 'bg-teal-100 text-teal-800' },
  production_services: { label: 'Production Services', badgeColor: 'bg-blue-100 text-blue-800' },
  machines_equipment: { label: 'Machines & Equipment', badgeColor: 'bg-amber-100 text-amber-800' },
  spaces_facilities: { label: 'Spaces & Facilities', badgeColor: 'bg-violet-100 text-violet-800' },
  skills_expertise: { label: 'Skills & Expertise', badgeColor: 'bg-fuchsia-100 text-fuchsia-800' },
  logistics: { label: 'Logistics', badgeColor: 'bg-orange-100 text-orange-800' },
  end_products: { label: 'End Products', badgeColor: 'bg-rose-100 text-rose-800' },
};

export const LISTING_SUBCATEGORIES: Record<string, Record<string, { label: string }>> = {
  raw_materials: {
    virgin_fibers: { label: 'Virgin Fibers' },
    yarns: { label: 'Yarns' },
    fabrics: { label: 'Fabrics' },
    dyes: { label: 'Dyes' },
  },
  recycled_materials: {
    post_consumer_waste: { label: 'Post-consumer Waste' },
    pre_consumer_scraps: { label: 'Pre-consumer Scraps' },
    deadstock: { label: 'Deadstock' },
    off_cuts: { label: 'Off-cuts' },
    sorted_fibers: { label: 'Sorted Fibers' },
  },
  production_services: {
    spinning: { label: 'Spinning' },
    weaving: { label: 'Weaving' },
    knitting: { label: 'Knitting' },
    dyeing: { label: 'Dyeing' },
    cutting: { label: 'Cutting' },
    sewing: { label: 'Sewing' },
    finishing: { label: 'Finishing' },
  },
  machines_equipment: {
    looms: { label: 'Looms' },
    cutting_tables: { label: 'Cutting Tables' },
    sewing_machines: { label: 'Sewing Machines' },
  },
  spaces_facilities: {
    workshop: { label: 'Workshop' },
    storage: { label: 'Storage' },
    showroom: { label: 'Showroom' },
    co_working: { label: 'Co-working' },
  },
  skills_expertise: {
    design: { label: 'Design' },
    pattern_making: { label: 'Pattern Making' },
    textile_engineering: { label: 'Textile Engineering' },
    sustainability_consulting: { label: 'Sustainability Consulting' },
  },
  logistics: {
    collection: { label: 'Collection' },
    sorting: { label: 'Sorting' },
    transport: { label: 'Transport' },
    warehousing: { label: 'Warehousing' },
  },
  end_products: {
    finished_goods: { label: 'Finished Goods' },
    samples: { label: 'Samples' },
    prototypes: { label: 'Prototypes' },
    deadstock_garments: { label: 'Deadstock Garments' },
  },
};

export interface ListingImage {
  id: string;
  image_file_url: string;
  position: number;
}

export interface ListingOrganization {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface ListingCommunity {
  id: string;
  name: string;
  slug: string;
}

export interface Listing {
  id: string;
  listing_type: string;
  category: string;
  subcategory: string | null;
  title: string;
  description: string;
  status: string;
  quantity: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  thumbnail_url: string | null;
  organization: ListingOrganization;
  community: ListingCommunity | null;
  // extended view only
  images?: ListingImage[];
}

interface ListingsResponse {
  data: Listing[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export interface ListingParams {
  page?: number;
  per_page?: number;
  search?: string;
  by_type?: string;
  by_category?: string;
  by_subcategory?: string;
  by_community?: string;
  by_community_id?: string;
}

export interface ListingPayload {
  organization_id: string;
  community_id?: string;
  listing_type: string;
  category: string;
  subcategory?: string;
  title: string;
  description: string;
  status?: string;
  quantity?: number;
  expires_at?: string;
}

// ── API functions ────────────────────────────────────────────

export async function getListings(params: ListingParams = {}): Promise<ListingsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);
  if (params.by_type) qs.set('by_type', params.by_type);
  if (params.by_category) qs.set('by_category', params.by_category);
  if (params.by_subcategory) qs.set('by_subcategory', params.by_subcategory);
  if (params.by_community) qs.set('by_community', params.by_community);
  if (params.by_community_id) qs.set('by_community_id', params.by_community_id);

  const query = qs.toString();
  // The API returns { data: [...], meta: {...} } — we need both, so raw fetch
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}/listings${query ? `?${query}` : ''}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error('Failed to fetch listings');
  return res.json();
}

export async function getListing(id: string): Promise<Listing> {
  return api.get<Listing>(`/listings/${id}`);
}

export async function createListing(payload: ListingPayload): Promise<Listing> {
  return api.post<Listing>('/listings', { listing: payload });
}

export async function updateListing(id: string, payload: Partial<ListingPayload>): Promise<Listing> {
  return api.patch<Listing>(`/listings/${id}`, { listing: payload });
}

export async function deleteListing(id: string): Promise<void> {
  return api.delete(`/listings/${id}`);
}

export async function addListingImage(listingId: string, imageFileUrl: string): Promise<ListingImage> {
  return api.post<ListingImage>(`/listings/${listingId}/listing_images`, {
    listing_image: { image_file_url: imageFileUrl },
  });
}

export async function removeListingImage(listingId: string, imageId: string): Promise<void> {
  return api.delete(`/listings/${listingId}/listing_images/${imageId}`);
}

// ── Query keys ──────────────────────────────────────────────

export const listingKeys = {
  list: (params?: ListingParams) => ['listings', params ?? {}] as const,
  detail: (id: string) => ['listings', id] as const,
};

// ── Hooks ───────────────────────────────────────────────────

export function useListings(params: ListingParams = {}) {
  return useQuery({
    queryKey: listingKeys.list(params),
    queryFn: () => getListings(params),
  });
}

export function useListing(id: string | null) {
  return useQuery({
    queryKey: listingKeys.detail(id!),
    queryFn: () => getListing(id!),
    enabled: !!id,
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ListingPayload> }) =>
      updateListing(id, payload),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: listingKeys.detail(vars.id) });
    },
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteListing,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useAddListingImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, imageFileUrl }: { listingId: string; imageFileUrl: string }) =>
      addListingImage(listingId, imageFileUrl),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: listingKeys.detail(vars.listingId) });
    },
  });
}

export function useRemoveListingImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, imageId }: { listingId: string; imageId: string }) =>
      removeListingImage(listingId, imageId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: listingKeys.detail(vars.listingId) });
    },
  });
}
