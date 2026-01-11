/**
 * Helpers para llamadas API de administración
 * Proporciona una clase wrapper para interactuar con las APIs del dashboard
 */

import { APIRequestContext, APIResponse } from '@playwright/test';
import { authenticatedRequest } from './auth-helpers';
import { HTTP_STATUS } from '../fixtures/admin';

/**
 * Clase helper para interactuar con la API de administración
 */
export class AdminAPIHelper {
  constructor(private request: APIRequestContext) {}

  /**
   * Obtiene la URL base de la API
   */
  private getBaseURL(): string {
    return process.env.BASE_URL || 'https://tus-aguacates.vercel.app';
  }

  // ==================== PRODUCTOS ====================

  /**
   * Lista productos con filtros opcionales
   */
  async getProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    status?: string;
  } = {}): Promise<APIResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);
    if (params.category) queryParams.set('category', params.category);
    if (params.status) queryParams.set('status', params.status);

    const url = `/api/admin/products${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return authenticatedRequest(this.request, url, 'GET');
  }

  /**
   * Obtiene un producto por ID
   */
  async getProduct(productId: string): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/products/${productId}`, 'GET');
  }

  /**
   * Crea un nuevo producto
   */
  async createProduct(productData: any): Promise<APIResponse> {
    return authenticatedRequest(this.request, '/api/admin/products', 'POST', productData);
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(productId: string, updates: any): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/products/${productId}`, 'PATCH', updates);
  }

  /**
   * Elimina un producto
   */
  async deleteProduct(productId: string): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/products/${productId}`, 'DELETE');
  }

  // ==================== CLIENTES ====================

  /**
   * Lista clientes con filtros opcionales
   */
  async getCustomers(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<APIResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.set('page', params.page.toString());
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.search) queryParams.set('search', params.search);

    const url = `/api/admin/customers/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return authenticatedRequest(this.request, url, 'GET');
  }

  /**
   * Obtiene un cliente por ID
   */
  async getCustomer(customerId: string): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/customers/?id=${customerId}`, 'GET');
  }

  /**
   * Crea un nuevo cliente
   */
  async createCustomer(customerData: any): Promise<APIResponse> {
    return authenticatedRequest(this.request, '/api/admin/customers/', 'POST', customerData);
  }

  /**
   * Actualiza un cliente existente
   */
  async updateCustomer(customerId: string, updates: any): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/customers/?id=${customerId}`, 'PATCH', updates);
  }

  /**
   * Elimina un cliente
   */
  async deleteCustomer(customerId: string): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/customers/?id=${customerId}`, 'DELETE');
  }

  // ==================== MÉTRICAS ====================

  /**
   * Obtiene las métricas del dashboard
   */
  async getMetrics(): Promise<APIResponse> {
    return authenticatedRequest(this.request, '/api/admin/metrics', 'GET');
  }

  /**
   * Obtiene las métricas B2B
   */
  async getB2BMetrics(): Promise<APIResponse> {
    return authenticatedRequest(this.request, '/api/admin/b2b/metrics', 'GET');
  }

  // ==================== CATEGORÍAS ====================

  /**
   * Lista todas las categorías
   */
  async getCategories(): Promise<APIResponse> {
    return authenticatedRequest(this.request, '/api/categories', 'GET');
  }

  /**
   * Obtiene una categoría por ID
   */
  async getCategory(categoryId: string): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/categories/${categoryId}`, 'GET');
  }

  // ==================== VARIANTES ====================

  /**
   * Actualiza una variante de producto
   */
  async updateVariant(variantId: string, updates: {
    price?: number;
    stock_quantity?: number;
    is_active?: boolean;
  }): Promise<APIResponse> {
    return authenticatedRequest(this.request, `/api/admin/variants/${variantId}`, 'PATCH', updates);
  }

  // ==================== UTILIDADES ====================

  /**
   * Verifica si una respuesta fue exitosa
   */
  static isSuccess(response: APIResponse): boolean {
    return response.status() >= HTTP_STATUS.OK && response.status() < HTTP_STATUS.BAD_REQUEST;
  }

  /**
   * Extrae los datos JSON de una respuesta
   */
  static async getJSON(response: APIResponse): Promise<any> {
    return await response.json();
  }

  /**
   * Obtiene el primer ID de una lista de productos
   */
  async getFirstProductId(): Promise<string | null> {
    const response = await this.getProducts({ limit: 1 });
    if (AdminAPIHelper.isSuccess(response)) {
      const data = await AdminAPIHelper.getJSON(response);
      return data.data?.[0]?.id || null;
    }
    return null;
  }

  /**
   * Obtiene el primer ID de una lista de clientes
   */
  async getFirstCustomerId(): Promise<string | null> {
    const response = await this.getCustomers({ limit: 1 });
    if (AdminAPIHelper.isSuccess(response)) {
      const data = await AdminAPIHelper.getJSON(response);
      return data.data?.[0]?.id || null;
    }
    return null;
  }
}

/**
 * Función helper para obtener una categoría válida para tests
 */
export async function getValidCategoryId(request: APIRequestContext): Promise<string | null> {
  const api = new AdminAPIHelper(request);
  const response = await api.getCategories();

  if (AdminAPIHelper.isSuccess(response)) {
    const data = await AdminAPIHelper.getJSON(response);
    const categories = data.categories || data.data || data;
    if (Array.isArray(categories) && categories.length > 0) {
      return categories[0].id;
    }
  }

  return null;
}
