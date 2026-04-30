import { beforeEach, describe, expect, it } from 'vitest';
import { useCartStore } from '@/lib/cart-store';

const baseProduct = {
  id: 'prod-baseline',
  name: 'Aguacate Hass',
  description: 'Producto de prueba',
  price: 10000,
  discount_price: 8500,
  unit: 'unidad',
  stock: 30,
  main_image_url: 'aguacate.jpg',
  rating: 5,
  review_count: 2,
  slug: 'aguacate-hass',
  category_id: 'cat-1',
  is_active: true,
  is_featured: false,
  reserved_stock: 0,
  min_quantity: 1,
  weight: 200,
  benefits: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

describe('cart-store baseline', () => {
  beforeEach(() => {
    useCartStore.getState().clearCart();
    useCartStore.getState().setPaymentMethod('cash');
  });

  it('prioritizes discount price when adding products', () => {
    const store = useCartStore.getState();

    store.addItem(baseProduct, 2);
    const updatedStore = useCartStore.getState();

    expect(updatedStore.items).toHaveLength(1);
    expect(updatedStore.items[0].price).toBe(8500);
    expect(updatedStore.getSubtotal()).toBe(17000);
  });

  it('adds payment fee only for methods that require it', () => {
    const store = useCartStore.getState();
    store.addItem(baseProduct, 1);

    store.setPaymentMethod('pse');
    // Bold fee is calculated over subtotal + shipping.
    expect(store.getTotals().paymentFee).toBe(636);

    store.setPaymentMethod('cash');
    expect(store.getTotals().paymentFee).toBe(0);
  });

  it('resets cart data but keeps safe default shipping values', () => {
    const store = useCartStore.getState();
    store.addItem(baseProduct, 3);

    store.clearCart();

    expect(store.items).toHaveLength(0);
    expect(store.getSubtotal()).toBe(0);
    expect(store.shipping.cost).toBe(7400);
    expect(store.shipping.freeShipping).toBe(false);
    expect(store.shipping.amountForFreeShipping).toBe(68900);
  });
});
