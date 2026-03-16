import { useState } from 'react';
import {
  GoogleAddressAutocomplete,
  type AddressData,
} from '../../components/GoogleAddressAutocomplete';

export function TestGoogleAddressPage() {
  const [result, setResult] = useState<AddressData | null>(null);

  return (
    <div className="max-w-lg mx-auto p-6 mt-12 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Google Address Autocomplete Test
      </h1>
      <p className="text-sm text-gray-500">
        Type an address below. The component should show suggestions from Google
        Places and populate lat/lon on selection.
      </p>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <GoogleAddressAutocomplete
          onSelect={setResult}
        />
      </div>

      {/* Debug output */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-2">
          onSelect result:
        </h2>
        {result ? (
          <pre className="text-xs text-gray-600 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        ) : (
          <p className="text-xs text-gray-400">No address selected yet</p>
        )}
      </div>
    </div>
  );
}
