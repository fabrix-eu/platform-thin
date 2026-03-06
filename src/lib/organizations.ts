import { api, BASE } from './api';

export const ORG_KINDS: Record<string, { label: string; color: string }> = {
  brand_retailer: { label: 'Brand / Retailer', color: 'bg-violet-100 text-violet-800' },
  producer: { label: 'Producer', color: 'bg-emerald-100 text-emerald-800' },
  facility_factory_supplier_vendor: { label: 'Facility / Supplier', color: 'bg-blue-100 text-blue-800' },
  collector_sorter: { label: 'Collector / Sorter', color: 'bg-amber-100 text-amber-800' },
  recycler: { label: 'Recycler', color: 'bg-teal-100 text-teal-800' },
  academic_researcher_journalist_student: { label: 'Academic / Research', color: 'bg-indigo-100 text-indigo-800' },
  auditor_certification_service_provider: { label: 'Auditor / Service', color: 'bg-rose-100 text-rose-800' },
  civil_society_organization: { label: 'Civil Society', color: 'bg-orange-100 text-orange-800' },
  multi_stakeholder_initiative: { label: 'Multi-stakeholder', color: 'bg-cyan-100 text-cyan-800' },
  union: { label: 'Union', color: 'bg-pink-100 text-pink-800' },
  other: { label: 'Other', color: 'bg-gray-100 text-gray-800' },
};

export interface Organization {
  id: string;
  name: string;
  slug: string;
  kind: string | null;
  description: string | null;
  address: string | null;
  country_code: string | null;
  number_of_workers: number | null;
  image_url: string | null;
  claimed: boolean;
  relations_count: number;
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
