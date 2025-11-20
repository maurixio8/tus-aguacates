'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Heart, LogIn, Shield } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import branding from '@/lib/config/branding';
import { SearchModal } from '../search/SearchModal';

export function Header() {
  const { getItemCount, toggleCart } = useCartStore();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const itemCount = getItemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="hidden md:block bg-verde-bosque text-white sticky top-0 z-40 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            {/*
              PREPARADO PARA NUEVO LOGO
              Reemplazar esta imagen con el nuevo logo del usuario
            */}
            <img
              src={branding.logo.url}
              alt={branding.logo.alt}
              width={branding.logo.width}
              height={branding.logo.height}
              className="object-contain h-12 w-auto"
            />

            {/*
              TEXTO "TUS AGUACATES" ELIMINADO
              Si necesitas agregar texto de nuevo, descomenta esto:
              <span className="font-display font-bold text-2xl hidden lg:inline ml-3">
                {branding.brand.name}
              </span>
            */}
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/tienda" className="hover:text-verde-aguacate-200 transition-colors">
              Productos
            </Link>
            <Link href="/tienda/aguacates" className="hover:text-verde-aguacate-200 transition-colors">
              Aguacates
            </Link>
            <Link href="/tienda/frutas" className="hover:text-verde-aguacate-200 transition-colors">
              Frutas
            </Link>
          </nav>

          {/* Acciones */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="hover:text-verde-aguacate-200 transition-colors"
              aria-label="Buscar productos"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link href="/perfil/favoritos" className="hover:text-verde-aguacate-200 transition-colors">
              <Heart className="w-5 h-5" />
            </Link>

            {user ? (
              <Link
                href="/cuenta"
                className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-2"
                title="Mi Cuenta"
              >
                <User className="w-5 h-5" />
                <span className="hidden lg:inline text-sm">Mi Cuenta</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="hover:text-verde-aguacate-200 transition-colors flex items-center gap-2"
                title="Iniciar Sesión"
              >
                <LogIn className="w-5 h-5" />
                <span className="hidden lg:inline text-sm">Ingresar</span>
              </Link>
            )}

            <Link
              href="https://admin-dashboard-4xmuae7an-mauricio-s-projects-2bf4b7a2.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-amarillo-400 transition-colors flex items-center gap-2 bg-verde-aguacate-600 hover:bg-verde-aguacate-700 px-3 py-2 rounded-lg"
              title="Panel de Administrador"
            >
              <Shield className="w-5 h-5" />
              <span className="hidden lg:inline text-sm font-medium">Admin</span>
            </Link>

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
        </div>
      </div>

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </header>
  );
}