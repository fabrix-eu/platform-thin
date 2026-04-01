import { useState } from 'react';
import { ORG_KINDS } from '../lib/organizations';

const ALL_KINDS = Object.keys(ORG_KINDS);

interface MapLegendProps {
  selectedKinds: string[];
  onKindsChange: (kinds: string[]) => void;
}

export function MapLegend({ selectedKinds, onKindsChange }: MapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);

  const allSelected = selectedKinds.length === ALL_KINDS.length;
  const noneSelected = selectedKinds.length === 0;

  const toggleKind = (kind: string) => {
    if (selectedKinds.includes(kind)) {
      onKindsChange(selectedKinds.filter((k) => k !== kind));
    } else {
      onKindsChange([...selectedKinds, kind]);
    }
  };

  if (collapsed) {
    return (
      <div className="absolute top-2 left-2 z-20">
        <button
          onClick={() => setCollapsed(false)}
          className="bg-white border border-gray-200 shadow-md rounded-md px-2 py-1.5 text-sm hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-2 left-2 bg-white/95 rounded-lg shadow-md z-20 w-60 max-h-[calc(100%-16px)] overflow-auto">
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <span className="font-semibold text-sm">Legend</span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 p-0.5"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-700">Organization Types</span>
          <div className="flex gap-1">
            <button
              onClick={() => onKindsChange(ALL_KINDS)}
              disabled={allSelected}
              className={`text-xs px-1.5 py-0.5 rounded ${allSelected ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
            >
              All
            </button>
            <button
              onClick={() => onKindsChange([])}
              disabled={noneSelected}
              className={`text-xs px-1.5 py-0.5 rounded ${noneSelected ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-50'}`}
            >
              None
            </button>
          </div>
        </div>
        <div className="space-y-0.5">
          {ALL_KINDS.map((kindKey) => {
            const kind = ORG_KINDS[kindKey];
            const hexColor = kind.hex;
            const isSelected = selectedKinds.includes(kindKey);
            return (
              <button
                key={kindKey}
                type="button"
                onClick={() => toggleKind(kindKey)}
                className={`flex items-start gap-2 w-full text-left p-1.5 rounded hover:bg-gray-50 transition-colors ${
                  !isSelected ? 'opacity-40' : ''
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: hexColor }}
                />
                <span className="text-xs leading-tight">{kind.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
