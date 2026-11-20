import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const state = vi.hoisted(() => ({ query: '' }));
vi.mock('next/navigation', () => ({ useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock('next/dynamic', () => ({ default: () => () => null }));
vi.mock('@/components/admin/RouteMap', () => ({ default: () => null }));
import RutaPage from '@/app/admin/ruta/page';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); state.query = ''; });
function response(url: string) {
  const p = new URL(url, 'http://localhost').searchParams;
  const active = p.get('active') === '1';
  const dateFrom = active ? '2026-11-24' : p.get('desde');
  const dateTo = active ? '2026-11-24' : p.get('hasta');
  return { ok: true, json: async () => ({ orders: [], zones: {}, total: 0, totalAmount: 0, counts: {}, dateFrom, dateTo, activeCycle: active }) };
}
describe('route history controls', () => {
  it('honors a historical deep link and can return to active mode', async () => {
    state.query = 'active=0&desde=2026-11-17&hasta=2026-11-20';
    const fetchMock = vi.fn(async (url: string) => response(url));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<RutaPage />);
    await screen.findByText('Histórico por fecha de entrega · incluye entregados');
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toContain('active=0');
    const dates = container.querySelectorAll('input[type=date]');
    expect((dates[0] as HTMLInputElement).value).toBe('2026-11-17');
    expect((dates[1] as HTMLInputElement).value).toBe('2026-11-20');
    expect((screen.getByRole('button', { name: /Marcar como entregados/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Volver a ruta activa' }));
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('active=1'));
    await waitFor(() => expect((dates[0] as HTMLInputElement).value).toBe('2026-11-24'));
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('active=1');
  });
  it('switches to manual mode when editing dates, not when receiving active defaults', async () => {
    const fetchMock = vi.fn(async (url: string) => response(url));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = render(<RutaPage />);
    await waitFor(() => expect((container.querySelector('input[type=date]') as HTMLInputElement)?.value).toBe('2026-11-24'));
    expect(fetchMock.mock.calls.every(([url]) => url.includes('active=1'))).toBe(true);
    fireEvent.change(container.querySelectorAll('input[type=date]')[0], { target: { value: '2026-11-17' } });
    fireEvent.change(container.querySelectorAll('input[type=date]')[1], { target: { value: '2026-11-20' } });
    await waitFor(() => expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('desde=2026-11-17&hasta=2026-11-20&active=0'));
    expect((container.querySelectorAll('input[type=date]')[0] as HTMLInputElement).value).toBe('2026-11-17');
  });
});
