import { Link, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { BASE } from '../lib/api';

export function VerifyEmailPage() {
  const { token } = useSearch({ strict: false }) as { token?: string };

  const verification = useQuery({
    queryKey: ['verify-email', token],
    queryFn: async () => {
      const res = await fetch(`${BASE}/registrations/verify?token=${token}`);
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Verification failed');
      }
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  if (!token) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Invalid link</h1>
        <p className="text-sm text-gray-500">This verification link is invalid.</p>
      </div>
    );
  }

  if (verification.isLoading) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Verifying...</h1>
        <p className="text-sm text-gray-500">Please wait while we verify your email.</p>
      </div>
    );
  }

  if (verification.isError) {
    return (
      <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Verification failed</h1>
        <p className="text-sm text-gray-500">
          {verification.error instanceof Error ? verification.error.message : 'This link is invalid or has expired.'}
        </p>
        <Link to="/login" className="inline-block text-sm text-primary hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Email verified</h1>
      <p className="text-sm text-gray-500">Your account is now active. You can sign in.</p>
      <Link to="/login" className="inline-block text-sm text-primary hover:underline">
        Sign in
      </Link>
    </div>
  );
}
