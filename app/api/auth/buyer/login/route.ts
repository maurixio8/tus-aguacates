import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BUYER_SESSION_COOKIE, BUYER_SESSION_MAX_AGE_SECONDS, issueBuyerJwt } from '@/lib/buyer-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return NextResponse.json({ success: false, error: 'Email y contraseña son obligatorios' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return NextResponse.json({ success: false, error: 'Auth no configurada' }, { status: 503 });

  const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return NextResponse.json({ success: false, error: 'Credenciales inválidas' }, { status: 401 });

  const role = data.user.app_metadata?.role ?? data.user.user_metadata?.role;
  if (role !== 'buyer') return NextResponse.json({ success: false, error: 'Usuario sin rol buyer' }, { status: 403 });

  const token = issueBuyerJwt({
    sub: data.user.id,
    role: 'buyer',
    name: data.user.user_metadata?.full_name ?? data.user.email ?? undefined,
  });
  const response = NextResponse.json({ success: true, buyer: { id: data.user.id, role: 'buyer' } });
  response.cookies.set(BUYER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'strict',
    maxAge: BUYER_SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
  return response;
}
