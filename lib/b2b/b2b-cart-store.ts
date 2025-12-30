/**
 * Carrito de Compras B2B con Zustand
 * "Tus Aguacates" - E-commerce Platform
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  B2BProduct,
  B2BPricingTier,
  B2BCartItem,
  GuestContactInfo,
} from './b2b-types';
import {
  calculatePriceForQuantity,
  formatPrice,
} from './b2b-pricing';

/**
 * Estado del Carrito B2B
 */
interface B2BCartState {
  // Items del carrito
  items: B2BCartItem[];

  // Información de empresa/usuario
  company_id: string | null;
  is_guest: boolean;
  guest_info: GuestContactInfo | null;

  // Configuración
  minimum_order_amount: number;

  // Actions
  addItem: (product: B2BProduct, quantity: number) => void;
  removeItem: (product_id: string) => void;
  updateQuantity: (product_id: string, quantity: number) => void;
  clearCart: () => void;
  setCompany: (company_id: string | null) => void;
  setGuestInfo: (info: GuestContactInfo) => void;
  setIsGuest: (is_guest: boolean) => void;
  setMinimumOrderAmount: (amount: number) => void;

  // Getters
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotal: () => number;
  getTotalItems: () => number;
  meetsMinimumOrder: () => boolean;
  getAppliedTiers: () => B2BPricingTier[];
  getItemById: (product_id: string) => B2BCartItem | undefined;
}

/**
 * Store del Carrito B2B usando Zustand con persistencia en localStorage
 */
