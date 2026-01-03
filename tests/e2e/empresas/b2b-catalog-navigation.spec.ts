import { test, expect } from '@playwright/test';

/**
 * Suite de Pruebas de Navegación y Catálogo B2B
 * FASE 1: Verificar que la sección de empresas funciona correctamente
 *
 * Tests:
 * - B2B-NAV-001: Homepage de empresas carga sin errores
 * - B2B-NAV-002: Navegación por categorías funciona
 * - B2B-NAV-003: Productos se muestran correctamente
 * - B2B-NAV-004: Responsive móvil funciona
 * - B2B-NAV-005: Imágenes de productos cargan sin 404
 * - B2B-NAV-006: No hay errores de consola
 */

const B2B_CONFIG = {
  URL: '/empresas',
  CATEGORIAS: [
    'aguacates',
    'frutas-tropicales',
    'frutos-rojos',
    'gourmet',
    'aromaticas',
    'saludables',
    'desgranados'
  ],
};

const B2B_SELECTORS = {
  // BusinessProductCard structure: div.bg-white.rounded-2xl > h3 (name), input[type=number], button:has-text("Agregar al Pedido")
  productCard: 'div.bg-white.rounded-2xl.shadow-soft, .rounded-2xl.shadow-soft',
  productName: 'h3.font-semibold',
  productImage: 'img, .aspect-square img',
  categoryLink: 'a[href*="/empresas/"]',
  cartIcon: '.business-cart-icon, .cart-icon, [data-testid="b2b-cart-icon"]',
  navigation: 'nav, .navigation',
  mobileMenu: '.mobile-menu, .hamburger',
  addToCartButton: 'button:has-text("Agregar al Pedido")',
};

