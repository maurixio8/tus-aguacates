'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';

type RecordRow = {
  order_id: string;
  order_number?: string;
  customer_name: string;
  phone: string | null;
  address: string;
  delivery_date: string;
  delivery_window: string;
  pin_missing: boolean;
  channel: 'text_free' | 'template';
  template_name: string | null;
  template_status: string | null;
  draft_text: string | null;
  status: string;
  excluded_reasons?: string[];
  approval_required: boolean;
  experimental: boolean;
};

type Batch = {
  target_delivery_date: string;
  delivery_window: string;
  mode: string;
  sending_enabled: boolean;
  experimental: boolean;
  template: { name: string; language: string; status: string };
  records: RecordRow[];
  counts: { total: number; text_free: number; template: number; excluded: number };
};

type Decision = { id: string; action: string; created_at: string; details: { mode?: string; outcome_counts?: Record<string, number>; scope?: string } };

export default function DeliveryNoticesPage() {
  const [date, setDate] = useState('2026-11-03');
  const [batch, setBatch] = useState<Batch | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`/api/admin/delivery-notices?date=${encodeURIComponent(date)}`, { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo cargar el lote');
      setBatch(data.batch); setDecisions(data.decisions || []); setSelected([]);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo cargar el lote'); }
    finally { setLoading(false); }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  const eligible = useMemo<RecordRow[]>(() => batch?.records.filter((row: RecordRow) => row.status !== 'excluded') || [], [batch]);
  const allSelected = eligible.length > 0 && eligible.every(row => selected.includes(row.order_id));

  const simulateApproval = async (scope: 'all' | 'selected') => {
    if (scope === 'selected' && selected.length === 0) { setMessage('Selecciona al menos un cliente.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/delivery-notices', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, scope, orderIds: selected }) });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo registrar la aprobación simulada');
      setMessage(`Aprobación simulada auditada. Enviarían ${data.decision.details.outcome_counts.would_send || 0}; en espera de plantilla ${data.decision.details.outcome_counts.waiting_template || 0}; excluidos ${data.decision.details.outcome_counts.excluded || 0}. No salió ningún mensaje.`);
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo simular la aprobación'); }
    finally { setBusy(false); }
  };

  return <main className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div><p className="text-sm font-semibold text-green-700">Operación de entregas</p><h1 className="text-2xl font-bold text-gray-900">Avisos de entrega</h1><p className="text-sm text-gray-600">La capa está en modo simulación y experimental. Aprobar aquí registra lo que habría ocurrido; no envía WhatsApp.</p></div>
      <div className="flex gap-2"><input type="date" value={date} onChange={event => setDate(event.target.value)} className="rounded-lg border px-3 py-2 text-sm"/><button onClick={() => void load()} className="rounded-lg border bg-white px-3 py-2 text-sm">Actualizar</button></div>
    </div>
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>SIMULACIÓN · EXPERIMENTAL</b><br/>La aprobación se registra en la capa única de acciones. El ejecutor calcula canal y resultado, pero no llama a YCloud ni escribe en el buffer.</div>
    {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">{message}</div>}
    {loading ? <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Cargando lote…</div> : batch && <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5"><div className="rounded-xl border bg-white p-4"><b className="text-2xl">{batch.counts.total}</b><div className="text-xs text-gray-600">Total</div></div><div className="rounded-xl border bg-white p-4"><b className="text-2xl text-blue-800">{batch.counts.text_free}</b><div className="text-xs text-gray-600">Texto libre</div></div><div className="rounded-xl border bg-white p-4"><b className="text-2xl text-purple-800">{batch.counts.template}</b><div className="text-xs text-gray-600">Plantilla</div></div><div className="rounded-xl border bg-white p-4"><b className="text-2xl text-amber-800">{batch.records.filter((row: RecordRow) => row.status === 'excluded').length}</b><div className="text-xs text-gray-600">Excluidos</div></div><div className="rounded-xl border bg-white p-4"><b className="text-2xl">{batch.template.status}</b><div className="text-xs text-gray-600">Estado plantilla</div></div></div>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void simulateApproval('all')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Aprobar lote y simular despacho</button><button disabled={busy || selected.length === 0} onClick={() => void simulateApproval('selected')} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 disabled:opacity-50">Aprobar seleccionados y simular</button><button onClick={() => setSelected(allSelected ? [] : eligible.map(row => row.order_id))} className="rounded-lg border bg-white px-4 py-2 text-sm">{allSelected ? 'Quitar selección' : 'Seleccionar elegibles'}</button></div>
      <section className="space-y-3">{batch.records.map((row: RecordRow) => <article key={row.order_id} className={`rounded-xl border bg-white p-4 ${row.status === 'excluded' ? 'border-gray-200 opacity-70' : 'border-gray-200'}`}><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><input type="checkbox" disabled={row.status === 'excluded'} checked={selected.includes(row.order_id)} onChange={(event: ChangeEvent<HTMLInputElement>) => setSelected((current: string[]) => event.target.checked ? [...current, row.order_id] : current.filter((id: string) => id !== row.order_id))} className="mt-1 h-4 w-4"/><div><div className="flex flex-wrap items-center gap-2"><b>{row.customer_name}</b><span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{row.phone || 'sin teléfono'}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.channel === 'text_free' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{row.channel === 'text_free' ? 'Texto libre' : 'Plantilla'}</span><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">{row.status}</span></div><p className="mt-1 text-sm text-gray-600">Pedido {row.order_number || row.order_id} · {row.delivery_window}</p><p className="mt-1 text-sm text-gray-700">{row.address || 'Sin dirección'}{row.pin_missing ? ' · Falta pin' : ''}</p>{row.status === 'excluded' ? <p className="mt-2 text-sm text-red-700">Motivo: {(row.excluded_reasons || []).join(', ')}</p> : row.channel === 'template' ? <p className="mt-2 text-sm text-purple-900">Plantilla {row.template_name}: {row.template_status}. Si sigue PENDING, queda en espera y no se fuerza.</p> : <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950"><b>Vista previa:</b><br/>{row.draft_text}</div>}</div></div><div className="text-right text-xs text-gray-500">{row.approval_required ? 'Requiere aprobación' : ''}<br/>{row.experimental ? 'experimental' : ''}</div></div></article>)}</section>
      {decisions.length > 0 && <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold">Decisiones auditadas</h2>{decisions.map(decision => <p key={decision.id} className="mt-2 text-xs text-gray-600">{decision.created_at} · {decision.details?.scope || 'all'} · simulación · {JSON.stringify(decision.details?.outcome_counts || {})}</p>)}</section>}
    </>}
  </main>;
}
