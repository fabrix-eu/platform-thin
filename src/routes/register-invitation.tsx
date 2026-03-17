import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api, ApiError } from '../lib/api';
import { login } from '../lib/auth';
import { queryClient } from '../lib/queryClient';
import { FormError, FieldError } from '../components/FieldError';

interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  organization: {
    id: string;
    name: string;
  };
  invited_by: {
    id: string;
    name: string;
    email: string;
  };
  expired: boolean;
}

export function RegisterInvitationPage() {
  const { token } = useSearch({ from: '/register-invitation' });
  const navigate = useNavigate();

  const invitationQuery = useQuery({
    queryKey: ['invitation', token],
    queryFn: () => api.get<Invitation>(`/invitations/${token}`),
    enabled: !!token,
    retry: false,
  });

  const mutation = useMutation({
    mutationFn: (formData: FormData) =>
      api.post(`/invitations/${token}/accept`, {
        user: {
          email: invitationQuery.data!.email,
          name: formData.get('name'),
          password: formData.get('password'),
          password_confirmation: formData.get('password_confirmation'),
        },
      }),
    onSuccess: async () => {
      await login(invitationQuery.data!.email, (document.querySelector<HTMLInputElement>('input[name="password"]'))!.value);
      await queryClient.invalidateQueries();
      navigate({ to: '/' });
    },
  });

  // No token
  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid invitation link</h1>
        <p className="text-sm text-gray-500 mb-4">
          This link is missing the invitation token. Please check the link in your email.
        </p>
        <Link to="/login" className="text-primary hover:underline text-sm">
          Go to sign in
        </Link>
      </div>
    );
  }

  // Loading
  if (invitationQuery.isLoading) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center">
        <p className="text-sm text-gray-500">Loading invitation...</p>
      </div>
    );
  }

  // Error states
  if (invitationQuery.error) {
    const err = invitationQuery.error;
    const isExpired = err instanceof ApiError && err.status === 410;
    const isNotFound = err instanceof ApiError && err.status === 404;

    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isExpired ? 'Invitation expired' : 'Invalid invitation link'}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {isExpired
            ? 'This invitation has expired. Please ask the organization to send a new one.'
            : isNotFound
              ? 'This invitation link is invalid or has already been used.'
              : 'Something went wrong. Please try again later.'}
        </p>
        <Link to="/login" className="text-primary hover:underline text-sm">
          Go to sign in
        </Link>
      </div>
    );
  }

  const invitation = invitationQuery.data!;

  return (
    <div className="max-w-sm mx-auto mt-24 p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept invitation</h1>
      <p className="text-sm text-gray-500 mb-6">
        <strong>{invitation.invited_by.name}</strong> invited you to join{' '}
        <strong>{invitation.organization.name}</strong> as {invitation.role}.
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
            type="email"
            value={invitation.email}
            readOnly
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <FieldError mutation={mutation} field="name" />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
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
          {mutation.isPending ? 'Creating account...' : 'Accept & create account'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
