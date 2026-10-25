/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { normalizeDeliveryAddress } from '@/lib/location-resolution';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('delivery_location_resolutions').select('*').order('updated_at', { ascending: false }).limit(2000);
    if (error) throw error;
    return NextResponse.json({ resolutions: data || [] });
  } catch { return NextResponse.json({ error: 'No se pudieron cargar las resoluciones' }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  try {
    const body = await request.json();
    const action = String(body.action || '');
    const originalAddress = String(body.originalAddress || '').trim();
    const city = String(body.city || 'Bogotá');
    const normalizedAddress = String(body.normalizedAddress || normalizeDeliveryAddress(originalAddress, city));
    if (!originalAddress || !normalizedAddress) return NextResponse.json({ error: 'Falta la dirección' }, { status: 400 });
    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const confirmedBy = auth.user?.email || 'admin';
    const base: any = { original_address: originalAddress, normalized_address: normalizedAddress, candidates, updated_at: new Date().toISOString(), confirmed_by: confirmedBy };
    if (action === 'confirm') {
      const latitude = Number(body.latitude); const longitude = Number(body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
      Object.assign(base, { latitude, longitude, provider: body.provider || 'manual', confidence: 'alta', status: 'confirmada', resolved_at: new Date().toISOString(), rejection_reason: null });
    } else if (action === 'reject') {
      Object.assign(base, { latitude: null, longitude: null, provider: body.provider || 'manual', confidence: 'baja', status: 'rechazada', resolved_at: null, rejection_reason: String(body.reason || 'rechazada_por_admin') });
    } else if (action === 'whatsapp') {
      Object.assign(base, { latitude: null, longitude: null, provider: 'manual', confidence: 'sin_coordenadas', status: 'sin_coordenadas', resolved_at: null, rejection_reason: 'pendiente_whatsapp' });
    } else if (action === 'candidate') {
      Object.assign(base, { latitude: null, longitude: null, provider: body.provider || 'nominatim', confidence: body.confidence || 'media', status: 'candidata', resolved_at: null, rejection_reason: null });
    } else return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('delivery_location_resolutions').upsert(base, { onConflict: 'normalized_address' }).select('*').single();
    if (error) throw error;
    return NextResponse.json({ resolution: data });
  } catch (error) { console.error('location resolution error', error); return NextResponse.json({ error: 'No se pudo guardar la resolución' }, { status: 500 }); }
}
