'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  backupToClipboard,
  enqueueMutationRecord,
  requestPersistentStorage,
  saveDraftToIndexedDb,
} from '@/lib/purchase-session-offline';

type Item = {
  id: string;
  product_name: string;
  variant_name?: string | null;
  variant_value?: string | null;
  requested_qty: number;
  purchased_qty: number;
  missing_qty: number;
  surplus_qty: number;
  weight_kg?: number | null;
  unit?: string | null;
  supplier_id?: string | null;
  sub_location_hint?: string | null;
  ripeness_note_snapshot?: string | null;
  is_promo_gift?: boolean;
};

type PackingItem = {
  id: string;
  order_label?: string | null;
  customer_name?: string | null;
  product_name: string;
  variant_name?: string | null;
  variant_value?: string | null;
  requested_qty: number;
  picked_qty: number;
  ripeness_note_snapshot?: string | null;
  is_promo_gift?: boolean;
  status?: string | null;
};

type Order = {
  id: string;
  delivery_date: string;
  cash_advanced: number;
  actual_total_paid: number;
  operational_expenses: Record<string, number>;
  items: Item[];
  packing_items: PackingItem[];
};

type Draft = {
  purchasedQty: string;
  blindPrice: string;
  weightKg: string;
  actualPaid: string;
  surplusMarked: boolean;
  purchased: boolean;
};

const ZONE_ORDER = ['aguacates', 'hierbas', 'especies', 'medio-fruver', 'reina', 'popular'];
const ZONE_META: Record<string, { label: string; icon: string; color: string }> = {
  aguacates: { label: 'Bodega del Aguacate', icon: '🥑', color: 'border-violet-400 bg-violet-50' },
  hierbas: { label: 'Bodega de Hierbas', icon: '🌿', color: 'border-emerald-400 bg-emerald-50' },
  especies: { label: 'Bodega de Especias', icon: '🌶️', color: 'border-orange-400 bg-orange-50' },
  'medio-fruver': { label: 'Medio Frúver', icon: '🍌', color: 'border-blue-400 bg-blue-50' },
  reina: { label: 'Bodega Reina', icon: '🍎', color: 'border-rose-400 bg-rose-50' },
  popular: { label: 'Bodega Popular', icon: '🛒', color: 'border-purple-400 bg-purple-50' },
};

const money = (value: number) => `$${Math.max(0, Math.round(value)).toLocaleString('es-CO')}`;
const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function zoneFor(item: Item) {
  return ZONE_META[item.supplier_id || 'popular'] ? item.supplier_id || 'popular' : 'popular';
}

function fallbackFor(item: Item) {
  return clean(item.product_name).includes('arandano') ? '🔄 Bodega Reina' : null;
}

function quantityLabel(item: Item) {
  const qty = Number(item.requested_qty || 0);
  const variant = `${item.variant_name || ''} ${item.variant_value || ''}`.toLowerCase();
  if (variant.includes('125')) return `${qty} ENVASE${qty === 1 ? '' : 'S'} de 125 g`;
  if (variant.includes('250')) return `${qty} ENVASE${qty === 1 ? '' : 'S'} de 250 g`;
  if (variant.includes('500')) return `${qty} BANDEJA${qty === 1 ? '' : 'S'} de 500 g`;
  if (item.ripeness_note_snapshot?.includes('$1.000')) return `${qty} 🌿 PAQUETE${qty === 1 ? '' : 'S'} de $1.000 a $2.000`;
  const unit = item.unit || item.variant_name || 'unidad';
  return `${qty} ${unit.toUpperCase()}${qty === 1 ? '' : 'S'}`;
}

function draftFor(item: Item, drafts: Record<string, Draft>): Draft {
  return drafts[item.id] || {
    purchasedQty: String(item.purchased_qty || 0),
    blindPrice: '',
    weightKg: item.weight_kg ? String(item.weight_kg) : '',
    actualPaid: '',
    surplusMarked: Number(item.surplus_qty || 0) > 0,
    purchased: Number(item.purchased_qty || 0) > 0,
  };
}

import BuyerPurchaseWorkspaceV2 from './BuyerPurchaseWorkspaceV2';

export default function BuyerComprasPage() {
  return <BuyerPurchaseWorkspaceV2 />;
}

function LegacyBuyerComprasPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [tab, setTab] = useState<'buy' | 'pack'>('buy');
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [expenses, setExpenses] = useState({ cotero: '', bolsas: '', transporte: '' });
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(true);
  const [packingChecked, setPackingChecked] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    loadOrders();
    void requestPersistentStorage();
    setOnline(navigator.onLine);
    const onlineHandler = () => setOnline(true);
    const offlineHandler = () => setOnline(false);
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    try {
      const saved = localStorage.getItem('buyer-purchase-drafts');
      if (saved) setDrafts(JSON.parse(saved));
    } catch { /* local draft remains usable */ }
    return () => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    };
  }, []);

  const order = orders[0];
  const items = order?.items || [];
  const totalItems = items.length;
  const boughtItems = items.filter((item) => draftFor(item, drafts).purchased || Number(draftFor(item, drafts).purchasedQty) > 0).length;
  const expensesTotal = Object.values(expenses).reduce((sum, value) => sum + (Number(value) || 0), 0);
  const purchasedTotal = items.reduce((sum, item) => sum + (Number(draftFor(item, drafts).actualPaid) || 0), 0);
  const change = Number(order?.cash_advanced || 0) - purchasedTotal - expensesTotal;
  const grouped = useMemo(() => ZONE_ORDER.map((zone) => ({ zone, items: items.filter((item) => zoneFor(item) === zone) })).filter((group) => group.items.length > 0), [items]);
  const packedGroups = useMemo(() => {
    const groups: Record<string, PackingItem[]> = {};
    for (const item of order?.packing_items || []) {
      const key = `${item.order_label || 'Pedido'}|${item.customer_name || 'Cliente'}`;
      (groups[key] ||= []).push(item);
    }
    return Object.entries(groups);
  }, [order?.packing_items]);

  const updateDraft = (item: Item, patch: Partial<Draft>) => {
    setDrafts((current) => {
      const next = { ...current, [item.id]: { ...draftFor(item, current), ...patch } };
      localStorage.setItem('buyer-purchase-drafts', JSON.stringify(next));
      return next;
    });
  };

  const syncItem = async (item: Item) => {
    const draft = draftFor(item, drafts);
    const mutation_id = `buyer-${item.id}-${Date.now()}`;
    const payload = {
      mutation_id,
      session_id: order.id,
      item_id: item.id,
      purchased_qty: Number(draft.purchasedQty) || 0,
      weight_kg: draft.weightKg === '' ? null : Number(draft.weightKg),
      blind_price: draft.blindPrice === '' ? null : Number(draft.blindPrice),
      actual_total_paid: draft.actualPaid === '' ? null : Number(draft.actualPaid),
      operational_expenses: Object.fromEntries(Object.entries(expenses).map(([key, value]) => [key, Number(value) || 0])),
    };
    try {
      const response = await fetch('/api/buyer/purchase-update', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('sync failed');
      setMessage('✅ Guardado y sincronizado');
    } catch {
      await enqueueMutationRecord({ mutation_id, kind: 'purchase-update', payload, created_at: new Date().toISOString() }).catch(() => undefined);
      setMessage('📴 Guardado offline; queda en cola de sincronización');
    }
  };

  const markBought = async (item: Item) => {
    const current = draftFor(item, drafts);
    updateDraft(item, { purchased: true, purchasedQty: current.purchasedQty === '0' ? String(item.requested_qty || 1) : current.purchasedQty });
    await syncItem(item);
  };

  const backup = async () => {
    await backupToClipboard({ session_id: order?.id, drafts, expenses, saved_at: new Date().toISOString() });
    setMessage('📋 Respaldo copiado al portapapeles');
  };

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    const response = await fetch('/api/auth/buyer/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const data = await response.json().catch(() => null);
    setLoggingIn(false);
    if (!response.ok || !data?.success) { setLoginError(data?.error || 'No se pudo iniciar sesión'); return; }
    setPassword('');
    loadOrders();
  };

  if (state === 'loading') return <section className="mx-auto max-w-6xl p-5 text-xl font-black">Cargando jornada de compras…</section>;
  if (state === 'error') return <section className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow"><h1 className="text-2xl font-black">🛒 Acceso de comprador</h1><p className="mt-2 text-sm">Ingresa con las credenciales de Nicolás.</p><form onSubmit={login} className="mt-5 space-y-3"><input aria-label="Correo" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Correo" className="w-full rounded-xl border-2 p-4" /><input aria-label="Contraseña" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña" className="w-full rounded-xl border-2 p-4" />{loginError && <p className="font-bold text-red-700">{loginError}</p>}<button className="w-full rounded-xl bg-emerald-800 p-4 text-lg font-black text-white">{loggingIn ? 'Ingresando…' : 'Ingresar como comprador'}</button></form></section>;
  if (!order) return <section className="mx-auto max-w-6xl p-5 text-xl font-black">No hay jornada asignada.</section>;

  return (
    <section className="mx-auto max-w-6xl space-y-4 text-slate-950">
      <header className="rounded-3xl border-4 border-emerald-900 bg-emerald-950 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase tracking-widest text-emerald-200">Piloto de compras</p><h1 className="text-3xl font-black sm:text-5xl">Jornada Martes 17 Nov 2026</h1></div><span className={`rounded-full px-4 py-2 text-lg font-black ${online ? 'bg-emerald-400 text-emerald-950' : 'bg-amber-300 text-amber-950'}`}>{online ? '🟢 Online' : '🟠 Offline'}</span></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm font-bold text-emerald-200">Progreso</p><p className="text-4xl font-black">{boughtItems} / {totalItems} <span className="text-lg">comprados</span></p></div><div className="rounded-2xl bg-white/10 p-4"><p className="text-sm font-bold text-emerald-200">Efectivo recibido</p><p className="text-3xl font-black">{money(order.cash_advanced)}</p></div><button type="button" onClick={() => void backup()} className="rounded-2xl bg-amber-400 p-4 text-xl font-black text-amber-950">📋 Respaldar al portapapeles</button></div>
      </header>

      <section className="rounded-3xl border-4 border-yellow-500 bg-yellow-50 p-5 shadow-lg"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-black">💵 Cuadre de efectivo</h2><span className={`rounded-full px-3 py-1 font-black ${change >= 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'}`}>{change >= 0 ? 'Vueltas disponibles' : 'Falta efectivo'}</span></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><div className="rounded-xl bg-white p-3"><p className="text-xs font-bold">Efectivo recibido</p><p className="text-2xl font-black">{money(order.cash_advanced)}</p></div>{(['cotero', 'bolsas', 'transporte'] as const).map((key) => <label key={key} className="rounded-xl bg-white p-3 text-sm font-black capitalize">Gastos: {key}<input inputMode="numeric" value={expenses[key]} onChange={(event) => setExpenses((current) => ({ ...current, [key]: event.target.value }))} className="mt-1 w-full rounded-lg border-2 p-2 text-xl" placeholder="$0" /></label>)}<div className="rounded-xl bg-white p-3"><p className="text-xs font-bold">Total gastado en compras</p><p className="text-2xl font-black">{money(purchasedTotal)}</p></div></div><div className="mt-4 rounded-2xl bg-emerald-900 p-4 text-center text-white"><p className="text-sm font-bold uppercase">Vueltas exactas a entregar</p><p className="text-5xl font-black">{money(Math.max(0, change))}</p></div></section>

      <nav className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setTab('buy')} className={`rounded-2xl p-5 text-xl font-black shadow ${tab === 'buy' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-900'}`}>🛒 1. COMPRAR <span className="block text-sm">Por Bodegas</span></button><button type="button" onClick={() => setTab('pack')} className={`rounded-2xl p-5 text-xl font-black shadow ${tab === 'pack' ? 'bg-emerald-800 text-white' : 'bg-white text-slate-900'}`}>📦 2. ALISTAR <span className="block text-sm">Por Cliente</span></button></nav>

      {tab === 'buy' && <div className="space-y-5">{grouped.map(({ zone, items: zoneItems }) => { const meta = ZONE_META[zone]; const avocado = zone === 'aguacates'; const boxCount = zoneItems.reduce((sum, item) => sum + (clean(item.product_name).includes('caja') ? Number(item.requested_qty || 0) : 0), 0); const avocadoUnits = zoneItems.reduce((sum, item) => { const text = `${item.product_name} ${item.variant_value || ''}`; const match = text.match(/(24|18)/); return sum + (match ? Number(match[1]) * Number(item.requested_qty || 0) : 0); }, 0); return <section key={zone} className={`rounded-3xl border-4 p-4 shadow ${meta.color}`}><h2 className="text-2xl font-black">{meta.icon} {ZONE_ORDER.indexOf(zone) + 1}. {meta.label}</h2>{avocado && <div className="mt-3 rounded-2xl border-2 border-violet-700 bg-violet-900 p-4 text-white"><p className="text-xl font-black">🥑 Aguacate 3ra · {avocadoUnits} unidades a contar</p><p className="mt-1 text-lg font-bold">🟢 Verdes/Adelantados: {Math.max(0, avocadoUnits - boxCount * 3)} · 🟡 Maduros firmes: {boxCount * 3} (3 por caja)</p><p className="mt-2 font-bold">📌 Separa los aguacates más grandes para la Caja 18.</p></div>}<div className="mt-4 grid gap-4 lg:grid-cols-2">{zoneItems.map((item) => { const draft = draftFor(item, drafts); const fallback = fallbackFor(item); return <article key={item.id} className="rounded-2xl border-2 border-slate-300 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-2xl font-black">{item.is_promo_gift ? '🎁 ' : ''}{item.product_name}</h3><p className="mt-1 text-2xl font-black text-emerald-900">{quantityLabel(item)}</p></div>{draft.purchased && <span className="rounded-full bg-emerald-200 px-3 py-1 font-black text-emerald-900">✅ Comprado</span>}</div><div className="mt-3 flex flex-wrap gap-2 text-sm font-black">{item.sub_location_hint && <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-900">{item.sub_location_hint}</span>}{fallback && <span className="rounded-full bg-purple-100 px-3 py-1 text-purple-900">{fallback}</span>}</div>{item.ripeness_note_snapshot && !item.is_promo_gift && <p className="mt-3 rounded-xl bg-amber-100 p-3 font-black">🌿 {item.ripeness_note_snapshot}</p>}<div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-sm font-black">Precio a ciegas<input inputMode="numeric" value={draft.blindPrice} onChange={(event) => updateDraft(item, { blindPrice: event.target.value })} className="mt-1 w-full rounded-xl border-2 border-slate-400 p-3 text-2xl font-black" placeholder="$0" /></label><label className="text-sm font-black">Cantidad comprada<input inputMode="decimal" value={draft.purchasedQty} onChange={(event) => updateDraft(item, { purchasedQty: event.target.value })} className="mt-1 w-full rounded-xl border-2 border-slate-400 p-3 text-2xl font-black" /></label><label className="text-sm font-black">Peso en báscula (kg)<input inputMode="decimal" value={draft.weightKg} onChange={(event) => updateDraft(item, { weightKg: event.target.value })} className="mt-1 w-full rounded-xl border-2 border-slate-400 p-3 text-2xl font-black" placeholder="0.000" /></label><label className="text-sm font-black">Total pagado<input inputMode="numeric" value={draft.actualPaid} onChange={(event) => updateDraft(item, { actualPaid: event.target.value })} className="mt-1 w-full rounded-xl border-2 border-slate-400 p-3 text-2xl font-black" placeholder="$0" /></label></div><label className="mt-3 flex items-center gap-3 rounded-xl bg-slate-100 p-3 text-lg font-black"><input type="checkbox" checked={draft.surplusMarked} onChange={(event) => updateDraft(item, { surplusMarked: event.target.checked })} className="h-7 w-7" /> Sobrante / gaja</label><button type="button" onClick={() => void markBought(item)} className="mt-4 w-full rounded-2xl bg-emerald-800 p-4 text-xl font-black text-white shadow-lg">✅ Marcar Comprado</button></article>; })}</div></section>; })}</div>}

      {tab === 'pack' && <section className="space-y-4">{packedGroups.map(([key, lines], index) => { const [label, customer] = key.split('|'); return <article key={key} className="rounded-3xl border-4 border-sky-400 bg-sky-50 p-4 shadow"><h2 className="text-2xl font-black">📦 Pedido #{String(index + 1).padStart(2, '0')} · {customer}</h2><p className="text-sm font-bold text-slate-600">{label}</p><div className="mt-3 space-y-3">{(lines || []).map((item) => <label key={item.id} className={`flex gap-3 rounded-2xl border-2 p-4 ${packingChecked[item.id] ? 'border-emerald-500 bg-emerald-100' : 'border-slate-300 bg-white'}`}><input type="checkbox" checked={Boolean(packingChecked[item.id])} onChange={(event) => setPackingChecked((current) => ({ ...current, [item.id]: event.target.checked }))} className="mt-1 h-7 w-7" /><span><strong className="text-xl">{item.requested_qty} · {item.product_name}{item.variant_value ? ` (${item.variant_value})` : ''}</strong>{item.ripeness_note_snapshot && !item.is_promo_gift && <span className="mt-1 block rounded-lg bg-amber-200 p-2 font-black">🌡️ {item.ripeness_note_snapshot}</span>}{item.is_promo_gift && <span className="mt-1 block rounded-lg bg-yellow-300 p-2 font-black">🎁 OBSEQUIO PROMO: Paquete de 5-6 Duraznos gratis</span>}</span></label>)}</div></article>; })}</section>}
      {message && <p className="rounded-xl bg-slate-900 p-3 text-center font-black text-white">{message}</p>}
    </section>
  );
}
