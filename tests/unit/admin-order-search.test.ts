import { describe, expect, it } from 'vitest';
import { matchesAdminOrderSearch } from '@/lib/admin-order-search';

describe('matchesAdminOrderSearch', () => {
  const order = {
    id: 'abc-123',
    order_number: 'INV-230d4858',
    customer_name: 'Germán Martínez',
    customer_email: 'german@example.com',
    customer_phone: '573212865770',
    delivery_address: 'Carrera 78g Bis C #48a15, Bogotá',
  };

  it('matches names without accents', () => {
    expect(matchesAdminOrderSearch(order, 'German Martinez')).toBe(true);
  });

  it('matches formatted phone digits', () => {
    expect(matchesAdminOrderSearch(order, '+57 321 286 5770')).toBe(true);
  });

  it('matches address and order number', () => {
    expect(matchesAdminOrderSearch(order, '48a15')).toBe(true);
    expect(matchesAdminOrderSearch(order, 'INV-230d4858')).toBe(true);
  });

  it('does not match unrelated text', () => {
    expect(matchesAdminOrderSearch(order, 'Soacha')).toBe(false);
  });
});
