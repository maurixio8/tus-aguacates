/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient, verifyAdminAuth } from '@/lib/auth-admin';
import { geocodeDeliveryAddress } from '@/lib/location-geocoding';
import { classifyLocationCandidates } from '@/lib/location-candidates';
import { formatNormalizedDeliveryAddress, normalizeDeliveryAddress } from '@/lib/location-resolution';
import { normalizePhoneForDB } from '@/lib/customerSync';

export const dynamic = 'force-dynamic';

async function findCustomerForAddressUpdate(supabase: any, body: any) {
  if (body.customerId) {
    const { data } = await supabase.from('customers').select('id,phone,address,city').eq('id', body.customerId).eq('is_active', true).maybeSingle();
    if (data) return data;
  }

  let phone = String(body.customerPhone || '').trim();
  if (body.orderId && (body.source === 'orders' || body.source === 'guest_orders')) {
    const table = body.source === 'orders' ? 'orders' : 'guest_orders';
    const { data } = await supabase.from(table).select(body.source === 'orders' ? 'customer_phone,user_id' : 'guest_phone,customer_id').eq('id', body.orderId).maybeSingle();
    if (data?.customer_id) {
      const { data: customer } = await supabase.from('customers').select('id,phone,address,city').eq('id', data.customer_id).eq('is_active', true).maybeSingle();
      if (customer) return customer;
    }
    if (data?.user_id) {
      const { data: customer } = await supabase.from('customers').select('id,phone,address,city').eq('id', data.user_id).eq('is_active', true).maybeSingle();
      if (customer) return customer;
    }
    phone = phone || String(data?.customer_phone || data?.guest_phone || '').trim();
  }

  const comparable = normalizePhoneForDB(phone).slice(-10);
  if (!comparable) return null;
  const { data: customers, error } = await supabase.from('customers').select('id,phone,address,city').eq('is_active', true).limit(5000);
  if (error) throw error;
  const matches = (customers || []).filter((customer: any) => normalizePhoneForDB(String(customer.phone || '')).slice(-10) === comparable);
  return matches.length === 1 ? matches[0] : null;
}

async function preserveAndUpdateCustomerAddress(supabase: any, body: any, correctedAddress: string, city: string, resolutionId: string) {
  const customer = await findCustomerForAddressUpdate(supabase, body);
  if (!customer) return { updated: false, reason: 'customer_no_identificado_de_forma_univoca' };

  const now = new Date().toISOString();
  const batch = `route-address-correction-${Array.from(now).filter(character => !'-:.TZ'.includes(character)).join('')}`;
  if (customer.address && customer.address !== correctedAddress) {
    const { error: historyError } = await supabase.from('customer_address_history').insert({
      customer_id: customer.id,
      source_customer_id: customer.id,
      source_table: 'delivery_location_resolutions',
      source_record_id: resolutionId,
      address_text: customer.address,
      phone: customer.phone,
      source_created_at: customer.updated_at || null,
      captured_at: now,
      is_alternate: true,
      merge_batch_id: batch,
      merge_snapshot_id: batch,
    });
    if (historyError) throw historyError;
  }

  const { error: updateError } = await supabase.from('customers').update({
    address: correctedAddress,
    city: city || customer.city || 'Bogotá',
    address_updated_at: now,
    address_source: 'dashboard',
    updated_at: now,
  }).eq('id', customer.id);
  if (updateError) throw updateError;
  return { updated: true, customerId: customer.id };
}

