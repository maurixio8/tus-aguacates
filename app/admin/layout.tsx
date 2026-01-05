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
  ChevronDown,
  Store,
  Users,
  Ticket,
  Image as ImageIcon,
  MessageSquare,
  Layers,
  Building2
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // No aplicar layout en la página de login
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    // Verificar autenticación
    const checkAuth = () => {
      const savedAdmin = localStorage.getItem('admin');
      console.log('🔐 [AdminLayout] Verificando auth, savedAdmin:', savedAdmin ? 'existe' : 'no existe');

      if (savedAdmin) {
        try {
          const adminData = JSON.parse(savedAdmin);
          console.log('✅ [AdminLayout] Admin data parsed:', adminData.email);
          setAdmin(adminData);
          setLoading(false);
        } catch (error) {
          console.error('❌ [AdminLayout] Error parsing admin data:', error);
          localStorage.removeItem('admin');
          window.location.href = '/admin/login';
        }
      } else {
        console.log('⚠️ [AdminLayout] No admin en localStorage, redirigiendo a login');
        window.location.href = '/admin/login';
      }
    };

    // Pequeño delay para asegurar que localStorage está listo
    setTimeout(checkAuth, 50);
  }, [isLoginPage]);

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

  // Si es la página de login, renderizar sin layout
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Productos', href: '/admin/productos', icon: Package },
    { name: 'Categorías', href: '/admin/categorias', icon: Layers },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Cupones', href: '/admin/cupones', icon: Ticket },
    { name: 'Slides', href: '/admin/promociones', icon: ImageIcon },
    { name: 'Banner Mensajes', href: '/admin/banner-mensajes', icon: MessageSquare },
    { name: 'Crear Pedido', href: '/admin/crear-pedido', icon: PlusCircle },
    { name: 'Reportes', href: '/admin/reportes', icon: BarChart3 },
  ];

  const b2bNavigation = [
    { name: 'Dashboard B2B', href: '/admin/empresas', icon: LayoutDashboard },
    { name: 'Clientes B2B', href: '/admin/empresas/clientes', icon: Users },
    { name: 'Pedidos B2B', href: '/admin/empresas/pedidos', icon: ShoppingCart },
    { name: 'Productos B2B', href: '/admin/empresas/productos', icon: Package },
    { name: 'Reportes B2B', href: '/admin/empresas/reportes', icon: BarChart3 },
    { name: 'Ver Portal', href: '/empresas', icon: Building2 },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin Panel</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-2 text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Separador B2B */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-3 mb-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">Empresas B2B</p>
              {b2bNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-gray-900">Tus Aguacates</span>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active
                    ? 'bg-green-100 text-green-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Separador B2B */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <p className="px-3 mb-2 text-xs font-semibold text-amber-600 uppercase tracking-wider">Empresas B2B</p>
              {b2bNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${active
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-semibold">
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
        <div className="sticky top-0 z-40 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">Admin</span>
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
