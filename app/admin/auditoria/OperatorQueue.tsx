'use client';

import { useState } from 'react';

type OperatorCase = {
  key: string;
  customer_masked?: string;
  contact_phone?: string;
  priority: 'high' | 'medium' | 'low';
  priority_reason: string;
  summary: string;
  evidence?: string;
  last_activity?: string | null;
  order_state?: string;
  payment_state?: string;
  source_refs?: Array<{ source_kind: string; source_id: string }>;
  human_handoff_active?: boolean;
  intent_level?: string;
  intent_score?: number;
};

type Props = {
  cases: OperatorCase[];
  onRefresh: () => Promise<void>;
  setMessage: (message: string) => void;
};

const priorityMeta = {
  high: { label: 'Alta', description: 'Intervención humana ahora: hay riesgo, compra lista o atención activa.', classes: 'border-red-200 bg-red-50', badge: 'bg-red-700 text-white' },
  medium: { label: 'Media', description: 'Hay una acción concreta para destrabar o confirmar.', classes: 'border-amber-200 bg-amber-50', badge: 'bg-amber-200 text-amber-950' },
  low: { label: 'Baja', description: 'Caso normal o preferencia; no requiere respuesta inmediata.', classes: 'border-slate-200 bg-slate-50', badge: 'bg-slate-200 text-slate-800' },
} as const;

export default function OperatorQueue({ cases, onRefresh, setMessage }: Props) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const visible = filter === 'all' ? cases : cases.filter((item) => item.priority === filter);
  const openChat = (item: OperatorCase) => {
    if (!item.contact_phone) { setMessage('Este caso todavía no tiene teléfono reconciliado.'); return; }
    window.open(`https://wa.me/${item.contact_phone}`, '_blank', 'noopener,noreferrer');
  };
  const updateAttention = async (item: OperatorCase, action: 'pause-priority' | 'resume-priority') => {
    if (!item.contact_phone) { setMessage('Este caso todavía no tiene teléfono reconciliado.'); return; }
    setBusy(item.key);
    try {
      const response = await fetch('/api/admin/ripeness-proposals', { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, phone: item.contact_phone, sourceRefs: item.source_refs }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) throw new Error(data.error || data.details || 'No se pudo actualizar la atención');
      if (action === 'pause-priority') openChat(item);
      await onRefresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo actualizar la atención'); }
    finally { setBusy(null); }
  };
  const groups = (['high', 'medium', 'low'] as const).map((priority) => ({ priority, items: visible.filter((item) => item.priority === priority) }));
  return <section className="space-y-4">
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950"><strong>Cola operativa:</strong> una fila por teléfono reconciliado. Alta requiere atención ahora, media tiene una acción concreta y baja es seguimiento no urgente. Los botones solo preparan la atención; no se envía nada automáticamente.</div>
    <div className="flex flex-wrap gap-2">{[['all', 'Todos'], ['high', 'Alta'], ['medium', 'Media'], ['low', 'Baja']].map(([value, label]) => <button key={value} onClick={() => setFilter(value as typeof filter)} className={`rounded-lg border px-3 py-2 text-sm font-semibold ${filter === value ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}>{label} ({value === 'all' ? cases.length : cases.filter((item) => item.priority === value).length})</button>)}</div>
    {groups.map(({ priority, items }) => <div key={priority} className="space-y-3"><div><h2 className="text-lg font-bold text-slate-900">Prioridad {priorityMeta[priority].label}</h2><p className="text-sm text-slate-600">{priorityMeta[priority].description}</p></div>{items.map((item) => <article key={item.key} className={`rounded-xl border p-4 ${priorityMeta[priority].classes}`}><div className="flex flex-col gap-4 lg:flex-row lg:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2 py-1 text-xs font-bold uppercase ${priorityMeta[priority].badge}`}>Prioridad {priorityMeta[priority].label}</span><strong>{item.customer_masked || 'Cliente WhatsApp'}</strong>{item.human_handoff_active && <span className="rounded-full bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-950">Atención humana activa</span>}</div><p className="mt-2 text-sm font-semibold text-slate-900">{item.summary}</p><p className="mt-2 text-sm text-slate-700"><strong>Por qué:</strong> {item.priority_reason}</p><p className="mt-2 text-sm text-slate-700"><strong>Evidencia:</strong> {item.evidence || 'No registrada'}</p><p className="mt-2 text-xs text-slate-600">{item.order_state && `Pedido: ${item.order_state} · `}{item.payment_state && `Pago: ${item.payment_state} · `}{item.intent_level && `Intención: ${item.intent_level} (${item.intent_score ?? 0}) · `}Última actividad: {item.last_activity ? new Date(item.last_activity).toLocaleString('es-CO') : 'sin fecha'}</p></div><div className="flex shrink-0 flex-wrap gap-2 lg:max-w-xs lg:justify-end"><button onClick={() => openChat(item)} className="rounded-lg border border-green-700 bg-white px-3 py-2 text-sm font-semibold text-green-800">Abrir chat</button>{item.human_handoff_active ? <button disabled={busy === item.key} onClick={() => void updateAttention(item, 'resume-priority')} className="rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Marcar atendido y reactivar Luz</button> : <button disabled={busy === item.key} onClick={() => void updateAttention(item, 'pause-priority')} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Pausar Luz y abrir chat</button>}</div></div></article>)}{items.length === 0 && <div className="rounded-xl border bg-white p-5 text-sm text-slate-500">No hay casos en esta prioridad.</div>}</div>)}
  </section>;
}
