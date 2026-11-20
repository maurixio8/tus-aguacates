/* eslint-disable @typescript-eslint/no-explicit-any */
import { isOperationalTestOrder, isRouteEligible } from '@/lib/admin-route';

const COMPLETED = new Set(['delivered', 'entregado', 'completado', 'completed']);
const EXCLUDED = new Set(['cancelado', 'cancelled', 'canceled', 'pausado_confirmacion']);

export function isDeliveredRouteOrder(row: any): boolean {
  return Boolean(row?.delivered_at) || [row?.route_status, row?.status, row?.order_status].some(s => COMPLETED.has(String(s || '').trim().toLowerCase()));
}

/** Historical visibility does not re-open completed orders or alter operational eligibility. */
export function isHistoricalRouteEligible(row: any): boolean {
  if (isOperationalTestOrder(row) || [row?.route_status, row?.status, row?.order_status].some(s => EXCLUDED.has(String(s || '').trim().toLowerCase()))) return false;
  return isRouteEligible(row) || isDeliveredRouteOrder(row);
}

function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function routeDateRange(params: URLSearchParams, activeDate: string) {
  const active = params.get('active') !== '0';
  const from = params.get('desde') || params.get('dateFrom') || '';
  const to = params.get('hasta') || params.get('dateTo') || '';
  const desde = active ? activeDate : from || to || activeDate;
  const hasta = active ? activeDate : to || desde;
  if (!validDate(desde) || !validDate(hasta) || desde > hasta) throw new Error('Rango de entrega inválido');
  return { active, desde, hasta };
}
