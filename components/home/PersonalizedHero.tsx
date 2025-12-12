'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { getUserStats } from '@/lib/recommendations';
import Link from 'next/link';
import { ShoppingBag, TrendingUp } from 'lucide-react';
import { supabase, Profile } from '@/lib/supabase';
import { getDashboardGreeting } from '@/lib/greetings';

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  favoriteCategory: string;
}

export function PersonalizedHero() {
  const { user, loading } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    async function loadStats() {
      if (user) {
        setStatsLoading(true);
        try {
          const stats = await getUserStats(user.id);
          setUserStats(stats);
        } catch (error) {
          console.error('Error loading user stats:', error);
        } finally {
          setStatsLoading(false);
        }
      }
    }

    loadStats();
  }, [user]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      setProfileLoading(true);
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  if (loading || statsLoading || profileLoading) {
    return (
      <section className="bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // User is authenticated - show personalized hero
  if (user && userStats) {
    return (
      <section className="bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-display font-bold text-verde-bosque-700 mb-3">
                {getDashboardGreeting(profile, user)}
              </h1>
              <p className="text-xl text-gray-700">
                Bienvenido de vuelta a Tus Aguacates
              </p>
            </div>

            {/* User Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-verde-aguacate" />
                <p className="text-3xl font-bold text-verde-bosque-700">
                  {userStats.totalOrders}
                </p>
                <p className="text-sm text-gray-600">
                  {userStats.totalOrders === 1 ? 'Pedido realizado' : 'Pedidos realizados'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-3xl font-bold text-verde-bosque-700">
                  ${Math.round(userStats.totalSpent).toLocaleString('es-CO')}
                </p>
                <p className="text-sm text-gray-600">Total invertido</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <span className="text-3xl mb-2 block">❤️</span>
                <p className="text-lg font-bold text-verde-bosque-700">
                  {userStats.favoriteCategory}
                </p>
                <p className="text-sm text-gray-600">Categoría favorita</p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/productos"
                className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate text-center"
              >
                Explorar Productos
              </Link>
              <Link
                href="/cuenta"
                className="bg-white text-verde-bosque-700 hover:bg-gray-50 font-bold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg border-2 border-verde-aguacate text-center"
              >
                Ver Mi Cuenta
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Guest user - show default hero
  return (
    <section className="bg-gradient-to-br from-green-50 via-yellow-50 to-green-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold text-verde-bosque-700 mb-6">
            Del Corazón de Colombia a tu Mesa
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8">
            Aguacates frescos, frutas y verduras de la mejor calidad
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/productos"
              className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-verde-bosque-700 hover:from-yellow-500 hover:to-yellow-700 font-bold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-verde-aguacate"
            >
              Explorar Productos
            </Link>
            <Link
              href="/auth/register"
              className="bg-white text-verde-bosque-700 hover:bg-gray-50 font-bold px-8 py-4 rounded-xl transition-all shadow-md hover:shadow-lg border-2 border-verde-aguacate"
            >
              Crear Cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
