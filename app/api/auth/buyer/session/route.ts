import { NextRequest, NextResponse } from 'next/server';
import {
  BUYER_SESSION_COOKIE,
  BUYER_SESSION_MAX_AGE_SECONDS,
  verifyBuyerJwt,
  type BuyerClaims,
} from '@/lib/buyer-auth';

export const dynamic = 'force-dynamic';

function cookieOptions(request: NextRequest) {
  return {
    httpOnly: true,
    secure: new URL(request.url).protocol === 'https:',
    sameSite: 'strict' as const,
    maxAge: BUYER_SESSION_MAX_AGE_SECONDS,
    path: '/',
  };
}

function bearer(request: NextRequest) {
  const value = request.headers.get('authorization') || '';
  const [scheme, token] = value.trim().split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' ? token : null;
}

function buyerResponse(claims: BuyerClaims) {
  return { success: true, buyer: { id: claims.sub, name: claims.name || null, role: 'buyer' } };
}

export async function POST(request: NextRequest) {
  const token = bearer(request);
  if (!token) return NextResponse.json({ success: false, error: 'Bearer token required' }, { status: 401 });
  try {
    const claims = verifyBuyerJwt(token);
    if (claims.role !== 'buyer') return NextResponse.json({ success: false, error: 'Buyer role required' }, { status: 403 });
    const response = NextResponse.json(buyerResponse(claims));
    response.cookies.set(BUYER_SESSION_COOKIE, token, cookieOptions(request));
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid or expired buyer token' }, { status: 401 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(BUYER_SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ success: false, error: 'No buyer session' }, { status: 401 });
  try {
    const claims = verifyBuyerJwt(token);
    if (claims.role !== 'buyer') return NextResponse.json({ success: false, error: 'Buyer role required' }, { status: 403 });
    return NextResponse.json(buyerResponse(claims));
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid or expired buyer session' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set(BUYER_SESSION_COOKIE, '', { ...cookieOptions(request), maxAge: 0 });
  return response;
}