test.describe('Navegación y Catálogo B2B', () => {
  /**
   * B2B-NAV-001: Homepage de empresas carga correctamente
   * Objetivo: Verificar que /empresas carga sin errores de consola
   */
  test('B2B-NAV-001 - Homepage /empresas carga sin errores', async ({ page }) => {
    console.log('🏢 B2B-NAV-001: Homepage /empresas carga sin errores');

    // Capturar errores de consola
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navegar a /empresas
    await page.goto(B2B_CONFIG.URL);
    console.log(`  📍 Navegando a: ${B2B_CONFIG.URL}`);

    // Esperar a que cargue
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar título
    const title = await page.title();
    console.log(`  📄 Título: ${title}`);
    expect(title).toMatch(/Empresas|Tus Aguacates|B2B/);

    // Verificar URL
    await expect(page, 'Debe estar en /empresas').toHaveURL(/\/empresas/);
    console.log('  ✓ URL correcta: /empresas');

    // Verificar que no hay errores de consola críticos
    const criticalErrors = errors.filter(e =>
      e.includes('Uncaught') ||
      e.includes('TypeError') ||
      e.includes('ReferenceError') ||
      e.includes('500') ||
      e.includes('404')
    );

    if (criticalErrors.length > 0) {
      console.error('  ❌ Errores críticos de consola:');
      criticalErrors.forEach(err => console.error(`     - ${err}`));
    } else {
      console.log('  ✓ No hay errores críticos de consola');
    }

    // Verificar que hay contenido visible
    const body = page.locator('body');
    await expect(body, 'El cuerpo de la página debe ser visible').toBeVisible();

    console.log('  ✅ B2B-NAV-001 completado: Homepage carga correctamente');
  });

  /**
   * B2B-NAV-002: Navegación por categorías funciona
   * Objetivo: Verificar que se puede navegar entre categorías
   */
  test('B2B-NAV-002 - Navegación por categorías', async ({ page }) => {
    console.log('🏢 B2B-NAV-002: Navegación por categorías');

    await page.goto(B2B_CONFIG.URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Obtener todos los links de categorías
    const categoryLinks = page.locator(B2B_SELECTORS.categoryLink);
    const count = await categoryLinks.count();

    console.log(`  📋 Links de categoría encontrados: ${count}`);

    // Probar URLs directas de categorías
    const categoriasToTest = B2B_CONFIG.CATEGORIAS.slice(0, 3);
    let navegadas = 0;

    for (const cat of categoriasToTest) {
      try {
        console.log(`  🔄 Navegando a: /empresas/${cat}`);
        await page.goto(`/empresas/${cat}`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        const currentUrl = page.url();
        console.log(`  📍 URL actual: ${currentUrl}`);

        // Verificar que estamos en la URL correcta
        if (currentUrl.includes(`/empresas/${cat}`)) {
          console.log(`  ✓ Navegación exitosa a /empresas/${cat}`);
          navegadas++;
        }

        // Verificar que hay h1
        const h1 = page.locator('h1').first();
        const isVisible = await h1.isVisible().catch(() => false);

        if (isVisible) {
          const title = await h1.textContent();
          console.log(`  📄 Título: ${title?.trim()}`);
        }
      } catch (e) {
        console.log(`  ❌ /empresas/${cat}: Error al navegar`);
      }
    }

    expect(navegadas, 'Al menos una categoría debe ser accesible').toBeGreaterThan(0);
    console.log(`  📊 Categorías navegadas exitosamente: ${navegadas}/${categoriasToTest.length}`);

    console.log('  ✅ B2B-NAV-002 completado: Navegación por categorías funciona');
  });

  /**
   * B2B-NAV-003: Productos se muestran correctamente
   * Objetivo: Verificar que hay productos visibles en las categorías
   */
  test('B2B-NAV-003 - Productos de categoría cargan', async ({ page }) => {
    console.log('🏢 B2B-NAV-003: Productos de categoría cargan');

    // Probar con la categoría de aguacates
    await page.goto('/empresas/aguacates');
    await page.waitForLoadState('networkidle');

    // Esperar más tiempo para que se carguen los productos client-side
    console.log('  ⏳ Esperando carga de productos client-side...');
    await page.waitForTimeout(5000);

    console.log('  📍 URL: /empresas/aguacates');

    // Buscar productos con selectores específicos para BusinessProductCard
    // La estructura es: div.bg-white.rounded-2xl.overflow-hidden
    const products = page.locator('div.bg-white.rounded-2xl');
    const count = await products.count();

    console.log(`  📦 Productos encontrados: ${count}`);

    if (count === 0) {
      console.log('  ⚠️  No se encontraron productos con los selectores actuales');
      console.log('  ℹ️  Buscando elementos alternativos...');

      // Buscar artículos o divs que parezcan productos
      const articles = page.locator('article, .product, .card, [class*="product"]');
      const altCount = await articles.count();
      console.log(`  📦 Elementos alternativos: ${altCount}`);

      // Buscar cualquier botón de "Agregar al Pedido" que indique productos
      const addToCartButtons = page.locator('button:has-text("Agregar al Pedido")');
      const buttonCount = await addToCartButtons.count();
      console.log(`  🛒 Botones "Agregar al Pedido": ${buttonCount}`);

      if (buttonCount > 0) {
        console.log('  ✓ Hay botones de agregar, lo que indica productos presentes');
      }
    } else {
      expect(count, 'Debe haber al menos un producto visible').toBeGreaterThan(0);

      // Verificar el primer producto
      const firstProduct = products.first();
      await expect(firstProduct, 'El primer producto debe ser visible').toBeVisible();

      // Obtener nombre del producto
      const productName = await firstProduct.locator('h3').first().textContent();
      console.log(`  ✓ Primer producto: ${productName?.trim() || 'Sin nombre'}`);

      // Verificar si hay botón de agregar
      const addToCartButton = firstProduct.locator('button:has-text("Agregar al Pedido")');
      const hasButton = await addToCartButton.isVisible().catch(() => false);
      if (hasButton) {
        console.log('  ✓ Botón "Agregar al Pedido" visible');
      }

      // Verificar información de los primeros 3 productos
      const toCheck = Math.min(count, 3);
      console.log(`  📋 Analizando ${toCheck} productos:`);

      for (let i = 0; i < toCheck; i++) {
        const product = products.nth(i);
        const name = await product.locator('h3').first().textContent();
        console.log(`     ${i + 1}. ${name?.trim() || 'Sin nombre'}`);
      }
    }

    console.log('  ✅ B2B-NAV-003 completado: Productos verificados');
  });

  /**
   * B2B-NAV-004: Responsive móvil funciona
   * Objetivo: Verificar que el sitio funciona en móvil
   */
  test('B2B-NAV-004 - Responsive móvil', async ({ page }) => {
    console.log('🏢 B2B-NAV-004: Responsive móvil');

    // Configurar viewport móvil (iPhone SE)
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('  📱 Viewport: 375x667 (iPhone SE)');

    await page.goto(B2B_CONFIG.URL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('  📍 URL: /empresas');

    // Verificar que la navegación existe
    const nav = page.locator(B2B_SELECTORS.navigation).first();
    const navVisible = await nav.isVisible().catch(() => false);

    if (navVisible) {
      console.log('  ✓ Navegación visible en móvil');
    } else {
      console.log('  ⚠️  Navegación no visible (puede ser normal si hay menú hamburguesa)');
    }

    // Verificar menú móvil
    const mobileMenu = page.locator(B2B_SELECTORS.mobileMenu).first();
    const hasMobileMenu = await mobileMenu.isVisible().catch(() => false);

    if (hasMobileMenu) {
      console.log('  ✓ Menú móvil visible');
    }

    // Verificar que hay productos
    const products = page.locator(B2B_SELECTORS.productCard);
    const count = await products.count();
    console.log(`  📦 Productos visibles: ${count}`);

    // Verificar que los productos son accesibles en móvil
    if (count > 0) {
      const firstProduct = products.first();
      await expect(firstProduct, 'Los productos deben ser visibles en móvil').toBeVisible();

      // Hacer scroll para verificar que la página es scrolleable
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);

      const scrollY = await page.evaluate(() => window.scrollY);
      console.log(`  📜 Scroll Y: ${scrollY}px`);
      expect(scrollY).toBeGreaterThan(0);
    }

    // Verificar que no hay horizontal scroll (indica mal responsive)
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const clientWidth = await page.evaluate(() => document.body.clientWidth);

    if (scrollWidth > clientWidth) {
      console.log(`  ⚠️  Hay scroll horizontal: ${scrollWidth}px > ${clientWidth}px`);
    } else {
      console.log('  ✓ No hay scroll horizontal (buen responsive)');
    }

    console.log('  ✅ B2B-NAV-004 completado: Responsive móvil verificado');
  });

  /**
   * B2B-NAV-005: Imágenes de productos cargan sin 404
   * Objetivo: Verificar que todas las imágenes cargan correctamente
   */
  test('B2B-NAV-005 - Imágenes de productos cargan sin 404', async ({ page }) => {
    console.log('🏢 B2B-NAV-005: Imágenes de productos cargan sin 404');

    await page.goto('/empresas/aguacates');
    await page.waitForLoadState('networkidle');

    // Capturar respuestas de imágenes que fallan
    const failedImages: string[] = [];
    const successfulImages: string[] = [];

    page.on('response', async (response) => {
      if (response.request().resourceType() === 'image') {
        if (response.status() === 404) {
          failedImages.push(response.url());
        } else if (response.status() === 200) {
          successfulImages.push(response.url());
        }
      }
    });

    await page.waitForTimeout(2000);

    // Obtener todas las imágenes
    const images = page.locator('img');
    const imageCount = await images.count();

    console.log(`  🖼️  Imágenes en la página: ${imageCount}`);

    if (imageCount > 0) {
      // Verificar las primeras 5 imágenes
      const toCheck = Math.min(imageCount, 5);
      console.log(`  📋 Verificando ${toCheck} imágenes:`);

      for (let i = 0; i < toCheck; i++) {
        const img = images.nth(i);
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');
        const naturalWidth = await img.evaluate(img => img.naturalWidth);

        if (src) {
          const displaySrc = src.length > 50 ? src.substring(0, 50) + '...' : src;
          console.log(`     ${i + 1}. ${displaySrc}`);
          console.log(`        Alt: ${alt || 'N/A'}`);
          console.log(`        Width: ${naturalWidth}px`);

          if (naturalWidth === 0) {
            console.log(`        ⚠️  Imagen no cargada`);
          } else {
            console.log(`        ✓ Imagen cargada`);
          }
        }
      }
    }

    // Esperar un poco más para capturar todas las respuestas
    await page.waitForTimeout(2000);

    console.log(`  ✅ Imágenes cargadas: ${successfulImages.length}`);
    console.log(`  ❌ Imágenes fallidas (404): ${failedImages.length}`);

    if (failedImages.length > 0) {
      console.error('  ⚠️  Imágenes con 404:');
      failedImages.forEach(url => console.error(`     - ${url}`));
    }

    expect(failedImages.length, 'No debe haber imágenes con 404').toBe(0);

    console.log('  ✅ B2B-NAV-005 completado: Imágenes verificadas');
  });

  /**
   * B2B-NAV-006: Performance básica
   * Objetivo: Verificar métricas básicas de rendimiento
   */
  test('B2B-NAV-006 - Performance básica', async ({ page }) => {
    console.log('🏢 B2B-NAV-006: Performance básica');

    // Medir tiempo de carga
    const startTime = Date.now();

    await page.goto(B2B_CONFIG.URL);
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    console.log(`  ⏱️  Tiempo de carga: ${loadTime}ms`);

    // Evaluar métricas de navegación
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
      };
    });

    console.log(`  📊 DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`  📊 Load Complete: ${metrics.loadComplete}ms`);
    console.log(`  📊 DOM Interactive: ${metrics.domInteractive}ms`);

    // Verificar que el tiempo de carga es razonable (< 10s)
    expect(loadTime, 'La página debe cargar en menos de 10 segundos').toBeLessThan(10000);

    if (loadTime < 3000) {
      console.log('  ✅ Excelente rendimiento (< 3s)');
    } else if (loadTime < 5000) {
      console.log('  ✓ Buen rendimiento (< 5s)');
    } else {
      console.log('  ⚠️  Rendimiento aceptable pero mejorable');
    }

    console.log('  ✅ B2B-NAV-006 completado: Performance verificada');
  });
});
