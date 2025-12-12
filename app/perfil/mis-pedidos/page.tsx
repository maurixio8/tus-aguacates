import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';

async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
}

function OrdersList({ orders }: { orders: any[] }) {
  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold">Pedido #{order.order_number}</h3>
              <p className="text-sm text-gray-500">
                {new Date(order.created_at).toLocaleDateString('es-CO')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">${order.total.toLocaleString('es-CO')}</p>
              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {order.status === 'delivered' ? 'Entregado' :
                 order.status === 'pending' ? 'Pendiente' :
                 order.status === 'cancelled' ? 'Cancelado' :
                 order.status === 'confirmed' ? 'Confirmado' :
                 order.status === 'processing' ? 'Procesando' :
                 order.status === 'shipped' ? 'Enviado' : order.status}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center space-x-3 text-sm">
                {item.product?.main_image_url && (
                  <img
                    src={item.product.main_image_url}
                    alt={item.product?.name || 'Producto'}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.product?.name || 'Producto'}</p>
                  <p className="text-gray-500">Cantidad: {item.quantity} × ${item.unit_price.toLocaleString('es-CO')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function MisPedidosPage() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const orders = await getOrders(user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/perfil" className="text-green-600 hover:text-green-700 mb-4 inline-block">
            ← Volver a mi perfil
          </Link>
          <h1 className="text-2xl font-bold mb-2">Mis Pedidos</h1>
          <p className="text-gray-600">Historial de todos tus pedidos realizados</p>
        </div>
        
        <Suspense fallback={<div>Cargando pedidos...</div>}>
          {orders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500 mb-4">No tienes pedidos realizados</p>
              <Link
                href="/tienda"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Ir a la tienda
              </Link>
            </div>
          ) : (
            <OrdersList orders={orders} />
          )}
        </Suspense>
      </div>
    </div>
  );
}