import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

const normalizePhone = (value: unknown): string => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.startsWith('57') ? digits.slice(-10) : digits.slice(-10);
};

const extractOrderPhone = (order: { customer_phone?: unknown; shipping_address?: unknown; order_data?: unknown }): string => {
  const direct = normalizePhone(order.customer_phone);
  if (direct.length >= 10) return direct;
  const raw = JSON.stringify({ shipping_address: order.shipping_address, order_data: order.order_data });
  const candidates = raw.match(/(?:57)?3\d{9}/g) || [];
  return normalizePhone(candidates[0] || '');
};

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const supabase = createSupabaseClient();
  const type = new URL(request.url).searchParams.get('type') || 'all';
  const [findingsResult, recoveryResult, ripenessResult, handoffsResult] = await Promise.all([
    type === 'ripeness' ? Promise.resolve({ data: [], error: null }) : supabase.from('whatsapp_audit_findings').select('*').order('received_at', { ascending: false }).limit(100),
    type === 'findings' || type === 'all' ? supabase.from('whatsapp_recovery_opportunities').select('*').order('intent_score', { ascending: false }).limit(100) : Promise.resolve({ data: [], error: null }),
    type === 'findings' || type === 'recovery' ? Promise.resolve({ data: [], error: null }) : supabase.from('ripeness_proposals').select('*').eq('approval_status','pending').order('created_at', { ascending: false }),
    supabase.from('whatsapp_human_handoffs').select('*').eq('status','active').order('updated_at', { ascending: false }),
  ]);
  const contextResult = await supabase.from('whatsapp_audit_context').select('*').order('risk_level', { ascending: false }).order('last_seen_at', { ascending: false }).limit(100);
  const [ordersResult, guestOrdersResult] = await Promise.all([
    supabase.from('orders').select('*').limit(5000),
    supabase.from('guest_orders').select('*').limit(5000),
  ]);
const relatedOrders = [...(ordersResult.data || []), ...(guestOrdersResult.data || [])].map(order => ({
  id: order.id,
  order_number: order.order_number,
  status: order.status || order.order_status || 'pending',
  delivery_date: order.delivery_date || null,
  directPhone: normalizePhone(order.customer_phone || order.guest_phone),
  fallbackPhone: extractOrderPhone(order),
  email: String(order.customer_email || order.guest_email || '').trim().toLowerCase(),
  created_at: order.created_at,
}));

