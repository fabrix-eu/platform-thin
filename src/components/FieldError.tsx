import { ApiError } from '../lib/api';
import type { UseMutationResult } from '@tanstack/react-query';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyMutation = UseMutationResult<any, Error, any, any>;

export function FieldError({ mutation, field }: {
  mutation: AnyMutation;
  field: string;
}) {
  if (!(mutation.error instanceof ApiError)) return null;
  const errors = mutation.error.errors?.[field];
  if (!errors?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{errors[0]}</p>;
}

export function FormError({ mutation }: { mutation: AnyMutation }) {
  const error = mutation.error;
  if (!error) return null;

  let msg: string;
  if (error instanceof ApiError) {
    const base = error.errors?.base;
    if (base?.[0]) {
      msg = base[0];
    } else if (error.message && !error.message.startsWith('API Error')) {
      msg = error.message;
    } else {
      switch (error.status) {
        case 401: msg = 'You need to sign in to continue.'; break;
        case 403: msg = 'You don\u2019t have permission to do this.'; break;
        case 404: msg = 'The requested resource was not found.'; break;
        case 422: msg = 'Please correct the errors below.'; break;
        case 500: msg = 'A server error occurred. Please try again later.'; break;
        default:  msg = 'Something went wrong. Please try again.'; break;
      }
    }
  } else {
    msg = error.message;
  }

  return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{msg}</p>;
}
