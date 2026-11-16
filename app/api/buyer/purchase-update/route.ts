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
  const itemId = typeof body?.item_id === 'string' ? body.item_id : '';
  const mutationId = typeof body?.mutation_id === 'string' ? body.mutation_id : '';
  if (!sessionId || !mutationId) return NextResponse.json({ success: false, error: 'session_id y mutation_id son obligatorios' }, { status: 400 });

  const supabase = createSupabaseClient();
  const { data: session, error: sessionError } = await supabase
    .schema('purchase_offline')
    .from('purchase_sessions')
    .select('id, buyer_id')
    .eq('id', sessionId)
    .eq('buyer_id', auth.claims.sub)
    .maybeSingle();
  if (sessionError || !session) return NextResponse.json({ success: false, error: 'Jornada no autorizada' }, { status: 403 });

  const purchasedQty = numberOrNull(body?.purchased_qty);
  const weightKg = numberOrNull(body?.weight_kg);
  const actualTotalPaid = numberOrNull(body?.actual_total_paid);
  const blindPrice = numberOrNull(body?.blind_price);

  if (itemId) {
    const update: Record<string, number | null> = {};
    if (purchasedQty !== null) update.purchased_qty = purchasedQty;
    if (weightKg !== null || body?.weight_kg === '') update.weight_kg = weightKg;
    const { error } = await supabase.schema('purchase_offline').from('purchase_items').update(update).eq('id', itemId).eq('session_id', sessionId);
    if (error) return NextResponse.json({ success: false, error: 'No se pudo actualizar el producto' }, { status: 500 });

    if (blindPrice !== null || actualTotalPaid !== null || weightKg !== null) {
      const { error: observationError } = await supabase.schema('purchase_offline').from('purchase_price_observations').insert({
        session_id: sessionId,
        purchase_item_id: itemId,
        blind_price: blindPrice ?? actualTotalPaid ?? 0,
        actual_total_paid: actualTotalPaid,
        weight_kg: weightKg,
        notes: `mutation_id:${mutationId}`,
      });
      if (observationError) return NextResponse.json({ success: false, error: 'Producto guardado pero no se pudo registrar el precio' }, { status: 500 });
    }
  }

  if (body?.operational_expenses && typeof body.operational_expenses === 'object') {
    const { error } = await supabase.schema('purchase_offline').from('purchase_sessions').update({ operational_expenses: body.operational_expenses }).eq('id', sessionId).eq('buyer_id', auth.claims.sub);
    if (error) return NextResponse.json({ success: false, error: 'No se pudieron guardar los gastos' }, { status: 500 });
  }

  return NextResponse.json({ success: true, mutation_id: mutationId });
});
