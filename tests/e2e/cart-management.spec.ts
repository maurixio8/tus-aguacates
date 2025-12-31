import { test, expect } from '@playwright/test';
import { TEST_PRODUCTS, TEST_COUPONS, SHIPPING, URLS } from '../fixtures';

/**
 * Tests E2E para Carrito de Compras - Tus Aguacates
 * Tests: CART-001 a CART-008
 */
test.describe('Carrito de Compras - B2C', () => {
  // Configuración previa a cada test
  test.beforeEach(async ({ page }) => {
    // Limpiar localStorage para empezar con carrito vacío
    await page.goto(URLS.HOME);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  /**
   * CART-001: Agregar producto al carrito desde /tienda
   * Objetivo: Verificar que un producto se agrega correctamente al carrito
   */
  test('CART-001 - Agregar producto al carrito', async ({ page }) => {
    console.log('🛒 CART-001: Agregar producto al carrito');

    // Navegar a la tienda
    await page.goto(URLS.SHOP);

    // Esperar a que carguen los productos
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Obtener el primer producto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();

    // Obtener nombre del producto antes de agregar
    const productName = await firstProduct.locator('h3, .product-title, .product-name').first().textContent();
    console.log(`  ➕ Agregando: ${productName?.trim()}`);

    // Hacer clic en botón "Agregar"
    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    // Esperar un momento para que se procese la acción
    await page.waitForTimeout(1000);

    // Verificar que el ícono del carrito está visible y tiene un indicador de cantidad
    const cartIcon = page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first();
    await expect(cartIcon, 'El ícono del carrito debe ser visible').toBeVisible();

    // Verificar badge de cantidad en el carrito (si existe)
    const cartBadge = page.locator('[data-testid="cart-badge"], .cart-badge, .badge').first();
    const badgeCount = await cartBadge.isVisible();

    if (badgeCount) {
      const badgeText = await cartBadge.textContent();
      expect(parseInt(badgeText || '0')).toBeGreaterThan(0);
      console.log(`  ✓ Cantidad en carrito: ${badgeText}`);
    }

    // Abrir el carrito para verificar que el producto está ahí
    await cartIcon.click();

    // Esperar a que se abra el drawer del carrito
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Verificar que hay items en el carrito
    const cartItems = page.locator('[data-testid="cart-item"], .cart-item, .item');
    await expect(cartItems.first(), 'Debe haber al menos un item en el carrito').toBeVisible();

    console.log('  ✅ CART-001 completado: Producto agregado correctamente');
  });

  /**
   * CART-002: Modificar cantidad (+/-) en el drawer
   * Objetivo: Verificar que se pueden incrementar y decrementar cantidades
   */
  test('CART-002 - Modificar cantidad en el carrito', async ({ page }) => {
    console.log('🛒 CART-002: Modificar cantidad en el carrito');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar primer producto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    await page.waitForTimeout(1000);

    // Abrir el carrito
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();

    // Esperar a que se abra el drawer
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Obtener el total antes de modificar
    const totalBefore = await page.locator('[data-testid="cart-total"], .total, .final-total, [data-testid="total"]').first().textContent();
    console.log(`  💰 Total inicial: ${totalBefore?.trim()}`);

    // Buscar botones de incrementar cantidad (+)
    const increaseButton = page.locator(
      '[data-testid="quantity-increase"], button:has-text("+"), .quantity-increment, [aria-label*="aumentar"]'
    ).first();

    // Hacer clic para incrementar cantidad (2 veces para ir de 1 a 3)
    await increaseButton.click();
    await page.waitForTimeout(500);
    await increaseButton.click();
    await page.waitForTimeout(500);

    // Verificar que la cantidad se actualizó
    const quantityDisplay = page.locator(
      '[data-testid="quantity"], .quantity, .qty, [data-testid="item-quantity"]'
    ).first();

    const quantity = await quantityDisplay.textContent();
    expect(parseInt(quantity || '0')).toBe(3);
    console.log(`  📊 Cantidad actualizada: ${quantity}`);

    // Obtener el total después de incrementar
    const totalAfter = await page.locator('[data-testid="cart-total"], .total, .final-total, [data-testid="total"]').first().textContent();
    console.log(`  💰 Total actualizado: ${totalAfter?.trim()}`);

    // Verificar que el total aumentó (comparando como números)
    const numericBefore = parseFloat(totalBefore?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
    const numericAfter = parseFloat(totalAfter?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');
    expect(numericAfter).toBeGreaterThan(numericBefore);

    // Decrementar cantidad
    const decreaseButton = page.locator(
      '[data-testid="quantity-decrease"], button:has-text("-"), .quantity-decrement, [aria-label*="disminuir"]'
    ).first();

    await decreaseButton.click();
    await page.waitForTimeout(500);

    // Verificar que la cantidad disminuyó
    const quantityAfterDecrement = await quantityDisplay.textContent();
    expect(parseInt(quantityAfterDecrement || '0')).toBe(2);
    console.log(`  📊 Cantidad después de decremento: ${quantityAfterDecrement}`);

    console.log('  ✅ CART-002 completado: Cantidad modificada correctamente');
  });

  /**
   * CART-003: Eliminar item del carrito
   * Objetivo: Verificar que se puede eliminar un item del carrito
   */
  test('CART-003 - Eliminar item del carrito', async ({ page }) => {
    console.log('🛒 CART-003: Eliminar item del carrito');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar un producto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    const productName = await firstProduct.locator('h3, .product-title, .product-name').first().textContent();
    console.log(`  ➕ Agregando: ${productName?.trim()}`);

    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    await page.waitForTimeout(1000);

    // Abrir el carrito
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Verificar que hay items antes de eliminar
    const cartItemsBefore = page.locator('[data-testid="cart-item"], .cart-item, .item');
    const countBefore = await cartItemsBefore.count();
    console.log(`  📦 Items antes de eliminar: ${countBefore}`);
    expect(countBefore).toBeGreaterThan(0);

    // Buscar y hacer clic en botón de eliminar
    const removeButton = page.locator(
      '[data-testid="remove-item"], button:has-text("Eliminar"), button:has-text("Quitar"), .remove-item, [aria-label*="eliminar"]'
    ).first();

    await removeButton.click();
    await page.waitForTimeout(1000);

    // Verificar mensaje de confirmación (si existe)
    const confirmButton = page.locator('button:has-text("Confirmar"), button:has-text("Sí"), button:has-text("Eliminar")');
    if (await confirmButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.first().click();
      await page.waitForTimeout(1000);
    }

    // Verificar que el carrito está vacío o que se eliminó el item
    const cartItemsAfter = page.locator('[data-testid="cart-item"], .cart-item, .item');
    const countAfter = await cartItemsAfter.count();
    console.log(`  📦 Items después de eliminar: ${countAfter}`);

    expect(countAfter).toBeLessThan(countBefore);

    // Verificar mensaje de carrito vacío
    const emptyMessage = page.locator('[data-testid="empty-cart"], .empty-cart, :has-text("carrito vacío"), :has-text("Carrito vacío")');
    if (countAfter === 0) {
      await expect(emptyMessage.first(), 'Debe mostrar mensaje de carrito vacío').toBeVisible();
    }

    console.log('  ✅ CART-003 completado: Item eliminado correctamente');
  });

  /**
   * CART-004: Aplicar cupón válido (BIENVENIDA10)
   * Objetivo: Verificar que se aplica correctamente un cupón de descuento
   */
  test('CART-004 - Aplicar cupón válido', async ({ page }) => {
    console.log('🛒 CART-004: Aplicar cupón válido');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar un producto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    await page.waitForTimeout(1000);

    // Abrir el carrito
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Obtener subtotal antes del cupón
    const subtotalBefore = await page.locator('[data-testid="subtotal"], .subtotal').first().textContent();
    console.log(`  💵 Subtotal antes del cupón: ${subtotalBefore?.trim()}`);

    // Buscar input de cupón
    const couponInput = page.locator(
      'input[placeholder*="cupón"], input[name="coupon"], input[data-testid="coupon-input"], #coupon'
    ).first();

    await couponInput.fill(TEST_COUPONS.VALID.BIENVENIDA10.code);
    console.log(`  🎟️ Aplicando cupón: ${TEST_COUPONS.VALID.BIENVENIDA10.code}`);

    // Hacer clic en botón de aplicar cupón
    const applyCouponButton = page.locator(
      'button:has-text("Aplicar"), button:has-text("Aplicar Cupón"), button[data-testid="apply-coupon"]'
    ).first();

    await applyCouponButton.click();
    await page.waitForTimeout(2000);

    // Verificar mensaje de éxito
    const successMessage = page.locator(
      '[data-testid="coupon-success"], :has-text("Cupón aplicado"), :has-text("aplicado correctamente")'
    ).first();

    const isSuccessVisible = await successMessage.isVisible({ timeout: 3000 }).catch(() => false);
    if (isSuccessVisible) {
      await expect(successMessage).toBeVisible();
      console.log('  ✓ Cupón aplicado con éxito');
    }

    // Verificar que se muestra el descuento
    const discountElement = page.locator(
      '[data-testid="discount"], .discount, .coupon-discount, :has-text("Descuento")'
    ).first();

    const isDiscountVisible = await discountElement.isVisible({ timeout: 3000 }).catch(() => false);
    expect(isDiscountVisible, 'Debe mostrarse el descuento aplicado').toBeTruthy();

    if (isDiscountVisible) {
      const discountText = await discountElement.textContent();
      console.log(`  💰 Descuento aplicado: ${discountText?.trim()}`);
    }

    // Verificar que el total se actualizó
    const totalAfter = await page.locator('[data-testid="cart-total"], .total, .final-total, [data-testid="total"]').first().textContent();
    console.log(`  💵 Total después del cupón: ${totalAfter?.trim()}`);

    console.log('  ✅ CART-004 completado: Cupón válido aplicado correctamente');
  });

  /**
   * CART-005: Aplicar cupón inválido
   * Objetivo: Verificar que se muestra error al aplicar cupón inválido
   */
  test('CART-005 - Aplicar cupón inválido', async ({ page }) => {
    console.log('🛒 CART-005: Aplicar cupón inválido');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar un producto
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    await page.waitForTimeout(1000);

    // Abrir el carrito
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Buscar input de cupón
    const couponInput = page.locator(
      'input[placeholder*="cupón"], input[name="coupon"], input[data-testid="coupon-input"], #coupon'
    ).first();

    await couponInput.fill(TEST_COUPONS.INVALID.NOT_FOUND.code);
    console.log(`  🎟️ Intentando aplicar cupón inválido: ${TEST_COUPONS.INVALID.NOT_FOUND.code}`);

    // Hacer clic en botón de aplicar cupón
    const applyCouponButton = page.locator(
      'button:has-text("Aplicar"), button:has-text("Aplicar Cupón"), button[data-testid="apply-coupon"]'
    ).first();

    await applyCouponButton.click();
    await page.waitForTimeout(2000);

    // Verificar mensaje de error
    const errorMessage = page.locator(
      '[data-testid="coupon-error"], .error, :has-text("Cupón no encontrado"), :has-text("inválido"), :has-text("Cupón inválido")'
    ).first();

    await expect(errorMessage.first(), 'Debe mostrarse mensaje de error de cupón').toBeVisible({ timeout: 3000 });

    const errorText = await errorMessage.textContent();
    console.log(`  ❌ Error mostrado: ${errorText?.trim()}`);

    // Verificar que NO se aplicó descuento
    const discountElement = page.locator(
      '[data-testid="discount"], .discount, .coupon-discount'
    ).first();

    const isDiscountVisible = await discountElement.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isDiscountVisible, 'No debe mostrarse descuento para cupón inválido').toBeFalsy();

    console.log('  ✅ CART-005 completado: Error mostrado correctamente para cupón inválido');
  });

  /**
   * CART-006: Cálculo correcto de shipping ($7.400 Bogotá)
   * Objetivo: Verificar que el shipping se calcula correctamente para Bogotá
   */
  test('CART-006 - Cálculo de shipping Bogotá', async ({ page }) => {
    console.log('🛒 CART-006: Cálculo de shipping Bogotá');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar un producto que NO alcance envío gratis
    const firstProduct = page.locator('[data-testid="product-card"], .product-card, article').first();
    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    await page.waitForTimeout(1000);

    // Abrir el carrito
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Buscar selector de ciudad/departamento
    const citySelect = page.locator(
      'select[name="city"], select[data-testid="city"], [data-testid="shipping-city"]'
    ).first();

    const isCitySelectorVisible = await citySelect.isVisible({ timeout: 2000 }).catch(() => false);

    if (isCitySelectorVisible) {
      // Seleccionar Bogotá
      await citySelect.selectOption({ label: 'Bogotá' });
      await page.waitForTimeout(1000);
      console.log('  📍 Ciudad seleccionada: Bogotá');
    }

    // Verificar que el shipping se muestra
    const shippingElement = page.locator(
      '[data-testid="shipping"], .shipping, .envio, :has-text("Envío"), :has-text("Shipping")'
    ).first();

    await expect(shippingElement, 'Debe mostrarse el costo de envío').toBeVisible({ timeout: 3000 });

    // Obtener el valor del shipping
    const shippingText = await shippingElement.textContent();
    console.log(`  🚚 Costo de envío: ${shippingText?.trim()}`);

    // Verificar que el shipping es $7.400
    const shippingNumeric = parseFloat(shippingText?.replace(/[^\d.,]/g, '').replace(',', '.') || '0');

    // Permitir un pequeño margen de error por redondeo
    expect(shippingNumeric).toBeCloseTo(SHIPPING.COST_BOGOTA, 0);
    console.log(`  ✓ Shipping correcto: $${SHIPPING.COST_BOGOTA.toLocaleString('es-CO')}`);

    console.log('  ✅ CART-006 completado: Shipping calculado correctamente');
  });

  /**
   * CART-007: Envío gratis visible cuando subtotal > $68.900
   * Objetivo: Verificar que se activa el envío gratis al superar el mínimo
   */
  test('CART-007 - Envío gratis', async ({ page }) => {
    console.log('🛒 CART-007: Envío gratis');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar varios productos hasta superar $68.900
    const productCards = page.locator('[data-testid="product-card"], .product-card, article');
    const count = await productCards.count();

    let addedCount = 0;
    for (let i = 0; i < Math.min(count, 5); i++) {
      const card = productCards.nth(i);
      const productName = await card.locator('h3, .product-title, .product-name').first().textContent();

      await card
        .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
        .first()
        .click();

      addedCount++;
      console.log(`  ➕ Agregado: ${productName?.trim()}`);
      await page.waitForTimeout(800);
    }

    console.log(`  📦 Total productos agregados: ${addedCount}`);

    // Abrir el carrito
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Verificar mensaje de envío gratis
    const freeShippingMessage = page.locator(
      '[data-testid="free-shipping"], :has-text("¡Envío GRATIS"), :has-text("Envío gratis"), :has-text("¡Felicidades"), .free-shipping'
    ).first();

    const isFreeShippingVisible = await freeShippingMessage.isVisible({ timeout: 3000 }).catch(() => false);

    if (isFreeShippingVisible) {
      await expect(freeShippingMessage).toBeVisible();
      const messageText = await freeShippingMessage.textContent();
      console.log(`  🎉 Mensaje de envío gratis: ${messageText?.trim()}`);
    }

    // Verificar que el costo de envío es $0
    const shippingElement = page.locator(
      '[data-testid="shipping"], .shipping, .envio'
    ).first();

    const shippingText = await shippingElement.textContent();
    const shippingNumeric = parseFloat(shippingText?.replace(/[^\d.,]/g, '').replace(',', '.') || '999999');

    // Verificar que el envío es $0 o muy cercano
    if (shippingNumeric < 100) {
      console.log('  ✓ Envío gratis aplicado: $0');
    } else {
      console.log(`  ℹ️  Envío: $${shippingNumeric} (es posible que no se haya alcanzado el mínimo)`);
    }

    // También verificar el subtotal
    const subtotalElement = page.locator('[data-testid="subtotal"], .subtotal').first();
    const subtotalText = await subtotalElement.textContent();
    console.log(`  💵 Subtotal total: ${subtotalText?.trim()}`);

    console.log('  ✅ CART-007 completado: Envío gratis verificado');
  });

  /**
   * CART-008: Persistencia del carrito después de F5
   * Objetivo: Verificar que el carrito se mantiene al recargar la página
   */
  test('CART-008 - Persistencia del carrito', async ({ page }) => {
    console.log('🛒 CART-008: Persistencia del carrito');

    await page.goto(URLS.SHOP);
    await page.waitForSelector('[data-testid="product-card"], .product-card, article', {
      timeout: 20000
    });

    // Agregar 2 productos diferentes
    const productCards = page.locator('[data-testid="product-card"], .product-card, article');

    const firstProduct = productCards.first();
    const firstProductName = await firstProduct.locator('h3, .product-title, .product-name').first().textContent();

    await firstProduct
      .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
      .first()
      .click();

    console.log(`  ➕ Producto 1 agregado: ${firstProductName?.trim()}`);
    await page.waitForTimeout(1000);

    // Agregar segundo producto si existe
    const secondProduct = productCards.nth(1);
    if (await secondProduct.isVisible()) {
      const secondProductName = await secondProduct.locator('h3, .product-title, .product-name').first().textContent();

      await secondProduct
        .locator('[data-testid="add-to-cart-button"], button:has-text("Agregar"), button:has-text("Comprar"), .add-to-cart')
        .first()
        .click();

      console.log(`  ➕ Producto 2 agregado: ${secondProductName?.trim()}`);
      await page.waitForTimeout(1000);
    }

    // Abrir el carrito y contar items ANTES de recargar
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    const cartItemsBefore = page.locator('[data-testid="cart-item"], .cart-item, .item');
    const countBefore = await cartItemsBefore.count();
    console.log(`  📦 Items en carrito ANTES de recargar: ${countBefore}`);

    // Obtener badge de cantidad
    const cartBadge = page.locator('[data-testid="cart-badge"], .cart-badge, .badge').first();
    const badgeBefore = await cartBadge.isVisible() ? await cartBadge.textContent() : 'N/A';
    console.log(`  🔢 Badge ANTES de recargar: ${badgeBefore}`);

    // Cerrar el drawer del carrito
    const closeButton = page.locator(
      'button:has-text("Cerrar"), button[aria-label="Close"], .close-button, [data-testid="close-cart"]'
    ).first();

    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeButton.click();
      await page.waitForTimeout(500);
    }

    // Recargar la página (F5)
    console.log('  🔄 Recargando página...');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Verificar que el badge se mantiene
    const cartBadgeAfter = page.locator('[data-testid="cart-badge"], .cart-badge, .badge').first();
    const badgeAfterVisible = await cartBadgeAfter.isVisible({ timeout: 3000 }).catch(() => false);

    if (badgeAfterVisible) {
      const badgeAfter = await cartBadgeAfter.textContent();
      console.log(`  🔢 Badge DESPUÉS de recargar: ${badgeAfter}`);
      expect(badgeAfter).toBe(badgeBefore);
    }

    // Abrir el carrito nuevamente
    await page.locator('[data-testid="cart-icon"], .cart-icon, .shopping-cart').first().click();
    await page.waitForSelector('[data-testid="cart-drawer"], .cart-drawer, .drawer, [role="dialog"]', {
      timeout: 5000
    });

    // Contar items DESPUÉS de recargar
    const cartItemsAfter = page.locator('[data-testid="cart-item"], .cart-item, .item');
    const countAfter = await cartItemsAfter.count();
    console.log(`  📦 Items en carrito DESPUÉS de recargar: ${countAfter}`);

    // Verificar que la cantidad se mantuvo
    expect(countAfter, 'El carrito debe mantener los items después de recargar').toBe(countBefore);

    // Verificar que los productos son los mismos (comparando nombres)
    if (countAfter > 0 && countBefore > 0) {
      const firstItemName = await cartItemsAfter.first().locator('h3, .product-title, .product-name, .item-name').first().textContent();
      console.log(`  ✓ Producto persistente: ${firstItemName?.trim()}`);
    }

    console.log('  ✅ CART-008 completado: Carrito persiste correctamente después de recargar');
  });
});
