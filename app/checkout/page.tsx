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

          <div className="grid md:grid-cols-3 gap-6">
            {/* Formulario */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow-soft p-6">
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

            {/* Resumen del Pedido */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow-soft p-6 sticky top-4">
                <h2 className="font-bold text-lg mb-4">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-4">
                  {items.map((item) => {
                    const itemKey = item.variant 
                      ? `${item.product.id}-${item.variant.id}`
                      : item.product.id;
                    
                    return (
                      <div key={itemKey} className="flex justify-between text-sm">
                        <div className="flex-1">
                          <p className="font-medium">{item.product.name}</p>
                          {item.variant && (
                            <p className="text-xs text-gray-600">{item.variant.variant_value}</p>
                          )}
                          <p className="text-gray-600">Cantidad: {item.quantity}</p>
                        </div>
                        <div className="font-bold text-verde-bosque">
                          ${(item.price * item.quantity).toLocaleString('es-CO')}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span>Subtotal</span>
                    <span className="font-bold">${total.toLocaleString('es-CO')}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Envío</span>
                    <span className="text-green-600 font-semibold">GRATIS</span>
                  </div>
                  <div className="border-t mt-3 pt-3 flex justify-between text-lg">
                    <span className="font-bold">TOTAL</span>
                    <span className="font-bold text-verde-bosque text-2xl">
                      ${total.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <ShoppingBag className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-green-800">Envío Gratis</p>
                      <p className="text-green-700">Entregas martes y viernes en Bogotá</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
