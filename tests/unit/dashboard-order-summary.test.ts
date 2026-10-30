import { describe, expect, it } from 'vitest';
import { generateDashboardOrderSummary } from '@/utils/dashboardOrderSummary';

describe('resumen del botón Copiar resumen', () => {
  it('mantiene el formato operativo corto del dashboard', () => {
    const summary = generateDashboardOrderSummary(
      { delivery_address: 'CRA 87bis # 89-30 piso 2 Barrio la Serena', total_amount: 27000 },
      'Betty Corredor',
      [{ product_name: 'Caja de 24 unidades hass', quantity: 1, subtotal: 19600 }],
    );

    expect(summary).toContain('DIRECCIÓN: CRA 87bis # 89-30 piso 2 Barrio la Serena');
    expect(summary).toContain('CLIENTE: Betty Corredor');
    expect(summary).toContain('PRODUCTOS:');
    expect(summary).toContain('Caja de 24 unidades hass');
    expect(summary).toContain('TOTAL A PAGAR:');
    expect(summary).not.toContain('TELÉFONO:');
    expect(summary).not.toContain('ESTADO:');
    expect(summary).not.toContain('FECHA DE ENTREGA:');
  });
});
