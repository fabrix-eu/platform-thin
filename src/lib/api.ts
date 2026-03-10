export const BASE = import.meta.env.PROD
  ? 'https://api.fabrixproject.eu'
  : 'http://localhost:4001';

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]>;

  constructor(status: number, errors: Record<string, string[]>, message?: string) {
    super(message || `API Error ${status}`);
    this.status = status;
    this.errors = errors;
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE}/auth_tokens/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return false;

    const json = await res.json();
    const newToken = json.data?.access_token ?? json.access_token;
    if (!newToken) return false;

    localStorage.setItem('access_token', newToken);
    return true;
  } catch {
    return false;
  }
}

function clearTokensAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('access_token');

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  // On 401, try refresh (once) then retry the original request
  if (res.status === 401 && token && !path.startsWith('/auth_tokens')) {
    // Deduplicate concurrent refresh attempts
    if (!refreshPromise) {
      refreshPromise = tryRefresh().finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;

    if (refreshed) {
      return request<T>(method, path, body);
    }

    clearTokensAndRedirect();
    throw new ApiError(401, {}, 'Session expired');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, json.errors || {}, json.error);
  }

  // Unwrap { data: ... } envelope
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
