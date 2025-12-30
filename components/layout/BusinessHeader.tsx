'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, LogIn, Menu, X, Building2 } from 'lucide-react';
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
      <header className="bg-verde-bosque text-white sticky top-0 z-40 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo + Badge Empresas */}
            <Link href="/empresas" className="flex items-center gap-3" onClick={closeMobileMenu}>
              <img
                src={branding.logo.url}
                alt={branding.logo.alt}
                width={branding.logo.width}
                height={branding.logo.height}
                className="object-contain h-10 md:h-12 w-auto"
              />
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-amber-500 text-verde-bosque-900 font-bold px-3 py-1 rounded-full">
                <Building2 className="w-3 h-3" />
                Empresas
              </span>
            </Link>

            {/* Navegación Desktop - Simple y enfocada */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/empresas" className="hover:text-verde-aguacate-200 transition-colors font-semibold">
                Catálogo
              </Link>
              <a
                href="mailto:empresas@tusaguacates.com"
                className="hover:text-verde-aguacate-200 transition-colors"
              >
                Contacto
              </a>
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

              {user ? (
                <Link
                  href="/cuenta"
                  className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-2"
                  title="Mi Cuenta"
                >
                  <User className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  href="/auth/login"
                  className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-2"
                  title="Iniciar Sesión"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden lg:inline text-sm">Iniciar Sesión</span>
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
              {/* Badge Empresas en móvil */}
              <span className="flex sm:hidden items-center gap-1 text-[10px] bg-amber-500 text-verde-bosque-900 font-bold px-2 py-1 rounded-full">
                <Building2 className="w-2.5 h-2.5" />
                B2B
              </span>

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
                  href="/empresas"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors font-semibold"
                >
                  <Building2 className="w-5 h-5" />
                  <span>Catálogo Empresas</span>
                </Link>

                <a
                  href="mailto:empresas@tusaguacates.com"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span>📧</span>
                  <span>empresas@tusaguacates.com</span>
                </a>

                <a
                  href="tel:+573042582777"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span>📞</span>
                  <span>+57 304 258 2777</span>
                </a>

                <div className="border-t border-white/10 my-2" />

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
