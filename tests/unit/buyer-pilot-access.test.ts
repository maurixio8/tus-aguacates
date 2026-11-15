import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('buyer pilot access contract', () => {
  it('has a dedicated route and never uses admin data APIs', () => {
    expect(fs.existsSync(path.join(root, 'app/admin/compras/page.tsx'))).toBe(true);
    const page = fs.readFileSync(path.join(root, 'app/admin/compras/page.tsx'), 'utf8');
    expect(page).toContain('/api/buyer/purchase-data');
    expect(page).not.toContain('/api/admin/orders');
    expect(page).not.toContain('/api/admin/products');
  });

  it('keeps the buyer session short-lived and httpOnly', () => {
    const route = fs.readFileSync(path.join(root, 'app/api/auth/buyer/session/route.ts'), 'utf8');
    expect(route).toContain('httpOnly: true');
    expect(route).toContain('BUYER_SESSION_MAX_AGE_SECONDS');
    expect(route).toContain("claims.role !== 'buyer'");
  });
});
