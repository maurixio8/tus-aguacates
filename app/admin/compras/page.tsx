'use client';

import { FormEvent, useEffect, useState } from 'react';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const loadOrders = () => {
    setState('loading');
    fetch('/api/buyer/purchase-data', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error('No autorizado');
        setOrders(data.orders || []);
        setState('ready');
      })
      .catch(() => setState('error'));
  };

  useEffect(() => { loadOrders(); }, []);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    const response = await fetch('/api/auth/buyer/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json().catch(() => null);
    setLoggingIn(false);
    if (!response.ok || !data?.success) {
      setLoginError(data?.error || 'No se pudo iniciar sesión');
      return;
    }
    setPassword('');
    loadOrders();
  };

  return (
    <section className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
      <p className="mt-1 text-sm text-gray-600">Vista operativa del comprador.</p>
      {state === 'loading' && <p className="mt-6">Cargando pedidos…</p>}
      {state === 'error' && (
        <form onSubmit={login} className="mt-6 max-w-md space-y-3 rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-700">Inicia sesión como comprador para cargar la jornada.</p>
          <input aria-label="Correo" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo" className="w-full rounded border p-3" />
          <input aria-label="Contraseña" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" className="w-full rounded border p-3" />
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
          <button type="submit" disabled={loggingIn} className="rounded bg-green-800 px-4 py-3 font-semibold text-white disabled:opacity-50">
            {loggingIn ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      )}
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
