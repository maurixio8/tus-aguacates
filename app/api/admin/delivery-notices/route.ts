/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, requireAdminRole } from '@/lib/auth-admin';
import { deliveryDateOf, isCancelledStatus, normalizeWhatsAppPhone } from '@/lib/admin-route';

export const dynamic = 'force-dynamic';

const TEMPLATE_NAME = 'aviso_entrega_dia_siguiente';
const TEMPLATE_LANGUAGE = 'es_CO';
const TEMPLATE_STATUS = 'PENDING';
const EXPERIMENTAL = true;

function parseOrderData(row: Record<string, unknown>): Record<string, any> {
  const value = row.order_data;
  if (!value) return {};
  if (typeof value === 'string') {
    try { return JSON.parse(value) || {}; } catch { return {}; }
  }
  return typeof value === 'object' ? value as Record<string, any> : {};
}

function orderStatus(row: Record<string, unknown>): string {
  return String(row.status || row.order_status || '').trim().toLowerCase();
}

function isDelivered(row: Record<string, unknown>): boolean {
  return ['delivered', 'entregado', 'completed', 'completado'].includes(orderStatus(row));
}

function customerName(row: Record<string, unknown>): string {
  return String(row.customer_name || row.guest_name || 'Cliente').trim() || 'Cliente';
}

function customerPhone(row: Record<string, unknown>): string | null {
  return normalizeWhatsAppPhone(row.customer_phone || row.guest_phone || row.phone);
}

function deliveryAddress(row: Record<string, unknown>): string {
  return String(row.delivery_address || row.guest_address || row.shipping_address || '').trim();
}

function missingPin(row: Record<string, unknown>): boolean {
  const data = parseOrderData(row);
  const structured = data.address_structured || data.addressStructured || {};
  const shipping = row.shipping_address && typeof row.shipping_address === 'object' ? row.shipping_address as Record<string, unknown> : {};
  return !(structured.latitude ?? shipping.latitude) || !(structured.longitude ?? shipping.longitude);
}

function noContact(row: Record<string, unknown>, context: Record<string, unknown> | null): boolean {
  const haystack = `${JSON.stringify(row)} ${JSON.stringify(context || {})}`.toLowerCase();
  return /no (recibir|enviar|contactar)|no me escrib|no mensajes|no whatsapp/.test(haystack);
}

function freeText(pinMissing: boolean): string {
  return `Hola. Tu pedido está programado para mañana entre las 2 y las 8 p. m. Por favor confirma que estarás disponible para recibirlo. ${pinMissing ? 'Si falta el pin de ubicación, responde con tu ubicación. ' : ''}Si deseas pagar por anticipado, indícalo; los comprobantes por foto los revisará una persona.`;
}

function nextDayBogota(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value);
  const d = Number(parts.find(p => p.type === 'day')?.value);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10);
}

function buildBatch(rows: Array<{ source: 'orders' | 'guest_orders'; row: Record<string, any> }>, contexts: Record<string, Record<string, any>>, handoffs: Set<string>, targetDate: string) {
  const records: any[] = [];
  for (const item of rows) {
    const row = item.row;
    if (deliveryDateOf(row) !== targetDate) continue;
    const phone = customerPhone(row);
    const key = phone ? `phone:${phone}` : '';
    const context = contexts[key] || contexts[phone || ''] || null;
    const exclusions: string[] = [];
    if (isCancelledStatus(row)) exclusions.push('pedido_cancelado');
    if (isDelivered(row)) exclusions.push('pedido_ya_entregado');
    if (!phone) exclusions.push('sin_telefono_usable');
    if (phone && handoffs.has(phone)) exclusions.push('atencion_humana_activa');
    if (noContact(row, context)) exclusions.push('cliente_pidio_no_recibir_mensajes');
    const lastSeen = context?.last_seen_at ? new Date(context.last_seen_at).getTime() : 0;
    const windowOpen = lastSeen > 0 && Date.now() - lastSeen < 24 * 60 * 60 * 1000;
    const channel = windowOpen ? 'text_free' : 'template';
    const pinMissing = missingPin(row);
    records.push({
      source: item.source,
      order_id: row.id,
      order_number: row.order_number || row.id,
      customer_name: customerName(row),
      phone,
      address: deliveryAddress(row),
      delivery_date: targetDate,
      delivery_window: '2:00 p. m. – 8:00 p. m.',
      pin_missing: pinMissing,
      channel,
      template_name: channel === 'template' ? TEMPLATE_NAME : null,
      template_language: channel === 'template' ? TEMPLATE_LANGUAGE : null,
      template_status: channel === 'template' ? TEMPLATE_STATUS : null,
      draft_text: channel === 'text_free' ? freeText(pinMissing) : null,
      status: exclusions.length ? 'excluded' : 'pending_approval',
      excluded_reasons: exclusions,
      approval_required: true,
      experimental: EXPERIMENTAL,
      context_model: context?.context_model || null,
    });
  }
  return records;
}

