import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createSupabaseRequestClient, extractBearerToken } from '@/lib/supabaseRequestClient';

function normalize(phone: string) { return phone.replace(/\D/g, '').replace(/^57/, ''); }

export async function POST(request: NextRequest) {
  const token = extractBearerToken(request.headers.get('authorization'));
  if (!token) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const scoped = createSupabaseRequestClient(token);
  const { data: { user }, error: authError } = await scoped.auth.getUser();
  if (authError || !user) return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  const body = await request.json();
  const phone = String(body.phone || '');
  const normalized = normalize(phone);
  if (!/^3\d{9}$/.test(normalized)) return NextResponse.json({ ok: true, matched: false, reason: 'telefono_invalido' });
  const admin = getSupabaseAdmin() as any;
  const { data: customers, error } = await admin.from('customers').select('id,phone').eq('is_active', true).or(`phone.eq.57${normalized},phone.eq.+57${normalized},phone.eq.${normalized}`).limit(5);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  if (!customers || customers.length !== 1) return NextResponse.json({ ok: true, matched: false, reason: customers?.length ? 'multiples_coincidencias' : 'sin_customer' });
  const { error: updateError } = await admin.from('customers').update({ address: body.address || null, city: body.city || 'Bogotá', address_updated_at: new Date().toISOString(), address_source: 'pwa' }).eq('id', customers[0].id);
  if (updateError) return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  return NextResponse.json({ ok: true, matched: true, customer_id: customers[0].id });
}
