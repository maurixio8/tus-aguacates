/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeDeliveryAddress } from '@/lib/location-resolution';

export type GeocodeLevel = 'fuerte' | 'ambiguo' | 'calle';

export interface GeocodingCandidate {
  latitude: number;
  longitude: number;
  label: string;
  confidence: 'alta' | 'media' | 'baja';
  provider: 'google' | 'nominatim' | 'geoapify' | string;
  matchType?: string | null;
  confidenceBuildingLevel?: number | null;
  confidenceCityLevel?: number | null;
  confidenceStreetLevel?: number | null;
  providerConfidence?: number | null;
  locality?: string | null;
  resultType?: string | null;
  locationType?: string | null;
  partialMatch?: boolean;
  types?: string[];
  hasStreetNumber?: boolean;
  multipleResults?: boolean;
  geocodeLevel?: GeocodeLevel;
}

let nominatimQueue = Promise.resolve();
let lastNominatimAt = 0;
const geocodeCache = new Map<string, GeocodingCandidate[]>();
const GEOAPIFY_BIAS = 'proximity:-74.15534,4.63205';

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

function structuredQuery(address: string, city: string) {
  const value = normalizeDeliveryAddress(address, city)
    .replace(/\s+(bogota|bogotá)\s*$/i, '')
    .trim();

  const hash = value.match(/^(.*?)\s+#\s*([0-9]+[a-z]?)\s*(?:-\s*([0-9]+[a-z]?))?(?:\s+([0-9]+[a-z]?))?/i);
  if (hash) {
    const second = hash[3] || hash[4];
    return { street: hash[1].trim(), housenumber: `${hash[2]}${second ? `-${second}` : ''}`, city: city || 'Bogotá', country: 'Colombia' };
  }

  const hyphen = value.match(/^(.*?)\s+([0-9]+[a-z]?-[0-9]+[a-z]?)(?:\s|$)/i);
  if (hyphen) return { street: hyphen[1].trim(), housenumber: hyphen[2], city: city || 'Bogotá', country: 'Colombia' };

  const spaced = value.match(/^(.*?)\s+([0-9]+)\s+([a-z])\s+([0-9]+)(?:\s|$)/i);
  if (spaced) return { street: spaced[1].trim(), housenumber: `${spaced[2]}${spaced[3]}-${spaced[4]}`, city: city || 'Bogotá', country: 'Colombia' };

  return { street: value, housenumber: '', city: city || 'Bogotá', country: 'Colombia' };
}

function hasSingleStrong(candidate: GeocodingCandidate, total: number) {
  if (total !== 1) return false;
  if (candidate.provider === 'google') {
    return candidate.locationType === 'ROOFTOP' && candidate.hasStreetNumber === true && (candidate.types || []).some(type => type === 'street_address' || type === 'premise') && candidate.partialMatch !== true;
  }
  if (candidate.provider === 'geoapify') return candidate.matchType === 'full_match' && Number(candidate.confidenceBuildingLevel) >= 1;
  return candidate.confidence === 'alta';
}

async function googleGeocode(address: string, city: string): Promise<GeocodingCandidate[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return [];
  try {
    const query = structuredQuery(address, city);
    const text = `${query.street} ${query.housenumber}, ${query.city}, ${query.country}`.replace(/\s+/g, ' ').trim();
    const params = new URLSearchParams({ address: text, components: 'country:CO|locality:Bogotá', region: 'co', language: 'es', key: apiKey });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`, { next: { revalidate: 86400 } });
    if (!response.ok) return [];
    const body = await response.json();
    const rows = Array.isArray(body.results) ? body.results : [];
    return rows.map((row: any): GeocodingCandidate => {
      const components = row.address_components || [];
      const streetNumber = components.find((component: any) => (component.types || []).includes('street_number'))?.long_name || null;
      const locality = components.find((component: any) => (component.types || []).includes('sublocality'))?.long_name
        || components.find((component: any) => (component.types || []).includes('locality'))?.long_name
        || null;
      const types = Array.isArray(row.types) ? row.types : [];
      const locationType = row.geometry?.location_type || null;
      const partialMatch = row.partial_match === true;
      const strong = locationType === 'ROOFTOP' && Boolean(streetNumber) && types.some((type: string) => type === 'street_address' || type === 'premise') && !partialMatch && rows.length === 1;
      return {
        latitude: Number(row.geometry?.location?.lat), longitude: Number(row.geometry?.location?.lng), label: row.formatted_address || text,
        confidence: strong ? 'alta' : locationType === 'GEOMETRIC_CENTER' || locationType === 'APPROXIMATE' ? 'baja' : 'media', provider: 'google',
        matchType: strong ? 'full_match' : locationType || null, locality, resultType: types[0] || null, locationType, partialMatch, types,
        hasStreetNumber: Boolean(streetNumber), multipleResults: rows.length > 1,
      };
    }).filter((candidate: GeocodingCandidate) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
  } catch {
    return [];
  }
}

async function nominatim(query: { q?: string; street?: string; city?: string }) {
  const run = async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastNominatimAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastNominatimAt = Date.now();
    const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'co', bounded: '1', viewbox: '-74.25,4.85,-73.95,4.45', ...(query.q ? { q: query.q } : { street: query.street || '', city: query.city || '', country: 'Colombia' }) });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'User-Agent': 'TusAguacates/admin-location-resolution/1.0' }, next: { revalidate: 86400 } });
    if (!response.ok) return [];
    const rows = await response.json();
    return Array.isArray(rows) ? rows : [];
  };
  const result = nominatimQueue.then(run, run);
  nominatimQueue = result.then(() => undefined, () => undefined);
  return result;
}

async function geoapify(address: string, city: string): Promise<GeocodingCandidate[]> {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) return [];
  try {
    const query = structuredQuery(address, city);
    const params = new URLSearchParams({ street: query.street, housenumber: query.housenumber, city: query.city, country: query.country, filter: 'countrycode:co', bias: GEOAPIFY_BIAS, limit: '5', apiKey });
    const response = await fetch(`https://api.geoapify.com/v1/geocode/search?${params}`, { next: { revalidate: 86400 } });
    if (!response.ok) return [];
    const body = await response.json();
    const rows = Array.isArray(body.features) ? body.features : [];
    return rows.map((feature: any): GeocodingCandidate => {
      const properties = feature.properties || {}; const rank = properties.rank || {};
      const building = rank.confidence_building_level == null ? null : Number(rank.confidence_building_level); const confidence = Number(rank.confidence || 0);
      return { latitude: Number(properties.lat), longitude: Number(properties.lon), label: properties.formatted || `${query.street} ${query.housenumber}`, confidence: rank.match_type === 'full_match' && building != null && building >= 1 ? 'alta' : rank.match_type === 'match_by_street' ? 'baja' : 'media', provider: 'geoapify', matchType: rank.match_type || null, confidenceBuildingLevel: building, confidenceCityLevel: rank.confidence_city_level == null ? null : Number(rank.confidence_city_level), confidenceStreetLevel: rank.confidence_street_level == null ? null : Number(rank.confidence_street_level), providerConfidence: Number.isFinite(confidence) ? confidence : null, locality: properties.suburb || properties.city_district || properties.district || null, resultType: properties.result_type || null };
    }).filter((candidate: GeocodingCandidate) => Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude));
  } catch {
    return [];
  }
}

