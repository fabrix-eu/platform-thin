import { Link, useSearch } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FormError, FieldError } from '../components/FieldError';

export function ResetPasswordPage() {
  const { token } = useSearch({ strict: false }) as { token?: string };

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/reset_password', {
        token,
        password: formData.get('password'),
        password_confirmation: formData.get('password_confirmation'),
      }),
  });

  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Invalid link</h1>
        <p className="text-sm text-gray-500">This password reset link is invalid or has expired.</p>
        <Link to="/forgot-password" className="text-sm text-primary hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  if (mutation.isSuccess) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Password changed</h1>
        <p className="text-sm text-gray-500">Your password has been successfully reset.</p>
        <Link to="/login" className="text-sm text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-24 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset your password</h1>
      <p className="text-sm text-gray-500 mb-6">Choose a new password for your account.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(new FormData(e.currentTarget));
        }}
        className="space-y-4"
      >
        <FormError mutation={mutation} />

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="password" />
        </div>

        <div>
          <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="password_confirmation" />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
}
