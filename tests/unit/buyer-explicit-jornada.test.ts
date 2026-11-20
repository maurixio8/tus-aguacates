import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { buyerPurchaseCycleForDeliveryDate } from '../../lib/buyer-cycle';

describe('explicit jornada recovery URL', () => {
  it('keeps the explicit date parameter on every buyer data reload', () => {
    const source = fs.readFileSync('app/admin/compras/BuyerPurchaseWorkspaceV3.tsx', 'utf8');
    expect(source).toContain("new URLSearchParams(window.location.search).get('deliveryDate')");
    expect(source).toContain('?deliveryDate=${encodeURIComponent(requestedDate)}');
    expect(source).toContain('void syncRealOrders(data.delivery_date)');
  });
  it('preserves separate Friday and Tuesday intake windows', () => {
    const friday = buyerPurchaseCycleForDeliveryDate('2026-11-20');
    const tuesday = buyerPurchaseCycleForDeliveryDate('2026-11-24');
    expect(friday.endsAt).toEqual(tuesday.startsAt);
    expect(friday.deliveryDate).not.toEqual(tuesday.deliveryDate);
  });
});
