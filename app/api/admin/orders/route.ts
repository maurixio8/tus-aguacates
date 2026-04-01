import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import {
  buildOperationalFlags,
  normalizeOrderStatus,
  normalizePaymentStatus,
} from '@/lib/orders/operational';

export const dynamic = 'force-dynamic';

// Configuración CORS para permitir el dashboard (mismo dominio y producción)
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production'
    ? 'https://tus-aguacates.vercel.app'
    : 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Cookie, Set-Cookie',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// Manejar solicitudes OPTIONS para CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { headers: corsHeaders });
}

// Función para parsear dirección y extraer componentes
function parseAddress(address: string): { city: string; state: string; street: string } {
  if (!address || typeof address !== 'string') {
    return { city: 'Bogotá', state: 'Cundinamarca', street: 'Dirección no proporcionada' };
  }

  // Lógica inteligente para extraer ciudad de la dirección
  const parts = address.split(',');
  const lastPart = parts[parts.length - 1]?.trim() || '';

  // Intentar identificar patrones comunes de direcciones colombianas
  const cityPatterns = ['bogotá', 'medellín', 'cali', 'barranquilla', 'cartagena'];
  const detectedCity = cityPatterns.find(city =>
    lastPart.toLowerCase().includes(city)
  ) || 'Bogotá';

  const state = detectedCity === 'Bogotá' ? 'Cundinamarca' :
    detectedCity === 'Medellín' ? 'Antioquia' :
      detectedCity === 'Cali' ? 'Valle del Cauca' :
        detectedCity === 'Barranquilla' ? 'Atlántico' :
          detectedCity === 'Cartagena' ? 'Bolívar' :
            'Cundinamarca';

  const street = parts[0]?.trim() || address;

  return {
    city: detectedCity,
    state,
    street
  };
}

// Helper function to extract customer data from orders
async function getCustomerData(order: any, supabase: any): Promise<{
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
}> {
  console.log('🔍 Getting customer data for order:', order.id);

  // Intento 1: Campos directos de la tabla orders (pedidos manuales del admin)
  if (order.customer_name || order.customer_phone || order.customer_email) {
    console.log('✅ Found customer data in direct fields');
    return {
      customer_name: order.customer_name || null,
      customer_email: order.customer_email || null,
      customer_phone: order.customer_phone || null,
      delivery_address: order.delivery_address || null
    };
  }

  // Intento 2: Extraer de shipping_address (JSON)
  if (order.shipping_address) {
    try {
      const shipping = JSON.parse(order.shipping_address);
      console.log('✅ Found customer data in shipping_address');
      return {
        customer_name: shipping.full_name || null,
        customer_phone: shipping.phone || null,
        customer_email: shipping.email || null,
        delivery_address: shipping.street_address || null
      };
    } catch (e) {
      console.log('❌ Error parsing shipping_address:', e);
    }
  }

  // Intento 3: Buscar en auth.users por user_id (para pedidos de clientes registrados)
  if (order.user_id) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
      const meta = userData.user?.user_metadata;
      if (meta) {
        console.log('✅ Found customer data in auth.users metadata');
        return {
          customer_name: meta.name || meta.full_name || null,
          customer_phone: meta.phone || null,
          customer_email: userData.user?.email || null,
          delivery_address: meta.address || null
        };
      }
    } catch (e) {
      console.log('❌ Error fetching user data:', e);
    }
  }

  // Intento 4: Revisar si hay datos en order_data (para compatibilidad con pedidos antiguos)
  if (order.order_data) {
    try {
      const orderData = typeof order.order_data === 'string'
        ? JSON.parse(order.order_data)
        : order.order_data;

      if (orderData.customer) {
        console.log('✅ Found customer data in order_data');
        return {
          customer_name: orderData.customer.name || null,
          customer_phone: orderData.customer.phone || null,
          customer_email: orderData.customer.email || null,
          delivery_address: orderData.customer.address || null
        };
      }
    } catch (e) {
      console.log('❌ Error parsing order_data:', e);
    }
  }

  console.log('⚠️ No customer data found, returning nulls');
  // Valores por defecto si no se encuentra nada
  return {
    customer_name: null,
    customer_email: null,
    customer_phone: null,
    delivery_address: null
  };
}

