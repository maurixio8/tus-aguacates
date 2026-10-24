import { supabase } from '@/lib/supabase';
import { encodeAddressMetadata, formatStructuredAddress, type StructuredAddress } from '@/lib/address-structured';

export async function savePwaAddress(input: StructuredAddress & { id?: string; label: string; fullName: string; phone: string; state?: string; postalCode?: string; userId: string; }) {
  const formatted = formatStructuredAddress(input);
  const row = {
    user_id: input.userId,
    label: input.label,
    full_name: input.fullName,
    phone: input.phone,
    street_address: formatted,
    city: input.city,
    state: input.state || 'Cundinamarca',
    postal_code: input.postalCode || null,
    additional_info: encodeAddressMetadata(input),
    is_default: false,
  };
  const query = input.id ? supabase.from('addresses').update(row).eq('id', input.id).select().single() : supabase.from('addresses').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  const { data: session } = await supabase.auth.getSession();
  if (session.session?.access_token) {
    await fetch('/api/pwa/address-sync', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session.access_token}` }, body: JSON.stringify({ phone: input.phone, address: formatted, city: input.city }) });
  }
  return data;
}
