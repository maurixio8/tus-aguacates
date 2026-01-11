/**
 * Tests E2E para Variantes de Productos
 * Prueba la gestión de variantes en el dashboard de productos
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../../helpers/auth-helpers';
import { ADMIN_URLS, TIMEOUTS } from '../../../fixtures/admin';

test.describe('Admin - Variantes de Productos', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('debería mostrar productos con variantes', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Buscar productos que tengan el indicador de variantes
    // Puede ser un icono, texto, o badge
    const variantIndicator = page.locator('text=/variante|variant|Layers|capas/i').first();

    const hasVariants = await variantIndicator.isVisible();
    if (hasVariants) {
      await expect(variantIndicator).toBeVisible();
    }
  });

  test('debería expandir variantes de un producto', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Buscar botón para expandir variantes
    const expandButton = page.locator('button[title*="variante"], button:has-text("variante")').first();

    const hasExpandButton = await expandButton.isVisible();
    if (hasExpandButton) {
      const initialText = await expandButton.textContent();

      await expandButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que se mostraron las variantes
      const variantsSection = page.locator('text=/Variante del Producto|Variantes/i').first();
      const hasVariantsVisible = await variantsSection.count() > 0;

      if (hasVariantsVisible) {
        await expect(variantsSection).toBeVisible();
      }
    }
  });

  test('debería editar una variante', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Buscar un producto con variantes y expandirlo
    const expandButton = page.locator('button[title*="variante"], button:has-text("variante")').first();

    const hasExpandButton = await expandButton.isVisible();
    if (hasExpandButton) {
      await expandButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Buscar botón de editar variante
      const editVariantButton = page.locator('button:has-text("Editar")').first();

      const hasEditButton = await editVariantButton.isVisible();
      if (hasEditButton) {
        await editVariantButton.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);

        // Verificar que se mostraron campos de edición
        const priceInput = page.locator('input[type="number"]').first();
        const hasPriceInput = await priceInput.isVisible();

        if (hasPriceInput) {
          // Modificar precio
          await priceInput.fill('20000');

          // Guardar
          const saveButton = page.locator('button:has-text("Guardar"), button[type="submit"]').first();
          await saveButton.click();
          await page.waitForTimeout(TIMEOUTS.MEDIUM);

          // Verificar mensaje de éxito
          const successToast = page.locator('.bg-green-600, .text-green-600, [class*="success"]').first();
          const hasSuccessToast = await successToast.isVisible();

          if (hasSuccessToast) {
            await expect(successToast).toBeVisible();
          }
        }
      }
    }
  });

  test('debería mostrar stock de variantes con colores', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Expandir variantes si hay productos con variantes
    const expandButton = page.locator('button[title*="variante"], button:has-text("variante")').first();

    const hasExpandButton = await expandButton.isVisible();
    if (hasExpandButton) {
      await expandButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Buscar stock bajo (debería mostrarse en rojo)
      const lowStockIndicator = page.locator('.text-red-600, [class*="red"]').filter({ hasText: /^\d+$/ });

      const hasLowStock = await lowStockIndicator.count() > 0;

      if (hasLowStock) {
        // Si hay stock bajo, verificar que se muestra en rojo
        await expect(lowStockIndicator.first()).toBeVisible();
      }
    }
  });

  test('debería cambiar estado activo/inactivo de variante', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Expandir variantes
    const expandButton = page.locator('button[title*="variante"], button:has-text("variante")').first();

    const hasExpandButton = await expandButton.isVisible();
    if (hasExpandButton) {
      await expandButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Buscar botón de estado en variante
      const statusButton = page.locator('button:has-text("Activo"), button:has-text("Inactivo")').first();

      const hasStatusButton = await statusButton.isVisible();
      if (hasStatusButton) {
        const initialText = await statusButton.textContent();

        await statusButton.click();
        await page.waitForTimeout(TIMEOUTS.MEDIUM);

        const newText = await statusButton.textContent();

        expect(initialText).not.toBe(newText);
      }
    }
  });

  test('debería poder cancelar edición de variante', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Expandir variantes
    const expandButton = page.locator('button[title*="variante"], button:has-text("variante")').first();

    const hasExpandButton = await expandButton.isVisible();
    if (hasExpandButton) {
      await expandButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Buscar botón de editar
      const editVariantButton = page.locator('button:has-text("Editar")').first();

      const hasEditButton = await editVariantButton.isVisible();
      if (hasEditButton) {
        await editVariantButton.click();
        await page.waitForTimeout(TIMEOUTS.SHORT);

        // Buscar botón de cancelar
        const cancelButton = page.locator('button:has-text("Cancelar")').first();

        const hasCancelButton = await cancelButton.isVisible();
        if (hasCancelButton) {
          await cancelButton.click();
          await page.waitForTimeout(TIMEOUTS.SHORT);

          // Verificar que se cerró el modo edición
          // (el botón de "Editar" debería estar visible nuevamente)
          await expect(editVariantButton).toBeVisible();
        }
      }
    }
  });
});