function parseJsonObject(value: any): Record<string, any> {
  if (!value) {
    return {};
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof value === 'object' ? value : {};
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
    const paymentStatus = searchParams.get('payment_status') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createSupabaseClient();

    console.log('🔍 API Admin: Consultando pedidos...');

    // Consultar ambos tipos de pedidos: normales y de invitados
    const [ordersData, guestOrdersData] = await Promise.all([
      // Pedidos de usuarios registrados
      supabase
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
        `)
        .order('created_at', { ascending: false }),

      // Pedidos de invitados
      supabase
        .from('guest_orders')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    console.log('📊 API Admin: Resultados de consultas:', {
      ordersError: ordersData.error,
      ordersCount: ordersData.data?.length || 0,
      guestOrdersError: guestOrdersData.error,
      guestOrdersCount: guestOrdersData.data?.length || 0
    });

    // Si hay error en guest_orders, mostrar detalles
    if (guestOrdersData.error) {
      console.error('❌ API Admin: Error en guest_orders:', {
        error: guestOrdersData.error,
        details: guestOrdersData.error.details,
        hint: guestOrdersData.error.hint,
        code: guestOrdersData.error.code
      });
    }

    // Mostrar algunos datos de ejemplo
    if (guestOrdersData.data && guestOrdersData.data.length > 0) {
      console.log('👥 API Admin: Ejemplos de pedidos de invitados:', guestOrdersData.data.slice(0, 2));
    }

    // Combinar y formatear los resultados
    let allOrders: any[] = [];
    const orderIds = new Set<string>();

    // Función para verificar duplicados
    const checkDuplicate = (order: any) => {
      if (orderIds.has(order.id)) {
        console.warn(`⚠️ API: Order ID ${order.id} (${order.order_number}) is duplicated!`);
        return true;
      }
      orderIds.add(order.id);
      return false;
    };

    const getRegularOrderType = (order: any) => {
      return order.user_id ? 'registered' : 'admin_manual';
    };

    // Procesar pedidos normales
    if (ordersData.data) {
      console.log('📋 Processing regular orders:', ordersData.data.length, 'orders');
      const regularOrdersWithCustomerData = await Promise.all(
        ordersData.data.map(async (order: any) => {
          const customerData = await getCustomerData(order, supabase);
          console.log('👤 Customer data for order', order.id, ':', customerData);

          // Log items for registered orders
          if (order.order_items && order.order_items.length > 0) {
            console.log(`📦 API: Order ${order.id.substring(0,8)} has ${order.order_items.length} items:`,
              order.order_items.map((item: any) => ({
                product_id: item.product_id,
                variant_id: item.variant_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                product_name: item.products?.name || item.product_snapshot?.name,
                variant_name: item.variant_name || item.variant_value || null,
                variantName: item.variant_name || item.variant_value || null
              }))
            );
          }

          // Agregar variant_name a cada item del pedido para la lista de compras
          const orderItemsWithVariants = order.order_items?.map((item: any) => ({
            ...item,
            variantName: item.variant_name || item.variant_value || null,
            product_snapshot: {
              ...item.product_snapshot,
              variant_name: item.variant_name || item.variant_value || null,
              variant_value: item.variant_value || null
            }
          })) || [];

          return {
            ...order,
            order_items: orderItemsWithVariants,
            status: normalizeOrderStatus(order.status),
            payment_status: normalizePaymentStatus(order.payment_status),
            ...customerData,
            order_type: getRegularOrderType(order),
            operational_flags: buildOperationalFlags({
              ...customerData,
              order_items: orderItemsWithVariants,
            }),
          };
        })
      );
      // Check for duplicates and add
      regularOrdersWithCustomerData.forEach(order => {
        if (!checkDuplicate(order)) {
          allOrders.push(order);
        }
      });
      console.log('✅ Processed', regularOrdersWithCustomerData.length, 'regular orders with customer data');
    }

    // Procesar pedidos de invitados
    if (guestOrdersData.data) {
      const guestOrders = guestOrdersData.data.map((order: any) => {
        // Extraer items de order_data y mapear de camelCase a snake_case
        let orderItems: any[] = [];

        try {
          let parsedData: any;

          // order_data puede venir como string u objeto
          if (typeof order.order_data === 'string') {
            parsedData = JSON.parse(order.order_data);
          } else if (order.order_data && typeof order.order_data === 'object') {
            parsedData = order.order_data;
          }

          // Extraer items si existen
          if (parsedData?.items && Array.isArray(parsedData.items)) {
            console.log(`✅ API: Extracting ${parsedData.items.length} items from guest order ${order.id.substring(0,8)}`);

            // Mapear de camelCase (BD) a snake_case (frontend esperado)
            orderItems = parsedData.items.map((item: any) => ({
              id: item.id || null,
              product_id: item.productId || item.product_id || null,
              variant_id: item.variantId || item.variant_id || null,
              quantity: item.quantity || 0,
              unit_price: item.price || item.unit_price || 0,
              subtotal: (item.quantity || 0) * (item.price || item.unit_price || 0),
              product_name: item.productName || item.product_name || 'Producto sin nombre',
              variantName: item.variantName || item.variant_name || null,
              variant_name: item.variantName || item.variant_name || null,
                product_snapshot: {
                  name: item.productName || item.product_name || 'Producto',
                  price: item.price || item.unit_price || 0,
                  variant_name: item.variantName || item.variant_name || 'Presentación',
                  variant_value: item.variantName || item.variant_name || null
                }
            }));

            console.log(`✅ API: Mapped ${orderItems.length} items for guest order`);
            console.log(`📦 API: Items details:`, orderItems.map(item => ({
              product_id: item.product_id,
              variant_id: item.variant_id,
              product_name: item.product_name,
              variant_name: item.variant_name,
              quantity: item.quantity,
              unit_price: item.unit_price
            })));
          } else {
            console.warn(`⚠️ API: No items found in guest order ${order.id.substring(0, 8)}`);
          }
        } catch (error) {
          console.error(`❌ API: Error parsing order_data for guest order ${order.id}:`, error);
        }

        return {
          id: order.id,
          order_number: `INV-${order.id.toString().slice(-8)}`, // Formato INV-XXXXXXXX
          user_id: null,
          status: normalizeOrderStatus(order.status),
          subtotal: order.order_data?.subtotal || 0,
          total: order.total_amount,
          total_amount: order.total_amount,
          customer_name: order.guest_name,
          customer_email: order.guest_email,
          customer_phone: order.guest_phone,
          delivery_address: order.guest_address,
          delivery_notes: order.order_data?.delivery_notes || order.order_data?.deliveryNotes || null,
          order_data: order.order_data,
          order_items: orderItems, // ← AGREGADO: Items correctamente mapeados
          created_at: order.created_at,
          updated_at: order.updated_at,
          order_type: 'guest',
          payment_status: normalizePaymentStatus(order.payment_status),
          payment_method: order.payment_method || null,
          operational_flags: buildOperationalFlags({
            customer_name: order.guest_name,
            customer_phone: order.guest_phone,
            delivery_address: order.guest_address,
            order_items: orderItems,
          }),
        };
      });

      // Check for duplicates and add
      guestOrders.forEach(order => {
        if (!checkDuplicate(order)) {
          allOrders.push(order);
        }
      });

      console.log(`✅ Processed ${guestOrders.length} guest orders`);
    }

    // Ordenar todos los pedidos por fecha
    allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Log de estadísticas finales
    console.log('📊 API Admin: Estadísticas finales:', {
      total_orders: allOrders.length,
      orders_by_type: {
        registered: allOrders.filter(o => o.order_type === 'registered').length,
        guest: allOrders.filter(o => o.order_type === 'guest').length,
        admin_manual: allOrders.filter(o => o.order_type === 'admin_manual').length
      },
      orders_with_items: allOrders.filter(o => o.order_items && o.order_items.length > 0).length,
      orders_without_items: allOrders.filter(o => !o.order_items || o.order_items.length === 0).length
    });

    // Log detallado de items duplicados dentro de cada pedido
    allOrders.forEach(order => {
      if (order.order_items && order.order_items.length > 1) {
        const itemsByKey = new Map<string, number>();
        order.order_items.forEach((item: any) => {
          const key = `${item.product_id}-${item.variant_id || 'no-variant'}`;
          itemsByKey.set(key, (itemsByKey.get(key) || 0) + 1);
        });

        const duplicates = Array.from(itemsByKey.entries()).filter(([_, count]) => count > 1);
        if (duplicates.length > 0) {
          console.warn(`⚠️ API: Order ${order.order_number} (${order.order_type}) has duplicate items:`,
            duplicates.map(([key, count]) => ({ key, count }))
          );
        }
      }
    });

    // Apply status filter a todos los pedidos
    if (status && status !== 'all') {
      allOrders = allOrders.filter(order => order.status === normalizeOrderStatus(status));
    }

    // Apply payment_status filter a todos los pedidos
    if (paymentStatus && paymentStatus !== 'all') {
      allOrders = allOrders.filter(
        order => order.payment_status === normalizePaymentStatus(paymentStatus)
      );
    }

    // Apply date filters - usar comparación de fechas real, no strings
    if (dateFrom || dateTo) {
      allOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);

        if (dateFrom) {
          // dateFrom es YYYY-MM-DD, crear fecha al inicio del día en Colombia (UTC-5)
          const fromDate = new Date(dateFrom + 'T00:00:00-05:00');
          if (orderDate < fromDate) return false;
        }

        if (dateTo) {
          // dateTo es YYYY-MM-DD, crear fecha al final del día en Colombia
          const toDate = new Date(dateTo + 'T23:59:59-05:00');
          if (orderDate > toDate) return false;
        }

        return true;
      });
    }

    // Re-calcular paginación después de filtrar
    const filteredStartIndex = (page - 1) * limit;
    const filteredEndIndex = page * limit;
    const paginatedOrders = allOrders.slice(filteredStartIndex, filteredEndIndex);

    const data = paginatedOrders;
    const error = null;
    const count = allOrders.length;

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
    console.log('🔐 API: Starting order creation POST request...');
    const auth = await verifyAdminAuth(request);
    console.log('✅ API: Auth result:', { success: auth.success, adminId: auth.adminId, error: auth.error });

    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    console.log('📝 API: Order creation request received:', {
      hasCustomerName: !!body.customer_name,
      hasCustomerPhone: !!body.customer_phone,
      hasDeliveryAddress: !!body.delivery_address,
      itemsCount: Array.isArray(body.items) ? body.items.length : 0,
      totalAmount: body.total_amount,
      paymentMethod: body.payment_method,
      timestamp: new Date().toISOString()
    });

    // Validaciones robustas al inicio
    const validationErrors = [];

    if (!body.customer_name?.trim()) {
      validationErrors.push('El nombre del cliente es requerido');
    }

    if (!body.customer_phone?.trim()) {
      validationErrors.push('El teléfono del cliente es requerido');
    }

    if (!body.delivery_address?.trim()) {
      validationErrors.push('La dirección de entrega es requerida');
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      validationErrors.push('Debe incluir al menos un producto');
    }

    // Validar que los productos tengan la estructura correcta
    if (Array.isArray(body.items)) {
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i];
        if (!item.product_id) {
          validationErrors.push(`El producto en posición ${i + 1} no tiene product_id`);
        }
        if (!item.quantity || item.quantity <= 0) {
          validationErrors.push(`El producto en posición ${i + 1} debe tener cantidad válida`);
        }
        if (!item.price || item.price <= 0) {
          validationErrors.push(`El producto en posición ${i + 1} debe tener precio válido`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationErrors,
          receivedFields: Object.keys(body)
        },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('🔗 API: Initializing Supabase client...');
    const supabase = createSupabaseClient();
    console.log('✅ API: Supabase client initialized');

    // Calculate total amount
    console.log('💰 API: Calculating order totals...');
    let totalAmount = 0;
    const orderItems = [];

    for (const item of body.items) {
      console.log(`📦 API: Processing item ${orderItems.length + 1}:`, {
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        variant_id: item.variant_id
      });
      if (!item.product_id || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Cada item debe tener product_id y quantity válidos' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Get product info
      console.log(`🔍 API: Fetching product ${item.product_id}...`);
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price')
        .eq('id', item.product_id)
        .single();

      console.log(`📊 API: Product fetch result:`, {
        found: !!product,
        error: !!productError,
        product_id: item.product_id
      });

      if (productError || !product) {
        console.error(`❌ API: Product ${item.product_id} not found:`, productError);
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

    // Usar directamente los valores del frontend (ya están en el formato correcto)
    const mappedPaymentMethod = body.payment_method || 'efectivo';

    // Log para depuración del método de pago
    console.log('💳 Payment method mapping:', {
      original: body.payment_method,
      mapped: mappedPaymentMethod
    });

    // Parsear dirección para extraer componentes
    const address = parseAddress(body.delivery_address);
    const shippingCost = typeof body.shipping_fee === 'number'
      ? body.shipping_fee
      : finalTotal - subtotal;

    // Create the order - user_id es null para pedidos manuales de admin
    const orderInsertData: Record<string, unknown> = {
      customer_name: body.customer_name?.trim(),
      customer_phone: body.customer_phone?.trim(),
      customer_email: body.customer_email?.trim() || null,
      delivery_address: body.delivery_address?.trim(),
      shipping_address: {
        street_address: address.street,
        city: address.city,
        state: address.state,
        postal_code: null, // Campo opcional
        additional_info: body.delivery_notes?.trim() || null
      },
      delivery_notes: body.delivery_notes?.trim() || null,
      subtotal: subtotal,
      tax: 0, // Valor por defecto para pedidos manuales
      discount: 0, // Valor por defecto para pedidos manuales
      shipping_fee: shippingCost,
      total: finalTotal,
      total_amount: finalTotal,
      status: 'pending',
      payment_method: mappedPaymentMethod,
      payment_status: 'pending',
      user_id: null, // Pedidos manuales no tienen usuario asociado
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Agregar logging detallado antes y después de la inserción
    console.log('📝 API: Attempting to create order:', {
      orderData: {
        ...orderInsertData,
        // Log basic info without sensitive data
        customer_name: orderInsertData.customer_name,
        customer_phone: typeof orderInsertData.customer_phone === 'string' ? orderInsertData.customer_phone.slice(-4) : orderInsertData.customer_phone, // Last 4 digits only
        total_amount: orderInsertData.total_amount,
        status: orderInsertData.status,
        user_id: orderInsertData.user_id
      },
      receivedBodyFields: Object.keys(body),
      calculatedValues: {
        subtotal,
        shippingCost,
        finalTotal,
        parsedAddress: address
      },
      timestamp: new Date().toISOString()
    });

    console.log('💾 API: Executing order insert query...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderInsertData)
      .select('id, order_number, status, total_amount, created_at')
      .single();

    console.log('📊 API: Order insert result:', {
      success: !orderError,
      orderId: order?.id,
      orderError: orderError ? {
        message: orderError.message,
        code: orderError.code,
        details: orderError.details,
        hint: orderError.hint
      } : null
    });

    if (orderError) {
      console.error('❌ Detailed order creation error:', {
        error: orderError,
        details: orderError.details,
        hint: orderError.hint,
        code: orderError.code,
        orderData: orderInsertData,
        receivedFields: Object.keys(body),
        orderDataFields: Object.keys(orderInsertData)
      });
      return NextResponse.json(
        {
          error: 'Error al crear el pedido',
          details: orderError.message,
          debug: {
            receivedFields: Object.keys(body),
            orderDataFields: Object.keys(orderInsertData)
          }
        },
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

    console.log('📦 API: Inserting order items:', {
      orderId: order.id,
      itemsCount: itemsToInsert.length,
      itemsSummary: itemsToInsert.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      }))
    });

    console.log('💾 API: Executing order_items insert query...');
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsToInsert)
      .select('id, product_id, quantity, unit_price');

    console.log('📊 API: Order items insert result:', {
      success: !itemsError,
      itemsInserted: items?.length || 0,
      itemsError: itemsError ? {
        message: itemsError.message,
        code: itemsError.code,
        details: itemsError.details,
        hint: itemsError.hint
      } : null
    });

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

// PATCH - Update order status or items
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
    const { status, items, total, customerData } = body;

    const supabase = createSupabaseClient();

    // Determinar si el pedido es de invitado o registrado
    // Primero verificar en guest_orders, si no existe, buscar en orders
    let isGuestOrder = false;
    const { data: guestOrderCheck } = await supabase
      .from('guest_orders')
      .select('id')
      .eq('id', orderId)
      .single();

    if (guestOrderCheck) {
      isGuestOrder = true;
      console.log('📝 API: Detected guest order:', orderId);
    } else {
      console.log('📝 API: Detected registered order:', orderId);
    }

    // If updating customer data
    let customerDataUpdated = false;

    if (customerData) {
      console.log('📝 API: Updating customer data for order:', orderId, customerData);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      // Mapear campos según tipo de pedido
      if (isGuestOrder) {
        const { data: currentGuestOrder } = await supabase
          .from('guest_orders')
          .select('order_data')
          .eq('id', orderId)
          .single();

        const nextOrderData = parseJsonObject(currentGuestOrder?.order_data);
        const nextCustomer = {
          ...(nextOrderData.customer && typeof nextOrderData.customer === 'object' ? nextOrderData.customer : {})
        };
        // Para guest_orders, los campos son: guest_name, guest_phone, guest_email, guest_address
        if (customerData.customer_name !== undefined) {
          const value = customerData.customer_name.trim();
          updateData.guest_name = value;
          nextCustomer.name = value;
          nextCustomer.full_name = value;
        }
        if (customerData.customer_phone !== undefined) {
          const value = customerData.customer_phone.trim();
          updateData.guest_phone = value;
          nextCustomer.phone = value;
        }
        if (customerData.customer_email !== undefined) {
          const value = customerData.customer_email.trim() || null;
          updateData.guest_email = value;
          nextCustomer.email = value;
        }
        if (customerData.delivery_address !== undefined) {
          updateData.guest_address = customerData.delivery_address.trim();
        }
      } else {
        // Para orders, usar campos normales
        const { data: currentOrder } = await supabase
          .from('orders')
          .select('order_data')
          .eq('id', orderId)
          .single();

        const nextOrderData = parseJsonObject(currentOrder?.order_data);
        const nextCustomer = {
          ...(nextOrderData.customer && typeof nextOrderData.customer === 'object' ? nextOrderData.customer : {})
        };

        if (customerData.customer_name !== undefined) {
          updateData.customer_name = customerData.customer_name.trim();
          nextCustomer.name = customerData.customer_name.trim();
          nextCustomer.full_name = customerData.customer_name.trim();
        }
        if (customerData.customer_phone !== undefined) {
          updateData.customer_phone = customerData.customer_phone.trim();
          nextCustomer.phone = customerData.customer_phone.trim();
        }
        if (customerData.customer_email !== undefined) {
          const value = customerData.customer_email.trim() || null;
          updateData.customer_email = value;
          nextCustomer.email = value;
        }
        if (customerData.delivery_address !== undefined) {
          updateData.delivery_address = customerData.delivery_address.trim();
          nextCustomer.address = customerData.delivery_address.trim();
          nextCustomer.delivery_address = customerData.delivery_address.trim();
        }
        if (customerData.delivery_notes !== undefined) {
          const value = customerData.delivery_notes.trim() || null;
          nextOrderData.delivery_notes = value;
        }

        nextOrderData.customer = nextCustomer;
        updateData.order_data = nextOrderData;
      }

      const tableName = isGuestOrder ? 'guest_orders' : 'orders';
      const { error: customerUpdateError } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', orderId);

      if (customerUpdateError) {
        console.error('❌ API: Error updating customer data:', customerUpdateError);
        return NextResponse.json(
          { error: 'Error al actualizar datos del cliente', details: customerUpdateError.message },
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('✅ API: Customer data updated successfully');
    }

    if (customerData) {
      customerDataUpdated = true;
    }

    // If updating items
    if (items && Array.isArray(items)) {
      console.log('📝 API: Updating order items for order:', orderId, 'isGuest:', isGuestOrder);

      if (isGuestOrder) {
        // Para pedidos guest, actualizar el campo 'items' dentro del JSON order_data
        // Primero obtener el order_data actual para no perder otros datos
        const { data: currentGuestOrder } = await supabase
          .from('guest_orders')
          .select('order_data')
          .eq('id', orderId)
          .single();

        let orderData = currentGuestOrder?.order_data || {};
        if (typeof orderData === 'string') {
          try {
            orderData = JSON.parse(orderData);
          } catch (e) {
            orderData = {};
          }
        }

        const guestItems = items.map((item: any) => ({
          product_id: item.product_id,
          productName: item.product_name || 'Producto',
          variantName: item.variant_name || null,
          quantity: item.quantity,
          price: item.unit_price,
          unit_price: item.unit_price
        }));

        const subtotal = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);

        let newTotal = 0;
        let shippingCost = 0;

        // Check if total is provided in the body (it should be from EditOrderModal)
        // 'total' is destructured from body at the top of the function
        if (total && total > 0) {
          newTotal = total;
          // Calculate implied shipping
          // Total = Subtotal + Shipping - Discount
          // Shipping = Total - Subtotal + Discount
          const discount = orderData.discount || 0;
          shippingCost = newTotal - subtotal + discount;
        } else {
          // Fallback to existing logic if no total provided
          shippingCost = orderData.shipping_cost || orderData.shippingFee || 0;
          const discount = orderData.discount || 0;
          newTotal = subtotal + shippingCost - discount;
        }

        // Validar costo de envío (Backend Safeguard)
        // Regla retail: si subtotal < 68900 y no tiene envío gratis explícito, DEBE cobrar envío.
        const SHIPPING_COST = 7400;
        const FREE_SHIPPING_THRESHOLD = 68900;
        const hasFreeShippingCoupon = orderData.coupon_code && (orderData.free_shipping || orderData.coupon?.free_shipping);

        if (!hasFreeShippingCoupon && subtotal < FREE_SHIPPING_THRESHOLD) {
          // Si el frontend calculó 0 de envío erróneamente, lo corregimos aquí
          if (shippingCost === 0) {
            console.log('⚠️ API: Correcting shipping cost. Subtotal below threshold and no free shipping coupon.');
            shippingCost = SHIPPING_COST;
            // Recalculate total
            const discount = orderData.discount || 0;
            newTotal = subtotal + shippingCost - discount;
          }
        } else if (subtotal >= FREE_SHIPPING_THRESHOLD) {
          // Ensure shipping is 0 if above threshold (unless specific surcharge exists, but standard is free)
          if (shippingCost === SHIPPING_COST) {
            shippingCost = 0;
            const discount = orderData.discount || 0;
            newTotal = subtotal + shippingCost - discount;
          }
        }

        // Actualizar datos dentro del objeto JSON
        orderData.items = guestItems;
        orderData.subtotal = subtotal;
        orderData.shipping_cost = shippingCost;
        orderData.total = newTotal;
        orderData.total_amount = newTotal;

        const { error: guestUpdateError } = await supabase
          .from('guest_orders')
          .update({
            order_data: orderData,
            total_amount: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (guestUpdateError) {
          console.error('❌ API: Error updating guest order items:', guestUpdateError);
          return NextResponse.json(
            { error: 'Error al actualizar items del pedido invitado', details: guestUpdateError.message },
            { status: 500, headers: corsHeaders }
          );
        }

        console.log('✅ API: Guest order items updated successfully inside order_data');
        return NextResponse.json({
          success: true,
          message: 'Items del pedido invitado actualizados exitosamente'
        }, { headers: corsHeaders });

      } else {
        // Para pedidos registrados, usar order_items
        // Delete existing items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', orderId);

        if (deleteError) {
          console.error('❌ API: Error deleting old items:', deleteError);
          // No es crítico si no había items previos, continuar
        }

        // Insert new items
        const newItems = items.map((item: any) => ({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.unit_price * item.quantity,
          product_snapshot: {
            name: item.product_name || 'Producto',
            variant_name: item.variant_name || null,
            variant_value: item.variant_value || null
          },
          created_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('order_items')
          .insert(newItems);

        if (insertError) {
          console.error('❌ API: Error inserting new items:', insertError);
          return NextResponse.json(
            { error: 'Error al insertar nuevos items', details: insertError.message },
            { status: 500, headers: corsHeaders }
          );
        }

        // Update order total
        const subtotal = items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0);
        const shippingFee = total && total > subtotal ? total - subtotal : 0;
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            subtotal: subtotal,
            total: total || subtotal,
            total_amount: total || subtotal,
            shipping_fee: shippingFee,
            updated_at: new Date().toISOString()
          })
          .eq('id', orderId);

        if (updateError) {
          console.error('❌ API: Error updating order total:', updateError);
          return NextResponse.json(
            { error: 'Error al actualizar total del pedido', details: updateError.message },
            { status: 500, headers: corsHeaders }
          );
        }

        console.log('✅ API: Order items updated successfully');
        return NextResponse.json({
          success: true,
          message: 'Items del pedido actualizados exitosamente'
        }, { headers: corsHeaders });
      }
    }

    // If updating status only
    if (status) {
      // Usar la tabla correcta según el tipo de pedido
      const tableName = isGuestOrder ? 'guest_orders' : 'orders';
      console.log(`📝 API: Updating status in table '${tableName}' for order:`, orderId);

      const { data, error } = await supabase
        .from(tableName)
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
          { error: 'Error al actualizar el pedido', details: error.message },
          { status: 500, headers: corsHeaders }
        );
      }

      console.log('✅ API: Order updated successfully:', data);

      return NextResponse.json({
        success: true,
        data,
        message: 'Pedido actualizado exitosamente'
      }, { headers: corsHeaders });
    }

    if (customerDataUpdated) {
      return NextResponse.json({
        success: true,
        message: 'Datos del pedido actualizados exitosamente'
      }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { error: 'Debe proporcionar status, items o datos del cliente para actualizar' },
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ API: Unexpected error updating order:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
