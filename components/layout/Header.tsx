'use client';

import Link from 'next/link';
import { ShoppingCart, User, Search, Menu, Heart, LogIn } from 'lucide-react';
import { useCartStore } from '@/lib/cart-store';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

export function Header() {
  const { getItemCount, toggleCart } = useCartStore();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const itemCount = getItemCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="bg-verde-bosque text-white sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/images/logo-animated.gif" 
              alt="Tus Aguacates" 
              className="w-10 h-10 md:w-12 md:h-12 object-contain"
            />
            <span className="font-display font-bold text-xl md:text-2xl hidden sm:inline">
              Tus Aguacates
            </span>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/productos" className="hover:text-verde-aguacate-200 transition-colors">
              Productos
            </Link>
            <Link href="/productos?categoria=aguacates" className="hover:text-verde-aguacate-200 transition-colors">
              Aguacates
            </Link>
            <Link href="/productos?categoria=frutas-tropicales" className="hover:text-verde-aguacate-200 transition-colors">
              Frutas
            </Link>
          </nav>

          {/* Acciones */}
          <div className="flex items-center space-x-4">
            <button className="hover:text-verde-aguacate-200 transition-colors hidden md:block">
              <Search className="w-5 h-5" />
            </button>
            
            <Link href="/perfil/favoritos" className="hover:text-verde-aguacate-200 transition-colors hidden md:block">
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

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden hover:text-verde-aguacate-200 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menú Mobile */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 border-t border-verde-bosque-400">
            <div className="flex flex-col space-y-3">
              <Link href="/productos" className="hover:text-verde-aguacate-200 transition-colors">
                Todos los Productos
              </Link>
              <Link href="/productos?categoria=aguacates" className="hover:text-verde-aguacate-200 transition-colors">
                Aguacates
              </Link>
              <Link href="/productos?categoria=frutas-tropicales" className="hover:text-verde-aguacate-200 transition-colors">
                Frutas Tropicales
              </Link>
              <Link href="/productos?categoria=verduras" className="hover:text-verde-aguacate-200 transition-colors">
                Verduras
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
