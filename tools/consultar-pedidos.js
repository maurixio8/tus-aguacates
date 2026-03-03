#!/usr/bin/env node

/**
 * Herramienta para consultar pedidos de Tus Aguacates
 * 
 * Uso:
 * node tools/consultar-pedidos.js --phone "573201234567"
 * node tools/consultar-pedidos.js --status "pendiente"
 * node tools/consultar-pedidos.js --name "Juan"
 * node tools/consultar-pedidos.js --recent
 * node tools/consultar-pedidos.js --pending
 */

const { createClient } = require('@supabase/supabase-js');

const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4cWttYWFxb2VoeWR1bGtzdWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjQ0Mjk0NCwiZXhwIjoyMDc4MDE4OTQ0fQ.hQpBcmGfCjJqX8fBRMCJs0Knxyms8KxekVWHxkfOn0M';
const SUPABASE_URL = 'https://gxqkmaaqoehydulksudj.supabase.co';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function consultarPedidos(consulta) {
  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, customer_email, status, payment_status, total, created_at, shipping_address')
    .order('created_at', { ascending: false })
    .limit(50);

  let guestQuery = supabase
    .from('guest_orders')
    .select('id, guest_name, guest_phone, guest_email, status, payment_status, total_amount, created_at, guest_address')
    .order('created_at', { ascending: false })
    .limit(50);

  if (consulta.phone) {
    const phone = consulta.phone.replace(/\D/g, '');
    const phonePattern = phone + '%';
    query = query.ilike('customer_phone', phonePattern);
    guestQuery = guestQuery.ilike('guest_phone', phonePattern);
  }

  if (consulta.name) {
    const namePattern = '%' + consulta.name + '%';
    query = query.ilike('customer_name', namePattern);
    guestQuery = guestQuery.ilike('guest_name', namePattern);
  }

  if (consulta.status) {
    query = query.eq('status', consulta.status);
    guestQuery = guestQuery.eq('status', consulta.status);
  }

  const [ordersResult, guestOrdersResult] = await Promise.all([
    query,
    guestQuery
  ]);

  return {
    orders: ordersResult.data || [],
    guest_orders: guestOrdersResult.data || [],
    errors: {
      orders: ordersResult.error,
      guest_orders: guestOrdersResult.error
    }
  };
}

async function consultarPedidosPendientes() {
  const query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, status, payment_status, total, created_at')
    .in('status', ['pendiente', 'pending', 'pendiente_pago', 'pendiente_entrega', 'pagado'])
    .order('created_at', { ascending: false });

  const guestQuery = supabase
    .from('guest_orders')
    .select('id, guest_name, guest_phone, status, payment_status, total_amount, created_at')
    .in('status', ['pendiente', 'pending', 'pendiente_pago', 'pendiente_entrega', 'pagado'])
    .order('created_at', { ascending: false });

  const [ordersResult, guestOrdersResult] = await Promise.all([query, guestQuery]);

  return {
    orders: ordersResult.data || [],
    guest_orders: guestOrdersResult.data || [],
    total: (ordersResult.data?.length || 0) + (guestOrdersResult.data?.length || 0)
  };
}

async function consultarPedidosRecientes(dias = 7) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(0, 0, 0, 0);

  const query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, status, payment_status, total, created_at')
    .gte('created_at', fecha.toISOString())
    .order('created_at', { ascending: false });

  const guestQuery = supabase
    .from('guest_orders')
    .select('id, guest_name, guest_phone, status, payment_status, total_amount, created_at')
    .gte('created_at', fecha.toISOString())
    .order('created_at', { ascending: false });

  const [ordersResult, guestOrdersResult] = await Promise.all([query, guestQuery]);

  return {
    orders: ordersResult.data || [],
    guest_orders: guestOrdersResult.data || [],
    desde: fecha.toLocaleDateString('es-CO'),
    total: (ordersResult.data?.length || 0) + (guestOrdersResult.data?.length || 0)
  };
}

async function main() {
  const args = process.argv.slice(2);
  const consulta = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phone') consulta.phone = args[++i];
    if (args[i] === '--name') consulta.name = args[++i];
    if (args[i] === '--status') consulta.status = args[++i];
  }

  let resultado;

  if (args.indexOf('--pending') >= 0) {
    resultado = await consultarPedidosPendientes();
    console.log('\n📦 PEDIDOS PENDIENTES:');
  } else if (args.indexOf('--recent') >= 0) {
    resultado = await consultarPedidosRecientes();
    console.log('\n📦 PEDIDOS RECIENTES (desde ' + resultado.desde + '):');
  } else {
    resultado = await consultarPedidos(consulta);
    console.log('\n📦 RESULTADO DE CONSULTA:');
    if (consulta.phone) console.log('📱 Teléfono:', consulta.phone);
    if (consulta.name) console.log('👤 Nombre:', consulta.name);
    if (consulta.status) console.log('📌 Estado:', consulta.status);
  }

  if (resultado.orders && resultado.orders.length > 0) {
    console.log('\n✅ ' + resultado.orders.length + ' ORDERS ENCONTRADOS:');
    resultado.orders.forEach(o => {
      const fecha = new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
      console.log('  🛒 ' + o.order_number + ' | ' + (o.customer_name || 'Sin nombre') + ' | ' + (o.customer_phone || 'Sin teléfono') + ' | ' + o.status + ' | $' + o.total + ' | ' + fecha);
    });
  }

  if (resultado.guest_orders && resultado.guest_orders.length > 0) {
    console.log('\n✅ ' + resultado.guest_orders.length + ' GUEST ORDERS ENCONTRADOS:');
    resultado.guest_orders.forEach(o => {
      const fecha = new Date(o.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
      console.log('  🛒 ' + o.id + ' | ' + o.guest_name + ' | ' + (o.guest_phone || 'Sin teléfono') + ' | ' + o.status + ' | $' + o.total_amount + ' | ' + fecha);
    });
  }

  if ((!resultado.orders || resultado.orders.length === 0) && (!resultado.guest_orders || resultado.guest_orders.length === 0)) {
    console.log('\n❌ No se encontraron pedidos');
  }

  if (resultado.total !== undefined) {
    console.log('\n📊 TOTAL: ' + resultado.total + ' pedidos');
  }
}

main().catch(console.error);
