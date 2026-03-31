import { api } from './api';

export interface OrganizationPhoto {
  id: string;
  url: string;
  caption: string | null;
  position: number;
}

export async function getOrganizationPhotos(orgId: string): Promise<OrganizationPhoto[]> {
  return api.get<OrganizationPhoto[]>(`/organizations/${orgId}/photos`);
}

export async function createOrganizationPhoto(
  orgId: string,
  data: { url: string; caption?: string },
): Promise<OrganizationPhoto> {
  return api.post<OrganizationPhoto>(`/organizations/${orgId}/photos`, { photo: data });
}

export async function updateOrganizationPhoto(
  orgId: string,
  photoId: string,
  data: { caption?: string },
): Promise<OrganizationPhoto> {
  return api.patch<OrganizationPhoto>(`/organizations/${orgId}/photos/${photoId}`, { photo: data });
}

export async function deleteOrganizationPhoto(
  orgId: string,
  photoId: string,
): Promise<void> {
  return api.delete(`/organizations/${orgId}/photos/${photoId}`);
}
