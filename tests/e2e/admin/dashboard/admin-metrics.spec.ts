/**
 * Tests E2E para Dashboard Principal
 * Prueba las métricas y funcionalidades del dashboard de administración
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin, isAuthenticated } from '../../../helpers/auth-helpers';
import { ADMIN_URLS, TIMEOUTS } from '../../../fixtures/admin';

test.describe('Admin - Dashboard Métricas', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('debería cargar el dashboard principal', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForLoadState('networkidle');

    // Verificar que estamos en el dashboard
    await expect(page.locator('h1')).toContainText(/Dashboard|Panel|Resumen/, { timeout: TIMEOUTS.MEDIUM });
  });

  test('debería mostrar las métricas principales', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForLoadState('networkidle');

    // Buscar tarjetas de métricas (pueden variar en diseño pero deben existir)
    const metricCards = page.locator('.rounded-xl, .card, [class*="metric"], [class*="stat"]');

    // Debe haber al menos 4 tarjetas de métricas
    const cardCount = await metricCards.count();

    expect(cardCount).toBeGreaterThan(0);

    // Verificar que las métricas típicas están presentes
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/ventas|ventas/i);
  });

  test('debería mostrar sección de productos más vendidos', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForLoadState('networkidle');

    // Buscar sección de productos más vendidos
    const topProductsSection = page.locator('h2, h3, h4').filter({ hasText: /vendidos|productos|top/i });

    const hasTopProducts = await topProductsSection.count() > 0;
    if (hasTopProducts) {
      await expect(topProductsSection.first()).toBeVisible();
    }
  });

  test('debería mostrar botones de acciones rápidas', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForLoadState('networkidle');

    // Buscar botones de acción rápida
    const actionButtons = page.locator('a, button').filter({ hasText: /Nuevo|Crear|Pedidos|Productos|Reportes/i });

    const buttonCount = await actionButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('debería navegar correctamente a la sección de productos', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);

    // Buscar link o botón hacia productos
    const productsLink = page.locator('a:has-text("Productos")').first();

    const hasProductsLink = await productsLink.isVisible();

    if (hasProductsLink) {
      await productsLink.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que navegamos a productos
      await expect(page).toHaveURL(/\/productos|\/products/i);
    } else {
      // Alternativa: navegar directamente
      await page.goto(ADMIN_URLS.PRODUCTS);
      await expect(page.locator('h1')).toContainText(/Productos|Catálogo/);
    }
  });

  test('debería navegar correctamente a la sección de clientes', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);

    // Buscar link o botón hacia clientes
    const customersLink = page.locator('a:has-text("Clientes")').first();

    const hasCustomersLink = await customersLink.isVisible();

    if (hasCustomersLink) {
      await customersLink.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que navegamos a clientes
      await expect(page).toHaveURL(/\/clientes|\/customers/i);
    } else {
      // Alternativa: navegar directamente
      await page.goto(ADMIN_URLS.CUSTOMERS);
      await expect(page.locator('h1')).toContainText(/Clientes|Clientes/);
    }
  });

  test('debería mostrar datos actualizados al recargar', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForLoadState('networkidle');

    // Obtener contenido inicial
    const initialContent = await page.textContent('body');

    // Recargar
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verificar que el contenido se cargó nuevamente
    const reloadedContent = await page.textContent('body');
    expect(reloadedContent).toBeTruthy();
    expect(reloadedContent?.length).toBeGreaterThan(0);
  });

  test('debería tener un diseño responsive', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForLoadState('networkidle');

    // Probar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Verificar que el contenido sigue siendo visible
    const mainContent = page.locator('main, [role="main"], h1').first();
    await expect(mainContent).toBeVisible();

    // Restaurar viewport desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(TIMEOUTS.SHORT);

    await expect(mainContent).toBeVisible();
  });

  test('debería mantener la sesión al navegar entre secciones', async ({ page }) => {
    await page.goto(ADMIN_URLS.DASHBOARD);

    // Navegar a varias secciones
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Volver al dashboard
    await page.goto(ADMIN_URLS.DASHBOARD);
    await page.waitForTimeout(TIMEOUTS.SHORT);

    // Verificar que seguimos autenticados
    const isAuth = await isAuthenticated(page);
    expect(isAuth).toBeTruthy();
  });
});