const ORDER_WINDOW_MS = 60 * 24 * 60 * 60 * 1000;
const extractExplicitOrderRefs = (row: any): string[] => {
  const text = [row.incoming_text, row.luz_response, row.evidence, row.conversation_summary, row.order_state].filter(Boolean).join(' ');
  const refs = new Set<string>();
  for (const match of text.matchAll(/(?:INV-[A-Z0-9-]+|TA-\d{8}-[A-Z0-9.]+|[0-9a-f]{8}-[0-9a-f-]{27})/gi)) refs.add(match[0].toLowerCase());
  return [...refs];
};
const extractTextPhones = (row: any): string[] => {
  const text = [row.incoming_text, row.luz_response, row.evidence, row.conversation_summary, row.order_state].filter(Boolean).join(' ');
  return [...new Set((text.match(/(?:\+?57)?3\d{9}/g) || []).map(normalizePhone))];
};
const attachRelatedOrders = (row: any) => {
  const conversationPhone = normalizePhone(row.contact_phone);
  const email = String(row.contact_email || '').trim().toLowerCase();
  const explicitRefs = extractExplicitOrderRefs(row);
  const textPhones = extractTextPhones(row).filter(phone => !conversationPhone || phone !== conversationPhone);
  const eventDate = new Date(row.received_at || row.last_seen_at || row.created_at || 0).getTime();
  const candidates: Array<any> = relatedOrders.flatMap((order: any) => {
    const orderId = String(order.id || '').toLowerCase();
    const orderNumber = String(order.order_number || '').toLowerCase();
    const exactRef = explicitRefs.find(ref => ref === orderId || ref === orderNumber);
    if (exactRef) return [{ ...order, match_strength: 'firm' as const, match_method: exactRef === orderId ? 'id de pedido exacto' : 'número de pedido exacto', match_reason: 'Identificador explícito en la conversación' }];
    const orderDate = new Date(order.created_at || 0).getTime();
    const inWindow = !eventDate || !orderDate || Math.abs(eventDate - orderDate) <= ORDER_WINDOW_MS;
    const directPhone = Boolean(conversationPhone && order.directPhone === conversationPhone && inWindow);
    const declaredPhone = Boolean(textPhones.length && textPhones.includes(order.directPhone || order.fallbackPhone || '') && inWindow);
    const historicalPhone = Boolean(conversationPhone && order.fallbackPhone === conversationPhone && order.directPhone !== conversationPhone && inWindow);
    const emailMatch = Boolean(email && order.email === email && inWindow);
    if (directPhone) return [{ ...order, match_strength: 'candidate' as const, match_method: 'teléfono directo candidato', match_reason: 'Teléfono coincide; falta confirmar unicidad temporal' }];
    if (declaredPhone) return [{ ...order, match_strength: 'candidate' as const, match_method: 'teléfono declarado en el texto', match_reason: 'El teléfono aparece dentro de la conversación, no como identidad del remitente' }];
    if (historicalPhone) return [{ ...order, match_strength: 'candidate' as const, match_method: 'teléfono en dirección o dato histórico', match_reason: 'El teléfono no está en el campo directo del pedido' }];
    if (emailMatch) return [{ ...order, match_strength: 'candidate' as const, match_method: 'correo candidato', match_reason: 'El correo no es llave firme del contrato' }];
    return [];
  });
  const directFirmCandidates = candidates.filter(order => order.match_method === 'teléfono directo candidato');
  const directPhoneIsUnique = directFirmCandidates.length === 1;
  const safeMatches = candidates.map(order => directPhoneIsUnique && order.match_method === 'teléfono directo candidato'
    ? { ...order, match_strength: 'firm' as const, match_method: 'teléfono exacto normalizado', match_reason: 'Único pedido candidato dentro de la ventana temporal de 60 días' }
    : order);
  return { ...row, related_orders: safeMatches.slice(0, 10).map(({ directPhone: _directPhone, fallbackPhone: _fallbackPhone, email: _email, created_at: _createdAt, ...safe }) => safe) };
};
  const enrichedFindings = (findingsResult.data || []).map(attachRelatedOrders);
  const enrichedRecovery = (recoveryResult.data || []).map(attachRelatedOrders);
  const error = findingsResult.error || recoveryResult.error || ripenessResult.error || handoffsResult.error;
  if (error) return NextResponse.json({ error: 'No se pudo cargar la auditoría', details: error.message, code: error.code || null }, { status: 500 });
  return NextResponse.json({ success: true, findings: enrichedFindings, recovery: enrichedRecovery, ripeness: ripenessResult.data || [], handoffs: handoffsResult.data || [], contexts: contextResult.error ? [] : (contextResult.data || []) });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const body = await request.json();
  const action = body.action;
  const adminName = auth.user?.name || auth.user?.email || 'admin';
  const supabase = createSupabaseClient();
  if (action === 'take-handoff' || action === 'resume-handoff') {
    const identityKey = String(body.identityKey || body.phone || '').trim();
    if (!identityKey) return NextResponse.json({ error: 'Falta identityKey o teléfono reconciliado' }, { status: 400 });
    if (action === 'take-handoff') {
      const { data, error } = await supabase.from('whatsapp_human_handoffs').upsert({ identity_key: identityKey, phone: String(body.phone || identityKey), status: 'active', started_by: adminName, started_at: new Date().toISOString(), last_human_message_at: new Date().toISOString(), ended_at: null, resolution: null, updated_at: new Date().toISOString() }, { onConflict: 'identity_key' }).select().single();
      if (error) return NextResponse.json({ error: 'No se pudo activar la atención humana', details: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data });
    }
    const { data, error } = await supabase.from('whatsapp_human_handoffs').update({ status: 'closed', ended_at: new Date().toISOString(), resolution: String(body.resolution || 'Atención humana finalizada'), updated_at: new Date().toISOString() }).eq('identity_key', identityKey).eq('status','active').select().single();
    if (error) return NextResponse.json({ error: 'No se pudo retomar Luz', details: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }
  if (action === 'review-finding') {
    const status = body.status === 'dismissed' ? 'dismissed' : 'approved';
    const { data, error } = await supabase.from('whatsapp_audit_findings').update({ review_status: status, updated_at: new Date().toISOString() }).eq('id', String(body.id || '')).select().single();
    if (error) return NextResponse.json({ error: 'No se pudo actualizar el hallazgo' }, { status: 500 });
    return NextResponse.json({ success: true, data, reviewed_by: adminName });
  }
  if (action === 'review-recovery') {
    const status = ['resolved','dismissed','approved'].includes(body.status) ? body.status : 'approved';
    const { data, error } = await supabase.from('whatsapp_recovery_opportunities').update({ status, assigned_to: adminName, resolution: String(body.resolution || ''), updated_at: new Date().toISOString() }).eq('id', String(body.id || '')).select().single();
    if (error) return NextResponse.json({ error: 'No se pudo actualizar la oportunidad' }, { status: 500 });
    return NextResponse.json({ success: true, data });
  }
  const proposalId = String(body.id || '');
  if (!proposalId || !['approve', 'reject', 'apply-customer'].includes(action)) {
    return NextResponse.json({ error: 'Acción o propuesta inválida' }, { status: 400 });
  }
  const { data: proposal, error: proposalError } = await supabase
    .from('ripeness_proposals').select('*').eq('id', proposalId).single();
  if (proposalError || !proposal) return NextResponse.json({ error: 'Propuesta no encontrada' }, { status: 404 });
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
