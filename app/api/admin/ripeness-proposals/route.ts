import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const supabase = createSupabaseClient();
  const type = new URL(request.url).searchParams.get('type') || 'all';
  const [findingsResult, recoveryResult, ripenessResult] = await Promise.all([
    type === 'ripeness' ? Promise.resolve({ data: [], error: null }) : supabase.from('whatsapp_audit_findings').select('*').order('received_at', { ascending: false }).limit(100),
    type === 'findings' || type === 'all' ? supabase.from('whatsapp_recovery_opportunities').select('*').order('intent_score', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    type === 'findings' || type === 'recovery' ? Promise.resolve({ data: [], error: null }) : supabase.from('ripeness_proposals').select('*').eq('approval_status','pending').order('created_at', { ascending: false }),
  ]);
  const error = findingsResult.error || recoveryResult.error || ripenessResult.error;
  if (error) return NextResponse.json({ error: 'No se pudo cargar la auditoría', details: error.message, code: error.code || null }, { status: 500 });
  return NextResponse.json({ success: true, findings: findingsResult.data || [], recovery: recoveryResult.data || [], ripeness: ripenessResult.data || [] });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const body = await request.json();
  const proposalId = String(body.id || '');
  const action = body.action;
  if (!proposalId || !['approve', 'reject', 'apply-customer'].includes(action)) {
    return NextResponse.json({ error: 'Acción o propuesta inválida' }, { status: 400 });
  }
  const supabase = createSupabaseClient();
  const { data: proposal, error: proposalError } = await supabase
    .from('ripeness_proposals').select('*').eq('id', proposalId).single();
  if (proposalError || !proposal) return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
  const adminName = auth.user?.name || auth.user?.email || 'admin';
  if (action === 'approve') {
    if (proposal.approval_status !== 'pending') return NextResponse.json({ error: 'La propuesta ya fue procesada' }, { status: 409 });
    const { data, error } = await supabase.from('ripeness_proposals').update({ approval_status: 'approved', approved_by: adminName, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', proposalId).eq('approval_status','pending').select().single();
    if (error) return NextResponse.json({ error: 'No se pudo aprobar' }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }
  if (action === 'reject') {
    const { data, error } = await supabase.from('ripeness_proposals').update({ approval_status: 'rejected', rejection_reason: String(body.reason || 'Rechazada por administrador'), approved_by: adminName, approved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', proposalId).eq('approval_status','pending').select().single();
    if (error) return NextResponse.json({ error: 'No se pudo rechazar' }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }
  if (proposal.approval_status !== 'approved') return NextResponse.json({ error: 'Primero debes aprobar la propuesta' }, { status: 409 });
  const customerId = String(body.customerId || '');
  if (!customerId) return NextResponse.json({ error: 'Selecciona el cliente exacto antes de aplicar' }, { status: 400 });
  const preference = ({ verde: 'verdes', pinton: 'pintones', maduro: 'maduros', mixto: 'mezcla de verdes, pintones y maduros' } as Record<string,string>)[proposal.preference] || proposal.preference;
  const note = `Preferencia de maduración solicitada: ${preference}. Fuente: auditoría de WhatsApp.`;
  const { data: customer, error: readError } = await supabase.from('customers').select('id,notes').eq('id', customerId).single();
  if (readError || !customer) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
  const current = String(customer.notes || '');
  const notes = current.includes(note) ? current : [current, note].filter(Boolean).join(' | ');
  const { data: updated, error: updateError } = await supabase.from('customers').update({ notes, updated_at: new Date().toISOString() }).eq('id', customerId).select('id,notes').single();
  if (updateError) return NextResponse.json({ error: 'No se pudo actualizar la nota del cliente' }, { status: 500 });
  const { data: applied, error: markError } = await supabase.from('ripeness_proposals').update({ approval_status: 'applied', target_type: 'customer', target_id: customerId, applied_to_customer: true, updated_at: new Date().toISOString() }).eq('id', proposalId).eq('approval_status','approved').select().single();
  if (markError) return NextResponse.json({ error: 'La nota se guardó, pero no se pudo marcar la propuesta' }, { status: 500 });
  return NextResponse.json({ success: true, customer: updated, proposal: applied });
}
