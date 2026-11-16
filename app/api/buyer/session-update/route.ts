import { NextRequest, NextResponse } from 'next/server';
import { createBuyerGuardedHandler } from '@/lib/buyer-auth';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export const POST = createBuyerGuardedHandler(async (request: NextRequest, auth) => {
  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.session_id === 'string' ? body.session_id : '';
  const cash = body?.cash_advanced === null || body?.cash_advanced === '' ? null : Number(body?.cash_advanced);
  if (!sessionId || (cash !== null && (!Number.isFinite(cash) || cash < 0))) return NextResponse.json({ success: false, error: 'Datos de jornada inválidos' }, { status: 400 });
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc('update_buyer_purchase_session', {
    p_buyer_id: auth.claims.sub,
    p_session_id: sessionId,
    p_cash_advanced: cash,
    p_operational_expenses: body?.operational_expenses && typeof body.operational_expenses === 'object' ? body.operational_expenses : null,
  });
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 403 });
  return NextResponse.json(data || { success: true, session_id: sessionId });
});
