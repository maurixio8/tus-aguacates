import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createUnauthorizedResponse, requireAgentAuth } from '@/lib/agent-auth';
import {
  buildOperationalFlags,
  normalizeOrderStatus,
  normalizePaymentStatus,
  type CanonicalOrderStatus,
} from '@/lib/orders/operational';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ACTIVE_ORDER_STATUSES: CanonicalOrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped'];
const ACTIVE_STATUS_QUERY_VALUES = [
  'pending',
  'pendiente',
  'confirmed',
  'confirmada',
  'confirmado',
  'processing',
  'procesando',
  'en_preparacion',
  'en_preparación',
  'shipped',
  'listo_entrega',
  'en_camino',
];

interface OrderItemSummary {
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface ActiveOrderResponse {
  id: string;
  order_number: string;
  order_type: 'registered' | 'guest' | 'admin_manual';
  customer_name: string | null;
  customer_phone: string | null;
  status: CanonicalOrderStatus;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_method: string | null;
  is_paid: boolean;
  subtotal: number;
  shipping_fee: number | null;
  shipping_fee_calculated: boolean;
  total: number;
  total_amount: number;
  delivery_address: string | null;
  delivery_notes: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
  order_items: OrderItemSummary[];
  operational_flags: string[];
}

interface MatchedActiveOrder {
  comparablePhone: string;
  order: ActiveOrderResponse;
}

interface RegularOrderRow {
  id: string;
  order_number: string | null;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  shipping_address: unknown;
  order_data: unknown;
  subtotal: number | null;
  shipping_fee: number | null;
  total: number | null;
  total_amount: number | null;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  order_items?: Array<{
    product_id: string | null;
    variant_id?: string | null;
    quantity: number | null;
    unit_price: number | null;
    subtotal: number | null;
    variant_name?: string | null;
    variant_value?: string | null;
    product_snapshot?: {
      name?: string | null;
      variant_name?: string | null;
      variant_value?: string | null;
    } | null;
    products?: {
      name?: string | null;
    } | null;
  }>;
}

interface GuestOrderRow {
  id: string;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  total_amount: number | null;
  guest_name: string | null;
  guest_phone: string | null;
  guest_address: string | null;
  order_data: unknown;
  created_at: string;
  updated_at: string;
}

function getSupabaseClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\n/g, '').replace(/\r/g, '').trim();
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseKey = rawKey.replace(/\n/g, '').replace(/\r/g, '').trim();

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  return typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function getStringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getNumberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizePhone(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

function getComparablePhone(value: string | null | undefined): string {
  const digits = normalizePhone(value);

  if (!digits) {
    return '';
  }

  return digits.length > 10 ? digits.slice(-10) : digits;
}

function maskPhone(value: string | null | undefined): string {
  const digits = normalizePhone(value);

  if (!digits) {
    return '';
  }

  return `***${digits.slice(-4)}`;
}

function isActiveStatus(status: string | null | undefined): boolean {
  return ACTIVE_ORDER_STATUSES.includes(normalizeOrderStatus(status));
}

function getRegularOrderType(order: RegularOrderRow): 'registered' | 'admin_manual' {
  return order.user_id ? 'registered' : 'admin_manual';
}

function buildRegularOrderItems(orderItems: RegularOrderRow['order_items']): OrderItemSummary[] {
  return (orderItems || []).map((item) => ({
    product_id: item.product_id || null,
    variant_id: item.variant_id || null,
    product_name: item.products?.name || item.product_snapshot?.name || 'Producto',
    variant_name: item.variant_name || item.variant_value || item.product_snapshot?.variant_name || null,
    quantity: item.quantity || 0,
    unit_price: item.unit_price || 0,
    subtotal: item.subtotal || (item.quantity || 0) * (item.unit_price || 0),
  }));
}

function buildGuestOrderItems(orderData: Record<string, unknown>): OrderItemSummary[] {
  const rawItems = Array.isArray(orderData.items) ? orderData.items : [];

  return rawItems.map((rawItem) => {
    const item = parseJsonObject(rawItem);
    const quantity = getNumberValue(item.quantity) || 0;
    const unitPrice = getNumberValue(item.price) || getNumberValue(item.unit_price) || 0;

    return {
      product_id: getStringValue(item.productId) || getStringValue(item.product_id),
      variant_id: getStringValue(item.variantId) || getStringValue(item.variant_id),
      product_name: getStringValue(item.productName) || getStringValue(item.product_name) || 'Producto',
      variant_name: getStringValue(item.variantName) || getStringValue(item.variant_name),
      quantity,
      unit_price: unitPrice,
      subtotal: quantity * unitPrice,
    };
  });
}

async function getRegularOrderCustomerData(order: RegularOrderRow, supabase: SupabaseClient) {
  if (order.customer_name || order.customer_phone || order.customer_email) {
    return {
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      deliveryAddress: order.delivery_address,
    };
  }

  const shipping = parseJsonObject(order.shipping_address);
  const shippingPhone = getStringValue(shipping.phone);

  if (shippingPhone || getStringValue(shipping.full_name) || getStringValue(shipping.street_address)) {
    return {
      customerName: getStringValue(shipping.full_name),
      customerPhone: shippingPhone,
      deliveryAddress: getStringValue(shipping.street_address),
    };
  }

  if (order.user_id) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
      const metadata = parseJsonObject(userData.user?.user_metadata);
      const metadataPhone = getStringValue(metadata.phone);

      if (metadataPhone || getStringValue(metadata.name) || getStringValue(metadata.address)) {
        return {
          customerName: getStringValue(metadata.name) || getStringValue(metadata.full_name),
          customerPhone: metadataPhone,
          deliveryAddress: getStringValue(metadata.address),
        };
      }
    } catch {
      // no-op
    }
  }

  const orderData = parseJsonObject(order.order_data);
  const customer = parseJsonObject(orderData.customer);

  return {
    customerName: getStringValue(customer.name),
    customerPhone: getStringValue(customer.phone),
    deliveryAddress: getStringValue(customer.address),
  };
}

