import { NextRequest, NextResponse } from 'next/server';
import jwt, { type SignOptions } from 'jsonwebtoken';

export type BuyerRole = 'buyer';

export interface BuyerClaims {
  sub: string;
  role: BuyerRole | string;
  name?: string;
  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
  [key: string]: unknown;
}

export interface BuyerAuthContext {
  claims: BuyerClaims;
}

export interface BuyerAuthOptions {
  secret?: string;
  issuer?: string;
  audience?: string;
}

function configuredSecret(options?: BuyerAuthOptions): string {
  const secret = options?.secret ?? process.env.BUYER_JWT_SECRET;
  if (!secret?.trim()) throw new Error('Missing BUYER_JWT_SECRET');
  return secret.trim();
}

function bearerToken(request: NextRequest): string | null {
  const value = request.headers.get('authorization');
  if (!value) return null;
  const [scheme, token] = value.trim().split(/\s+/, 2);
  return scheme?.toLowerCase() === 'bearer' && token ? token : null;
}

function unauthorized(message: string) {
  return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}

function forbidden(message: string) {
  return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message } }, { status: 403 });
}

export function issueBuyerJwt(claims: BuyerClaims, options: BuyerAuthOptions & { expiresIn?: SignOptions['expiresIn'] } = {}): string {
  const { secret, expiresIn = '15m', issuer, audience } = options;
  return jwt.sign(claims, configuredSecret({ secret }), {
    algorithm: 'HS256',
    expiresIn,
    ...(issuer ? { issuer } : {}),
    ...(audience ? { audience } : {}),
  });
}

export function verifyBuyerJwt(token: string, options: BuyerAuthOptions = {}): BuyerClaims {
  const payload = jwt.verify(token, configuredSecret(options), {
    algorithms: ['HS256'],
    ...(options.issuer ? { issuer: options.issuer } : {}),
    ...(options.audience ? { audience: options.audience } : {}),
  });

  if (!payload || typeof payload === 'string' || typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
    throw new Error('JWT is missing required buyer claims');
  }

  return payload as BuyerClaims;
}

export function requireBuyerAuth(request: NextRequest, options: BuyerAuthOptions = {}): BuyerAuthContext | Response {
  const token = bearerToken(request);
  if (!token) return unauthorized('Missing bearer token');

  let claims: BuyerClaims;
  try {
    claims = verifyBuyerJwt(token, options);
  } catch {
    return unauthorized('Invalid or expired buyer token');
  }

  if (claims.role !== 'buyer') return forbidden('Buyer role required');
  return { claims };
}

export function createBuyerGuardedHandler<T extends NextRequest = NextRequest>(
  handler: (request: T, auth: BuyerAuthContext) => Response | Promise<Response>,
  options: BuyerAuthOptions = {},
) {
  return async (request: T): Promise<Response> => {
    const auth = requireBuyerAuth(request, options);
    if (auth instanceof Response) return auth;
    return handler(request, auth);
  };
}
