import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { createSupabaseClient } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

// Configuración CORS para permitir el dashboard
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://admin-dashboard-m9p6qyz27-mauricio-s-projects-2bf4b7a2.vercel.app',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

// Helper function to verify admin authentication
async function verifyAdminAuth(request: NextRequest): Promise<{ success: boolean; adminId?: string; error?: string }> {
  try {
    // Get the admin-token from cookie OR Authorization header
    let token = request.cookies.get('admin-token')?.value;

    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // For same-origin requests from admin dashboard, check referer
    const referer = request.headers.get('referer');
    const isSameOrigin = referer?.includes('/admin');

    if (!token && isSameOrigin) {
      // Allow same-origin requests without token for dashboard
      return { success: true, adminId: 'admin-001' };
    }

    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    // Verify the JWT token
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    // Check if this is an admin token
    if (decoded.type !== 'admin') {
      return { success: false, error: 'Token no válido para administrador' };
    }

    return { success: true, adminId: decoded.id };

  } catch (error) {
    return { success: false, error: 'Error de autenticación' };
  }
}

// GET - List orders with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createSupabaseClient();

    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products:product_id (
            name,
            main_image_url
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply date filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ API: Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Error al cargar pedidos' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      orders: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Create new order manually
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    console.log('📝 API: Creating order:', body);

    // Validate required fields
    const requiredFields = ['customer_name', 'customer_phone', 'delivery_address', 'items'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `El campo ${field} es requerido` },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Debe incluir al menos un producto' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseClient();

    // Calculate total amount
    let totalAmount = 0;
    const orderItems = [];

    for (const item of body.items) {
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Cada item debe tener product_id y quantity válidos' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Get product info
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('id', item.product_id)
        .single();

      if (productError || !product) {
        return NextResponse.json(
          { error: `Producto con ID ${item.product_id} no encontrado` },
          { status: 400, headers: corsHeaders }
        );
      }

      let itemPrice = product.price;
      let variantInfo = null;

      // Handle variant if present
      if (item.variant_id) {
        const { data: variant, error: variantError } = await supabase
          .from('product_variants')
          .select('*')
          .eq('id', item.variant_id)
          .eq('product_id', item.product_id)
          .single();

        if (variantError || !variant) {
          console.log('⚠️ Variant not found, using item price:', item.price);
          // Si no se encuentra la variante pero se envió un precio, usar ese precio
          if (item.price) {
            itemPrice = item.price;
          }
        } else {
          // El precio de la variante está guardado en price_adjustment como precio completo
          itemPrice = variant.price_adjustment || product.price;
          variantInfo = {
            variant_id: variant.id,
            variant_name: variant.variant_name,
            variant_value: variant.variant_value,
            price_adjustment: variant.price_adjustment
          };
        }
      } else if (item.price) {
        // Si se envió un precio directamente, usarlo
        itemPrice = item.price;
      }

      const itemTotal = itemPrice * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        product_name: product.name,
        quantity: item.quantity,
        price: itemPrice,
        total: itemTotal,
        ...variantInfo
      });
    }

    // Usar el total enviado desde el frontend (ya incluye domicilio)
    const finalTotal = body.total_amount || totalAmount;

    // Calcular subtotal (total de productos sin domicilio)
    const subtotal = totalAmount;

    // Mapear métodos de pago del frontend a los de la base de datos
    const paymentMethodMap: Record<string, string> = {
      'efectivo': 'cash',
      'transferencia': 'transfer',
      'tarjeta': 'card',
      'manual': 'cash'
    };
    const mappedPaymentMethod = paymentMethodMap[body.payment_method] || body.payment_method || 'cash';

    // Create the order - user_id es null para pedidos manuales de admin
    // Nota: Asegurarse de que la columna user_id sea nullable en Supabase
    // ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
    const orderInsertData: Record<string, unknown> = {
      customer_name: body.customer_name,
      customer_phone: body.customer_phone,
      customer_email: body.customer_email || null,
      delivery_address: body.delivery_address,
      shipping_address: {
        street_address: body.delivery_address,
        city: body.city || '',
        state: body.state || '',
        postal_code: body.postal_code || null,
        additional_info: body.delivery_notes || null
      },
      delivery_notes: body.delivery_notes || null,
      subtotal: subtotal, // Subtotal sin domicilio
      total: finalTotal, // Total con domicilio (columna requerida)
      total_amount: finalTotal,
      status: 'pending',
      payment_method: mappedPaymentMethod,
      payment_status: 'pending',
      user_id: null, // Pedidos manuales no tienen usuario asociado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ API: Error creating order:', orderError);
      console.error('❌ API: Order data was:', orderInsertData);
      return NextResponse.json(
        { error: 'Error al crear el pedido', details: orderError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    // Create order items
    // Columnas de order_items: order_id, product_id, quantity, unit_price, subtotal, product_snapshot, created_at
    const itemsToInsert = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
      subtotal: item.total,
      product_snapshot: {
        name: item.product_name || 'Producto',
        variant_name: item.variant_name || null,
        variant_value: item.variant_value || null
      },
      created_at: new Date().toISOString()
    }));

    console.log('📦 API: Inserting order items:', JSON.stringify(itemsToInsert, null, 2));

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select();

    if (itemsError) {
      console.error('❌ API: Error creating order items:', itemsError);
      console.error('❌ API: Items data was:', JSON.stringify(itemsToInsert, null, 2));
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id);
      return NextResponse.json(
        { error: 'Error al crear los items del pedido', details: itemsError.message },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Order created successfully:', order);

    return NextResponse.json({
      success: true,
      data: {
        ...order,
        order_items: items
      },
      message: 'Pedido creado exitosamente'
    }, { status: 201, headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error creating order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PATCH - Update order status
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin authentication
    const auth = await verifyAdminAuth(request);
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID de pedido es requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'El estado del pedido es requerido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseClient();

    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('❌ API: Error updating order:', error);
      return NextResponse.json(
        { error: 'Error al actualizar el pedido' },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('✅ API: Order updated successfully:', data);

    return NextResponse.json({
      success: true,
      data,
      message: 'Pedido actualizado exitosamente'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ API: Unexpected error updating order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}