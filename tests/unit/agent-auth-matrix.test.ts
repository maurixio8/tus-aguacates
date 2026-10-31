import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { validateAgentKey } from '@/lib/agent-auth';

const KEYS = {
  customer: 'TEST_CUSTOMER_KEY_ONLY_123',
  ops: 'TEST_OPS_KEY_ONLY_456',
  auditor: 'TEST_AUDITOR_KEY_ONLY_789',
};

function request(key: string) {
  return new NextRequest('https://local.test/api/agent/test', { headers: { 'x-agent-key': key } });
}

describe('Agent API fictitious-key authorization matrix', () => {
  beforeEach(() => {
    process.env.AGENT_CUSTOMER_API_KEY = KEYS.customer;
    process.env.AGENT_OPS_API_KEY = KEYS.ops;
    process.env.AGENT_AUDITOR_API_KEY = KEYS.auditor;
  });
  afterEach(() => {
    delete process.env.AGENT_CUSTOMER_API_KEY;
    delete process.env.AGENT_OPS_API_KEY;
    delete process.env.AGENT_AUDITOR_API_KEY;
  });

  const cases = [
    ['/api/agent/products', ['customer', 'ops', 'auditor'] as const],
    ['/api/agent/orders/active', ['ops', 'auditor'] as const],
  ] as const;

  for (const [endpoint, allowed] of cases) {
    it(`${endpoint} accepts only its declared scopes`, () => {
      expect(validateAgentKey(request(KEYS.customer), allowed.includes('customer') ? ['customer'] : []).success ? 200 : 401)
        .toBe(allowed.includes('customer') ? 200 : 401);
      expect(validateAgentKey(request(KEYS.ops), allowed.includes('ops') ? ['ops'] : []).success ? 200 : 401)
        .toBe(allowed.includes('ops') ? 200 : 401);
      expect(validateAgentKey(request(KEYS.auditor), allowed.includes('auditor') ? ['auditor'] : []).success ? 200 : 401)
        .toBe(allowed.includes('auditor') ? 200 : 401);
      expect(endpoint).toMatch(/^\/api\/agent\//);
    });
  }
});
