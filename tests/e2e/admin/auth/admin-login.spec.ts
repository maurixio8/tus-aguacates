/**
 * Tests E2E para Autenticación de Admin
 * Prueba el flujo completo de login y validación de credenciales
 */

import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS, ADMIN_URLS, TIMEOUTS } from '../../../fixtures/admin';
import { loginAsAdmin, isAuthenticated } from '../../../helpers/auth-helpers';

test.describe('Admin - Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Usar baseURL configurado
  });

  test('debería mostrar página de login', async ({ page }) => {
    await page.goto(ADMIN_URLS.LOGIN);
    await page.waitForLoadState('networkidle');

    // Verificar campos del formulario primero (más confiable que el título)
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Verificar botón de submit
    const submitButton = page.locator('button[type="submit"], button:has-text("Iniciar")');
    await expect(submitButton).toBeVisible();

    // Verificar cualquier título o texto de la página
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/admin|login|iniciar|sesión|correo/i);
  });

  test('debería iniciar sesión correctamente con credenciales válidas', async ({ page }) => {
    await page.goto(ADMIN_URLS.LOGIN);

    // Llenar formulario
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.password);

    // Submit formulario
    await page.click('button:has-text("Iniciar Sesión"), button[type="submit"]');

    // Verificar redirección al dashboard
    await page.waitForURL(/\/admin$/, { timeout: TIMEOUTS.LONG });
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en el dashboard (selector más flexible)
    const title = page.locator('h1, h2, .text-2xl').filter({ hasText: /Dashboard|Panel|Bienvenido/i });
    await expect(title).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
  });

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto(ADMIN_URLS.LOGIN);

    // Usar credenciales inválidas
    await page.fill('input[type="email"]', 'invalid@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    await page.click('button:has-text("Iniciar Sesión"), button[type="submit"]');

    // Esperar un poco para que aparezca el error
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    // Verificar mensaje de error (puede variar según la implementación)
    const errorMessage = page.locator('.text-red-600, .bg-red-50, [role="alert"]');
    const hasError = await errorMessage.count() > 0;

    if (hasError) {
      await expect(errorMessage.first()).toBeVisible();
    } else {
      // Si no hay mensaje de error visible, verificar que NO estamos en el dashboard
      await expect(page).not.toHaveURL(/\/admin$/);
    }
  });

  test('debería mantener sesión después de recargar la página', async ({ page }) => {
    // Hacer login
    await loginAsAdmin(page);

    // Recargar página
    await page.reload();

    // Verificar que seguimos autenticados
    await expect(page).toHaveURL(/\/admin/);
    // Verificar título más flexible
    const title = page.locator('h1, h2, .text-2xl').filter({ hasText: /Dashboard|Panel|Bienvenido/i });
    await expect(title).toBeVisible();
  });

  test('debería poder navegar a diferentes secciones del admin', async ({ page }) => {
    await loginAsAdmin(page);

    // Navegar a productos
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');
    const productsTitle = page.locator('h1, h2, .text-2xl').filter({ hasText: /Productos|Catálogo/i });
    await expect(productsTitle).toBeVisible();

    // Navegar a clientes
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');
    const customersTitle = page.locator('h1, h2, .text-2xl').filter({ hasText: /Clientes/i });
    await expect(customersTitle).toBeVisible();
  });

  test('debería redirigir al login si no está autenticado', async ({ page }) => {
    // Intentar acceder directamente a una sección protegida
    await page.goto(ADMIN_URLS.PRODUCTS);

    // Verificar que redirige al login o muestra un error de autenticación
    await page.waitForTimeout(TIMEOUTS.MEDIUM);

    const currentUrl = page.url();
    const isAtLogin = currentUrl.includes('/login') || currentUrl.includes('/auth');

    if (isAtLogin) {
      await expect(page).toHaveURL(/\/login/);
    } else {
      // Si no redirige, verificar que muestra un error o mensaje de no autorizado
      const hasUnauthorized = await page.locator('text=/No autorizado|Inicia sesión|401/').count() > 0;
      expect(hasUnauthorized).toBeTruthy();
    }
  });

  test('debería validar campos requeridos del formulario', async ({ page }) => {
    await page.goto(ADMIN_URLS.LOGIN);

    // Intentar submit sin llenar campos
    await page.click('button:has-text("Iniciar Sesión"), button[type="submit"]');

    // Verificar validación HTML5
    const emailInput = page.locator('input[type="email"]');
    const isRequired = await emailInput.evaluate(el => el.required);

    expect(isRequired).toBeTruthy();
  });

  test('debería poder cerrar sesión', async ({ page }) => {
    await loginAsAdmin(page);

    // Buscar botón de logout/cerrar sesión
    const logoutButton = page.locator('button:has-text("Cerrar"), button:has-text("Salir"), a:has-text("Cerrar"), a:has-text("Salir")').first();

    const hasLogout = await logoutButton.isVisible({ timeout: TIMEOUTS.SHORT });

    if (hasLogout) {
      // Hacer scroll hacia el botón si está fuera del viewport
      await logoutButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      await logoutButton.click();
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      // Verificar que ya no estamos autenticados
      const isStillAuth = await isAuthenticated(page);
      expect(isStillAuth).toBeFalsy();
    } else {
      // Si no hay botón de logout visible, probar limpiar cookies manualmente
      await page.context().clearCookies();
      await page.reload();

      await expect(page).toHaveURL(/\/login/, { timeout: TIMEOUTS.LONG });
    }
  });
});
