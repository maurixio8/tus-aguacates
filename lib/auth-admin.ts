import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

// Interfaces para TypeScript
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'viewer';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

// Cliente de Supabase para server-side
export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Usar service role para operaciones de servidor
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}


// Verificar si un usuario es administrador
export async function verifyAdminUser(supabase: any, userId: string): Promise<AuthResult> {
  try {
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return {
        success: false,
        error: 'Usuario administrador no encontrado o inactivo'
      };
    }

    return {
      success: true,
      user: adminUser
    };
  } catch (error) {
    console.error('Error verifying admin user:', error);
    return {
      success: false,
      error: 'Error al verificar usuario administrador'
    };
  }
}

// Autenticar administrador con email y contraseña
export async function authenticateAdmin(
  supabase: any,
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Buscar usuario en admin_users
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);

    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Credenciales inválidas'
      };
    }

    return {
      success: true,
      user: adminUser
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Error interno del servidor'
    };
  }
}

// Registrar actividad de administrador
export async function logAdminActivity(
  supabase: any,
  adminId: string,
  action: string,
  tableName?: string,
  recordId?: string,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_activity_log')
      .insert({
        admin_id: adminId,
        action,
        table_name: tableName,
        record_id: recordId,
        old_values: oldValues,
        new_values: newValues,
        ip_address: ipAddress,
        user_agent: userAgent
      });

    return !error;
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return false;
  }
}

// Obtener usuario actual autenticado desde token JWT
export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('admin-token')?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as any;

    if (decoded.type !== 'admin') {
      return null;
    }

    // Obtener datos actualizados del usuario desde la base de datos
    const supabase = createSupabaseClient();
    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', decoded.id)
      .eq('is_active', true)
      .single();

    if (error || !adminUser) {
      return null;
    }

    return adminUser;
  } catch (error) {
    console.error('Error getting current admin user:', error);
    return null;
  }
}

// Verificar si el usuario tiene permisos específicos
export function hasPermission(user: AdminUser, requiredRole: 'admin' | 'super_admin' | 'viewer'): boolean {
  const roleHierarchy = {
    viewer: 1,
    admin: 2,
    super_admin: 3
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

// Crear hash de contraseña
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Verificar contraseña
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Actualizar último login
export async function updateLastLogin(supabase: any, adminId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminId);

    return !error;
  } catch (error) {
    console.error('Error updating last login:', error);
    return false;
  }
}

// Obtener lista de actividades recientes
export async function getRecentActivities(
  supabase: any,
  limit: number = 50
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select(`
        *,
        admin_users!inner(email, name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent activities:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return [];
  }
}