import { api } from './api';

// ── Types ────────────────────────────────────────────────────

export type AnswerStatus = 'draft' | 'in_progress' | 'completed';

export interface Answer {
  id: string;
  form_id: string;
  organization_id: string;
  user_id: string;
  responses: Record<string, unknown>;
  status: AnswerStatus;
  total_points: number;
  normalized_score: number;
  created_at: string;
  updated_at: string;
}

// ── API ──────────────────────────────────────────────────────

export async function getAnswers(
  organizationId: string,
  formId: string,
): Promise<Answer[]> {
  return api.get(`/answers?organization_id=${organizationId}&form_id=${formId}`);
}

export async function getLatestAnswer(
  organizationId: string,
  formIdOrKey: string,
): Promise<Answer | null> {
  try {
    return await api.get(`/answers/latest?organization_id=${organizationId}&form_id=${formIdOrKey}`);
  } catch {
    // 404 = no answer yet, expected case
    return null;
  }
}

export async function getAnswer(id: string): Promise<Answer> {
  return api.get(`/answers/${id}`);
}

export async function createAnswer(params: {
  form_id: string;
  organization_id: string;
  responses: Record<string, unknown>;
}): Promise<Answer> {
  return api.post('/answers', { answer: params });
}

export async function updateAnswer(
  id: string,
  params: { responses: Record<string, unknown> },
): Promise<Answer> {
  return api.patch(`/answers/${id}`, { answer: params });
}
