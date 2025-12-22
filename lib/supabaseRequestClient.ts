import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Crea un cliente Supabase "scoped" al token del request.
 * Este cliente es necesario para que las politicas RLS funcionen correctamente
 * ya que auth.uid() estara configurado con el usuario del token.
 *
 * IMPORTANTE: Este cliente debe usarse solo en el servidor (Route Handlers, Server Actions).
 *
 * @param token - El access token JWT del usuario autenticado
 * @returns Cliente Supabase configurado con el token del usuario
 */
export function createSupabaseRequestClient(token: string): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan variables de entorno de Supabase. Asegurate de configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

/**
 * Extrae el token Bearer del header de autorizacion
 * @param authHeader - El header Authorization del request
 * @returns El token si es valido, null si no
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
}
