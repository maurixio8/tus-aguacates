/**
 * Canonical Bold webhook receiver.
 *
 * Official URL:
 * https://www.tusaguacates.com/api/webhooks/bold
 *
 * Bold is the only upstream for this route. n8n is intentionally not called
 * from here; payment state and the event ledger live in Supabase.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BoldWebhookPayload {
    event_type?: string;
    event_id?: string;
    timestamp?: string;
    payment?: {
        transaction_id?: string;
        order_id?: string;
        payment_method?: string;
        transaction_date?: string;
    };
    customer?: {
        email?: string;
        name?: string;
        phone?: string;
    };
}

type EventStatus = 'received' | 'processed' | 'duplicate' | 'rejected_signature' | 'invalid_payload' | 'order_not_found' | 'update_error';

function verifyWebhookSignature(payload: string, signature?: string): boolean {
    const signingSecret = process.env.BOLD_SIGNING_SECRET;
    if (!signingSecret || !signature) return false;

    try {
        const expected = createHmac('sha256', signingSecret).update(payload).digest('hex');
        if (signature.length !== expected.length) return false;
        return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

function asTimestamp(value?: string): string | null {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function errorText(error: unknown): string {
    if (!error) return '';
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return String((error as { message?: unknown }).message || error);
    }
    return String(error);
}

async function writeAuditEvent(input: {
    eventId: string | null;
    transactionId: string | null;
    eventType: string;
    orderId: string | null;
    timestamp: string | null;
    signatureValid: boolean;
    status: EventStatus;
    payload: unknown;
    errorMessage?: string | null;
}) {
    return supabase.from('bold_payment_events').insert({
        event_id: input.eventId,
        transaction_id: input.transactionId,
        event_type: input.eventType,
        order_id: input.orderId,
        event_timestamp: input.timestamp,
        signature_valid: input.signatureValid,
        processing_status: input.status,
        payload: input.payload,
        error_message: input.errorMessage || null,
    }).select('id').single();
}

async function findExistingEvent(eventId: string | null, transactionId: string | null) {
    if (eventId) {
        const result = await supabase
            .from('bold_payment_events')
            .select('id, processing_status, order_id')
            .eq('event_id', eventId)
            .limit(1)
            .maybeSingle();
        if (result.data || result.error) return result;
    }

    if (transactionId) {
        return supabase
            .from('bold_payment_events')
            .select('id, processing_status, order_id')
            .eq('transaction_id', transactionId)
            .limit(1)
            .maybeSingle();
    }

    return { data: null, error: null };
}

async function updateAuditEvent(id: string, patch: Record<string, unknown>) {
    const result = await supabase
        .from('bold_payment_events')
        .update({ ...patch, processed_at: new Date().toISOString() })
        .eq('id', id);
    if (result.error) console.error('[Bold Webhook] Failed to update audit row:', result.error);
}

export async function POST(request: NextRequest) {
    const rawBody = await request.text();
    let payload: BoldWebhookPayload;

    try {
        payload = JSON.parse(rawBody) as BoldWebhookPayload;
    } catch {
        await writeAuditEvent({
            eventId: null,
            transactionId: null,
            eventType: 'invalid_payload',
            orderId: null,
            timestamp: null,
            signatureValid: false,
            status: 'invalid_payload',
            payload: { raw_body: rawBody.slice(0, 10000) },
            errorMessage: 'Invalid JSON payload',
        });
        return NextResponse.json({ received: false, error: 'Invalid JSON payload' }, { status: 400 });
    }

    const eventId = payload.event_id ? String(payload.event_id) : null;
    const transactionId = payload.payment?.transaction_id ? String(payload.payment.transaction_id) : null;
    const orderId = payload.payment?.order_id ? String(payload.payment.order_id) : null;
    const eventType = payload.event_type ? String(payload.event_type) : 'unknown';
    const eventTimestamp = asTimestamp(payload.timestamp || payload.payment?.transaction_date);
    const signature = request.headers.get('x-signature')
        || request.headers.get('x-bold-signature')
        || request.headers.get('bold-signature')
        || undefined;
    const signatureValid = verifyWebhookSignature(rawBody, signature);

    if (!signatureValid) {
        await writeAuditEvent({
            eventId,
            transactionId,
            eventType,
            orderId,
            timestamp: eventTimestamp,
            signatureValid: false,
            status: 'rejected_signature',
            payload,
            errorMessage: 'Invalid or missing Bold signature',
        });
        return NextResponse.json({ received: false, error: 'Invalid signature' }, { status: 401 });
    }

    if (!eventId && !transactionId) {
        await writeAuditEvent({
            eventId: null,
            transactionId: null,
            eventType,
            orderId,
            timestamp: eventTimestamp,
            signatureValid: true,
            status: 'invalid_payload',
            payload,
            errorMessage: 'Bold event_id or payment.transaction_id is required for idempotency',
        });
        return NextResponse.json({ received: false, error: 'Missing event_id or transaction_id' }, { status: 400 });
    }

    const existing = await findExistingEvent(eventId, transactionId);
    if (existing.error) {
        console.error('[Bold Webhook] Idempotency lookup failed:', existing.error);
        return NextResponse.json({ received: false, error: 'Idempotency lookup failed' }, { status: 503 });
    }
    if (existing.data) {
        return NextResponse.json({
            received: true,
            duplicate: true,
            event_id: eventId,
            transaction_id: transactionId,
            existing_event_id: existing.data.id,
            processing_status: existing.data.processing_status,
        });
    }

    const inserted = await writeAuditEvent({
        eventId,
        transactionId,
        eventType,
        orderId,
        timestamp: eventTimestamp,
        signatureValid: true,
        status: 'received',
        payload,
    });

    if (inserted.error || !inserted.data) {
        const raced = await findExistingEvent(eventId, transactionId);
        if (!raced.error && raced.data) {
            return NextResponse.json({
                received: true,
                duplicate: true,
                event_id: eventId,
                transaction_id: transactionId,
                existing_event_id: raced.data.id,
                processing_status: raced.data.processing_status,
            });
        }
        console.error('[Bold Webhook] Could not persist audit event:', inserted.error);
        return NextResponse.json({ received: false, error: 'Could not persist event' }, { status: 503 });
    }

    const auditId = inserted.data.id;
    const paymentStatus = eventType === 'payment.approved'
        ? 'pagado'
        : eventType === 'payment.rejected'
            ? 'fallido'
            : eventType === 'void.approved'
                ? 'reembolsado'
                : null;

    if (!paymentStatus || !orderId) {
        await updateAuditEvent(auditId, {
            processing_status: 'processed',
            error_message: !paymentStatus ? `Ignored event type: ${eventType}` : 'Missing payment.order_id',
        });
        return NextResponse.json({ received: true, event_id: eventId, ignored: true });
    }

    const now = new Date().toISOString();
    const paidAt = eventType === 'payment.approved' ? now : null;
    const commonUpdate = {
        payment_status: paymentStatus,
        payment_method: 'bold',
        paid_at: paidAt,
        bold_transaction_id: transactionId,
        bold_payment_method: payload.payment?.payment_method || null,
        updated_at: now,
    };

    // These updates are deliberately independent. A zero-row guest update must
    // not prevent the registered-order update, and vice versa.
    const guestResult = await supabase
        .from('guest_orders')
        .update({ status: paymentStatus === 'pagado' ? 'pagado' : paymentStatus, ...commonUpdate })
        .eq('id', orderId)
        .select('id');

    const ordersResult = await supabase
        .from('orders')
        .update({ status: paymentStatus === 'pagado' ? 'pagado' : paymentStatus, ...commonUpdate })
        .eq('id', orderId)
        .select('id');

    const guestRows = guestResult.error ? 0 : (guestResult.data?.length || 0);
    const orderRows = ordersResult.error ? 0 : (ordersResult.data?.length || 0);
    const matchedTables = [
        ...(guestRows > 0 ? ['guest_orders'] : []),
        ...(orderRows > 0 ? ['orders'] : []),
    ];
    const errors = [
        guestResult.error ? `guest_orders: ${errorText(guestResult.error)}` : '',
        ordersResult.error ? `orders: ${errorText(ordersResult.error)}` : '',
    ].filter(Boolean);

    let processingStatus: EventStatus = 'processed';
    if (matchedTables.length === 0) processingStatus = 'order_not_found';
    else if (errors.length > 0) processingStatus = 'update_error';

    await updateAuditEvent(auditId, {
        processing_status: processingStatus,
        guest_rows_updated: guestRows,
        order_rows_updated: orderRows,
        matched_tables: matchedTables,
        error_message: errors.length ? errors.join(' | ') : null,
    });

    return NextResponse.json({
        received: true,
        event_id: eventId,
        transaction_id: transactionId,
        order_id: orderId,
        payment_status: paymentStatus,
        guest_orders_updated: guestRows,
        orders_updated: orderRows,
        matched_tables: matchedTables,
        processing_status: processingStatus,
    });
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        service: 'Bold Webhook Handler',
        receiver: 'vercel-canonical',
        url: 'https://www.tusaguacates.com/api/webhooks/bold',
        timestamp: new Date().toISOString(),
    });
}
