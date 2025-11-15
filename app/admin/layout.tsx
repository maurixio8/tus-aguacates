'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    // Eliminar token de admin
    document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/admin/login');
  };

  const menuItems = [
    {
      href: '/admin',
      icon: '📊',
      label: 'Dashboard',
      active: pathname === '/admin'
    },
    {
      href: '/admin/productos',
      icon: '📦',
      label: 'Productos',
      active: pathname === '/admin/productos'
    },
    {
      href: '/admin/pedidos',
      icon: '🛒',
      label: 'Pedidos',
      active: pathname === '/admin/pedidos'
    },
    {
      href: '/admin/categorias',
      icon: '🏷️',
      label: 'Categorías',
      active: pathname === '/admin/categorias'
    },
    {
      href: '/admin/cupones',
      icon: '🎟️',
      label: 'Cupones',
      active: pathname === '/admin/cupones'
    },
    {
      href: '/admin/clientes',
      icon: '👥',
      label: 'Clientes',
      active: pathname === '/admin/clientes'
    },
    {
      href: '/admin/configuracion',
      icon: '⚙️',
      label: 'Configuración',
      active: pathname === '/admin/configuracion'
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>

        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <span className="text-2xl">🥑</span>
                <h1 className="text-xl font-bold">Tus Aguacates</h1>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
              title={sidebarOpen ? "Contraer sidebar" : "Expandir sidebar"}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menú */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                item.active
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'hover:bg-gray-800 text-gray-300 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Admin User Info */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-700">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Admin</p>
                  <p className="text-xs text-gray-400">admin@tusaguacates.com</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <Link
            href="/"
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition text-gray-300 hover:text-white mb-2"
          >
            <span className="text-xl">🏠</span>
            {sidebarOpen && <span>Ver Tienda</span>}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-600 transition text-red-400 hover:text-white"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Panel Administrativo
                </h2>
                <p className="text-sm text-gray-600">
                  Gestiona tu tienda en línea
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Última actualización</p>
                <p className="text-sm font-medium">{new Date().toLocaleString('es-CO')}</p>
              </div>
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}