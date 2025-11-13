import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Función para verificar si el usuario es admin
async function isAdmin(supabase: any, accessToken: string): Promise<boolean> {
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('id, role, is_active')
      .eq('id', supabase.auth.getUser().data.user?.id)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return false;
    }

    return ['admin', 'super_admin'].includes(adminUser.role);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Si la ruta empieza con /admin, verificar autenticación
  if (pathname.startsWith('/admin')) {
    // Excepción para página de login de admin
    if (pathname === '/admin/login') {
      return NextResponse.next();
    }

    // Crear cliente Supabase para middleware
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            request.cookies.delete({
              name,
              ...options,
            });
          },
        },
      }
    );

    // Obtener sesión del usuario
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (!session || sessionError) {
      // No hay sesión, redirigir a login
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar si es admin
    const adminCheck = await isAdmin(supabase, session.access_token);

    if (!adminCheck) {
      // No es admin, redirigir a login con mensaje de error
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('error', 'access_denied');
      loginUrl.searchParams.set('redirectedFrom', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Es admin válido, continuar
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    // Añadir headers para identificar al admin en el servidor
    response.headers.set('x-admin-user-id', session.user.id);
    response.headers.set('x-admin-email', session.user.email || '');

    return response;
  }

  // Para todas las demás rutas, continuar normalmente
  return NextResponse.next();
}

// Configurar el middleware para que solo se ejecute en rutas específicas
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};