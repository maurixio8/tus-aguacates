import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAdmin,
  createAdminToken,
  createSupabaseClient,
  getAdminCookieOptions,
  getAdminCorsHeaders,
  logAdminActivity,
  updateLastLogin,
} from '@/lib/auth-admin';

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...getAdminCorsHeaders(request),
      'Content-Length': '0',
    },
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getAdminCorsHeaders(request);

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createSupabaseClient();
    const authResult = await authenticateAdmin(supabase, email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Credenciales inválidas' },
        { status: 401, headers: corsHeaders }
      );
    }

    const adminUser = authResult.user;
    const token = createAdminToken(adminUser);

    await updateLastLogin(supabase, adminUser.id);
    await logAdminActivity(
      supabase,
      adminUser.id,
      'login',
      undefined,
      undefined,
      undefined,
      { email: adminUser.email },
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown',
      request.headers.get('user-agent') || 'unknown'
    );

    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
          last_login: new Date().toISOString(),
        },
      },
      { headers: corsHeaders }
    );

    response.cookies.set('admin-token', token, getAdminCookieOptions(request));

    return response;
  } catch (error) {
    console.error('[Admin Login] Error:', error);

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500, headers: corsHeaders }
    );
  }
}
