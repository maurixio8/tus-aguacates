import { describe, expect, it, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import {
  createBuyerGuardedHandler,
  issueBuyerJwt,
  type BuyerClaims,
} from '@/lib/buyer-auth';

const SECRET = 'buyer-test-secret';

function request(token?: string) {
  return new NextRequest('https://local.test/api/buyer/purchase-jornada', {
    headers: token ? { authorization: `Bearer ${token}` } : undefined,
  });
}

const handler = createBuyerGuardedHandler(async (_request, auth) =>
  Response.json({ ok: true, buyer_id: auth.claims.sub, role: auth.claims.role }),
);

describe('buyer JWT API guard', () => {
  afterEach(() => {
    delete process.env.BUYER_JWT_SECRET;
  });

  it('returns 401 when the bearer token is missing', async () => {
    process.env.BUYER_JWT_SECRET = SECRET;
    const response = await handler(request());
    expect(response.status).toBe(401);
  });

  it('returns 401 when the JWT is invalid or signed with the wrong secret', async () => {
    process.env.BUYER_JWT_SECRET = SECRET;
    const token = jwt.sign({ sub: 'buyer-1', role: 'buyer' }, 'wrong-secret');
    const response = await handler(request(token));
    expect(response.status).toBe(401);
  });

  it('returns 403 when a valid JWT has a non-buyer role', async () => {
    process.env.BUYER_JWT_SECRET = SECRET;
    const token = jwt.sign({ sub: 'admin-1', role: 'admin' }, SECRET);
    const response = await handler(request(token));
    expect(response.status).toBe(403);
  });

  it('returns 200 and typed claims for a valid buyer JWT', async () => {
    process.env.BUYER_JWT_SECRET = SECRET;
    const claims: BuyerClaims = { sub: 'buyer-1', role: 'buyer', name: 'Mao' };
    const token = issueBuyerJwt(claims, { secret: SECRET });
    const response = await handler(request(token));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, buyer_id: 'buyer-1', role: 'buyer' });
  });
});
