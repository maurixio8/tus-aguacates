import { NextRequest, NextResponse } from 'next/server';

const BOGOTA_VIEWBOX = '-74.25,4.85,-73.95,4.45';
const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

function normalizeGoogle(result: any) {
  const location = result?.location || result?.geometry?.location;
  const components = result?.addressComponents || result?.address_components || [];
  const get = (type: string) => components.find((c: any) => c.types?.includes(type))?.longText || components.find((c: any) => c.types?.includes(type))?.long_name || '';
  const lat = location?.latitude ?? location?.lat ?? null;
  const lng = location?.longitude ?? location?.lng ?? null;
  return { id: result.id || result.place_id || null, text: result.formattedAddress || result.formatted_address || result.displayName?.text || '', latitude: lat, longitude: lng, city: get('locality') || get('administrative_area_level_2') || 'Bogotá', neighborhood: get('neighborhood') || get('sublocality') || '', confidence: lat != null && lng != null ? 'alta' : 'baja', provider: 'google' };
}

async function googleRequest(mode: string, q: string, placeId: string | null, sessionToken: string | null) {
  if (!GOOGLE_KEY) return null;
  if (mode === 'details' && placeId) {
    const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, { headers: { 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'id,formattedAddress,location,addressComponents' }, cache: 'no-store' });
    if (!r.ok) throw new Error(`Google Places details HTTP ${r.status}`);
    return { suggestions: [normalizeGoogle(await r.json())], provider: 'google' };
  }
  const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': GOOGLE_KEY, 'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text' }, body: JSON.stringify({ input: q, includedRegionCodes: ['co'], locationBias: { rectangle: { low: { latitude: 4.45, longitude: -74.25 }, high: { latitude: 4.85, longitude: -73.95 } } }, sessionToken: sessionToken || undefined }), cache: 'no-store' });
  if (!r.ok) throw new Error(`Google Places autocomplete HTTP ${r.status}`);
  const data = await r.json();
  return { suggestions: (data.suggestions || []).map((x: any) => ({ id: x.placePrediction?.placeId, text: x.placePrediction?.text?.text || '', confidence: 'media', provider: 'google' })), provider: 'google' };
}

async function nominatim(mode: string, q: string, lat?: string | null, lon?: string | null) {
  const base = 'https://nominatim.openstreetmap.org';
  const headers = { 'User-Agent': process.env.NOMINATIM_USER_AGENT || 'TusAguacates/phase2c-address-capture' };
  if (mode === 'details' && lat && lon) q = `${lat},${lon}`;
  const params = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'co', bounded: '1', viewbox: BOGOTA_VIEWBOX, q });
  const response = await fetch(`${base}/search?${params}`, { headers, cache: 'no-store' });
  if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);
  const rows = await response.json();
  const suggestions = rows.map((x: any, index: number) => ({ id: x.place_id?.toString() || `${x.lat},${x.lon}`, text: x.display_name, latitude: Number(x.lat), longitude: Number(x.lon), city: x.address?.city || x.address?.town || x.address?.municipality || 'Bogotá', neighborhood: x.address?.neighbourhood || x.address?.suburb || x.address?.quarter || '', confidence: index === 0 ? 'alta' : 'media', provider: 'nominatim' }));
  return { suggestions, provider: 'nominatim' };
}

export async function GET(request: NextRequest) {
  const p = request.nextUrl.searchParams;
  const mode = p.get('mode') || 'autocomplete';
  const q = (p.get('q') || '').trim();
  if (mode !== 'details' && q.length < 3) return NextResponse.json({ provider: GOOGLE_KEY ? 'google' : 'nominatim', suggestions: [] });
  try {
    const google = await googleRequest(mode, q, p.get('placeId'), p.get('sessionToken'));
    if (google) return NextResponse.json(google);
  } catch (error) {
    console.error('[PWA_GEOCODE] Google failed, using Nominatim:', error);
  }
  const result = await nominatim(mode, q, p.get('lat'), p.get('lon'));
  return NextResponse.json(result);
}
