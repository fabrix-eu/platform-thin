import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  getNaceCategories,
  getRotterdamCompanies,
  ROTTERDAM_CONFIG,
  VALID_YEARS,
  type ValidYear,
  type RotterdamCompany,
} from '../../lib/data-imports';

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

// ── YearFilter ───────────────────────────────────────────────

function YearFilter({
  value,
  onChange,
}: {
  value: ValidYear;
  onChange: (y: ValidYear) => void;
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <p className="text-sm font-medium mb-2">Year</p>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as ValidYear)}
        className="w-full border border-border rounded-md px-3 py-2 text-sm bg-white"
      >
        {VALID_YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground mt-2">
        Historical data: 1997-2022 (5-year intervals)
      </p>
    </div>
  );
}

// ── Stats ────────────────────────────────────────────────────

function Stats({
  count,
  filters,
  year,
}: {
  count: number;
  filters: number;
  year: ValidYear;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <span className="text-orange-600 text-lg">&#x1F3E2;</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Companies</p>
          <p className="text-xl font-bold">{count.toLocaleString()}</p>
        </div>
      </div>
      <div
        className={`border rounded-lg p-4 flex items-center gap-3 ${
          filters === 0
            ? 'border-orange-200 bg-orange-50'
            : 'border-border'
        }`}
      >
        <div
          className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            filters === 0 ? 'bg-orange-100' : 'bg-teal-100'
          }`}
        >
          <span className={filters === 0 ? 'text-orange-600' : 'text-teal-600'}>&#x25B2;</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Active Filters</p>
          <p className="text-xl font-bold">{filters}</p>
          {filters === 0 && (
            <p className="text-xs text-orange-700">Select categories</p>
          )}
        </div>
      </div>
      <div className="border border-border rounded-lg p-4 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-600">&#x1F4CD;</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="text-sm font-semibold">Rotterdam, NL</p>
          <p className="text-xs text-muted-foreground">Year: {year}</p>
        </div>
      </div>
    </div>
  );
}

// ── Map ──────────────────────────────────────────────────────

function RotterdamMap({
  companies,
  selectedCategories,
  loading,
}: {
  companies: RotterdamCompany[];
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
      center: [ROTTERDAM_CONFIG.center.lng, ROTTERDAM_CONFIG.center.lat],
      zoom: ROTTERDAM_CONFIG.zoom,
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
      if (
        l.id.startsWith('cluster-') ||
        l.id.startsWith('cluster-count-') ||
        l.id.startsWith('unclustered-')
      ) {
        if (m.getLayer(l.id)) m.removeLayer(l.id);
      }
    });
    Object.keys(style.sources ?? {}).forEach((s) => {
      if (s.startsWith('companies-') && m.getSource(s)) m.removeSource(s);
    });

    if (selectedCategories.length === 0 || companies.length === 0) return;

    // Build per-category layers
    const categoryMap = new Map<string, { name: string; color: string }>();
    companies.forEach((c) =>
      c.categories.forEach((cat) => {
        if (selectedCategories.includes(cat.slug))
          categoryMap.set(cat.slug, { name: cat.name, color: cat.color_hex });
      }),
    );

    categoryMap.forEach((info, slug) => {
      const catCompanies = companies.filter((c) =>
        c.categories.some((cat) => cat.slug === slug),
      );
      if (catCompanies.length === 0) return;

      const sourceId = `companies-${slug}`;
      const geojson: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: catCompanies.map((c) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [c.longitude, c.latitude] },
          properties: {
            name: c.name,
            address: c.address,
            jobs: c.jobs,
            sbi_code: c.sbi_code,
            categoryName: info.name,
            color: info.color,
          },
        })),
      };

      m.addSource(sourceId, {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      m.addLayer({
        id: `cluster-${slug}`,
        type: 'circle',
        source: sourceId,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': info.color,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15, 10, 20, 50, 25, 100, 30, 500, 40,
          ],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Cluster labels
      m.addLayer({
        id: `cluster-count-${slug}`,
        type: 'symbol',
        source: sourceId,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: { 'text-color': '#ffffff' },
      });

      // Unclustered points
      m.addLayer({
        id: `unclustered-${slug}`,
        type: 'circle',
        source: sourceId,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': info.color,
          'circle-radius': 8,
          'circle-opacity': 0.9,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Click cluster → zoom
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on('click', `cluster-${slug}`, async (e: any) => {
        if (!e.features?.[0]) return;
        const clusterId = e.features[0].properties.cluster_id;
        const source = m.getSource(sourceId);
        if (!source) return;
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const zoom = await (source as any).getClusterExpansionZoom(clusterId);
          m.easeTo({
            center: e.features[0].geometry.coordinates as [number, number],
            zoom,
          });
        } catch {
          // ignore
        }
      });

      // Click point → popup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      m.on('click', `unclustered-${slug}`, (e: any) => {
        if (!e.features?.[0]) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice();
        const p = e.features[0].properties;
        new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(coords as [number, number])
          .setHTML(
            `<div style="padding:10px;min-width:200px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <span style="width:10px;height:10px;border-radius:3px;background:${p.color}"></span>
                <strong style="font-size:13px">${p.name}</strong>
              </div>
              <div style="font-size:12px;color:#666">
                <p><b>Category:</b> ${p.categoryName}</p>
                <p><b>Address:</b> ${p.address}</p>
                <p><b>Jobs:</b> ${p.jobs}</p>
                <p><b>SBI:</b> ${p.sbi_code}</p>
              </div>
            </div>`,
          )
          .addTo(m);
      });

      // Cursor
      for (const layerId of [`cluster-${slug}`, `unclustered-${slug}`]) {
        m.on('mouseenter', layerId, () => {
          m.getCanvas().style.cursor = 'pointer';
        });
        m.on('mouseleave', layerId, () => {
          m.getCanvas().style.cursor = '';
        });
      }
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
            <h3 className="font-medium text-foreground mb-1">LISA Database</h3>
            <p>
              LISA (Landelijk Informatiesysteem van Arbeidsplaatsen) is the Dutch national
              information system for employment data. It contains comprehensive information
              about all registered businesses in the Netherlands.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Rotterdam Metropolitan Area</h3>
            <p>
              This visualization focuses on the Rotterdam metropolitan area, showing textile
              and fashion industry businesses filtered from the LISA database. Data is available
              for six time periods: 1997, 2002, 2007, 2012, 2017, and 2022.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">Visualization</h3>
            <p>
              Dynamic clustering groups nearby companies. Click clusters to zoom in. Category
              colors are based on SBI/NACE classifications.
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

export function RotterdamPage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<ValidYear>(2022);
  const [aboutOpen, setAboutOpen] = useState(false);

  const companiesQuery = useQuery({
    queryKey: ['rotterdam_companies', selectedYear, selectedCategories],
    queryFn: () =>
      getRotterdamCompanies({ year: selectedYear, categories: selectedCategories }),
    enabled: selectedCategories.length > 0,
  });

  const companies = companiesQuery.data?.companies ?? [];
  const totalCount = companiesQuery.data?.total_count ?? 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            Rotterdam
          </span>
          <span className="text-lg font-semibold">Companies Map</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs border border-border">
            LISA
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100">
            {selectedYear}
          </span>
          {selectedCategories.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-100">
              {selectedCategories.length} filters
            </span>
          )}
          <Link
            to="/data/rotterdam/charts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-gray-50"
          >
            Charts
          </Link>
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
        count={selectedCategories.length > 0 ? (companiesQuery.isLoading ? 0 : totalCount) : 0}
        filters={selectedCategories.length}
        year={selectedYear}
      />

      {/* Map + Sidebar */}
      <div className="flex h-[calc(100vh-380px)] min-h-[500px] border border-border rounded-lg overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-white overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            <YearFilter value={selectedYear} onChange={setSelectedYear} />

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

            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="w-full px-3 py-2 text-sm border border-border rounded-md hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}

            <div className="text-xs text-muted-foreground p-2 bg-gray-50 rounded">
              <p className="font-medium mb-0.5">How to use:</p>
              <ul>
                <li>Click clusters to zoom in</li>
                <li>Click points to see details</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1">
          <RotterdamMap
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
