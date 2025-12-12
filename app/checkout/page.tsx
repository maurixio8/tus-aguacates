'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useCartStore } from '@/lib/cart-store';
import { ShoppingBag } from 'lucide-react';
import { GuestCheckoutForm } from '@/components/checkout/GuestCheckoutForm';
import { AuthenticatedCheckoutForm } from '@/components/checkout/AuthenticatedCheckoutForm';
import { EnhancedAuthenticatedCheckoutForm } from '@/components/checkout/EnhancedAuthenticatedCheckoutForm';
import { supabase, Profile } from '@/lib/supabase';
import { getDisplayName } from '@/lib/greetings';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    }

    loadProfile();
  }, [user]);

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
              {user ? `Bienvenido ${getDisplayName(profile, user)}` : 'Completa tu información para continuar'}
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {!user ? (
              <GuestCheckoutForm onSuccess={handleOrderSuccess} />
            ) : (
              <EnhancedAuthenticatedCheckoutForm
                onSuccess={handleOrderSuccess}
                profile={profile}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
