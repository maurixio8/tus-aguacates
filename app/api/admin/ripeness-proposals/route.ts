import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';
type HandoffRow={id?:string;phone?:string;status?:string;started_at?:string;last_human_message_at?:string;updated_at?:string};
type PrioritySourceKind='finding'|'recovery'|'context'|'handoff';
type PrioritySourceRef={source_kind:PrioritySourceKind;source_id:string};

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
  const validPhone = (value: unknown) => /^57\d{10}$/.test(String(value || '').replace(/\D/g, ''));
  const phoneFromConversationKey = (value: unknown) => {
    const match = String(value || '').match(/^phone:(57\d{10})$/);
    return match && validPhone(match[1]) ? match[1] : null;
  };
  const maskPhone = (value: unknown) => {
    const digits = String(value || '').replace(/\D/g, '');
    return digits.length >= 4 ? `***${digits.slice(-4)}` : 'Cliente WhatsApp';
  };
  const coverageExcluded = (value: unknown) => /\b(neiva|fuera\s+de\s+(bogot[aá]|cobertura)|no\s+(hay\s+)?despacho|sin\s+despacho|no\s+despachamos|fuera\s+del\s+área)\b/i.test(String(value || ''));
  const normalizeText = (...values: unknown[]) => values.filter(Boolean).map((value) => String(value)).join(' ').toLowerCase();
  const operationalSignals = (item: any) => {
    const text = normalizeText(item.summary, item.incoming_text, item.luz_response, item.evidence, item.next_action, item.order_state, item.payment_state, item.intent_level);
    return {
      address: /direcci[oó]n|domicilio|entrega|barrio|n[uú]mero|calle|carrera/.test(text),
      productQuantity: /aguacate|producto|cantidad|kilo|kg|unidad|docena|pedido de/.test(text),
      payment: /pago|efectivo|transferencia|nequi|daviplata|tarjeta|contraentrega/.test(text),
      purchase: /compra|pedido|orden|checkout|carrito|quiero\s+(comprar|pedir)|cotizaci[oó]n|total/.test(text),
      complaint: /queja|reclamo|inconform|molest|devoluci[oó]n|problema/.test(text),
    };
  };
  const classifyOperatorCase = (item: any, handoffActive: boolean) => {
    const signals = operationalSignals(item);
    const red = item.severity === 'rojo';
    const highIntent = ['alta', 'high'].includes(String(item.intent_level || '').toLowerCase()) || Number(item.intent_score || 0) >= 70;
    const clearPurchase = signals.address && (signals.purchase || highIntent) && (signals.productQuantity || signals.payment);
    const medium = item.severity === 'amarillo' || item.source_kind === 'context' || signals.complaint || signals.address || signals.productQuantity || signals.payment || signals.purchase;
    const priority = handoffActive || red || highIntent || clearPurchase ? 'high' : medium ? 'medium' : 'low';
    const priority_reason = handoffActive ? 'Atención humana activa; debe mantenerse visible hasta reactivar Luz.' : red ? 'Hallazgo crítico del auditor.' : highIntent || clearPurchase ? 'Señales claras de intención de compra y/o datos operativos para cerrar.' : medium ? 'Hay contexto o advertencia con una acción concreta.' : 'Caso normal o preferencia sin urgencia operativa.';
    return { priority, priority_reason };
  };
  const priorityCases = [...(
    [
    ...findings.filter((row: any) => row.severity === 'rojo' && row.review_status === 'pending' && validPhone(row.contact_phone)).map((row: any) => ({
      key: `finding:${row.id}`,
      source: 'hallazgo crítico',
      source_kind: 'finding',
      source_id: row.id,
      customer_masked: row.customer_masked,
      contact_phone: String(row.contact_phone).replace(/\D/g, ''),
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
    ...recovery.filter((row: any) => !['resolved', 'dismissed'].includes(String(row.status || '').toLowerCase()) && ['alta', 'high'].includes(String(row.intent_level || '').toLowerCase()) && validPhone(row.contact_phone)).map((row: any) => ({
      key: `recovery:${row.id}`,
      source: 'oportunidad de recuperación',
      source_kind: 'recovery',
      source_id: row.id,
      customer_masked: row.customer_masked,
      contact_phone: String(row.contact_phone).replace(/\D/g, ''),
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
    ...(handoffsResult.data || []).filter((handoff: HandoffRow) => validPhone(handoff.phone)).map((handoff: HandoffRow) => ({
      key: `handoff:${handoff.id || handoff.phone}`,
      source: 'atención humana activa',
      source_kind: 'handoff' as const,
      source_id: handoff.id || String(handoff.phone),
      customer_masked: maskPhone(handoff.phone),
      contact_phone: String(handoff.phone).replace(/\D/g, ''),
      phone_source: 'whatsapp_human_handoffs.phone',
      phone_confidence: 'alta',
      last_seen_at: handoff.last_human_message_at || handoff.started_at || handoff.updated_at,
      priority: 'alta',
      priority_reason: 'La conversación está actualmente en atención humana y debe seguir visible hasta reactivar Luz.',
      summary: 'Conversación tomada por Mao; requiere continuidad humana.',
      incoming_text: '',
      luz_response: '',
      evidence: 'handoff activo persistido',
      next_action: 'Continuar la conversación o marcar atendido y reactivar Luz.',
      order_state: '',
      intent_level: '',
      intent_score: 100,
      human_handoff_active: true,
    })),
  ].map((item) => ({
    ...item,
    source_refs: [{ source_kind: item.source_kind, source_id: item.source_id }],
    last_contact_at: item.last_seen_at || null,
    human_handoff_active: (handoffsResult.data || []).some((handoff: HandoffRow) => String(handoff.phone || '').replace(/\D/g, '') === String(item.contact_phone || '').replace(/\D/g, '') && handoff.status === 'active'),
  })).reduce((merged, item) => {
    const identity = item.contact_phone || item.key;
    const previous = merged.get(identity);
    if (!previous) {
      merged.set(identity, item);
      return merged;
    }
    const rank = (source: string) => source === 'handoff' ? 4 : source === 'finding' ? 3 : source === 'context' ? 2 : 1;
    const preferred = rank(item.source_kind) > rank(previous.source_kind) ? item : previous;
    const unique = (values: string[]) => [...new Set(values.filter(Boolean))];
    merged.set(identity, {
      ...preferred,
      source: unique([previous.source, item.source]).join(' + '),
      source_refs: [...previous.source_refs, ...item.source_refs].filter((ref: PrioritySourceRef, index: number, refs: PrioritySourceRef[]) => refs.findIndex((candidate) => candidate.source_kind === ref.source_kind && candidate.source_id === ref.source_id) === index),
      last_contact_at: [previous.last_contact_at, item.last_contact_at].filter(Boolean).sort().at(-1) || null,
      summary: unique([previous.summary, item.summary]).join(' · '),
      evidence: unique([previous.evidence || '', item.evidence || '']).join(' · '),
      next_action: unique([previous.next_action || '', item.next_action || '']).join(' · '),
      human_handoff_active: Boolean(previous.human_handoff_active || item.human_handoff_active),
    });
    return merged;
  }, new Map<string, any>()).values())].sort((a, b) => {
    const aTime = a.last_contact_at ? Number(new Date(a.last_contact_at)) : Number.POSITIVE_INFINITY;
    const bTime = b.last_contact_at ? Number(new Date(b.last_contact_at)) : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
  const operatorCandidates = [
    ...findings.filter((row: any) => row.review_status === 'pending' && validPhone(row.contact_phone)).map((row: any) => ({ source_kind: 'finding', source_id: row.id, contact_phone: String(row.contact_phone).replace(/\D/g, ''), customer_masked: row.customer_masked, severity: row.severity, summary: row.incoming_text || 'Hallazgo de auditoría', incoming_text: row.incoming_text, luz_response: row.luz_response, evidence: (row.flags || []).join(' · '), next_action: (row.recommendations || []).join(' · '), last_activity: row.received_at, source_refs: [{ source_kind: 'finding', source_id: row.id }] })),
    ...recovery.filter((row: any) => !['resolved', 'dismissed'].includes(String(row.status || '').toLowerCase()) && validPhone(row.contact_phone)).map((row: any) => ({ source_kind: 'recovery', source_id: row.id, contact_phone: String(row.contact_phone).replace(/\D/g, ''), customer_masked: row.customer_masked, summary: row.conversation_summary || 'Oportunidad de compra pendiente', evidence: row.evidence, next_action: row.recommendation, last_activity: row.last_seen_at, order_state: row.order_state || row.order_status, payment_state: row.payment_state, intent_level: row.intent_level, intent_score: Number(row.intent_score || 0), source_refs: [{ source_kind: 'recovery', source_id: row.id }] })),
    ...contexts.filter((row: any) => phoneFromConversationKey(row.conversation_key)).map((row: any) => ({ source_kind: 'context', source_id: row.id || row.conversation_key, contact_phone: phoneFromConversationKey(row.conversation_key)!, customer_masked: row.customer_masked, severity: row.risk_level === 'high' ? 'rojo' : row.risk_level === 'medium' ? 'amarillo' : 'verde', summary: row.summary || row.customer_goal, incoming_text: row.customer_goal, evidence: [row.evidence, row.friction].filter(Boolean).join(' · '), next_action: row.action_plan, last_activity: row.last_seen_at, order_state: row.current_state, intent_level: row.intent, source_refs: [{ source_kind: 'context', source_id: row.id || row.conversation_key }] })),
    ...(handoffsResult.data || []).filter((row: HandoffRow) => validPhone(row.phone)).map((row: HandoffRow) => ({ source_kind: 'handoff', source_id: row.id || String(row.phone), contact_phone: String(row.phone).replace(/\D/g, ''), customer_masked: maskPhone(row.phone), summary: 'Conversación tomada por atención humana.', evidence: 'handoff activo persistido', next_action: 'Continuar la conversación o marcar atendido y reactivar Luz.', last_activity: row.last_human_message_at || row.started_at || row.updated_at, source_refs: [{ source_kind: 'handoff', source_id: row.id || String(row.phone) }], human_handoff_active: true })),
  ].filter((item: any) => !coverageExcluded(normalizeText(item.summary, item.incoming_text, item.evidence, item.next_action, item.order_state)));
  const operatorCases = [...operatorCandidates.reduce((merged, item: any) => {
    const previous = merged.get(item.contact_phone);
    if (!previous) { merged.set(item.contact_phone, { ...item }); return merged; }
    const unique = (values: unknown[]) => [...new Set(values.filter(Boolean).map(String))];
    merged.set(item.contact_phone, {
      ...previous,
      customer_masked: previous.customer_masked || item.customer_masked,
      summary: unique([previous.summary, item.summary]).join(' · '),
      evidence: unique([previous.evidence, item.evidence]).join(' · '),
      next_action: unique([previous.next_action, item.next_action]).join(' · '),
      last_activity: [previous.last_activity, item.last_activity].filter(Boolean).sort().at(-1) || null,
      order_state: unique([previous.order_state, item.order_state]).join(' · '),
      payment_state: unique([previous.payment_state, item.payment_state]).join(' · '),
      intent_level: previous.intent_level || item.intent_level,
      intent_score: Math.max(Number(previous.intent_score || 0), Number(item.intent_score || 0)),
      severity: previous.severity === 'rojo' || item.severity === 'rojo' ? 'rojo' : previous.severity === 'amarillo' || item.severity === 'amarillo' ? 'amarillo' : item.severity || previous.severity,
      source_refs: [...(previous.source_refs || []), ...(item.source_refs || [])].filter((ref: PrioritySourceRef, index: number, refs: PrioritySourceRef[]) => refs.findIndex((candidate) => candidate.source_kind === ref.source_kind && candidate.source_id === ref.source_id) === index),
      human_handoff_active: Boolean(previous.human_handoff_active || item.human_handoff_active),
    });
    return merged;
  }, new Map<string, any>()).values()].map((item: any) => ({
    ...item,
    key: `operator:${item.contact_phone}`,
    ...classifyOperatorCase(item, Boolean(item.human_handoff_active)),
    last_activity: item.last_activity || null,
  })).sort((a: any, b: any) => {
    const rank = { high: 0, medium: 1, low: 2 } as Record<string, number>;
    return rank[a.priority] - rank[b.priority] || Number(new Date(b.last_activity || 0)) - Number(new Date(a.last_activity || 0));
  });
  return NextResponse.json({ success: true, findings, recovery, ripeness: ripenessResult.data || [], handoffs: handoffsResult.data || [], contexts, priorityCases, operatorCases });
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
    const phone = String(body.phone || '').replace(/\D/g, '');
    if (!/^57\d{10}$/.test(phone)) return NextResponse.json({ error: 'Teléfono reconciliado inválido' }, { status: 400 });
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
    const sourceRefs: PrioritySourceRef[] = Array.isArray(body.sourceRefs) && body.sourceRefs.length
      ? body.sourceRefs
      : [{ source_kind: body.sourceKind, source_id: String(body.sourceId || '') }];
    for (const ref of sourceRefs) {
      if (!ref.source_id) continue;
      if (ref.source_kind === 'finding') {
        const { error } = await supabase.from('whatsapp_audit_findings').update({ review_status: 'approved', updated_at: new Date().toISOString() }).eq('id', ref.source_id);
        if (error) return NextResponse.json({ error: 'Se reactivó Luz, pero no se pudo marcar todos los hallazgos como atendidos', details: error.message, dbResult }, { status: 500 });
      } else if (ref.source_kind === 'recovery') {
        const { error } = await supabase.from('whatsapp_recovery_opportunities').update({ status: 'resolved', assigned_to: adminName, resolution: 'Atendido por Mauricio desde Prioridad Alta', updated_at: new Date().toISOString() }).eq('id', ref.source_id);
        if (error) return NextResponse.json({ error: 'Se reactivó Luz, pero no se pudieron marcar todas las oportunidades como resueltas', details: error.message, dbResult }, { status: 500 });
      }
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
