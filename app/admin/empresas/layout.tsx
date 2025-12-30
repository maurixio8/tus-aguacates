'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  BarChart3,
  LogOut,
  Menu,
  X,
  Building2,
  ArrowLeft,
  Users,
  Settings
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function EmpresasAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = () => {
      const savedAdmin = localStorage.getItem('admin');

      if (savedAdmin) {
        try {
          const adminData = JSON.parse(savedAdmin);
          setAdmin(adminData);
          setLoading(false);
        } catch (error) {
          console.error('Error parsing admin data:', error);
          localStorage.removeItem('admin');
          window.location.href = '/admin/login';
        }
      } else {
        window.location.href = '/admin/login';
      }
    };

    setTimeout(checkAuth, 50);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/admin-auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Error en logout:', error);
    }
    localStorage.removeItem('admin');
    setAdmin(null);
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard B2B', href: '/admin/empresas', icon: LayoutDashboard },
    { name: 'Pedidos B2B', href: '/admin/empresas/pedidos', icon: ShoppingCart },
    { name: 'Productos B2B', href: '/admin/empresas/productos', icon: Package },
    { name: 'Clientes Empresariales', href: '/admin/empresas/clientes', icon: Users },
    { name: 'Crear Pedido B2B', href: '/admin/empresas/crear-pedido', icon: PlusCircle },
    { name: 'Reportes B2B', href: '/admin/empresas/reportes', icon: BarChart3 },
  ];

  const isActive = (href: string) => {
    if (href === '/admin/empresas') {
      return pathname === '/admin/empresas';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-blue-600">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold text-white">Admin B2B</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/80 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {/* Volver al Admin Principal */}
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 mb-4 border-b border-gray-200 pb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver al Admin
            </Link>

            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <span className="font-bold text-white">Tus Aguacates</span>
                <p className="text-xs text-blue-100">Portal Empresas B2B</p>
              </div>
            </div>
          </div>

          {/* Volver al Admin Principal */}
          <div className="px-4 py-3 border-b border-gray-200">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Admin Principal
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* B2B Badge */}
          <div className="p-4 border-t border-gray-200">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Portal B2B</span>
              </div>
              <p className="text-xs text-blue-700">
                Gestiona pedidos y productos para clientes empresariales con precios mayoristas.
              </p>
            </div>
          </div>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold">
                  {admin.name?.charAt(0) || admin.email?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{admin.name || 'Admin'}</p>
                <p className="text-xs text-gray-500 truncate">{admin.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-700 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-white/80 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-bold text-white">Admin B2B</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
