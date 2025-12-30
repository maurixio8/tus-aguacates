'use client';

/**
 * Layout para la sección B2B (Business to Business)
 * "Tus Aguacates" - E-commerce Platform
 */

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

interface B2BLayoutProps {
  children: ReactNode;
}

export default function B2BLayout({ children }: B2BLayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen" style={{ backgroundColor: '#FFFEF5' }}>
      {/* Header B2B */}
      <header
        className="text-white shadow-medium"
        style={{
          background: 'linear-gradient(135deg, #2D5016 0%, #6B8E23 100%)',
          boxShadow: '0 4px 20px rgba(45, 80, 22, 0.15)'
        }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tus Aguacates</h1>
              <p className="mt-1" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>Venta a Empresas</p>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a
                href="/empresas"
                className="transition duration-300 hover:scale-105"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
              >
                Inicio
              </a>
              <a
                href="/empresas/catalogo"
                className="transition duration-300 hover:scale-105"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
              >
                Catálogo
              </a>
              <a
                href="/empresas/pedidos"
                className="transition duration-300 hover:scale-105"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
              >
                Mis Pedidos
              </a>
              <a
                href="/empresas/cuenta"
                className="transition duration-300 hover:scale-105"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'}
              >
                Mi Cuenta
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main>{children}</main>

      {/* Footer B2B */}
      <footer
        className="text-white mt-16"
        style={{ backgroundColor: '#2D5016' }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Contacto Empresarial</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Email: empresas@tusaguacates.com</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Tel: +57 304 258 2777</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Horarios</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Lunes a Viernes: 8am - 6pm</p>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Sábados: 8am - 2pm</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Ventas por Mayor</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Precios especiales para pedidos por volumen
              </p>
            </div>
          </div>
          <div
            className="mt-8 pt-6 text-center"
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <p>&copy; {new Date().getFullYear()} Tus Aguacates. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
    </ToastProvider>
  );
}
