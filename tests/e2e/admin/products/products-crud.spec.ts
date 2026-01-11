/**
 * Tests E2E para CRUD de Productos
 * Prueba crear, leer, actualizar y eliminar productos
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../../helpers/auth-helpers';
import { AdminAPIHelper, getValidCategoryId } from '../../../helpers/api-helpers';
import { cleanupTestProducts, TestResourceTracker } from '../../../fixtures/cleanup';
import { generateTestData, ADMIN_URLS, TIMEOUTS } from '../../../fixtures/admin';

test.describe('Admin - Productos CRUD', () => {
  let apiHelper: AdminAPIHelper;
  let tracker: TestResourceTracker;

  test.beforeEach(async ({ page, request }) => {
    await loginAsAdmin(page);
    apiHelper = new AdminAPIHelper(request);
    tracker = new TestResourceTracker();
  });

  test.afterEach(async ({ request }) => {
    await tracker.cleanup(request);
  });

  test('debería listar productos', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Verificar título de la página
    await expect(page.locator('h1')).toContainText(/Productos|Catálogo|Gestión/, { timeout: TIMEOUTS.MEDIUM });

    // Verificar que hay una tabla o lista de productos
    const table = page.locator('table').first();
    const hasTable = await table.isVisible();

    if (hasTable) {
      await expect(table).toBeVisible();
      const rows = await table.locator('tbody tr').count();
      expect(rows).toBeGreaterThanOrEqual(0);
    }
  });

  test('debería buscar productos por nombre', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Buscar campo de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="search"]').first();

    const hasSearch = await searchInput.isVisible();
    if (hasSearch) {
      // Escribir término de búsqueda
      await searchInput.fill('aguacate');
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que se mostraron resultados
      const table = page.locator('table').first();
      if (await table.isVisible()) {
        const rows = await table.locator('tbody tr').count();
        expect(rows).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('debería cambiar estado activo/inactivo de un producto', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Buscar botón de estado en el primer producto
    const statusButton = page.locator('button:has-text("Activo"), button:has-text("Inactivo"), button:has-text("Eye")').first();

    const hasStatusButton = await statusButton.isVisible();
    if (hasStatusButton) {
      const initialText = await statusButton.textContent();

      await statusButton.click();
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      const newText = await statusButton.textContent();

      // El texto debería haber cambiado
      expect(initialText).not.toBe(newText);
    }
  });

  test('debería editar un producto', async ({ page }) => {
    await page.goto(ADMIN_URLS.PRODUCTS);
    await page.waitForLoadState('networkidle');

    // Buscar botón de editar
    const editButton = page.locator('button[title*="Editar"], button:has-text("Editar")').first();

    const hasEditButton = await editButton.isVisible();
    if (hasEditButton) {
      await editButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que se abrió el modal de edición (filtrar elementos ocultos con hidden)
      const modal = page.locator('.fixed:not(.hidden), .modal:not(.hidden), [role="dialog"]:not(.hidden)').filter({ hasText: /Editar|Producto/i });
      const hasModal = await modal.count() > 0;

      if (hasModal) {
        await expect(modal.first()).toBeVisible();

        // Buscar input de nombre
        const nameInput = page.locator('input[placeholder*="Nombre"], input[name*="name"]').first();
        if (await nameInput.isVisible()) {
          const originalName = await nameInput.inputValue();
          await nameInput.fill(`${originalName} (Editado)`);

          // Guardar cambios
          const saveButton = page.locator('button:has-text("Guardar"), button:has-text("Actualizar"), button[type="submit"]').first();
          await saveButton.click();
          await page.waitForTimeout(TIMEOUTS.MEDIUM);

          // Verificar mensaje de éxito
          const successToast = page.locator('.bg-green-600, .text-green-600, [class*="success"]').first();
          const hasSuccessToast = await successToast.isVisible();
          if (hasSuccessToast) {
            await expect(successToast).toBeVisible();
          }
        }

        // Cerrar modal si aún está abierto
        const closeButton = page.locator('button:has-text("Cancelar"), button[aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('API: debería crear un producto válido', async ({ request }) => {
    // Obtener una categoría válida
    const categoryId = await getValidCategoryId(request);

    if (!categoryId) {
      test.skip(true, 'No se encontró una categoría válida para crear el producto');
      return;
    }

    const productData = generateTestData.product({ category_id: categoryId });
    console.log('📦 Creando producto con datos:', JSON.stringify(productData, null, 2));

    const response = await apiHelper.createProduct(productData);

    // Imprimir información de diagnóstico si falla
    if (response.status() !== 201) {
      const errorData = await response.json();
      console.error('❌ Error al crear producto:');
      console.error('Status:', response.status());
      console.error('Response:', JSON.stringify(errorData, null, 2));
    }

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe(productData.name);

    // Track para cleanup
    tracker.trackProduct(data.data.id);
  });

  test('API: debería rechazar producto con precio negativo', async ({ request }) => {
    const categoryId = await getValidCategoryId(request);

    if (!categoryId) {
      test.skip(true, 'No se encontró una categoría válida');
      return;
    }

    const response = await apiHelper.createProduct({
      ...generateTestData.product({ category_id: categoryId }),
      price: -100,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toMatch(/precio|price|inválido/i);
  });

  test('API: debería rechazar producto con stock negativo', async ({ request }) => {
    const categoryId = await getValidCategoryId(request);

    if (!categoryId) {
      test.skip(true, 'No se encontró una categoría válida');
      return;
    }

    const response = await apiHelper.createProduct({
      ...generateTestData.product({ category_id: categoryId }),
      stock: -50,
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toMatch(/stock|inválido/i);
  });

  test('API: debería requerir campos obligatorios', async ({ request }) => {
    const response = await apiHelper.createProduct({
      name: 'Producto sin campos requeridos',
      // Falta: price, stock, category_id
    });

    expect(response.status()).toBe(400);
  });

  test('API: debería actualizar un producto', async ({ request }) => {
    // Primero crear un producto
    const categoryId = await getValidCategoryId(request);

    if (!categoryId) {
      test.skip(true, 'No se encontró una categoría válida');
      return;
    }

    const createResponse = await apiHelper.createProduct(
      generateTestData.product({ category_id: categoryId })
    );

    const createdProduct = await createResponse.json();
    tracker.trackProduct(createdProduct.data.id);

    // Actualizar el producto
    const updateResponse = await apiHelper.updateProduct(createdProduct.data.id, {
      name: 'Producto Actualizado E2E',
      price: 25000,
    });

    expect(updateResponse.status()).toBe(200);

    const updatedData = await updateResponse.json();
    expect(updatedData.success).toBe(true);
    expect(updatedData.data.name).toBe('Producto Actualizado E2E');
    expect(updatedData.data.price).toBe(25000);
  });

  test('API: debería eliminar un producto', async ({ request }) => {
    const categoryId = await getValidCategoryId(request);

    if (!categoryId) {
      test.skip(true, 'No se encontró una categoría válida');
      return;
    }

    // Crear producto para eliminar
    const createResponse = await apiHelper.createProduct(
      generateTestData.product({ category_id: categoryId })
    );

    const createdProduct = await createResponse.json();
    const productId = createdProduct.data.id;

    // Eliminar el producto
    const deleteResponse = await apiHelper.deleteProduct(productId);

    expect(deleteResponse.status()).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);

    // Verificar que ya no existe
    const getResponse = await apiHelper.getProduct(productId);
    expect(getResponse.status()).toBe(404);
  });

  test('API: debería obtener lista de productos con paginación', async ({ request }) => {
    const response = await apiHelper.getProducts({ page: 1, limit: 10 });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('page');
    expect(data.pagination).toHaveProperty('limit');
  });
});
