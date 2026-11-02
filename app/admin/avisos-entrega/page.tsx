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

type Counts = {
  total: number;
  text_free: number;
  template: number;
  waiting_template: number;
  excluded: number;
  failed: number;
  sent: number;
  pins_missing: number;
};

type Batch = {
  target_delivery_date: string;
  target_delivery_label: string;
  delivery_window: string;
  mode: string;
  sending_enabled: boolean;
  experimental: boolean;
  template: { name: string; language: string; status: string };
  records: RecordRow[];
  counts: Counts;
};

type Decision = {
  id: string;
  action: string;
  created_at: string;
  details: {
    mode?: string;
    scope?: string;
    batch_date?: string;
    requested_mode?: string;
    active_mode?: string;
    activation?: string;
    outcome_counts?: { would_send?: number; waiting_template?: number; excluded?: number };
  };
};

const statusLabels: Record<string, string> = {
  pending_approval: 'Pendiente de aprobación',
  excluded: 'Fuera del lote',
  sent: 'Enviado',
  failed: 'Fallido',
  waiting_template: 'En espera de plantilla',
};

function humanStatus(value: string): string {
  return statusLabels[value] || 'Pendiente de aprobación';
}

function humanTemplateStatus(value: string | null): string {
  if (value === 'APPROVED') return 'Aprobada';
  if (value === 'PENDING') return 'Pendiente de aprobación de Meta';
  return 'No disponible';
}

function formatDecision(decision: Decision): string {
  const date = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' }).format(new Date(decision.created_at));
  const details = decision.details || {};
  if (decision.action === 'delivery_notice_mode_graduation_requested') {
    return `${date}: se solicitó revisar la graduación al modo real. El modo real sigue desactivado y el lote continúa en modo de prueba.`;
  }
  const counts = details.outcome_counts || {};
  const scope = details.scope === 'selected' ? 'los clientes seleccionados' : 'el lote completo';
  return `${date}: se aprobó ${scope} para una prueba. Se enviarían ${counts.would_send || 0} avisos; ${counts.waiting_template || 0} quedan en espera de plantilla y ${counts.excluded || 0} están fuera del lote. No salió ningún mensaje.`;
}

