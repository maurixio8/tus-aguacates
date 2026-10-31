import { NextRequest, NextResponse } from 'next/server';
import { createUnauthorizedResponse, requireAgentOpsOrAuditorAuth } from '@/lib/agent-auth';
import { emptyStructuredAddress, type StructuredAddress } from '@/lib/address-structured';
import { evaluateCoverage } from '@/lib/coverage';
import { calculateShippingQuote } from '@/lib/shipping-rules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function parseAddress(value: unknown): StructuredAddress {
  const input = value && typeof value === 'object' ? value as Partial<StructuredAddress> : {};
  return {
    ...emptyStructuredAddress,
    ...input,
    latitude: typeof input.latitude === 'number' ? input.latitude : null,
    longitude: typeof input.longitude === 'number' ? input.longitude : null,
    pinConfidence: input.pinConfidence === 'pin' ? 'pin' : 'sin_pin',
  };
}

export async function POST(request: NextRequest) {
  const auth = requireAgentOpsOrAuditorAuth(request);
  if (!auth.success) return createUnauthorizedResponse();

  try {
    const body = await request.json();
    const address = parseAddress(body?.address || body);
    const coverage = evaluateCoverage(address);
    const subtotal = body?.subtotal;
    const shipping = typeof subtotal === 'number' && Number.isFinite(subtotal) && subtotal >= 0
      ? calculateShippingQuote(subtotal, address.city)
      : null;

    return NextResponse.json({
      success: true,
      data: {
        coverage,
        shipping,
        source: 'coverage-config+shipping-rules',
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error instanceof Error ? error.message : 'Invalid coverage request' },
    }, { status: 400 });
  }
}
