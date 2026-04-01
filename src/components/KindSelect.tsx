import { useState } from 'react';
import { ORG_KINDS } from '../lib/organizations';

interface KindSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function KindSelect({ value, onChange }: KindSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? ORG_KINDS[value] : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selected.badgeColor}`}>
              {selected.label}
            </span>
          </span>
        ) : (
          <span className="text-gray-400">Select a type...</span>
        )}
        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto py-1">
            {Object.entries(ORG_KINDS).map(([key, { label, badgeColor }]) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => { onChange(key); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 ${
                    key === value ? 'bg-gray-50' : ''
                  }`}
                >
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                    {label}
                  </span>
                  {key === value && (
                    <svg className="w-4 h-4 text-primary ml-auto" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
