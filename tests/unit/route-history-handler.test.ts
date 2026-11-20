import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const fixtures = vi.hoisted(() => ({ authorized: true, rows: [
  { id: 'old-delivered', status: 'delivered', guest_name: 'Cliente histórico', delivery_date: '2026-11-17', created_at: '2026-11-12T15:00:00Z' },
  { id: 'friday-pending', status: 'pending', guest_name: 'Cliente viernes', delivery_date: '2026-11-20', created_at: '2026-11-18T15:00:00Z' },
  { id: 'cancelled', status: 'cancelado', delivery_date: '2026-11-17', created_at: '2026-11-12T15:00:00Z' },
  { id: 'next', status: 'pending', delivery_date: '2026-11-24', created_at: '2026-11-20T11:30:00Z' },
] }));
vi.mock('@/lib/auth-admin', () => ({
 verifyAdminAuth: async () => ({ success: fixtures.authorized, error: 'Unauthorized' }),
 createSupabaseClient: () => ({ from: (table: string) => ({ select: () => ({
  range: async () => ({ data: table === 'guest_orders' ? fixtures.rows : [], error: null }),
  order: () => ({ limit: async () => ({ data: [], error: null }) }),
 }) }) }),
}));
vi.mock('@/lib/location-geocoding', () => ({ geocodeDeliveryAddress: async () => [] }));
import { GET } from '@/app/api/admin/ruta/route';
afterEach(() => { fixtures.authorized = true; vi.useRealTimers(); });
describe('historical route GET contract', () => {
 it('returns delivered and pending by delivery date without mutating source rows', async () => {
  const before = JSON.stringify(fixtures.rows);
  const r = await GET(new NextRequest('https://www.tusaguacates.com/api/admin/ruta?active=0&desde=2026-11-17&hasta=2026-11-20'));
  expect(r.status).toBe(200);
  const body = await r.json();
  expect(body.activeCycle).toBe(false);
  expect(body.orders.map((x: {id: string}) => x.id)).toEqual(['old-delivered', 'friday-pending']);
  expect(body.orders[0].isDelivered).toBe(true);
  expect(body.orders[1].isDelivered).toBe(false);
  expect(body.total).toBe(2);
  expect(JSON.stringify(fixtures.rows)).toBe(before);
 });
 it('keeps active=1 operational and ignores requested historical dates explicitly', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-20T16:00:00Z'));
  const r = await GET(new NextRequest('https://www.tusaguacates.com/api/admin/ruta?active=1&desde=2026-11-17&hasta=2026-11-20'));
  const body = await r.json();
  expect(body.dateFrom).toBe('2026-11-24');
  expect(body.activeCycle).toBe(true);
  expect(body.orders.map((x: {id: string}) => x.id)).toEqual(['next']);
 });
 it('rejects reversed dates', async () => {
  expect((await GET(new NextRequest('https://www.tusaguacates.com/api/admin/ruta?active=0&desde=2026-11-20&hasta=2026-11-17'))).status).toBe(400);
 });
 it('requires an admin session', async () => {
  fixtures.authorized = false;
  expect((await GET(new NextRequest('https://www.tusaguacates.com/api/admin/ruta?active=0&desde=2026-11-17'))).status).toBe(401);
 });
});
