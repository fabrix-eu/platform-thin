import { useState, useEffect, useRef, useCallback } from 'react';
import {
  loadGoogleMapsScript,
  isGoogleMapsLoaded,
} from '../lib/google-maps-loader';

export interface AddressData {
  address: string;
  lat: number;
  lon: number;
  country_code: string;
  city?: string;
  postal_code?: string;
  country_name?: string;
}

interface Props {
  onSelect: (location: AddressData) => void;
  placeholder?: string;
  label?: string;
  initialAddress?: string;
  initialLocation?: AddressData | null;
}

interface AddressSuggestion {
  place_id: string;
  description: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

function PinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

export function GoogleAddressAutocomplete({
  onSelect,
  placeholder = 'Start typing at least 3 characters...',
  label = 'Address',
  initialAddress = '',
  initialLocation = null,
}: Props) {
  const [address, setAddress] = useState(
    initialLocation?.address || initialAddress
  );
  const [selectedLocation, setSelectedLocation] =
    useState<AddressData | null>(initialLocation);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const justSelectedRef = useRef(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load Google Maps
  useEffect(() => {
    const load = async () => {
      if (isGoogleMapsLoaded()) {
        setMapLoaded(true);
        return;
      }
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return;
      try {
        await loadGoogleMapsScript(apiKey);
        setMapLoaded(true);
      } catch {
        // Google Maps not available — will fall back to text input
      }
    };
    load();
  }, []);

  // Initialize services
  useEffect(() => {
    if (mapLoaded && !autocompleteServiceRef.current) {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService();
      const dummyDiv = document.createElement('div');
      placesServiceRef.current =
        new window.google.maps.places.PlacesService(dummyDiv);
    }
  }, [mapLoaded]);

  // Debounced search
  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (!address || address.length < 3 || !autocompleteServiceRef.current) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      autocompleteServiceRef.current.getPlacePredictions(
        { input: address, types: ['address'] },
        (predictions: any, status: any) => {
          if (
            status ===
              window.google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            setSuggestions(
              predictions.map((p: any) => ({
                place_id: p.place_id,
                description: p.description,
              }))
            );
            setSelectedIndex(-1);
          } else {
            setSuggestions([]);
          }
        }
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [address]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handlePlaceSelect = useCallback(
    (placeId: string, description: string) => {
      if (!placesServiceRef.current) return;
      placesServiceRef.current.getDetails(
        { placeId },
        (place: any, status: any) => {
          if (
            status ===
              window.google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            if (lat === undefined || lng === undefined) return;

            const data = extractAddressData(place, lat, lng);
            justSelectedRef.current = true;
            setSelectedLocation(data);
            setAddress(place.formatted_address || description);
            onSelect(data);
            setSuggestions([]);
          }
        }
      );
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? suggestions.length - 1 : prev - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          const s = suggestions[selectedIndex];
          handlePlaceSelect(s.place_id, s.description);
        }
        break;
      case 'Escape':
        setSuggestions([]);
        break;
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor="address-autocomplete"
        className="block text-sm font-medium text-gray-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="address-autocomplete"
          type="text"
          value={address}
          onChange={(e) => {
            const value = e.target.value;
            setAddress(value);
            if (selectedLocation && value !== selectedLocation.address) {
              setSelectedLocation(null);
            }
            // Fallback: when Google Maps is not loaded, emit raw address
            if (!mapLoaded && value.length >= 3) {
              onSelect({
                address: value,
                lat: 0,
                lon: 0,
                country_code: '',
              });
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />

        {suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1"
          >
            {suggestions.map((s, i) => (
              <button
                key={s.place_id}
                type="button"
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                  i === selectedIndex ? 'bg-blue-50 text-blue-700' : ''
                }`}
                onClick={() => handlePlaceSelect(s.place_id, s.description)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <PinIcon className="h-4 w-4 text-gray-400 shrink-0" />
                {s.description}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedLocation && (
        <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
          <PinIcon className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Selected location:</div>
            <div className="text-green-600">{selectedLocation.address}</div>
            {selectedLocation.city && selectedLocation.country_name && (
              <div className="text-xs text-green-500 mt-1">
                {selectedLocation.city}, {selectedLocation.country_name}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function extractAddressData(
  place: any,
  lat: number,
  lng: number
): AddressData {
  let country_code = '';
  let city = '';
  let postal_code = '';
  let country_name = '';

  if (place.address_components) {
    place.address_components.forEach((component: any) => {
      const types = component.types;
      if (types.includes('country')) {
        country_code = component.short_name;
        country_name = component.long_name;
      }
      if (
        types.includes('locality') ||
        types.includes('administrative_area_level_2')
      ) {
        city = component.long_name;
      }
      if (types.includes('postal_code')) {
        postal_code = component.long_name;
      }
    });
  }

  return {
    address: place.formatted_address,
    lat,
    lon: lng,
    country_code: country_code.toLowerCase(),
    city,
    postal_code,
    country_name,
  };
}
