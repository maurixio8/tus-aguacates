import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UnifiedProduct, Product } from './types';

/**
 * Default shipping information fallback
 */
const getDefaultShippingInfo = (subtotal: number = 0): ShippingInfo => {
  const freeShippingMin = 68900;
  const shippingCost = 7400;
  const freeShipping = subtotal > freeShippingMin; // Changed from >= to >

  console.log('🚚 getDefaultShippingInfo:', {
    subtotal,
    freeShippingMin,
    shippingCost,
    freeShipping,
    comparison: `subtotal (${subtotal}) > freeShippingMin (${freeShippingMin}) = ${subtotal > freeShippingMin}`
  });

  return {
    cost: freeShipping ? 0 : shippingCost,
    freeShipping,
    freeShippingMin,
    amountForFreeShipping: freeShipping ? 0 : Math.max(0, freeShippingMin - subtotal),
    estimatedDays: freeShipping ? 2 : 1,
    message: freeShipping ? '¡Envío GRATIS en tu pedido!' : 'Envío: $7.400'
  };
};

export interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price: number;
}

export interface CartItemWithProduct {
  product: UnifiedProduct;
  quantity: number;
  price: number;
  variant?: ProductVariant;
}

export interface AppliedCoupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  min_purchase: number;
  free_shipping: boolean;
}

export interface ShippingInfo {
  cost: number;
  freeShipping: boolean;
  freeShippingMin: number;
  amountForFreeShipping: number;
  estimatedDays: number;
  message: string;
}

export interface CartTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

interface CartState {
  items: CartItemWithProduct[];
  isOpen: boolean;
  appliedCoupon: AppliedCoupon | null;
  shipping: ShippingInfo;
  addItem: (product: UnifiedProduct & { variant?: ProductVariant }, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getSubtotal: () => number;
  applyCoupon: (code: string, userEmail?: string) => Promise<boolean>;
  removeCoupon: () => void;
  calculateShipping: (location?: string) => Promise<void>;
  getTotals: () => CartTotals;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      shipping: getDefaultShippingInfo(0),

      addItem: (product, quantity = 1) => {
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
            return {
              items: state.items.map((item) => {
                const existingKey = item.variant
                  ? `${item.product.id}-${item.variant.id}`
                  : item.product.id;
                return existingKey === itemKey
                  ? { ...item, quantity: item.quantity + quantity }
                  : item;
              }),
            };
          }

          return {
            items: [
              ...state.items,
              {
                product,
                quantity,
                price: product.variant?.price || product.discount_price || product.price,
                variant: product.variant
              },
            ],
          };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter((item) => {
            if (variantId) {
              return !(item.product.id === productId && item.variant?.id === variantId);
            }
            return item.product.id !== productId;
          }),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId);
          return;
        }

        set((state) => ({
          items: state.items.map((item) => {
            if (variantId) {
              return item.product.id === productId && item.variant?.id === variantId
                ? { ...item, quantity }
                : item;
            }
            return item.product.id === productId
              ? { ...item, quantity }
              : item;
          }),
        }));
      },

      clearCart: () => {
        set({ items: [], appliedCoupon: null, shipping: getDefaultShippingInfo(0) });
      },

      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
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

      applyCoupon: async (code: string, userEmail?: string) => {
        try {
          console.log('🎫 Applying coupon:', { code, userEmail });
          const subtotal = get().getSubtotal();

          const response = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}&cartTotal=${subtotal}&userEmail=${encodeURIComponent(userEmail || '')}`);
          const data = await response.json();

          console.log('📊 Coupon validation response:', data);

          if (data.success) {
            set({ appliedCoupon: data.coupon });

            // If coupon includes free shipping, recalculate shipping
            if (data.coupon.free_shipping || data.coupon.discount_amount >= subtotal) {
              await get().calculateShipping();
            }

            return true;
          } else {
            console.log('❌ Coupon validation failed:', data.error);
            return false;
          }
        } catch (error) {
          console.error('❌ Error applying coupon:', error);
          return false;
        }
      },

      removeCoupon: () => {
        set({ appliedCoupon: null });
        // Recalculate shipping when coupon is removed
        get().calculateShipping();
      },

      calculateShipping: async (location = 'Bogotá') => {
        try {
          console.log('📦 Calculating shipping:', { location, subtotal: get().getSubtotal() });
          const subtotal = get().getSubtotal();

          // Validate subtotal - don't call API if cart is empty or subtotal is 0
          if (typeof subtotal !== 'number' || subtotal < 0 || !isFinite(subtotal) || subtotal === 0) {
            console.log('📦 Cart is empty or subtotal is 0, using default shipping:', { subtotal });
            set({ shipping: getDefaultShippingInfo(subtotal) });
            return;
          }

          console.log('📦 Enviando a shipping API:', {
          subtotal,
          subtotalType: typeof subtotal,
          location,
          url: '/api/shipping/calculate'
        });

        const response = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subtotal,
              location
            })
        });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Shipping calculation error:', errorData);
            console.error('❌ Response status:', response.status);
            console.error('❌ Response text:', await response.text());
            throw new Error(`❌ Shipping API Error ${response.status}: ${errorData.error || 'Unknown error'}`);
          }

          const data = await response.json();
          console.log('📊 Shipping calculation response:', data);

          if (data.success && data.shipping && typeof data.shipping === 'object') {
            // Validate response structure
            const shippingInfo: ShippingInfo = {
              cost: typeof data.shipping.cost === 'number' && data.shipping.cost >= 0 ? data.shipping.cost : 7400,
              freeShipping: Boolean(data.shipping.freeShipping),
              freeShippingMin: typeof data.shipping.freeShippingMin === 'number' && data.shipping.freeShippingMin >= 0 ? data.shipping.freeShippingMin : 68900,
              amountForFreeShipping: typeof data.shipping.amountForFreeShipping === 'number' && data.shipping.amountForFreeShipping >= 0 ? data.shipping.amountForFreeShipping : Math.max(0, 68900 - subtotal),
              estimatedDays: typeof data.shipping.estimatedDays === 'number' && data.shipping.estimatedDays > 0 ? data.shipping.estimatedDays : 1,
              message: typeof data.shipping.message === 'string' ? data.shipping.message : 'Envío: $7.400'
            };

            set({ shipping: shippingInfo });
          } else if (!data.success) {
            console.error('❌ Shipping calculation failed (API returned success=false):', data);
            console.error('❌ API Response:', JSON.stringify(data, null, 2));
            set({ shipping: getDefaultShippingInfo(subtotal) });
          } else if (!data.shipping) {
            console.error('❌ Shipping calculation failed (missing shipping object):', data);
            set({ shipping: getDefaultShippingInfo(subtotal) });
          }
        } catch (error) {
          console.error('❌ Error calculating shipping:', error);
          const subtotal = get().getSubtotal();
          console.log('🚚 Falling back to default shipping with subtotal:', subtotal);
          set({ shipping: getDefaultShippingInfo(subtotal) });
        }
      },

      getTotals: () => {
        const state = get();
        const subtotal = state.getSubtotal();
        const discount = state.appliedCoupon?.discount_amount || 0;
        const shipping = state.shipping.cost;

        return {
          subtotal,
          discount,
          shipping,
          total: Math.max(0, subtotal - discount + shipping)
        };
      },
    }),
    {
      name: 'tus-aguacates-cart',
    }
  )
);
