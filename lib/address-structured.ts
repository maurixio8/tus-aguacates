export interface StructuredAddress {
  rawAddress?: string;
  viaType: string;
  viaNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  deliveryNotes: string;
  latitude: number | null;
  longitude: number | null;
  pinConfidence: 'pin' | 'sin_pin';
}

export const emptyStructuredAddress: StructuredAddress = {
  viaType: 'Calle',
  viaNumber: '',
  complement: '',
  neighborhood: '',
  city: 'Bogotá',
  deliveryNotes: '',
  latitude: null,
  longitude: null,
  pinConfidence: 'sin_pin',
};

export function formatStructuredAddress(a: StructuredAddress): string {
  if (a.rawAddress?.trim()) return a.rawAddress.trim();
  const main = [a.viaType, a.viaNumber].filter(Boolean).join(' ').trim();
  return [main, a.complement.trim(), a.neighborhood.trim(), a.city.trim()].filter(Boolean).join(', ');
}

export function encodeAddressMetadata(a: StructuredAddress): string {
  return JSON.stringify({
    structured: true,
    neighborhood: a.neighborhood,
    deliveryNotes: a.deliveryNotes,
    latitude: a.latitude,
    longitude: a.longitude,
    pinConfidence: a.pinConfidence,
  });
}

export function decodeAddressMetadata(value?: string | null): Partial<StructuredAddress> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed?.structured ? parsed : {};
  } catch {
    return {};
  }
}

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(x));
}