export default function DeliveryNoticesPage() {
  const [date, setDate] = useState('2026-11-03');
  const [batch, setBatch] = useState<Batch | null>(null);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/delivery-notices?date=${encodeURIComponent(date)}`, { credentials: 'include', cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo cargar el lote');
      setBatch(data.batch);
      setDecisions(data.decisions || []);
      setSelected([]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo cargar el lote');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { void load(); }, [load]);

  const eligible = useMemo<RecordRow[]>(() => batch?.records.filter((row: RecordRow) => row.status !== 'excluded') || [], [batch]);
  const allSelected = eligible.length > 0 && eligible.every(row => selected.includes(row.order_id));

  const simulateApproval = async (scope: 'all' | 'selected') => {
    if (scope === 'selected' && selected.length === 0) {
      setMessage('Selecciona al menos un cliente.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/delivery-notices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, scope, orderIds: selected }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo registrar la aprobación');
      setMessage(`Aprobación registrada para prueba. Se enviarían ${data.decision.details.outcome_counts.would_send || 0} avisos; ${data.decision.details.outcome_counts.waiting_template || 0} quedan en espera de plantilla. No salió ningún mensaje.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la aprobación');
    } finally {
      setBusy(false);
    }
  };

  const requestRealMode = async (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const confirmed = window.confirm('Esta acción quedará auditada a nombre de Mauricio. Solicitará revisar el modo real, pero no lo activará. ¿Continuar?');
    if (!confirmed) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/delivery-notices', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_real_mode', date }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || data.activated) throw new Error(data.error || 'No se pudo registrar la solicitud');
      setMessage('Solicitud auditada. El modo real sigue desactivado; el sistema continúa en modo de prueba.');
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo registrar la solicitud');
    } finally {
      setBusy(false);
    }
  };

  return <main className="space-y-6">
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-sm font-semibold text-green-700">Operación de entregas</p>
        <h1 className="text-2xl font-bold text-gray-900">Avisos de entrega</h1>
        <p className="text-sm text-gray-600">Revisa y aprueba los avisos. Ningún mensaje sale sin una decisión explícita de Mauricio.</p>
      </div>
      <div className="flex gap-2"><input aria-label="Fecha del lote" type="date" value={date} onChange={(event: ChangeEvent<HTMLInputElement>) => setDate(event.target.value)} className="rounded-lg border px-3 py-2 text-sm" /><button onClick={() => void load()} className="rounded-lg border bg-white px-3 py-2 text-sm">Actualizar</button></div>
    </div>

    <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><b>Modo de prueba activo</b><br />La aprobación calcula qué ocurriría, pero no envía WhatsApp ni agrega mensajes a las conversaciones.</div>
    {message && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">{message}</div>}

    {loading ? <div className="rounded-xl border bg-white p-8 text-center text-gray-500">Cargando lote…</div> : batch && <>
      <section className="rounded-xl border bg-white p-5"><p className="text-sm font-semibold text-green-700">Lote de avisos</p><h2 className="text-xl font-bold text-gray-900">Avisos para {batch.target_delivery_label}</h2><p className="mt-1 text-sm text-gray-600">Franja de entrega: {batch.delivery_window}</p><p className="mt-1 text-sm text-gray-600">Plantilla de utilidad: {humanTemplateStatus(batch.template.status)}</p></section>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {([
          ['Total', batch.counts.total, 'text-gray-900'],
          ['Texto libre', batch.counts.text_free, 'text-blue-800'],
          ['Plantilla', batch.counts.template, 'text-purple-800'],
          ['En espera de plantilla', batch.counts.waiting_template, 'text-purple-800'],
          ['Excluidos', batch.counts.excluded, 'text-gray-700'],
          ['Fallidos', batch.counts.failed, 'text-red-800'],
          ['Enviados', batch.counts.sent, 'text-green-800'],
          ['Pines faltantes', batch.counts.pins_missing, 'text-amber-800'],
        ] as const).map(([label, value, color]) => <div key={label} className="rounded-xl border bg-white p-4"><b className={`text-2xl ${color}`}>{value}</b><div className="text-xs text-gray-600">{label}</div></div>)}
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="font-semibold text-gray-900">Graduar a modo real</h2><p className="text-sm text-gray-600">El interruptor solo registra una solicitud auditada. No activa el envío real por sí solo.</p></div><label className="flex items-center gap-3 text-sm font-semibold text-gray-800"><span>Modo real: desactivado</span><input aria-label="Solicitar graduación a modo real" type="checkbox" checked={false} disabled={busy} onChange={requestRealMode} className="h-5 w-5 accent-green-700" /></label></div></section>

      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void simulateApproval('all')} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Aprobar lote para prueba</button><button disabled={busy || selected.length === 0} onClick={() => void simulateApproval('selected')} className="rounded-lg border border-green-700 px-4 py-2 text-sm font-semibold text-green-800 disabled:opacity-50">Aprobar seleccionados para prueba</button><button onClick={() => setSelected(allSelected ? [] : eligible.map(row => row.order_id))} className="rounded-lg border bg-white px-4 py-2 text-sm">{allSelected ? 'Quitar selección' : 'Seleccionar elegibles'}</button></div>

      <section className="space-y-3">{batch.records.map((row: RecordRow) => <article key={row.order_id} className={`rounded-xl border bg-white p-4 ${row.status === 'excluded' ? 'border-gray-200 opacity-70' : 'border-gray-200'}`}><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="flex gap-3"><input aria-label={`Seleccionar ${row.customer_name}`} type="checkbox" disabled={row.status === 'excluded'} checked={selected.includes(row.order_id)} onChange={(event: ChangeEvent<HTMLInputElement>) => setSelected((current: string[]) => event.target.checked ? [...current, row.order_id] : current.filter((id: string) => id !== row.order_id))} className="mt-1 h-4 w-4" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><b>{row.customer_name}</b><span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{row.phone || 'sin teléfono'}</span><span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.channel === 'text_free' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{row.channel === 'text_free' ? 'Texto libre' : 'Plantilla de utilidad'}</span><span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900">{humanStatus(row.status)}</span></div><p className="mt-1 text-sm text-gray-600">Pedido: {row.order_number || 'Pedido invitado'} · {row.delivery_window}</p><p className="mt-1 text-sm text-gray-700">{row.address || 'Sin dirección'}{row.pin_missing ? ' · Falta pin' : ''}</p>{row.status === 'excluded' ? <p className="mt-2 text-sm text-red-700">Motivo: {(row.excluded_reasons || []).join(', ')}</p> : <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3"><summary className="cursor-pointer text-sm font-semibold text-gray-800">Ver mensaje completo</summary><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-900">{row.draft_text}</p>{row.channel === 'template' && <p className="mt-2 text-xs text-gray-600">Plantilla de utilidad: {humanTemplateStatus(row.template_status)}</p>}</details>}</div></div><div className="text-right text-xs text-gray-500">{row.approval_required ? 'Pendiente de decisión' : ''}</div></div></article>)}</section>

      {decisions.length > 0 && <section className="rounded-xl border bg-white p-4"><h2 className="font-semibold text-gray-900">Historial de decisiones</h2>{decisions.map(decision => <p key={decision.id} className="mt-3 border-t pt-3 text-sm text-gray-700">{formatDecision(decision)}</p>)}</section>}
    </>}
  </main>;
}
