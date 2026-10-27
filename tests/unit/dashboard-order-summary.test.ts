import { describe, expect, it } from 'vitest';
import { generateDashboardOrderSummary } from '@/utils/dashboardOrderSummary';

describe('dashboard order summary', () => {
  it('includes address, customer, products, variant, weight and total', () => {
    const summary = generateDashboardOrderSummary(
      { delivery_address: 'Calle 11c #73-82', total_amount: 28900 },
      'Mauricio',
      [{ product_name: 'Menta', quantity: 1, price: 4500, variantName: 'Paquete', weight: 50, unit: 'g' }],
    );
    expect(summary).toContain('DIRECCIÓN: Calle 11c #73-82');
    expect(summary).toContain('CLIENTE: Mauricio');
    expect(summary).toContain('Menta');
    expect(summary).toContain('Variante: Paquete');
    expect(summary).toContain('Peso: 50g');
    expect(summary).toContain('28.900');
  });
});
