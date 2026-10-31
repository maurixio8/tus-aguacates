import { NextRequest, NextResponse } from 'next/server';

export interface AgentAuthResult {
  success: boolean;
  keyType?: 'customer' | 'ops' | 'auditor';
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

function getAgentAuditorKey(): string {
  return cleanEnvValue(process.env.AGENT_AUDITOR_API_KEY);
}

function extractAgentKey(request: NextRequest): string | null {
  return request.headers.get('x-agent-key');
}

export function validateAgentKey(
  request: NextRequest,
  allowedKeyTypes: Array<'customer' | 'ops' | 'auditor'> = ['customer', 'ops', 'auditor']
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

  if (allowedKeyTypes.includes('customer') && key === customerKey) {
    return { success: true, keyType: 'customer' };
  }

  if (key === opsKey) {
    if (!allowedKeyTypes.includes('ops')) {
      return { success: false, error: 'Agent key scope not allowed' };
    }
    return { success: true, keyType: 'ops' };
  }

  const auditorKey = getAgentAuditorKey();
  if (key === auditorKey) {
    if (!allowedKeyTypes.includes('auditor')) {
      return { success: false, error: 'Agent key scope not allowed' };
    }
    return { success: true, keyType: 'auditor' };
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
  const result = validateAgentKey(request, ['customer', 'ops', 'auditor']);

  if (!result.success) {
    return result;
  }

  return result;
}

export function requireAgentOpsAuth(request: NextRequest): AgentAuthResult {
  const result = validateAgentKey(request, ['ops']);

  if (!result.success) {
    return result;
  }

  return result;
}

export function requireAgentOpsOrAuditorAuth(request: NextRequest): AgentAuthResult {
  const result = validateAgentKey(request, ['ops', 'auditor']);

  if (!result.success) {
    return result;
  }

  return result;
}

export function requireAgentAuditorAuth(request: NextRequest): AgentAuthResult {
  const result = validateAgentKey(request, ['auditor']);

  if (!result.success) {
    return result;
  }

  return result;
}
