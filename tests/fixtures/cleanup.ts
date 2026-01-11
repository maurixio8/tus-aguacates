/**
 * Funciones de limpieza (cleanup) para pruebas E2E
 * Elimina datos de prueba creados durante la ejecución de tests
 */

import { APIRequestContext } from '@playwright/test';
import { AdminAPIHelper } from '../helpers/api-helpers';

/**
 * Limpia productos de prueba creados durante los tests
 * @param request - Contexto de solicitud de API
 * @param productIds - Array de IDs de productos a eliminar
 */
export async function cleanupTestProducts(
  request: APIRequestContext,
  productIds: string[]
): Promise<void> {
  if (!productIds || productIds.length === 0) {
    return;
  }

  const api = new AdminAPIHelper(request);
  const errors: string[] = [];

  for (const productId of productIds) {
    try {
      const response = await api.deleteProduct(productId);

      if (!AdminAPIHelper.isSuccess(response)) {
        const error = await response.text();
        errors.push(`Producto ${productId}: ${error}`);
      }
    } catch (error: any) {
      errors.push(`Producto ${productId}: ${error.message}`);
    }
  }

  // Log errores si los hay (pero no fallar el test por esto)
  if (errors.length > 0) {
    console.warn('⚠️ Errores durante limpieza de productos:', errors);
  }
}

/**
 * Limpia clientes de prueba creados durante los tests
 * @param request - Contexto de solicitud de API
 * @param customerIds - Array de IDs de clientes a eliminar
 */
export async function cleanupTestCustomers(
  request: APIRequestContext,
  customerIds: string[]
): Promise<void> {
  if (!customerIds || customerIds.length === 0) {
    return;
  }

  const api = new AdminAPIHelper(request);
  const errors: string[] = [];

  for (const customerId of customerIds) {
    try {
      const response = await api.deleteCustomer(customerId);

      if (!AdminAPIHelper.isSuccess(response)) {
        const error = await response.text();
        errors.push(`Cliente ${customerId}: ${error}`);
      }
    } catch (error: any) {
      errors.push(`Cliente ${customerId}: ${error.message}`);
    }
  }

  // Log errores si los hay
  if (errors.length > 0) {
    console.warn('⚠️ Errores durante limpieza de clientes:', errors);
  }
}

/**
 * Busca y elimina productos por patrón de nombre
 * Útil para limpiar productos creados en tests que fallaron
 * @param request - Contexto de solicitud de API
 * @param namePattern - Patrón de nombre a buscar (ej: "Test E2E")
 */
export async function cleanupProductsByPattern(
  request: APIRequestContext,
  namePattern: string
): Promise<number> {
  const api = new AdminAPIHelper(request);
  const response = await api.getProducts({ limit: 100 }); // Obtener hasta 100 productos

  if (!AdminAPIHelper.isSuccess(response)) {
    return 0;
  }

  const data = await AdminAPIHelper.getJSON(response);
  const products = data.data || [];

  // Filtrar productos que coinciden con el patrón
  const matchingProducts = products.filter((p: any) =>
    p.name && p.name.includes(namePattern)
  );

  if (matchingProducts.length === 0) {
    return 0;
  }

  // Eliminar productos coincidentes
  const productIds = matchingProducts.map((p: any) => p.id);
  await cleanupTestProducts(request, productIds);

  return matchingProducts.length;
}

/**
 * Busca y elimina clientes por patrón de nombre
 * @param request - Contexto de solicitud de API
 * @param namePattern - Patrón de nombre a buscar
 */
export async function cleanupCustomersByPattern(
  request: APIRequestContext,
  namePattern: string
): Promise<number> {
  const api = new AdminAPIHelper(request);
  const response = await api.getCustomers({ limit: 100 });

  if (!AdminAPIHelper.isSuccess(response)) {
    return 0;
  }

  const data = await AdminAPIHelper.getJSON(response);
  const customers = data.data || [];

  // Filtrar clientes que coinciden con el patrón
  const matchingCustomers = customers.filter((c: any) =>
    c.name && c.name.includes(namePattern)
  );

  if (matchingCustomers.length === 0) {
    return 0;
  }

  // Eliminar clientes coincidentes
  const customerIds = matchingCustomers.map((c: any) => c.id);
  await cleanupTestCustomers(request, customerIds);

  return matchingCustomers.length;
}

/**
 * Limpieza global de todos los datos de prueba E2E
 * Útil para ejecutar antes o después de una suite de tests
 * @param request - Contexto de solicitud de API
 */
export async function globalCleanup(request: APIRequestContext): Promise<{
  productsDeleted: number;
  customersDeleted: number;
}> {
  console.log('🧹 Iniciando limpieza global de datos de prueba...');

  const productsDeleted = await cleanupProductsByPattern(request, 'Test E2E');
  const customersDeleted = await cleanupCustomersByPattern(request, 'Test E2E');

  console.log(`✅ Limpieza completada: ${productsDeleted} productos, ${customersDeleted} clientes eliminados`);

  return {
    productsDeleted,
    customersDeleted,
  };
}

/**
 * Clase para tracking automático de recursos creados durante un test
 */
export class TestResourceTracker {
  private products: string[] = [];
  private customers: string[] = [];

  trackProduct(productId: string): void {
    this.products.push(productId);
  }

  trackCustomer(customerId: string): void {
    this.customers.push(customerId);
  }

  async cleanup(request: APIRequestContext): Promise<void> {
    await Promise.all([
      cleanupTestProducts(request, this.products),
      cleanupTestCustomers(request, this.customers),
    ]);
    this.products = [];
    this.customers = [];
  }

  getTrackedProducts(): string[] {
    return [...this.products];
  }

  getTrackedCustomers(): string[] {
    return [...this.customers];
  }
}
