/**
 * Extrae dirección completa como texto plano desde un objeto o string JSON.
 * Compartida entre resumen de empaque (admin) y resumen de WhatsApp.
 */
export function formatAddressToString(addr: unknown): string {
  if (!addr) return '';

  // Si es string, intentar parsear JSON
  if (typeof addr === 'string') {
    try {
      const parsed = JSON.parse(addr);
      return formatAddressObject(parsed);
    } catch {
      return addr; // Es texto plano, devolverlo tal cual
    }
  }

  return formatAddressObject(addr);
}

function formatAddressObject(addr: unknown): string {
  if (!addr || typeof addr !== 'object') return '';

  const obj = addr as Record<string, unknown>;
  const streetAddress = (obj.street_address || obj.address || obj.street || '') as string;
  const neighborhood = (obj.neighborhood || obj.barrio || obj.locality || '') as string;
  const city = (obj.city || '') as string;
  const state = (obj.state || obj.department || '') as string;
  const postalCode = (obj.postal_code || obj.zip_code || '') as string;
  const additionalInfo = (obj.additional_info || obj.references || obj.referencias || '') as string;

  const parts: string[] = [];
  if (streetAddress) parts.push(streetAddress);
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (postalCode) parts.push(`CP: ${postalCode}`);
  if (additionalInfo) parts.push(`Ref: ${additionalInfo}`);

  return parts.join(', ');
}
