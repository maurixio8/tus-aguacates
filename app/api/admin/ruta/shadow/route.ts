/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth-admin';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';
import { nextDeliveryDate } from '@/lib/admin-route';

const execFileAsync = promisify(execFile);
const OUT_ROOT = '/opt/data/cache/phase3-shadow-routes';
const SCRIPT = '/opt/data/tus-aguacates/scripts/phase3_shadow_route.py';

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const date = String(body.date || nextDeliveryDate());
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'Fecha inválida' }, { status: 400 });
    const { stdout } = await execFileAsync('python3', [SCRIPT, '--date', date], { timeout: 180000, maxBuffer: 1024 * 1024 });
    return NextResponse.json(JSON.parse(stdout.trim()));
  } catch (error: any) {
    console.error('Error generating shadow route', error?.message || error);
    return NextResponse.json({ error: 'No se pudo generar la ruta sombra' }, { status: 500 });
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
