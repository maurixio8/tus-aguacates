import type { SupabaseClient } from '@supabase/supabase-js';

export function normalizePhoneForDB(phone: string): string {
  if (!phone) return '';

  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  if (digits.length === 12 && digits.startsWith('57')) {
    return digits;
  }

  const local10 = digits.length >= 10 ? digits.slice(-10) : digits;
  if (local10.length === 10 && local10.startsWith('3')) {
    return `57${local10}`;
  }

  return digits.startsWith('57') ? digits : `57${local10}`;
}

export function getComparablePhone(phone: string): string {
  const normalized = normalizePhoneForDB(phone);
  return normalized ? normalized.slice(-10) : '';
}

export function buildPhoneCandidates(...phones: Array<string | null | undefined>): string[] {
  const candidates = new Set<string>();

  phones.forEach((phone) => {
    if (!phone) return;

    const digits = phone.replace(/\D/g, '');
    const normalized = normalizePhoneForDB(phone);
    const comparable = getComparablePhone(phone);

    if (digits) candidates.add(digits);
    if (normalized) candidates.add(normalized);
    if (comparable) candidates.add(comparable);
    if (normalized) candidates.add(`+${normalized}`);
  });

  return Array.from(candidates);
}

export function isPlaceholderName(name?: string | null): boolean {
  const value = (name || '').trim().toLowerCase();
  return [
    '',
    'cliente',
    'cliente whatsapp',
    'cliente de whatsapp',
    'cliente web',
    'sin nombre',
    'unknown',
    'desconocido',
    '-'
  ].includes(value);
}

export async function findExistingCustomerByPhones(
  supabase: SupabaseClient,
  phones: Array<string | null | undefined>,
  excludeId?: string
): Promise<Record<string, any> | null> {
  const comparableCandidates = new Set(
    phones
      .map((phone) => getComparablePhone(phone || ''))
      .filter(Boolean)
  );

  if (comparableCandidates.size === 0) return null;

  let query = supabase
    .from('customers')
    .select('id, name, phone, email, address, neighborhood, city, notes, total_orders, total_spent, is_active, created_at, updated_at')
    .order('updated_at', { ascending: false, nullsFirst: false })
    .limit(2000);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[customerSync] Error buscando cliente por teléfonos:', error);
    return null;
  }

  const matches = (data || []).filter((customer) => {
    const comparable = getComparablePhone(customer.phone || '');
    return comparable && comparableCandidates.has(comparable);
  });

  if (matches.length === 0) return null;

  matches.sort((a, b) => {
    const aName = isPlaceholderName(a.name);
    const bName = isPlaceholderName(b.name);
    if (aName !== bName) return aName ? 1 : -1;

    const aHasAddress = !!(a.address || a.neighborhood || a.city);
    const bHasAddress = !!(b.address || b.neighborhood || b.city);
    if (aHasAddress !== bHasAddress) return aHasAddress ? -1 : 1;

    return (b.total_orders || 0) - (a.total_orders || 0);
  });

  return matches[0];
}

function trimOrNull(value?: string | null): string | null {
  if (value === undefined) return null;
  const trimmed = value?.trim() || '';
  return trimmed || null;
}

export async function upsertCustomerMasterRecord(
  supabase: SupabaseClient,
  payload: {
    id?: string | null;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    neighborhood?: string | null;
    city?: string | null;
    notes?: string | null;
    is_active?: boolean;
  }
): Promise<{ customer: Record<string, any>; isNew: boolean } | null> {
  const normalizedPhone = payload.phone ? normalizePhoneForDB(payload.phone) : '';

  let existing: Record<string, any> | null = null;

  if (payload.id) {
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, phone, email, address, neighborhood, city, notes, total_orders, total_spent, is_active, created_at, updated_at')
      .eq('id', payload.id)
      .maybeSingle();

    if (!error && data) {
      existing = data;
    }
  }

  const duplicateByPhone = normalizedPhone
    ? await findExistingCustomerByPhones(supabase, [normalizedPhone], existing?.id)
    : null;

  if (!existing && duplicateByPhone) {
    existing = duplicateByPhone;
  }

  if (existing) {
    const incomingName = trimOrNull(payload.name);
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (incomingName && (!existing.name || isPlaceholderName(existing.name) || !isPlaceholderName(incomingName))) {
      updateData.name = incomingName;
    }
    if (normalizedPhone) updateData.phone = normalizedPhone;
    if (payload.email !== undefined) updateData.email = trimOrNull(payload.email);
    if (payload.address !== undefined) updateData.address = trimOrNull(payload.address);
    if (payload.neighborhood !== undefined) updateData.neighborhood = trimOrNull(payload.neighborhood);
    if (payload.city !== undefined) updateData.city = trimOrNull(payload.city) || 'Bogotá';
    if (payload.notes !== undefined) updateData.notes = trimOrNull(payload.notes);
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;

    const { data, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error || !data) {
      console.error('[customerSync] Error actualizando cliente maestro:', error);
      return null;
    }

    return { customer: data, isNew: false };
  }

  if (!normalizedPhone) return null;

  const insertData = {
    name: trimOrNull(payload.name) || 'Cliente',
    phone: normalizedPhone,
    email: payload.email !== undefined ? trimOrNull(payload.email) : null,
    address: payload.address !== undefined ? trimOrNull(payload.address) : null,
    neighborhood: payload.neighborhood !== undefined ? trimOrNull(payload.neighborhood) : null,
    city: trimOrNull(payload.city) || 'Bogotá',
    notes: payload.notes !== undefined ? trimOrNull(payload.notes) : null,
    total_orders: 0,
    total_spent: 0,
    is_active: payload.is_active !== false,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    console.error('[customerSync] Error creando cliente maestro:', error);
    return null;
  }

  return { customer: data, isNew: true };
}
