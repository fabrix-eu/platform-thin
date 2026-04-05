import { api, BASE } from './api';

// ── Types ────────────────────────────────────────────────────

export interface NaceCategory {
  id: string;
  name: string;
  slug: string;
  color_hex: string;
  nace_codes: string[];
}

export interface RotterdamCompany {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sbi_code: string;
  jobs: number;
  year: number;
  categories: NaceCategory[];
}

export interface AthensCompany {
  id: string;
  business_name: string;
  address: string;
  latitude: number;
  longitude: number;
  status: string;
  primary_nace_code: string;
  secondary_nace_codes: string[];
  categories: NaceCategory[];
}

export interface ChartData {
  year: number;
  count: number;
}

export type ValidYear = 1997 | 2002 | 2007 | 2012 | 2017 | 2022;

export const VALID_YEARS: ValidYear[] = [2022, 2017, 2012, 2007, 2002, 1997];

// ── Config ───────────────────────────────────────────────────

export const ROTTERDAM_CONFIG = {
  minBubblePoints: 10,
  center: { lat: 51.9244, lng: 4.4777 } as const,
  zoom: 11,
};

export const ATHENS_CONFIG = {
  minBubblePoints: 10,
  center: { lat: 37.9838, lng: 23.7275 } as const,
  zoom: 11,
  hexbinRadius: 500,
};

// ── Helpers ──────────────────────────────────────────────────

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildQS(params: Record<string, string | string[] | boolean | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => qs.append(`${key}[]`, v));
    } else {
      qs.set(key, String(val));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

// ── API functions ────────────────────────────────────────────

export async function getNaceCategories(): Promise<NaceCategory[]> {
  return api.get<NaceCategory[]>('/data_imports/nace_categories');
}

export async function getRotterdamCompanies(filters: {
  year: ValidYear;
  categories?: string[];
}): Promise<{ companies: RotterdamCompany[]; total_count: number; year: number }> {
  const qs = buildQS({
    year: filters.year,
    categories: filters.categories,
  });
  const res = await fetch(`${BASE}/data_imports/rotterdam_companies${qs}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return {
    companies: json.data ?? [],
    total_count: json.meta?.total_count ?? 0,
    year: json.meta?.year ?? filters.year,
  };
}

export async function getAthensCompanies(filters: {
  categories?: string[];
  include_secondary_nace_codes?: boolean;
}): Promise<{ companies: AthensCompany[]; total_count: number }> {
  const qs = buildQS({
    categories: filters.categories,
    include_secondary_nace_codes: filters.include_secondary_nace_codes,
    format: 'points',
  });
  const res = await fetch(`${BASE}/data_imports/athens_companies${qs}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return {
    companies: json.data ?? [],
    total_count: json.meta?.total_count ?? 0,
  };
}

export async function getCompaniesEvolution(): Promise<ChartData[]> {
  return api.get<ChartData[]>('/data_imports/charts/companies_evolution');
}

export async function getJobsEvolution(): Promise<ChartData[]> {
  return api.get<ChartData[]>('/data_imports/charts/jobs_evolution');
}
