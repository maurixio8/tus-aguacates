'use client';

import Link from 'next/link';
import { Building2, Phone, Mail, ShoppingCart, Menu, X, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import branding from '@/lib/config/branding';
import { useBusinessCartStore } from '@/lib/business-cart-store';

export function B2BHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { items, toggleCart } = useBusinessCartStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);
  const itemCount = mounted ? items.reduce((sum, item) => sum + item.quantity, 0) : 0;

  return (
    <header className="bg-verde-bosque text-white sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo + Badge B2B */}
          <Link href="/empresas" className="flex items-center gap-3" onClick={closeMobileMenu}>
            <img
              src={branding.logo.url}
              alt={branding.logo.alt}
              width={branding.logo.width}
              height={branding.logo.height}
              className="object-contain h-10 md:h-12 w-auto"
            />
            <div className="hidden sm:flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Building2 className="w-4 h-4" />
              <span className="text-sm font-semibold">Canal Empresas</span>
            </div>
          </Link>

          {/* Navegacion Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/empresas/aguacates"
              className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-1"
            >
              <span>🥑</span>
              Aguacates
            </Link>
            <Link
              href="/empresas/frutas-tropicales"
              className="hover:text-verde-aguacate-200 transition-colors"
            >
              Frutas Tropicales
            </Link>
            <Link
              href="/empresas/catalogo"
              className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-1"
            >
              <Package className="w-4 h-4" />
              Catalogo Completo
            </Link>
          </nav>

          {/* Acciones Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <a
              href="tel:+573042582777"
              className="flex items-center gap-2 text-sm hover:text-verde-aguacate-200 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden lg:inline">304 258 2777</span>
            </a>

            <a
              href="mailto:empresas@tusaguacates.com"
              className="flex items-center gap-2 text-sm hover:text-verde-aguacate-200 transition-colors"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden lg:inline">Contacto</span>
            </a>

            <button
              onClick={toggleCart}
              className="relative hover:text-verde-aguacate-200 transition-colors bg-white/10 p-2 rounded-lg"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-naranja-frutal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
          </div>

          {/* Acciones Movil */}
          <div className="flex md:hidden items-center space-x-3">
            {/* Telefono */}
            <a
              href="tel:+573042582777"
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>

            {/* Carrito */}
            <button
              onClick={toggleCart}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-naranja-frutal text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Menu hamburguesa */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Movil Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-verde-bosque-800 border-t border-white/10">
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
                href="/empresas/catalogo"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Package className="w-5 h-5" />
                <span>Catalogo Completo</span>
              </Link>

              <div className="border-t border-white/10 my-2" />

              <a
                href="tel:+573042582777"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-semibold"
              >
                <Phone className="w-5 h-5" />
                <span>Llamar: 304 258 2777</span>
              </a>

              <a
                href="https://wa.me/573042582777?text=Hola,%20quiero%20información%20sobre%20pedidos%20mayoristas"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 transition-colors font-semibold"
              >
                <span className="w-5 h-5 flex items-center justify-center">💬</span>
                <span>WhatsApp Empresas</span>
              </a>

              <a
                href="mailto:empresas@tusaguacates.com"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
              >
                <Mail className="w-5 h-5" />
                <span>empresas@tusaguacates.com</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