export const useB2BCartStore = create<B2BCartState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      items: [],
      company_id: null,
      is_guest: true,
      guest_info: null,
      minimum_order_amount: 100000, // $100,000 COP por defecto

      // Agregar item al carrito
      addItem: (product: B2BProduct, quantity: number) => {
        const state = get();

        // Validar cantidad mínima del producto
        if (quantity < product.minimum_order_quantity) {
          throw new Error(
            `La cantidad mínima para ${product.name} es ${product.minimum_order_quantity} ${product.unit}`
          );
        }

        // Validar stock disponible
        if (quantity > product.stock_quantity) {
          throw new Error(
            `Stock insuficiente. Solo hay ${product.stock_quantity} disponibles de ${product.name}`
          );
        }

        // Calcular pricing tier aplicable
        const pricingResult = calculatePriceForQuantity(product, quantity);

        // Buscar si el producto ya existe en el carrito
        const existingItemIndex = state.items.findIndex(
          (item) => item.product_id === product.id
        );

        if (existingItemIndex >= 0) {
          // Actualizar cantidad del item existente
          const existingItem = state.items[existingItemIndex];
          const newQuantity = existingItem.quantity + quantity;

          // Validar stock nuevamente con la nueva cantidad
          if (newQuantity > product.stock_quantity) {
            throw new Error(
              `Stock insuficiente. Solo hay ${product.stock_quantity} disponibles de ${product.name}`
            );
          }

          // Recalcular pricing con la nueva cantidad
          const newPricingResult = calculatePriceForQuantity(product, newQuantity);

          const updatedItem: B2BCartItem = {
            ...existingItem,
            quantity: newQuantity,
            unit_price: newPricingResult.unit_price,
            applied_tier: newPricingResult.tier,
            subtotal: newPricingResult.total_price,
            discount_percentage: newPricingResult.discount_percentage,
          };

          set((state) => ({
            items: state.items.map((item, index) =>
              index === existingItemIndex ? updatedItem : item
            ),
          }));
        } else {
          // Agregar nuevo item
          const newItem: B2BCartItem = {
            product_id: product.id,
            product,
            quantity,
            unit_price: pricingResult.unit_price,
            applied_tier: pricingResult.tier,
            subtotal: pricingResult.total_price,
            discount_percentage: pricingResult.discount_percentage,
          };

          set((state) => ({
            items: [...state.items, newItem],
          }));
        }
      },

      // Remover item del carrito
      removeItem: (product_id: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product_id !== product_id),
        }));
      },

      // Actualizar cantidad de un item
      updateQuantity: (product_id: string, quantity: number) => {
        const state = get();
        const item = state.items.find((i) => i.product_id === product_id);

        if (!item) {
          throw new Error('Producto no encontrado en el carrito');
        }

        // Validar cantidad mínima
        if (quantity < item.product.minimum_order_quantity) {
          throw new Error(
            `La cantidad mínima para ${item.product.name} es ${item.product.minimum_order_quantity} ${item.product.unit}`
          );
        }

        // Validar stock
        if (quantity > item.product.stock_quantity) {
          throw new Error(
            `Stock insuficiente. Solo hay ${item.product.stock_quantity} disponibles de ${item.product.name}`
          );
        }

        // Si la cantidad es 0, remover el item
        if (quantity === 0) {
          get().removeItem(product_id);
          return;
        }

        // Recalcular pricing
        const pricingResult = calculatePriceForQuantity(item.product, quantity);

        set((state) => ({
          items: state.items.map((item) =>
            item.product_id === product_id
              ? {
                  ...item,
                  quantity,
                  unit_price: pricingResult.unit_price,
                  applied_tier: pricingResult.tier,
                  subtotal: pricingResult.total_price,
                  discount_percentage: pricingResult.discount_percentage,
                }
              : item
          ),
        }));
      },

      // Limpiar carrito
      clearCart: () => {
        set({
          items: [],
          company_id: null,
          is_guest: true,
          guest_info: null,
        });
      },

      // Establecer empresa
      setCompany: (company_id: string | null) => {
        set({ company_id, is_guest: false });
      },

      // Establecer información de guest
      setGuestInfo: (info: GuestContactInfo) => {
        set({ guest_info: info, is_guest: true });
      },

      // Establecer modo guest
      setIsGuest: (is_guest: boolean) => {
        set({ is_guest });
      },

      // Establecer monto mínimo de pedido
      setMinimumOrderAmount: (amount: number) => {
        set({ minimum_order_amount: amount });
      },

      // Obtener subtotal (sin descuentos)
      getSubtotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          return sum + (item.product.base_price * item.quantity);
        }, 0);
      },

      // Obtener total de descuentos
      getTotalDiscount: () => {
        const state = get();
        return state.items.reduce((sum, item) => {
          const baseTotal = item.product.base_price * item.quantity;
          return sum + (baseTotal - item.subtotal);
        }, 0);
      },

      // Obtener total con descuentos
      getTotal: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      // Obtener número total de items
      getTotalItems: () => {
        const state = get();
        return state.items.reduce((sum, item) => sum + item.quantity, 0);
      },

      // Verificar si cumple con monto mínimo
      meetsMinimumOrder: () => {
        const state = get();
        const total = state.getTotal();
        return total >= state.minimum_order_amount;
      },

      // Obtener tiers aplicados
      getAppliedTiers: () => {
        const state = get();
        const tiers: B2BPricingTier[] = [];
        state.items.forEach((item) => {
          if (item.applied_tier) {
            tiers.push(item.applied_tier);
          }
        });
        return tiers;
      },

      // Obtener item por ID
      getItemById: (product_id: string) => {
        const state = get();
        return state.items.find((item) => item.product_id === product_id);
      },
    }),
    {
      name: 'b2b-cart-storage', // Nombre de la clave en localStorage
      partialize: (state) => ({
        items: state.items,
        company_id: state.company_id,
        is_guest: state.is_guest,
        guest_info: state.guest_info,
        minimum_order_amount: state.minimum_order_amount,
      }),
    }
  )
);

/**
 * Hook auxiliar para obtener información del carrito formateada
 */
export function useB2BCartSummary() {
  const subtotal = useB2BCartStore((state) => state.getSubtotal());
  const totalDiscount = useB2BCartStore((state) => state.getTotalDiscount());
  const total = useB2BCartStore((state) => state.getTotal());
  const totalItems = useB2BCartStore((state) => state.getTotalItems());
  const minimumOrder = useB2BCartStore((state) => state.minimum_order_amount);
  const meetsMinimum = useB2BCartStore((state) => state.meetsMinimumOrder());
  const appliedTiers = useB2BCartStore((state) => state.getAppliedTiers());

  return {
    subtotal: formatPrice(subtotal),
    totalDiscount: formatPrice(totalDiscount),
    total: formatPrice(total),
    totalItems,
    minimumOrder: formatPrice(minimumOrder),
    meetsMinimum,
    appliedTiersCount: appliedTiers.length,
    remainingForMinimum: meetsMinimum
      ? 0
      : minimumOrder - total,
    remainingForMinimumFormatted: meetsMinimum
      ? '0'
      : formatPrice(minimumOrder - total),
  };
}
