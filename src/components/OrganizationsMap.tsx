import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Organization } from '../lib/organizations';
import { ORG_KINDS } from '../lib/organizations';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

interface OrganizationsMapProps {
  organizations: Organization[];
  height?: string;
  selectedKinds: string[];
  linkBuilder?: (org: { id: string; slug: string }) => string;
}

function getKindColor(org: { kind: string | null }): string {
  return ORG_KINDS[org.kind ?? '']?.hex ?? '#6B7280';
}

export function OrganizationsMap({ organizations, height = '500px', selectedKinds, linkBuilder }: OrganizationsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filter orgs with valid coords + matching selected kinds
  const validOrgs = organizations.filter(
    (org) =>
      org.lat != null && org.lon != null &&
      !isNaN(org.lat) && !isNaN(org.lon) &&
      (selectedKinds.length === 0 || (org.kind && selectedKinds.includes(org.kind)))
  );

  const getDefaultCenter = useCallback((): [number, number] => {
    if (validOrgs.length === 0) return [4.9, 52.4];
    const avgLon = validOrgs.reduce((s, o) => s + o.lon!, 0) / validOrgs.length;
    const avgLat = validOrgs.reduce((s, o) => s + o.lat!, 0) / validOrgs.length;
    return [avgLon, avgLat];
  }, [validOrgs]);

  // Init map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: getDefaultCenter(),
      zoom: 5,
    });

    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.on('load', () => setMapLoaded(true));

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update layer
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const map = mapRef.current;

    const update = () => {
      if (map.getLayer('organizations-circles')) map.removeLayer('organizations-circles');
      if (map.getSource('organizations')) map.removeSource('organizations');

      if (validOrgs.length === 0) return;

      const geojson = {
        type: 'FeatureCollection' as const,
        features: validOrgs.map((org) => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [org.lon!, org.lat!] },
          properties: {
            id: org.id,
            name: org.name,
            slug: org.slug,
            kind: org.kind,
            address: org.address || '',
            color: getKindColor(org),
          },
        })),
      };

      map.addSource('organizations', { type: 'geojson', data: geojson });
      map.addLayer({
        id: 'organizations-circles',
        type: 'circle',
        source: 'organizations',
        paint: {
          'circle-radius': 8,
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Click popup
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('click', 'organizations-circles', (e: any) => {
        if (!e.features?.length) return;
        const feature = e.features[0];
        const coords = feature.geometry.coordinates.slice();
        const p = feature.properties;

        const link = linkBuilder
          ? linkBuilder({ id: p?.id, slug: p?.slug })
          : `/organizations/${p?.slug || p?.id}`;

        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ offset: 12, closeButton: true, maxWidth: '300px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding:12px;min-width:180px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                <span style="width:12px;height:12px;border-radius:50%;flex-shrink:0;background:${p?.color}"></span>
                <strong style="font-size:13px">${p?.name || 'Unknown'}</strong>
              </div>
              ${p?.address ? `<p style="font-size:12px;color:#666;margin-bottom:8px">${p.address}</p>` : ''}
              <a href="${link}" style="font-size:12px;color:#6d28d9">View details →</a>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'organizations-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'organizations-circles', () => { map.getCanvas().style.cursor = ''; });

      // Fit bounds
      const bounds = new maplibregl.LngLatBounds();
      validOrgs.forEach((o) => bounds.extend([o.lon!, o.lat!]));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 14, duration: 1000 });
      }
    };

    const timer = setTimeout(update, 100);
    return () => clearTimeout(timer);
  }, [validOrgs, mapLoaded]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: '100%', height, borderRadius: '8px' }}
    />
  );
}
