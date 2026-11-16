import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export const POST = createBuyerGuardedHandler(async (request: NextRequest, auth) => {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.session_id === 'string' ? body.session_id : '';
  const itemId = typeof body?.item_id === 'string' ? body.item_id : null;
  const mutationId = typeof body?.mutation_id === 'string' ? body.mutation_id : '';
  if (!sessionId || !mutationId) return NextResponse.json({ success: false, error: 'session_id y mutation_id son obligatorios' }, { status: 400 });

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('update_buyer_purchase_item', {
    p_buyer_id: auth.claims.sub,
    p_session_id: sessionId,
    p_item_id: itemId,
    p_purchased_qty: numberOrNull(body?.purchased_qty),
    p_weight_kg: numberOrNull(body?.weight_kg),
    p_blind_price: numberOrNull(body?.blind_price),
    p_actual_total_paid: numberOrNull(body?.actual_total_paid),
    p_operational_expenses: body?.operational_expenses && typeof body.operational_expenses === 'object' ? body.operational_expenses : null,
    p_mutation_id: mutationId,
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 403 });
  return NextResponse.json(data || { success: true, mutation_id: mutationId });
});
