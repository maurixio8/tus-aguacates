'use client';

import { useEffect, useMemo, useState } from 'react';
import { addPromoGifts, backupToClipboard, closeJornada, getMissingItems, requestPersistentStorage, restoreFromClipboard, saveDraftToIndexedDb, type MissingItemLine, type SessionLine } from '@/lib/purchase-session-offline';

interface Props { triggerLines: SessionLine[]; missingLines: MissingItemLine[]; }

export default function PurchaseOfflineSessionPanel({ triggerLines, missingLines }: Props) {
  const [draft, setDraft] = useState({ id: 'local-draft', status: 'draft', updatedAt: new Date().toISOString() });
  const [message, setMessage] = useState('');
  const promo = useMemo(() => addPromoGifts(triggerLines), [triggerLines]);
  const missing = useMemo(() => getMissingItems(missingLines), [missingLines]);

  useEffect(() => {
    void requestPersistentStorage();
    try {
      const saved = localStorage.getItem('purchase-session-draft');
      if (saved) setDraft(JSON.parse(saved));
    } catch { /* local draft remains safe */ }
  }, []);

  const saveDraft = () => {
    const next = { ...draft, updatedAt: new Date().toISOString() };
    setDraft(next);
    localStorage.setItem('purchase-session-draft', JSON.stringify(next));
    void saveDraftToIndexedDb(next).catch(() => undefined);
    setMessage('Borrador guardado localmente');
  };

  const close = closeJornada(missingLines);
  return (
    <section className="mb-6 rounded-2xl border-2 border-indigo-300 bg-indigo-50 p-4 text-slate-950 dark:border-indigo-700 dark:bg-slate-950 dark:text-white">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-xl font-black">🧭 Jornada offline · Fases 5–6</h2><p className="text-sm">Solo borrador local; no hace llamadas de producción.</p></div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white">{draft.status.toUpperCase()}</span>
      </div>
      {promo.gifts.length > 0 && <div className="mt-3 rounded-xl border border-amber-300 bg-amber-100 p-3"><strong>🎁 Obsequio a comprar:</strong> {promo.gifts[0].quantity}x Duraznos · 📍 Mayorista</div>}
      {promo.pickingCards.length > 0 && <div className="mt-3 space-y-1">{promo.pickingCards.map(card => <div key={card.orderId} className="rounded-lg bg-white p-2 text-sm dark:bg-slate-900"><strong>{card.customerName}:</strong> {card.text}</div>)}</div>}
      <div className="mt-3 rounded-xl bg-white p-3 dark:bg-slate-900"><h3 className="font-bold">Faltantes por cliente</h3>{missing.length === 0 ? <p className="text-sm text-emerald-700">Sin faltantes; jornada lista para cierre.</p> : <ul className="mt-2 space-y-1 text-sm">{missing.map(line => <li key={`${line.orderId}-${line.productName}`}>{line.customerName}: {line.productName} · faltan {line.missingQuantity}</li>)}</ul>}</div>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={saveDraft} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-bold text-white">Guardar borrador</button><button type="button" onClick={() => void backupToClipboard(draft).then(() => setMessage('Backup copiado')).catch(() => setMessage('Clipboard no disponible'))} className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-bold">Copiar backup</button><button type="button" onClick={() => void restoreFromClipboard<typeof draft>().then(value => { setDraft(value); setMessage('Backup restaurado localmente'); }).catch(() => setMessage('Backup inválido o clipboard no disponible'))} className="rounded-lg border border-indigo-300 px-3 py-2 text-sm font-bold">Restaurar backup</button><span className={`rounded-lg px-3 py-2 text-sm font-bold ${close.status === 'closed' ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'}`}>{close.status === 'closed' ? 'Cierre local habilitado' : 'Cierre bloqueado por faltantes'}</span></div>
      {message && <p className="mt-2 text-xs font-semibold">{message}</p>}
    </section>
  );
}
