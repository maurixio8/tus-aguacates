import { NextRequest } from 'next/server';
import { POST as coveragePost } from '../app/api/agent/coverage/route';
import { GET as orderStatusGet } from '../app/api/agent/orders/status/route';

const keys = {
  customer: 'TEST_CUSTOMER_KEY_ONLY_123',
  ops: 'TEST_OPS_KEY_ONLY_456',
  auditor: 'TEST_AUDITOR_KEY_ONLY_789',
};
process.env.AGENT_CUSTOMER_API_KEY = keys.customer;
process.env.AGENT_OPS_API_KEY = keys.ops;
process.env.AGENT_AUDITOR_API_KEY = keys.auditor;

async function main() {
  const coverageAuditor = await coveragePost(new NextRequest('https://local.test/api/agent/coverage', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-agent-key': keys.auditor },
    body: JSON.stringify({ address: { city: 'Bogotá', latitude: 4.65, longitude: -74.1 }, subtotal: 70000 }),
  }));
  const coverageCustomer = await coveragePost(new NextRequest('https://local.test/api/agent/coverage', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-agent-key': keys.customer },
    body: JSON.stringify({ address: { city: 'Bogotá' }, subtotal: 10000 }),
  }));
  const orderCustomer = await orderStatusGet(new NextRequest('https://local.test/api/agent/orders/status?phone=573001112233', {
    headers: { 'x-agent-key': keys.customer },
  }));
  const orderAuditor = await orderStatusGet(new NextRequest('https://local.test/api/agent/orders/status?phone=573001112233', {
    headers: { 'x-agent-key': keys.auditor },
  }));
  const coverageBody = await coverageAuditor.json();
  const results = [
    ['coverage×auditor', coverageAuditor.status],
    ['coverage×customer', coverageCustomer.status],
    ['order-status×customer', orderCustomer.status],
    ['order-status×auditor', orderAuditor.status],
  ];
  for (const [caseName, status] of results) console.log(JSON.stringify({ case: caseName, status }));
  console.log(JSON.stringify({ coverage_decision: coverageBody.data?.coverage?.decision, shipping_cost: coverageBody.data?.shipping?.cost, verified_at: Boolean(coverageBody.data?.verified_at) }));
  if (coverageAuditor.status !== 200 || coverageCustomer.status !== 401 || orderCustomer.status !== 401 || orderAuditor.status !== 500 || coverageBody.data?.shipping?.cost !== 0 || !coverageBody.data?.verified_at) {
    process.exitCode = 1;
  }
}

void main();