async function normalizeRegularOrder(order: RegularOrderRow, supabase: SupabaseClient): Promise<MatchedActiveOrder | null> {
  if (!isActiveStatus(order.status)) {
    return null;
  }

  const customerData = await getRegularOrderCustomerData(order, supabase);
  const comparablePhone = getComparablePhone(customerData.customerPhone);

  if (!comparablePhone) {
    return null;
  }

  const items = buildRegularOrderItems(order.order_items);
  const paymentStatus = normalizePaymentStatus(order.payment_status);
  const shippingFee = getNumberValue(order.shipping_fee);

  return {
    comparablePhone,
    order: {
      id: order.id,
      order_number: order.order_number || order.id.slice(-8),
      order_type: getRegularOrderType(order),
      customer_name: customerData.customerName,
      customer_phone: customerData.customerPhone,
      status: normalizeOrderStatus(order.status),
      payment_status: paymentStatus,
      payment_method: order.payment_method || null,
      is_paid: paymentStatus === 'paid',
      subtotal: getNumberValue(order.subtotal) || 0,
      shipping_fee: shippingFee,
      shipping_fee_calculated: shippingFee !== null,
      total: getNumberValue(order.total) || getNumberValue(order.total_amount) || 0,
      total_amount: getNumberValue(order.total_amount) || getNumberValue(order.total) || 0,
      delivery_address: customerData.deliveryAddress,
      delivery_notes: order.delivery_notes || null,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items_count: items.length,
      order_items: items,
      operational_flags: buildOperationalFlags({
        customer_name: customerData.customerName,
        customer_phone: customerData.customerPhone,
        delivery_address: customerData.deliveryAddress,
        order_items: items,
      }),
    },
  };
}

