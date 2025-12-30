'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, LogIn, LogOut, Menu, X, Home, Building2, Phone, Mail } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import branding from '@/lib/config/branding';
import { SearchModal } from '../search/SearchModal';

export function BusinessHeader() {
  const { getItemCount, toggleCart } = useCartStore();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = getItemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  async function handleSignOut() {
    try {
      await signOut();
      setMobileMenuOpen(false);
      router.push('/');
    } catch (error) {
      console.error('Error cerrando sesión:', error);
    }
  }

  return (
    <>
      <header className="bg-gradient-to-r from-orange-600 to-amber-600 text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/empresas" className="flex items-center gap-2" onClick={closeMobileMenu}>
              <img
                src={branding.logo.url}
                alt={branding.logo.alt}
                width={branding.logo.width}
                height={branding.logo.height}
                className="object-contain h-10 md:h-12 w-auto"
              />
              <span className="hidden md:inline font-bold text-sm bg-white/20 px-3 py-1 rounded-full">
                Empresas
              </span>
            </Link>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/empresas" className="hover:text-orange-200 transition-colors font-semibold">
                Inicio
              </Link>
              <Link href="/empresas/aguacates" className="hover:text-orange-200 transition-colors">
                Aguacates
              </Link>
              <Link href="/empresas/frutas-tropicales" className="hover:text-orange-200 transition-colors">
                Frutas Tropicales
              </Link>
              <Link href="/empresas/frutos-rojos" className="hover:text-orange-200 transition-colors">
                Frutos Rojos
              </Link>
              <a
                href="mailto:empresas@tusaguacates.com"
                className="flex items-center gap-2 bg-white text-orange-600 hover:bg-orange-50 font-bold px-4 py-2 rounded-full transition-all transform hover:scale-105 shadow-lg"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden lg:inline">Contacto</span>
              </a>
            </nav>

            {/* Acciones Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="hover:text-orange-200 transition-colors"
                aria-label="Buscar productos"
              >
                <Search className="w-5 h-5" />
              </button>

              {user ? (
                <Link
                  href="/cuenta"
                  className="hover:text-orange-200 transition-colors flex items-center gap-2"
                  title="Mi Cuenta"
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hover:text-orange-200 transition-colors flex items-center gap-2"
                  title="Iniciar Sesión"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden lg:inline text-sm">Iniciar Sesión</span>
                </Link>
              )}

              <button
                onClick={toggleCart}
                className="relative hover:text-orange-200 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Link a tienda normal */}
              <Link
                href="/tienda"
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              >
                Tienda Retail
              </Link>
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
                  <span className="absolute top-0 right-0 bg-white text-orange-600 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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
          <div className="md:hidden bg-orange-700 border-t border-white/10">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-1">
                <Link
                  href="/empresas"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Inicio Empresas</span>
                </Link>

                <Link
                  href="/empresas/aguacates"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🥑</span>
                  <span>Aguacates</span>
                </Link>

                <Link
                  href="/empresas/frutas-tropicales"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🍊</span>
                  <span>Frutas Tropicales</span>
                </Link>

                <Link
                  href="/empresas/frutos-rojos"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🍓</span>
                  <span>Frutos Rojos</span>
                </Link>

                <a
                  href="mailto:empresas@tusaguacates.com"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white text-orange-600 font-bold transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>empresas@tusaguacates.com</span>
                </a>

                <a
                  href="tel:+573042582777"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  <span>+57 304 258 2777</span>
                </a>

                <div className="border-t border-white/10 my-2" />

                {user ? (
                  <>
                    <Link
                      href="/cuenta"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      <span>Mi Cuenta</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600/20 text-red-200 transition-colors w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </>
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

                <Link
                  href="/tienda"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-sm"
                >
                  <Home className="w-5 h-5" />
                  <span>Ir a Tienda Retail</span>
                </Link>
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
