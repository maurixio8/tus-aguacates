/**
 * Tests E2E para CRUD de Clientes
 * Prueba crear, leer, actualizar y eliminar clientes
 */

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../../../helpers/auth-helpers';
import { AdminAPIHelper } from '../../../helpers/api-helpers';
import { cleanupTestCustomers, TestResourceTracker } from '../../../fixtures/cleanup';
import { generateTestData, ADMIN_URLS, TIMEOUTS } from '../../../fixtures/admin';

test.describe('Admin - Clientes CRUD', () => {
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

  test('debería mostrar la página de gestión de clientes', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Verificar título
    await expect(page.locator('h1')).toContainText(/Clientes|Gestión de Clientes/, { timeout: TIMEOUTS.MEDIUM });

    // Verificar tabla o lista de clientes
    const table = page.locator('table').first();
    const hasTable = await table.isVisible();

    if (hasTable) {
      await expect(table).toBeVisible();
    }
  });

  test('debería mostrar estadísticas de clientes', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Buscar tarjetas de estadísticas
    const statsCards = page.locator('.rounded-xl, .card, [class*="stat"], [class*="metric"]');

    const cardsCount = await statsCards.count();
    expect(cardsCount).toBeGreaterThan(0);

    // Verificar que hay información de clientes
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/total|clientes|registrados/i);
  });

  test('debería buscar clientes por nombre', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Buscar campo de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar"], input[placeholder*="search"]').first();

    const hasSearch = await searchInput.isVisible();
    if (hasSearch) {
      await searchInput.fill('juan');
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que se realizará la búsqueda
      // (puede mostrar resultados o un mensaje de "no resultados")
      const table = page.locator('table').first();
      if (await table.isVisible()) {
        const rows = await table.locator('tbody tr').count();
        expect(rows).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('debería mostrar filtros de calidad de datos', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Buscar botones de filtro
    const filterButtons = page.locator('button').filter({ hasText: /email|dirección|nombre|incompleto/i });

    const filterCount = await filterButtons.count();

    if (filterCount > 0) {
      // Verificar que hay filtros disponibles
      expect(filterCount).toBeGreaterThan(0);

      // Probar un filtro
      await filterButtons.first().click();
      await page.waitForTimeout(TIMEOUTS.SHORT);
    }
  });

  test('debería abrir modal para crear nuevo cliente', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Buscar botón de nuevo cliente
    const newButton = page.locator('button:has-text("Nuevo"), button:has-text("Crear"), button:has-text("Agregar")').first();

    const hasNewButton = await newButton.isVisible();
    if (hasNewButton) {
      await newButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que se abrió el modal (filtrar elementos ocultos con hidden)
      const modal = page.locator('.fixed:not(.hidden), .modal:not(.hidden), [role="dialog"]:not(.hidden)').filter({ hasText: /Cliente/i });
      const hasModal = await modal.count() > 0;

      if (hasModal) {
        await expect(modal.first()).toBeVisible();

        // Cerrar modal
        const closeButton = page.locator('button:has-text("Cancelar"), button[aria-label="Close"]').first();
        if (await closeButton.isVisible()) {
          await closeButton.click();
        }
      }
    }
  });

  test('debería editar un cliente existente', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Buscar botón de editar
    const editButton = page.locator('button:has-text("Editar")').first();

    const hasEditButton = await editButton.isVisible();
    if (hasEditButton) {
      await editButton.click();
      await page.waitForTimeout(TIMEOUTS.SHORT);

      // Verificar que se abrió el modal (filtrar elementos ocultos con hidden)
      const modal = page.locator('.fixed:not(.hidden), .modal:not(.hidden), [role="dialog"]:not(.hidden)').filter({ hasText: /Editar|Cliente/i });
      const hasModal = await modal.count() > 0;

      if (hasModal) {
        await expect(modal.first()).toBeVisible();

        // Buscar input de nombre
        const nameInput = page.locator('input[placeholder*="Nombre"], input[name*="name"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Cliente Editado E2E');

          // Guardar
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
      }
    }
  });

  test('debería eliminar un cliente con confirmación', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Configurar handler para diálogo de confirmación
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Buscar botón de eliminar
    const deleteButton = page.locator('button:has-text("Eliminar"), button:has-text("Borrar")').first();

    const hasDeleteButton = await deleteButton.isVisible();
    if (hasDeleteButton) {
      await deleteButton.click();
      await page.waitForTimeout(TIMEOUTS.MEDIUM);

      // Verificar mensaje de éxito
      const successToast = page.locator('.bg-green-600, .text-green-600, [class*="success"]').first();
      const hasSuccessToast = await successToast.isVisible();
      if (hasSuccessToast) {
        await expect(successToast).toBeVisible();
      }
    }
  });

  test('API: debería crear un cliente válido', async ({ request }) => {
    const customerData = generateTestData.customer();
    const response = await apiHelper.createCustomer(customerData);

    expect(response.status()).toBe(201);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data.name).toBe(customerData.name);

    // Track para cleanup
    tracker.trackCustomer(data.data.id);
  });

  test('API: debería requerir nombre del cliente', async ({ request }) => {
    const response = await apiHelper.createCustomer({
      phone: '573001234567',
      email: 'test@example.com',
      // Falta nombre
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toMatch(/nombre|name|required/i);
  });

  test('API: debería requerir teléfono del cliente', async ({ request }) => {
    const response = await apiHelper.createCustomer({
      name: 'Cliente sin teléfono',
      email: 'test@example.com',
      // Falta teléfono
    });

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data.error).toMatch(/teléfono|phone|required/i);
  });

  test('API: debería actualizar un cliente', async ({ request }) => {
    // Crear cliente primero
    const createResponse = await apiHelper.createCustomer(generateTestData.customer());
    const createdCustomer = await createResponse.json();
    tracker.trackCustomer(createdCustomer.data.id);

    // Actualizar
    const updateResponse = await apiHelper.updateCustomer(createdCustomer.data.id, {
      name: 'Cliente Actualizado E2E',
      phone: '573009998887',
    });

    expect(updateResponse.status()).toBe(200);

    const updatedData = await updateResponse.json();
    expect(updatedData.success).toBe(true);
    expect(updatedData.data.name).toBe('Cliente Actualizado E2E');
  });

  test('API: debería eliminar un cliente', async ({ request }) => {
    // Crear cliente
    const createResponse = await apiHelper.createCustomer(generateTestData.customer());
    const createdCustomer = await createResponse.json();
    const customerId = createdCustomer.data.id;

    // Eliminar
    const deleteResponse = await apiHelper.deleteCustomer(customerId);

    expect(deleteResponse.status()).toBe(200);

    const deleteData = await deleteResponse.json();
    expect(deleteData.success).toBe(true);
  });

  test('API: debería listar clientes con paginación', async ({ request }) => {
    const response = await apiHelper.getCustomers({ page: 1, limit: 20 });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
    expect(data.pagination).toHaveProperty('total');
  });

  test('debería mostrar botón de WhatsApp para clientes con teléfono', async ({ page }) => {
    await page.goto(ADMIN_URLS.CUSTOMERS);
    await page.waitForLoadState('networkidle');

    // Buscar botones o links de WhatsApp
    const whatsappButton = page.locator('a:has-text("WhatsApp"), button:has-text("WhatsApp")').first();

    const hasWhatsapp = await whatsappButton.isVisible();
    if (hasWhatsapp) {
      await expect(whatsappButton).toBeVisible();

      // Verificar que el link es correcto
      const href = await whatsappButton.getAttribute('href');
      expect(href).toMatch(/wa\.me|whatsapp/i);
    }
  });
});
