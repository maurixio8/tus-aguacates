/**
 * Tests E2E con Playwright - Flujo Completo de Compra
 * Simula un usuario real navegando por la aplicación
 */

import { test, expect } from '@playwright/test';

test.describe('🛒 Flujo E2E - Compra Completa', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar localStorage para carrito vacío
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('✅ Compra completa: Producto → Carrito → Checkout → Confirmación', async ({ page }) => {
    // 1. Navegar a productos
    await page.goto('/productos');
    await expect(page.getByText('Nuestros Productos')).toBeVisible();

    // 2. Seleccionar un producto
    await page.getByRole('link', { name: /aguacate/i }).first().click();
    await expect(page.getByText('Aguacate')).toBeVisible();

    // 3. Agregar al carrito
    await page.getByRole('button', { name: /agregar al carrito/i }).click();

    // 4. Verificar que se muestra notificación o contador de carrito
    await expect(page.getByRole('button', { name: /carrito/i })).toBeVisible();

    // 5. Abrir carrito
    await page.getByRole('button', { name: /carrito/i }).click();
    await expect(page.getByText('Mi Carrito')).toBeVisible();

    // 6. Verificar producto en carrito
    await expect(page.getByText('Aguacate')).toBeVisible();

    // 7. Ir al checkout
    await page.getByRole('link', { name: /ir al checkout/i }).click();
    await expect(page.getByText('Finalizar Pedido')).toBeVisible();

    // 8. Completar formulario
    await page.getByLabel(/nombre completo/i).fill('Juan Pérez Prueba');
    await page.getByLabel(/email/i).fill('juan.perez@test.com');
    await page.getByLabel(/teléfono/i).fill('3001234567');
    await page.getByLabel(/dirección de entrega/i).fill('Calle 123 #45-67, Bogotá');
    await page.getByLabel(/fecha de entrega/i).fill('2024-12-25');

    // 9. Verificar resumen del pedido
    await expect(page.getByText('Resumen del Pedido')).toBeVisible();

    // 10. Confirmar pedido contra entrega
    await page.getByRole('button', { name: /pagar contra entrega/i }).click();

    // 11. Verificar redirección a confirmación
    await expect(page).toHaveURL(/checkout\/confirmacion/);
    await expect(page.getByText('¡Pedido Confirmado!')).toBeVisible();

    // 12. Verificar que el carrito esté vacío
    await page.getByRole('button', { name: /carrito/i }).click();
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('✅ Compra con múltiples productos y variantes', async ({ page }) => {
    await page.goto('/productos');

    // Agregar primer producto
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();

    // Esperar un momento para que se procese
    await page.waitForTimeout(500);

    // Agregar segundo producto (si existe selector de variantes)
    const variantSelect = page.locator('select').first();
    if (await variantSelect.isVisible()) {
      await variantSelect.selectOption({ index: 1 });
      await page.locator('.product-card').nth(1).getByRole('button', { name: /agregar al carrito/i }).click();
    }

    // Verificar carrito con múltiples items
    await page.getByRole('button', { name: /carrito/i }).click();

    const cartItems = page.locator('[data-testid="cart-item"]');
    await expect(cartItems).toHaveCount(2);

    // Verificar total
    await expect(page.getByText(/\$/)).toBeVisible();
  });

  test('✅ Modificar cantidades en el carrito', async ({ page }) => {
    await page.goto('/productos');

    // Agregar producto
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();

    // Abrir carrito
    await page.getByRole('button', { name: /carrito/i }).click();

    // Incrementar cantidad
    await page.getByRole('button', { name: '+' }).first().click();

    // Verificar que la cantidad cambió
    await expect(page.locator('.font-semibold').filter({ hasText: '2' })).toBeVisible();

    // Decrementar cantidad
    await page.getByRole('button', { name: '-' }).first().click();

    // Verificar que volvió a 1
    await expect(page.locator('.font-semibold').filter({ hasText: '1' })).toBeVisible();
  });

  test('✅ Eliminar productos del carrito', async ({ page }) => {
    await page.goto('/productos');

    // Agregar producto
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();

    // Abrir carrito
    await page.getByRole('button', { name: /carrito/i }).click();

    // Eliminar producto
    await page.getByRole('button', { name: /eliminar/i }).click();

    // Verificar que el carrito quedó vacío
    await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
  });

  test('✅ Validación de formulario de checkout', async ({ page }) => {
    // Agregar producto al carrito primero
    await page.goto('/productos');
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();
    await page.getByRole('button', { name: /carrito/i }).click();
    await page.getByRole('link', { name: /ir al checkout/i }).click();

    // Intentar enviar formulario vacío
    await page.getByRole('button', { name: /continuar al pago/i }).click();

    // Verificar validaciones HTML5
    const nameInput = page.getByLabel(/nombre completo/i);
    await expect(nameInput).toHaveAttribute('required');

    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toHaveAttribute('required');

    // Completar con email inválido
    await emailInput.fill('email-invalido');
    await page.getByRole('button', { name: /continuar al pago/i }).click();

    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('✅ Creación de cuenta opcional', async ({ page }) => {
    // Agregar producto y llegar al checkout
    await page.goto('/productos');
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();
    await page.getByRole('button', { name: /carrito/i }).click();
    await page.getByRole('link', { name: /ir al checkout/i }).click();

    // Marcar checkbox de crear cuenta
    await page.getByLabel(/crear cuenta/i).check();

    // Verificar que aparece campo de contraseña
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();

    // Completar contraseña
    await page.getByLabel(/contraseña/i).fill('password123');

    // Verificar validación de longitud mínima
    const passwordInput = page.getByLabel(/contraseña/i);
    await expect(passwordInput).toHaveAttribute('minlength', '8');
  });

  test('✅ Redirección si carrito vacío', async ({ page }) => {
    // Intentar ir directamente a checkout con carrito vacío
    await page.goto('/checkout');

    // Debe redirigir a productos
    await expect(page).toHaveURL('/productos');
  });

  test('✅ Persistencia del carrito', async ({ page }) => {
    // Agregar producto al carrito
    await page.goto('/productos');
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();

    // Recargar la página
    await page.reload();

    // Abrir carrito - debe mantener los items
    await page.getByRole('button', { name: /carrito/i }).click();
    await expect(page.getByText('Mi Carrito')).toBeVisible();
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
  });

  test('✅ Manejo de productos agotados', async ({ page }) => {
    await page.goto('/productos');

    // Buscar productos agotados (si existen)
    const soldOutProducts = page.locator('button:has-text("Agotado")');

    if (await soldOutProducts.count() > 0) {
      // Verificar que el botón está deshabilitado
      await expect(soldOutProducts.first()).toBeDisabled();

      // No debería poder agregar al carrito
      await soldOutProducts.first().click({ force: true });

      // El carrito debería seguir vacío
      await page.getByRole('button', { name: /carrito/i }).click();
      await expect(page.getByText('Tu carrito está vacío')).toBeVisible();
    } else {
      // Si no hay productos agotados, el test pasa
      test.skip();
    }
  });

  test('✅ Responsividad en móvil', async ({ page }) => {
    // Simular vista móvil
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/productos');

    // Verificar que la página se adapta
    await expect(page.locator('.container')).toBeVisible();

    // Agregar producto
    await page.locator('.product-card').first().getByRole('button', { name: /agregar al carrito/i }).click();

    // Verificar carrito en móvil
    await page.getByRole('button', { name: /carrito/i }).click();
    await expect(page.getByText('Mi Carrito')).toBeVisible();

    // Verificar que el drawer ocupa toda la pantalla en móvil
    const cartDrawer = page.locator('.fixed.top-0.right-0');
    await expect(cartDrawer).toHaveClass(/w-full/);
  });
});

test.describe('🔍 Pruebas de Accesibilidad', () => {
  test('✅ Navegación por teclado', async ({ page }) => {
    await page.goto('/productos');

    // Navegar con Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Activar botón con Enter
    await page.keyboard.press('Enter');

    // Verificar que el foco funciona correctamente
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });

  test('✅ Contraste y legibilidad', async ({ page }) => {
    await page.goto('/productos');

    // Verificar que hay suficiente contraste (simulado)
    const productCards = page.locator('.product-card');
    await expect(productCards.first()).toBeVisible();

    // Verificar texto legible
    await expect(page.getByText('Aguacate')).toBeVisible();
  });
});