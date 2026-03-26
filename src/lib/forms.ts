import { api } from './api';

// ── Types ────────────────────────────────────────────────────

export interface FormChoice {
  value: string;
  label: string;
  points?: number;
}

export interface FormRow {
  value: string;
  label: string;
  points_per_value?: Record<string, number>;
}

export interface QuestionCondition {
  depends_on: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in';
  values: string | string[];
}

export interface FormQuestion {
  id: string;
  text: string;
  key: string;
  section_id: string;
  field_type: 'text' | 'email' | 'rating' | 'select' | 'multiselect' | 'table';
  required?: boolean;
  options?: {
    choices?: FormChoice[];
    rows?: FormRow[];
    scale?: number[];
    points?: number;
  };
  condition?: QuestionCondition;
}

export interface FormSection {
  id: string;
  form_id: string;
  key: string;
  title: string;
  description: string;
  questions: FormQuestion[];
}

export interface Form {
  id: string;
  title: string;
  description: string;
  key: string;
  icon_name: string;
  sections: FormSection[];
}

// ── Helpers ──────────────────────────────────────────────────

/** Check if a question should be visible given current responses */
export function isQuestionVisible(
  question: FormQuestion,
  responses: Record<string, unknown>,
): boolean {
  if (
    !question.condition ||
    typeof question.condition !== 'object' ||
    Object.keys(question.condition).length === 0
  ) {
    return true;
  }

  const { depends_on, operator, values } = question.condition;
  if (!depends_on || !operator) return true;

  const dep = responses[depends_on];
  if (dep === undefined) return false;

  const depStr = String(dep);
  switch (operator) {
    case 'equals':
      return depStr === String(values);
    case 'not_equals':
      return depStr !== String(values);
    case 'in':
      return Array.isArray(values) && values.some((v) => String(v) === depStr);
    case 'not_in':
      return Array.isArray(values) && !values.some((v) => String(v) === depStr);
    default:
      return true;
  }
}

/** Get all visible questions from a form given responses */
export function getVisibleQuestions(
  form: Form,
  responses: Record<string, unknown>,
): FormQuestion[] {
  return form.sections.flatMap((s) =>
    s.questions.filter((q) => isQuestionVisible(q, responses)),
  );
}

/** Check if a response value is non-empty */
export function isAnswered(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0) return false;
  return true;
}

// ── API ──────────────────────────────────────────────────────

export async function getForms(): Promise<Form[]> {
  return api.get('/forms');
}

export interface FormWithAnswers extends Form {
  answers: Array<{
    id: string;
    form_id: string;
    organization_id: string;
    user_id: string;
    responses: Record<string, unknown>;
    status: string;
    total_points: number;
    normalized_score: number;
    created_at: string;
    updated_at: string;
  }>;
}

/** GET /forms?organization_id=UUID — returns forms with embedded answers for that org */
export async function getFormsWithAnswers(organizationId: string): Promise<FormWithAnswers[]> {
  return api.get(`/forms?organization_id=${organizationId}`);
}

export async function getForm(idOrKey: string): Promise<Form> {
  return api.get(`/forms/${idOrKey}`);
}
