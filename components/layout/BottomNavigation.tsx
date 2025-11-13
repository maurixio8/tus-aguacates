'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/cart-store';
import {
  Home,
  Search,
  Tag,
  ShoppingCart,
  User
} from 'lucide-react';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { getTotal, getItemCount } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();

  const menuItems = [
    {
      label: 'Inicio',
      icon: Home,
      path: '/',
      active: pathname === '/'
    },
    {
      label: 'Productos',
      icon: Search,
      path: '/productos',
      active: pathname === '/productos' || pathname.startsWith('/producto/')
    },
    {
      label: 'Ofertas',
      icon: Tag,
      path: '/ofertas',
      active: pathname === '/ofertas'
    },
    {
      label: 'Carrito',
      icon: ShoppingCart,
      path: '/cart',
      active: pathname === '/cart',
      badge: itemCount > 0 ? itemCount.toString() : undefined
    },
    {
      label: 'Cuenta',
      icon: User,
      path: '/cuenta',
      active: pathname === '/cuenta'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 shadow-[0_-4px_12px_rgba(0,0,0,0.15)] z-50">
        <div className="flex justify-around items-center py-2 px-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all min-w-[60px] ${
                  isActive
                    ? 'text-green-700 bg-green-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? 'text-green-700' : 'text-gray-700'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-md">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[11px] mt-1 leading-none ${
                  isActive ? 'text-green-700 font-bold' : 'text-gray-700 font-medium'
                }`}>
                  {item.label}
                </span>
                {item.path === '/cart' && total > 0 && (
                  <span className="text-[10px] text-green-700 font-bold leading-none mt-0.5">
                    {formatCurrency(total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Safe area padding for iOS devices */}
        <div className="h-4 bg-white border-t border-gray-300 bg-gradient-to-t from-gray-50 to-white"></div>
      </div>

      {/* Spacer to prevent content from being hidden behind bottom nav on mobile */}
      <div className="md:hidden h-20"></div>
    </>
  );
}