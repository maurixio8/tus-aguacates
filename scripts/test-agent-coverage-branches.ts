import { emptyStructuredAddress } from '../lib/address-structured';
import { evaluateCoverage } from '../lib/coverage';
import { calculateShippingQuote } from '../lib/shipping-rules';

const cases = [
  { name: 'dentro + subtotal bajo', address: { ...emptyStructuredAddress, city: 'Bogotá', latitude: 4.65, longitude: -74.1 }, subtotal: 10000, expectedDecision: 'dentro', expectedCost: 7400 },
  { name: 'dentro + subtotal >= 68.900', address: { ...emptyStructuredAddress, city: 'Bogotá', latitude: 4.65, longitude: -74.1 }, subtotal: 68900, expectedDecision: 'dentro', expectedCost: 0 },
  { name: 'fuera por distancia', address: { ...emptyStructuredAddress, city: 'Bogotá', latitude: 5.5, longitude: -75 }, subtotal: 10000, expectedDecision: 'fuera', expectedCost: null },
  { name: 'sin pin / no marcado', address: { ...emptyStructuredAddress, city: 'Bogotá', latitude: null, longitude: null }, subtotal: 10000, expectedDecision: 'confirmar', expectedCost: null },
  { name: 'Chía', address: { ...emptyStructuredAddress, city: 'Chía', latitude: 4.86, longitude: -74.05 }, subtotal: 10000, expectedDecision: 'fuera', expectedCost: null },
  { name: 'Soacha', address: { ...emptyStructuredAddress, city: 'Soacha', latitude: 4.58, longitude: -74.22 }, subtotal: 10000, expectedDecision: 'fuera', expectedCost: null },
] as const;

for (const test of cases) {
  const coverage = evaluateCoverage(test.address);
  const shipping = coverage.decision === 'dentro' ? calculateShippingQuote(test.subtotal, test.address.city) : null;
  if (coverage.decision !== test.expectedDecision || (shipping?.cost ?? null) !== test.expectedCost) {
    throw new Error(`${test.name}: got decision=${coverage.decision}, cost=${shipping?.cost ?? null}`);
  }
  console.log(JSON.stringify({ case: test.name, decision: coverage.decision, reasons: coverage.reasons, shipping_cost: shipping?.cost ?? null }));
}
