import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';

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
  const error = findingsResult.error || recoveryResult.error || ripenessResult.error || handoffsResult.error;
  if (error) return NextResponse.json({ error: 'No se pudo cargar la auditoría', details: error.message, code: error.code || null }, { status: 500 });
  const findings = findingsResult.data || [];
  const recovery = recoveryResult.data || [];
  const contexts = contextResult.error ? [] : (contextResult.data || []);
  const validPhone = (value: unknown) => /^57\\d{10}$/.test(String(value || '').replace(/\\D/g, ''));
  const phoneFromConversationKey = (value: unknown) => {
    const match = String(value || '').match(/^phone:(57\\d{10})$/);
    return match && validPhone(match[1]) ? match[1] : null;
  };
  const priorityCases = [
    ...findings.filter((row: any) => row.severity === 'rojo' && validPhone(row.contact_phone)).map((row: any) => ({
      key: `finding:${row.id}`,
      source: 'hallazgo crítico',
      source_kind: 'finding',
      source_id: row.id,
      customer_masked: row.customer_masked,
      contact_phone: String(row.contact_phone).replace(/\\D/g, ''),
      phone_source: row.phone_source || 'whatsapp_audit_findings.contact_phone',
      phone_confidence: row.phone_confidence || 'alta',
      last_seen_at: row.received_at,
      priority: 'alta',
      priority_reason: 'Respuesta de Luz marcada como crítica por el auditor.',
      summary: row.incoming_text || 'Hallazgo crítico sin mensaje de entrada.',
      incoming_text: row.incoming_text || '',
      luz_response: row.luz_response || '',
      evidence: (row.flags || []).join(' · '),
      next_action: (row.recommendations || []).join(' · ') || 'Abrir el chat y revisar manualmente.',
      order_state: '',
      intent_level: '',
      intent_score: 100,
    })),
    ...recovery.filter((row: any) => ['alta', 'high'].includes(String(row.intent_level || '').toLowerCase()) && validPhone(row.contact_phone)).map((row: any) => ({
      key: `recovery:${row.id}`,
      source: 'oportunidad de recuperación',
      source_kind: 'recovery',
      source_id: row.id,
      customer_masked: row.customer_masked,
      contact_phone: String(row.contact_phone).replace(/\\D/g, ''),
      phone_source: row.phone_source || 'whatsapp_recovery_opportunities.contact_phone',
      phone_confidence: row.phone_confidence || 'alta',
      conversation_key: row.conversation_key || '',
      last_seen_at: row.last_seen_at,
      priority: 'alta',
      priority_reason: 'Cliente con intención alta y conversación que requiere intervención humana.',
      summary: row.conversation_summary || 'Quiere comprar, pero la conversación no quedó resuelta.',
      incoming_text: '',
      luz_response: '',
      evidence: row.evidence || '',
      next_action: row.recommendation || 'Abrir el chat, revisar el pedido y ayudar a cerrar.',
      order_state: row.order_state || row.order_status || '',
      intent_level: row.intent_level || '',
      intent_score: Number(row.intent_score || 0),
      order_id: row.order_id || '',
      order_status: row.order_status || '',
      payment_state: row.payment_state || '',
    })),
    ...contexts.filter((row: any) => row.risk_level === 'high' && phoneFromConversationKey(row.conversation_key)).map((row: any) => ({
      key: `context:${row.id || row.conversation_key}`,
      source: 'contexto crítico de conversación',
      source_kind: 'context',
      source_id: row.id || row.conversation_key,
      customer_masked: row.customer_masked,
      contact_phone: phoneFromConversationKey(row.conversation_key) || undefined,
      phone_source: 'whatsapp_audit_context.conversation_key',
      phone_confidence: 'alta',
      conversation_key: row.conversation_key,
      last_seen_at: row.last_seen_at,
      priority: 'alta',
      priority_reason: 'El auditor marcó la conversación con riesgo alto.',
      summary: row.summary || 'Conversación de riesgo alto sin resumen.',
      incoming_text: row.customer_goal || '',
      luz_response: row.suggested_reply || '',
      evidence: row.evidence || row.friction || '',
      next_action: row.action_plan || 'Abrir el chat y revisar manualmente antes de responder.',
      order_state: row.current_state || '',
      intent_level: row.intent || '',
      intent_score: 100,
    })),
  ].sort((a, b) => Number(new Date(b.last_seen_at || 0)) - Number(new Date(a.last_seen_at || 0)));
  return NextResponse.json({ success: true, findings, recovery, ripeness: ripenessResult.data || [], handoffs: handoffsResult.data || [], contexts, priorityCases });
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
  if (action === 'pause-priority' || action === 'resume-priority') {
    const phone = String(body.phone || '').replace(/\\D/g, '');
    if (!/^57\\d{10}$/.test(phone)) return NextResponse.json({ error: 'Teléfono reconciliado inválido' }, { status: 400 });
    const webhookUrl = process.env.N8N_DB_TOOL_WEBHOOK_URL || 'https://n8n.tusaguacates.com/webhook/db-tool-executor';
    const webhookSecret = process.env.N8N_DB_TOOL_WEBHOOK_SECRET;
    if (!webhookSecret) return NextResponse.json({ error: 'Falta configurar la conexión segura con el ejecutor local' }, { status: 503 });
    const operation = action === 'pause-priority' ? 'pause_luz' : 'reactivar_luz';
    const params = action === 'pause-priority'
      ? { reason: 'Atención humana iniciada desde Prioridad Alta' }
      : { resolution: 'Atendido por Mauricio desde Prioridad Alta' };
    let dbResult: any;
    try {
      const response = await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-TA-Admin-Secret': webhookSecret }, body: JSON.stringify({ operation, from: phone, params }), cache: 'no-store' });
      const text = await response.text();
      dbResult = text ? JSON.parse(text) : null;
      if (!response.ok || !dbResult?.success) return NextResponse.json({ error: 'El ejecutor local no confirmó el cambio', details: dbResult?.error || `HTTP ${response.status}` }, { status: 502 });
    } catch (error) {
      return NextResponse.json({ error: 'No se pudo contactar el ejecutor local', details: error instanceof Error ? error.message : 'error desconocido' }, { status: 502 });
    }
    if (action === 'pause-priority') {
      const { data, error } = await supabase.from('whatsapp_human_handoffs').upsert({ identity_key: phone, phone, status: 'active', started_by: adminName, started_at: new Date().toISOString(), last_human_message_at: new Date().toISOString(), ended_at: null, reason: 'EN_REVISION_HUMANA / Prioridad Alta', resolution: null, updated_at: new Date().toISOString() }, { onConflict: 'identity_key' }).select().single();
      if (error) return NextResponse.json({ error: 'PostgreSQL local cambió, pero no se pudo registrar el handoff', details: error.message, dbResult }, { status: 500 });
      return NextResponse.json({ success: true, action, dbResult, handoff: data });
    }
    const { data: handoff, error: handoffError } = await supabase.from('whatsapp_human_handoffs').update({ status: 'closed', ended_at: new Date().toISOString(), resolution: 'Atendido por Mauricio desde Prioridad Alta', updated_at: new Date().toISOString() }).eq('identity_key', phone).eq('status', 'active').select().maybeSingle();
    if (handoffError) return NextResponse.json({ error: 'PostgreSQL local cambió, pero no se pudo cerrar el handoff', details: handoffError.message, dbResult }, { status: 500 });
    if (body.sourceKind === 'finding') {
      const { error } = await supabase.from('whatsapp_audit_findings').update({ review_status: 'approved', updated_at: new Date().toISOString() }).eq('id', String(body.sourceId || ''));
      if (error) return NextResponse.json({ error: 'Se reactivó Luz, pero no se pudo marcar el hallazgo como atendido', details: error.message, dbResult }, { status: 500 });
    } else if (body.sourceKind === 'recovery') {
      const { error } = await supabase.from('whatsapp_recovery_opportunities').update({ status: 'resolved', assigned_to: adminName, resolution: 'Atendido por Mauricio desde Prioridad Alta', updated_at: new Date().toISOString() }).eq('id', String(body.sourceId || ''));
      if (error) return NextResponse.json({ error: 'Se reactivó Luz, pero no se pudo marcar la oportunidad como resuelta', details: error.message, dbResult }, { status: 500 });
    }
    const { data: readback } = await supabase.from('whatsapp_human_handoffs').select('*').eq('identity_key', phone).maybeSingle();
    return NextResponse.json({ success: true, action, dbResult, handoff: readback || handoff });
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
