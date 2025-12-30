import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UnifiedProduct } from './types';

/**
 * CARRITO INDEPENDIENTE PARA EMPRESAS (B2B)
 *
 * Este store es completamente independiente del carrito retail.
 * - Persistencia separada: 'tus-aguacates-business-cart'
 * - Lógica de envío diferente para B2B
 * - Soporte para cantidades grandes (kg)
 */

/**
 * Información de envío para empresas
 * Los pedidos B2B tienen condiciones diferentes
 */
const getBusinessShippingInfo = (subtotal: number = 0): BusinessShippingInfo => {
  // Envío gratis para pedidos mayores a $500,000
  const freeShippingMin = 500000;
  const shippingCost = 25000; // Costo de envío B2B más alto por volumen
  const freeShipping = subtotal > freeShippingMin;

  console.log('🏢 getBusinessShippingInfo:', {
    subtotal,
    freeShippingMin,
    shippingCost,
    freeShipping,
  });

  return {
    cost: freeShipping ? 0 : shippingCost,
    freeShipping,
    freeShippingMin,
    amountForFreeShipping: freeShipping ? 0 : Math.max(0, freeShippingMin - subtotal),
    estimatedDays: 1, // Entregas B2B más rápidas
    message: freeShipping
      ? '¡Envío GRATIS para tu empresa!'
      : `Envío: $${shippingCost.toLocaleString('es-CO')} (Gratis desde $${freeShippingMin.toLocaleString('es-CO')})`
  };
};

export interface BusinessProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price: number;
  min_quantity?: number; // Cantidad mínima para esta variante (ej: 5kg)
  max_quantity?: number; // Cantidad máxima para esta variante (ej: 20kg)
  price_tier?: 'tier1' | 'tier2' | 'tier3'; // Nivel de precio por volumen
}

export interface BusinessCartItemWithProduct {
  product: UnifiedProduct;
  quantity: number; // En kg o unidades según el producto
  price: number;
  variant?: BusinessProductVariant;
  unit: string; // 'kg' | 'unidad' | 'paquete' | 'bandeja'
}

export interface BusinessShippingInfo {
  cost: number;
  freeShipping: boolean;
  freeShippingMin: number;
  amountForFreeShipping: number;
  estimatedDays: number;
  message: string;
}

export interface BusinessCartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  totalWeight: number; // Peso total en kg
}

interface BusinessCartState {
  items: BusinessCartItemWithProduct[];
  isOpen: boolean;
  shipping: BusinessShippingInfo;

  // Acciones
  addItem: (product: UnifiedProduct & { variant?: BusinessProductVariant }, quantity?: number, unit?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Cálculos
  getTotal: () => number;
  getItemCount: () => number;
  getSubtotal: () => number;
  getTotalWeight: () => number;
  getTotals: () => BusinessCartTotals;

  // Envío
  calculateShipping: () => void;
}

export const useBusinessCartStore = create<BusinessCartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      shipping: getBusinessShippingInfo(0),

      addItem: (product, quantity = 1, unit = 'kg') => {
        set((state) => {
          // Buscar item existente considerando variante
          const itemKey = product.variant
            ? `${product.id}-${product.variant.id}`
            : product.id;

          const existingItem = state.items.find((item) => {
            const existingKey = item.variant
              ? `${item.product.id}-${item.variant.id}`
              : item.product.id;
            return existingKey === itemKey;
          });

          if (existingItem) {
            const newItems = state.items.map((item) => {
              const existingKey = item.variant
                ? `${item.product.id}-${item.variant.id}`
                : item.product.id;
              return existingKey === itemKey
                ? { ...item, quantity: item.quantity + quantity }
                : item;
            });

            // Recalcular envío después de agregar
            const newSubtotal = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

            return {
              items: newItems,
              shipping: getBusinessShippingInfo(newSubtotal),
            };
          }

          const newItems = [
            ...state.items,
            {
              product,
              quantity,
              price: product.variant?.price || product.discount_price || product.price,
              variant: product.variant,
              unit: unit || product.unit || 'kg'
            },
          ];

          // Recalcular envío después de agregar
          const newSubtotal = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

          return {
            items: newItems,
            shipping: getBusinessShippingInfo(newSubtotal),
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => {
          const newItems = state.items.filter((item) => {
            if (variantId) {
              return !(item.product.id === productId && item.variant?.id === variantId);
            }
            return item.product.id !== productId;
          });

          const newSubtotal = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

          return {
            items: newItems,
            shipping: getBusinessShippingInfo(newSubtotal),
          };
        });
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) => {
            if (variantId) {
              return item.product.id === productId && item.variant?.id === variantId
                ? { ...item, quantity }
                : item;
            }
            return item.product.id === productId
              ? { ...item, quantity }
              : item;
          });

          const newSubtotal = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

          return {
            items: newItems,
            shipping: getBusinessShippingInfo(newSubtotal),
          };
        });
      },

      clearCart: () => {
        set({ items: [], shipping: getBusinessShippingInfo(0) });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotal: () => {
        const state = get();
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        const state = get();
        return state.items.reduce((count, item) => count + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().getTotal();
      },

      getTotalWeight: () => {
        const state = get();
        return state.items.reduce((weight, item) => {
          // Si la unidad es kg, sumar directamente
          if (item.unit === 'kg') {
            return weight + item.quantity;
          }
          // Para otras unidades, estimar peso (1 unidad ≈ 0.5kg promedio)
          return weight + (item.quantity * 0.5);
        }, 0);
      },

      getTotals: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const shipping = state.shipping.cost;
        const totalWeight = state.getTotalWeight();

        return {
          subtotal,
          discount: 0, // Por ahora sin cupones para B2B
          shipping,
          total: Math.max(0, subtotal + shipping),
          totalWeight
        };
      },

      calculateShipping: () => {
        const subtotal = get().getSubtotal();
        set({ shipping: getBusinessShippingInfo(subtotal) });
      },
    }),
    {
      name: 'tus-aguacates-business-cart', // Clave diferente para B2B
    }
  )
);
