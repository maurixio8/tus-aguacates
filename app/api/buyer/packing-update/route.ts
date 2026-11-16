import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

function textOrNull(value: unknown): string | null { return typeof value === 'string' && value.trim() ? value.trim() : null; }
function numberOrNull(value: unknown): number | null { if (value === null || value === undefined || value === '') return null; const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; }
function uuidOrNull(value: unknown): string | null { const valueText = textOrNull(value); return valueText && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valueText) ? valueText : null; }

export const POST = createBuyerGuardedHandler(async (request: NextRequest, auth) => {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.session_id === 'string' ? body.session_id : '';
  if (!sessionId) return NextResponse.json({ success: false, error: 'session_id es obligatorio' }, { status: 400 });
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('upsert_buyer_packing_item', {
    p_buyer_id: auth.claims.sub,
    p_session_id: sessionId,
    p_item_id: textOrNull(body?.item_id),
    p_projected_key: textOrNull(body?.projected_key),
    p_source_order_id: uuidOrNull(body?.source_order_id),
    p_source_order_line_id: uuidOrNull(body?.source_order_line_id),
    p_source_order_number: textOrNull(body?.source_order_number),
    p_customer_id: uuidOrNull(body?.customer_id),
    p_customer_name: textOrNull(body?.customer_name),
    p_product_id: uuidOrNull(body?.product_id),
    p_product_name: textOrNull(body?.product_name),
    p_variant_id: uuidOrNull(body?.variant_id),
    p_variant_name: textOrNull(body?.variant_name),
    p_variant_value: textOrNull(body?.variant_value),
    p_requested_qty: numberOrNull(body?.requested_qty) ?? 0,
    p_picked_qty: numberOrNull(body?.picked_qty) ?? 0,
    p_ripeness_note_snapshot: textOrNull(body?.ripeness_note_snapshot),
    p_is_promo_gift: Boolean(body?.is_promo_gift),
    p_status: textOrNull(body?.status) || 'pending',
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 403 });
  return NextResponse.json(data || { success: true, session_id: sessionId });
});