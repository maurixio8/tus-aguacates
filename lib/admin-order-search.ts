export type SearchableAdminOrder = {
  id?: string | null;
  order_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  delivery_address?: string | null;
  delivery_notes?: string | null;
  order_data?: unknown;
};

export function normalizeAdminOrderSearch(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function matchesAdminOrderSearch(order: SearchableAdminOrder, query: string): boolean {
  const normalizedQuery = normalizeAdminOrderSearch(query);
  if (!normalizedQuery) return true;
  const haystack = [
    order.id,
    order.order_number,
    order.customer_name,
    order.customer_email,
    order.customer_phone,
    order.delivery_address,
    order.delivery_notes,
    order.order_data,
  ].map(normalizeAdminOrderSearch).join(' ');
  const compactQuery = normalizedQuery.replace(/\D/g, '');
  if (compactQuery.length >= 7 && compactQuery === normalizedQuery.replace(/\D/g, '')) {
    const compactHaystack = haystack.replace(/\D/g, '');
    if (compactHaystack.includes(compactQuery)) return true;
  }
  return haystack.includes(normalizedQuery);
}
