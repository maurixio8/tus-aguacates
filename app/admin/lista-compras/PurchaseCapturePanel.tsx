'use client';

import { useMemo, useState } from 'react';
import {
  calculateAvocadoUnitsAndKilos,
  calculateCashChange,
  convertGramsToPackages,
} from '@/lib/purchase-offline-helpers';

interface PurchaseCapturePanelProps {
  totalSales: number;
  formatPrice: (value: number) => string;
}

export default function PurchaseCapturePanel({ totalSales, formatPrice }: PurchaseCapturePanelProps) {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [received, setReceived] = useState('');
  const [grams, setGrams] = useState('500');
  const [packageGrams, setPackageGrams] = useState<125 | 250 | 500>(250);
  const [avocadoUnits, setAvocadoUnits] = useState('24');
  const [averageAvocadoGrams, setAverageAvocadoGrams] = useState('200');

  const cash = useMemo(
    () => calculateCashChange(Number(purchasePrice) || totalSales, Number(received) || 0),
    [purchasePrice, received, totalSales]
  );
  const packageResult = convertGramsToPackages(Number(grams) || 0, packageGrams);
  const avocadoResult = calculateAvocadoUnitsAndKilos(Number(avocadoUnits) || 0, Number(averageAvocadoGrams) || 0);
  const inputClass = 'w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base font-semibold text-slate-900 outline-none focus:border-blue-600';

  return (
    <section className="mb-6 rounded-2xl border-2 border-blue-300 bg-blue-50 p-4 text-slate-950 shadow-sm dark:border-blue-700 dark:bg-slate-900 dark:text-white">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black">🧾 Captura ciega y cierre de caja</h2>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Fase 4 · borrador local solamente; no se envía a producción.</p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-900">🔒 LOCAL</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-blue-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 font-extrabold">💵 Precio capturado</h3>
          <label className="mb-1 block text-sm font-bold" htmlFor="purchase-price">Total de compra</label>
          <input id="purchase-price" className={inputClass} inputMode="numeric" value={purchasePrice} onChange={event => setPurchasePrice(event.target.value)} placeholder={formatPrice(totalSales)} />
          <label className="mb-1 mt-3 block text-sm font-bold" htmlFor="cash-received">Efectivo recibido</label>
          <input id="cash-received" className={inputClass} inputMode="numeric" value={received} onChange={event => setReceived(event.target.value)} placeholder="0" />
          <div className={`mt-3 rounded-lg p-3 text-lg font-black ${cash.canClose ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-950'}`}>
            {cash.canClose ? `Cambio: ${formatPrice(cash.change)}` : `Faltan: ${formatPrice(cash.missing)}`}
          </div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 font-extrabold">📦 Conversión de paquetes</h3>
          <label className="mb-1 block text-sm font-bold" htmlFor="package-grams">Gramos requeridos</label>
          <input id="package-grams" className={inputClass} inputMode="numeric" value={grams} onChange={event => setGrams(event.target.value)} />
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[125, 250, 500].map(value => <button key={value} type="button" onClick={() => setPackageGrams(value as 125 | 250 | 500)} className={`rounded-lg border-2 px-2 py-2 text-sm font-black ${packageGrams === value ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-300 bg-white text-slate-900'}`}>{value}g</button>)}
          </div>
          <p className="mt-3 rounded-lg bg-blue-100 p-3 text-lg font-black text-blue-950">{packageResult.packages} paquete(s) de {packageResult.packageGrams}g · sobrante {packageResult.remainderGrams}g</p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
          <h3 className="mb-2 font-extrabold">🥑 Aguacates: unidades → kilos</h3>
          <label className="mb-1 block text-sm font-bold" htmlFor="avocado-units">Unidades</label>
          <input id="avocado-units" className={inputClass} inputMode="numeric" value={avocadoUnits} onChange={event => setAvocadoUnits(event.target.value)} />
          <label className="mb-1 mt-3 block text-sm font-bold" htmlFor="avocado-average">Gramos promedio/unidad</label>
          <input id="avocado-average" className={inputClass} inputMode="numeric" value={averageAvocadoGrams} onChange={event => setAverageAvocadoGrams(event.target.value)} />
          <p className="mt-3 rounded-lg bg-emerald-100 p-3 text-lg font-black text-emerald-950">{avocadoResult.units} unidades · {avocadoResult.kilos.toFixed(2)} kg</p>
        </div>
      </div>
    </section>
  );
}
