/**
 * Extrae dirección completa como texto plano desde un objeto o string JSON.
 * Compartida entre resumen de empaque (admin) y resumen de WhatsApp.
 */
export function formatAddressToString(addr: unknown): string {
  if (!addr) return '';

  const parsed = parseAddressValue(addr);
  if (!parsed) {
    return typeof addr === 'string' ? addr : '';
  }

  return formatAddressObject(parsed);
}

export function parseAddressValue(addr: unknown): Record<string, unknown> | null {
  if (!addr) return null;

  if (typeof addr === 'string') {
    try {
      const parsed = JSON.parse(addr);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return typeof addr === 'object' ? (addr as Record<string, unknown>) : null;
}

export function extractCustomerDataFromShippingAddress(addr: unknown): {
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
} {
  const parsed = parseAddressValue(addr);
  if (!parsed) {
    return {
      customer_name: null,
      customer_phone: null,
      customer_email: null,
      delivery_address: null,
    };
  }

  return {
    customer_name: getFirstString(parsed.full_name, parsed.name),
    customer_phone: getFirstString(parsed.phone, parsed.telefono),
    customer_email: getFirstString(parsed.email),
    delivery_address: getFirstString(
      parsed.street_address,
      parsed.address,
      parsed.street,
      formatAddressObject(parsed)
    ),
  };
}

function formatAddressObject(addr: Record<string, unknown>): string {
  const streetAddress = getFirstString(addr.street_address, addr.address, addr.street) || '';
  const neighborhood = getFirstString(addr.neighborhood, addr.barrio, addr.locality) || '';
  const city = getFirstString(addr.city) || '';
  const state = getFirstString(addr.state, addr.department) || '';
  const postalCode = getFirstString(addr.postal_code, addr.zip_code) || '';
  const additionalInfo = getFirstString(addr.additional_info, addr.references, addr.referencias) || '';

  const parts: string[] = [];
  if (streetAddress) parts.push(streetAddress);
  if (neighborhood) parts.push(neighborhood);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (postalCode) parts.push(`CP: ${postalCode}`);
  if (additionalInfo) parts.push(`Ref: ${additionalInfo}`);

  return parts.join(', ');
}

function getFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}
