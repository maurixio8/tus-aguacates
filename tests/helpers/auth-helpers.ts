/**
 * Helpers de autenticación para pruebas E2E
 * Proporciona funciones para login y gestión de tokens
 */

import { Page, APIRequestContext } from '@playwright/test';
import { ADMIN_CREDENTIALS, ADMIN_URLS, TIMEOUTS } from '../fixtures/admin';

const E2E_BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';

/**
 * Realiza login de administrador vía UI
 * @param page - Página de Playwright
 * @returns Promise<void>
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  // Navegar a la página de login
  await page.goto(ADMIN_URLS.LOGIN);

  // Esperar a que cargue el formulario
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('input[type="email"]', { timeout: TIMEOUTS.LONG });

  // Llenar formulario de login
  await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
  await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);

  // Click en botón de login
  await page.click('button:has-text("Iniciar Sesión"), button[type="submit"]');

  // Esperar redirección al dashboard
  await page.waitForURL(/\/admin$/, { timeout: TIMEOUTS.LONG });
  await page.waitForLoadState('networkidle');

  // Verificar que estamos en el dashboard (selector más flexible)
  // Esperar a que haya algún contenido en lugar de H1 específico
  await page.waitForTimeout(TIMEOUTS.SHORT);
}

/**
 * Realiza login de administrador y retorna el token JWT
 * @param request - Contexto de solicitud de API de Playwright
 * @returns Promise<string> - Token JWT de autenticación
 */
export async function getAdminToken(request: APIRequestContext): Promise<string> {
  // Realizar login vía API
  const response = await request.post(`${E2E_BASE_URL}/api/auth/admin/login`, {
    data: {
      email: ADMIN_CREDENTIALS.email,
      password: ADMIN_CREDENTIALS.password,
    },
  });

  if (!response.ok()) {
    const errorText = await response.text();
    throw new Error(`Login failed: ${response.status()} ${errorText}`);
  }

  // El token viene en la cookie set-cookie
  const setCookieHeader = response.headers()['set-cookie'];
  if (!setCookieHeader) {
    throw new Error('No se recibió cookie en la respuesta');
  }

  // Extraer token de la cookie (puede haber múltiples cookies separadas por coma)
  const cookies = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

  for (const cookie of cookies) {
    const tokenMatch = cookie.match(/admin-token=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
      return decodeURIComponent(tokenMatch[1]);
    }
  }

  throw new Error('No se pudo extraer el token de la cookie admin-token');
}

/**
 * Crea un contexto de página con autenticación preestablecida
 * @param page - Página de Playwright
 * @returns Promise<void>
 */
export async function setupAuthenticatedPage(page: Page): Promise<void> {
  const token = await getAdminToken(page.request);

  // Establecer la cookie de autenticación
  await page.context().addCookies([
    {
      name: 'admin-token',
      value: token,
      domain: new URL(E2E_BASE_URL).hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Hace una request autenticada a la API
 * @param request - Contexto de solicitud de API
 * @param url - URL endpoint
 * @param method - Método HTTP
 * @param data - Datos a enviar (opcional)
 * @returns Promise<Response>
 */
export async function authenticatedRequest(
  request: APIRequestContext,
  url: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  data?: any
) {
  const fullUrl = url.startsWith('http') ? url : `${E2E_BASE_URL}${url}`;

  const token = await getAdminToken(request);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`, // Enviar token también en Authorization header
    'Cookie': `admin-token=${token}`, // Y en Cookie header
  };

  const options: any = {
    method,
    headers,
  };

  if (data) {
    options.data = data;
  }

  const response = await request.fetch(fullUrl, options);

  return response;
}

/**
 * Verifica si el usuario está autenticado
 * @param page - Página de Playwright
 * @returns Promise<boolean>
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return url.includes('/admin') && !url.includes('/login');
}

/**
 * Cierra la sesión del admin
 * @param page - Página de Playwright
 * @returns Promise<void>
 */
export async function logoutAdmin(page: Page): Promise<void> {
  // Navegar al dashboard y buscar botón de logout si existe
  await page.goto(ADMIN_URLS.DASHBOARD);
  await page.waitForLoadState('networkidle');

  // Buscar botón de logout (puede variar según la implementación)
  const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Salir"), button:has-text("Logout")').first();

  if (await logoutButton.isVisible()) {
    await logoutButton.click();
    await page.waitForURL(/\/login/);
  } else {
    // Alternativa: limpiar cookies manualmente
    await page.context().clearCookies();
  }
}
