/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeDeliveryAddress } from '@/lib/location-resolution';

let nominatimQueue = Promise.resolve();
let lastNominatimAt = 0;
const geocodeCache = new Map<string, any[]>();

function queryVariants(address: string, city: string): Array<{ q?: string; street?: string; city?: string }> {
  const base = address.trim();
  if (!base) return [];
  const expanded = base
    .replace(/\b(cra|cr|kr)\.?\b/gi, 'Carrera')
    .replace(/\b(cl|cll)\.?\b/gi, 'Calle')
    .replace(/\b(av|avda|ak)\.?\b/gi, 'Avenida');
  const normalized = normalizeDeliveryAddress(address, city);
  const suffix = city || 'Bogotá';
  const normalizedWithoutCity = normalized.replace(new RegExp(`\\s+${suffix.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*$`, 'i'), '').trim();
  const values: Array<{ q?: string; street?: string; city?: string }> = [
    { q: `${base}, ${suffix}, Colombia` },
    { q: `${expanded}, ${suffix}, Colombia` },
    { q: `${normalized}, Colombia` },
  ];
  if (normalizedWithoutCity) values.push({ street: normalizedWithoutCity, city: suffix });
  return values.filter((value, index, all) => all.findIndex(other => JSON.stringify(other) === JSON.stringify(value)) === index);
}

async function nominatim(query: { q?: string; street?: string; city?: string }) {
  const run = async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastNominatimAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastNominatimAt = Date.now();
    const params = new URLSearchParams({
      format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'co',
      bounded: '1', viewbox: '-74.25,4.85,-73.95,4.45',
      ...(query.q ? { q: query.q } : { street: query.street || '', city: query.city || '', country: 'Colombia' }),
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { 'User-Agent': 'TusAguacates/admin-location-resolution/1.0' },
      next: { revalidate: 86400 },
    });
    if (!response.ok) return [];
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  };
  const result = nominatimQueue.then(run, run);
  nominatimQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function geoapify(query: string) {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      text: query, filter: 'countrycode:co', bias: 'proximity:-74.1,4.65', limit: '5', apiKey,
    });
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`, { next: { revalidate: 86400 } });
    if (!response.ok) return [];
    const body = await response.json();
    return (body.features || []).map((feature: any) => ({
      latitude: Number(feature.properties.lat), longitude: Number(feature.properties.lon),
      label: feature.properties.formatted || query,
      confidence: Number(feature.properties.rank?.confidence || 0) >= 0.9 ? 'alta' : 'media',
      provider: 'geoapify',
    })).filter((candidate: any) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
  } catch {
    return [];
  }
}

export async function geocodeDeliveryAddress(address: string, city: string) {
  const key = normalizeDeliveryAddress(address, city);
  if (!key) return [];
  if (geocodeCache.has(key)) return geocodeCache.get(key) || [];

  const candidates: any[] = [];
  for (const query of queryVariants(address, city)) {
    try {
      const rows = await nominatim(query);
      for (const row of rows) {
        const addr = row.address || {};
        const candidate = {
          latitude: Number(row.lat), longitude: Number(row.lon),
          label: row.display_name || query,
          confidence: addr.house_number && (addr.city || addr.town || addr.municipality) ? 'alta' : 'media',
          provider: 'nominatim',
        };
        if (Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude) && !candidates.some(x => x.latitude === candidate.latitude && x.longitude === candidate.longitude)) candidates.push(candidate);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      // Continue with the next query/provider.
    }
  }

  if (!candidates.length) candidates.push(...await geoapify(`${normalizeDeliveryAddress(address, city)}, Colombia`));
  geocodeCache.set(key, candidates);
  return candidates;
}
