import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getNaceCategories,
  getAthensCompanies,
  ATHENS_CONFIG,
  type AthensCompany,
} from '../../lib/data-imports';
import { aggregateToHexbins } from '../../lib/hexbin';

// ── CategoryFilter ───────────────────────────────────────────

function CategoryFilter({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (cats: string[]) => void;
}) {
  const query = useQuery({
    queryKey: ['nace_categories'],
    queryFn: getNaceCategories,
  });

  if (query.isLoading) {
    return (
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm font-medium mb-2">Categories</p>
        <div className="flex justify-center py-6">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const categories = query.data ?? [];

  const toggle = (slug: string) => {
    onChange(
      selected.includes(slug)
        ? selected.filter((s) => s !== slug)
        : [...selected, slug],
    );
  };

  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-sm font-medium mb-1">Categories</p>
      <p className="text-xs text-muted-foreground mb-3">
        {selected.length} selected
      </p>
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {categories.map((cat) => (
          <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(cat.slug)}
              onChange={() => toggle(cat.slug)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: cat.color_hex }}
            />
            <span className="text-sm">{cat.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────

function Stats({ count, filters }: { count: number; filters: number }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
          <span className="text-cyan-600 text-lg">&#x1F3E2;</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Companies</p>
          <p className="text-xl font-bold">{count.toLocaleString()}</p>
        </div>
      </div>
      <div
        className={`border rounded-lg p-4 flex items-center gap-3 ${
          filters === 0 ? 'border-cyan-200 bg-cyan-50' : 'border-border'
        }`}
      >
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            filters === 0 ? 'bg-cyan-100' : 'bg-teal-100'
          }`}
        >
          <span className={filters === 0 ? 'text-cyan-600' : 'text-teal-600'}>
            &#x25B2;
          </span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Active Filters</p>
          <p className="text-xl font-bold">{filters}</p>
          {filters === 0 && (
            <p className="text-xs text-cyan-700">Select categories</p>
          )}
        </div>
      </div>
      <div className="border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600">&#x1F4CD;</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="text-sm font-semibold">Athens, Greece</p>
        </div>
      </div>
    </div>
  );
}

// ── Map ──────────────────────────────────────────────────────

function AthensMap({
  companies,
  selectedCategories,
  loading,
}: {
  companies: AthensCompany[];
  selectedCategories: string[];
  loading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const m = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap Contributors',
            maxzoom: 19,
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [ATHENS_CONFIG.center.lng, ATHENS_CONFIG.center.lat],
      zoom: ATHENS_CONFIG.zoom,
    });

    mapRef.current = m;
    m.addControl(new maplibregl.NavigationControl(), 'top-right');
    m.on('load', () => setMapLoaded(true));

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const updateLayers = useCallback(() => {
    const m = mapRef.current;
    if (!m || !mapLoaded) return;

    // Clean existing layers
    const style = m.getStyle();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    style.layers?.forEach((l: any) => {
      if (l.id.startsWith('hexbin-') && m.getLayer(l.id)) m.removeLayer(l.id);
    });
    Object.keys(style.sources ?? {}).forEach((s) => {
      if (s.startsWith('hexbin-') && m.getSource(s)) m.removeSource(s);
    });

    if (selectedCategories.length === 0 || companies.length === 0) return;

    // Build category map
    const categoryMap = new Map<string, { name: string; color: string }>();
    companies.forEach((c) =>
      c.categories.forEach((cat) => {
        if (selectedCategories.includes(cat.slug))
          categoryMap.set(cat.slug, { name: cat.name, color: cat.color_hex });
      }),
    );

    categoryMap.forEach((info, slug) => {
      const hexbins = aggregateToHexbins(
        companies,
        ATHENS_CONFIG.hexbinRadius,
        slug,
        ATHENS_CONFIG.center.lat,
        5,
      );
      if (hexbins.length === 0) return;

      const sourceId = `hexbin-${slug}`;
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: hexbins.map((h) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [h.lng, h.lat] },
          properties: {
            count: h.count,
            categoryName: info.name,
            color: info.color,
            companyNames: h.companies
              .map((c) => c.business_name)
              .slice(0, 5)
              .join(', '),
            totalCompanies: h.count,
          },
        })),
      };

      m.addSource(sourceId, { type: 'geojson', data: geojson });

      // Hexbin circles
      m.addLayer({
        id: `hexbin-${slug}`,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-color': info.color,
          'circle-radius': ['+', 10, ['*', ['sqrt', ['get', 'count']], 2]],
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Count labels
      m.addLayer({
        id: `hexbin-label-${slug}`,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['get', 'count'],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 11,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Click → popup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on('click', `hexbin-${slug}`, (e: any) => {
        if (!e.features?.[0]) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice();
        const p = e.features[0].properties;
        const more =
          p.totalCompanies > 5 ? ` and ${p.totalCompanies - 5} more...` : '';
        new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(coords as [number, number])
          .setHTML(
            `<div style="padding:10px;min-width:200px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="width:10px;height:10px;border-radius:3px;background:${p.color}"></span>
                <strong style="font-size:13px">${p.categoryName}</strong>
              </div>
              <div style="font-size:12px;color:#666">
                <p><b>Companies:</b> ${p.totalCompanies}</p>
                <p style="margin-top:4px">${p.companyNames}${more}</p>
              </div>
            </div>`,
          )
          .addTo(m);
      });

      // Cursor
      m.on('mouseenter', `hexbin-${slug}`, () => {
        m.getCanvas().style.cursor = 'pointer';
      });
      m.on('mouseleave', `hexbin-${slug}`, () => {
        m.getCanvas().style.cursor = '';
      });
    });
  }, [companies, selectedCategories, mapLoaded]);

  useEffect(() => {
    const t = setTimeout(updateLayers, 100);
    return () => clearTimeout(t);
  }, [updateLayers]);

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 bg-white/75 flex items-center justify-center z-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// ── About modal ──────────────────────────────────────────────

function AboutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[70vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">About the Data</h2>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-medium text-foreground mb-1">
              General Commercial Register (GEMI)
            </h3>
            <p>
              GEMI is the official General Commercial Register of Greece, containing
              comprehensive information about all registered companies, including their
              business activities, addresses, and NACE code classifications.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Visualization</h3>
            <p>
              This map uses hexagonal binning to aggregate companies into geographic cells.
              Each hexagon represents a fixed area (~500m radius) with square root scaling
              for circle sizes. Minimum threshold: 5 companies per hexbin.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">NACE Classification</h3>
            <p>
              Companies are classified using NACE codes. Each company has a primary NACE
              code and may have secondary codes. You can toggle secondary code matching
              in the sidebar.
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export function AthensPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [includeSecondary, setIncludeSecondary] = useState(true);
  const [aboutOpen, setAboutOpen] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ['athens_companies', selectedCategories, includeSecondary],
    queryFn: () =>
      getAthensCompanies({
        categories: selectedCategories,
        include_secondary_nace_codes: includeSecondary,
      }),
    enabled: selectedCategories.length > 0,
  });

  const companies = companiesQuery.data?.companies ?? [];
  const totalCount = companiesQuery.data?.total_count ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-800">
            Athens
          </span>
          <span className="text-lg font-semibold">Companies Map</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-border">
            GEMI
          </span>
          {selectedCategories.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100">
              {selectedCategories.length} filters
            </span>
          )}
          <button
            onClick={() => setAboutOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-gray-50"
          >
            About
          </button>
        </div>
      </div>

      {/* Stats */}
      <Stats
        count={
          selectedCategories.length > 0
            ? companiesQuery.isLoading
              ? 0
              : totalCount
            : 0
        }
        filters={selectedCategories.length}
      />

      {/* Map + Sidebar */}
      <div className="flex h-[calc(100vh-380px)] min-h-[500px] border border-border rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-white overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {selectedCategories.length === 0 && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-900">
                  Select categories below
                </p>
                <p className="text-xs text-blue-700">
                  Choose at least one category to visualize companies on the map.
                </p>
              </div>
            )}

            <CategoryFilter
              selected={selectedCategories}
              onChange={setSelectedCategories}
            />

            {/* Secondary NACE codes toggle */}
            <div className="border border-border rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSecondary}
                  onChange={(e) => setIncludeSecondary(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-gray-300"
                />
                <div>
                  <span className="text-sm font-medium">
                    Include secondary NACE codes
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Match companies by both primary and secondary codes
                  </p>
                </div>
              </label>
            </div>

            {(selectedCategories.length > 0 || includeSecondary) && (
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setIncludeSecondary(true);
                }}
                className="w-full px-3 py-2 text-sm border border-border rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}

            <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
              <p className="font-medium mb-0.5">Configuration:</p>
              <ul>
                <li>Min: 5 companies/hexbin</li>
                <li>Radius: {ATHENS_CONFIG.hexbinRadius}m</li>
                <li>Size: sqrt(count) scaling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <AthensMap
            companies={companies}
            selectedCategories={selectedCategories}
            loading={companiesQuery.isLoading}
          />
        </div>
      </div>

      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
