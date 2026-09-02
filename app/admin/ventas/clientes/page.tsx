'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, MessageCircle, Copy, Users, AlertTriangle, Trophy, Clock } from 'lucide-react';

type Customer = {
  key: string; name: string; phone: string; email: string; orders: number; delivered: number;
  pending: number; totalSpent: number; lastOrder: string | null; lastDelivered: string | null;
  daysSince: number; segmentLabel: string; topProducts: string[];
};
type Data = { summary: { orders:number; delivered:number; pending:number; customers:number }; segments: Record<string, Customer[]> };

const money = (n:number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n);
const date = (s:string|null) => s ? new Date(s).toLocaleDateString('es-CO',{day:'2-digit',month:'short',year:'numeric'}) : 'Sin fecha';
const phone = (s:string) => { const d=(s||'').replace(/\D/g,''); return d.startsWith('57')?d:`57${d}`; };
const CAMPAIGN_COUPON = 'TEQUEREMOSDEVUELTA';

export default function CustomerInsightsPage() {
  const [data,setData]=useState<Data|null>(null); const [loading,setLoading]=useState(true); const [error,setError]=useState('');
  const [tab,setTab]=useState('highRisk'); const [copied,setCopied]=useState<string|null>(null);
  const load=async()=>{setLoading(true);setError('');try{const r=await fetch('/api/admin/customer-insights?_t='+Date.now(),{credentials:'include',cache:'no-store'});const d=await r.json();if(!r.ok||!d.success)throw Error(d.error||'Error');setData(d)}catch(e){setError('No se pudo cargar el análisis. Intenta nuevamente.')}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);
  const tabs=[['highRisk','Alto riesgo','🔴'],['atRisk','En riesgo','⚠️'],['best','Mejores clientes','🏆'],['potential','Potenciales','⭐'],['pending','Pedidos pendientes','📦']];
  const list=useMemo(()=>data?.segments?.[tab]||[],[data,tab]);
  const message=(c:Customer)=>{
    if(tab==='best') return `Hola ${c.name}. Queremos agradecerte por confiar en Tus Aguacates 🥑\n\nEres uno de nuestros clientes especiales y queremos darte un beneficio exclusivo: $5.000 de descuento en compras superiores a $50.000.\n\nUsa el código ${CAMPAIGN_COUPON} antes del 30 de septiembre.\n\nPuedes comprar aquí:\nhttps://tus-aguacates.vercel.app\n\n¡Gracias por seguir con nosotros!`;
    if(tab==='potential') return `Hola ${c.name}. Esperamos que hayas disfrutado tu pedido de Tus Aguacates 🥑\n\nTenemos un beneficio especial para tu segunda compra: $5.000 de descuento en compras superiores a $50.000. Usa el código ${CAMPAIGN_COUPON} antes del 30 de septiembre.\n\nPuedes volver a comprar aquí:\nhttps://tus-aguacates.vercel.app`;
    return `Hola ${c.name}. Te hemos extrañado en Tus Aguacates 🥑\n\nQueremos darte $5.000 de descuento en compras superiores a $50.000. Usa el código ${CAMPAIGN_COUPON} antes del 30 de septiembre.\n\nPuedes hacer tu pedido aquí:\nhttps://tus-aguacates.vercel.app`;
  };
  const copy=async(c:Customer)=>{await navigator.clipboard.writeText(message(c));setCopied(c.key);setTimeout(()=>setCopied(null),1800)};
  const whatsapp=(c:Customer)=>{if(!c.phone)return;window.open(`https://wa.me/${phone(c.phone)}?text=${encodeURIComponent(message(c))}`,'_blank','noopener,noreferrer')};
  return <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Revisor de Ventas</h1><p className="text-gray-600 dark:text-gray-300 mt-1">Clientes, recompra y oportunidades comerciales</p></div>
        <button onClick={load} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"><RefreshCw size={16}/>Actualizar análisis</button>
      </div>
      {loading&&<div className="p-8 text-center text-gray-500">Analizando pedidos reales...</div>}
      {error&&<div className="p-4 rounded-lg bg-red-50 text-red-700">{error}</div>}
      {data&&<>
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><p className="font-bold text-amber-900 dark:text-amber-200">Campaña Amor y Amistad</p><p className="text-sm text-amber-800 dark:text-amber-300">$5.000 de descuento desde $50.000 · válida hasta el 30 de septiembre</p></div><code className="px-3 py-2 rounded-lg bg-white dark:bg-gray-900 text-amber-700 dark:text-amber-300 font-bold text-sm">{CAMPAIGN_COUPON}</code></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[['Pedidos',data.summary.orders,Users],['Entregados',data.summary.delivered,Trophy],['Pendientes',data.summary.pending,Clock],['Clientes unificados',data.summary.customers,Users]].map(([label,value,Icon]:any)=><div key={label as string} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"><Icon size={18} className="text-green-600 mb-2"/><div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div><div className="text-xs text-gray-500 dark:text-gray-400">{label}</div></div>)}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">{tabs.map(([key,label,emoji])=><button key={key} onClick={()=>setTab(key as string)} className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium border ${tab===key?'bg-green-700 text-white border-green-700':'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'}`}>{emoji} {label} ({data.segments[key as string]?.length||0})</button>)}</div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700"><h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">{tab==='best'?<Trophy size={18} className="text-yellow-500"/>:<AlertTriangle size={18} className="text-orange-500"/>}{tabs.find(x=>x[0]===tab)?.[1]}</h2><p className="text-xs text-gray-500 mt-1">Los mensajes se preparan para revisión. No se envían automáticamente.</p></div>
          {list.length===0?<div className="p-8 text-center text-gray-500">No hay clientes en este segmento.</div>:<div className="divide-y divide-gray-100 dark:divide-gray-700">{list.map(c=><div key={c.key} className="p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0"><div className="flex items-center gap-2"><h3 className="font-bold text-gray-900 dark:text-white truncate">{c.name}</h3><span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{c.segmentLabel}</span></div><div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400"><span>Pedidos: <b className="text-gray-800 dark:text-gray-200">{c.orders}</b></span><span>Acumulado: <b className="text-gray-800 dark:text-gray-200">{money(c.totalSpent)}</b></span><span>Última compra: <b className="text-gray-800 dark:text-gray-200">{date(c.lastDelivered||c.lastOrder)}</b></span><span>Hace: <b className="text-gray-800 dark:text-gray-200">{c.daysSince} días</b></span></div>{c.topProducts?.length>0&&<div className="text-xs text-gray-400 mt-2 truncate">Compra: {c.topProducts.join(' · ')}</div>}</div>
            <div className="flex gap-2 shrink-0"><button onClick={()=>copy(c)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-200"><Copy size={14}/>{copied===c.key?'Copiado':'Copiar'}</button>{c.phone&&<button onClick={()=>whatsapp(c)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white text-xs"><MessageCircle size={14}/>Preparar WhatsApp</button>}</div>
          </div>)}</div>}
        </div>
      </>}
    </div>
  </main>;
}
