'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Heart, LogIn, Menu, X, Home, Tag } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import branding from '@/lib/config/branding';
import { SearchModal } from '../search/SearchModal';
import { supabase, Profile } from '@/lib/supabase';
import { getHeaderGreeting } from '@/lib/greetings';

export function Header() {
  const { getItemCount, toggleCart } = useCartStore();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const itemCount = getItemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfile(null);
        return;
      }

      setLoadingProfile(true);
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, [user]);

  // Cerrar menú móvil al cambiar de página
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="bg-verde-bosque text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center" onClick={closeMobileMenu}>
              <img
                src={branding.logo.url}
                alt={branding.logo.alt}
                width={branding.logo.width}
                height={branding.logo.height}
                className="object-contain h-10 md:h-12 w-auto"
              />
            </Link>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/tienda/ofertas-combos"
                className="flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold px-4 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg animate-pulse hover:animate-none"
              >
                <span>🔥</span>
                <span>Ofertas</span>
              </Link>
              <Link href="/tienda/aguacates" className="hover:text-verde-aguacate-200 transition-colors">
                Aguacates
              </Link>
              <Link href="/tienda/frutas-tropicales" className="hover:text-verde-aguacate-200 transition-colors">
                Frutas Tropicales
              </Link>
              <Link href="/categorias" className="hover:text-verde-aguacate-200 transition-colors">
                Más Categorías
              </Link>
            </nav>

            {/* Acciones Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="hover:text-verde-aguacate-200 transition-colors"
                aria-label="Buscar productos"
              >
                <Search className="w-5 h-5" />
              </button>

              <Link href="/cuenta#favoritos" className="hover:text-verde-aguacate-200 transition-colors">
                <Heart className="w-5 h-5" />
              </Link>

              {user ? (
                <Link
                  href="/cuenta"
                  className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-2"
                  title="Mi Cuenta"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden lg:inline text-sm">
                    {loadingProfile ? 'Cargando...' : getHeaderGreeting(profile, user)}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-2"
                  title="Iniciar Sesión"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden lg:inline text-sm">
                    Iniciar Sesión
                  </span>
                </Link>
              )}

              <button
                onClick={toggleCart}
                className="relative hover:text-verde-aguacate-200 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-naranja-frutal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Acciones Móvil */}
            <div className="flex md:hidden items-center space-x-3">
              {/* Buscar */}
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Carrito */}
              <button
                onClick={toggleCart}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-naranja-frutal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Hamburguesa */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-verde-bosque-800 border-t border-white/10">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-1">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Inicio</span>
                </Link>

                <Link
                  href="/categorias"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  <span>Categorías</span>
                </Link>

                <Link
                  href="/tienda/aguacates"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🥑</span>
                  <span>Aguacates</span>
                </Link>

                <Link
                  href="/tienda/frutas-tropicales"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🍊</span>
                  <span>Frutas Tropicales</span>
                </Link>

                <Link
                  href="/tienda/ofertas-combos"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🔥</span>
                  <span>Ofertas y Combos</span>
                </Link>

                <div className="border-t border-white/10 my-2" />

                <Link
                  href="/cuenta#favoritos"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Heart className="w-5 h-5" />
                  <span>Favoritos</span>
                </Link>

                {user ? (
                  <Link
                    href="/cuenta"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Mi Cuenta</span>
                  </Link>
                ) : (
                  <Link
                    href="/auth/login"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <LogIn className="w-5 h-5" />
                    <span>Iniciar Sesión</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}