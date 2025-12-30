'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, LogIn, LogOut, Menu, X, Home, Building2, Phone } from 'lucide-react';
import { useBusinessCartStore } from '@/lib/business-cart-store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import branding from '@/lib/config/branding';
import { BUSINESS_CATEGORIES } from '@/lib/business-products';

export function BusinessHeader() {
  const { items, toggleCart } = useBusinessCartStore();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

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
        {/* Top bar B2B */}
        <div className="bg-verde-bosque-800 text-xs py-1">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Building2 className="w-3 h-3" />
              Canal Empresarial B2B
            </span>
            <Link href="/tienda" className="hover:underline flex items-center gap-1">
              ← Ir a tienda regular
            </Link>
          </div>
        </div>

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
              <span className="hidden md:inline bg-white/20 px-2 py-1 rounded text-xs font-bold">
                EMPRESAS
              </span>
            </Link>

            {/* Navegación Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              {BUSINESS_CATEGORIES.slice(0, 5).map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/empresas/${cat.slug}`}
                  className="hover:text-verde-aguacate-200 transition-colors text-sm"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/empresas"
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                Ver todo
              </Link>
            </nav>

            {/* Acciones Desktop */}
            <div className="hidden md:flex items-center space-x-4">
              {/* WhatsApp */}
              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20hacer%20un%20pedido%20mayorista"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              >
                <Phone className="w-4 h-4" />
                WhatsApp
              </a>

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
                </Link>
              )}

              {/* Carrito B2B */}
              <button
                onClick={toggleCart}
                className="relative hover:text-verde-aguacate-200 transition-colors flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-sm font-medium">Pedido</span>
                {mounted && itemCount > 0 && (
                  <span className="bg-yellow-500 text-verde-bosque-900 text-xs font-bold rounded-full px-2 py-0.5">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Acciones Móvil */}
            <div className="flex md:hidden items-center space-x-3">
              {/* Carrito B2B */}
              <button
                onClick={toggleCart}
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                {mounted && itemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-yellow-500 text-verde-bosque-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
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

        {/* Menú Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-verde-bosque-800 border-t border-white/10">
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col space-y-1">
                <Link
                  href="/empresas"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <Home className="w-5 h-5" />
                  <span>Inicio Empresas</span>
                </Link>

                {BUSINESS_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/empresas/${cat.slug}`}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <span className="w-5 h-5 flex items-center justify-center">{cat.icon}</span>
                    <span>{cat.name}</span>
                  </Link>
                ))}

                <div className="border-t border-white/10 my-2" />

                <a
                  href="https://wa.me/573042582777?text=Hola,%20quiero%20hacer%20un%20pedido%20mayorista"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  <span>WhatsApp</span>
                </a>

                <Link
                  href="/tienda"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-white/70"
                >
                  <span className="w-5 h-5 flex items-center justify-center">🛒</span>
                  <span>Ir a tienda regular</span>
                </Link>

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
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
