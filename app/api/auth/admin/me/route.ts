import { NextRequest, NextResponse } from 'next/server';
import { getAdminCorsHeaders, getCurrentAdminUser } from '@/lib/auth-admin';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getAdminCorsHeaders(request),
  });
}

export async function GET(request: NextRequest) {
  const corsHeaders = getAdminCorsHeaders(request);

  try {
    const adminUser = await getCurrentAdminUser();

    if (!adminUser) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          last_login: adminUser.last_login,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('[Admin Me] Error:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
