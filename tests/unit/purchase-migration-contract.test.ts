import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { BUYER_SESSION_MAX_AGE_SECONDS } from '@/lib/buyer-auth';

const migration = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/20261115_create_purchase_offline_canonical.sql'), 'utf8');

describe('canonical purchase migration contract', () => {
  it('defines exactly the four additive purchase tables and required fields', () => {
    for (const table of ['purchase_sessions', 'purchase_items', 'purchase_price_observations', 'packing_items']) {
      expect(migration).toMatch(new RegExp(`create table if not exists purchase_offline\\.${table}`));
    }
    for (const column of ['buyer_id', 'delivery_date', 'cash_advanced', 'operational_expenses', 'actual_total_paid', 'promo_gift_qty_per_trigger', 'source_order_line_id', 'source_order_number', 'requested_qty', 'purchased_qty', 'missing_qty', 'surplus_qty', 'weight_kg', 'blind_price', 'observed_at', 'picked_qty', 'ripeness_note_snapshot', 'evidence_photo_url']) {
      expect(migration).toContain(column);
    }
    expect(migration).toContain('generated always as');
    expect(migration).toContain('unique (session_id');
    expect(migration).not.toMatch(/alter table public\\.(orders|products|purchase_items)/i);
    expect(migration).not.toMatch(/drop table public\\.(orders|products|purchase_items)/i);
    expect(migration).toContain('get_buyer_purchase_projection');
  });

  it('keeps buyer sessions alive for the full 12-hour purchase jornada', () => {
    expect(BUYER_SESSION_MAX_AGE_SECONDS).toBe(43200);
  });
});
