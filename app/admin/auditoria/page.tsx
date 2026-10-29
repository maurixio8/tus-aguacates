'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, XCircle, Search, Sprout } from 'lucide-react';

type Proposal = { id: string; customer_masked: string; preference: string; confidence: string; proposal_text: string; source?: string; created_at: string; approval_status: string };

type Customer = { id: string; name: string; phone?: string; notes?: string };

const labels: Record<string,string> = { verde: 'Verdes', pinton: 'Pintones', maduro: 'Maduros', mixto: 'Mezcla' };

export default function RipenessReviewPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Record<string,string>>({});
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const proposalResponse = await fetch('/api/admin/ripeness-proposals?status=pending', { credentials: 'include', cache: 'no-store' });
      const customerResponse = await fetch(`/api/admin/customers/?page=1&limit=100&search=${encodeURIComponent(search)}`, { credentials: 'include', cache: 'no-store' });
      const p = await proposalResponse.json().catch(() => ({}));
      const c = await customerResponse.json().catch(() => ({}));
      if (!proposalResponse.ok || !p.success) throw new Error(p.details || p.error || `Propuestas: HTTP ${proposalResponse.status}`);
      if (!customerResponse.ok || !c.success) throw new Error(c.error || `Clientes: HTTP ${customerResponse.status}`);
      setProposals(p.data || []); setCustomers(c.data || []);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'No se pudieron cargar las propuestas'); }
    finally { setLoading(false); }
  }, [search]);
  useEffect(() => { void load(); }, [load]);

  const act = async (id: string, action: string, extra: Record<string,string> = {}) => {
    setBusy(id); setMessage('');
    try {
      const r = await fetch('/api/admin/ripeness-proposals', { method: 'PATCH', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, action, ...extra }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'No se pudo completar la acción');
      setMessage(action === 'apply-customer' ? 'Preferencia aplicada y verificada en la ficha del cliente.' : 'Propuesta actualizada.');
      await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Error inesperado'); }
    finally { setBusy(null); }
  };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-semibold text-green-700">Auditoría de conversaciones</p><h1 className="text-2xl font-bold text-gray-900">Preferencias de maduración</h1><p className="text-sm text-gray-600 mt-1">Revisa primero. El sistema nunca cambia un cliente sin aprobación.</p></div>
      <button onClick={() => void load()} className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"><RefreshCw className="h-4 w-4"/>Actualizar</button>
    </div>
    {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}
    <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center gap-2 mb-3"><Search className="h-4 w-4 text-gray-500"/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente para aplicar una preferencia" className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"/></div><p className="text-xs text-gray-500">La búsqueda solo sirve para escoger el destino exacto. Los datos se muestran dentro del panel autenticado.</p></div>
    {loading ? <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Cargando propuestas…</div> : proposals.length === 0 ? <div className="rounded-xl border bg-white p-8 text-center text-gray-600"><Sprout className="mx-auto mb-2 h-8 w-8 text-green-600"/>No hay propuestas pendientes.</div> : <div className="space-y-4">{proposals.map(p => <article key={p.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">{labels[p.preference] || p.preference}</span><span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">Confianza: {p.confidence}</span><span className="text-xs text-gray-500">Cliente: {p.customer_masked}</span></div><p className="text-gray-900">{p.proposal_text}</p><p className="text-xs text-gray-500">Detectado: {new Date(p.created_at).toLocaleString('es-CO')}</p></div><div className="flex flex-wrap gap-2"><button disabled={busy===p.id} onClick={() => void act(p.id,'approve')} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/>Aprobar</button><button disabled={busy===p.id} onClick={() => void act(p.id,'reject',{reason:'Rechazada desde dashboard'})} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"><XCircle className="h-4 w-4"/>Rechazar</button></div></div><div className="mt-4 grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-[1fr_auto] md:items-end"><label className="text-sm text-gray-700">Aplicar como nota persistente a cliente exacto<select value={selectedCustomer[p.id] || ''} onChange={e => setSelectedCustomer({...selectedCustomer,[p.id]:e.target.value})} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm"><option value="">Seleccionar cliente…</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.phone ? `· ${c.phone.slice(-4)}` : ''}</option>)}</select></label><button disabled={!selectedCustomer[p.id] || busy===p.id} onClick={() => void act(p.id,'apply-customer',{customerId:selectedCustomer[p.id]})} className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Aplicar a ficha</button></div></article>)}</div>}
  </div>;
}
