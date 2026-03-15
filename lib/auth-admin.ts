import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'viewer';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  password_hash?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
}

const ADMIN_TOKEN_COOKIE_NAME = 'admin-token';
const ADMIN_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24;
const DEFAULT_ADMIN_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
];

function cleanEnvValue(value?: string): string {
  return (value || '').replace(/\\n/g, '').replace(/\\r/g, '').trim();
}

function getRequiredEnv(name: string): string {
  const value = cleanEnvValue(process.env[name]);
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

function getJwtSecret(): string {
  return getRequiredEnv('JWT_SECRET');
}

function getSupabaseUrl(): string {
  return getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL');
}

function getSupabaseServiceRoleKey(): string {
  return getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
}

function getAllowedAdminOrigins(request?: NextRequest): string[] {
  const configuredOrigins = cleanEnvValue(process.env.ADMIN_ALLOWED_ORIGINS)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const requestOrigin = request ? new URL(request.url).origin : null;

  return Array.from(
    new Set(
      [...DEFAULT_ADMIN_ALLOWED_ORIGINS, ...configuredOrigins, requestOrigin]
        .filter((origin): origin is string => Boolean(origin))
    )
  );
}

export function getAdminCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigins = new Set(getAllowedAdminOrigins(request));
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-admin-token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  return headers;
}

export function getAdminCookieOptions(request: NextRequest) {
  const url = new URL(request.url);
  const isSecure = url.protocol === 'https:';
  const isLocalHost = ['localhost', '127.0.0.1'].includes(url.hostname);

  return {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax' as const,
    maxAge: ADMIN_TOKEN_MAX_AGE_SECONDS,
    path: '/',
    ...(isSecure && !isLocalHost ? { domain: url.hostname } : {}),
  };
}

function extractAdminToken(request: NextRequest): string | null {
  const cookieToken =
    request.cookies.get(ADMIN_TOKEN_COOKIE_NAME)?.value ||
    request.cookies.get('admin_token')?.value;

  if (cookieToken) {
    return cookieToken;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  return request.headers.get('x-admin-token');
}

export function createSupabaseClient() {
  return createClient(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function verifyAdminUser(
  supabase: ReturnType<typeof createSupabaseClient>,
  userId: string
): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Usuario administrador no encontrado o inactivo',
      };
    }

    return {
      success: true,
      user: data,
    };
  } catch (error) {
    console.error('Error verifying admin user:', error);
    return {
      success: false,
      error: 'Error al verificar usuario administrador',
    };
  }
}

export async function authenticateAdmin(
  supabase: ReturnType<typeof createSupabaseClient>,
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    const { data: adminUser, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('is_active', true)
      .single();

    if (error || !adminUser?.password_hash) {
      return {
        success: false,
        error: 'Credenciales inválidas',
      };
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password_hash);
    if (!isPasswordValid) {
      return {
        success: false,
        error: 'Credenciales inválidas',
      };
    }

    return {
      success: true,
      user: adminUser,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Error interno del servidor',
    };
  }
}

export function createAdminToken(user: Pick<AdminUser, 'id' | 'email' | 'role'>): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: 'admin',
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: ADMIN_TOKEN_MAX_AGE_SECONDS }
  );
}

export async function logAdminActivity(
  supabase: ReturnType<typeof createSupabaseClient>,
  adminId: string,
  action: string,
  tableName?: string,
  recordId?: string,
  oldValues?: unknown,
  newValues?: unknown,
  ipAddress?: string,
  userAgent?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.from('admin_activity_log').insert({
      admin_id: adminId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    return !error;
  } catch (error) {
    console.error('Error logging admin activity:', error);
    return false;
  }
}

export async function getCurrentAdminUser(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get(ADMIN_TOKEN_COOKIE_NAME)?.value ||
      cookieStore.get('admin_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & {
      id?: string;
      type?: string;
    };

    if (decoded.type !== 'admin' || !decoded.id) {
      return null;
    }

    const supabase = createSupabaseClient();
    const result = await verifyAdminUser(supabase, decoded.id);
    return result.success ? result.user || null : null;
  } catch (error) {
    console.error('Error getting current admin user:', error);
    return null;
  }
}

export async function verifyAdminAuth(
  request: NextRequest
): Promise<{ success: boolean; adminId?: string; error?: string; user?: AdminUser }> {
  try {
    const token = extractAdminToken(request);
    if (!token) {
      return { success: false, error: 'No autenticado' };
    }

    const decoded = jwt.verify(token, getJwtSecret()) as jwt.JwtPayload & {
      id?: string;
      type?: string;
    };

    if (decoded.type !== 'admin' || !decoded.id) {
      return { success: false, error: 'Token no válido para administrador' };
    }

    const supabase = createSupabaseClient();
    const result = await verifyAdminUser(supabase, decoded.id);

    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'No autorizado' };
    }

    return {
      success: true,
      adminId: result.user.id,
      user: result.user,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expirado' };
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Token inválido' };
    }

    console.error('Error verifying admin auth:', error);
    return { success: false, error: 'Error de autenticación' };
  }
}

export function hasPermission(
  user: AdminUser,
  requiredRole: 'admin' | 'super_admin' | 'viewer'
): boolean {
  const roleHierarchy = {
    viewer: 1,
    admin: 2,
    super_admin: 3,
  };

  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function updateLastLogin(
  supabase: ReturnType<typeof createSupabaseClient>,
  adminId: string
): Promise<boolean> {
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

export async function getRecentActivities(
  supabase: ReturnType<typeof createSupabaseClient>,
  limit = 50
): Promise<unknown[]> {
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
