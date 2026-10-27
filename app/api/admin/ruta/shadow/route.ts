/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import { nextDeliveryDate } from '@/lib/admin-route';
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_ROOT = '/opt/data/cache/phase3-shadow-routes';
const MAX_STOPS = 10;

function csvEscape(value: unknown): string {
  const text = String(value ?? '');
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildCsv(orders: any[]): string {
  const lines = ['lat,lng,address,note'];
  for (const order of orders) {
    const note = [
      `${order.source || 'order'}:${order.id || ''}`,
      `pedido=${order.orderNumber || order.id || ''}`,
      order.notes || 'sin nota',
      `resolución=${order.coordinateSource || 'sin_coordenadas'}`,
      `cobertura=${order.coverage || 'por_confirmar'}`,
    ].join(' | ');
    lines.push([
      csvEscape(order.latitude),
      csvEscape(order.longitude),
      csvEscape(order.correctedAddress || order.deliveryAddress || ''),
      csvEscape(note),
    ].join(','));
  }
  return `${lines.join('\n')}\n`;
}

async function generateShadowFromRouteData(request: NextRequest, date: string) {
  const routeUrl = new URL('/api/admin/ruta', request.url);
  routeUrl.searchParams.set('desde', date);
  routeUrl.searchParams.set('hasta', date);
  const response = await fetch(routeUrl, {
    headers: { cookie: request.headers.get('cookie') || '' },
    cache: 'no-store',
  });
  const routeData = await response.json().catch(() => null);
  if (!response.ok) throw new Error(routeData?.error || 'No se pudo cargar la ruta operativa');

  const routable = (routeData?.orders || []).filter((order: any) =>
    order.latitude != null && order.longitude != null && !order.isDelivered
  );
  const pendingCoordinates = (routeData?.orders || []).filter((order: any) =>
    order.latitude == null || order.longitude == null
  );
  const csvFiles = [];
  for (let index = 0; index < routable.length; index += MAX_STOPS) {
    const orders = routable.slice(index, index + MAX_STOPS);
    csvFiles.push({
      name: `spoke-${Math.floor(index / MAX_STOPS) + 1}.csv`,
      stops: orders.length,
      content: buildCsv(orders),
      order_ids: orders.map((order: any) => order.id),
    });
  }

  return {
    date,
    source: 'route-operativa-fallback',
    warning: 'CSV generado desde las paradas y coordenadas confirmadas de la ruta operativa. No modifica pedidos ni ubicaciones.',
    counts: {
      total: routeData?.orders?.length || 0,
      routed: routable.length,
      routes: csvFiles.length,
      pending_coordinates: pendingCoordinates.length,
    },
    routes: csvFiles.map(({ name, stops, order_ids }) => ({ name: name.replace('.csv', ''), stops, order_ids })),
    csvFiles,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const date = String(body.date || nextDeliveryDate());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });

    // Vercel no puede ejecutar el Python ni escribir en /opt/data. Generamos
    // un CSV read-only usando la misma ruta normalizada que ve el dashboard.
    return NextResponse.json(await generateShadowFromRouteData(request, date));
  } catch (error: any) {
    console.error('Error generating shadow route', error?.message || error);
    return NextResponse.json({ error: error?.message || 'No se pudo generar la ruta sombra' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || nextDeliveryDate();
  const file = searchParams.get('file') || 'route-report.json';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(route-report\.json|orders-classification\.json|preview\.html|spoke-\d+\.csv)$/.test(file)) return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 });
  const full = path.join(OUT_ROOT, date, file);
  try {
    const content = await fs.readFile(full);
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.csv') ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';
    return new NextResponse(content, { headers: { 'Content-Type': type, 'Content-Disposition': `inline; filename="${file}"` } });
  } catch { return NextResponse.json({ error: 'Archivo no disponible' }, { status: 404 }); }
}
