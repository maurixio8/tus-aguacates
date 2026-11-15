'use client';

import { useEffect, useState } from 'react';

type PurchaseOrder = {
  id: string;
  order_number?: string;
  delivery_date?: string;
  customer_name?: string;
  delivery_address?: string;
  items: Array<{ id: string; product_name: string; variant_value?: string | null; quantity: number; unit?: string | null }>;
};

export default function BuyerComprasPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    fetch('/api/buyer/purchase-data', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error('No autorizado');
        setOrders(data.orders || []);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <section className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
      <p className="mt-1 text-sm text-gray-600">Vista operativa del comprador.</p>
      {state === 'loading' && <p className="mt-6">Cargando pedidos…</p>}
      {state === 'error' && <p className="mt-6 text-red-600">No se pudo cargar la sesión de comprador.</p>}
      {state === 'ready' && orders.length === 0 && <p className="mt-6 text-gray-600">No hay pedidos asignados.</p>}
      <div className="mt-6 space-y-4">
        {orders.map((order) => (
          <article key={order.id} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <h2 className="font-semibold">{order.order_number || order.id}</h2>
              <span className="text-sm text-gray-500">{order.delivery_date || 'Sin fecha'}</span>
            </div>
            <p className="text-sm text-gray-600">{order.customer_name || 'Cliente'} · {order.delivery_address || 'Sin dirección'}</p>
            <ul className="mt-3 space-y-1 text-sm">
              {order.items.map((item) => <li key={item.id}>{item.quantity} {item.unit || ''} — {item.product_name}{item.variant_value ? ` (${item.variant_value})` : ''}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
