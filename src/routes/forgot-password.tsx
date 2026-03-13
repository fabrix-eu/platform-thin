import { Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { FormError } from '../components/FieldError';

export function ForgotPasswordPage() {
  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post('/forgot_password', { email: formData.get('email') }),
  });

  if (mutation.isSuccess) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
        <p className="text-sm text-gray-500">
          If an account exists with that email, we've sent password reset instructions.
        </p>
        <Link to="/login" className="text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-24 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot password</h1>
      <p className="text-sm text-gray-500 mb-6">
        Enter your email and we'll send you a link to reset your password.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(new FormData(e.currentTarget));
        }}
        className="space-y-4"
      >
        <FormError mutation={mutation} />

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {mutation.isPending ? 'Sending...' : 'Send reset link'}
        </button>

        <div className="text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
}
