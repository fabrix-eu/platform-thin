import { BASE } from './api';

interface PresignedResponse {
  url: string;
  key: string;
}

const S3_BUCKET_URL = import.meta.env.PROD
  ? 'https://fabrix-platform.s3.nl-ams.scw.cloud'
  : 'https://fabrix-platform.s3.nl-ams.scw.cloud';

/**
 * Upload a file to S3 via presigned URL.
 * Returns the final public URL of the uploaded file.
 */
export async function uploadFile(
  file: File,
  model: string,
  modelId: string,
): Promise<string> {
  const token = localStorage.getItem('access_token');

  // 1. Get presigned URL
  const qs = new URLSearchParams({
    model,
    model_id: modelId,
    filename: `${Date.now()}-${file.name}`,
    content_type: file.type,
  });

  const presignRes = await fetch(`${BASE}/uploads/presigned_url?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!presignRes.ok) throw new Error('Failed to get presigned URL');
  const { url, key } = (await presignRes.json()) as PresignedResponse;

  // 2. Upload to S3
  const uploadRes = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) throw new Error('Failed to upload file');

  // 3. Return final URL
  return `${S3_BUCKET_URL}/${key}`;
}