async function loadBatch(supabase: ReturnType<typeof createSupabaseClient>, targetDate: string) {
  const [ordersResult, guestsResult, contextsResult, handoffsResult] = await Promise.all([
    supabase.from('orders').select('*').limit(5000),
    supabase.from('guest_orders').select('*').limit(5000),
    supabase.from('whatsapp_audit_context').select('conversation_key,last_seen_at,risk_level,context_model,summary,friction').eq('context_model', 'shadow-reader-v2').limit(1000),
    supabase.from('whatsapp_human_handoffs').select('phone,identity_key').eq('status', 'active').limit(1000),
  ]);
  const error = ordersResult.error || guestsResult.error || contextsResult.error || handoffsResult.error;
  if (error) throw new Error(error.message);
  const contexts: Record<string, Record<string, any>> = {};
  for (const context of contextsResult.data || []) {
    const key = String(context.conversation_key || '');
    contexts[key] = context;
    if (key.startsWith('phone:')) contexts[key.slice(6)] = context;
  }
  const handoffs = new Set<string>((handoffsResult.data || []).map(row => normalizeWhatsAppPhone(row.phone || row.identity_key)).filter(Boolean) as string[]);
  const rows = [
    ...(ordersResult.data || []).map(row => ({ source: 'orders' as const, row })),
    ...(guestsResult.data || []).map(row => ({ source: 'guest_orders' as const, row })),
  ];
  const records = buildBatch(rows, contexts, handoffs, targetDate);
  return {
    schema_version: 'delivery-notice-batch-v1',
    target_delivery_date: targetDate,
    delivery_window: '2:00 p. m. – 8:00 p. m.',
    mode: 'simulation_only',
    sending_enabled: false,
    experimental: EXPERIMENTAL,
    template: { name: TEMPLATE_NAME, language: TEMPLATE_LANGUAGE, status: TEMPLATE_STATUS },
    records,
    counts: {
      total: records.length,
      text_free: records.filter((row: any) => row.status !== 'excluded' && row.channel === 'text_free').length,
      template: records.filter((row: any) => row.status !== 'excluded' && row.channel === 'template').length,
      excluded: records.filter((row: any) => row.status === 'excluded').length,
    },
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const supabase = createSupabaseClient();
  const targetDate = new URL(request.url).searchParams.get('date') || nextDayBogota();
  try {
    const batch = await loadBatch(supabase, targetDate);
    const { data: decisions } = await supabase.from('admin_activity_log').select('id,action,entity_type,entity_id,details,created_at').eq('entity_type', 'delivery_notice_batch').eq('entity_id', targetDate).order('created_at', { ascending: false }).limit(20);
    return NextResponse.json({ success: true, batch, decisions: decisions || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo preparar el lote' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminRole(request, 'admin');
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => ({}));
  const targetDate = String(body.date || nextDayBogota());
  const scope = body.scope === 'selected' ? 'selected' : 'all';
  const selectedIds = Array.isArray(body.orderIds) ? body.orderIds.map(String) : [];
  const supabase = createSupabaseClient();
  try {
    const batch = await loadBatch(supabase, targetDate);
    const selected = batch.records.filter(row => scope === 'all' || selectedIds.includes(String(row.order_id)));
    const outcomes = selected.map(row => {
      if (row.status === 'excluded') return { order_id: row.order_id, status: 'excluded', reason: row.excluded_reasons };
      if (row.channel === 'template' && row.template_status !== 'APPROVED') return { order_id: row.order_id, status: 'waiting_template', reason: 'plantilla_meta_pending', channel: 'template' };
      return { order_id: row.order_id, status: 'would_send', channel: row.channel, conversation_log: 'would_register_outbound_system_message_in_customer_buffer' };
    });
    const details = {
      mode: 'simulation',
      experimental: EXPERIMENTAL,
      scope,
      selected_order_ids: selected.map(row => row.order_id),
      outcome_counts: {
        would_send: outcomes.filter(row => row.status === 'would_send').length,
        waiting_template: outcomes.filter(row => row.status === 'waiting_template').length,
        excluded: outcomes.filter(row => row.status === 'excluded').length,
      },
      outcomes,
      sending_enabled: false,
      executor: 'delivery-notice-action-layer-v1',
      conversation_registration: 'simulation_only_no_buffer_mutation',
    };
    const { data: decision, error } = await supabase.from('admin_activity_log').insert({ admin_id: auth.user?.id, action: 'delivery_notice_batch_approval_simulation', entity_type: 'delivery_notice_batch', entity_id: targetDate, details }).select('*').single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    const { data: readback, error: readbackError } = await supabase.from('admin_activity_log').select('*').eq('id', decision.id).single();
    if (readbackError || !readback) return NextResponse.json({ success: false, error: 'La decisión no pudo leerse de vuelta' }, { status: 500 });
    return NextResponse.json({ success: true, simulation: true, experimental: EXPERIMENTAL, decision: readback, outcomes });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'No se pudo simular la aprobación' }, { status: 500 });
  }
}
