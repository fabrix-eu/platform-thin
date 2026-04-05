export interface HexbinData {
  q: number;
  r: number;
  lat: number;
  lng: number;
  count: number;
  companies: Array<{ name: string }>;
}

function latLngToHexCoords(lat: number, lng: number, hexRadius: number): [number, number] {
  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180);

  const x = lng * metersPerDegreeLng;
  const y = lat * metersPerDegreeLat;

  const size = hexRadius;
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;

  return hexRound(q, r);
}

function hexRound(q: number, r: number): [number, number] {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return [rq, rr];
}

function hexCoordsToLatLng(
  q: number,
  r: number,
  hexRadius: number,
  referenceLat: number,
): [number, number] {
  const size = hexRadius;
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);

  const metersPerDegreeLat = 111320;
  const metersPerDegreeLng = 111320 * Math.cos((referenceLat * Math.PI) / 180);

  return [y / metersPerDegreeLat, x / metersPerDegreeLng];
}

export function aggregateToHexbins(
  companies: Array<{
    latitude: number;
    longitude: number;
    name: string;
    categories: Array<{ slug: string }>;
  }>,
  hexRadius: number,
  categorySlug: string,
  referenceLat: number,
  minCompanies: number = 5,
): HexbinData[] {
  const hexbinMap = new Map<string, HexbinData>();

  for (const company of companies) {
    if (!company.categories.some((cat) => cat.slug === categorySlug)) continue;

    const [q, r] = latLngToHexCoords(company.latitude, company.longitude, hexRadius);
    const key = `${q},${r}`;

    if (!hexbinMap.has(key)) {
      const [lat, lng] = hexCoordsToLatLng(q, r, hexRadius, referenceLat);
      hexbinMap.set(key, { q, r, lat, lng, count: 0, companies: [] });
    }

    const hexbin = hexbinMap.get(key)!;
    hexbin.count++;
    hexbin.companies.push(company);
  }

  return Array.from(hexbinMap.values()).filter((h) => h.count >= minCompanies);
}