function normalizeGuestOrder(order: GuestOrderRow): MatchedActiveOrder | null {
  if (!isActiveStatus(order.status)) {
    return null;
  }

  const comparablePhone = getComparablePhone(order.guest_phone);

  if (!comparablePhone) {
    return null;
  }

  const orderData = parseJsonObject(order.order_data);
  const items = buildGuestOrderItems(orderData);
  const paymentStatus = normalizePaymentStatus(order.payment_status);
  const shippingFee = getNumberValue(orderData.shipping_cost) || getNumberValue(orderData.shippingFee);
  const deliveryNotes = getStringValue(orderData.delivery_notes) || getStringValue(orderData.deliveryNotes);

  return {
    comparablePhone,
    order: {
      id: order.id,
      order_number: `INV-${order.id.slice(-8)}`,
      order_type: 'guest',
      customer_name: order.guest_name,
      customer_phone: order.guest_phone,
      status: normalizeOrderStatus(order.status),
      payment_status: paymentStatus,
      payment_method: order.payment_method || null,
      is_paid: paymentStatus === 'paid',
      subtotal: getNumberValue(orderData.subtotal) || 0,
      shipping_fee: shippingFee,
      shipping_fee_calculated: shippingFee !== null,
      total: getNumberValue(orderData.total) || getNumberValue(order.total_amount) || getNumberValue(orderData.total_amount) || 0,
      total_amount: getNumberValue(order.total_amount) || getNumberValue(orderData.total_amount) || getNumberValue(orderData.total) || 0,
      delivery_address: order.guest_address,
      delivery_notes: deliveryNotes,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items_count: items.length,
      order_items: items,
      operational_flags: buildOperationalFlags({
        customer_name: order.guest_name,
        customer_phone: order.guest_phone,
        delivery_address: order.guest_address,
        order_items: items,
      }),
    },
  };
}

function createValidationError(message: string) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
    },
    { status: 400 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const authResult = requireAgentAuth(request);

    if (!authResult.success) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const comparablePhone = getComparablePhone(phone);

    if (!comparablePhone || comparablePhone.length < 10) {
      return createValidationError('Query param phone is required and must contain at least 10 digits');
    }

    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (configError) {
      console.error('Supabase configuration error:', configError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Server configuration error',
          },
        },
        { status: 500 }
      );
    }

    const [ordersResult, guestOrdersResult] = await Promise.all([
      supabase
        .from('orders')
        .select(`
          id,
          order_number,
          user_id,
          customer_name,
          customer_email,
          customer_phone,
          delivery_address,
          delivery_notes,
          shipping_address,
          order_data,
          subtotal,
          shipping_fee,
          total,
          total_amount,
          status,
          payment_status,
          payment_method,
          created_at,
          updated_at,
          order_items (
            product_id,
            quantity,
            unit_price,
            subtotal,
            product_snapshot,
            products:product_id (
              name
            )
          )
        `)
        .in('status', ACTIVE_STATUS_QUERY_VALUES)
        .order('created_at', { ascending: false }),
      supabase
        .from('guest_orders')
        .select(`
          id,
          status,
          payment_status,
          payment_method,
          total_amount,
          guest_name,
          guest_phone,
          guest_address,
          order_data,
          created_at,
          updated_at
        `)
        .in('status', ACTIVE_STATUS_QUERY_VALUES)
        .order('created_at', { ascending: false }),
    ]);

    if (ordersResult.error || guestOrdersResult.error) {
      console.error('Error fetching active orders:', {
        ordersError: ordersResult.error,
        guestOrdersError: guestOrdersResult.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch orders',
          },
        },
        { status: 500 }
      );
    }

    const regularMatches = await Promise.all(
      ((ordersResult.data || []) as RegularOrderRow[]).map((order) => normalizeRegularOrder(order, supabase))
    );

    const guestMatches = ((guestOrdersResult.data || []) as GuestOrderRow[])
      .map((order) => normalizeGuestOrder(order));

    const matches = [...regularMatches, ...guestMatches]
      .filter((match): match is MatchedActiveOrder => !!match && match.comparablePhone === comparablePhone)
      .sort((left, right) => new Date(right.order.created_at).getTime() - new Date(left.order.created_at).getTime());

    const latestActiveOrder = matches[0]?.order || null;

    return NextResponse.json({
      success: true,
      data: {
        has_active_order: !!latestActiveOrder,
        active_orders_count: matches.length,
        phone_masked: maskPhone(phone),
        active_statuses: ACTIVE_ORDER_STATUSES,
        order: latestActiveOrder,
      },
    });
  } catch (error) {
    console.error('Unexpected error fetching active order:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
