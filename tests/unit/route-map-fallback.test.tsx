import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
vi.mock('maplibre-gl', () => ({ setWorkerUrl: vi.fn(), Map: class { constructor() { throw new Error('WebGL2 unavailable'); } } }));
import RouteMap from '@/components/admin/RouteMap';
afterEach(cleanup);
it('keeps route review accessible when the browser cannot create a map', async () => {
 render(<RouteMap orders={[]} origin={{ lat: 4.6, lng: -74.1, address: 'Corabastos' }} />);
 expect((await screen.findByRole('status')).textContent).toContain('Puedes consultar la lista y los filtros de entrega');
});
