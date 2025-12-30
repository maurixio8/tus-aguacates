/**
 * API Route para Checkout B2B
 * "Tus Aguacates" - E-commerce Platform
 */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import type { B2BCheckoutRequest, B2BCheckoutResponse, B2BProduct } from '@/lib/b2b/b2b-types';
import { calculatePriceForQuantity } from '@/lib/b2b/b2b-pricing';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/b2b/checkout
 * Procesa el checkout B2B (soporta guest y registrado)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener datos del request
    const body: B2BCheckoutRequest = await request.json();

    // Validar datos requeridos
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: { message: 'No hay items en el pedido', code: 'NO_ITEMS' } },
        { status: 400 }
      );
    }

    if (!body.payment_method) {
      return NextResponse.json(
        { success: false, error: { message: 'Método de pago requerido', code: 'NO_PAYMENT_METHOD' } },
        { status: 400 }
      );
    }

    let user_id = null; // Se obtiene de auth si está disponible
    let company_id = body.company_id || null;

    // Si es guest, validar guest_contact_info
    if (!company_id) {
      if (!body.guest_contact_info) {
        return NextResponse.json(
          { success: false, error: { message: 'Información de contacto requerida para compras como invitado', code: 'NO_GUEST_INFO' } },
          { status: 400 }
        );
      }
    }

    // Obtener detalles de productos y validar stock
    const productIds = body.items.map(item => item.product_id);
    const { data: products, error: productsError } = await supabase
      .from('b2b_products')
      .select('*')
      .in('id', productIds);

    if (productsError || !products) {
      return NextResponse.json(
        { success: false, error: { message: 'Error al obtener productos', code: 'PRODUCTS_ERROR' } },
        { status: 400 }
      );
    }

    // Obtener pricing tiers
    const { data: allPricingTiers } = await supabase
      .from('b2b_pricing_tiers')
      .select('*')
      .in('product_id', productIds);

    // Agregar pricing tiers a cada producto
    const productsWithPricing: B2BProduct[] = products.map((p: any) => ({
      ...p,
      pricing_tiers: allPricingTiers?.filter((pt: any) => pt.product_id === p.id) || [],
    }));

    // Validar items y calcular totales
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of body.items) {
      const product = productsWithPricing.find((p: B2BProduct) => p.id === item.product_id);
      if (!product) {
        return NextResponse.json(
          { success: false, error: { message: `Producto ${item.product_id} no encontrado`, code: 'PRODUCT_NOT_FOUND' } },
          { status: 400 }
        );
      }

      // Validar stock
      if (item.quantity > product.stock_quantity) {
        return NextResponse.json(
          { success: false, error: { message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock_quantity}`, code: 'INSUFFICIENT_STOCK' } },
          { status: 400 }
        );
      }

      // Validar cantidad mínima
      if (item.quantity < product.minimum_order_quantity) {
        return NextResponse.json(
          { success: false, error: { message: `Cantidad mínima para ${product.name} es ${product.minimum_order_quantity}`, code: 'MIN_QUANTITY_ERROR' } },
          { status: 400 }
        );
      }

      // Calcular precio con descuento por volumen
      const pricingResult = calculatePriceForQuantity(product, item.quantity);
      subtotal += pricingResult.total_price;

      // Crear item del pedido
      orderItems.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: pricingResult.unit_price,
        discount_percentage: pricingResult.discount_percentage,
        subtotal: pricingResult.total_price,
        product_snapshot: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          main_image_url: product.main_image_url,
        },
        pricing_tier_snapshot: pricingResult.tier ? {
          id: pricingResult.tier.id,
          tier_name: pricingResult.tier.tier_name,
          min_quantity: pricingResult.tier.min_quantity,
          max_quantity: pricingResult.tier.max_quantity,
        } : null,
        applied_tier_id: pricingResult.tier?.id || null,
        applied_tier_name: pricingResult.tier?.tier_name || null,
      });
    }

    // Calcular totales del pedido
    const tax = 0; // Ajustar según país
    const shipping_fee = 0; // Ajustar según zona
    const discount = 0; // Ajustar si hay cupones
    const total = subtotal + tax + shipping_fee - discount;

    // Validar monto mínimo (si hay empresa registrada)
    if (company_id) {
      const { data: company } = await supabase
        .from('b2b_companies')
        .select('minimum_order_amount')
        .eq('id', company_id)
        .single();

      if (company && total < company.minimum_order_amount) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: `El monto mínimo de pedido es ${company.minimum_order_amount}`,
              code: 'MINIMUM_ORDER_ERROR',
              details: { current_total: total, minimum_amount: company.minimum_order_amount }
            }
          },
          { status: 400 }
        );
      }
    }

    // Generar número de orden
    const orderNumber = `B2B-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Crear el pedido
    const { data: order, error: orderError } = await supabase
      .from('b2b_orders')
      .insert({
        order_number: orderNumber,
        company_id,
        user_id,
        guest_contact_info: body.guest_contact_info || null,
        shipping_address: body.shipping_address || null,
        shipping_address_id: body.shipping_address_id || null,
        delivery_notes: body.delivery_notes || null,
        requested_delivery_date: body.requested_delivery_date || null,
        order_notes: body.order_notes || null,
        customer_purchase_order: body.customer_purchase_order || null,
        payment_method: body.payment_method,
        subtotal,
        tax,
        shipping_fee,
        discount,
        total,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating B2B order:', orderError);
      return NextResponse.json(
        { success: false, error: { message: 'Error al crear el pedido', code: 'ORDER_ERROR' } },
        { status: 500 }
      );
    }

    // Crear items del pedido
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await supabase
      .from('b2b_order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      console.error('Error creating B2B order items:', itemsError);
      // Rollback del pedido
      await supabase.from('b2b_orders').delete().eq('id', order.id);
      return NextResponse.json(
        { success: false, error: { message: 'Error al crear los items del pedido', code: 'ITEMS_ERROR' } },
        { status: 500 }
      );
    }

    // TODO: Procesar pago según payment_method
    let payment_url = undefined;
    let payment_reference = undefined;

    if (body.payment_method === 'bold_pay') {
      // TODO: Integrar con Bold Pay
      // payment_url = await createBoldPayPayment(order);
    }

    const response: B2BCheckoutResponse = {
      order: {
        ...order,
        items: orderItemsWithOrderId,
      },
      payment_url,
      payment_reference,
    };

    return NextResponse.json({
      success: true,
      data: response,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in B2B checkout API:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Error interno del servidor', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
