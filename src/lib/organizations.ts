import { api, BASE } from './api';
import type { Relation } from './relations';

export const ORG_KINDS: Record<string, { label: string; badgeColor: string; hex: string }> = {
  brand_retailer:                        { label: 'Brand / Retailer',    badgeColor: 'bg-violet-100 text-violet-800',  hex: '#8B5CF6' },
  producer:                              { label: 'Producer',            badgeColor: 'bg-emerald-100 text-emerald-800', hex: '#10B981' },
  facility_factory_supplier_vendor:      { label: 'Facility / Supplier', badgeColor: 'bg-amber-50 text-amber-900',     hex: '#92400E' },
  collector_sorter:                      { label: 'Collector / Sorter',  badgeColor: 'bg-amber-100 text-amber-800',    hex: '#F59E0B' },
  designer:                              { label: 'Designer',            badgeColor: 'bg-fuchsia-100 text-fuchsia-800', hex: '#D946EF' },
  recycler:                              { label: 'Recycler',            badgeColor: 'bg-teal-100 text-teal-800',      hex: '#14B8A6' },
  academic_researcher_journalist_student: { label: 'Academic / Research', badgeColor: 'bg-indigo-100 text-indigo-800',  hex: '#6366F1' },
  auditor_certification_service_provider: { label: 'Auditor / Service',  badgeColor: 'bg-rose-100 text-rose-800',      hex: '#F43F5E' },
  civil_society_organization:            { label: 'Civil Society',       badgeColor: 'bg-orange-100 text-orange-800',  hex: '#F97316' },
  multi_stakeholder_initiative:          { label: 'Multi-stakeholder',   badgeColor: 'bg-cyan-100 text-cyan-800',      hex: '#06B6D4' },
  union:                                 { label: 'Union',               badgeColor: 'bg-pink-100 text-pink-800',      hex: '#EC4899' },
  other:                                 { label: 'Other',               badgeColor: 'bg-gray-100 text-gray-800',      hex: '#6B7280' },
};

export interface OrganizationCommunity {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
}

export interface OrganizationRelation {
  id: string;
  name: string;
  slug: string;
  kind: string | null;
  image_url: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  kind: string | null;
  description: string | null;
  address: string | null;
  country_code: string | null;
  lat: number | null;
  lon: number | null;
  number_of_workers: number | null;
  turnover: number | null;
  image_url: string | null;
  claimed: boolean;
  relations_count: number;
  cover_url?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  facility_types?: string[];
  processing_types?: string[];
  product_types?: string[];
  nace_code?: string | null;
  sector?: string | null;
  organization_photos?: { id: string; url: string; caption: string | null; position: number }[];
  communities?: OrganizationCommunity[];
  relations?: Relation[];
  related_organizations?: Organization[];
}

export interface OrganizationBasic {
  id: string;
  name: string;
  kind: string;
  address: string;
  image_url: string | null;
  lon: number;
  lat: number;
  claimed: boolean;
}

interface OrganizationsResponse {
  organizations: Organization[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    next_page: number | null;
    prev_page: number | null;
  };
}

export async function getOrganizations(params: {
  page?: number;
  per_page?: number;
  search?: string;
}): Promise<OrganizationsResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.per_page) qs.set('per_page', String(params.per_page));
  if (params.search) qs.set('search', params.search);

  const suffix = qs.toString() ? `?${qs}` : '';

  // This endpoint returns { organizations, relations, meta } — not standard { data }
  const res = await fetch(`${BASE}/organizations${suffix}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    },
  });
  const json = await res.json();
  return { organizations: json.organizations, meta: json.meta };
}

export async function getOrganization(id: string): Promise<Organization> {
  return api.get<Organization>(`/organizations/${id}`);
}

export async function createOrganization(data: Record<string, unknown>): Promise<Organization> {
  return api.post<Organization>('/organizations', { organization: data });
}

export async function updateOrganization(id: string, data: Record<string, unknown>): Promise<Organization> {
  return api.patch<Organization>(`/organizations/${id}`, { organization: data });
}

export async function deleteOrganization(id: string): Promise<void> {
  return api.delete(`/organizations/${id}`);
}

export async function searchOrganizations(q: string): Promise<OrganizationBasic[]> {
  return api.get<OrganizationBasic[]>(`/organizations/search?q=${encodeURIComponent(q)}`);
}

export async function submitClaim(organizationId: string, justification: string): Promise<void> {
  await api.post(`/organizations/${organizationId}/claims`, {
    claim: { justification },
  });
}
