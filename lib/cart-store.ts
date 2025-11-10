import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './supabase';

export interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price: number;
}

export interface CartItemWithProduct {
  product: Product;
  quantity: number;
  price: number;
  variant?: ProductVariant;
}

interface CartState {
  items: CartItemWithProduct[];
  isOpen: boolean;
  addItem: (product: Product & { variant?: ProductVariant }, quantity?: number) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      
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
        set({ items: [] });
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
    }),
    {
      name: 'tus-aguacates-cart',
    }
  )
);