export async function geocodeDeliveryAddress(address: string, city: string): Promise<GeocodingCandidate[]> {
  const key = normalizeDeliveryAddress(address, city);
  if (!key) return [];
  if (geocodeCache.has(key)) return geocodeCache.get(key) || [];
  const candidates: GeocodingCandidate[] = [];
  const googleCandidates = await googleGeocode(address, city);
  candidates.push(...googleCandidates);
  if (googleCandidates.length === 1 && hasSingleStrong(googleCandidates[0], googleCandidates.length)) { geocodeCache.set(key, candidates); return candidates; }
  const geoCandidates = await geoapify(address, city);
  candidates.push(...geoCandidates);
  if (geoCandidates.length === 1 && hasSingleStrong(geoCandidates[0], geoCandidates.length)) { geocodeCache.set(key, candidates); return candidates; }
  for (const query of queryVariants(address, city)) {
    try {
      const rows = await nominatim(query);
      for (const row of rows) {
        const addr = row.address || {};
        const candidate: GeocodingCandidate = { latitude: Number(row.lat), longitude: Number(row.lon), label: row.display_name || query.q || query.street || '', confidence: addr.house_number && (addr.city || addr.town || addr.municipality) ? 'alta' : 'media', provider: 'nominatim', matchType: addr.house_number ? 'full_match' : 'match_by_street', confidenceBuildingLevel: addr.house_number ? 1 : null, locality: addr.suburb || addr.city_district || addr.neighbourhood || null, resultType: addr.house_number ? 'building' : 'street' };
        if (Number.isFinite(candidate.latitude) && Number.isFinite(candidate.longitude) && !candidates.some(x => x.latitude === candidate.latitude && x.longitude === candidate.longitude && x.provider === candidate.provider)) candidates.push(candidate);
      }
      if (candidates.some(x => x.provider === 'nominatim' && x.confidence === 'alta')) break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch {
      // Continue with the next query/provider.
    }
  }
  geocodeCache.set(key, candidates);
  return candidates;
}

export function getGeoapifyStructuredQuery(address: string, city: string) { return structuredQuery(address, city); }
export { GEOAPIFY_BIAS };
