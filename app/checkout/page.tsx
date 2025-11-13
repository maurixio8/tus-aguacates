'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingBag } from 'lucide-react';
import { GuestCheckoutForm } from '@/components/checkout/GuestCheckoutForm';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirigir si carrito vacío
  useEffect(() => {
    if (mounted && !authLoading && items.length === 0) {
      router.push('/productos');
    }
  }, [mounted, authLoading, items, router]);

  const handleOrderSuccess = (orderId: string) => {
    router.push(`/checkout/confirmacion?order=${orderId}`);
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-verde-aguacate mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const total = getTotal();

  return (
    <div className="min-h-screen bg-gradient-suave py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
              Finalizar Pedido
            </h1>
            <p className="text-gray-600">
              {user ? `Bienvenido ${user.email}` : 'Completa tu información para continuar'}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {!user ? (
              <GuestCheckoutForm onSuccess={handleOrderSuccess} />
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  Funcionalidad de checkout para usuarios registrados en desarrollo
                </p>
                <button
                  onClick={() => router.push('/productos')}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
                >
                  Volver a Productos
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
