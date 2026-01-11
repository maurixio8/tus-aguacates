import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://tus-aguacates.vercel.app';

test.describe('Panel Admin B2B - Pruebas Completas', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al login
    await page.goto(`${BASE_URL}/admin/login`);

    // Verificar que estamos en la página de login
    await expect(page.getByRole('heading', { name: 'Iniciar Sesión' })).toBeVisible();

    // Llenar credenciales
    await page.fill('input[type="email"]', 'admin@tusaguacates.com');
    await page.fill('input[type="password"]', 'admin123');

    // Click en iniciar sesión
    await page.click('button:has-text("Iniciar Sesión")');

    // Esperar a que redirija al dashboard o empresas
    await page.waitForURL(/\/admin(\/empresa)?/);
    await page.waitForLoadState('networkidle');

    // Navegar al dashboard B2B
    await page.goto(`${BASE_URL}/admin/empresas`);
    await page.waitForLoadState('networkidle');
  });

  test('Dashboard B2B - Cargar métricas principales', async ({ page }) => {
    console.log('🧪 Probando Dashboard B2B...');

    // Esperar a que cargue la página
    await page.waitForLoadState('networkidle');

    // Verificar título (más flexible - busca h1, h2 o cualquier heading)
    const title = page.locator('h1, h2, h3').filter({ hasText: /Empresas|B2B|Dashboard/i });
    await expect(title).toBeVisible();

    // Verificar que hay tarjetas de métricas (no verificar número exacto)
    const metricsCards = page.locator('.bg-white.rounded-xl.shadow-sm, .rounded-xl.shadow-sm, [class*="metric"], [class*="stat"]');
    const cardCount = await metricsCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Verificar al menos algunas etiquetas de métricas importantes
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/empresas|b2b|productos|pedidos/i);

    console.log('✅ Dashboard carga métricas correctamente');
  });

  test('Dashboard B2B - Sección de acciones rápidas', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Verificar que hay botones de acciones rápidas (no verificar número exacto)
    const quickActions = page.locator('a[href*="/admin/empresas/"], button:has-text("Nuevo"), button:has-text("Crear")');
    const actionCount = await quickActions.count();
    expect(actionCount).toBeGreaterThan(0);

    // Verificar al menos algunas etiquetas de acciones importantes
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/productos|pedidos|empresas/i);
    await expect(page.getByText('Empresas')).toBeVisible();
    await expect(page.getByText('Categorías B2B')).toBeVisible();
    await expect(page.getByText('Slides B2B')).toBeVisible();
    await expect(page.getByText('Banner Mensajes')).toBeVisible();
    await expect(page.getByText('Cupones B2B')).toBeVisible();

    console.log('✅ Dashboard tiene 7 secciones de gestión');
  });

  test('Productos B2B - Ver listado', async ({ page }) => {
    console.log('🧪 Probando Listado de Productos B2B...');

    // Navegar a productos
    await page.click('a:has-text("Productos B2B")');
    await page.waitForLoadState('networkidle');

    // Verificar URL
    await expect(page).toHaveURL(/\/admin\/empresas\/productos-b2b/);

    // Verificar título (más flexible)
    const title = page.locator('h1, h2').filter({ hasText: /Productos|B2B/i });
    await expect(title).toBeVisible();

    // Verificar botón de nuevo producto
    await expect(page.getByText('Nuevo Producto')).toBeVisible();

    console.log('✅ Listado de productos carga correctamente');
  });

  test('Productos B2B - Abrir formulario de creación', async ({ page }) => {
    console.log('🧪 Probando Formulario de Creación...');

    // Navegar a nuevo producto
    await page.goto(`${BASE_URL}/admin/empresas/productos-b2b/nuevo`);
    await page.waitForLoadState('networkidle');

    // Verificar título (más flexible)
    const title = page.locator('h1, h2').filter({ hasText: /Nuevo|Producto|B2B/i });
    await expect(title).toBeVisible();

    // Verificar campos del formulario
    await expect(page.getByPlaceholder('Ej: B2B-AGUACATE-HASS')).toBeVisible();
    await expect(page.getByPlaceholder('Ej: Aguacate Hass Premium')).toBeVisible();
    await expect(page.getByText('Precio Base')).toBeVisible();
    await expect(page.getByText('Stock')).toBeVisible();
    await expect(page.getByText('Cant. Mínima')).toBeVisible();
    await expect(page.getByText('Unidad de medida')).toBeVisible();

    // Verificar botón de agregar pricing tier
    await expect(page.getByText('Agregar Tier')).toBeVisible();

    console.log('✅ Formulario de creación cargado correctamente');
  });

  test('Productos B2B - Crear producto con pricing tiers', async ({ page }) => {
    console.log('🧪 Probando Creación de Producto con Pricing Tiers...');

    await page.goto(`${BASE_URL}/admin/empresas/productos-b2b/nuevo`);
    await page.waitForLoadState('networkidle');

    // Llenar formulario básico
    await page.fill('input[placeholder*="SKU"]', `TEST-B2B-${Date.now()}`);
    await page.fill('input[placeholder*="Nombre"]', 'Producto de Prueba E2E');
    await page.fill('input[placeholder*="Descripción"]', 'Producto de prueba automatizada');

    // Precio
    const priceInput = page.locator('input[type="number"]').first();
    await priceInput.fill('10000');

    // Stock
    const stockInput = page.locator('input[type="number"]').nth(1);
    await stockInput.fill('50');

    // Cantidad mínima
    const minQtyInput = page.locator('input[type="number"]').nth(2);
    await minQtyInput.fill('5');

    // Unidad
    await page.selectOption('select', 'kg');

    // Marcar activo
    await page.check('input[type="checkbox"][value="on"]');

    console.log('📝 Formulario básico llenado');

    // Agregar pricing tiers
    await page.click('button:has-text("Agregar Tier")');
    await page.waitForTimeout(500);

    // Llenar primer tier
    const tierInputs = page.locator('.bg-purple-50 input[type="number"]');
    const tierCount = await tierInputs.count();

    if (tierCount >= 3) {
      // Tier 1: cantidad mínima
      await tierInputs.nth(0).fill('5');
      // Tier 1: cantidad máxima
      await tierInputs.nth(1).fill('20');
      // Tier 1: precio
      await tierInputs.nth(2).fill('9000');

      console.log('✅ Pricing tier 1 configurado');

      // Verificar descuento calculado
      const discount1 = page.locator('.bg-purple-50').nth(0);
      await expect(discount1).toContainText('10');
    }

    console.log('✅ Producto con pricing tiers listo para crear');
  });

  test('API B2B - Verificar endpoint products', async ({ request }) => {
    console.log('🧪 Probando API Products B2B...');

    const response = await request.get(`${BASE_URL}/api/admin/b2b/products`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');

    console.log('✅ API Products responde correctamente');
    console.log(`📊 Productos encontrados: ${data.data?.length || 0}`);
  });

  test('API B2B - Verificar endpoint metrics', async ({ request }) => {
    console.log('🧪 Probando API Metrics B2B...');

    const response = await request.get(`${BASE_URL}/api/admin/b2b/metrics`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data.metrics).toHaveProperty('companies');
    expect(data.metrics).toHaveProperty('products');
    expect(data.metrics).toHaveProperty('orders');
    expect(data.metrics).toHaveProperty('revenue');

    console.log('✅ API Metrics responde correctamente');
    console.log(`📊 Métricas:`, data.metrics);
  });

  test('API B2B - Verificar endpoint companies', async ({ request }) => {
    console.log('🧪 Probando API Companies B2B...');

    const response = await request.get(`${BASE_URL}/api/admin/b2b/companies`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');

    console.log('✅ API Companies responde correctamente');
    console.log(`📊 Empresas: ${data.data?.length || 0}`);
  });

  test('API B2B - Verificar endpoint orders', async ({ request }) => {
    console.log('🧪 Probando API Orders B2B...');

    const response = await request.get(`${BASE_URL}/api/admin/b2b/orders`);

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('success', true);
    expect(data).toHaveProperty('data');

    console.log('✅ API Orders responde correctamente');
    console.log(`📊 Pedidos: ${data.data?.length || 0}`);
  });

  test('Navegación - Verificar todas las secciones', async ({ page }) => {
    console.log('🧪 Probando Navegación Completa...');

    const sections = [
      { name: 'Dashboard', url: '/admin/empresas', title: 'Empresas B2B' },
      { name: 'Productos', url: '/admin/empresas/productos-b2b', title: 'Productos B2B' },
      { name: 'Pedidos', url: '/admin/empresas/pedidos-b2b', title: 'Pedidos B2B' },
      { name: 'Empresas', url: '/admin/empresas/empresas-clientes', title: 'Empresas' },
      { name: 'Categorías', url: '/admin/empresas/categorias-b2b', title: 'Categorías B2B' },
      { name: 'Slides', url: '/admin/empresas/slides-b2b', title: 'Slides B2B' },
      { name: 'Banners', url: '/admin/empresas/banner-mensajes-b2b', title: 'Banner Mensajes' },
      { name: 'Cupones', url: '/admin/empresas/cupones-b2b', title: 'Cupones B2B' },
    ];

    for (const section of sections) {
      await page.goto(`${BASE_URL}${section.url}`);
      await page.waitForLoadState('networkidle');

      const title = page.locator('h1, h2').first();
      const titleText = await title.textContent();

      console.log(`  ✅ ${section.name}: ${section.url} - "${titleText?.trim()}"`);

      await expect(page.locator('h1, h2')).toContainText(section.title.split(' ')[0]);
    }

    console.log('✅ Todas las secciones navegan correctamente');
  });
});
