import { Link } from '@tanstack/react-router';

export function RegisterFacilitatorPage() {
  return (
    <div className="max-w-md mx-auto mt-24 p-6 text-center">
      <div className="h-14 w-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-3">Become a Facilitator</h1>

      <p className="text-sm text-gray-500 mb-2">
        Let's tailor your journey — reach out to create your personalised account.
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Set up your own space to monitor your network, support local businesses, and turn data into meaningful action.
      </p>

      <a
        href="mailto:contact@fabrixproject.eu"
        className="inline-flex items-center px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
      >
        Contact Us
      </a>

      <p className="mt-6 text-sm text-gray-500">
        <Link to="/register" className="text-primary hover:underline">
          Choose another registration type
        </Link>
      </p>
    </div>
  );
}
