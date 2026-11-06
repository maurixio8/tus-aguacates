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
  const contextResult = await supabase
    .from('whatsapp_audit_context')
    .select('*')
    .eq('context_model', 'shadow-reader-v2')
    .order('risk_level', { ascending: false })
    .order('last_seen_at', { ascending: false })
    .limit(1000);
  const contextHandoffResult = await supabase
    .from('admin_activity_log')
    .select('details,created_at')
    .eq('entity_type', 'whatsapp_context_action')
    .in('action', ['whatsapp_context_reply_handoff', 'priority_context_resolved'])
    .order('created_at', { ascending: false })
    .limit(1000);
  const deliveryStateResult = await supabase
    .from('admin_activity_log')
    .select('details,created_at')
    .eq('entity_type', 'delivery_confirmation')
    .in('action', ['delivery_confirmation_state', 'delivery_confirmation_contacted'])
    .order('created_at', { ascending: false })
    .limit(3000);
  const [ordersResult, guestOrdersResult, orderItemsResult] = await Promise.all([
    supabase.from('orders').select('*').limit(5000),
    supabase.from('guest_orders').select('*').limit(5000),
    supabase.from('order_items').select('*').limit(10000),
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
  const error = findingsResult.error || recoveryResult.error || ripenessResult.error || handoffsResult.error || contextHandoffResult.error || deliveryStateResult.error || ordersResult.error || guestOrdersResult.error || orderItemsResult.error;
  if (error) return NextResponse.json({ error: 'No se pudo cargar la auditoría', details: error.message, code: error.code || null }, { status: 500 });
  const decidedByConversation = new Map<string, { decided_at: string }>();
  for (const row of contextHandoffResult.data || []) {
    const key = String((row.details as any)?.element || '');
    if (key && !decidedByConversation.has(key)) decidedByConversation.set(key, { decided_at: row.created_at });
  }
  const allContexts = contextResult.error ? [] : (contextResult.data || []);
  const excludedOutOfCoverage = (context: any) => { const text = [context.current_state,context.summary,context.friction,context.evidence].join(' ').toLowerCase(); return text.includes('fuera de cobertura') || text.includes('cobertura fuera') || text.includes('fuera de zona') || text.includes('ciudad excluida'); };
  const visibleContexts = allContexts.filter(context => !excludedOutOfCoverage(context));
  const decidedContexts = visibleContexts.filter(context => decidedByConversation.has(context.conversation_key)).map(context => ({ conversation_key: context.conversation_key, customer_masked: context.customer_masked, decided_at: decidedByConversation.get(context.conversation_key)?.decided_at }));
  const pendingContexts = visibleContexts.filter(context => !decidedByConversation.has(context.conversation_key));
  const validPriorityPhone = (value: unknown) => /^57\d{10}$/.test(String(value || '').replace(/\D/g, ''));
  const phoneFromPriorityContext = (value: unknown) => {
    const match = String(value || '').match(/^phone:(57\d{10})$/);
    return match && validPriorityPhone(match[1]) ? match[1] : null;
  };
  const hasDeliveredOrder = (row: any) => (row.related_orders || []).some((order: any) => ['delivered','entregado','completed','completado'].includes(String(order.status || '').toLowerCase()));
  const deliveredPriorityPhones = new Set(relatedOrders.filter((order: any) => ['delivered','entregado','completed','completado'].includes(String(order.status || '').toLowerCase())).flatMap((order: any) => [order.directPhone, order.fallbackPhone]).filter(Boolean).map((value: any) => { const digits = String(value).replace(/\D/g, ''); return digits.length === 10 ? `57${digits}` : digits; }));
  const isOutOfCoverage = (row: any) => { const text = [row.current_state,row.summary,row.evidence,row.priority_reason,row.next_action].join(' ').toLowerCase(); return text.includes('fuera de cobertura') || text.includes('cobertura fuera') || text.includes('fuera de zona') || text.includes('ciudad excluida'); };
  const priorityCases = [
    ...enrichedFindings.filter((row: any) => !hasDeliveredOrder(row) && row.severity === 'rojo' && validPriorityPhone(row.contact_phone)).map((row: any) => ({ key:`finding:${row.id}`, source:'hallazgo crítico', source_kind:'finding', source_id:row.id, customer_masked:row.customer_masked, contact_phone:String(row.contact_phone).replace(/\D/g,''), phone_source:'whatsapp_audit_findings.contact_phone', phone_confidence:'alta', last_seen_at:row.received_at, priority:'alta', priority_reason:'Respuesta de Luz marcada como crítica por el auditor.', summary:row.incoming_text || 'Hallazgo crítico sin mensaje de entrada.', incoming_text:row.incoming_text || '', luz_response:row.luz_response || '', evidence:(row.flags || []).join(' · '), next_action:(row.recommendations || []).join(' · ') || 'Abrir el chat y revisar manualmente.', order_state:'', intent_level:'', intent_score:100 })),
    ...enrichedRecovery.filter((row: any) => !hasDeliveredOrder(row) && ['alta','high'].includes(String(row.intent_level || '').toLowerCase()) && validPriorityPhone(row.contact_phone)).map((row: any) => ({ key:`recovery:${row.id}`, source:'oportunidad de recuperación', source_kind:'recovery', source_id:row.id, customer_masked:row.customer_masked, contact_phone:String(row.contact_phone).replace(/\D/g,''), phone_source:'whatsapp_recovery_opportunities.contact_phone', phone_confidence:'alta', last_seen_at:row.last_seen_at, priority:'alta', priority_reason:'Cliente con intención alta y conversación que requiere intervención humana.', summary:row.conversation_summary || 'Quiere comprar, pero la conversación no quedó resuelta.', incoming_text:'', luz_response:'', evidence:row.evidence || '', next_action:row.recommendation || 'Abrir el chat, revisar el pedido y ayudar a cerrar.', order_state:row.order_state || '', intent_level:row.intent_level || '', intent_score:Number(row.intent_score || 0), payment_state:row.payment_state || '' })),
    ...pendingContexts.filter((row: any) => row.risk_level === 'high' && phoneFromPriorityContext(row.conversation_key) && !deliveredPriorityPhones.has(phoneFromPriorityContext(row.conversation_key) || '')).map((row: any) => ({ key:`context:${row.id || row.conversation_key}`, source:'contexto crítico de conversación', source_kind:'context', source_id:row.id || row.conversation_key, conversation_key:row.conversation_key, customer_masked:row.customer_masked, contact_phone:phoneFromPriorityContext(row.conversation_key), phone_source:'whatsapp_audit_context.conversation_key', phone_confidence:'alta', last_seen_at:row.last_seen_at, priority:'alta', priority_reason:'El auditor marcó la conversación con riesgo alto.', summary:row.summary || 'Conversación de riesgo alto sin resumen.', incoming_text:row.customer_goal || '', luz_response:row.suggested_reply || '', evidence:row.evidence || row.friction || '', next_action:row.action_plan || 'Abrir el chat y revisar manualmente antes de responder.', order_state:row.current_state || '', intent_level:row.intent || '', intent_score:100 }))
  ].filter((row: any) => !isOutOfCoverage(row)).sort((a,b)=>Number(new Date(b.last_seen_at || 0))-Number(new Date(a.last_seen_at || 0)));
  const toFullPhone = (value: unknown) => { const local = normalizePhone(value); return local ? `57${local}` : ''; };
  const dateParts = new Intl.DateTimeFormat('en-CA', { timeZone:'America/Bogota', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
  const todayUtc = Date.UTC(Number(dateParts.find(x=>x.type==='year')?.value), Number(dateParts.find(x=>x.type==='month')?.value)-1, Number(dateParts.find(x=>x.type==='day')?.value));
  const tomorrowDate = new Date(todayUtc + 86400000).toISOString().slice(0,10);
  const tomorrowUtc = new Date(`${tomorrowDate}T00:00:00Z`);
  const tomorrowDay = tomorrowUtc.getUTCDay();
  const isFridayDelivery = tomorrowDay === 5;
  const daysFromTuesday = (tomorrowDay - 2 + 7) % 7;
  const fridayWindowStart = new Date(tomorrowUtc.getTime() - daysFromTuesday * 86400000 + 11 * 3600000);
  const nowIso = new Date().toISOString();
  const stateMap = new Map<string,{ state:string; at:string; by:string }>();
  for (const row of deliveryStateResult.data || []) {
    const details = (row.details || {}) as Record<string, unknown>;
    const key = `${String(details.source || '')}:${String(details.order_id || '')}`;
    const state = String(details.state || (details.result === 'marked_contacted' ? 'contacted' : 'pending'));
    if (key !== ':' && !stateMap.has(key)) stateMap.set(key, { state, at:row.created_at, by:String(details.actor || '') });
  }
  const itemsByOrder = new Map<string, any[]>();
  for (const item of orderItemsResult.data || []) {
    const orderId = String(item.order_id || '');
    if (!orderId) continue;
    const list = itemsByOrder.get(orderId) || [];
    list.push(item);
    itemsByOrder.set(orderId, list);
  }
  const normalizeDeliveryItems = (order: any, guest: boolean) => {
    const rawItems = guest ? (order.order_data?.items || order.items || []) : (itemsByOrder.get(String(order.id)) || order.order_items || []);
    return rawItems.map((item: any) => ({
      name: item.product_name || item.productName || item.name || item.product_snapshot?.name || item.products?.name || 'Producto',
      quantity: Number(item.quantity || 1),
      variant: item.variantName || item.variant_name || item.variant_value || item.product_snapshot?.variant_name || item.product_snapshot?.variant_value || '',
      weight: item.weight ?? item.product_snapshot?.weight ?? '',
      unit: item.unit || item.product_snapshot?.unit || '',
    }));
  };
  const tomorrowOrders = [...(ordersResult.data || []), ...(guestOrdersResult.data || [])].map((order: any) => {
    const guest = Object.prototype.hasOwnProperty.call(order, 'guest_phone');
    const address = guest ? order.guest_address : (typeof order.shipping_address === 'object' ? [order.shipping_address?.street_address, order.shipping_address?.additional_info, order.shipping_address?.city].filter(Boolean).join(', ') : String(order.shipping_address || order.delivery_address || ''));
    const createdAt = order.created_at || null;
    const scheduledByFridayRule = Boolean(isFridayDelivery && createdAt && new Date(createdAt) >= fridayWindowStart && new Date(createdAt) <= new Date(nowIso));
    return { source: guest ? 'guest_orders' : 'orders', id: order.id, order_number: order.order_number || order.id, customer_name: guest ? order.guest_name : (order.customer_name || order.shipping_address?.full_name || order.customer_email || 'Cliente'), phone: toFullPhone(guest ? order.guest_phone : order.customer_phone), address, total: Number(order.total_amount ?? order.total ?? 0), status: order.status || order.order_status || '', order_status: order.order_status || '', payment_status: order.payment_status || '', delivery_date: order.delivery_date || null, created_at: createdAt, scheduled_by: scheduledByFridayRule ? 'Ventas desde martes 6:00 a. m. para entrega viernes' : 'Fecha de entrega registrada', items: normalizeDeliveryItems(order, guest), contactedAt: stateMap.get(`${guest ? 'guest_orders' : 'orders'}:${String(order.id)}`)?.at || null, confirmationState: stateMap.get(`${guest ? 'guest_orders' : 'orders'}:${String(order.id)}`)?.state || 'pending', confirmationBy: stateMap.get(`${guest ? 'guest_orders' : 'orders'}:${String(order.id)}`)?.by || '' };
  }).filter((order: any) => {
    const active = !['cancelled','cancelado','delivered','entregado','completado'].includes(String(order.status).toLowerCase()) && !['cancelled','cancelado','delivered','entregado','completado'].includes(String(order.order_status).toLowerCase());
    return Boolean(order.phone && active && (order.delivery_date === tomorrowDate || (isFridayDelivery && order.scheduled_by.includes('martes 6:00'))));
  });
  return NextResponse.json({ success: true, findings: enrichedFindings, recovery: enrichedRecovery, ripeness: ripenessResult.data || [], handoffs: handoffsResult.data || [], contexts: pendingContexts, decided_contexts: decidedContexts, priorityCases, tomorrowDate, tomorrowOrders });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const body = await request.json();
  const action = body.action;
  const adminName = auth.user?.name || auth.user?.email || 'admin';
  const supabase = createSupabaseClient();
  if (action === 'mark-delivery-contacted' || action === 'mark-delivery-state') {
    const source = String(body.source || '');
    const orderId = String(body.orderId || '');
    const state = action === 'mark-delivery-contacted' ? 'contacted' : String(body.state || '');
    if (!['orders', 'guest_orders'].includes(source) || !orderId) return NextResponse.json({ error: 'Falta identificar el pedido' }, { status: 400 });
    if (!['contacted', 'confirmed', 'review', 'delivered'].includes(state)) return NextResponse.json({ error: 'Estado de confirmación inválido' }, { status: 400 });
    if (state === 'confirmed' || state === 'delivered') {
      const nextStatus = state === 'delivered' ? 'delivered' : 'confirmed';
      const { error: statusError } = await supabase.from(source).update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', orderId);
      if (statusError) return NextResponse.json({ error: 'No se pudo actualizar el estado del pedido', details: statusError.message }, { status: 500 });
    }
    const contactedAt = new Date().toISOString();
    const { data, error } = await supabase.from('admin_activity_log').insert({
      admin_id: auth.user?.id,
      action: 'delivery_confirmation_state',
      entity_type: 'delivery_confirmation',
      entity_id: null,
      details: { source, order_id: orderId, phone: String(body.phone || ''), delivery_date: String(body.deliveryDate || ''), actor: adminName, state, result: 'state_updated', contacted_at: contactedAt },
    }).select('id,details,created_at').single();
    if (error) return NextResponse.json({ error: 'El pedido cambió, pero no se pudo registrar el estado de confirmación', details: error.message }, { status: 500 });
    return NextResponse.json({ success: true, state, contactedAt: data?.created_at || contactedAt, record: data });
  }
  if (action === 'resolve-priority') {
    const sourceKind = String(body.sourceKind || '');
    const sourceId = String(body.sourceId || '');
    if (sourceKind === 'finding') {
      const { error } = await supabase.from('whatsapp_audit_findings').update({ review_status:'approved', updated_at:new Date().toISOString() }).eq('id',sourceId);
      if (error) return NextResponse.json({ error:'No se pudo marcar el hallazgo como resuelto', details:error.message }, { status:500 });
    } else if (sourceKind === 'recovery') {
      const { error } = await supabase.from('whatsapp_recovery_opportunities').update({ status:'resolved', assigned_to:adminName, resolution:'Resuelto desde Prioridad Alta sin contactar por WhatsApp', updated_at:new Date().toISOString() }).eq('id',sourceId);
      if (error) return NextResponse.json({ error:'No se pudo marcar la oportunidad como resuelta', details:error.message }, { status:500 });
    } else if (sourceKind === 'context') {
      const { error } = await supabase.from('admin_activity_log').insert({ admin_id:auth.user?.id, action:'priority_context_resolved', entity_type:'whatsapp_context_action', entity_id:null, details:{ element:String(body.conversationKey || sourceId), phone:String(body.phone || ''), actor:adminName, result:'resolved_without_contact', scope:'conversation', mode:'priority_high' } });
      if (error) return NextResponse.json({ error:'No se pudo registrar la tarjeta como resuelta', details:error.message }, { status:500 });
    } else return NextResponse.json({ error:'Origen de prioridad inválido' }, { status:400 });
    return NextResponse.json({ success:true, action, resolved_without_contact:true });
  }
  if (action === 'pause-priority' || action === 'resume-priority') {
    const phone = String(body.phone || '').replace(/\D/g, '');
    if (!/^57\d{10}$/.test(phone)) return NextResponse.json({ error: 'Teléfono reconciliado inválido' }, { status: 400 });
    const webhookUrl = process.env.N8N_DB_TOOL_WEBHOOK_URL || 'https://n8n.tusaguacates.com/webhook/db-tool-executor';
    const webhookSecret = process.env.N8N_DB_TOOL_WEBHOOK_SECRET;
    if (!webhookSecret) return NextResponse.json({ error: 'Falta configurar la conexión segura con el ejecutor local' }, { status: 503 });
    const operation = action === 'pause-priority' ? 'pause_luz' : 'reactivar_luz';
    const params = action === 'pause-priority' ? { reason: 'Atención humana iniciada desde Prioridad Alta' } : { resolution: 'Atendido por Mauricio desde Prioridad Alta' };
    let dbResult: any;
    try {
      const response = await fetch(webhookUrl, { method:'POST', headers:{'Content-Type':'application/json','X-TA-Admin-Secret':webhookSecret}, body:JSON.stringify({operation,from:phone,params}), cache:'no-store' });
      const text = await response.text(); dbResult = text ? JSON.parse(text) : null;
      if (!response.ok || !dbResult?.success) return NextResponse.json({ error:'El ejecutor local no confirmó el cambio', details:dbResult?.error || `HTTP ${response.status}` }, { status:502 });
    } catch (error) { return NextResponse.json({ error:'No se pudo contactar el ejecutor local', details:error instanceof Error ? error.message : 'error desconocido' }, { status:502 }); }
    if (action === 'pause-priority') {
      const { data, error } = await supabase.from('whatsapp_human_handoffs').upsert({ identity_key:phone, phone, status:'active', started_by:adminName, started_at:new Date().toISOString(), last_human_message_at:new Date().toISOString(), ended_at:null, reason:'EN_REVISION_HUMANA / Prioridad Alta', resolution:null, updated_at:new Date().toISOString() }, { onConflict:'identity_key' }).select().single();
      if (error) return NextResponse.json({ error:'PostgreSQL local cambió, pero no se pudo registrar el handoff', details:error.message, dbResult }, { status:500 });
      return NextResponse.json({ success:true, action, dbResult, handoff:data });
    }
    const { data: handoff, error: handoffError } = await supabase.from('whatsapp_human_handoffs').update({ status:'closed', ended_at:new Date().toISOString(), resolution:'Atendido por Mauricio desde Prioridad Alta', updated_at:new Date().toISOString() }).eq('identity_key',phone).eq('status','active').select().maybeSingle();
    if (handoffError) return NextResponse.json({ error:'PostgreSQL local cambió, pero no se pudo cerrar el handoff', details:handoffError.message, dbResult }, { status:500 });
    if (body.sourceKind === 'finding') {
      const { error } = await supabase.from('whatsapp_audit_findings').update({ review_status:'approved', updated_at:new Date().toISOString() }).eq('id',String(body.sourceId || ''));
      if (error) return NextResponse.json({ error:'Se reactivó Luz, pero no se pudo marcar el hallazgo como atendido', details:error.message, dbResult }, { status:500 });
    } else if (body.sourceKind === 'recovery') {
      const { error } = await supabase.from('whatsapp_recovery_opportunities').update({ status:'resolved', assigned_to:adminName, resolution:'Atendido por Mauricio desde Prioridad Alta', updated_at:new Date().toISOString() }).eq('id',String(body.sourceId || ''));
      if (error) return NextResponse.json({ error:'Se reactivó Luz, pero no se pudo marcar la oportunidad como resuelta', details:error.message, dbResult }, { status:500 });
    }
    if (body.sourceKind === 'context') {
      const { error } = await supabase.from('admin_activity_log').insert({ admin_id: auth.user?.id, action: 'priority_context_resolved', entity_type: 'whatsapp_context_action', entity_id: null, details: { element: String(body.conversationKey || body.sourceId || ''), phone, actor: adminName, result: 'resolved_and_luz_reactivated', scope: 'conversation', mode: 'priority_high' } });
      if (error) return NextResponse.json({ error: 'Se reactivó Luz, pero no se pudo marcar la tarjeta como resuelta', details: error.message, dbResult }, { status: 500 });
    }
    const { data: readback } = await supabase.from('whatsapp_human_handoffs').select('*').eq('identity_key',phone).maybeSingle();
    return NextResponse.json({ success:true, action, dbResult, handoff:readback || handoff });
  }
  if (action === 'context-reply-whatsapp-handoff') {
    const conversationKey = String(body.conversationKey || '').trim();
    const replyAction = ['send', 'edit_send'].includes(String(body.replyAction)) ? String(body.replyAction) : '';
    const originalText = String(body.originalText || '');
    const finalText = String(body.finalText || '');
    if (!conversationKey || !replyAction) return NextResponse.json({ error: 'Falta conversación o acción de respuesta' }, { status: 400 });
    if (!finalText.trim()) return NextResponse.json({ error: 'La respuesta final no puede estar vacía' }, { status: 400 });
    const phoneLocal = conversationKey.startsWith('phone:') ? normalizePhone(conversationKey.slice(6)) : '';
    if (phoneLocal.length !== 10 || !phoneLocal.startsWith('3')) return NextResponse.json({ error: 'Esta conversación no tiene un teléfono utilizable para abrir WhatsApp' }, { status: 400 });
    const waUrl = `https://wa.me/57${phoneLocal}?text=${encodeURIComponent(finalText)}`;
    const details = {
      element: conversationKey,
      action: replyAction === 'edit_send' ? 'editar_y_abrir_whatsapp' : 'abrir_whatsapp_respuesta_sugerida',
      actor: adminName,
      scope: 'conversation',
      mode: 'real_handoff',
      experimental: true,
      original_text: originalText,
      final_text: finalText,
      result: 'wa_link_ready',
      wa_url: waUrl,
      sending_enabled: false,
      ycloud_called: false,
      conversation_registration: 'not_written_until_human_sends_in_whatsapp',
      automation_pause: 'not_applied_until_human_send',
    };
    const { data: decision, error } = await supabase.from('admin_activity_log').insert({ admin_id: auth.user?.id, action: 'whatsapp_context_reply_handoff', entity_type: 'whatsapp_context_action', entity_id: null, details }).select('*').single();
    if (error) return NextResponse.json({ error: 'No se pudo registrar la entrega a WhatsApp', details: error.message }, { status: 500 });
    const { data: readback, error: readbackError } = await supabase.from('admin_activity_log').select('*').eq('id', decision.id).single();
    if (readbackError || !readback) return NextResponse.json({ error: 'La entrega a WhatsApp no pudo leerse de vuelta' }, { status: 500 });
    return NextResponse.json({ success: true, mode: 'real_handoff', sending_enabled: false, waUrl, decision: readback });
  }
  if (action === 'context-reply-simulation') {
    const conversationKey = String(body.conversationKey || '').trim();
    const replyAction = ['send', 'edit_send', 'discard'].includes(String(body.replyAction)) ? String(body.replyAction) : '';
    const originalText = String(body.originalText || '');
    const finalText = String(body.finalText || '');
    if (!conversationKey || !replyAction) return NextResponse.json({ error: 'Falta conversación o acción de respuesta' }, { status: 400 });
    if (replyAction !== 'discard' && !finalText.trim()) return NextResponse.json({ error: 'La respuesta final no puede estar vacía' }, { status: 400 });
    const details = {
      element: conversationKey,
      action: replyAction === 'discard' ? 'descartar_respuesta_sugerida' : replyAction === 'edit_send' ? 'editar_y_enviar_respuesta_sugerida' : 'enviar_respuesta_sugerida',
      actor: adminName,
      scope: 'conversation',
      mode: 'simulation',
      experimental: true,
      original_text: originalText,
      final_text: finalText,
      result: replyAction === 'discard' ? 'discarded_in_simulation' : 'would_send_in_simulation',
      sending_enabled: false,
      ycloud_called: false,
      conversation_registration: 'simulation_only_no_buffer_mutation',
      automation_pause: 'not_applied_in_simulation',
    };
    const { data: decision, error } = await supabase.from('admin_activity_log').insert({ admin_id: auth.user?.id, action: 'whatsapp_context_reply_simulation', entity_type: 'whatsapp_context_action', entity_id: null, details }).select('*').single();
    if (error) return NextResponse.json({ error: 'No se pudo registrar la acción simulada', details: error.message }, { status: 500 });
    const { data: readback, error: readbackError } = await supabase.from('admin_activity_log').select('*').eq('id', decision.id).single();
    if (readbackError || !readback) return NextResponse.json({ error: 'La acción no pudo leerse de vuelta' }, { status: 500 });
    return NextResponse.json({ success: true, simulation: true, decision: readback });
  }
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
