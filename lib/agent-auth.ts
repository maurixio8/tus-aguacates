import { NextRequest, NextResponse } from 'next/server';

export interface AgentAuthResult {
  success: boolean;
  keyType?: 'customer' | 'ops';
  error?: string;
}

function cleanEnvValue(value?: string): string {
  return (value || '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
}

function getAgentCustomerKey(): string {
  return cleanEnvValue(process.env.AGENT_CUSTOMER_API_KEY);
}

function getAgentOpsKey(): string {
  return cleanEnvValue(process.env.AGENT_OPS_API_KEY);
}

function extractAgentKey(request: NextRequest): string | null {
  return request.headers.get('x-agent-key');
}

export function validateAgentKey(
  request: NextRequest,
  allowBothKeys = true
): AgentAuthResult {
  const key = extractAgentKey(request);

  if (!key) {
    return {
      success: false,
      error: 'Missing x-agent-key header',
    };
  }

  const customerKey = getAgentCustomerKey();
  const opsKey = getAgentOpsKey();

  if (key === customerKey) {
    return { success: true, keyType: 'customer' };
  }

  if (key === opsKey) {
    return { success: true, keyType: 'ops' };
  }

  return {
    success: false,
    error: 'Invalid agent key',
  };
}

export function createUnauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or missing agent key',
      },
    },
    { status: 401 }
  );
}

export function requireAgentAuth(request: NextRequest): AgentAuthResult {
  const result = validateAgentKey(request, true);

  if (!result.success) {
    return result;
  }

  return result;
}
