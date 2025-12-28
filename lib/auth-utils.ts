import { supabase } from './supabase';

/**
 * Obtiene el access token actual de forma consistente
 * Prioriza el token de Supabase sobre localStorage para evitar sincronización issues
 */
export async function getCurrentAccessToken(): Promise<string | null> {
  try {
    // Primero intentar obtener desde Supabase (más confiable)
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.access_token) {
      // Actualizar localStorage para mantener sincronización
      if (typeof window !== 'undefined') {
        localStorage.setItem('sb-access-token', session.access_token);
      }
      return session.access_token;
    }

    // Fallback a localStorage (por compatibilidad)
    if (typeof window !== 'undefined') {
      const localToken = localStorage.getItem('sb-access-token');
      if (localToken) {
        return localToken;
      }
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo access token:', error);

    // Último recurso: localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sb-access-token');
    }

    return null;
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getCurrentAccessToken();
  return token !== null;
}

/**
 * Versión síncrona para obtener el token desde localStorage (para uso rápido)
 * Nota: Usa getCurrentAccessToken() para resultados más precisos
 */
export function getAccessTokenSync(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('sb-access-token');
  }
  return null;
}