async function getResolution(supabase: any, body: any) {
  if (body.resolutionId) {
    const { data, error } = await supabase.from('delivery_location_resolutions').select('*').eq('id', body.resolutionId).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }
  if (body.originalAddress) {
    const { data, error } = await supabase.from('delivery_location_resolutions').select('*').eq('original_address', String(body.originalAddress).trim()).order('updated_at', { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  }
  return null;
}

async function snapshotResolution(supabase: any, resolution: any, event: string) {
  if (!resolution) return;
  const { error } = await supabase.from('delivery_location_resolution_history').insert({
    resolution_id: resolution.id,
    event,
    original_address: resolution.original_address,
    corrected_address: resolution.corrected_address,
    normalized_address: resolution.normalized_address,
    latitude: resolution.latitude,
    longitude: resolution.longitude,
    provider: resolution.provider,
    confidence: resolution.confidence,
    status: resolution.status,
    candidates: resolution.candidates || [],
    resolved_at: resolution.resolved_at,
    confirmed_by: resolution.confirmed_by,
    rejection_reason: resolution.rejection_reason,
    is_current: false,
  });
  if (error) throw error;
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.from('delivery_location_resolutions').select('*').order('updated_at', { ascending: false }).limit(2000);
    if (error) throw error;
    const { data: history, error: historyError } = await supabase.from('delivery_location_resolution_history').select('*').order('captured_at', { ascending: false }).limit(5000);
    if (historyError) throw historyError;
    return NextResponse.json({ resolutions: data || [], history: history || [] });
  } catch {
    return NextResponse.json({ error: 'No se pudieron cargar las resoluciones' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.success) return NextResponse.json({ error: auth.error }, { status: 401 });
  try {
    const body = await request.json();
    const action = String(body.action || '');
    const originalAddress = String(body.originalAddress || '').trim();
    const correctedAddress = String(body.correctedAddress || '').trim() || originalAddress;
    const city = String(body.city || 'Bogotá').trim() || 'Bogotá';
    const normalizedAddress = String(body.normalizedAddress || normalizeDeliveryAddress(correctedAddress, city));
    if (!originalAddress || !correctedAddress || !normalizedAddress) return NextResponse.json({ error: 'Falta la dirección' }, { status: 400 });

    const supabase = createSupabaseClient();
    const existingResolution = await getResolution(supabase, body);

    if (action === 'reopen' || action === 'reject') {
      if (!existingResolution) return NextResponse.json({ error: 'No se encontró la resolución' }, { status: 404 });
      await snapshotResolution(supabase, existingResolution, action === 'reopen' ? 'reopened' : 'rejected');
      const rejectionReason = String(body.reason || (action === 'reopen' ? 'reabierta_por_admin' : 'rechazada_por_admin'));
      const { data, error } = await supabase.from('delivery_location_resolutions').update({
        latitude: null,
        longitude: null,
        status: action === 'reopen' ? 'sin_coordenadas' : 'rechazada',
        resolved_at: null,
        confirmed_by: null,
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      }).eq('id', existingResolution.id).select('*').single();
      if (error) throw error;
      return NextResponse.json({ resolution: data, reopened: action === 'reopen' });
    }

    if (action === 'correct') {
      const candidates = classifyLocationCandidates(await geocodeDeliveryAddress(correctedAddress, city), correctedAddress, city);
      const first = candidates[0];
      if (existingResolution?.status === 'confirmada') await snapshotResolution(supabase, existingResolution, 'before_correction');
      const { data, error } = await supabase.from('delivery_location_resolutions').upsert({
        ...(existingResolution?.id ? { id: existingResolution.id } : {}),
        original_address: originalAddress,
        corrected_address: correctedAddress,
        normalized_address: normalizedAddress,
        latitude: null,
        longitude: null,
        provider: first?.provider || 'nominatim',
        confidence: first?.confidence || 'sin_coordenadas',
        status: candidates.length ? 'candidata' : 'sin_coordenadas',
        candidates,
        resolved_at: null,
        confirmed_by: null,
        rejection_reason: candidates.length ? null : 'verificar_barrio',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'normalized_address' }).select('*').single();
      if (error) throw error;
      return NextResponse.json({
        resolution: data,
        originalAddress,
        correctedAddress,
        normalizedAddress: formatNormalizedDeliveryAddress(correctedAddress, city),
        candidates,
        geocoder: first?.provider || (process.env.GEOAPIFY_API_KEY ? 'nominatim+geoapify' : 'nominatim'),
      });
    }

    const candidates = Array.isArray(body.candidates) ? body.candidates : [];
    const confirmedBy = auth.user?.email || 'admin';
    const base: any = {
      original_address: originalAddress,
      corrected_address: correctedAddress !== originalAddress ? correctedAddress : null,
      normalized_address: normalizedAddress,
      candidates,
      updated_at: new Date().toISOString(),
      confirmed_by: confirmedBy,
    };

    let customerUpdate: any = { updated: false, reason: 'no_aplica' };
    if (action === 'confirm') {
      const latitude = Number(body.latitude); const longitude = Number(body.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return NextResponse.json({ error: 'Coordenadas inválidas' }, { status: 400 });
      Object.assign(base, { latitude, longitude, provider: body.provider || 'manual', confidence: body.providerConfidence || body.confidence || 'media', status: 'confirmada', resolved_at: new Date().toISOString(), rejection_reason: null });
    } else if (action === 'reject') {
      Object.assign(base, { latitude: null, longitude: null, provider: body.provider || 'manual', confidence: 'baja', status: 'rechazada', resolved_at: null, rejection_reason: String(body.reason || 'rechazada_por_admin') });
    } else if (action === 'whatsapp') {
      Object.assign(base, { latitude: null, longitude: null, provider: 'manual', confidence: 'sin_coordenadas', status: 'sin_coordenadas', resolved_at: null, rejection_reason: 'pendiente_whatsapp' });
    } else if (action === 'candidate') {
      Object.assign(base, { latitude: null, longitude: null, provider: body.provider || 'nominatim', confidence: body.confidence || 'media', status: 'candidata', resolved_at: null, rejection_reason: null });
    } else return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });

    if (existingResolution && ['confirmada', 'candidata', 'sin_coordenadas'].includes(existingResolution.status)) {
      await snapshotResolution(supabase, existingResolution, action === 'confirm' ? 'before_replacement' : 'before_update');
    }
    const { data, error } = await supabase.from('delivery_location_resolutions').upsert(base, { onConflict: 'normalized_address' }).select('*').single();
    if (error) throw error;
    if (action === 'confirm') {
      customerUpdate = await preserveAndUpdateCustomerAddress(supabase, body, correctedAddress, city, data.id);
      if (customerUpdate.customerId) {
        await supabase.from('delivery_location_resolutions').update({ customer_id: customerUpdate.customerId }).eq('id', data.id);
      }
    }
    return NextResponse.json({ resolution: data, customerUpdate });
  } catch (error) {
    console.error('location resolution error', error);
    return NextResponse.json({ error: 'No se pudo guardar la resolución' }, { status: 500 });
  }
}
