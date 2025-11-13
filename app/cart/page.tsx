'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';

export default function CartPage() {
  const router = useRouter();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();

  useEffect(() => {
    // If cart is empty, redirect to products page after a short delay
    if (itemCount === 0) {
      const timer = setTimeout(() => {
        router.push('/productos');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [itemCount, router]);

  // If cart is empty, show redirecting message
  if (itemCount === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
          <h1 className="font-display font-bold text-2xl md:text-3xl mb-2">
            Tu carrito está vacío
          </h1>
          <p className="text-gray-600 mb-4">
            Redirigiendo a la tienda...
          </p>
          <button
            onClick={() => router.push('/productos')}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-verde-bosque-700 font-bold px-6 py-3 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl border-2 border-verde-aguacate"
          >
            Ir a la Tienda
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // If cart has items, redirect to checkout
  useEffect(() => {
    if (itemCount > 0) {
      router.push('/checkout');
    }
  }, [itemCount, router]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-verde-bosque mb-4"></div>
        <h1 className="font-display font-bold text-xl mb-2">
          Redirigiendo al checkout...
        </h1>
        <p className="text-gray-600">
          {itemCount} producto{itemCount !== 1 ? 's' : ''} en tu carrito
        </p>
      </div>
    </div>
  );
}