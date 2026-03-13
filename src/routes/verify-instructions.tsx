import { Link } from '@tanstack/react-router';

export function VerifyInstructionsPage() {
  return (
    <div className="max-w-sm mx-auto mt-24 p-6 text-center space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Check your inbox</h1>
      <p className="text-sm text-gray-500">
        We sent you a verification email. Click the link inside to activate your account.
      </p>
      <Link to="/login" className="inline-block text-sm text-primary hover:underline">
        Back to login
      </Link>
    </div>
  );
}
