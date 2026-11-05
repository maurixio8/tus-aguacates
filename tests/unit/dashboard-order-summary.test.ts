import { describe, expect, it } from 'vitest';
import { generateDashboardOrderSummary } from '@/utils/dashboardOrderSummary';

describe('resumen del botón Copiar resumen', () => {
  it('genera una confirmación de entrega para el día siguiente', () => {
    const summary = generateDashboardOrderSummary(
      {
        delivery_address: 'CRA 87bis # 89-30 piso 2 Barrio la Serena',
        delivery_date: '2026-11-06T12:00:00.000Z',
        shipping_address: { city: 'Bogotá' },
        total_amount: 27000,
      },
      'Betty Corredor',
      [{ product_name: 'Caja de 24 unidades hass', quantity: 1, subtotal: 19600 }],
    );

    expect(summary).toContain('Hola, Betty Corredor 😊');
    expect(summary).toContain('entrega mañana, viernes 6 de noviembre de 2026');
    expect(summary).toContain('Productos:');
    expect(summary).toContain('Caja de 24 unidades hass');
    expect(summary).toContain('Total a pagar: $27.000');
    expect(summary).toContain('Dirección de entrega:');
    expect(summary).toContain('CRA 87bis # 89-30 piso 2 Barrio la Serena');
    expect(summary).toContain('Bogotá');
    expect(summary).toContain('confirmando si todo está correcto');
    expect(summary).not.toContain('TELÉFONO:');
    expect(summary).not.toContain('ESTADO:');
  });
});
