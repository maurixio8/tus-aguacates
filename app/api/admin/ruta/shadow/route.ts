/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { deliveryDatesInRange, nextDeliveryDate } from '@/lib/admin-route';

const execFileAsync = promisify(execFile);
const OUT_ROOT = '/opt/data/cache/phase3-shadow-routes';
const SCRIPT = '/opt/data/tus-aguacates/scripts/phase3_shadow_route.py';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const dateFrom = String(body.dateFrom || body.date || nextDeliveryDate());
    const dateTo = String(body.dateTo || body.date || dateFrom);
    const dates = body.dateFrom || body.dateTo ? deliveryDatesInRange(dateFrom, dateTo) : [dateFrom];
    if (!dates.length) return NextResponse.json({ error: 'Rango de fechas inválido o sin días de entrega martes/viernes' }, { status: 400 });
    const days = [];
    for (const date of dates) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
      const { stdout } = await execFileAsync('python3', [SCRIPT, '--date', date], { timeout: 180000, maxBuffer: 1024 * 1024 });
      days.push(JSON.parse(stdout.trim()));
    }
    return NextResponse.json({ dateFrom, dateTo, dates, days, counts: days.reduce((sum, day) => ({
      ...sum,
      routed: sum.routed + Number(day.counts?.routed || 0),
      routes: sum.routes + Number(day.counts?.routes || 0),
      excluded: sum.excluded + Number(day.counts?.fuera || 0) + Number(day.counts?.por_confirmar || 0),
    }), { routed: 0, routes: 0, excluded: 0 }), routes: days.flatMap(day => (day.routes || []).map((route: any) => ({ ...route, date: day.date }))) });
  } catch (error: any) {
    const detail = [error?.message, error?.stderr].filter(Boolean).join(' | ');
    console.error('Error generating shadow route', detail || error);
    return NextResponse.json({ error: 'No se pudo generar la ruta sombra', detail: detail || 'error desconocido' }, { status: 500 });
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
