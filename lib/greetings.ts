import { User } from '@supabase/supabase-js';
import { Profile } from './supabase';

/**
 * Genera un saludo contextual basado en la hora del día
 * @returns {string} Saludo contextual (Buenos días, Buenas tardes, Buenas noches)
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 12) {
    return 'Buenos días';
  } else if (hour >= 12 && hour < 18) {
    return 'Buenas tardes';
  } else {
    return 'Buenas noches';
  }
}

/**
 * Extrae el nombre para mostrar del perfil del usuario con lógica de fallback inteligente
 * Orden de prioridad:
 * 1. preferred_name (si está disponible)
 * 2. full_name (si está disponible)
 * 3. Primer nombre del email (como último recurso)
 * @param profile - Perfil del usuario
 * @param user - Usuario de Supabase (para fallback a email)
 * @returns {string} Nombre para mostrar
 */
export function getDisplayName(profile: Profile | null, user: User | null): string {
  // Si no hay usuario, retornar vacío
  if (!user) return '';
  
  // 1. Usar preferred_name si está disponible
  if (profile?.preferred_name && profile.preferred_name.trim()) {
    return profile.preferred_name.trim();
  }
  
  // 2. Usar full_name si está disponible
  if (profile?.full_name && profile.full_name.trim()) {
    // Extraer solo el primer nombre
    const firstName = profile.full_name.trim().split(' ')[0];
    return firstName;
  }
  
  // 3. Usar el email como último recurso
  if (user.email) {
    const emailName = user.email.split('@')[0];
    // Capitalizar primera letra
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  
  return '';
}

/**
 * Genera un saludo personalizado completo
 * @param profile - Perfil del usuario
 * @param user - Usuario de Supabase
 * @param options - Opciones adicionales
 * @returns {string} Saludo personalizado completo
 */
export function getPersonalizedGreeting(
  profile: Profile | null, 
  user: User | null,
  options: {
    includeTimeGreeting?: boolean;
    includeWelcome?: boolean;
    customMessage?: string;
  } = {}
): string {
  const { includeTimeGreeting = true, includeWelcome = false, customMessage } = options;
  const displayName = getDisplayName(profile, user);
  
  // Si no hay nombre para mostrar, retornar saludo genérico
  if (!displayName) {
    if (customMessage) return customMessage;
    if (includeWelcome) return '¡Bienvenido a Tus Aguacates!';
    return getTimeBasedGreeting();
  }
  
  const parts: string[] = [];
  
  // Agregar saludo contextual según hora
  if (includeTimeGreeting) {
    parts.push(getTimeBasedGreeting());
  }
  
  // Agregar nombre
  parts.push(displayName);
  
  // Agregar mensaje de bienvenida si se solicita
  if (includeWelcome) {
    parts.push('¡Bienvenido de vuelta a Tus Aguacates!');
  }
  
  // Usar mensaje personalizado si se proporciona
  if (customMessage) {
    parts.push(customMessage);
  }
  
  return parts.join(', ');
}

/**
 * Genera un saludo simple para el header
 * @param profile - Perfil del usuario
 * @param user - Usuario de Supabase
 * @returns {string} Saludo simple para header
 */
export function getHeaderGreeting(profile: Profile | null, user: User | null): string {
  const displayName = getDisplayName(profile, user);
  return displayName ? `Hola, ${displayName}` : 'Hola';
}

/**
 * Genera un saludo completo para el dashboard/hero section
 * @param profile - Perfil del usuario
 * @param user - Usuario de Supabase
 * @returns {string} Saludo completo para dashboard
 */
export function getDashboardGreeting(profile: Profile | null, user: User | null): string {
  return getPersonalizedGreeting(profile, user, {
    includeTimeGreeting: true,
    includeWelcome: true
  });
}

/**
 * Genera un saludo para mensajes de bienvenida en emails o notificaciones
 * @param profile - Perfil del usuario
 * @param user - Usuario de Supabase
 * @returns {string} Saludo para mensajes
 */
export function getMessageGreeting(profile: Profile | null, user: User | null): string {
  const displayName = getDisplayName(profile, user);
  return displayName ? `Hola ${displayName},` : 'Hola,';
}