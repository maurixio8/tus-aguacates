import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createUnauthorizedResponse, requireAgentOpsOrAuditorAuth } from '@/lib/agent-auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function normalizePhone(value: unknown): string {
  return String(value || '').replace(/\D/g, '');
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function isActive(status: string | null | undefined): boolean {
  return ['pending', 'pendiente', 'confirmed', 'confirmado', 'confirmada', 'processing', 'procesando', 'en_preparacion', 'en_preparación', 'shipped', 'en_camino', 'listo_entrega', 'en_ruta'].includes(String(status || '').toLowerCase());
}

export async function GET(request: NextRequest) {
  const auth = requireAgentOpsOrAuditorAuth(request);
  if (!auth.success) return createUnauthorizedResponse();

  const phone = normalizePhone(new URL(request.url).searchParams.get('phone'));
  if (phone.length < 10) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'phone must contain at least 10 digits' } }, { status: 400 });
  }

  try {
    const supabase = getSupabase();
    const [ordersResult, guestResult] = await Promise.all([
      supabase.from('orders').select('id,order_number,status,order_status,payment_status,total_amount,customer_phone,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
      supabase.from('guest_orders').select('id,status,order_status,payment_status,total_amount,guest_phone,created_at,updated_at').order('created_at', { ascending: false }).limit(100),
    ]);
    if (ordersResult.error) throw ordersResult.error;
    if (guestResult.error) throw guestResult.error;

    const regular = (ordersResult.data || [])
      .filter(row => normalizePhone(row.customer_phone).slice(-10) === phone.slice(-10))
      .map(row => ({ ...row, order_type: 'registered' as const, phone: undefined }));
    const guest = (guestResult.data || [])
      .filter(row => normalizePhone(row.guest_phone).slice(-10) === phone.slice(-10))
      .map(row => ({ ...row, order_number: null, order_type: 'guest' as const, phone: undefined }));
    const all = [...regular, ...guest].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
    const active = all.find(row => isActive(row.status) || isActive(row.order_status));
    const selected = active || all[0] || null;

    return NextResponse.json({
      success: true,
      data: {
        found: Boolean(selected),
        active: Boolean(active),
        order: selected ? {
          id: selected.id,
          order_number: selected.order_number || null,
          order_type: selected.order_type,
          status: selected.status || selected.order_status || null,
          payment_status: selected.payment_status || null,
          total_amount: selected.total_amount || null,
          created_at: selected.created_at,
          updated_at: selected.updated_at,
        } : null,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Order status lookup failed' } }, { status: 500 });
  }
}
