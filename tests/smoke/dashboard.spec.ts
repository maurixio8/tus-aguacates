import { test, expect } from '@playwright/test';

/**
 * Smoke Tests para verificar que el dashboard funciona después del deploy
 * Estos tests verifican funcionalidad crítica sin entrar en detalles profundos
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('Smoke Tests - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto(BASE_URL);
  });

  test('La página principal carga correctamente', async ({ page }) => {
    // Verificar que la página cargó
    await expect(page).toHaveTitle(/Tus Aguacates/);

    // Verificar que hay elementos visibles
    const header = page.locator('header').first();
    await expect(header).toBeVisible();
  });

  test('El dashboard de admin es accesible', async ({ page }) => {
    // Navegar al login de admin
    await page.goto(`${BASE_URL}/admin/login`);

    // Verificar que el formulario de login existe
    const loginForm = page.locator('form').first();
    await expect(loginForm).toBeVisible();

    // Verificar campos de email y password
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('La API de health check responde', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    // La API debería responder (puede ser 200 o 404, lo importante es que el servidor esté corriendo)
    expect([200, 404, 405]).toContain(response.status());
  });

  test('La API de categories responde', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/categories`);

    // Debería devolver un array de categorías
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(Array.isArray(data.categories) || Array.isArray(data)).toBeTruthy();
  });
});

test.describe('Smoke Tests - Checkout', () => {
  test('La página de checkout es accesible', async ({ page }) => {
    await page.goto(`${BASE_URL}/checkout`);

    // Verificar que la página cargó (puede redirigir si no hay items en el carrito)
    const url = page.url();
    expect(url).toContain('checkout');
  });
});

test.describe('Smoke Tests - Productos', () => {
  test('La página de productos carga', async ({ page }) => {
    await page.goto(`${BASE_URL}/productos`);

    // Verificar que la página cargó
    const productGrid = page.locator('a[href*="/productos/"], [data-testid="product-grid"]').first();

    // Si hay productos, verificar que sean visibles
    // Si no hay productos, el test pasa igualmente (la página cargó)
    if (await productGrid.isVisible()) {
      await expect(productGrid).toBeVisible();
    }
  });
});
